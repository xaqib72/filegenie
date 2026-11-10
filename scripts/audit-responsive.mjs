import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8777';
const widths = [
  { name: '320', w: 320 }, { name: '375', w: 375 }, { name: '414', w: 414 },
  { name: '768', w: 768 }, { name: '1024', w: 1024 }, { name: '1280', w: 1280 },
  { name: '1440', w: 1440 }, { name: '1920', w: 1920 },
];
const browser = await chromium.launch({ executablePath: 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe', args: ['--no-sandbox'] });
const page = await browser.newPage();
let fail = 0;
for (const { name, w } of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
    headerVisible: !!document.querySelector('.site-header'),
    footerVisible: !!document.querySelector('.site-footer .footer-grid'),
  }));
  const hOverflow = overflow.doc > overflow.win + 1;
  const ok = overflow.headerVisible && overflow.footerVisible && !hOverflow;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}px :: doc=${overflow.doc} win=${overflow.win}${hOverflow ? ' H-OVERFLOW' : ''} header=${overflow.headerVisible} footer=${overflow.footerVisible}`);

  // mobile: burger visible, primary-nav hidden at <=860
  if (w <= 860) {
    const m = await page.evaluate(() => {
      const burger = document.getElementById('nav-burger');
      const nav = document.querySelector('.primary-nav');
      return { burgerShown: burger && getComputedStyle(burger).display !== 'none', navHidden: nav && getComputedStyle(nav).display === 'none' };
    });
    const mok = m.burgerShown && m.navHidden;
    if (!mok) fail++;
    console.log(`  ${mok ? 'PASS' : 'FAIL'}  mobile drawer chrome :: burger=${m.burgerShown} navHidden=${m.navHidden}`);
  }
}
// Open mega menu on desktop and check no overflow
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.click('#mega-trigger');
await page.waitForSelector('#mega-menu:not([hidden])');
const mega = await page.evaluate(() => {
  const m = document.getElementById('mega-menu');
  return { visible: !m.hidden, w: m.scrollWidth, win: window.innerWidth };
});
const megaOk = mega.visible && mega.w <= mega.win + 1;
if (!megaOk) fail++;
console.log(`${megaOk ? 'PASS' : 'FAIL'}  mega menu open @1280 :: w=${mega.w} win=${mega.win}`);

await browser.close();
console.log(`\n=== responsive: ${fail === 0 ? 'ALL PASS' : fail + ' FAILURES'} ===`);
if (fail) process.exit(1);
