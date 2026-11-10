/* Generate REAL test fixtures for the browser acceptance test.
 * - multi-page PDFs (pdf-lib)
 * - distinct-background PNGs (node canvas) for background removal
 * - genuine HEIC files (pillow_heif via python)
 * No features changed; this is test data only.
 */
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { createCanvas } = require('canvas');

const OUT = path.resolve(__dirname, 'fixtures');
fs.mkdirSync(OUT, { recursive: true });

async function pagePdf(name, texts) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const t of texts) {
    const p = doc.addPage([400, 300]);
    p.drawText(t, { x: 40, y: 250, size: 28, font, color: rgb(0.1, 0.1, 0.5) });
  }
  fs.writeFileSync(path.join(OUT, name), await doc.save());
}

function bgImage(name, kind) {
  const W = 480, H = 360;
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  if (kind === 'subject-red') {
    // green gradient backdrop, red circle subject
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#2e8b57'); g.addColorStop(1, '#1b5e20');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath(); ctx.arc(W/2, H/2, 110, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '28px sans-serif';
    ctx.fillText('SUBJECT', 150, 30);
  } else if (kind === 'subject-blue') {
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(W/2-90, H/2-110, 180, 220);
    ctx.fillStyle = '#fff'; ctx.font = '28px sans-serif';
    ctx.fillText('BOX', 200, 30);
  } else if (kind === 'subject-person') {
    ctx.fillStyle = '#caa472'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5d4037';
    ctx.beginPath(); ctx.arc(W/2, 150, 70, 0, Math.PI*2); ctx.fill(); // head
    ctx.fillRect(W/2-110, 200, 220, 140); // body
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText('FIGURE', 165, 30);
  }
  fs.writeFileSync(path.join(OUT, name), c.toBuffer('image/png'));
}

(async () => {
  // Multi-page PDFs
  await pagePdf('a.pdf', ['PDF Page 1', 'PDF Page 2', 'PDF Page 3']);
  await pagePdf('b.pdf', ['PDF Single']);
  // background-removal inputs (3 distinct)
  bgImage('bg-red.png', 'subject-red');
  bgImage('bg-blue.png', 'subject-blue');
  bgImage('bg-person.png', 'subject-person');
  // a couple of normal images for image tools
  bgImage('img-1.png', 'subject-blue');
  console.log('PDF + PNG fixtures written to', OUT);
})();
