import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:8777';
const FX = 'C:\\Users\\Muhammad Saqib\\Desktop\\Website\\tests\\fixtures';
const results = [];
const log = (n, ok, d) => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' :: ' + d : ''}`); };

const browser = await chromium.launch({ executablePath: 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe', args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('  [pageerror]', e.message));

async function runTool(url, fileInput, label) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.FileGenieEngine && typeof window.FileGenieEngine.process === 'function', null, { timeout: 20000 });
  await page.setInputFiles('#file-input', fileInput);
  await page.waitForSelector('#ws-active:not([hidden])', { timeout: 8000 });
  await page.click('#process-btn');
  // wait for result link to be populated (download href set)
  await page.waitForFunction(() => {
    const a = document.getElementById('download-btn');
    return a && a.getAttribute('href') && a.getAttribute('href').startsWith('blob:');
  }, null, { timeout: 60000 });
  const info = await page.evaluate(() => {
    const a = document.getElementById('download-btn');
    return { href: a.getAttribute('href'), name: a.getAttribute('download') || a.textContent, msg: document.getElementById('result-msg').textContent };
  });
  log(label, !!info.href && info.href.startsWith('blob:'), `${info.name} | ${info.msg.slice(0, 60)}`);
}

try { await runTool('/pdf-tools/compress-pdf', `${FX}/a.pdf`, 'PDF compress -> real blob'); } catch (e) { log('PDF compress', false, e.message); }
try { await runTool('/image-tools/compress-image', `${FX}/img-1.png`, 'Image compress -> real blob'); } catch (e) { log('Image compress', false, e.message); }
try { await runTool('/text-tools/case-converter', `${FX}/sample.txt`, 'Text case -> real blob'); } catch (e) { log('Text case', false, e.message); }
// Audio + video use ffmpeg (heavy, ~31MB wasm lazy load). Allow generous timeout.
try { await runTool('/audio-tools/audio-converter', `${FX}/a.mp3`, 'Audio convert -> real blob'); } catch (e) { log('Audio convert', false, e.message); }
try { await runTool('/video-tools/compress-video', `${FX}/test.mp4`, 'Video compress -> real blob'); } catch (e) { log('Video compress', false, e.message); }

await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n=== real-operation: ${passed}/${results.length} produced real output blobs ===`);
if (passed !== results.length) process.exit(1);
