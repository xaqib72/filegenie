/* FileGenie FINAL PRODUCTION ACCEPTANCE TEST
 * Real Chromium (Playwright), real fixtures, real downloads.
 * Records PASS/FAIL with evidence. No architecture/feature changes.
 *
 * Flow note: the app shows a #result panel after processing and the user clicks
 * #download-btn (a blob: link) to trigger the actual download — nothing auto
 * downloads. So we wait for #result then click #download-btn while capturing the
 * download event.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = process.env.BASE || 'http://127.0.0.1:8777';
const CHROME = process.env.CHROME_PATH;
const FX = path.resolve(__dirname, 'fixtures');
const EVID = path.resolve(__dirname, 'evidence');
fs.mkdirSync(EVID, { recursive: true });

const results = [];
function rec(test, evidence, pass) {
  results.push({ test, evidence, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${test} | ${evidence}`);
}
function fpath(...p) { return path.join(FX, ...p); }

// Wait for processing to finish, then click #download-btn and capture the download.
async function processThenDownload(page, downloadTimeout) {
  await page.waitForSelector('#result:not([hidden])', { timeout: downloadTimeout });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: downloadTimeout }),
    page.click('#download-btn'),
  ]);
  return download;
}

// Verify a file is a genuine JPEG by magic bytes + decode dimensions.
function jpegInfo(buf) {
  const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[buf.length-2] === 0xFF && buf[buf.length-1] === 0xD9;
  let w=0,h=0, i=2;
  while (i < buf.length-1) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const m = buf[i+1];
    // SOF markers are 0xC0-0xCF except 0xC4 (DHT), 0xC8 (JPG), 0xCC (DAC)
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) { h = buf[i+6]|(buf[i+5]<<8); w = buf[i+8]|(buf[i+7]<<8); break; }
    if (m === 0xD9) break;
    const len = (buf[i+2]<<8)|buf[i+3]; if (len<2) break; i += 2+len;
  }
  return { isJpeg, w, h };
}
function pngInfo(buf) {
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const isPng = buf.slice(0,8).equals(sig);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  return { isPng, w, h };
}
function pdfPageCount(file) {
  try {
    const out = execSync(`python -c "from pypdf import PdfReader; print(len(PdfReader(r'${file}').pages))"`, { stdio: ['ignore','pipe','ignore'] }).toString().trim();
    return parseInt(out, 10);
  } catch { return null; }
}

(async () => {
  const browser = await chromium.launch({
    ...(CHROME ? { executablePath: CHROME } : {}),
    args: ['--no-sandbox']
  });
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('requestfailed', r => failedRequests.push(r.url() + ' :: ' + (r.failure()&&r.failure().errorText)));

  // ---------- BROWSER-ONLY TOOL 1: PDF to JPG ----------
  try {
    const expectedPages = pdfPageCount(fpath('a.pdf')) || 3;
    await page.goto(`${BASE}/pdf-tools/pdf-to-jpg`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#dropzone', { timeout: 10000 });
    await page.setInputFiles('#file-input', fpath('a.pdf')); // 3-page PDF
    await page.waitForSelector('#ws-active:not([hidden])', { timeout: 10000 });
    await page.click('#process-btn');
    const download = await processThenDownload(page, 90000);
    const savePath = path.join(EVID, 'pdf-to-jpg-out.zip');
    await download.saveAs(savePath);
    const ext = download.suggestedFilename();
    const outDir = path.join(EVID, 'pdf-to-jpg-imgs');
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    execSync(`python -c "import zipfile; zipfile.ZipFile(r'${savePath}').extractall(r'${outDir}')"`);
    const imgs = fs.readdirSync(outDir).filter(f=>/\.jpe?g$/i.test(f));
    let dims = [];
    let allJpeg = true;
    for (const im of imgs) {
      const info = jpegInfo(fs.readFileSync(path.join(outDir, im)));
      if (!info.isJpeg) allJpeg = false;
      dims.push(`${im} ${info.w}x${info.h}`);
    }
    rec('PDF to JPG: multi-page real PDF -> JPG(s), download opens',
        `expectedPages=${expectedPages} output=${imgs.length} jpg files, allJpeg=${allJpeg}, dims=[${dims.join(', ')}], filename=${ext}`,
        imgs.length >= expectedPages && allJpeg && dims.every(d=>/x\d+$/.test(d) && !d.endsWith('x0')));
    await page.screenshot({ path: path.join(EVID, 'pdf-to-jpg.png') });
  } catch (e) {
    rec('PDF to JPG: multi-page real PDF -> JPG(s), download opens', 'ERROR: ' + e.message, false);
  }

  // ---------- BROWSER-ONLY TOOL 2: Background Remover ----------
  for (const [name, fx] of [['bg-red','bg-red.png'],['bg-blue','bg-blue.png'],['bg-person','bg-person.png']]) {
    try {
      await page.goto(`${BASE}/image-tools/remove-background`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#dropzone', { timeout: 10000 });
      await page.setInputFiles('#file-input', fpath(fx));
      await page.waitForSelector('#ws-active:not([hidden])', { timeout: 10000 });
      // Ensure PNG output (transparency) is selected
      const sel = await page.$('#rb-format'); if (sel) await sel.selectOption('image/png');
      await page.click('#process-btn');
      const download = await processThenDownload(page, 300000);
      const savePath = path.join(EVID, `bg-${name}-out.png`);
      await download.saveAs(savePath);
      const info = pngInfo(fs.readFileSync(savePath));
      // Analyze transparency: count fully transparent pixels (alpha==0) via
      // the standalone pure-PIL helper (avoids inline-shell quoting fragility).
       const PY = process.env.PYTHON || 'python3';
       const transp = execSync(`"${PY}" "${path.resolve(__dirname,'analyze_png.py')}" "${savePath}"`).toString().trim().split(' ');
      const transparentCount = parseInt(transp[0],10), total = parseInt(transp[1],10);
      const transparentPct = (transparentCount/total*100).toFixed(1);
      const hasTransparency = transparentCount > total*0.02; // >2% transparent
      rec(`Background Remover: ${name} real segmentation + transparency`,
          `png=${info.isPng} ${info.w}x${info.h}, transparentPixels=${transparentCount} (${transparentPct}%)`,
          info.isPng && info.w>0 && info.h>0 && hasTransparency);
    } catch (e) {
      rec(`Background Remover: ${name} real segmentation + transparency`, 'ERROR: ' + e.message, false);
    }
  }

  // ---------- BROWSER-ONLY TOOL 3: HEIC to JPG ----------
  const heicExp = { 'heic-1':[640,480], 'heic-2':[800,600], 'heic-3':[512,512] };
  for (const [name, fx] of [['heic-1','heic-1.heic'],['heic-2','heic-2.heic'],['heic-3','heic-3.heic']]) {
    try {
      await page.goto(`${BASE}/image-tools/heic-to-jpg`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#dropzone', { timeout: 10000 });
      await page.setInputFiles('#file-input', fpath(fx));
      await page.waitForSelector('#ws-active:not([hidden])', { timeout: 10000 });
      const sel = await page.$('#heic-format'); if (sel) await sel.selectOption('image/jpeg');
      await page.click('#process-btn');
      const download = await processThenDownload(page, 90000);
      const savePath = path.join(EVID, `heic-${name}-out.jpg`);
      await download.saveAs(savePath);
      const info = jpegInfo(fs.readFileSync(savePath));
      const exp = heicExp[name];
      const dimsMatch = info.w===exp[0] && info.h===exp[1];
      // Genuinely decoded: a JPG re-encoded from HEIC will NOT start with 'ftyp' (HEIC) or 'heic'
      const rawHead = fs.readFileSync(savePath).slice(0,4).toString('hex');
      rec(`HEIC to JPG: ${name} genuine decode (${exp[0]}x${exp[1]})`,
          `isJpeg=${info.isJpeg} ${info.w}x${info.h} expected=${exp[0]}x${exp[1]} dimsMatch=${dimsMatch} head=${rawHead}`,
          info.isJpeg && info.w>0 && info.h>0 && dimsMatch);
    } catch (e) {
      rec(`HEIC to JPG: ${name} genuine decode`, 'ERROR: ' + e.message, false);
    }
  }

  rec('No JS console errors during browser-only tool runs', `errors=${consoleErrors.length}`, consoleErrors.length === 0);
  rec('No page (uncaught) JS errors during browser-only tool runs', `errors=${pageErrors.length}`, pageErrors.length === 0);
  rec('No failed network requests during browser-only tool runs', `failed=${failedRequests.length}`, failedRequests.length === 0);

  await browser.close();

  // ---- Summary ----
  const failed = results.filter(r=>!r.pass);
  console.log('\n==== ACCEPTANCE (browser-only tools) ====');
  console.log(`${results.length} checks, ${failed.length} failed`);
  fs.writeFileSync(path.join(EVID,'partial-results.json'), JSON.stringify(results,null,2));
  process.exit(failed.length===0?0:2);
})().catch(e => { console.error('FATAL', e); process.exit(3); });
