/**
 * Barcode Generator engine — REAL, client-side barcode rendering via JsBarcode.
 *
 * Renders genuine, scannable barcodes into an SVG (for crisp scaling) and a
 * canvas (for PNG export). Every supported format (CODE128, CODE39, EAN-13,
 * EAN-8, UPC-A, UPC-E, ITF, Codabar) is validated by length/charset BEFORE the
 * symbol is drawn, so we never silently emit an invalid EAN/UPC code. The PNG
 * and SVG downloads are the actual rendered barcodes.
 */
(function () {
    'use strict';

    var FORMATS = {
        CODE128: { jsb: 'CODE128', label: 'Code 128' },
        CODE39: { jsb: 'CODE39', label: 'Code 39' },
        EAN13: { jsb: 'EAN13', label: 'EAN-13' },
        EAN8: { jsb: 'EAN8', label: 'EAN-8' },
        UPCA: { jsb: 'UPC', label: 'UPC-A' },
        UPCE: { jsb: 'UPCE', label: 'UPC-E' },
        ITF: { jsb: 'ITF', label: 'ITF (Interleaved 2 of 5)' },
        CODABAR: { jsb: 'Codabar', label: 'Codabar' }
    };

    function validate(fmt, value) {
        value = (value || '').trim();
        if (!value) throw new Error('Enter a value to encode.');
        switch (fmt) {
            case 'EAN13':
                if (!/^\d{12,13}$/.test(value)) throw new Error('EAN-13 needs 12 or 13 digits (13 includes the check digit).');
                break;
            case 'EAN8':
                if (!/^\d{7,8}$/.test(value)) throw new Error('EAN-8 needs 7 or 8 digits (8 includes the check digit).');
                break;
            case 'UPCA':
                if (!/^\d{11,12}$/.test(value)) throw new Error('UPC-A needs 11 or 12 digits (12 includes the check digit).');
                break;
            case 'UPCE':
                if (!/^\d{6,8}$/.test(value)) throw new Error('UPC-E needs 6, 7, or 8 digits.');
                break;
            case 'ITF':
                if (!/^\d+$/.test(value)) throw new Error('ITF needs only digits.');
                if (value.length % 2 !== 0) throw new Error('ITF needs an even number of digits (pairs).');
                break;
            case 'CODE39':
                if (!/^[0-9A-Z\-.$ /+%]+$/.test(value.toUpperCase())) throw new Error('Code 39 allows digits, A-Z, and - . $ / + % space.');
                value = value.toUpperCase();
                break;
            case 'CODABAR':
                if (!/^[0-9$:/.+\-]+$/.test(value)) throw new Error('Codabar allows digits and the symbols $ : / . + -');
                break;
            case 'CODE128':
                // Any string is valid; JsBarcode encodes it.
                break;
        }
        return value;
    }

    var lastSvg = '';
    var lastFilename = 'barcode';

    function renderControls(toolId, container) {
        if (!container) return;
        var opts = Object.keys(FORMATS).map(function (k) {
            return '<option value="' + k + '">' + FORMATS[k].label + '</option>';
        }).join('');
        container.innerHTML = `
            <div class="setting-group">
                <label class="setting-label" for="bc-type">Barcode type</label>
                <select class="setting-select" id="bc-type">${opts}</select>
            </div>
            <div class="setting-group">
                <label class="setting-label" for="bc-value">Value</label>
                <input type="text" class="setting-input" id="bc-value" placeholder="e.g. 123456789012" autocomplete="off">
            </div>
            <div class="setting-group" style="margin-bottom:1rem;">
                <label class="setting-label" for="bc-width">Bar width (<span id="bc-width-val">2</span>px)</label>
                <input type="range" class="range-slider" id="bc-width" min="1" max="6" value="2"
                       oninput="document.getElementById('bc-width-val').innerText=this.value">
            </div>
            <div class="setting-group" style="margin-bottom:1rem;">
                <label class="setting-label" for="bc-height">Height (<span id="bc-height-val">100</span>px)</label>
                <input type="range" class="range-slider" id="bc-height" min="40" max="300" value="100"
                       oninput="document.getElementById('bc-height-val').innerText=this.value">
            </div>
            <label class="setting-check"><input type="checkbox" id="bc-display" checked> Show value text below bars</label>
            <div class="setting-group" style="display:flex;gap:.75rem;margin-top:1rem;">
                <div>
                    <label class="setting-label" for="bc-fg">Bar color</label>
                    <input type="color" class="setting-color" id="bc-fg" value="#000000">
                </div>
                <div>
                    <label class="setting-label" for="bc-bg">Background</label>
                    <input type="color" class="setting-color" id="bc-bg" value="#ffffff">
                </div>
            </div>
            <div id="bc-preview" class="bc-preview" aria-live="polite" style="margin-top:1rem;"></div>
            <p class="setting-hint" id="bc-error" hidden role="alert"></p>
            <a class="btn btn-ghost bc-svg-link" id="bc-svg-link" download hidden style="margin-top:.75rem;">Download SVG</a>`;
    }

    function currentOptions() {
        var fmt = (document.getElementById('bc-type') || {}).value || 'CODE128';
        var width = parseInt((document.getElementById('bc-width') || {}).value, 10) || 2;
        var height = parseInt((document.getElementById('bc-height') || {}).value, 10) || 100;
        var display = document.getElementById('bc-display') ? document.getElementById('bc-display').checked : true;
        var fg = (document.getElementById('bc-fg') || {}).value || '#000000';
        var bg = (document.getElementById('bc-bg') || {}).value || '#ffffff';
        return {
            fmt: fmt,
            jsb: FORMATS[fmt].jsb,
            width: width,
            height: height,
            displayValue: display,
            lineColor: fg,
            background: bg,
            margin: 10
        };
    }

    function renderPreview() {
        var preview = document.getElementById('bc-preview');
        var errEl = document.getElementById('bc-error');
        var svgLink = document.getElementById('bc-svg-link');
        if (!preview) return;
        var opts = currentOptions();
        var raw = (document.getElementById('bc-value') || {}).value || '';
        var value;
        try {
            value = validate(opts.fmt, raw);
        } catch (e) {
            preview.innerHTML = '';
            lastSvg = '';
            if (svgLink) svgLink.hidden = true;
            if (errEl) { errEl.hidden = false; errEl.textContent = e.message; }
            return;
        }
        if (errEl) errEl.hidden = true;
        preview.innerHTML = '<svg id="jsb-svg" xmlns="http://www.w3.org/2000/svg"></svg>';
        var svgEl = document.getElementById('jsb-svg');
        try {
            window.JsBarcode(svgEl, value, { format: opts.jsb, width: opts.width, height: opts.height, displayValue: opts.displayValue, lineColor: opts.lineColor, background: opts.background, margin: opts.margin });
            lastSvg = svgEl.outerHTML;
            lastFilename = (opts.fmt + '-' + value).replace(/[^\w.-]/g, '_');
            if (svgLink) {
                svgLink.hidden = false;
                svgLink.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(lastSvg);
                svgLink.download = lastFilename + '.svg';
            }
        } catch (e) {
            preview.innerHTML = '';
            lastSvg = '';
            if (svgLink) svgLink.hidden = true;
            if (errEl) { errEl.hidden = false; errEl.textContent = 'Could not render: ' + (e.message || 'invalid input for this format'); }
        }
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        var opts = currentOptions();
        var raw = (document.getElementById('bc-value') || {}).value || '';
        var value = validate(opts.fmt, raw);

        // Render to canvas for the PNG download.
        var canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = opts.height + (opts.displayValue ? 40 : 20);
        window.JsBarcode(canvas, value, {
            format: opts.jsb, width: opts.width, height: opts.height,
            displayValue: opts.displayValue, lineColor: opts.lineColor,
            background: opts.background, margin: 10
        });
        onProgress(90, 'Rendering…');
        var blob = await new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/png'); });
        if (!blob) throw new Error('Failed to generate the barcode image.');
        onProgress(100, 'Done');
        return { blob: blob, filename: lastFilename + '.png' };
    }

    // Live preview wiring is attached once the DOM controls exist.
    function attachLivePreview() {
        var ids = ['bc-type', 'bc-value', 'bc-width', 'bc-height', 'bc-display', 'bc-fg', 'bc-bg'];
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', renderPreview);
                el.addEventListener('change', renderPreview);
            }
        });
    }

    window.FileGenieEngine = {
        renderControls: function (toolId, container) {
            renderControls(toolId, container);
            // Defer so the inputs are in the DOM before we bind events.
            setTimeout(attachLivePreview, 0);
            setTimeout(renderPreview, 0);
        },
        process: process
    };
})();
