/**
 * Utility engine — real, client-side crypto & digital utilities. No placeholders.
 * Tools: password-generator, qr-code-generator, color-picker, favicon-generator,
 *        base64-tool, file-hash-checker.
 *
 * Each tool performs a genuine operation: Web Crypto password/hash, canvas QR
 * render, color-space conversion to a PNG swatch, multi-size ICO favicon build,
 * and real Base64 encode/decode.
 */
(function () {
    'use strict';

    function get(id) { return document.getElementById(id); }

    function renderControls(toolId, container) {
        if (!container) return;
        var h = '';
        switch (toolId) {
            case 'password-generator':
                h =
                    '<div class="setting-group" style="margin-bottom:1rem;">' +
                    '<label class="setting-label">Password Length (<span id="pass-len-val">16</span>)</label>' +
                    '<input type="range" class="range-slider" id="pass-len-slider" min="8" max="64" value="16" ' +
                    'oninput="document.getElementById(\'pass-len-val\').innerText=this.value"></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="pass-out">Generated password</label>' +
                    '<textarea class="diff-box" id="pass-out" readonly></textarea></div>';
                break;
            case 'qr-code-generator':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="qr-input-text">URL or Text</label>' +
                    '<input type="text" class="setting-input" id="qr-input-text" placeholder="https://filegenie.tech" value="https://filegenie.tech"></div>' +
                    '<div class="setting-row">' +
                    '<div class="setting-group">' +
                    '<label class="setting-label">Size (<span id="qr-size-val">512</span>px)</label>' +
                    '<input type="range" class="range-slider" id="qr-size" min="128" max="2048" step="32" value="512" ' +
                    'oninput="document.getElementById(\'qr-size-val\').innerText=this.value">' +
                    '</div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="qr-ecc">Error correction</label>' +
                    '<select class="setting-select" id="qr-ecc">' +
                    '<option value="L">Low (L)</option><option value="M" selected>Medium (M)</option>' +
                    '<option value="Q">Quartile (Q)</option><option value="H">High (H)</option>' +
                    '</select></div></div>' +
                    '<div class="setting-row">' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="qr-fg">Foreground</label>' +
                    '<input type="color" id="qr-fg" value="#000000" style="width:100%; height:42px; border:none; cursor:pointer; padding:0; background:none;"></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="qr-bg">Background</label>' +
                    '<input type="color" id="qr-bg" value="#ffffff" style="width:100%; height:42px; border:none; cursor:pointer; padding:0; background:none;"></div>' +
                    '<label class="setting-check qr-transparent"><input type="checkbox" id="qr-transparent"> Transparent background</label>' +
                    '</div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="qr-margin">Margin (<span id="qr-margin-val">4</span> modules)</label>' +
                    '<input type="range" class="range-slider" id="qr-margin" min="0" max="16" value="4" ' +
                    'oninput="document.getElementById(\'qr-margin-val\').innerText=this.value"></div>' +
                    '<div class="qr-actions">' +
                    '<button type="button" class="btn btn-ghost" id="qr-copy-content">Copy content</button>' +
                    '</div>' +
                    '<div class="qr-preview" id="qr-preview" aria-hidden="true"></div>';
                break;
            case 'color-picker':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="color-picker-input">Select Color</label>' +
                    '<input type="color" id="color-picker-input" value="#4f46e5" style="width:100%; height:45px; border:none; cursor:pointer;"></div>' +
                    '<div class="color-formats" id="color-formats"></div>';
                break;
            case 'favicon-generator':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="fav-shapes">Rounded corners</label>' +
                    '<select class="setting-select" id="fav-shapes">' +
                    '<option value="0">Square</option><option value="1" selected>Soft (rounded)</option>' +
                    '</select></div>' +
                    '<p class="setting-hint">Upload a square image (PNG/JPG). We build a real multi-size .ico (16, 32, 48 px) from it.</p>';
                break;
            case 'base64-tool':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="b64-mode">Mode</label>' +
                    '<select class="setting-select" id="b64-mode">' +
                    '<option value="encode">Encode a file to Base64</option>' +
                     '<option value="decode">Decode Base64 text to a file</option>' +
                     '</select></div>' +
                     '<div class="setting-group" id="b64-encode-wrap">' +
                     '<button type="button" class="btn btn-ghost" id="b64-pick-file">Choose a file to encode</button>' +
                     '<p class="setting-hint">The selected file stays in this browser tab.</p></div>' +
                     '<div id="b64-decode-wrap" hidden>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="b64-input">Base64 text</label>' +
                    '<textarea class="diff-box" id="b64-input" placeholder="Paste Base64 here…"></textarea></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="b64-name">Output filename</label>' +
                    '<input type="text" class="setting-input" id="b64-name" value="decoded.bin"></div>' +
                    '</div>' +
                    '<div class="setting-group" id="b64-out-wrap">' +
                    '<label class="setting-label" for="b64-out">Result</label>' +
                    '<textarea class="diff-box" id="b64-out" readonly></textarea></div>';
                break;
            case 'file-hash-checker':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="hash-algo">Algorithm</label>' +
                    '<select class="setting-select" id="hash-algo">' +
                    '<option value="SHA-256">SHA-256</option>' +
                    '<option value="SHA-1">SHA-1</option>' +
                    '<option value="SHA-512">SHA-512</option>' +
                    '</select></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="hash-compare">Compare with (optional)</label>' +
                    '<input type="text" class="setting-input" id="hash-compare" placeholder="paste expected hash"></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="hash-out">Result</label>' +
                    '<textarea class="diff-box" id="hash-out" readonly></textarea></div>';
                break;
            default:
                h = '<p class="setting-hint">Utility engine ready.</p>';
        }
        container.innerHTML = h;

        if (toolId === 'base64-tool') {
            var modeSel = get('b64-mode');
            if (modeSel) {
                modeSel.addEventListener('change', function () {
                    var decode = modeSel.value === 'decode';
                    if (get('b64-decode-wrap')) get('b64-decode-wrap').hidden = !decode;
                    if (get('b64-out-wrap')) get('b64-out-wrap').hidden = decode;
                    if (get('b64-encode-wrap')) get('b64-encode-wrap').hidden = decode;
                });
            }
            var pickFile = get('b64-pick-file');
            if (pickFile) pickFile.addEventListener('click', function () {
                var input = document.getElementById('file-input');
                if (input) input.click();
            });
        }
        if (toolId === 'color-picker') {
            var cp = get('color-picker-input');
            if (cp) cp.addEventListener('input', function () { renderColorFormats(cp.value); });
            renderColorFormats(cp ? cp.value : '#4f46e5');
        }
        if (toolId === 'qr-code-generator') {
            var qi = get('qr-input-text');
            if (qi) qi.addEventListener('input', function () { renderQr(qi.value || ''); });
            var copyContent = get('qr-copy-content');
            if (copyContent) {
                copyContent.addEventListener('click', function () {
                    var txt = (get('qr-input-text') && get('qr-input-text').value) || '';
                    if (!txt) return;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(txt).then(function () {
                            copyContent.textContent = 'Copied!';
                            setTimeout(function () { copyContent.textContent = 'Copy content'; }, 1500);
                        });
                    }
                });
            }
            // Re-render preview when style options change.
            ['qr-size', 'qr-ecc', 'qr-fg', 'qr-bg', 'qr-transparent', 'qr-margin'].forEach(function (id) {
                var el = get(id);
                if (el) el.addEventListener('input', function () { renderQr((get('qr-input-text') || {}).value || ''); });
            });
        }
    }
    // ---------- helpers ----------
    function textBlob(text, name) {
        return { blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), filename: name };
    }
    function setOut(id, val) {
        var el = get(id);
        if (el) { try { el.value = val; } catch (e) { el.textContent = val; } }
    }

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
        var n = parseInt(hex, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                default: h = (r - g) / d + 4;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }
    function renderColorFormats(hex) {
        var rgb = hexToRgb(hex);
        var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        var box = get('color-formats');
        if (box) {
            box.innerHTML =
                fmtLine('HEX', hex.toUpperCase()) +
                fmtLine('RGB', 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')') +
                fmtLine('HSL', 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)');
        }
    }
    function fmtLine(label, value) {
        return '<div class="color-format-row"><span class="cf-label">' + label + '</span><code class="cf-value">' + value + '</code></div>';
    }

    // Render a real, pixel-accurate QR to a canvas and return it. Used both for
    // the live preview and for the downloadable PNG so what you see is what you
    // get. window.QRCode (node-qrcode build) .create() returns the module matrix;
    // we paint it ourselves with the requested colors/margin/transparency.
    function qrToCanvas(text, opts, canvas) {
        if (!window.QRCode || !window.QRCode.create) {
            throw new Error('QR library not ready — try again in a moment.');
        }
        var ecc = (opts.ecc || 'M').toUpperCase();
        var qr = window.QRCode.create(text, { errorCorrectionLevel: ecc });
        var count = qr.modules.size;
        var data = qr.modules.data;
        var margin = Math.max(0, parseInt(opts.margin, 10) || 0);
        var total = count + margin * 2;
        var requested = parseInt(opts.size, 10) || 512;
        // Module size in device pixels, snapped up so every module is crisp.
        var px = Math.max(1, Math.floor(requested / total));
        var dim = px * total;

        canvas.width = dim;
        canvas.height = dim;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, dim, dim);
        if (!opts.transparent) {
            ctx.fillStyle = opts.bg;
            ctx.fillRect(0, 0, dim, dim);
        }
        ctx.fillStyle = opts.fg;
        for (var r = 0; r < count; r++) {
            for (var c = 0; c < count; c++) {
                if (data[r * count + c]) {
                    ctx.fillRect((c + margin) * px, (r + margin) * px, px, px);
                }
            }
        }
        return canvas;
    }

    function renderQr(text) {
        var box = get('qr-preview');
        if (!box) return;
        if (!text) { box.innerHTML = ''; return; }
        if (!window.QRCode) { box.textContent = 'QR ready — click Generate.'; return; }
        try {
            var canvas = box.querySelector('canvas') || document.createElement('canvas');
            if (!canvas.parentNode) box.innerHTML = '';
            var opts = {
                size: (get('qr-size') && get('qr-size').value) || 512,
                ecc: (get('qr-ecc') && get('qr-ecc').value) || 'M',
                fg: (get('qr-fg') && get('qr-fg').value) || '#000000',
                bg: (get('qr-bg') && get('qr-bg').value) || '#ffffff',
                margin: (get('qr-margin') && get('qr-margin').value) || 4,
                transparent: get('qr-transparent') ? get('qr-transparent').checked : false,
            };
            qrToCanvas(text, opts, canvas);
            canvas.style.width = '220px';
            canvas.style.height = 'auto';
            canvas.style.borderRadius = '8px';
            canvas.style.background = opts.transparent ? 'transparent' : opts.bg;
            box.innerHTML = '';
            box.appendChild(canvas);
            box.style.display = 'flex';
            box.style.justifyContent = 'center';
        } catch (e) {
            box.textContent = 'QR ready — click Generate.';
        }
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise(function (resolve) {
            canvas.toBlob(function (b) { resolve(b); }, type, quality);
        });
    }

    function loadImageSrc(src) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = function () { reject(new Error('Could not decode this image.')); };
            img.src = src;
        });
    }

    // Build a real ICO (BMP-with-AND-mask) containing the given sizes.
    // Browser-safe: uses DataView/Uint8Array, never Node's Buffer.
    function buildIco(dibBuffers, sizes) {
        var dirCount = dibBuffers.length;
        var header = 6 + dirCount * 16;
        var total = header;
        for (var i = 0; i < dirCount; i++) total += dibBuffers[i].length;
        var out = new Uint8Array(total);
        var dv = new DataView(out.buffer);
        dv.setUint16(2, 1, true);            // type = icon
        dv.setUint16(4, dirCount, true);
        var offset = header;
        var pos = header;
        for (var j = 0; j < dirCount; j++) {
            var dib = dibBuffers[j];
            var px = sizes[j];
            out[6 + j * 16] = px;            // width (0 = 256)
            out[7 + j * 16] = px;            // height
            dv.setUint16(10 + j * 16, 1, true);    // planes
            dv.setUint16(12 + j * 16, 32, true);   // bpp
            dv.setUint32(14 + j * 16, dib.length, true);
            dv.setUint32(18 + j * 16, offset, true);
            out.set(dib, pos);
            pos += dib.length;
            offset += dib.length;
        }
        return out;
    }

    function dibFromCanvas(canvas) {
        // Returns a 32bpp BGRA DIB with a 1bpp AND mask (all opaque).
        var w = canvas.width, h = canvas.height;
        var headSize = 40;
        var xorStride = w * 4;                 // 32bpp rows already 4-byte aligned
        var xorSize = xorStride * h;
        var andStride = Math.ceil(w / 32) * 4;
        var andSize = andStride * h;
        var dibHeader = headSize + xorSize + andSize;
        var dib = new Uint8Array(dibHeader);
        var dv = new DataView(dib.buffer);
        dv.setUint32(0, 40, true);
        dv.setInt32(4, w, true);
        dv.setInt32(8, h * 2, true);           // height includes XOR + AND
        dv.setUint16(12, 1, true);             // planes
        dv.setUint16(14, 32, true);            // bpp
        dv.setUint32(20, xorSize + andSize, true);
        var ctx = canvas.getContext('2d');
        var data = ctx.getImageData(0, 0, w, h).data;
        var pos = headSize;
        for (var y = h - 1; y >= 0; y--) {
            for (var x = 0; x < w; x++) {
                var idx = (y * w + x) * 4;
                dib[pos] = data[idx + 2];       // B
                dib[pos + 1] = data[idx + 1];   // G
                dib[pos + 2] = data[idx];       // R
                dib[pos + 3] = data[idx + 3];   // A
                pos += 4;
            }
        }
        // AND mask already zero-filled = fully opaque.
        return dib;
    }

    function uint8ToBlob(u8, type) {
        return new Blob([u8], { type: type || 'application/octet-stream' });
    }
    // ---------- process ----------
    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        switch (toolId) {
            case 'password-generator': {
                var len = parseInt((get('pass-len-slider') && get('pass-len-slider').value) || '16', 10);
                if (isNaN(len) || len < 1) len = 16;
                var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
                var array = new Uint8Array(len);
                crypto.getRandomValues(array);
                var password = '';
                for (var i = 0; i < len; i++) password += charset[array[i] % charset.length];
                setOut('pass-out', password);
                onProgress(100, 'Generated');
                return textBlob(password, 'filegenie-password.txt');
            }

            case 'qr-code-generator': {
                onProgress(40);
                if (!window.QRCode) throw new Error('QR library still loading — try again in a moment.');
                var text = (get('qr-input-text') && get('qr-input-text').value) || '';
                if (!text) throw new Error('Enter some text or a URL first.');
                var opts = {
                    size: (get('qr-size') && get('qr-size').value) || 512,
                    ecc: (get('qr-ecc') && get('qr-ecc').value) || 'M',
                    fg: (get('qr-fg') && get('qr-fg').value) || '#000000',
                    bg: (get('qr-bg') && get('qr-bg').value) || '#ffffff',
                    margin: (get('qr-margin') && get('qr-margin').value) || 4,
                    transparent: get('qr-transparent') ? get('qr-transparent').checked : false,
                };
                onProgress(80);
                // Genuine high-resolution PNG of the QR matrix.
                var canvas = document.createElement('canvas');
                qrToCanvas(text, opts, canvas);
                var blob = await canvasToBlob(canvas, 'image/png');
                onProgress(100, 'Done');
                return { blob: blob, filename: 'filegenie-qr-code.png' };
            }

            case 'color-picker': {
                var hex = (get('color-picker-input') && get('color-picker-input').value) || '#4f46e5';
                var rgb = hexToRgb(hex);
                // Render an actual swatch PNG so the "download" is a real image.
                var c = document.createElement('canvas'); c.width = 256; c.height = 256;
                var g = c.getContext('2d');
                g.fillStyle = hex; g.fillRect(0, 0, 256, 256);
                var blob = await canvasToBlob(c, 'image/png');
                onProgress(100, 'Done');
                return { blob: blob, filename: 'filegenie-color.png' };
            }

            case 'favicon-generator': {
                if (!files || !files.length) throw new Error('Upload a square image first.');
                var rounded = get('fav-shapes') && get('fav-shapes').value === '1';
                var url = URL.createObjectURL(files[0]);
                var img = await loadImageSrc(url);
                URL.revokeObjectURL(url);
                var sizes = [16, 32, 48];
                var dibs = sizes.map(function (sz) {
                    var c = document.createElement('canvas'); c.width = sz; c.height = sz;
                    var g2 = c.getContext('2d');
                    if (rounded) {
                        g2.beginPath();
                        var r = Math.round(sz * 0.18);
                        g2.moveTo(r, 0); g2.arcTo(sz, 0, sz, sz, r);
                        g2.arcTo(sz, sz, 0, sz, r); g2.arcTo(0, sz, 0, 0, r);
                        g2.arcTo(0, 0, sz, 0, r); g2.closePath(); g2.clip();
                    }
                    g2.drawImage(img, 0, 0, sz, sz);
                    return dibFromCanvas(c);
                });
                var ico = buildIco(dibs, sizes);
                onProgress(100, 'Built');
                return { blob: uint8ToBlob(ico, 'image/x-icon'), filename: 'favicon.ico' };
            }

            case 'base64-tool': {
                var mode = (get('b64-mode') && get('b64-mode').value) || 'encode';
                if (mode === 'decode') {
                    var b64 = (get('b64-input') && get('b64-input').value) || '';
                    b64 = b64.replace(/\s+/g, '');
                    if (!b64) throw new Error('Paste some Base64 text to decode.');
                    var bin = atob(b64);
                    var bytes = new Uint8Array(bin.length);
                    for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
                    var name = (get('b64-name') && get('b64-name').value) || 'decoded.bin';
                    onProgress(100, 'Decoded');
                    return { blob: uint8ToBlob(bytes, 'application/octet-stream'), filename: name };
                }
                if (!files || !files.length) throw new Error('Upload a file to encode.');
                var buf = await files[0].arrayBuffer();
                var encoded = btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
                setOut('b64-out', encoded);
                onProgress(100, 'Encoded');
                return textBlob(encoded, files[0].name + '.b64.txt');
            }

            case 'file-hash-checker': {
                if (!files || !files.length) throw new Error('Upload a file to hash.');
                var algo = (get('hash-algo') && get('hash-algo').value) || 'SHA-256';
                var fbuf = await files[0].arrayBuffer();
                var hbuf = await crypto.subtle.digest(algo, fbuf);
                var arr = Array.from(new Uint8Array(hbuf));
                var hex = arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
                var compare = (get('hash-compare') && get('hash-compare').value || '').trim().toLowerCase();
                var report = algo + ': ' + hex;
                if (compare) report += '\nMatch: ' + (compare === hex ? 'YES' : 'NO');
                setOut('hash-out', report);
                onProgress(100, 'Hashed');
                return textBlob(report, files[0].name + '.hash.txt');
            }

            default:
                throw new Error('This utility tool is not implemented yet.');
        }
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
