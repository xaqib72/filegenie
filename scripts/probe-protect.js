const { chromium } = require('playwright');
const CHROME = 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 200)); });
  const t0 = Date.now();
  await page.goto('http://127.0.0.1:8777/pdf-tools/protect-pdf', { waitUntil: 'networkidle' });
  let found = false;
  try { await page.waitForSelector('#sec-open-pw', { timeout: 15000 }); found = true; } catch (e) {}
  console.log('protect-pdf #sec-open-pw found:', found, 'after', Date.now() - t0, 'ms');
  const info = await page.evaluate(() => ({
    engineScript: !!document.querySelector('script[src*="/assets/js/engines/pdf-secure"]'),
    engType: typeof window.FileGenieEngine,
    bodyHas: document.body.innerHTML.includes('sec-open-pw')
  }));
  console.log(JSON.stringify(info));
  await browser.close();
})();
