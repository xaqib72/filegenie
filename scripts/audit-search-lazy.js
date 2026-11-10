const { chromium } = require('playwright');
const CHROME = 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const BASE = 'http://127.0.0.1:8777';
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // --- Search finds all 60 (query by each tool's registry name) ---
  const { execSync } = require('child_process');
  const names = JSON.parse(execSync('php storage/tool-names.php').toString());
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const foundCount = await page.evaluate(async (names) => {
    const out = [];
    for (const name of names) {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(name)}`);
        const j = await r.json();
        const foundNames = (j.results || []).map(x => x.name);
        out.push(foundNames.includes(name));
      } catch (e) { out.push(false); }
    }
    return out.filter(Boolean).length;
  }, names);
  console.log('SEARCH finds (by name):', foundCount, '/', names.length);

  // --- Homepage must NOT eagerly load heavy libs ---
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const lazy = await page.evaluate(() => {
    const scripts = Array.from(document.scripts).map(s => s.src || '');
    const heavy = ['ffmpeg', 'tesseract', 'ort', 'zxing', 'pdf-secure', 'upscaler', 'jszip', 'heic', 'qrcode'];
    const loaded = heavy.filter(h => scripts.some(s => s.includes('/vendor/' + h)));
    return { loadedHeavyOnHome: loaded };
  });
  console.log('HEAVY libs loaded on homepage:', JSON.stringify(lazy.loadedHeavyOnHome));

  // --- Font Styler: single page, paginated (not 1000s of DOM cards at once) ---
  await page.goto(`${BASE}/text-tools/font-styler`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#fs-input', { timeout: 15000 });
  await page.fill('#fs-input', 'FileGenie');
  await page.waitForTimeout(500);
  const font = await page.evaluate(() => {
    const cards = document.querySelectorAll('.fs-card').length;
    const hasMore = !!document.getElementById('fs-more');
    const grid = !!document.getElementById('fs-grid');
    return { visibleCards: cards, hasLoadMore: hasMore, hasGrid: grid };
  });
  console.log('FONT STYLER visible cards:', font.visibleCards, '| load-more button:', font.hasLoadMore, '| grid:', font.hasGrid);

  await browser.close();
})();
