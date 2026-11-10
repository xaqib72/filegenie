/**
 * Headless test of text-engine.js. Drives the real transform functions through
 * the engine's process() contract by stubbing the DOM controls it reads.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

// Fake DOM: textarea/select lookups return values we control per test.
const values = {};
function makeEl(id) {
    return {
        id,
        _value: '',
        get value() { return this._value; },
        set value(v) { this._value = v; },
        checked: false,
        hidden: false,
        set innerHTML(_) {},
        addEventListener() {},
    };
}
const els = {};
global.window = { addEventListener() {} };
global.document = {
    getElementById(id) {
        if (!els[id]) els[id] = makeEl(id);
        if (id in values) els[id].value = values[id];
        if (id in checks) els[id].checked = checks[id];
        return els[id];
    },
    createElement() { return makeEl('created'); },
};
// Checkbox states (the engine reads .checked, default HTML checkboxes use the
// `checked` attribute, not a value).
const checks = {};
global.Blob = require('buffer').Blob;
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
global.atob = (s) => Buffer.from(s, 'base64').toString('binary');

let src = fs.readFileSync(path.join(ROOT, 'public/assets/js/engines/text-engine.js'), 'utf8');
vm.runInThisContext(src);
const Engine = global.window.FileGenieEngine;

function setMany(obj) { for (const k in obj) values[k] = obj[k]; }

function blobText(blob) { return blob.arrayBuffer().then((b) => Buffer.from(b).toString('utf8')); }

async function run() {
    const results = [];
    async function check(tool, setup, expectFn, label) {
        try {
            for (const k in values) delete values[k];
            setup();
            const r = await Engine.process(tool, [], () => {});
            const txt = await blobText(r.blob);
            const ok = expectFn(txt, r);
            if (!ok) throw new Error('output did not match expectation');
            console.log('[PASS] ' + label);
            results.push('PASS ' + label);
        } catch (e) {
            console.log('[FAIL] ' + label + ' — ' + e.message);
            results.push('FAIL ' + label);
        }
    }

    await check('case-converter', () => setMany({ 'tc-input': 'Hello World', 'tc-mode': 'upper' }),
        (t) => t === 'HELLO WORLD', 'case-converter upper');
    await check('case-converter', () => setMany({ 'tc-input': 'Hello World', 'tc-mode': 'lower' }),
        (t) => t === 'hello world', 'case-converter lower');
    await check('case-converter', () => setMany({ 'tc-input': 'hello world', 'tc-mode': 'title' }),
        (t) => t === 'Hello World', 'case-converter title');
    await check('case-converter', () => setMany({ 'tc-input': 'hello. world', 'tc-mode': 'sentence' }),
        (t) => t === 'Hello. World', 'case-converter sentence');
    await check('case-converter', () => setMany({ 'tc-input': 'hello', 'tc-mode': 'alternating' }),
        (t) => t === 'HeLlO', 'case-converter alternating');

    await check('word-counter', () => setMany({ 'wc-input': 'one two three four' }),
        (t) => t.includes('Words: 4') && t.includes('Characters: 18'), 'word-counter counts');

    await check('remove-duplicate-lines', () => {
        setMany({ 'dup-input': 'a\nb\na\nb\n' });
        checks['dup-ignore-case'] = false; checks['dup-drop-blank'] = false;
    }, (t) => t.split('\n').filter((l) => l).length === 2, 'remove-duplicate-lines');

    await check('sort-lines', () => setMany({ 'sort-input': 'banana\napple\ncherry', 'sort-dir': 'asc' }),
        (t) => t === 'apple\nbanana\ncherry', 'sort-lines asc');

    await check('text-cleaner', () => {
        setMany({ 'clean-input': 'a   b\n\n  c  \n' });
        checks['clean-trim'] = true; checks['clean-spaces'] = true;
        checks['clean-blank'] = true; checks['clean-crlf'] = true;
    }, (t) => t === 'a b\n c', 'text-cleaner');

    await check('text-compare', () => setMany({ 'cmp-a': 'a\nb\nc', 'cmp-b': 'a\nx\nc' }),
        (t) => t.includes('- b') && t.includes('+ x'), 'text-compare diff');

    await check('font-styler', () => {
        setMany({ 'fs-input': 'Hello', 'fs-style': 'bold' });
        checks['clean-trim'] = false; checks['clean-spaces'] = false;
        checks['clean-blank'] = false; checks['clean-crlf'] = false;
    }, (t) => t === String.fromCodePoint(0x1D407, 0x1D41E, 0x1D425, 0x1D425, 0x1D428),
        'font-styler bold');

    await check('text-formatter', () => setMany({ 'fmt-input': '{"b":2,"a":1}', 'fmt-mode': 'json-pretty' }),
        (t) => t.includes('\n  "a": 1'), 'text-formatter pretty');

    const fails = results.filter((r) => r.startsWith('FAIL')).length;
    console.log('\n==== Text engine: ' + results.length + ' ops, ' + fails + ' failed ====');
    process.exit(fails === 0 ? 0 : 1);
}
run();
