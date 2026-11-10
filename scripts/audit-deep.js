const { chromium } = require('playwright');
const fs = require('fs');
const crypto = require('crypto');

const BASE = 'http://127.0.0.1:8777';
const FX = 'C:\\Users\\Muhammad Saqib\\Desktop\\Website\\storage\\fixtures\\';
const CHROME = 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';

const log = (...a) => console.log(...a);
const results = {};

// Read a file from disk and upload to the page's file input, then click Process.
async function uploadAndProcess(page, fileInputSel, filePath, processSel) {
    await page.setInputFiles(fileInputSel, filePath);
    await page.waitForTimeout(300);
    await page.click(processSel, { timeout: 60000 });
}

// Wait for the result/download to appear and return the blob URL.
async function getDownloadBlobUrl(page) {
    await page.waitForSelector('#download-btn', { state: 'visible', timeout: 60000 });
    return await page.$eval('#download-btn', el => el.href);
}

// Fetch a blob URL in-page and return base64.
async function blobUrlToBase64(page, url) {
    return await page.evaluate(async (u) => {
        const r = await fetch(u);
        const buf = await r.arrayBuffer();
        let bin = '';
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }, url);
}

function writeBase64(name, b64) {
    fs.writeFileSync(FX + name, Buffer.from(b64, 'base64'));
}

