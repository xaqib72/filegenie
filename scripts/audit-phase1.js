const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://127.0.0.1:8777';
const slugs = fs.readFileSync('storage/all-slugs.txt', 'utf8').trim().split('\n');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });
  const results = [];
  let totalConsoleErrors = 0;
  let totalPageErrors = 0;
  let iconFail = 0;

  for (const slug of slugs) {
    const page = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => pageErrors.push(e.message));

    const url = `${BASE}/${slug}`;
    let status = 200, title = '';
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      status = resp.status();
      // give engines a moment to mount
      await page.waitForTimeout(400);
      title = await page.title();
    } catch (e) {
      pageErrors.push('NAV: ' + e.message);
    }

    // Icon check: find element with id containing 'icon' or svg present near tool header
    const iconInfo = await page.evaluate(() => {
      const header = document.querySelector('.tool-header, .tool-hero, header .tool-icon, [data-icon]');
      const svgs = document.querySelectorAll('svg').length;
      // look for icon container used in registry render
      const iconEl = document.querySelector('.tool-icon, .tool-badge svg, img[src*="data:image/svg"]');
      return { svgs, hasIcon: !!iconEl || svgs > 0 };
    });

    // Engine script reference
    const hasEngine = await page.evaluate(() => {
      return !!document.querySelector('script[src*="/assets/js/engines/"]');
    });

    totalConsoleErrors += consoleErrors.length;
    totalPageErrors += pageErrors.length;
    if (!iconInfo.hasIcon) iconFail++;

    results.push({
      slug, status, svgs: iconInfo.svgs, hasIcon: iconInfo.hasIcon, hasEngine,
      consoleErrors, pageErrors
    });

    await page.close();
  }

  await browser.close();

  const failed = results.filter(r => r.status !== 200 || r.consoleErrors.length || r.pageErrors.length || !r.hasIcon);
  console.log('=== PHASE 1 SUMMARY ===');
  console.log('Total pages:', results.length);
  console.log('Total console errors:', totalConsoleErrors);
  console.log('Total page errors:', totalPageErrors);
  console.log('Icon render failures:', iconFail);
  console.log('Pages with issues:', failed.length);
  if (failed.length) {
    for (const f of failed) {
      console.log(`  - ${f.slug} [${f.status}] icon=${f.hasIcon} engine=${f.hasEngine}`);
      f.consoleErrors.forEach(e => console.log('      CONSOLE:', e.slice(0, 200)));
      f.pageErrors.forEach(e => console.log('      PAGEERR:', e.slice(0, 200)));
    }
  }
  fs.writeFileSync('storage/audit-phase1.json', JSON.stringify(results, null, 2));
})();
