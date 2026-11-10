/*
 * FileGenie 60-tool functional matrix.
 *
 * This is intentionally a browser test: it uploads real fixtures through the
 * rendered workspace, clicks the real Process action, captures the real blob
 * download, and validates output signatures/content. It is not a route-only
 * page checker.
 *
 * Run from the project root with:
 *   NODE_PATH=/tmp/filegenie-browser/node_modules \
 *   BASE=http://127.0.0.1:8085 \
 *   CHROME_PATH=/root/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome \
 *   node tests/acceptance60.cjs
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE || 'http://127.0.0.1:8082';
const CHROME = process.env.CHROME_PATH;
const ROOT = path.resolve(__dirname, '..');
const FX = path.join(__dirname, 'fixtures');
const STORAGE_FX = path.join(ROOT, 'storage', 'fixtures');
const EVID = path.join(__dirname, 'evidence', 'qa60');
fs.mkdirSync(EVID, { recursive: true });

const results = [];
const file = (name) => path.join(FX, name);
const storageFile = (name) => path.join(STORAGE_FX, name);

function signature(buffer, kind) {
    if (!buffer || buffer.length === 0) return false;
    const ascii = buffer.subarray(0, Math.min(buffer.length, 512)).toString('latin1');
    if (kind === 'pdf') return ascii.startsWith('%PDF-');
    if (kind === 'zip') return buffer[0] === 0x50 && buffer[1] === 0x4b;
    if (kind === 'png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (kind === 'jpg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
    if (kind === 'gif') return ascii.startsWith('GIF8');
    if (kind === 'ico') return buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0;
    if (kind === 'webp') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
    if (kind === 'wav') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE';
    if (kind === 'mp4') return ascii.includes('ftyp');
    if (kind === 'webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (kind === 'mp3') return ascii.startsWith('ID3') || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    if (kind === 'ogg') return ascii.startsWith('OggS');
    if (kind === 'flac') return ascii.startsWith('fLaC');
    if (kind === 'm4a') return ascii.includes('ftyp');
    if (kind === 'text') return buffer.toString('utf8').length > 0;
    return buffer.length > 0;
}

function validateOutput(outputPath, kind, contains) {
    const buffer = fs.readFileSync(outputPath);
    const validSignature = signature(buffer, kind);
    const text = buffer.toString('utf8');
    const containsOk = !contains || text.includes(contains);
    return { validSignature, containsOk, bytes: buffer.length, contains: containsOk ? contains || '' : text.slice(0, 120) };
}

function fieldConfig(fields) {
    return Object.entries(fields || {}).map(([selector, value]) => ({ selector, value }));
}

async function setField(page, selector, value) {
    const node = page.locator(selector);
    await node.waitFor({ state: 'visible', timeout: 15000 });
    const tag = await node.evaluate((el) => el.tagName.toLowerCase());
    if (tag === 'select') await node.selectOption(String(value));
    else if (tag === 'input' && (await node.getAttribute('type')) === 'checkbox') {
        if (Boolean(value) !== await node.isChecked()) await node.check();
    } else await node.fill(String(value));
}

async function captureDownload(page, route, config, index) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => window.FileGenieWorkspace && window.FileGenieEngine, null, { timeout: 30000 });

    if (config.files) {
        await page.setInputFiles('#file-input', config.files);
        await page.waitForSelector('#ws-active:not([hidden])', { timeout: 20000 });
    }
    for (const { selector, value } of fieldConfig(config.fields)) await setField(page, selector, value);
    await page.click('#process-btn');
    await page.waitForSelector('#result:not([hidden])', { timeout: config.timeout || 180000 });

    const outputName = `${String(index + 1).padStart(2, '0')}-${config.slug}.${config.ext || 'out'}`;
    const outputPath = path.join(EVID, outputName);
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        page.click('#download-btn'),
    ]);
    await download.saveAs(outputPath);
    return { outputPath, filename: download.suggestedFilename() };
}

async function runCase(page, config, index) {
    const started = Date.now();
    try {
        const captured = await captureDownload(page, config.route, config, index);
        const output = validateOutput(captured.outputPath, config.kind, config.contains);
        const pass = output.validSignature && output.containsOk;
        const result = {
            route: config.route,
            tool: config.slug,
            engine: config.engine,
            fixture: (config.files || []).map((f) => path.basename(f)),
            action_executed: 'Uploaded fixture(s), applied controls, clicked Process, downloaded blob',
            output_validated: `${config.kind} signature${config.contains ? ` + content contains ${JSON.stringify(config.contains)}` : ''}`,
            browser: 'Chromium 156 Playwright',
            result: pass ? 'PASS' : 'FAIL',
            issue: pass ? '' : `signature=${output.validSignature} contains=${output.containsOk}`,
            evidence: `${path.relative(ROOT, captured.outputPath)}; ${output.bytes} bytes; ${Date.now() - started}ms`,
            downloaded_filename: captured.filename,
        };
        results.push(result);
        console.log(`${pass ? 'PASS' : 'FAIL'} | ${config.slug} | ${captured.filename} | ${output.bytes} bytes`);
        return { ...result, outputPath: captured.outputPath };
    } catch (error) {
        const result = {
            route: config.route,
            tool: config.slug,
            engine: config.engine,
            fixture: (config.files || []).map((f) => path.basename(f)),
            action_executed: 'Attempted real browser operation',
            output_validated: 'No output available',
            browser: 'Chromium 156 Playwright',
            result: 'FAIL',
            issue: error.message,
            evidence: `failure after ${Date.now() - started}ms`,
        };
        results.push(result);
        console.log(`FAIL | ${config.slug} | ${error.message}`);
        return result;
    }
}

const cases = [
    // PDF — 13
    { slug: 'merge-pdf', route: '/pdf-tools/merge-pdf', engine: 'pdf', files: [file('a.pdf'), file('b.pdf')], kind: 'pdf', ext: 'pdf' },
    { slug: 'split-pdf', route: '/pdf-tools/split-pdf', engine: 'pdf', files: [file('a.pdf')], fields: { '#pdf-split-ranges': '1-2' }, kind: 'pdf', ext: 'pdf' },
    { slug: 'compress-pdf', route: '/pdf-tools/compress-pdf', engine: 'pdf', files: [file('a.pdf')], kind: 'pdf', ext: 'pdf' },
    { slug: 'jpg-to-pdf', route: '/pdf-tools/jpg-to-pdf', engine: 'pdf', files: [file('img-1.png'), file('img-2.png')], kind: 'pdf', ext: 'pdf' },
    { slug: 'pdf-to-jpg', route: '/pdf-tools/pdf-to-jpg', engine: 'pdf', files: [file('a.pdf')], kind: 'zip', ext: 'zip' },
    { slug: 'rotate-pdf-pages', route: '/pdf-tools/rotate-pdf-pages', engine: 'pdf', files: [file('a.pdf')], fields: { '#pdf-rotate-angle': '90' }, kind: 'pdf', ext: 'pdf' },
    { slug: 'reorder-pdf-pages', route: '/pdf-tools/reorder-pdf-pages', engine: 'pdf', files: [file('a.pdf')], fields: { '#pdf-order': '3,1,2' }, kind: 'pdf', ext: 'pdf' },
    { slug: 'delete-pdf-pages', route: '/pdf-tools/delete-pdf-pages', engine: 'pdf', files: [file('a.pdf')], fields: { '#pdf-delete-ranges': '1' }, kind: 'pdf', ext: 'pdf' },
    { slug: 'add-page-numbers', route: '/pdf-tools/add-page-numbers', engine: 'pdf', files: [file('a.pdf')], kind: 'pdf', ext: 'pdf' },
    { slug: 'watermark-pdf', route: '/pdf-tools/watermark-pdf', engine: 'pdf', files: [file('a.pdf')], fields: { '#wm-text': 'QA FILEGENIE' }, kind: 'pdf', ext: 'pdf' },
    { slug: 'extract-pdf-pages', route: '/pdf-tools/extract-pdf-pages', engine: 'pdf', files: [file('a.pdf')], fields: { '#ex-pages': '1-2' }, kind: 'pdf', ext: 'pdf' },
    { slug: 'protect-pdf', route: '/pdf-tools/protect-pdf', engine: 'pdf-secure', files: [file('a.pdf')], fields: { '#sec-open-pw': 'secret123' }, kind: 'pdf', ext: 'pdf' },
    { slug: 'unlock-pdf', route: '/pdf-tools/unlock-pdf', engine: 'pdf-secure', files: [], fields: { '#sec-unlock-pw': 'secret123' }, kind: 'pdf', ext: 'pdf' },

    // Images — 14 (batch operations use multiple real fixtures where useful)
    { slug: 'compress-image', route: '/image-tools/compress-image', engine: 'image', files: [file('img-1.png'), file('img-2.png')], fields: { '#img-out-fmt': 'image/jpeg' }, kind: 'zip', ext: 'zip' },
    { slug: 'resize-image', route: '/image-tools/resize-image', engine: 'image', files: [file('img-1.png'), file('img-2.png')], fields: { '#img-width': '320', '#img-height': '240' }, kind: 'zip', ext: 'zip' },
    { slug: 'crop-image', route: '/image-tools/crop-image', engine: 'image', files: [file('img-1.png')], fields: { '#crop-w': '200', '#crop-h': '160' }, kind: 'jpg', ext: 'jpg' },
    { slug: 'convert-image', route: '/image-tools/convert-image', engine: 'image', files: [file('img-1.png'), file('img-2.png')], fields: { '#conv-fmt': 'image/jpeg' }, kind: 'zip', ext: 'zip' },
    { slug: 'remove-background', route: '/image-tools/remove-background', engine: 'background', files: [file('bg-person.png')], fields: { '#rb-format': 'image/png' }, kind: 'png', ext: 'png', timeout: 300000 },
    { slug: 'add-watermark', route: '/image-tools/add-watermark', engine: 'image', files: [file('img-1.png'), file('img-2.png')], fields: { '#wm-text': 'FILEGENIE QA' }, kind: 'zip', ext: 'zip' },
    { slug: 'rotate-image', route: '/image-tools/rotate-image', engine: 'image', files: [file('img-1.png'), file('img-2.png')], fields: { '#rot-dir': '90' }, kind: 'zip', ext: 'zip' },
    { slug: 'round-corners', route: '/image-tools/round-corners', engine: 'image', files: [file('img-1.png')], fields: { '#rc-fmt': 'image/png' }, kind: 'png', ext: 'png' },
    { slug: 'heic-to-jpg', route: '/image-tools/heic-to-jpg', engine: 'heic', files: [file('heic-1.heic'), file('heic-2.heic')], fields: { '#heic-format': 'image/jpeg' }, kind: 'zip', ext: 'zip', timeout: 180000 },
    { slug: 'strip-exif', route: '/image-tools/strip-exif', engine: 'image', files: [file('sample.jpg'), file('sample.jpg')], fields: { '#exif-fmt': 'image/jpeg' }, kind: 'zip', ext: 'zip' },
    { slug: 'image-to-text', route: '/image-tools/image-to-text', engine: 'ocr', files: [storageFile('ocr_0.png')], kind: 'text', ext: 'txt', contains: 'FileGenie', timeout: 300000 },
    { slug: 'image-upscaler', route: '/image-tools/image-upscaler', engine: 'upscaler', files: [storageFile('blank.png')], kind: 'png', ext: 'png', timeout: 300000 },
    { slug: 'add-text-to-image', route: '/image-tools/add-text-to-image', engine: 'image', files: [file('img-1.png')], fields: { '#ati-text': 'FILEGENIE QA' }, kind: 'jpg', ext: 'jpg' },
    { slug: 'rotate-flip-image', route: '/image-tools/rotate-flip-image', engine: 'image', files: [file('img-1.png')], fields: { '#rot-dir': 'flip-h' }, kind: 'jpg', ext: 'jpg' },

    // Video — 8
    { slug: 'compress-video', route: '/video-tools/compress-video', engine: 'ffmpeg', files: [file('test.mp4')], kind: 'webm', ext: 'webm', timeout: 300000 },
    { slug: 'trim-video', route: '/video-tools/trim-video', engine: 'ffmpeg', files: [file('test.mp4')], fields: { '#ff-trim-start': '0', '#ff-trim-end': '1' }, kind: 'mp4', ext: 'mp4', timeout: 300000 },
    { slug: 'mute-video', route: '/video-tools/mute-video', engine: 'ffmpeg', files: [file('test.mp4')], kind: 'mp4', ext: 'mp4', timeout: 300000 },
    { slug: 'video-to-gif', route: '/video-tools/video-to-gif', engine: 'ffmpeg', files: [file('test.mp4')], fields: { '#ff-gif-fps': '8', '#ff-gif-width': '320' }, kind: 'gif', ext: 'gif', timeout: 300000 },
    { slug: 'resize-video', route: '/video-tools/resize-video', engine: 'ffmpeg', files: [file('test.mp4')], fields: { '#ff-resize-w': '320', '#ff-resize-h': '0' }, kind: 'webm', ext: 'webm', timeout: 300000 },
    { slug: 'extract-audio', route: '/video-tools/extract-audio', engine: 'ffmpeg', files: [file('test.mp4')], kind: 'mp3', ext: 'mp3', timeout: 300000 },
    { slug: 'mov-to-mp4', route: '/video-tools/mov-to-mp4', engine: 'ffmpeg', files: [storageFile('sample.mov')], kind: 'mp4', ext: 'mp4', timeout: 300000 },
    { slug: 'mkv-to-mp4', route: '/video-tools/mkv-to-mp4', engine: 'ffmpeg', files: [storageFile('sample.mkv')], kind: 'mp4', ext: 'mp4', timeout: 300000 },

    // Audio — 7
    { slug: 'audio-converter', route: '/audio-tools/audio-converter', engine: 'ffmpeg', files: [file('a.mp3'), file('b.mp3')], kind: 'zip', ext: 'zip', timeout: 300000 },
    { slug: 'trim-audio', route: '/audio-tools/trim-audio', engine: 'ffmpeg', files: [file('a.mp3')], fields: { '#ff-audio-start': '0', '#ff-audio-end': '1' }, kind: 'mp3', ext: 'mp3', timeout: 300000 },
    { slug: 'merge-audio', route: '/audio-tools/merge-audio', engine: 'ffmpeg', files: [file('a.mp3'), file('b.mp3')], kind: 'mp3', ext: 'mp3', timeout: 300000 },
    { slug: 'change-speed', route: '/audio-tools/change-speed', engine: 'ffmpeg', files: [file('a.mp3')], fields: { '#ff-speed': '1.5' }, kind: 'mp3', ext: 'mp3', timeout: 300000 },
    { slug: 'audio-to-mono', route: '/audio-tools/audio-to-mono', engine: 'ffmpeg', files: [file('a.mp3')], kind: 'mp3', ext: 'mp3', timeout: 300000 },
    { slug: 'volume-boost', route: '/audio-tools/volume-boost', engine: 'ffmpeg', files: [file('a.mp3')], fields: { '#ff-gain': '1.5' }, kind: 'mp3', ext: 'mp3', timeout: 300000 },
    { slug: 'm4a-to-mp3', route: '/audio-tools/m4a-to-mp3', engine: 'ffmpeg', files: [storageFile('sample.m4a')], kind: 'mp3', ext: 'mp3', timeout: 300000 },

    // Text — 8
    { slug: 'case-converter', route: '/text-tools/case-converter', engine: 'text', fields: { '#tc-mode': 'upper', '#tc-input': 'FileGenie Unicode QA' }, kind: 'text', ext: 'txt', contains: 'FILEGENIE' },
    { slug: 'word-counter', route: '/text-tools/word-counter', engine: 'text', fields: { '#wc-input': 'One two three four' }, kind: 'text', ext: 'txt', contains: 'Words' },
    { slug: 'remove-duplicate-lines', route: '/text-tools/remove-duplicate-lines', engine: 'text', fields: { '#dup-input': 'alpha\nbeta\nalpha' }, kind: 'text', ext: 'txt', contains: 'alpha' },
    { slug: 'sort-lines', route: '/text-tools/sort-lines', engine: 'text', fields: { '#sort-input': 'zulu\nalpha\nmid' }, kind: 'text', ext: 'txt', contains: 'alpha' },
    { slug: 'text-cleaner', route: '/text-tools/text-cleaner', engine: 'text', fields: { '#clean-input': '  messy   text  \n\n clean  ' }, kind: 'text', ext: 'txt', contains: 'messy' },
    { slug: 'text-compare', route: '/text-tools/text-compare', engine: 'text', fields: { '#cmp-a': 'one\ntwo', '#cmp-b': 'one\nthree' }, kind: 'text', ext: 'txt', contains: 'three' },
    { slug: 'font-styler', route: '/text-tools/font-styler', engine: 'text', fields: { '#fs-input': 'FileGenie' }, kind: 'text', ext: 'txt' },
    { slug: 'text-formatter', route: '/text-tools/text-formatter', engine: 'text', fields: { '#fmt-input': '{"name":"FileGenie","tools":60}', '#fmt-mode': 'json-pretty' }, kind: 'text', ext: 'json', contains: 'FileGenie' },

    // Utilities — 10. QR/barcode reader inputs are filled from generated output.
    { slug: 'password-generator', route: '/utility-tools/password-generator', engine: 'utility', fields: {}, kind: 'text', ext: 'txt' },
    { slug: 'qr-code-generator', route: '/utility-tools/qr-code-generator', engine: 'utility', fields: { '#qr-input-text': 'https://example.test/filegenie-qr' }, kind: 'png', ext: 'png' },
    { slug: 'color-picker', route: '/utility-tools/color-picker', engine: 'utility', fields: { '#color-picker-input': '#635bff' }, kind: 'png', ext: 'png' },
    { slug: 'favicon-generator', route: '/utility-tools/favicon-generator', engine: 'utility', files: [file('sample.png')], kind: 'ico', ext: 'ico' },
    { slug: 'base64-tool', route: '/utility-tools/base64-tool', engine: 'utility', fields: { '#b64-mode': 'decode', '#b64-input': 'SGVsbG8gRmlsZUdlbmll', '#b64-name': 'decoded.txt' }, kind: 'text', ext: 'txt', contains: 'Hello FileGenie' },
    { slug: 'file-hash-checker', route: '/utility-tools/file-hash-checker', engine: 'utility', files: [file('sample.txt')], kind: 'text', ext: 'txt', contains: 'SHA-256:' },
    { slug: 'qr-code-reader', route: '/utility-tools/qr-code-reader', engine: 'qr-reader', files: [], kind: 'text', ext: 'txt', contains: 'https://example.test/filegenie-qr' },
    { slug: 'what-is-my-ip', route: '/utility-tools/what-is-my-ip', engine: 'ip', fields: {}, kind: 'text', ext: 'txt', contains: 'IP Address:' },
    { slug: 'barcode-generator', route: '/utility-tools/barcode-generator', engine: 'barcode', fields: { '#bc-value': 'FILEGENIE-60' }, kind: 'png', ext: 'png' },
    { slug: 'barcode-reader', route: '/utility-tools/barcode-reader', engine: 'barcode-reader', files: [], kind: 'text', ext: 'txt', contains: 'FILEGENIE-60' },
];

function writeMatrix() {
    const header = ['route', 'tool', 'engine', 'fixture', 'action_executed', 'output_validated', 'browser', 'result', 'issue', 'evidence'];
    const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [header, ...results.map((row) => header.map((key) => row[key] || ''))]
        .map((row) => row.map(csvCell).join(','))
        .join('\n') + '\n';
    fs.writeFileSync(path.join(ROOT, 'FileGenie-60-tool-QA-matrix.csv'), csv);
    fs.writeFileSync(path.join(EVID, 'acceptance60-results.json'), JSON.stringify(results, null, 2));
}

(async () => {
    if (cases.length !== 60) throw new Error(`Expected 60 cases, configured ${cases.length}`);
    const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ['--no-sandbox'] });
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    const runtimeWarnings = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', (message) => {
        if (message.type() !== 'error') return;
        if (/onnxruntime/i.test(message.text())) runtimeWarnings.push(message.text());
        else consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`));

    let protectedOutput = null;
    let qrOutput = null;
    let barcodeOutput = null;
    for (let index = 0; index < cases.length; index += 1) {
        const config = { ...cases[index] };
        if (config.slug === 'unlock-pdf') config.files = protectedOutput ? [protectedOutput] : [storageFile('protected.pdf')];
        if (config.slug === 'qr-code-reader') config.files = qrOutput ? [qrOutput] : [file('sample.png')];
        if (config.slug === 'barcode-reader') config.files = barcodeOutput ? [barcodeOutput] : [file('sample.png')];
        const result = await runCase(page, config, index);
        if (config.slug === 'protect-pdf' && result.outputPath) {
            protectedOutput = result.outputPath;
            const bytes = fs.readFileSync(result.outputPath).toString('latin1');
            result.issue = bytes.includes('/Encrypt') ? '' : 'PDF output did not contain an /Encrypt dictionary';
            if (!bytes.includes('/Encrypt')) result.result = 'FAIL';
        }
        if (config.slug === 'qr-code-generator' && result.outputPath) qrOutput = result.outputPath;
        if (config.slug === 'barcode-generator' && result.outputPath) barcodeOutput = result.outputPath;
    }

    const suite = {
        total: results.length,
        passed: results.filter((row) => row.result === 'PASS').length,
        failed: results.filter((row) => row.result !== 'PASS').length,
        consoleErrors,
        runtimeWarnings,
        pageErrors,
        failedRequests,
    };
    fs.writeFileSync(path.join(EVID, 'acceptance60-summary.json'), JSON.stringify(suite, null, 2));
    writeMatrix();
    await browser.close();
    console.log(`\n==== ACCEPTANCE 60 ====\n${suite.passed}/${suite.total} operation cases passed`);
    console.log(`consoleErrors=${consoleErrors.length} pageErrors=${pageErrors.length} failedRequests=${failedRequests.length}`);
    process.exit(suite.failed === 0 ? 0 : 2);
})().catch((error) => {
    console.error('FATAL', error);
    writeMatrix();
    process.exit(3);
});
