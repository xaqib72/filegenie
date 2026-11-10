const { chromium } = require('playwright');
const CHROME = 'C:\\Users\\Muhammad Saqib\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8777/image-tools/image-upscaler', { waitUntil: 'networkidle' });
  await page.waitForSelector('#file-input');
  const out = await page.evaluate(async () => {
    const s = document.createElement('script');
    await new Promise((res, rej) => { s.onload = res; s.onerror = rej; s.src = '/vendor/upscaler/ort/ort.min.js'; document.head.appendChild(s); });
    const ort = window.ort || (window.ort && window.ort.default);
    ort.env.wasm.wasmPaths = '/vendor/upscaler/ort/';
    ort.env.wasm.numThreads = 1;
    const buf = await (await fetch('/vendor/upscaler/subpixel.onnx')).arrayBuffer();
    const sess = await ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: ['wasm'] });
    const inName = sess.inputNames[0], outName = sess.outputNames[0];
    const dummy = new ort.Tensor('float32', new Float32Array(1*1*224*224), [1,1,224,224]);
    const res = await sess.run({ [inName]: dummy });
    const od = res[outName].dims;
    const ttype = res[outName].type;
    const VAL = res[outName].data;
    let mn = Infinity, mx = -Infinity;
    for (let i=0;i<VAL.length;i++){ if(VAL[i]<mn)mn=VAL[i]; if(VAL[i]>mx)mx=VAL[i]; }
    return { inName, outName, outDims: od, outType: ttype, min: mn, max: mx, len: VAL.length };
  });
  console.log('PROBE:', JSON.stringify(out));
  await browser.close();
})();
