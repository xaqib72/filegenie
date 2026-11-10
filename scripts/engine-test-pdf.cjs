/**
 * Headless test of the REAL browser pdf-engine.js, evaluated in the MAIN realm
 * (so pdf-lib's Array/PDFPage class checks pass — the browser shares one realm).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PDFLib = require(path.join(ROOT, 'node_modules/pdf-lib/dist/pdf-lib.js'));
const JSZip = require(path.join(ROOT, 'node_modules/jszip'));

const controlValues = {
    'pdf-split-ranges': '1-2',
    'pdf-delete-ranges': '2',
    'pdf-order': '3,1,2',
    'pdf-rotate-angle': '90',
    'jpg-pdf-fit': 'image',
    'pdf-jpg-scale': '2',
    'pdf-compress-level': 'recommended',
};
function makeEl(id) {
    return {
        id,
        _value: controlValues[id] ?? '',
        get value() { return this._value; },
        set value(v) { this._value = v; },
        set innerHTML(_) {},
    };
}
const elements = {};
global.window = {
    PDFLib,
    JSZip,
    addEventListener() {},
};
global.document = {
    getElementById: (id) => (elements[id] = elements[id] || makeEl(id)),
    createElement: () => ({ getContext: () => ({}), toDataURL: () => 'data:image/png;base64,' }),
};
global.Blob = class {
    constructor(parts, opts) { this.parts = parts; this.type = (opts && opts.type) || ''; this._bytes = parts[0]; }
};

let engineSrc = fs.readFileSync(path.join(ROOT, 'public/assets/js/engines/pdf-engine.js'), 'utf8');
// Replace the dynamic browser import with a real fs-backed pdfjs loader.
const pdfjsPath = path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs').replace(/\\/g, '/');
const workerPath = path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs').replace(/\\/g, '/');
engineSrc = engineSrc.replace(
    "var pdfjs = await import('/vendor/pdfjs/pdf.min.mjs');",
    "var pdfjs = await __loadPdfJs();"
);
const workerFileUrl = 'file://' + workerPath;
engineSrc = engineSrc.replace(
    "pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs';",
    "pdfjs.GlobalWorkerOptions.workerSrc = '" + workerFileUrl + "';"
);
global.__loadPdfJs = async () => {
    const mod = await import('file://' + pdfjsPath);
    mod.GlobalWorkerOptions.workerSrc = 'file://' + workerPath;
    return mod;
};

// Evaluate engine in main realm.
vm.runInThisContext(engineSrc);
const Engine = global.window.FileGenieEngine;

function fileFromBytes(bytes, name) {
    const buf = Buffer.from(bytes);
    return { name, size: buf.length, arrayBuffer: async () => new Uint8Array(buf).buffer };
}
async function pdfPageCount(bytes) {
    const d = await PDFLib.PDFDocument.load(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
    return d.getPageCount();
}

(async () => {
    const FX = path.join(ROOT, 'tests/fixtures');
    const aPdf = new Uint8Array(fs.readFileSync(path.join(FX, 'a.pdf')));     // 3 pages
    const bPdf = new Uint8Array(fs.readFileSync(path.join(FX, 'b.pdf')));     // 1 page
    const jpg = new Uint8Array(fs.readFileSync(path.join(FX, 'sample.jpg')));

    const results = [];
    async function check(name, fn) {
        try { await fn(); results.push('PASS ' + name); console.log('[PASS] ' + name); }
        catch (e) { results.push('FAIL ' + name + ' — ' + e.message); console.log('[FAIL] ' + name + ' — ' + e.message); }
    }

    await check('merge-pdf (3+1→4)', async () => {
        const r = await Engine.process('merge-pdf', [fileFromBytes(aPdf, 'a.pdf'), fileFromBytes(bPdf, 'b.pdf')], () => {});
        if ((await pdfPageCount(r.blob._bytes)) !== 4) throw new Error('not 4 pages');
    });
    await check('split-pdf (1-2 → 2 pages)', async () => {
        const r = await Engine.process('split-pdf', [fileFromBytes(aPdf, 'a.pdf')], () => {});
        const c = await pdfPageCount(r.blob._bytes);
        if (c !== 2) throw new Error('expected 2 pages, got ' + c);
    });
    await check('delete-pdf-pages (remove 2 → 2 left)', async () => {
        const r = await Engine.process('delete-pdf-pages', [fileFromBytes(aPdf, 'a.pdf')], () => {});
        const c = await pdfPageCount(r.blob._bytes);
        if (c !== 2) throw new Error('expected 2 pages, got ' + c);
    });
    await check('reorder-pdf-pages (3,1,2)', async () => {
        const r = await Engine.process('reorder-pdf-pages', [fileFromBytes(aPdf, 'a.pdf')], () => {});
        const c = await pdfPageCount(r.blob._bytes);
        if (c !== 3) throw new Error('expected 3 pages, got ' + c);
    });
    await check('rotate-pdf-pages (90)', async () => {
        const r = await Engine.process('rotate-pdf-pages', [fileFromBytes(aPdf, 'a.pdf')], () => {});
        const c = await pdfPageCount(r.blob._bytes);
        if (c !== 3) throw new Error('expected 3 pages, got ' + c);
    });
    await check('jpg-to-pdf (1 jpg → 1 page)', async () => {
        const r = await Engine.process('jpg-to-pdf', [fileFromBytes(jpg, 'sample.jpg')], () => {});
        const c = await pdfPageCount(r.blob._bytes);
        if (c !== 1) throw new Error('expected 1 page, got ' + c);
    });
    await check('compress-pdf (re-save)', async () => {
        const r = await Engine.process('compress-pdf', [fileFromBytes(aPdf, 'a.pdf')], () => {});
        const c = await pdfPageCount(r.blob._bytes);
        if (c !== 3) throw new Error('expected 3 pages, got ' + c);
    });
    await check('pdf-to-jpg (3 pages → zip)', async () => {
        const r = await Engine.process('pdf-to-jpg', [fileFromBytes(aPdf, 'a.pdf')], () => {});
        if (!r.blob.type.includes('zip')) throw new Error('expected zip, got ' + r.blob.type);
    });

    const fails = results.filter((r) => r.startsWith('FAIL')).length;
    console.log('\n==== PDF engine: ' + results.length + ' ops, ' + fails + ' failed ====');
    process.exit(fails === 0 ? 0 : 1);
})();
