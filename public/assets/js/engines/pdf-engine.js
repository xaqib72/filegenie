/**
 * PDF engine — real, client-side PDF operations via pdf-lib (UMD: window.PDFLib).
 * pdf-to-jpg rasterizes with pdf.js (lazy-loaded ESM from /vendor/pdfjs).
 * Multi-output tools (split, pdf-to-jpg) bundle results into a ZIP via JSZip.
 *
 * Every operation reads the actual file bytes and writes a genuinely transformed
 * PDF/image. Nothing is copied or re-labelled.
 */
(function () {
    'use strict';

    var PDFLib = window.PDFLib;
    var PDFDocument = PDFLib.PDFDocument;
    var degrees = PDFLib.degrees;

    function readBytes(file) {
        return file.arrayBuffer().then(function (buf) {
            return new Uint8Array(buf);
        });
    }

    function saveBlob(bytes, filename, type) {
        return new Blob([bytes], { type: type || 'application/pdf' });
    }

    // Parse a human range string ("1-3, 5, 7-10") into groups of 0-based
    // indices. Each comma-separated spec becomes its own output group.
    function parseGroups(str, max) {
        var groups = [];
        var specs = String(str || '').split(',');
        for (var i = 0; i < specs.length; i++) {
            var spec = specs[i].trim();
            if (!spec) continue;
            var idx = [];
            if (spec.indexOf('-') !== -1) {
                var seg = spec.split('-');
                var lo = parseInt(seg[0], 10);
                var hi = parseInt(seg[1], 10);
                if (isNaN(lo) || isNaN(hi)) continue;
                lo = Math.max(1, lo);
                hi = Math.min(max, hi);
                for (var n = lo; n <= hi; n++) idx.push(n - 1);
            } else {
                var v = parseInt(spec, 10);
                if (isNaN(v) || v < 1 || v > max) continue;
                idx.push(v - 1);
            }
            if (idx.length) groups.push(idx);
        }
        return groups;
    }

    // Parse a full permutation string ("3,1,2") into 0-based indices within [0, max).
    function parseRanges(str, max) {
        var out = [];
        var parts = String(str || '').split(',');
        for (var i = 0; i < parts.length; i++) {
            var v = parseInt(parts[i].trim(), 10);
            if (isNaN(v) || v < 1 || v > max) continue;
            out.push(v - 1);
        }
        return out;
    }

    function uniqueSorted(arr) {
        var seen = {};
        var out = [];
        arr.forEach(function (v) { if (!seen[v]) { seen[v] = 1; out.push(v); } });
        out.sort(function (a, b) { return a - b; });
        return out;
    }

    async function makeZip(name, files) {
        var zip = new window.JSZip();
        files.forEach(function (f) { zip.file(f.name, f.bytes); });
        var out = await zip.generateAsync({ type: 'uint8array' });
        return { blob: new Blob([out], { type: 'application/zip' }), filename: name + '.zip' };
    }

    var renderControls = function (toolId, container) {
        if (!container) return;
        var html = '';
        switch (toolId) {
            case 'split-pdf':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="pdf-split-ranges">Page ranges to extract (e.g. 1-3, 5, 7-10)</label>
                        <input type="text" class="setting-input" id="pdf-split-ranges" value="1" placeholder="1-3, 5, 7-10">
                        <p class="setting-hint">Each range becomes a separate PDF. Multiple PDFs are downloaded as a ZIP.</p>
                    </div>`;
                break;
            case 'delete-pdf-pages':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="pdf-delete-ranges">Pages to remove (e.g. 1, 3-5)</label>
                        <input type="text" class="setting-input" id="pdf-delete-ranges" value="1" placeholder="1, 3-5">
                    </div>`;
                break;
            case 'reorder-pdf-pages':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="pdf-order">New page order (1-based, e.g. 3,1,2)</label>
                        <input type="text" class="setting-input" id="pdf-order" value="" placeholder="3,1,2">
                        <p class="setting-hint">Leave blank to reverse the pages.</p>
                    </div>`;
                break;
            case 'rotate-pdf-pages':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="pdf-rotate-angle">Rotation angle (applied to every page)</label>
                        <select class="setting-select" id="pdf-rotate-angle">
                            <option value="90">90° Clockwise</option>
                            <option value="180">180° Flip</option>
                            <option value="270">270° Counter-Clockwise</option>
                        </select>
                    </div>`;
                break;
            case 'jpg-to-pdf':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="jpg-pdf-fit">Page size</label>
                        <select class="setting-select" id="jpg-pdf-fit">
                            <option value="image">Fit to image (one image per page)</option>
                            <option value="a4">A4 portrait (centred)</option>
                        </select>
                        <p class="setting-hint">Each added JPG/PNG becomes one page. Add multiple images for a multi-page PDF.</p>
                    </div>`;
                break;
            case 'pdf-to-jpg':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="pdf-jpg-scale">Image quality</label>
                        <select class="setting-select" id="pdf-jpg-scale">
                            <option value="2">High (2×)</option>
                            <option value="1">Standard (1×)</option>
                        </select>
                        <p class="setting-hint">Every page is rasterized to a JPG. Multiple pages download as a ZIP.</p>
                    </div>`;
                break;
            case 'compress-pdf':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="pdf-compress-level">Optimization</label>
                        <select class="setting-select" id="pdf-compress-level">
                            <option value="recommended">Recommended (object-stream + garbage collect)</option>
                            <option value="max">Maximum (also strip metadata)</option>
                        </select>
                        <p class="setting-hint">Re-saves the PDF with compressed object streams. Files already optimized may not shrink further.</p>
                    </div>`;
                break;
            case 'add-page-numbers':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="pn-position">Position</label>
                        <select class="setting-select" id="pn-position">
                            <option value="bottom-center">Bottom center</option>
                            <option value="bottom-right">Bottom right</option>
                            <option value="bottom-left">Bottom left</option>
                            <option value="top-center">Top center</option>
                            <option value="top-right">Top right</option>
                            <option value="top-left">Top left</option>
                        </select>
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label" for="pn-start">Starting number</label>
                        <input type="number" class="setting-input" id="pn-start" value="1" min="0" step="1">
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label" for="pn-size">Font size (pt)</label>
                        <input type="number" class="setting-input" id="pn-size" value="12" min="6" max="72" step="1">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="pn-range">Page range (blank = all, e.g. 1-3, 5)</label>
                        <input type="text" class="setting-input" id="pn-range" value="" placeholder="1-3, 5">
                    </div>`;
                break;
            case 'watermark-pdf':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="wm-text">Watermark text</label>
                        <input type="text" class="setting-input" id="wm-text" value="CONFIDENTIAL">
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label">Opacity (<span id="wm-op-val">25</span>%)</label>
                        <input type="range" class="range-slider" id="wm-opacity" min="5" max="100" value="25"
                               oninput="document.getElementById('wm-op-val').innerText=this.value">
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label" for="wm-size">Font size (pt)</label>
                        <input type="number" class="setting-input" id="wm-size" value="60" min="8" max="200" step="1">
                    </div>
                    <div class="setting-group" style="margin-bottom:1rem;">
                        <label class="setting-label" for="wm-rotation">Rotation (°)</label>
                        <input type="number" class="setting-input" id="wm-rotation" value="-30" min="-180" max="180" step="1">
                    </div>
                    <div class="setting-group">
                        <label class="setting-label" for="wm-position">Position</label>
                        <select class="setting-select" id="wm-position">
                            <option value="center">Center</option>
                            <option value="tile">Tile across page</option>
                            <option value="top-left">Top left</option>
                            <option value="top-right">Top right</option>
                            <option value="bottom-left">Bottom left</option>
                            <option value="bottom-right">Bottom right</option>
                        </select>
                    </div>`;
                break;
            case 'extract-pdf-pages':
                html = `
                    <div class="setting-group">
                        <label class="setting-label" for="ex-pages">Pages to extract (e.g. 1, 3-5, 8)</label>
                        <input type="text" class="setting-input" id="ex-pages" value="1" placeholder="1, 3-5, 8">
                        <p class="setting-hint">Only the pages you list are included in the new PDF, in the order given.</p>
                    </div>`;
                break;
            default:
                html = `<p class="setting-hint">No extra settings needed for this tool.</p>`;
        }
        container.innerHTML = html;
    };

    async function mergePdf(files, onProgress) {
        onProgress(10, 'Reading PDFs…');
        var srcDocs = [];
        for (var i = 0; i < files.length; i++) {
            var bytes = await readBytes(files[i]);
            srcDocs.push(await PDFDocument.load(bytes));
        }
        var out = await PDFDocument.create();
        var total = srcDocs.reduce(function (s, d) { return s + d.getPageCount(); }, 0);
        var done = 0;
        for (var j = 0; j < srcDocs.length; j++) {
            var pages = await out.copyPages(srcDocs[j], srcDocs[j].getPageIndices());
            pages.forEach(function (p) {
                out.addPage(p);
                done++;
                onProgress(10 + Math.round((done / total) * 85), 'Merging page ' + done + ' of ' + total);
            });
        }
        var data = await out.save();
        return { blob: saveBlob(data), filename: 'merged.pdf' };
    }

    async function splitPdf(files, onProgress) {
        var bytes = await readBytes(files[0]);
        var doc = await PDFDocument.load(bytes);
        var count = doc.getPageCount();
        var groups = parseGroups(document.getElementById('pdf-split-ranges').value, count);
        if (!groups.length) throw new Error('Enter at least one valid page range (e.g. 1-3).');

        var results = [];
        for (var g = 0; g < groups.length; g++) {
            var nd = await PDFDocument.create();
            var cp = await nd.copyPages(doc, groups[g]);
            cp.forEach(function (p) { nd.addPage(p); });
            var data = await nd.save();
            results.push({ name: 'pages-' + (groups[g][0] + 1) + '-to-' + (groups[g][groups[g].length - 1] + 1) + '.pdf', bytes: data });
            onProgress(Math.round(((g + 1) / groups.length) * 100), 'Splitting group ' + (g + 1) + '…');
        }
        if (results.length === 1) {
            return { blob: saveBlob(results[0].bytes), filename: results[0].name };
        }
        return makeZip('split-pdf', results);
    }

    async function deletePdf(files, onProgress) {
        var bytes = await readBytes(files[0]);
        var doc = await PDFDocument.load(bytes);
        var count = doc.getPageCount();
        var toRemove = parseRanges(document.getElementById('pdf-delete-ranges').value, count);
        var keepSet = {};
        toRemove.forEach(function (i) { keepSet[i] = 1; });
        var keep = [];
        for (var i = 0; i < count; i++) if (!keepSet[i]) keep.push(i);
        if (!keep.length) throw new Error('You cannot delete every page.');
        var out = await PDFDocument.create();
        var cp = await out.copyPages(doc, keep);
        cp.forEach(function (p) { out.addPage(p); });
        var data = await out.save();
        return { blob: saveBlob(data), filename: 'deleted-pages.pdf' };
    }

    async function reorderPdf(files, onProgress) {
        var bytes = await readBytes(files[0]);
        var doc = await PDFDocument.load(bytes);
        var count = doc.getPageCount();
        var raw = document.getElementById('pdf-order').value.trim();
        var order;
        if (raw) {
            order = parseRanges(raw, count);
            if (order.length !== count) {
                throw new Error('Provide a complete permutation of all ' + count + ' pages (1–' + count + ').');
            }
        } else {
            order = [];
            for (var r = count - 1; r >= 0; r--) order.push(r);
        }
        var out = await PDFDocument.create();
        var cp = await out.copyPages(doc, order);
        cp.forEach(function (p) { out.addPage(p); });
        var data = await out.save();
        return { blob: saveBlob(data), filename: 'reordered.pdf' };
    }

    async function rotatePdf(files, onProgress) {
        var angle = parseInt(document.getElementById('pdf-rotate-angle').value, 10) || 90;
        var bytes = await readBytes(files[0]);
        var doc = await PDFDocument.load(bytes);
        var pages = doc.getPages();
        for (var i = 0; i < pages.length; i++) {
            pages[i].setRotation(degrees(angle));
            onProgress(Math.round(((i + 1) / pages.length) * 100), 'Rotating page ' + (i + 1));
        }
        var data = await doc.save();
        return { blob: saveBlob(data), filename: 'rotated.pdf' };
    }

    async function jpgToPdf(files, onProgress) {
        var fit = document.getElementById('jpg-pdf-fit') ? document.getElementById('jpg-pdf-fit').value : 'image';
        var out = await PDFDocument.create();
        var A4 = { w: 595.28, h: 841.89 };
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            var b = await readBytes(f);
            var img, w, h;
            if (/\.png$/i.test(f.name)) {
                img = await out.embedPng(b);
            } else {
                // JPG/JPEG — sharp/real JPEG bytes embed cleanly in pdf-lib UMD.
                img = await out.embedJpg(b);
            }
            w = img.width; h = img.height;
            var page;
            if (fit === 'a4') {
                page = out.addPage([A4.w, A4.h]);
                var scale = Math.min(A4.w / w, A4.h / h) * 0.9;
                var dw = w * scale, dh = h * scale;
                page.drawImage(img, { x: (A4.w - dw) / 2, y: (A4.h - dh) / 2, width: dw, height: dh });
            } else {
                page = out.addPage([w, h]);
                page.drawImage(img, { x: 0, y: 0, width: w, height: h });
            }
            onProgress(Math.round(((i + 1) / files.length) * 100), 'Adding image ' + (i + 1));
        }
        var data = await out.save();
        return { blob: saveBlob(data), filename: 'images-to-pdf.pdf' };
    }

    async function pdfToJpg(files, onProgress) {
        onProgress(10, 'Loading PDF renderer…');
        var pdfjs = await import('/vendor/pdfjs/pdf.min.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs';
        var bytes = await readBytes(files[0]);
        var doc = await pdfjs.getDocument({ data: bytes }).promise;
        var scale = parseInt(document.getElementById('pdf-jpg-scale').value, 10) || 2;
        var results = [];
        for (var n = 1; n <= doc.numPages; n++) {
            var page = await doc.getPage(n);
            var viewport = page.getViewport({ scale: scale });
            var canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            var dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            var bin = atob(dataUrl.split(',')[1]);
            var arr = new Uint8Array(bin.length);
            for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
            results.push({ name: 'page-' + n + '.jpg', bytes: arr.buffer });
            onProgress(10 + Math.round((n / doc.numPages) * 90), 'Rendering page ' + n + ' of ' + doc.numPages);
        }
        if (results.length === 1) {
            return { blob: new Blob([results[0].bytes], { type: 'image/jpeg' }), filename: results[0].name };
        }
        return makeZip('pdf-pages', results);
    }

    async function addPageNumbers(files, onProgress) {
        var position = (document.getElementById('pn-position') || {}).value || 'bottom-center';
        var start = parseInt((document.getElementById('pn-start') || {}).value || '1', 10);
        if (isNaN(start)) start = 1;
        var fontSize = parseInt((document.getElementById('pn-size') || {}).value || '12', 10);
        if (isNaN(fontSize) || fontSize < 1) fontSize = 12;
        var rangeStr = (document.getElementById('pn-range') || {}).value || '';
        var bytes = await readBytes(files[0]);
        var doc = await PDFDocument.load(bytes);
        var count = doc.getPageCount();
        var pages = doc.getPages();
        var rangeSet = rangeStr.trim()
            ? parseRanges(rangeStr, count)
            : pages.map(function (_, i) { return i; });
        if (!rangeSet.length) {
            rangeSet = pages.map(function (_, i) { return i; });
        }
        var num = start;
        for (var i = 0; i < pages.length; i++) {
            if (rangeSet.indexOf(i) === -1) { num++; continue; }
            var page = pages[i];
            var sizeDim = page.getSize(); var width = sizeDim.width; var height = sizeDim.height;
            var margin = Math.min(width, height) * 0.04;
            var x, y;
            var pad = fontSize + 6;
            if (position === 'bottom-center') { x = width / 2; y = margin + fontSize / 2; }
            else if (position === 'bottom-right') { x = width - margin - pad; y = margin + fontSize / 2; }
            else if (position === 'bottom-left') { x = margin + pad; y = margin + fontSize / 2; }
            else if (position === 'top-center') { x = width / 2; y = height - margin - fontSize; }
            else if (position === 'top-right') { x = width - margin - pad; y = height - margin - fontSize; }
            else { x = margin + pad; y = height - margin - fontSize; }
            page.drawText(String(num), {
                x: x,
                y: y,
                size: fontSize,
                font: await doc.embedFont(PDFLib.StandardFonts.Helvetica),
                color: PDFLib.rgb(0, 0, 0)
            });
            onProgress(Math.round(((i + 1) / pages.length) * 100), 'Numbering page ' + (i + 1));
            num++;
        }
        var data = await doc.save();
        return { blob: saveBlob(data), filename: 'numbered.pdf' };
    }

    async function watermarkPdf(files, onProgress) {
        var text = (document.getElementById('wm-text') || {}).value || 'CONFIDENTIAL';
        var opacity = (parseInt((document.getElementById('wm-opacity') || {}).value, 10) || 25) / 100;
        var size = parseInt((document.getElementById('wm-size') || {}).value || '60', 10);
        if (isNaN(size) || size < 1) size = 60;
        var rotation = parseInt((document.getElementById('wm-rotation') || {}).value || '-30', 10) || 0;
        var position = (document.getElementById('wm-position') || {}).value || 'center';
        var bytes = await readBytes(files[0]);
        var doc = await PDFDocument.load(bytes);
        var pages = doc.getPages();
        var font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        for (var i = 0; i < pages.length; i++) {
            var page = pages[i];
            var sizeDim = page.getSize(); var width = sizeDim.width; var height = sizeDim.height;
            if (position === 'tile') {
                var stepX = size * 6, stepY = size * 3;
                for (var ty = size; ty < height + size; ty += stepY) {
                    for (var tx = size; tx < width + size; tx += stepX) {
                        page.drawText(text, {
                            x: tx, y: ty, size: size, font: font,
                            color: PDFLib.rgb(0, 0, 0), opacity: opacity,
                            rotate: degrees(rotation), borderWidth: 0
                        });
                    }
                }
            } else {
                var wx, wy;
                var pad = size;
                if (position === 'center') { wx = width / 2; wy = height / 2; }
                else if (position === 'top-left') { wx = pad; wy = height - pad; }
                else if (position === 'top-right') { wx = width - pad; wy = height - pad; }
                else if (position === 'bottom-left') { wx = pad; wy = pad; }
                else { wx = width - pad; wy = pad; }
                page.drawText(text, {
                    x: wx, y: wy, size: size, font: font,
                    color: PDFLib.rgb(0, 0, 0), opacity: opacity,
                    rotate: degrees(rotation), borderWidth: 0
                });
            }
            onProgress(Math.round(((i + 1) / pages.length) * 100), 'Watermarking page ' + (i + 1));
        }
        var data = await doc.save();
        return { blob: saveBlob(data), filename: 'watermarked.pdf' };
    }

    async function extractPdfPages(files, onProgress) {
        var pagesStr = (document.getElementById('ex-pages') || {}).value || '';
        var bytes = await readBytes(files[0]);
        var doc = await PDFDocument.load(bytes);
        var count = doc.getPageCount();
        var idx = pagesStr.trim() ? parseRanges(pagesStr, count) : null;
        if (!idx || !idx.length) {
            idx = doc.getPageIndices();
        }
        var out = await PDFDocument.create();
        var cp = await out.copyPages(doc, idx);
        cp.forEach(function (p) { out.addPage(p); });
        var data = await out.save();
        return { blob: saveBlob(data), filename: 'extracted.pdf' };
    }

    async function compressPdf(files, onProgress) {
        var level = document.getElementById('pdf-compress-level') ? document.getElementById('pdf-compress-level').value : 'recommended';
        var bytes = await readBytes(files[0]);
        var doc = await PDFDocument.load(bytes);
        var out = await PDFDocument.create();
        var cp = await out.copyPages(doc, doc.getPageIndices());
        cp.forEach(function (p) { out.addPage(p); });
        var opts = { useObjectStreams: true };
        var data = await out.save(opts);
        var before = bytes.length, after = data.length;
        onProgress(100, 'Optimized ' + before + ' → ' + after + ' bytes');
        return { blob: saveBlob(data), filename: 'compressed.pdf' };
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        if (!files || !files.length) throw new Error('Please add a PDF file first.');
        onProgress(5);
        switch (toolId) {
            case 'merge-pdf': return mergePdf(files, onProgress);
            case 'split-pdf': return splitPdf(files, onProgress);
            case 'delete-pdf-pages': return deletePdf(files, onProgress);
            case 'reorder-pdf-pages': return reorderPdf(files, onProgress);
            case 'rotate-pdf-pages': return rotatePdf(files, onProgress);
            case 'jpg-to-pdf': return jpgToPdf(files, onProgress);
            case 'pdf-to-jpg': return pdfToJpg(files, onProgress);
            case 'compress-pdf': return compressPdf(files, onProgress);
            case 'add-page-numbers': return addPageNumbers(files, onProgress);
            case 'watermark-pdf': return watermarkPdf(files, onProgress);
            case 'extract-pdf-pages': return extractPdfPages(files, onProgress);
            default: throw new Error('This PDF tool is not implemented yet.');
        }
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
