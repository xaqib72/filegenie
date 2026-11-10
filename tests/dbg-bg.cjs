const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8777';
const FX = path.resolve(__dirname, 'fixtures');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', r => logs.push(`[reqfail] ${r.url()} :: ${r.failure() && r.failure().errorText}`));
  page.on('response', r => { if (r.url().includes('staticimgly') || r.url().includes('onnx') || r.url().includes('background')) logs.push(`[resp ${r.status()}] ${r.url()}`); });

  await page.goto(`${BASE}/image-tools/remove-background`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#dropzone');
  await page.setInputFiles('#file-input', path.join(FX, 'bg-red.png'));
  await page.waitForSelector('#ws-active:not([hidden])');
  await page.click('#process-btn');
  // poll for up to 150s
  let state = 'running';
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(5000);
    const snap = await page.evaluate(() => ({
      result: !document.getElementById('result').hidden,
      err: document.getElementById('ws-error').hidden ? '' : document.getElementById('ws-error').textContent,
      progress: document.getElementById('progress').hidden ? '' : document.getElementById('progress-label').textContent,
    }));
    logs.push(`t=${(i+1)*5}s result=${snap.result} err="${snap.err}" progress="${snap.progress}"`);
    if (snap.result) { state='done'; break; }
    if (snap.err) { state='error'; break; }
  }
  fs.writeFileSync(path.resolve(__dirname,'evidence','dbg-bg.log'), logs.join('\n'));
  console.log(logs.join('\n'));
  console.log('STATE=' + state);
  await browser.close();
})();
