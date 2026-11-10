/**
 * QR Code Reader engine — decodes a QR code from an uploaded or pasted image
 * entirely in the browser using jsQR. The decoded content is treated as
 * UNTRUSTED: it is rendered only via textContent (never innerHTML), links are
 * only opened when they are explicit http/https, and nothing auto-navigates.
 */
(function () {
    'use strict';

    function get(id) { return document.getElementById(id); }

    function renderControls(toolId, container) {
        if (!container) return;
        if (toolId !== 'qr-code-reader') {
            container.innerHTML = '<p class="setting-hint">QR reader ready.</p>';
            return;
        }
        // Minimal options; the upload happens via the workspace dropzone.
        container.innerHTML =
            '<p class="setting-hint">Upload or drop a JPG/PNG/WebP image with a QR code, or paste an image from your clipboard, then click <strong>Scan</strong>. Everything is decoded in your browser.</p>' +
            '<div class="qr-reader-result" id="qr-reader-result" hidden>' +
            '  <div class="qr-result-type" id="qr-result-type"></div>' +
            '  <pre class="qr-result-text" id="qr-result-text"></pre>' +
            '  <div class="qr-result-actions">' +
            '    <button type="button" class="btn btn-primary" id="qr-copy-btn">Copy result</button>' +
            '    <a class="btn btn-ghost" id="qr-open-btn" hidden rel="noopener noreferrer nofollow" target="_blank">Open link</a>' +
            '    <button type="button" class="btn btn-ghost" id="qr-scan-another">Scan another</button>' +
            '  </div>' +
            '</div>';

        // Paste support: capture an image placed on the clipboard. Remove any
        // prior instance first so re-rendering controls never stacks listeners.
        document.removeEventListener('paste', onPaste);
        document.addEventListener('paste', onPaste);
    }

    function onPaste(e) {
        if (!document.getElementById('qr-reader-result')) return; // not on reader page
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

    function detectType(data) {
        var d = String(data).trim();
        if (/^https?:\/\//i.test(d)) return 'URL';
        if (/^mailto:/i.test(d)) return 'Email';
        if (/^tel:/i.test(d)) return 'Phone';
        if (/^WIFI:/i.test(d)) return 'Wi-Fi';
        if (/^SMSTO:/i.test(d) || /^smsto:/i.test(d) || /^SMS:/i.test(d)) return 'SMS';
        if (/^(BEGIN:VCARD|MATMSG:|geo:)/i.test(d)) return 'Contact';
        return 'Text';
    }

    function wifiSummary(data) {
        // WIFI:S:<ssid>;T:<auth>;P:<password>;H:<hidden>;
        var ssid = (data.match(/S:([^;]*);/) || [])[1] || '(unknown)';
        var auth = (data.match(/T:([^;]*);/) || [])[1] || '';
        return 'Wi-Fi network: ' + ssid + (auth ? ' (' + auth + ')' : '');
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        if (toolId !== 'qr-code-reader') throw new Error('This tool is not implemented yet.');
        if (!files || !files.length) throw new Error('Add a QR image first (upload, drop, or paste).');
        if (!window.jsQR) throw new Error('QR decoder is still loading — try again in a moment.');

        onProgress(40, 'Decoding…');
        var url = URL.createObjectURL(files[0]);
        try {
            var img = await loadImage(url);
            var canvas = document.createElement('canvas');
            // Cap decoded dimension to keep memory sane for very large images.
            var MAX = 4096;
            var w = img.naturalWidth, h = img.naturalHeight;
            if (w > MAX || h > MAX) {
                var scale = Math.min(MAX / w, MAX / h, 1);
                w = Math.round(w * scale); h = Math.round(h * scale);
            }
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, w, h);
            var imageData = ctx.getImageData(0, 0, w, h);

            onProgress(80, 'Reading code…');
            var result = window.jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
            if (!result || !result.data) {
                throw new Error('No QR code found. Make sure the code is sharp, well-lit, and fills most of the image.');
            }

            var decoded = result.data;
            var type = detectType(decoded);
            onProgress(100, 'Decoded');
            renderResult(decoded, type);

            // Standard downloadable result (the decoded content as text).
            return { blob: new Blob([decoded], { type: 'text/plain;charset=utf-8' }), filename: 'filegenie-qr-content.txt' };
        } finally {
            URL.revokeObjectURL(url);
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

    function renderResult(decoded, type) {
        var box = get('qr-reader-result');
        if (!box) return;

        var typeEl = get('qr-result-type');
        var textEl = get('qr-result-text');
        var openBtn = get('qr-open-btn');
        var copyBtn = get('qr-copy-btn');
        var anotherBtn = get('qr-scan-another');

        // UNTRUSTED OUTPUT: always assign via textContent — never innerHTML.
        typeEl.textContent = 'Detected type: ' + type;
        textEl.textContent = (type === 'Wi-Fi') ? wifiSummary(decoded) : decoded;

        // Open link only for explicit http/https URLs.
        if (type === 'URL' && /^https?:\/\//i.test(decoded.trim())) {
            openBtn.href = decoded.trim();
            openBtn.hidden = false;
        } else {
            openBtn.hidden = true;
        }

        copyBtn.onclick = function () {
            var textToCopy = (type === 'Wi-Fi') ? decoded : decoded;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(function () {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(function () { copyBtn.textContent = 'Copy result'; }, 1500);
                }).catch(function () {
                    copyBtn.textContent = 'Copy failed';
                    setTimeout(function () { copyBtn.textContent = 'Copy result'; }, 1500);
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
        // Clean up the global paste listener if we navigate away.
        window.addEventListener('pagehide', function () { document.removeEventListener('paste', onPaste); });
    });

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
