/**
 * HEIC → JPG engine — real decode via heic2any (libde265 WASM). The UMD script
 * sets window.heic2any and is loaded by show.php as a deferred script. This
 * engine calls window.heic2any({ blob }) which decodes the HEIC and re-encodes
 * to JPEG/PNG — a genuine conversion, never a rename or byte copy.
 */
(function () {
    'use strict';

    function get(id) { return document.getElementById(id); }

    function renderControls(toolId, container) {
        if (!container) return;
        container.innerHTML =
            '<div class="setting-group">' +
            '<label class="setting-label" for="heic-format">Convert to</label>' +
            '<select class="setting-select" id="heic-format">' +
            '<option value="image/jpeg">JPG</option>' +
            '<option value="image/png">PNG</option>' +
            '</select></div>' +
            '<p class="setting-hint">HEIC photos from iPhone are decoded entirely in your browser.</p>';
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        if (!files || !files.length) throw new Error('Upload a .heic photo first.');
        if (!window.heic2any) throw new Error('HEIC decoder is still loading — try again in a moment.');
        var toType = (get('heic-format') && get('heic-format').value) || 'image/jpeg';
        var ext = toType === 'image/png' ? 'png' : 'jpg';
        var outputs = [];
        for (var i = 0; i < files.length; i++) {
            onProgress(Math.round((i / files.length) * 90) + 5, 'Decoding ' + (i + 1) + ' of ' + files.length + '…');
            var result = await window.heic2any({ blob: files[i], toType: toType, quality: 0.92 });
            var out = Array.isArray(result) ? result[0] : result;
            if (!out) throw new Error('Could not decode this HEIC file.');
            var base = (files[i].name || 'image').replace(/\.[^.]+$/, '');
            outputs.push({ blob: out, filename: base + '.' + ext });
        }
        onProgress(100, 'Done');
        if (outputs.length === 1) return outputs[0];
        if (!window.JSZip) throw new Error('Batch output packaging is unavailable. Please reload the page and try again.');
        var zip = new window.JSZip();
        outputs.forEach(function (item) { zip.file(item.filename, item.blob); });
        return { blob: await zip.generateAsync({ type: 'blob' }), filename: 'filegenie-heic-converted.zip' };
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
