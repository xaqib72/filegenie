/**
 * OCR engine — REAL, client-side text extraction via Tesseract.js.
 *
 * The Tesseract worker + core wasm + English traineddata are loaded LAZILY on the
 * first run from local vendor files (never a CDN), so this tool adds zero weight
 * to the homepage or other pages. It returns the genuinely recognized text and
 * offers Copy / Download TXT. Output is shown via textContent (untrusted-ish
 * input → safe rendering).
 */
(function () {
    'use strict';

    var workerPromise = null;
    var TesseractRef = null;

    function loadTesseract() {
        if (TesseractRef) return Promise.resolve(TesseractRef);
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = '/vendor/tesseract/tesseract.min.js';
            s.onload = function () { resolve(window.Tesseract); };
            s.onerror = function () { reject(new Error('Could not load the OCR engine.')); };
            document.head.appendChild(s);
        }).then(function (lib) {
            TesseractRef = lib;
            return lib;
        });
    }

    function getWorker(onProgress) {
        if (workerPromise) return workerPromise;
        workerPromise = loadTesseract().then(function (Tesseract) {
            var worker = awaitWorker(Tesseract, onProgress);
            return worker;
        });
        return workerPromise;
    }

    function awaitWorker(Tesseract, onProgress) {
        return Tesseract.createWorker('eng', 1, {
            workerPath: '/vendor/tesseract/worker.min.js',
            corePath: '/vendor/tesseract/',
            langPath: '/vendor/tesseract/',
            logger: function (m) {
                if (onProgress && m && m.status === 'recognizing text') {
                    onProgress(Math.max(5, Math.min(95, Math.round(m.progress * 100))), 'Reading text ' + Math.round(m.progress * 100) + '%');
                }
            }
        });
    }

    function renderControls(toolId, container) {
        if (!container) return;
        container.innerHTML = `
            <div class="setting-group">
                <label class="setting-label" for="ocr-lang">Language model</label>
                <select class="setting-select" id="ocr-lang">
                    <option value="eng" selected>English</option>
                </select>
            </div>
            <div class="setting-group" style="margin-bottom:1rem;">
                <label class="setting-label" for="ocr-psm">Layout</label>
                <select class="setting-select" id="ocr-psm">
                    <option value="3" selected>Automatic (mixed)</option>
                    <option value="6">Block of text</option>
                    <option value="4">Single column</option>
                    <option value="11">Sparse text</option>
                </select>
            </div>
            <div id="ocr-output" class="ocr-output" aria-live="polite" style="margin-top:1rem;"></div>
            <div class="ws-actions" id="ocr-actions" hidden>
                <button class="btn btn-primary" id="ocr-copy" type="button">Copy text</button>
                <button class="btn btn-ghost" id="ocr-download" type="button">Download TXT</button>
                <button class="btn btn-ghost" id="ocr-reset" type="button">Clear</button>
            </div>`;
    }

    var lastText = '';

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        if (!files || !files.length) throw new Error('Add an image first.');
        onProgress(5, 'Loading OCR engine…');
        var worker = await getWorker(onProgress);
        onProgress(30, 'Reading image…');
        var result = await worker.recognize(files[0], {}, { psm: parseInt((document.getElementById('ocr-psm') || {}).value, 10) || 3 });
        var text = (result && result.data && result.data.text) ? result.data.text.trim() : '';
        lastText = text;
        showText(text);
        onProgress(100, 'Done');
        return { blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), filename: (files[0].name || 'image').replace(/\.[^.]+$/, '') + '-text.txt' };
    }

    function showText(text) {
        var out = document.getElementById('ocr-output');
        var actions = document.getElementById('ocr-actions');
        if (!out) return;
        out.textContent = '';
        if (!text) {
            var p = document.createElement('p');
            p.className = 'setting-hint';
            p.textContent = 'No text was detected in this image. Try a clearer, higher-resolution photo.';
            out.appendChild(p);
        } else {
            var pre = document.createElement('pre');
            pre.className = 'ocr-text';
            pre.textContent = text;       // safe: textContent only
            out.appendChild(pre);
        }
        if (actions) actions.hidden = false;

        var copyBtn = document.getElementById('ocr-copy');
        if (copyBtn) copyBtn.onclick = function () {
            if (navigator.clipboard && navigator.clipboard.writeText && lastText) {
                navigator.clipboard.writeText(lastText).then(function () {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(function () { copyBtn.textContent = 'Copy text'; }, 1500);
                }).catch(function () {});
            }
        };
        var dlBtn = document.getElementById('ocr-download');
        if (dlBtn) dlBtn.onclick = function () {
            if (!lastText) return;
            var blob = new Blob([lastText], { type: 'text/plain;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'filegenie-ocr.txt';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        };
        var resetBtn = document.getElementById('ocr-reset');
        if (resetBtn) resetBtn.onclick = function () {
            if (window.FileGenieWorkspace) window.FileGenieWorkspace.reset();
        };
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
