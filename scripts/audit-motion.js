/**
 * Motion-phase QA: scene build, overflow at breakpoints, reduced-motion
 * visibility, console errors, and tool/category regression smoke.
 */
const { chromium } = require('playwright');
const EXEC = 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const BASE = 'http://127.0.0.1:8777';
const BREAKPOINTS = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1366, 1440, 1920];

function overflowX(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const results = { consoleErrors: [], brokenAssets: 0, overflowFails: [], reducedMotionFails: [], scenes: {}, regressions: [] };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') results.consoleErrors.push(m.text()); });
  page.on('requestfailed', r => { if (r.url().includes('/assets/')) results.brokenAssets++; });

  // ---- Homepage ----
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const heroChips = await page.locator('.hero-ecosystem .m-chip').count();
  results.scenes.homeHero = heroChips;
  const homeVisible = await page.locator('.tool-grid .tool-card').first().isVisible();
  results.regressions.push(homeVisible ? 'home:cards visible' : 'home:cards MISSING');

  // overflow across breakpoints (home)
  for (const w of BREAKPOINTS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(120);
    const ox = await overflowX(page);
    if (ox > 2) results.overflowFails.push('home@' + w + ':' + ox + 'px');
  }

  // ---- Category pages (6) ----
  const cats = ['pdf-tools','image-tools','video-tools','audio-tools','text-tools','utility-tools'];
  let catScenes = 0;
  for (const c of cats) {
    await page.goto(BASE + '/' + c, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const sceneKids = await page.locator('.category-scene > *').count();
    if (sceneKids > 0) catScenes++;
    const cardVisible = await page.locator('.tool-grid .tool-card').first().isVisible();
    if (!cardVisible) results.regressions.push(c + ':cards MISSING');
  }
  results.scenes.category = catScenes + '/6';

  // ---- Tool pages (sample across families) ----
  const toolUrls = {
    'merge-pdf':'pdf-tools/merge-pdf','split-pdf':'pdf-tools/split-pdf','compress-image':'image-tools/compress-image',
    'remove-background':'image-tools/remove-background','image-upscaler':'image-tools/image-upscaler','image-to-text':'image-tools/image-to-text',
    'trim-video':'video-tools/trim-video','audio-converter':'audio-tools/audio-converter','qr-code-generator':'utility-tools/qr-code-generator',
    'qr-code-reader':'utility-tools/qr-code-reader','what-is-my-ip':'utility-tools/what-is-my-ip','password-generator':'utility-tools/password-generator',
    'barcode-generator':'utility-tools/barcode-generator','font-styler':'text-tools/font-styler','case-converter':'text-tools/case-converter','favicon-generator':'utility-tools/favicon-generator'
  };
  let toolScenes = 0;
  for (const [slug, url] of Object.entries(toolUrls)) {
    await page.goto(BASE + '/' + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const kids = await page.locator('.tool-motion-scene > *').count();
    if (kids > 0) toolScenes++;
    const wsVisible = await page.locator('#workspace').isVisible();
    if (!wsVisible) results.regressions.push(slug + ':workspace MISSING');
    // scroll through the page so IntersectionObserver reveals everything,
    // then confirm no [data-reveal] is left at opacity 0 (content must never hide).
    await page.evaluate(async () => {
      await new Promise(res => {
        let y = 0; const step = () => { window.scrollTo(0, y); y += 400; if (y < document.body.scrollHeight + 400) requestAnimationFrame(step); else res(); };
        step();
      });
    });
    await page.waitForTimeout(400);
    const hidden = await page.evaluate(() => {
      const els = [...document.querySelectorAll('[data-reveal]')];
      return els.filter(e => getComputedStyle(e).opacity === '0').length;
    });
    if (hidden > 0) results.regressions.push(slug + ': ' + hidden + ' reveal hidden after scroll');
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  results.scenes.tool = toolScenes + '/' + Object.keys(toolUrls).length;

  // ---- Reduced motion ----
  const rmCtx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
  const rmPage = await rmCtx.newPage();
  await rmPage.goto(BASE + '/', { waitUntil: 'networkidle' });
  await rmPage.waitForTimeout(300);
  const rmHidden = await rmPage.evaluate(() => {
    const els = [...document.querySelectorAll('[data-reveal]')];
    return els.filter(e => getComputedStyle(e).opacity === '0').length;
  });
  const rmHeroChips = await rmPage.locator('.hero-ecosystem .m-chip').count();
  results.reducedMotion = { hiddenReveals: rmHidden, heroChipsBuilt: rmHeroChips, pass: rmHidden === 0 };
  if (rmHidden !== 0) results.reducedMotionFails.push('home:' + rmHidden + ' hidden');
  await rmCtx.close();

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch(e => { console.error('AUDIT_CRASH', e); process.exit(1); });
