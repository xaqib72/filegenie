import fs from 'fs';
import { PDFDocument, degrees } from 'pdf-lib';

const a = await PDFDocument.load(fs.readFileSync('tests/fixtures/a.pdf'));
const b = await PDFDocument.load(fs.readFileSync('tests/fixtures/b.pdf'));

const merged = await PDFDocument.create();
const ap = await merged.copyPages(a, a.getPageIndices()); ap.forEach(p=>merged.addPage(p));
const bp = await merged.copyPages(b, b.getPageIndices()); bp.forEach(p=>merged.addPage(p));
console.log('MERGE: ->', (await PDFDocument.load(await merged.save())).getPageCount(), 'pages');

const split = await PDFDocument.create();
const sp = await split.copyPages(a, [0]); sp.forEach(p=>split.addPage(p));
console.log('SPLIT: 3 ->', (await PDFDocument.load(await split.save())).getPageCount());

const rot = await PDFDocument.load(fs.readFileSync('tests/fixtures/a.pdf'));
rot.getPage(0).setRotation(degrees(90));
console.log('ROTATE: page0 angle', (await PDFDocument.load(await rot.save())).getPage(0).getRotation().angle);

const ro = await PDFDocument.create();
const rev = await ro.copyPages(a, [2,1,0]); rev.forEach(p=>ro.addPage(p));
console.log('REORDER: ->', (await PDFDocument.load(await ro.save())).getPageCount());

const del = await PDFDocument.create();
const dp = await del.copyPages(a, [0,2]); dp.forEach(p=>del.addPage(p));
console.log('DELETE: 3 ->', (await PDFDocument.load(await del.save())).getPageCount());

const comp = await PDFDocument.load(fs.readFileSync('tests/fixtures/a.pdf'));
const compBytes = await comp.save({ useObjectStreams:false });
console.log('COMPRESS: bytes', fs.readFileSync('tests/fixtures/a.pdf').length, '->', compBytes.length);

const jdoc = await PDFDocument.create();
const img = await jdoc.embedJpg(fs.readFileSync('tests/fixtures/sample.jpg'));
const pg = jdoc.addPage([img.width, img.height]);
pg.drawImage(img, {x:0,y:0,width:img.width,height:img.height});
console.log('JPG2PDF: bytes', (await jdoc.save()).length);

const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await getDocument({ data: fs.readFileSync('tests/fixtures/b.pdf') }).promise;
const page = await doc.getPage(1);
const vp = page.getViewport({ scale: 2 });
const { createCanvas } = await import('canvas');
const canvas = createCanvas(vp.width, vp.height);
const ctx = canvas.getContext('2d');
await page.render({ canvasContext: ctx, viewport: vp }).promise;
const outPng = canvas.toBuffer('image/png');
console.log('PDF2IMG: PNG bytes', outPng.length, vp.width+'x'+vp.height);
