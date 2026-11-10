/**
 * Headless test of the real image-engine.js using node-canvas (a real canvas)
 * so the actual drawImage / toBlob / rotate / crop logic is exercised.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const canvas = require('canvas'); // node-canvas provides Image, canvas, toBlob
const JSZip = require(path.join(__dirname, '..', 'node_modules/jszip'));

const ROOT = path.resolve(__dirname, '..');
function makeEl(id, val) {
    return {
        id, _value: val ?? '', checked: false,
        get value() { return this._value; }, set value(v) { this._value = v; },
        set innerHTML(_) {},
    };
}
const controlValues = {
    'img-quality': '50', 'img-out-fmt': 'image/jpeg',
    'img-width': '100', 'img-height': '', 'img-scale': '', 'img-lock': true,
    'crop-x': '10', 'crop-y': '10', 'crop-w': '50', 'crop-h': '50', 'crop-ratio': '',
    'conv-fmt': 'image/png', 'wm-text': 'TEST', 'wm-opacity': '50', 'wm-position': 'center', 'wm-tile': false,
    'rot-dir': '90', 'rc-radius': '30', 'rc-circle': false, 'rc-fmt': 'image/png', 'exif-fmt': 'image/jpeg',
};
const elements = {};
global.window = { JSZip, addEventListener() {} };
global.document = {
    getElementById: (id) => {
        if (!elements[id]) elements[id] = makeEl(id, controlValues[id]);
        return elements[id];
    },
    createElement: (tag) => {
        if (tag === 'canvas') {
            const c = canvas.createCanvas(1, 1);
            c.toBlob = (cb, type, q) => {
                const buf = c.toBuffer(type || 'image/png', { quality: q || 0.92 });
                cb(new Blob([buf], { type: type || 'image/png' }));
            };
            return c;
        }
        return {};
    },
};
// Use node-canvas's Image + canvas.toBlob (Node 24 supplies global Blob).
global.Image = canvas.Image;
global.URL = {
    createObjectURL: (f) => {
        // Build a real data URL from the file bytes so node-canvas can decode it.
        const b = f._bytes ? f._bytes : null;
        return 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64');
    },
    revokeObjectURL() {}
};
global.atob = (s) => Buffer.from(s, 'base64').toString('binary');

let src = fs.readFileSync(path.join(ROOT, 'public/assets/js/engines/image-engine.js'), 'utf8');
vm.runInThisContext(src);
const Engine = global.window.FileGenieEngine;

function fileFromPath(p, name) {
    const buf = fs.readFileSync(p);
    return { name, size: buf.length, _bytes: buf, arrayBuffer: async () => new Uint8Array(buf).buffer };
}
function blobToBuffer(blob) {
    // node-canvas Blob has .data (Uint8Array) / .arrayBuffer()
    return blob.arrayBuffer ? blob.arrayBuffer().then(b => Buffer.from(b)) : Promise.resolve(blob.data || blob);
}

(async () => {
    const FX = path.join(ROOT, 'tests/fixtures');
    const pngPath = path.join(FX, 'sample.png'); // 400x300? check
    const { width, height } = (() => { const i = new canvas.Image(); i.src = fs.readFileSync(pngPath); return i; })();
    console.log('sample.png dimensions:', width + 'x' + height);

    const ops = [
        ['compress-image', () => fileFromPath(pngPath, 'sample.png')],
        ['resize-image', () => fileFromPath(pngPath, 'sample.png')],
        ['crop-image', () => fileFromPath(pngPath, 'sample.png')],
        ['convert-image', () => fileFromPath(pngPath, 'sample.png')],
        ['add-watermark', () => fileFromPath(pngPath, 'sample.png')],
        ['rotate-image', () => fileFromPath(pngPath, 'sample.png')],
        ['round-corners', () => fileFromPath(pngPath, 'sample.png')],
        ['strip-exif', () => fileFromPath(pngPath, 'sample.png')],
    ];

    const results = [];
    for (const [tool, mk] of ops) {
        try {
            const r = await Engine.process(tool, [mk()], () => {});
            // r.blob or r.blob for zip
            let buf;
            if (r.blob && r.blob.type === 'application/zip') {
                const z = await JSZip.loadAsync(await r.blob.arrayBuffer());
                const names = Object.keys(z.files);
                buf = await z.files[names[0]].async('nodebuffer');
                console.log('[PASS] ' + tool + ' → ZIP (' + names.length + ' files)');
            } else {
                buf = await blobToBuffer(r.blob);
                console.log('[PASS] ' + tool + ' → ' + r.filename + ' (' + buf.length + ' bytes)');
            }
            if (!buf || buf.length < 50) throw new Error('suspiciously small output (' + (buf && buf.length) + ')');
            results.push('PASS ' + tool);
        } catch (e) {
            console.log('[FAIL] ' + tool + ' — ' + e.message);
            results.push('FAIL ' + tool);
        }
    }
    const fails = results.filter(r => r.startsWith('FAIL')).length;
    console.log('\n==== Image engine: ' + results.length + ' ops, ' + fails + ' failed ====');
    process.exit(fails === 0 ? 0 : 1);
})();
