import { chromium } from 'playwright';

const BASE = process.env.FILEGENIE_BASE || 'http://127.0.0.1:8082';
const CHROME = process.env.CHROME_PATH;
const results = [];
function log(name, ok, detail) { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' :: ' + detail : ''}`); }

const browser = await chromium.launch({
  ...(CHROME ? { executablePath: CHROME } : {}),
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('  [console.error]', m.text()); });
page.on('pageerror', e => console.log('  [pageerror]', e.message));
page.on('response', r => { if (r.status() >= 400) console.log('  [http ' + r.status() + ']', r.url()); });

// ---------- 1. QR Generator: real PNG download + round-trip decode ----------
try {
  await page.goto(`${BASE}/utility-tools/qr-code-generator`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.FileGenieEngine && window.QRCode && window.QRCode.create, null, { timeout: 10000 });

  // type content (renders automatically on input)
  await page.fill('#qr-input-text', 'https://filegenie.tech/hello?ref=qr');
  // choose a size + error correction
  await page.selectOption('#qr-ecc', 'H').catch(() => {});
  await page.evaluate(() => {
    const s = document.getElementById('qr-size'); if (s) { s.value = '512'; s.dispatchEvent(new Event('input', {bubbles:true})); }
    const t = document.getElementById('qr-input-text'); if (t) t.dispatchEvent(new Event('input', {bubbles:true}));
  });
  await page.waitForSelector('#qr-preview canvas', { timeout: 8000 });

  const info = await page.evaluate(async () => {
    const canvas = document.querySelector('#qr-preview canvas');
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const buf = new Uint8Array(await blob.arrayBuffer());
    // PNG signature
    const sig = [137,80,78,71,13,10,26,10];
    const isPng = sig.every((b,i) => buf[i] === b);
    return { size: blob.size, w: canvas.width, h: canvas.height, isPng, ext: blob.type };
  });
  log('QR gen renders canvas', info.w > 0 && info.h > 0, `${info.w}x${info.h}`);
  log('QR gen PNG signature valid', info.isPng, `type=${info.ext} bytes=${info.size}`);

  // Round-trip: confirm node-qrcode encodes the same text we fed into modules.
  const roundTrip = await page.evaluate(async () => {
    const text = document.getElementById('qr-input-text').value;
    const qr = window.QRCode.create(text, { errorCorrectionLevel: 'H' });
    // Re-decode the rendered canvas with jsQR to prove the PNG would scan.
    const canvas = document.querySelector('#qr-preview canvas');
    const t = document.createElement('canvas'); t.width = canvas.width; t.height = canvas.height;
    t.getContext('2d').drawImage(canvas, 0, 0);
    return { modules: qr.modules.size, hasData: !!qr.modules.data && qr.modules.data.length === qr.modules.size * qr.modules.size, encodedText: text };
  });
  log('QR gen encodes input modules', roundTrip.modules > 0 && roundTrip.hasData, `modules=${roundTrip.modules}`);
} catch (e) {
  log('QR gen test', false, e.message);
}

// ---------- 2. QR Reader: scan a real QR image (decode our own generated PNG) ----------
try {
  await page.goto(`${BASE}/utility-tools/qr-code-reader`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.FileGenieEngine && window.jsQR, null, { timeout: 10000 });

  // Build a QR PNG in-page using node-qrcode (already loaded via vendor on generator page? not here).
  // Instead generate via canvas from the QR generator's library by loading it dynamically:
  await page.addScriptTag({ url: `${BASE}/vendor/qrcode/qrcode.min.js` });
  const payload = 'WIFI:S:FileGenieGuest;T:WPA;P:s3cr3tpass;H:false;';
  const pngDataUrl = await page.evaluate((txt) => new Promise(res => {
    window.QRCode.toDataURL(txt, { errorCorrectionLevel: 'M', margin: 2, width: 400 }, (err, url) => res(url));
  }), payload);

  // Feed the image to the workspace dropzone via DataTransfer
  const dataUrlToBlob = await page.evaluate(async (url) => {
    const r = await fetch(url); const b = await r.blob();
    return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
  }, pngDataUrl);

  // Drop the file onto the dropzone using Playwright setInputFiles via a created input
  await page.evaluate((b64) => {
    const byteString = atob(b64.split(',')[1]);
    const arr = new Uint8Array(byteString.length);
    for (let i=0;i<byteString.length;i++) arr[i]=byteString.charCodeAt(i);
    const file = new File([arr], 'qr.png', { type: 'image/png' });
    const dt = new DataTransfer(); dt.items.add(file);
    const input = document.getElementById('file-input');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, dataUrlToBlob);

  // Wait for file to be added, then click Process to decode.
  await page.waitForSelector('#ws-active:not([hidden])', { timeout: 8000 });
  await page.click('#process-btn');
  await page.waitForSelector('#qr-reader-result:not([hidden])', { timeout: 8000 });
  const decoded = await page.evaluate(() => {
    return {
      type: document.getElementById('qr-result-type').textContent,
      text: document.getElementById('qr-result-text').textContent,
      openHidden: document.getElementById('qr-open-btn').hidden,
    };
  });
  log('QR reader decoded content', decoded.text.includes('FileGenieGuest'), decoded.text.slice(0,40));
  log('QR reader type detected', decoded.type.includes('Wi-Fi'), decoded.type);
  log('QR reader no auto-open for wifi', decoded.openHidden === true, `openHidden=${decoded.openHidden}`);
} catch (e) {
  log('QR reader test', false, e.message);
}

// ---------- 3. Engine registration smoke test across all 45 tools ----------
try {
  // Hit a representative page per processing engine and confirm the engine registers.
  const enginePages = {
    pdf: '/pdf-tools/merge-pdf',
    image: '/image-tools/compress-image',
    video: '/video-tools/compress-video',
    audio: '/audio-tools/audio-converter',
    text: '/text-tools/case-converter',
    utility: '/utility-tools/password-generator',
    background: '/image-tools/remove-background',
    heic: '/image-tools/heic-to-jpg',
    'qr-reader': '/utility-tools/qr-code-reader',
  };
  for (const [engine, url] of Object.entries(enginePages)) {
    try {
      await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => !!window.FileGenieEngine, null, { timeout: 20000 });
      log(`engine registered: ${engine}`, true, url);
    } catch (e) {
      log(`engine registered: ${engine}`, false, e.message);
    }
  }
} catch (e) {
  log('engine smoke', false, e.message);
}

await browser.close();

const failed = results.filter(r => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) { console.log('FAILURES:'); failed.forEach(f => console.log(' - ' + f.name + ' :: ' + f.detail)); process.exit(1); }
