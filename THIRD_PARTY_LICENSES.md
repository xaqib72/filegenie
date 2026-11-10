# Third-Party Licenses & Attributions

All third-party libraries are bundled under `public/vendor/` and run client-side. FileGenie itself is proprietary/closed for this build. The engines below retain their respective open-source licenses; FileGenie complies with each.

---

## pdf-lib — MIT
- **Version:** 1.17.1
- **Source:** https://github.com/Hopding/pdf-lib
- **Use:** PDF merge, split, rotate, reorder, delete, JPG→PDF, compress.
- **License text (MIT):** Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction... (full MIT license in the package's LICENSE).

## pdfjs-dist (PDF.js) — Apache-2.0
- **Version:** 6.2.108
- **Source:** https://github.com/mozilla/pdf.js (Mozilla Public License 2.0 / Apache-2.0 for the build)
- **Use:** Page rasterization for PDF→JPG.
- **Note:** Mozilla PDF.js is covered by the Apache License 2.0.

## ffmpeg.wasm (@ffmpeg/ffmpeg + @ffmpeg/util + @ffmpeg/core) — MIT
- **Version:** @ffmpeg/ffmpeg 0.12.15, @ffmpeg/util 0.12.2, @ffmpeg/core 0.12.10
- **Source:** https://github.com/ffmpegwasm/ffmpeg.wasm
- **Use:** All video and audio tools.
- **License (MIT):** Copyright ffmpegwasm. Permission granted free of charge to use, copy, modify...
- **Underlying FFmpeg:** compiled FFmpeg is distributed under the LGPL/GPL; the default web core is built from FFmpeg LGPL configuration. No GPL-only codecs (e.g. libx264) are enabled.

## @imgly/background-removal — MIT
- **Version:** 1.7.0
- **Source:** https://github.com/imgly/background-removal-js
- **Use:** Remove Background tool (onnx model, bundled).
- **License (MIT):** Copyright IMG.LY.

## heic2any — MIT
- **Version:** 0.0.4
- **Source:** https://github.com/alexcorvi/heic2any
- **Use:** HEIC→JPG/PNG conversion.
- **License (MIT):** Copyright Alex Corvi.

## qrcode — MIT
- **Version:** 1.5.4
- **Source:** https://github.com/soldair/node-qrcode
- **Use:** QR Code Generator.
- **License (MIT):** Copyright Ryan Day.

## jszip — MIT / GPLv3 (dual)
- **Version:** 3.10.1
- **Source:** https://github.com/Stuk/jszip
- **Use:** Multi-output ZIP (e.g. PDF→JPG produces a zip of images).
- **License:** Dual-licensed MIT or GPLv3; FileGenie uses it under the MIT option.

---

## Compliance summary
- No proprietary library is redistributed in violation of its license.
- All are permissive (MIT/Apache-2.0) except optional FFmpeg (LGPL) and JSZip (dual, used as MIT).
- No telemetry, tracking, or external network calls are made by the bundled engines except the background-removal model fetch, which is served same-origin from `public/vendor/background/`.
