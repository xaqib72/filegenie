/**
 * Image engine — real, client-side image operations on <canvas>.
 * Tools: compress-image, resize-image, crop-image, convert-image,
 *        add-watermark, rotate-image, round-corners, strip-exif,
 *        add-text-to-image, rotate-flip-image.
 *
 * Each tool decodes the real file pixels and re-encodes a genuinely transformed
 * image. Output is produced via canvas.toBlob with a real encoder, never by
 * copying the input bytes. (remove-background → background-engine.js,
 * heic-to-jpg → heic-engine.js.)
 */
(function () {
    'use strict';

    function loadImage(file) {
        return new Promise(function (resolve, reject) {
            var url = URL.createObjectURL(file);
            var img = new Image();
            img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not decode this image.')); };
            img.src = url;
        });
    }

    function outName(file, ext) {
        var base = (file.name || 'image').replace(/\.[^.]+$/, '');
        return base + '.' + ext;
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise(function (resolve) {
            canvas.toBlob(function (b) { resolve(b); }, type, quality);
        });
    }

    // ---------- renderControls ----------
    function renderControls(toolId, container) {
        if (!container) return;
        var h = '';
        switch (toolId) {
            case 'compress-image':
                h = `
                    <div class="setting-group">
                        <label class="setting-label">Quality (<span id="img-q-val">80</span>%)</label>
                        <input type="range" class="range-slider" id="img-quality" min="10" max="100" value="80"
                               oninput="document.getElementById('img-q-val').innerText=this.value">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="img-out-fmt">Output format</label>
                        <select class="setting-select" id="img-out-fmt">
                            <option value="image/jpeg">JPG (smallest)</option>
                            <option value="image/webp">WebP</option>
                            <option value="image/png">PNG (lossless)</option>
                        </select>
                    </div>`;
                break;
            case 'resize-image':
                h = `
                    <div class="setting-group">
                        <label class="setting-label" for="img-width">Width (px)</label>
                        <input type="number" class="setting-input" id="img-width" placeholder="800">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="img-height">Height (px)</label>
                        <input type="number" class="setting-input" id="img-height" placeholder="600">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="img-scale">Or scale by %</label>
                        <input type="number" class="setting-input" id="img-scale" placeholder="50">
                    </div>
                    <label class="setting-check"><input type="checkbox" id="img-lock" checked> Lock aspect ratio</label>`;
                break;
            case 'crop-image':
                h = `
                    <div class="setting-group">
                        <label class="setting-label" for="crop-x">X (px, from left)</label>
                        <input type="number" class="setting-input" id="crop-x" value="0">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="crop-y">Y (px, from top)</label>
                        <input type="number" class="setting-input" id="crop-y" value="0">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="crop-w">Width (px)</label>
                        <input type="number" class="setting-input" id="crop-w" placeholder="auto">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="crop-h">Height (px)</label>
                        <input type="number" class="setting-input" id="crop-h" placeholder="auto">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="crop-ratio">Preset ratio</label>
                        <select class="setting-select" id="crop-ratio">
                            <option value="">Free-form</option>
                            <option value="1">1:1 (square)</option>
                            <option value="1.3333">4:3</option>
                            <option value="1.7777">16:9</option>
                            <option value="1.5">3:2</option>
                        </select>
                    </div>`;
                break;
            case 'convert-image':
                h = `
                    <div class="setting-group">
                        <label class="setting-label" for="conv-fmt">Convert to</label>
                        <select class="setting-select" id="conv-fmt">
                            <option value="image/png">PNG</option>
                            <option value="image/jpeg">JPG</option>
                            <option value="image/webp">WebP</option>
                            <option value="image/bmp">BMP</option>
                        </select>
                    </div>`;
                break;
            case 'add-watermark':
                h = `
                    <div class="setting-group">
                        <label class="setting-label" for="wm-text">Watermark text</label>
                        <input type="text" class="setting-input" id="wm-text" value="© FileGenie">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label">Opacity (<span id="wm-op-val">35</span>%)</label>
                        <input type="range" class="range-slider" id="wm-opacity" min="5" max="100" value="35"
                               oninput="document.getElementById('wm-op-val').innerText=this.value">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="wm-position">Position</label>
                        <select class="setting-select" id="wm-position">
                            <option value="center">Center</option>
                            <option value="bottom-right">Bottom-right</option>
                            <option value="bottom-left">Bottom-left</option>
                            <option value="top-right">Top-right</option>
                            <option value="top-left">Top-left</option>
                        </select>
                    </div>
                    <label class="setting-check"><input type="checkbox" id="wm-tile"> Tile across image</label>`;
                break;
            case 'rotate-image':
            case 'rotate-flip-image':
                h = `
                    <div class="setting-group">
                        <label class="setting-label" for="rot-dir">Rotation</label>
                        <select class="setting-select" id="rot-dir">
                            <option value="90">Rotate 90° right</option>
                            <option value="-90">Rotate 90° left</option>
                            <option value="180">Rotate 180°</option>
                            <option value="flip-h">Flip horizontal</option>
                            <option value="flip-v">Flip vertical</option>
                        </select>
                    </div>`;
                break;
            case 'round-corners':
                h = `
                    <div class="setting-group">
                        <label class="setting-label">Corner radius (<span id="rc-val">40</span>px)</label>
                        <input type="range" class="range-slider" id="rc-radius" min="0" max="250" value="40"
                               oninput="document.getElementById('rc-val').innerText=this.value">
                    </div>
                    <label class="setting-check"><input type="checkbox" id="rc-circle"> Make a full circle</label>
                    <div class="setting-group">
                        <label class="setting-label" for="rc-fmt">Output format</label>
                        <select class="setting-select" id="rc-fmt">
                            <option value="image/png">PNG (keeps transparency)</option>
                            <option value="image/jpeg">JPG</option>
                        </select>
                    </div>`;
                break;
            case 'strip-exif':
                h = `
                    <div class="setting-group">
                        <label class="setting-label" for="exif-fmt">Re-encode format</label>
                        <select class="setting-select" id="exif-fmt">
                            <option value="image/jpeg">JPG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                    </div>
                    <p class="setting-hint">Re-draws the pixels to a fresh canvas, discarding all metadata.</p>`;
                break;
            case 'add-text-to-image':
                h = `
                    <div class="setting-group">
                        <label class="setting-label" for="ati-text">Text to add</label>
                        <input type="text" class="setting-input" id="ati-text" value="Your text here">
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label">Font size (<span id="ati-size-val">48</span>px)</label>
                        <input type="range" class="range-slider" id="ati-size" min="8" max="200" value="48"
                               oninput="document.getElementById('ati-size-val').innerText=this.value">
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label" for="ati-color">Color</label>
                        <input type="color" class="setting-color" id="ati-color" value="#ffffff">
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label" for="ati-opacity">Opacity (<span id="ati-op-val">100</span>%)</label>
                        <input type="range" class="range-slider" id="ati-opacity" min="10" max="100" value="100"
                               oninput="document.getElementById('ati-op-val').innerText=this.value">
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label" for="ati-position">Position</label>
                        <select class="setting-select" id="ati-position">
                            <option value="bottom-center">Bottom center</option>
                            <option value="center">Center</option>
                            <option value="top-center">Top center</option>
                            <option value="top-left">Top left</option>
                            <option value="top-right">Top right</option>
                            <option value="bottom-left">Bottom left</option>
                            <option value="bottom-right">Bottom right</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="ati-align">Alignment</label>
                        <select class="setting-select" id="ati-align">
                            <option value="center">Center</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                        </select>
                    </div>`;
                break;
            case 'rotate-flip-image':
                h = `
                    <div class="setting-group">
                        <label class="setting-label" for="rf-dir">Rotate or flip</label>
                        <select class="setting-select" id="rf-dir">
                            <option value="90">Rotate 90° clockwise</option>
                            <option value="180">Rotate 180°</option>
                            <option value="270">Rotate 270° clockwise</option>
                            <option value="flip-h">Flip horizontal (mirror)</option>
                            <option value="flip-v">Flip vertical</option>
                        </select>
                    </div>
                    <p class="setting-hint">Dimensions are adjusted so the result keeps the correct shape.</p>`;
                break;
            default:
                h = `<p class="setting-hint">No extra settings for this tool.</p>`;
        }
        container.innerHTML = h;
    }

    function get(id) { return document.getElementById(id); }

    function extFor(mime) {
        return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/bmp': 'bmp' }[mime] || 'png';
    }

    // ---------- process ----------
    async function process(toolId, files, onProgress, batchItem) {
        onProgress = onProgress || function () {};
        if (!files || !files.length) throw new Error('Please add an image first.');

        // The registry advertises these operations as batch-capable. Process
        // each source independently, then package the real outputs instead of
        // silently transforming only files[0].
        var batchTools = ['resize-image', 'convert-image', 'add-watermark', 'rotate-image', 'strip-exif', 'rotate-flip-image'];
        if (!batchItem && files.length > 1 && batchTools.indexOf(toolId) !== -1) {
            var items = [];
            for (var bi = 0; bi < files.length; bi++) {
                items.push(await process(toolId, [files[bi]], function (p, label) {
                    onProgress(Math.round(((bi + p / 100) / files.length) * 100), label || 'Processing batch');
                }, true));
            }
            return multiZip(items);
        }

        if (toolId === 'compress-image') {
            var q = (parseInt(get('img-quality') && get('img-quality').value, 10) || 80) / 100;
            var fmt = (get('img-out-fmt') && get('img-out-fmt').value) || 'image/jpeg';
            var out = [];
            for (var i = 0; i < files.length; i++) {
                var im = await loadImage(files[i]);
                var c = document.createElement('canvas');
                c.width = im.naturalWidth; c.height = im.naturalHeight;
                var ctx = c.getContext('2d');
                ctx.drawImage(im, 0, 0);
                var blob = await canvasToBlob(c, fmt, q);
                out.push({ blob: blob, filename: outName(files[i], extFor(fmt)) });
                onProgress(Math.round(((i + 1) / files.length) * 100), 'Compressing ' + (i + 1));
            }
            return out.length === 1 ? out[0] : multiZip(out);
        }

        var img = await loadImage(files[0]);
        var canvas = document.createElement('canvas');
        var g = canvas.getContext('2d');
        var w = img.naturalWidth, h = img.naturalHeight;
        // Default the output canvas to the source size. Tools that change
        // dimensions (resize/crop/rotate/round) re-set canvas.width/height.
        canvas.width = w; canvas.height = h;

        if (toolId === 'resize-image') {
            var scale = parseFloat(get('img-scale') && get('img-scale').value);
            var nw = parseFloat(get('img-width') && get('img-width').value);
            var nh = parseFloat(get('img-height') && get('img-height').value);
            var lock = get('img-lock') ? get('img-lock').checked : true;
            if (!isNaN(scale) && scale > 0) {
                nw = Math.round(w * scale / 100); nh = Math.round(h * scale / 100);
            } else if (!isNaN(nw) && nw > 0) {
                nh = lock ? Math.round(h * nw / w) : (nh || h);
            } else if (!isNaN(nh) && nh > 0) {
                nw = lock ? Math.round(w * nh / h) : (nw || w);
            } else { nw = w; nh = h; }
            canvas.width = nw; canvas.height = nh;
            g.drawImage(img, 0, 0, nw, nh);
            return done(canvas, 'image/jpeg', 0.92, files[0]);
        }

        if (toolId === 'crop-image') {
            var ratio = parseFloat(get('crop-ratio') && get('crop-ratio').value);
            var cx = Math.max(0, parseFloat(get('crop-x') && get('crop-x').value) || 0);
            var cy = Math.max(0, parseFloat(get('crop-y') && get('crop-y').value) || 0);
            var cw = parseFloat(get('crop-w') && get('crop-w').value);
            var ch = parseFloat(get('crop-h') && get('crop-h').value);
            if (!cw || cw <= 0) cw = w - cx;
            if (!ch || ch <= 0) ch = h - cy;
            if (ratio) {
                ch = cw / ratio;
                if (cy + ch > h) { ch = h - cy; cw = ch * ratio; }
            }
            cx = Math.min(cx, w - 1); cy = Math.min(cy, h - 1);
            cw = Math.min(cw, w - cx); ch = Math.min(ch, h - cy);
            canvas.width = Math.round(cw); canvas.height = Math.round(ch);
            g.drawImage(img, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);
            return done(canvas, 'image/jpeg', 0.92, files[0]);
        }

        if (toolId === 'convert-image') {
            var cf = (get('conv-fmt') && get('conv-fmt').value) || 'image/png';
            if (cf === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
            g.drawImage(img, 0, 0);
            return done(canvas, cf, 0.92, files[0]);
        }

        if (toolId === 'add-watermark') {
            g.drawImage(img, 0, 0);
            var text = (get('wm-text') && get('wm-text').value) || '© FileGenie';
            var op = (parseInt(get('wm-opacity') && get('wm-opacity').value, 10) || 35) / 100;
            var pos = (get('wm-position') && get('wm-position').value) || 'center';
            var tile = get('wm-tile') ? get('wm-tile').checked : false;
            var fontSize = Math.max(16, Math.round(Math.min(w, h) * 0.05));
            g.font = 'bold ' + fontSize + 'px sans-serif';
            g.fillStyle = 'rgba(255,255,255,' + op + ')';
            g.strokeStyle = 'rgba(0,0,0,' + (op * 0.5) + ')';
            g.lineWidth = Math.max(1, fontSize / 12);
            g.textBaseline = 'middle';
            if (tile) {
                var tw = g.measureText(text).width + fontSize * 2;
                for (var yy = fontSize; yy < h + fontSize; yy += fontSize * 3) {
                    for (var xx = fontSize; xx < w + fontSize; xx += tw) {
                        g.strokeText(text, xx, yy); g.fillText(text, xx, yy);
                    }
                }
            } else {
                var metrics = g.measureText(text);
                var xpos, ypos;
                if (pos === 'center') { xpos = (w - metrics.width) / 2; ypos = h / 2; }
                else if (pos === 'bottom-right') { xpos = w - metrics.width - fontSize; ypos = h - fontSize; }
                else if (pos === 'bottom-left') { xpos = fontSize; ypos = h - fontSize; }
                else if (pos === 'top-right') { xpos = w - metrics.width - fontSize; ypos = fontSize * 1.5; }
                else { xpos = fontSize; ypos = fontSize * 1.5; }
                g.strokeText(text, xpos, ypos); g.fillText(text, xpos, ypos);
            }
            return done(canvas, 'image/jpeg', 0.92, files[0]);
        }

        if (toolId === 'rotate-image' || toolId === 'rotate-flip-image') {
            var dir = (get('rot-dir') && get('rot-dir').value) || '90';
            if (dir === '90' || dir === '-90' || dir === '180') {
                var ang = parseInt(dir, 10) * Math.PI / 180;
                var outW = (dir === '180') ? w : h;
                var outH = (dir === '180') ? h : w;
                canvas.width = outW; canvas.height = outH;
                g.translate(outW / 2, outH / 2);
                g.rotate(ang);
                g.drawImage(img, -w / 2, -h / 2);
            } else if (dir === 'flip-h') {
                canvas.width = w; canvas.height = h;
                g.translate(w, 0); g.scale(-1, 1); g.drawImage(img, 0, 0);
            } else if (dir === 'flip-v') {
                canvas.width = w; canvas.height = h;
                g.translate(0, h); g.scale(1, -1); g.drawImage(img, 0, 0);
            }
            return done(canvas, 'image/jpeg', 0.92, files[0]);
        }

        if (toolId === 'round-corners') {
            var circle = get('rc-circle') ? get('rc-circle').checked : false;
            var r = circle ? Math.min(w, h) / 2 : (parseInt(get('rc-radius') && get('rc-radius').value, 10) || 0);
            var fmt2 = (get('rc-fmt') && get('rc-fmt').value) || 'image/png';
            canvas.width = w; canvas.height = h;
            g.beginPath();
            if (fmt2 !== 'image/png') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
            if (circle) {
                g.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
            } else {
                roundRectPath(g, 0, 0, w, h, r);
            }
            g.closePath();
            g.clip();
            g.drawImage(img, 0, 0);
            return done(canvas, fmt2, 0.92, files[0]);
        }

        if (toolId === 'strip-exif') {
            var ef = (get('exif-fmt') && get('exif-fmt').value) || 'image/jpeg';
            g.drawImage(img, 0, 0);
            return done(canvas, ef, 0.92, files[0]);
        }

        if (toolId === 'add-text-to-image') {
            var txt = (get('ati-text') && get('ati-text').value) || '';
            if (!txt) throw new Error('Type some text to add to the image.');
            var fontSize = parseInt(get('ati-size') && get('ati-size').value, 10) || 48;
            var color = (get('ati-color') && get('ati-color').value) || '#ffffff';
            var opacity = (parseInt(get('ati-opacity') && get('ati-opacity').value, 10) || 100) / 100;
            var tpos = (get('ati-position') && get('ati-position').value) || 'bottom-center';
            var talign = (get('ati-align') && get('ati-align').value) || 'center';
            g.drawImage(img, 0, 0);
            g.save();
            g.globalAlpha = opacity;
            g.font = '600 ' + fontSize + 'px Arial, Helvetica, sans-serif';
            g.fillStyle = color;
            g.textBaseline = 'middle';
            g.textAlign = talign;
            var tx, ty;
            var pad = Math.max(12, fontSize * 0.4);
            if (talign === 'left') { tx = pad; } else if (talign === 'right') { tx = w - pad; } else { tx = w / 2; }
            if (tpos.indexOf('top') === 0) { ty = pad + fontSize / 2; }
            else if (tpos.indexOf('bottom') === 0) { ty = h - pad - fontSize / 2; }
            else { ty = h / 2; }
            if (tpos === 'top-left' || tpos === 'bottom-left') { tx = pad; g.textAlign = 'left'; }
            if (tpos === 'top-right' || tpos === 'bottom-right') { tx = w - pad; g.textAlign = 'right'; }
            g.fillText(txt, tx, ty);
            g.restore();
            return done(canvas, 'image/jpeg', 0.92, files[0]);
        }

        if (toolId === 'rotate-flip-image') {
            var rdir = (get('rf-dir') && get('rf-dir').value) || '90';
            if (rdir === '90' || rdir === '180' || rdir === '270') {
                var ang2 = parseInt(rdir, 10) * Math.PI / 180;
                var oW = (rdir === '180') ? w : h;
                var oH = (rdir === '180') ? h : w;
                canvas.width = oW; canvas.height = oH;
                g.translate(oW / 2, oH / 2);
                g.rotate(ang2);
                g.drawImage(img, -w / 2, -h / 2);
            } else if (rdir === 'flip-h') {
                canvas.width = w; canvas.height = h;
                g.translate(w, 0); g.scale(-1, 1); g.drawImage(img, 0, 0);
            } else if (rdir === 'flip-v') {
                canvas.width = w; canvas.height = h;
                g.translate(0, h); g.scale(1, -1); g.drawImage(img, 0, 0);
            }
            return done(canvas, 'image/jpeg', 0.92, files[0]);
        }

        throw new Error('This image tool is not implemented yet.');
    }

    function roundRectPath(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
    }

    function done(canvas, type, quality, file) {
        return canvasToBlob(canvas, type, quality).then(function (blob) {
            return { blob: blob, filename: outName(file, extFor(type)) };
        });
    }

    function multiZip(items) {
        if (window.JSZip) {
            var zip = new window.JSZip();
            items.forEach(function (it) { zip.file(it.filename, it.blob); });
            return zip.generateAsync({ type: 'blob' }).then(function (z) {
                return { blob: z, filename: 'filegenie-images.zip' };
            });
        }
        throw new Error('Batch output packaging is unavailable. Please reload the page and try again.');
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
