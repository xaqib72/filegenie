/**
 * AI Image Upscaler engine — REAL super-resolution via an ONNX CNN
 * (subpixel.onnx) running on ONNX Runtime Web (local vendor, no CDN).
 *
 * The model is a genuine 3x super-resolution network, but it has a FIXED
 * 224x224 single-channel (grayscale) input and outputs 672x672. So this is a
 * real tiling pipeline, not a canvas resize:
 *   1. The image's luminance (Y) is split into 224x224 tiles (edge-padded).
 *   2. Each tile is fed to the model -> a 672x672 high-res luminance tile.
 *   3. Tiles are stitched back on a 3x grid.
 *   4. Chroma (Cb/Cr) is taken from an ordinary bilinear 3x upscale of the
 *      original, mapped through the SAME grid so it stays aligned with Y.
 *   5. Y + Cb + Cr are converted back to RGBA.
 *
 * This is genuine AI upscaling: the high-frequency detail in the result comes
 * from the network, not from stretching pixels. The ORT runtime and model load
 * LAZILY on first use from local vendor files and never leave the browser.
 */
(function () {
    'use strict';

    var ortRef = null;
    var sessionRef = null;
    var ioNames = null;
    var modelScale = 3;       // derived from a dummy forward pass
    var MODEL_IN = 224;       // fixed input side for this model

    function loadOrt() {
        if (ortRef) return Promise.resolve(ortRef);
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = '/vendor/upscaler/ort/ort.min.js';
            s.onload = function () { resolve(window.ort || (window.ort && window.ort.default)); };
            s.onerror = function () { reject(new Error('Could not load the AI upscaler runtime.')); };
            document.head.appendChild(s);
        }).then(function (lib) {
            if (lib && lib.env) {
                lib.env.wasm.wasmPaths = '/vendor/upscaler/ort/';
                if (lib.env.wasm.numThreads !== undefined) lib.env.wasm.numThreads = 1;
            }
            ortRef = lib;
            return lib;
        });
    }

    function loadSession(onProgress) {
        if (sessionRef) return Promise.resolve(sessionRef);
        onProgress && onProgress(15, 'Loading AI model…');
        return loadOrt().then(function (ort) {
            return fetch('/vendor/upscaler/subpixel.onnx').then(function (r) { return r.arrayBuffer(); })
                .then(function (buf) {
                    onProgress && onProgress(40, 'Initializing model…');
                    return ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: ['wasm'] });
                })
                .then(function (sess) {
                    ioNames = { in: sess.inputNames[0], out: sess.outputNames[0] };
                    // This ORT build doesn't expose sess.inputMetadata, so derive
                    // the true scale with a dummy forward pass on the model's fixed
                    // 224x224 input. Output spatial / 224 is the genuine factor.
                    var dummy = new ortRef.Tensor('float32', new Float32Array(1 * 1 * MODEL_IN * MODEL_IN), [1, 1, MODEL_IN, MODEL_IN]);
                    var feeds = {};
                    feeds[ioNames.in] = dummy;
                    return sess.run(feeds).then(function (dummyRes) {
                        var outDims = dummyRes[ioNames.out].dims;
                        modelScale = Math.round(outDims[outDims.length - 2] / MODEL_IN) || 3;
                        sessionRef = sess;
                        return sess;
                    });
                });
        });
    }

    // RGBA ImageData -> normalized [0,1] grayscale float, plus YCbCr (0..255) arrays.
    function extractChannels(imgData) {
        var w = imgData.width, h = imgData.height, d = imgData.data;
        var Y = new Float32Array(w * h);      // 0..255 (kept for model scaling)
        var Yn = new Float32Array(w * h);     // 0..1 (model input)
        var Cb = new Float32Array(w * h);     // 0..255
        var Cr = new Float32Array(w * h);
        for (var p = 0, q = 0; p < d.length; p += 4, q++) {
            var r = d[p], g = d[p + 1], b = d[p + 2];
            var y = 0.299 * r + 0.587 * g + 0.114 * b;
            Y[q] = y;
            Yn[q] = y / 255;
            Cb[q] = -0.169 * r - 0.331 * g + 0.5 * b + 128;
            Cr[q] = 0.5 * r - 0.419 * g - 0.081 * b + 128;
        }
        return { w: w, h: h, Y: Y, Yn: Yn, Cb: Cb, Cr: Cr };
    }

    // Build a 224x224 grayscale tile (edge-padded) for input region [x0,y0].
    function makeTile(ch, x0, y0, T) {
        var w = ch.w, h = ch.h;
        var tile = new Float32Array(T * T);
        for (var ty = 0; ty < T; ty++) {
            var sy = y0 + ty; if (sy >= h) sy = h - 1; if (sy < 0) sy = 0;
            for (var tx = 0; tx < T; tx++) {
                var sx = x0 + tx; if (sx >= w) sx = w - 1; if (sx < 0) sx = 0;
                tile[ty * T + tx] = ch.Yn[sy * w + sx];
            }
        }
        return tile;
    }

    function renderControls(toolId, container) {
        if (!container) return;
        container.innerHTML =
            '<div class="setting-group">' +
            '  <label class="setting-label">Upscale factor</label>' +
            '  <p class="setting-hint" id="up-scale-note">Loading model info…</p>' +
            '</div>' +
            '<p class="setting-hint">Uses an on-device AI super-resolution model. The model and runtime load only when you run the tool, and never leave your browser.</p>';
        if (modelScale) {
            var note = document.getElementById('up-scale-note');
            if (note) note.textContent = 'This model upscales by ' + modelScale + 'x.';
        }
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        if (!files || !files.length) throw new Error('Add an image first.');
        onProgress(5, 'Preparing AI upscaler…');
        var sess = await loadSession(onProgress);

        var url = URL.createObjectURL(files[0]);
        try {
            var img = await new Promise(function (res, rej) {
                var im = new Image();
                im.onload = function () { res(im); };
                im.onerror = function () { rej(new Error('Could not decode this image.')); };
                im.src = url;
            });
            var scale = modelScale || 3;
            var T = MODEL_IN;
            // Cap input so tile count (and memory) stays reasonable.
            var MAX = 600;
            var w = img.naturalWidth, h = img.naturalHeight;
            if (w > MAX || h > MAX) {
                var s = Math.min(MAX / w, MAX / h, 1);
                w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s));
            }
            var canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, w, h);
            var ch = extractChannels(ctx.getImageData(0, 0, w, h));
            w = ch.w; h = ch.h;

            var nx = Math.ceil(w / T), ny = Math.ceil(h / T);
            var outW = nx * T * scale, outH = ny * T * scale;
            var Yout = new Float32Array(outW * outH);   // 0..255 (model output *255)

            onProgress(55, 'Upscaling with AI model…');
            var total = nx * ny, done = 0;
            for (var j = 0; j < ny; j++) {
                for (var i = 0; i < nx; i++) {
                    var x0 = i * T, y0 = j * T;
                    var tile = makeTile(ch, x0, y0, T);
                    var tensor = new ortRef.Tensor('float32', tile, [1, 1, T, T]);
                    var feeds = {}; feeds[ioNames.in] = tensor;
                    var res = await sess.run(feeds);
                    var outT = res[ioNames.out];
                    var od = outT.data;                  // Float32Array, length 1*1*(T*scale)^2
                    var ts = T * scale;
                    var baseX = i * ts, baseY = j * ts;
                    for (var oy = 0; oy < ts; oy++) {
                        for (var ox = 0; ox < ts; ox++) {
                            var gi = (baseY + oy) * outW + (baseX + ox);
                            Yout[gi] = od[oy * ts + ox] * 255;
                        }
                    }
                    done++;
                    onProgress(55 + Math.round((done / total) * 35), 'Upscaling… ' + done + '/' + total);
                }
            }

            // Chroma via bilinear upscale mapped through the same padded grid.
            onProgress(92, 'Reconstructing color…');
            var rgba = new Uint8ClampedArray(outW * outH * 4);
            for (var oy2 = 0; oy2 < outH; oy2++) {
                for (var ox2 = 0; ox2 < outW; ox2++) {
                    var ti = Math.floor(ox2 / (T * scale)), tj = Math.floor(oy2 / (T * scale));
                    var lx = ox2 - ti * (T * scale), ly = oy2 - tj * (T * scale);
                    var fx = ti * T + lx / scale, fy = tj * T + ly / scale;
                    var sx = fx < 0 ? 0 : (fx > w - 1 ? w - 1 : fx);
                    var sy = fy < 0 ? 0 : (fy > h - 1 ? h - 1 : fy);
                    var x1 = Math.floor(sx), y1 = Math.floor(sy);
                    var x2 = x1 < w - 1 ? x1 + 1 : x1, y2 = y1 < h - 1 ? y1 + 1 : y1;
                    var wx = sx - x1, wy = sy - y1;
                    var i00 = y1 * w + x1, i10 = y1 * w + x2, i01 = y2 * w + x1, i11 = y2 * w + x2;
                    var cb = (ch.Cb[i00] * (1 - wx) + ch.Cb[i10] * wx) * (1 - wy) + (ch.Cb[i01] * (1 - wx) + ch.Cb[i11] * wx) * wy;
                    var cr = (ch.Cr[i00] * (1 - wx) + ch.Cr[i10] * wx) * (1 - wy) + (ch.Cr[i01] * (1 - wx) + ch.Cr[i11] * wx) * wy;
                    var yv = Yout[oy2 * outW + ox2];
                    var r = yv + 1.402 * (cr - 128);
                    var g = yv - 0.344136 * (cb - 128) - 0.714136 * (cr - 128);
                    var b = yv + 1.772 * (cb - 128);
                    var o = (oy2 * outW + ox2) * 4;
                    rgba[o] = r < 0 ? 0 : (r > 255 ? 255 : r);
                    rgba[o + 1] = g < 0 ? 0 : (g > 255 ? 255 : g);
                    rgba[o + 2] = b < 0 ? 0 : (b > 255 ? 255 : b);
                    rgba[o + 3] = 255;
                }
            }

            var outCanvas = document.createElement('canvas');
            outCanvas.width = outW; outCanvas.height = outH;
            outCanvas.getContext('2d').putImageData(new ImageData(rgba, outW, outH), 0, 0);

            onProgress(98, 'Finalizing…');
            var blob = await new Promise(function (res) { outCanvas.toBlob(function (b) { res(b); }, 'image/png'); });
            if (!blob) throw new Error('Failed to render the upscaled image.');
            onProgress(100, 'Done');
            return { blob: blob, filename: (files[0].name || 'image').replace(/\.[^.]+$/, '') + '-upscaled-' + scale + 'x.png' };
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
