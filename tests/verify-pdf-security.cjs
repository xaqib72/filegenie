const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE || 'http://127.0.0.1:8082';
const CHROME = process.env.CHROME_PATH;
const ROOT = path.resolve(__dirname, '..');
const protectedPath = path.join(__dirname, 'evidence', 'qa60', '12-protect-pdf.pdf');
const unlockedPath = path.join(__dirname, 'evidence', 'qa60', '13-unlock-pdf.pdf');

(async () => {
    const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`${BASE}/pdf-tools/protect-pdf`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.PDFLib && window.PDFLib.PDFDocument);
    const protectedBase64 = fs.readFileSync(protectedPath).toString('base64');
    const unlockedBase64 = fs.readFileSync(unlockedPath).toString('base64');
    const result = await page.evaluate(async ({ protectedBase64, unlockedBase64 }) => {
        const decode = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
        const load = async (data, options) => {
            try {
                const doc = await window.PDFLib.PDFDocument.load(data, options || {});
                return { opens: true, pages: doc.getPageCount() };
            } catch (error) {
                return { opens: false, error: String(error && error.message || error).slice(0, 140) };
            }
        };
        return {
            protectedWithoutPassword: await load(decode(protectedBase64)),
            protectedWithPassword: await load(decode(protectedBase64), { password: 'secret123' }),
            unlockedWithoutPassword: await load(decode(unlockedBase64)),
        };
    }, { protectedBase64, unlockedBase64 });
    console.log(JSON.stringify(result, null, 2));
    const pass = !result.protectedWithoutPassword.opens && result.protectedWithPassword.opens && result.unlockedWithoutPassword.opens;
    await browser.close();
    process.exit(pass ? 0 : 2);
})().catch((error) => { console.error(error); process.exit(3); });
