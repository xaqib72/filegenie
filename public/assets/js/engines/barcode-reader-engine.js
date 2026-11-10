/**
 * Barcode Reader engine — REAL, client-side barcode decoding via ZXing.
 *
 * Follows the same pattern as the QR reader: the workspace dropzone / paste adds
 * the image to the file queue, then clicking Process decodes it in the browser.
 * Supports 1D and 2D barcodes (Code 128, Code 39, EAN, UPC, ITF, Codabar, QR,
 * DataMatrix, Aztec, PDF417…).
 *
 * SECURITY: decoded content is treated as untrusted. It is shown with
 * textContent only (never innerHTML), and the optional "Open link" action is
 * enabled ONLY for explicit http(s) URLs the user clicks, with safe external
 * link attributes. We never navigate automatically.
 */
(function () {
    'use strict';

    function get(id) { return document.getElementById(id); }

    function renderControls(toolId, container) {
        if (!container) return;
        container.innerHTML =
            '<p class="setting-hint">Upload, drop, or paste a JPG/PNG/WebP image containing a barcode, then click <strong>Process</strong>. Everything is decoded in your browser.</p>' +
            '<div class="br-result" id="br-result" hidden>' +
            '  <div class="br-result-type" id="br-result-type"></div>' +
            '  <pre class="br-result-text" id="br-result-text"></pre>' +
            '  <div class="br-result-actions">' +
            '    <button type="button" class="btn btn-primary" id="br-copy-btn">Copy value</button>' +
            '    <a class="btn btn-ghost" id="br-open-btn" hidden rel="noopener noreferrer nofollow" target="_blank">Open link</a>' +
            '    <button type="button" class="btn btn-ghost" id="br-scan-another">Scan another</button>' +
            '  </div>' +
            '</div>';

        var ws = window.FileGenieWorkspace;
        if (ws) {
            document.removeEventListener('paste', onPaste);
            document.addEventListener('paste', onPaste);
        }
    }

    function onPaste(e) {
        if (!document.getElementById('br-result')) return; // only on the reader page
        var items = (e.clipboardData && e.clipboardData.items) || [];
        for (var i = 0; i < items.length; i++) {
            if (items[i].type && items[i].type.indexOf('image') === 0) {
                var file = items[i].getAsFile();
                if (file && window.FileGenieWorkspace) {
                    window.FileGenieWorkspace.addFiles([file]);
                }
                break;
            }
        }
    }

    function loadImage(src) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = function () { reject(new Error('Could not decode this image.')); };
            img.src = src;
        });
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        if (!files || !files.length) throw new Error('Add a barcode image first (upload, drop, or paste).');
        if (!window.ZXing || !window.ZXing.BrowserMultiFormatReader) {
            throw new Error('Barcode decoder is still loading — try again in a moment.');
        }

        onProgress(40, 'Decoding…');
        var url = URL.createObjectURL(files[0]);
        try {
            var img = await loadImage(url);

            var reader2 = new window.ZXing.BrowserMultiFormatReader();
            var result = null;
            // ZXing's BrowserMultiFormatReader.decodeFromImage requires an
            // HTMLImageElement, NOT a canvas. We try the original image first,
            // then a downscaled copy if the source is larger than the safe max.
            var MAX = 4096;
            try {
                result = await reader2.decodeFromImage(img);
            } catch (err) {
                result = null;
            }
            if (!result || !result.text) {
                // Fall back to a downscaled canvas → image for very large inputs.
                if (img.naturalWidth > MAX || img.naturalHeight > MAX) {
                    var scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
                    var w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
                    var canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    var scaled = await new Promise(function (res) {
                        canvas.toBlob(function (b) {
                            if (!b) { res(null); return; }
                            var su = URL.createObjectURL(b);
                            var sim = new Image();
                            sim.onload = function () { res(sim); };
                            sim.onerror = function () { res(null); };
                            sim.src = su;
                        }, 'image/png');
                    });
                    if (scaled) {
                        try { result = await reader2.decodeFromImage(scaled); } catch (err) { result = null; }
                    }
                }
            }
            if (!result || !result.text) {
                throw new Error('No barcode found in this image. Try a clearer, higher-contrast photo.');
            }

            onProgress(100, 'Decoded');
            renderResult(result.text, result.format || 'Unknown');
            return { blob: new Blob([result.text], { type: 'text/plain;charset=utf-8' }), filename: 'filegenie-barcode-content.txt' };
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    function renderResult(text, format) {
        var box = get('br-result');
        if (!box) return;
        var typeEl = get('br-result-type');
        var textEl = get('br-result-text');
        var openBtn = get('br-open-btn');
        var copyBtn = get('br-copy-btn');
        var anotherBtn = get('br-scan-another');

        // UNTRUSTED OUTPUT: always assign via textContent — never innerHTML.
        typeEl.textContent = (format && format !== 'Unknown') ? ('Format: ' + format) : 'Decoded value';
        textEl.textContent = text;

        // Open link only for explicit http/https URLs.
        if (/^https?:\/\//i.test(text.trim())) {
            openBtn.href = text.trim();
            openBtn.hidden = false;
        } else {
            openBtn.hidden = true;
        }

        copyBtn.onclick = function () {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(function () { copyBtn.textContent = 'Copy value'; }, 1500);
                }).catch(function () {
                    copyBtn.textContent = 'Copy failed';
                    setTimeout(function () { copyBtn.textContent = 'Copy value'; }, 1500);
                });
            } else {
                copyBtn.textContent = 'Copy unsupported';
            }
        };

        anotherBtn.onclick = function () {
            if (window.FileGenieWorkspace) window.FileGenieWorkspace.reset();
        };

        box.hidden = false;
    }

    document.addEventListener('DOMContentLoaded', function () {
        window.addEventListener('pagehide', function () { document.removeEventListener('paste', onPaste); });
    });

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
