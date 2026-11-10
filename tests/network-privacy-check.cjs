const { chromium } = require('playwright');
const path = require('node:path');

const BASE = process.env.BASE || 'http://127.0.0.1:8082';
const CHROME = process.env.CHROME_PATH;
const ROOT = path.resolve(__dirname, '..');

(async () => {
    const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ['--no-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    const requests = [];
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    await page.goto(`${BASE}/image-tools/compress-image`, { waitUntil: 'networkidle' });
    await page.setInputFiles('#file-input', path.join(ROOT, 'tests', 'fixtures', 'img-1.png'));
    await page.click('#process-btn');
    await page.waitForSelector('#result:not([hidden])', { timeout: 120000 });
    const uploads = requests.filter((request) => /^(POST|PUT|PATCH)$/i.test(request.method));
    const fileUploadEndpoints = uploads.filter((request) => !/\/api\/ip|\/api\/search/.test(request.url));
    const report = {
        checked: ['/image-tools/compress-image'],
        totalRequests: requests.length,
        mutatingRequests: uploads,
        unexpectedFileUploadEndpoints: fileUploadEndpoints,
        pass: fileUploadEndpoints.length === 0,
    };
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
    process.exit(report.pass ? 0 : 2);
})().catch((error) => { console.error(error); process.exit(3); });