(async () => {
    const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('pageerror', e => log('  PAGEERR:', e.message.slice(0, 160)));

    // ---------------------------------------------------------------
    // 1. BARCODE GENERATOR + READER ROUND TRIP
    // ---------------------------------------------------------------
    log('\n=== 1. BARCODE round trip ===');
    const bcTests = [
        { type: 'CODE128', value: 'FILEGENIE-2026' },
        { type: 'EAN13', value: '5901234123457' },
        { type: 'UPCA', value: '042100005264' },
    ];
    for (const t of bcTests) {
        await page.goto(`${BASE}/utility-tools/barcode-generator`, { waitUntil: 'networkidle' });
        await page.waitForSelector('#bc-type');
        await page.selectOption('#bc-type', t.type);
        await page.fill('#bc-value', t.value);
        await page.waitForTimeout(200);
        await page.click('#process-btn');
        // barcode-generator returns a blob via download; grab it
        const url = await getDownloadBlobUrl(page);
        const b64 = await blobUrlToBase64(page, url);
        const fname = `bc_${t.type}.png`;
        writeBase64(fname, b64);

        // Now read it back
        await page.goto(`${BASE}/utility-tools/barcode-reader`, { waitUntil: 'networkidle' });
        await page.waitForSelector('#file-input');
        await page.setInputFiles('#file-input', FX + fname);
        await page.waitForTimeout(400);
        await page.click('#process-btn');
        await page.waitForSelector('#br-result-text', { timeout: 30000 });
        const decoded = (await page.$eval('#br-result-text', el => el.textContent)).trim();
        const ok = decoded === t.value;
        results['barcode-' + t.type] = { ok, input: t.value, decoded, match: ok };
        log(`  ${t.type}: in="${t.value}" out="${decoded}" ${ok ? 'OK' : 'MISMATCH'}`);
    }

    // ---------------------------------------------------------------
    // 2. OCR on 3 generated text images
    // ---------------------------------------------------------------
    log('\n=== 2. OCR (3 images) ===');
    const ocrTexts = ['Hello FileGenie', 'The quick brown fox', 'Invoice 2026 Total 99'];
    for (let i = 0; i < ocrTexts.length; i++) {
        // generate a text PNG in-browser and download via image-to-text? Simpler: build in this page via canvas.
        await page.goto(`${BASE}/image-tools/image-to-text`, { waitUntil: 'networkidle' });
        await page.waitForSelector('#file-input');
        // craft the image in-page, turn into a File, and feed to the input
        const b64 = await page.evaluate(async (txt) => {
            const c = document.createElement('canvas');
            c.width = 600; c.height = 200;
            const g = c.getContext('2d');
            g.fillStyle = '#fff'; g.fillRect(0, 0, 600, 200);
            g.fillStyle = '#000'; g.font = 'bold 48px Arial'; g.textBaseline = 'middle';
            g.fillText(txt, 30, 100);
            const blob = await new Promise(r => c.toBlob(r, 'image/png'));
            const buf = await blob.arrayBuffer();
            let s = ''; const bytes = new Uint8Array(buf);
            for (let k = 0; k < bytes.length; k++) s += String.fromCharCode(bytes[k]);
            return btoa(s);
        }, ocrTexts[i]);
        const fname = `ocr_${i}.png`;
        writeBase64(fname, b64);
        await page.setInputFiles('#file-input', FX + fname);
        await page.waitForTimeout(500);
        await page.click('#process-btn');
        await page.waitForSelector('#ocr-output .ocr-text', { timeout: 90000 });
        const text = (await page.$eval('#ocr-output .ocr-text', el => el.textContent)).trim();
        const ok = text.replace(/\s+/g, ' ').toLowerCase().includes(ocrTexts[i].toLowerCase());
        results['ocr-' + i] = { ok, expected: ocrTexts[i], got: text.slice(0, 60) };
        log(`  OCR#${i}: expected="${ocrTexts[i]}" got="${text.slice(0,50)}" ${ok ? 'OK' : 'WEAK'}`);
    }

    // ---------------------------------------------------------------
    // 3. IMAGE UPSCALER — output dims + method ran
    // ---------------------------------------------------------------
    log('\n=== 3. AI Upscaler ===');
    await page.goto(`${BASE}/image-tools/image-upscaler`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#file-input');
    await page.setInputFiles('#file-input', FX + 'blank.png');
    await page.waitForTimeout(400);
    await page.click('#process-btn');
    const upUrl = await getDownloadBlobUrl(page);
    // Load the result in-page to read true dimensions
    const upDims = await page.evaluate(async (u) => {
        const r = await fetch(u); const b = await r.blob();
        const url = URL.createObjectURL(b);
        return await new Promise(res => {
            const im = new Image();
            im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
            im.onerror = () => res(null);
            im.src = url;
        });
    }, upUrl);
    const ok = upDims && upDims.w > 400; // blank.png is 400 wide; upscale should grow it
    results['upscaler'] = { ok, inW: 400, outW: upDims ? upDims.w : null };
    log(`  input 400x200 -> output ${upDims ? upDims.w + 'x' + upDims.h : 'FAILED'} ${ok ? 'OK' : 'FAIL'}`);

    // ---------------------------------------------------------------
    // 4 & 5. PDF PROTECT + UNLOCK
    // ---------------------------------------------------------------
    log('\n=== 4. PDF Protect (open-without-password enforced) ===');
    await page.goto(`${BASE}/pdf-tools/protect-pdf`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#file-input');
    await page.setInputFiles('#file-input', FX + 'sample.pdf');
    await page.waitForSelector('#sec-open-pw', { timeout: 15000 });
    await page.fill('#sec-open-pw', 'secret123');
    await page.waitForTimeout(400);
    await page.click('#process-btn');
    const protUrl = await getDownloadBlobUrl(page);
    const protB64 = await blobUrlToBase64(page, protUrl);
    writeBase64('protected.pdf', protB64);
    log(`  protected.pdf bytes: ${Buffer.from(protB64, 'base64').length}`);

    // Verify encryption enforced: node pdf-lib load WITHOUT password must throw.
    const pdfLibPath = 'C:\\Users\\Muhammad Saqib\\Desktop\\Website\\public\\vendor\\pdf-secure\\pdf-lib.min.js';
    const fs2 = fs;
    const enforceScript = `
      const PDFLib = require(${JSON.stringify(pdfLibPath)});
      const fs = require('fs');
      (async () => {
        const data = new Uint8Array(fs.readFileSync(${JSON.stringify(FX + 'protected.pdf')}));
        let noPwOk = false, withPwOk = false;
        try { await PDFLib.PDFDocument.load(data); noPwOk = true; } catch(e){ noPwOk = false; }
        try { await PDFLib.PDFDocument.load(data, { password: 'secret123' }); withPwOk = true; } catch(e){ withPwOk = false; }
        console.log(JSON.stringify({ noPwOpens: noPwOk, withPwOpens: withPwOk }));
      })();
    `;
    fs.writeFileSync('storage/check-protect.js', enforceScript);
    const enforceOut = require('child_process').execSync('node storage/check-protect.js', { encoding: 'utf8' }).trim();
    const enforce = JSON.parse(enforceOut);
    results['pdf-protect'] = enforce;
    log(`  without password opens: ${enforce.noPwOpens} (want false) | with password opens: ${enforce.withPwOpens} (want true)`);

    log('\n=== 5. PDF Unlock (correct password) ===');
    await page.goto(`${BASE}/pdf-tools/unlock-pdf`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#file-input');
    await page.setInputFiles('#file-input', FX + 'protected.pdf');
    await page.waitForSelector('#sec-unlock-pw', { timeout: 15000 });
    await page.fill('#sec-unlock-pw', 'secret123');
    await page.waitForTimeout(400);
    await page.click('#process-btn');
    const unlockedUrl = await getDownloadBlobUrl(page);
    const unlockedB64 = await blobUrlToBase64(page, unlockedUrl);
    writeBase64('unlocked.pdf', unlockedB64);
    const unlockScript = `
      const PDFLib = require(${JSON.stringify(pdfLibPath)});
      const fs = require('fs');
      (async () => {
        const data = new Uint8Array(fs.readFileSync(${JSON.stringify(FX + 'unlocked.pdf')}));
        try {
          const doc = await PDFLib.PDFDocument.load(data);
          console.log(JSON.stringify({ opensNoPw: true, pages: doc.getPageCount() }));
        } catch (e) {
          console.log(JSON.stringify({ opensNoPw: false, err: e.message.slice(0, 40) }));
        }
      })();
    `;
    fs.writeFileSync('storage/check-unlock.js', unlockScript);
    const unlock = JSON.parse(require('child_process').execSync('node storage/check-unlock.js', { encoding: 'utf8' }).trim());
    results['pdf-unlock'] = unlock;
    log(`  unlocked opens w/o password: ${unlock.opensNoPw} pages: ${unlock.pages}`);

    // ---------------------------------------------------------------
    // 6. MEDIA CONVERTERS (magic bytes)
    // ---------------------------------------------------------------
    log('\n=== 6. Media converters ===');
    async function convertTool(slug, fx, outName) {
        await page.goto(`${BASE}/${slug}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('#file-input');
        await page.setInputFiles('#file-input', FX + fx);
        await page.waitForTimeout(400);
        await page.click('#process-btn');
        const url = await getDownloadBlobUrl(page);
        const b64 = await blobUrlToBase64(page, url);
        writeBase64(outName, b64);
        const buf = Buffer.from(b64, 'base64');
        return buf;
    }
    const movBuf = await convertTool('video-tools/mov-to-mp4', 'sample.mov', 'out_mov.mp4');
    const mkvBuf = await convertTool('video-tools/mkv-to-mp4', 'sample.mkv', 'out_mkv.mp4');
    const m4aBuf = await convertTool('audio-tools/m4a-to-mp3', 'sample.m4a', 'out_m4a.mp3');

    const movHex = movBuf.slice(4, 12).toString('hex');
    const mkvHex = movBuf; // reuse
    const mp4Box = movBuf.slice(4, 8).toString('latin1'); // 'ftyp'
    const mp4Brand = movBuf.slice(8, 12).toString('latin1');
    const mp3Head = m4aBuf.slice(0, 3).toString('latin1'); // ID3 tag is 3 bytes ("ID3")
    const movOk = mp4Box === 'ftyp' && (mp4Brand === 'isom' || mp4Brand === 'mp42' || mp4Brand === 'avc1' || mp4Brand === 'dash');
    const mkvMp4Ok = mkvBuf.slice(4, 8).toString('latin1') === 'ftyp';
    const mp3Ok = mp3Head === 'ID3' || (m4aBuf[0] === 0xFF && (m4aBuf[1] & 0xE0) === 0xE0);
    results['mov-to-mp4'] = { ok: movOk, box: mp4Box, brand: mp4Brand, bytes: movBuf.length };
    results['mkv-to-mp4'] = { ok: mkvMp4Ok, box: mkvBuf.slice(4, 8).toString('latin1'), bytes: mkvBuf.length };
    results['m4a-to-mp3'] = { ok: mp3Ok, head: mp3Head, bytes: m4aBuf.length };
    log(`  mov->mp4: ftyp/${mp4Brand} ok=${movOk} (${movBuf.length}b)`);
    log(`  mkv->mp4: ftyp/${mkvBuf.slice(8,12).toString('latin1')} ok=${mkvMp4Ok} (${mkvBuf.length}b)`);
    log(`  m4a->mp3: head=${mp3Head} ok=${mp3Ok} (${m4aBuf.length}b)`);

    // ---------------------------------------------------------------
    // 7. ADD-TEXT / ROTATE-FLIP image dims correctness
    // ---------------------------------------------------------------
    log('\n=== 7. Image dimension tools ===');
    await page.goto(`${BASE}/image-tools/rotate-flip-image`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#file-input');
    await page.setInputFiles('#file-input', FX + 'blank.png'); // 400x200
    await page.waitForSelector('#rot-dir', { timeout: 15000 });
    await page.selectOption('#rot-dir', '90');
    await page.waitForTimeout(400);
    await page.click('#process-btn');
    const rotUrl = await getDownloadBlobUrl(page);
    const rotDims = await page.evaluate(async (u) => {
        const r = await fetch(u); const b = await r.blob();
        const url = URL.createObjectURL(b);
        return await new Promise(res => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res(null); im.src = url; });
    }, rotUrl);
    const rotOk = rotDims && rotDims.w === 200 && rotDims.h === 400; // 90deg swaps
    results['rotate-flip-image'] = { ok: rotOk, dims: rotDims };
    log(`  rotate 90: ${rotDims ? rotDims.w + 'x' + rotDims.h : 'FAIL'} (expect 200x400) ${rotOk ? 'OK' : 'FAIL'}`);

    await browser.close();

    fs.writeFileSync('storage/audit-deep.json', JSON.stringify(results, null, 2));
    log('\n=== DEEP TEST SUMMARY ===');
    let pass = 0, fail = 0;
    for (const [k, v] of Object.entries(results)) {
        const ok = v.ok === true || v.ok === undefined ? (v.match || v.withPwOpens && !v.noPwOpens || false) : v.ok;
        const status = (k.startsWith('barcode') ? v.match : null);
        log(`  ${k}: ${JSON.stringify(v).slice(0, 120)}`);
    }
    // overall verdict
    const checks = [
        results['barcode-CODE128'].match,
        results['barcode-EAN13'].match,
        results['barcode-UPCA'].match,
        results['ocr-0'].ok, results['ocr-1'].ok, results['ocr-2'].ok,
        results['upscaler'].ok,
        !results['pdf-protect'].noPwOpens && results['pdf-protect'].withPwOpens,
        results['pdf-unlock'].opensNoPw,
        results['mov-to-mp4'].ok, results['mkv-to-mp4'].ok, results['m4a-to-mp3'].ok,
        results['rotate-flip-image'].ok,
    ];
    const allPass = checks.every(Boolean);
    log('\nALL DEEP CHECKS PASS:', allPass);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
