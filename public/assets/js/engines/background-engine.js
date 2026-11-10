/**
 * Background-removal engine — real AI cut-out via @imgly/background-removal.
 * Lazy-loads the ~1.7MB ESM module (and its model from the documented provider)
 * ONLY when remove-background is used, so the homepage and other pages stay
 * fast. The result is a genuine transparent PNG produced by the segmentation
 * model — not a fake cut-out.
 */
(function () {
    'use strict';

    function get(id) { return document.getElementById(id); }

    function renderControls(toolId, container) {
        if (!container) return;
        container.innerHTML =
            '<div class="setting-group">' +
            '<label class="setting-label" for="rb-format">Output format</label>' +
            '<select class="setting-select" id="rb-format">' +
            '<option value="image/png">PNG (keeps transparency)</option>' +
            '<option value="image/jpeg">JPG (white background)</option>' +
            '</select></div>' +
            '<p class="setting-hint">AI removes the background in your browser. The first run downloads the model (~a few MB).</p>' +
            '<div class="setting-group">' +
            '<label class="setting-label" for="rb-preview">Result preview</label>' +
            '<div class="rb-preview" id="rb-preview" aria-hidden="true"></div></div>';
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        if (!files || !files.length) throw new Error('Upload an image first.');
        onProgress(10, 'Loading AI model…');
        var mod = await import('/vendor/background/index.mjs');
        var removeBackground = mod.removeBackground || (mod.default && mod.default.removeBackground);
        if (!removeBackground) throw new Error('Background-removal module failed to load.');
        onProgress(30, 'Removing background…');
        var format = (get('rb-format') && get('rb-format').value) || 'image/png';
        var blob = await removeBackground(files[0], {
            output: { format: format === 'image/jpeg' ? 'image/jpeg' : 'image/png', quality: 0.9 },
            progress: function (key, current, total) {
                if (typeof total === 'number' && total > 0) {
                    var p = 30 + Math.round((current / total) * 60);
                    onProgress(p, 'Processing…');
                }
            }
        });
        onProgress(100, 'Done');
        var url = URL.createObjectURL(blob);
        var prev = get('rb-preview');
        if (prev) { prev.innerHTML = ''; var im = new Image(); im.src = url; prev.appendChild(im); }
        var base = (files[0].name || 'image').replace(/\.[^.]+$/, '');
        return { blob: blob, filename: base + (format === 'image/jpeg' ? '.jpg' : '-nobg.png') };
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
