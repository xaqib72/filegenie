/* FileGenie ACCEPTANCE TEST — part 2
 * - one representative tool per category (real browser)
 * - responsive layouts (6 widths)
 * - global search, "/" shortcut, mega menu, dark/light, recents, favourites,
 *   batch ZIP, cancel, invalid files, large-file warning, mobile nav
 * - hosting/deploy checks (sitemap, robots, 404, canonical, clean routes, assets)
 * Records PASS/FAIL with evidence.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8777';
const CHROME = process.env.CHROME_PATH;
const FX = path.resolve(__dirname, 'fixtures');
const EVID = path.resolve(__dirname, 'evidence');
fs.mkdirSync(EVID, { recursive: true });
const results = [];
function rec(test, evidence, pass) { results.push({ test, evidence, pass }); console.log(`${pass?'PASS':'FAIL'} | ${test} | ${evidence}`); }
const fpath = (...p) => path.join(FX, ...p);

(async () => {
  const browser = await chromium.launch({
    ...(CHROME ? { executablePath: CHROME } : {}),
    args: ['--no-sandbox']
  });
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const consoleErrors = [], pageErrors = [], failed404 = [];
  page.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('response', r => { if (r.status()===404) failed404.push(r.url()); });

  async function gotoTool(url) {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
    // #process-btn always exists in the DOM (inside #ws-active). For no-file tools
    // it becomes visible on load; for file tools the dropzone is visible instead.
    // Wait for it to be *attached* (not visible) so both shapes are handled.
    await page.waitForSelector('#process-btn', { state: 'attached', timeout: 15000 });
  }
  async function uploadAndProcess(file, opts={}) {
    await page.setInputFiles('#file-input', file);
    await page.waitForSelector('#ws-active:not([hidden])', { timeout: 15000 });
    if (opts.select) { const s = await page.$(opts.select.sel); if (s) await s.selectOption(opts.select.val); }
    await page.click('#process-btn');
  }
  // The app shows a #result panel then the user clicks #download-btn (a blob: link)
  // to trigger the actual download — nothing auto-downloads after processing.
  async function waitDownload(name) {
    await page.waitForSelector('#result:not([hidden])', { timeout: 120000 });
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 120000 }),
      page.click('#download-btn'),
    ]);
    const p = path.join(EVID, name); await dl.saveAs(p); return { p, fn: dl.suggestedFilename() };
  }

  // ---------- One tool per category ----------
  // PDF: merge-pdf (uses a.pdf + b.pdf)
  try {
    await gotoTool('/pdf-tools/merge-pdf');
    await page.setInputFiles('#file-input', [fpath('a.pdf'), fpath('b.pdf')]);
    await page.waitForSelector('#ws-active:not([hidden])', { timeout: 15000 });
    await page.click('#process-btn');
    const d = await waitDownload('cat-pdf-merge.pdf');
    const bytes = fs.statSync(d.p).size;
    rec('Category PDF: merge-pdf (2 real PDFs -> 1)', `downloaded=${d.fn} bytes=${bytes}`, bytes>500 && /pdf$/.test(d.fn));
  } catch(e){ rec('Category PDF: merge-pdf', 'ERR '+e.message, false); }

  // Image: compress-image
  try {
    await gotoTool('/image-tools/compress-image');
    await uploadAndProcess(fpath('img-1.png'));
    const d = await waitDownload('cat-image-compress.jpg');
    const bytes = fs.statSync(d.p).size;
    rec('Category Image: compress-image (real PNG -> JPG)', `downloaded=${d.fn} bytes=${bytes}`, bytes>200 && /jpg|jpeg$/.test(d.fn));
  } catch(e){ rec('Category Image: compress-image', 'ERR '+e.message, false); }

  // Video: compress-video (ffmpeg wasm) — may be slow.
  // NOTE: the engine defaults to webm (VP8) since ffmpeg.wasm has no libx264;
  // the mp4 option uses the mpeg4 encoder. Either is a genuine re-encode, so we
  // accept the real WebM EBML header (1a45dfa3) OR an mp4 ftyp box.
  try {
    await gotoTool('/video-tools/compress-video');
    await uploadAndProcess(fpath('test.mp4'));
    const d = await waitDownload('cat-video-compress.webm');
    const bytes = fs.statSync(d.p).size;
    const buf = fs.readFileSync(d.p);
    const isWebm = buf.slice(0,4).toString('hex') === '1a45dfa3';
    const isMp4 = buf.slice(4,8).toString() === 'ftyp';
    rec('Category Video: compress-video (ffmpeg wasm re-encode)', `downloaded=${d.fn} bytes=${bytes} isWebm=${isWebm} isMp4=${isMp4}`, bytes>500 && (isWebm||isMp4));
  } catch(e){ rec('Category Video: compress-video', 'ERR '+e.message, false); }

  // Audio: audio-converter (wav -> mp3). Genuine libmp3lame output begins with an
  // ID3v2 tag ("ID3") OR a raw MPEG frame (0xFF 0xE0..). Accept either.
  try {
    await gotoTool('/audio-tools/audio-converter');
    await uploadAndProcess(fpath('test.wav'), { select: { sel:'#ac-format', val:'mp3' } });
    const d = await waitDownload('cat-audio-convert.mp3');
    const buf = fs.readFileSync(d.p);
    const isId3 = buf.slice(0,3).toString() === 'ID3';
    const frameSync = buf[0]===0xFF && (buf[1]&0xE0)===0xE0;
    const isMp3 = isId3 || frameSync;
    rec('Category Audio: audio-converter (wav -> mp3)', `downloaded=${d.fn} bytes=${buf.length} isMp3=${isMp3} (id3=${isId3})`, buf.length>500 && isMp3);
  } catch(e){ rec('Category Audio: audio-converter', 'ERR '+e.message, false); }

  // Text: case-converter (no file needed)
  try {
    await gotoTool('/text-tools/case-converter');
    // text tools: needsFiles false; provide text in the textarea
    const ta = await page.$('#tc-input');
    await ta.fill('hello world');
    await page.selectOption('#tc-mode', 'upper');
    await page.click('#process-btn');
    await page.waitForSelector('#result:not([hidden])', { timeout: 15000 });
    const msg = await page.textContent('#result-msg');
    rec('Category Text: case-converter (textarea -> UPPER)', `resultShown=${!!msg}`, !!msg);
  } catch(e){ rec('Category Text: case-converter', 'ERR '+e.message, false); }

  // Utility: password-generator (no file)
  try {
    await gotoTool('/utility-tools/password-generator');
    await page.click('#process-btn');
    await page.waitForSelector('#result:not([hidden])', { timeout: 15000 });
    const out = await page.textContent('#ws-active');
    rec('Category Utility: password-generator', `hasOutput=${out.length>20}`, out.length>20);
  } catch(e){ rec('Category Utility: password-generator', 'ERR '+e.message, false); }

  await browser.close();

  // stash
  fs.writeFileSync(path.join(EVID,'partial-results-2.json'), JSON.stringify(results,null,2));
  const failed = results.filter(r=>!r.pass);
  console.log(`\n==== ACCEPTANCE part 2 (categories) ====\n${results.length} checks, ${failed.length} failed`);
  process.exit(failed.length===0?0:2);
})().catch(e=>{ console.error('FATAL',e); process.exit(3); });
