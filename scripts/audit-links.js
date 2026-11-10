const { chromium } = require('playwright');
const CHROME = process.env.CHROME_PATH || undefined;
const BASE = process.env.FILEGENIE_BASE || 'http://127.0.0.1:8082';
(async () => {
  const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ['--no-sandbox'] });

  // Collect every internal link via a single crawl from the homepage using HTTP status checks.
  const visited = new Set();
  const queue = ['/', '/all-tools', '/pdf-tools', '/image-tools', '/video-tools', '/audio-tools', '/text-tools', '/utility-tools'];
  const broken = [];

  // Step 1: gather all tool links from /all-tools (discovery).
  {
    const page = await browser.newPage();
    await page.goto(`${BASE}/all-tools`, { waitUntil: 'networkidle', timeout: 20000 });
    const toolLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="/pdf-tools/"], a[href^="/image-tools/"], a[href^="/video-tools/"], a[href^="/audio-tools/"], a[href^="/text-tools/"], a[href^="/utility-tools/"]')).map(a => a.getAttribute('href')));
    console.log('ALL-TOOLS tool links found:', toolLinks.length, '(want 60)');
    for (const l of toolLinks) if (!visited.has(l)) queue.push(l);
    await page.close();
  }

  // Step 2: verify each collected URL returns 200.
  for (const url of Array.from(new Set(queue))) {
    const page = await browser.newPage();
    try {
      const resp = await page.goto(url.startsWith('http') ? url : BASE + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const status = resp.status();
      if (status !== 200) broken.push({ url, status });
    } catch (e) {
      broken.push({ url, status: 'ERR', err: e.message.slice(0, 50) });
    }
    await page.close();
  }

  console.log('TOTAL URLs checked:', new Set(queue).size);
  console.log('BROKEN LINKS:', broken.length);
  broken.forEach(b => console.log('  -', b.url, b.status, b.err || ''));

  await browser.close();
})();
