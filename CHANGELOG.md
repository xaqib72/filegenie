# Changelog

## 1.0.1 — 2026-10-21
**Tool-header layout fix.**

### Fixed
- **Save button / tool title overlap (critical):** The `.tool-header-master .fav-toggle`
  rule used `position:absolute` with `padding-right:84px` as a spacing hack. On wide
  viewports the clamped `h1` (`clamp(2.25rem,4vw,3.85rem)`) could overflow the padded
  content area and overlap the absolutely-positioned Save button; on the `560px`
  breakpoint `padding-right` was removed while `position` returned to `static`,
  causing a flex-flow collision between the title and the button.

  Resolved by restructuring the template into three semantic grid regions: icon,
  title/description (`.tool-header-content`), and action controls
  (`.tool-header-actions`). The grid (`grid-template-columns: auto1fr auto`) guarantees
  the Save button never overlaps the title regardless of length. At ≤560px the grid
  collapses to two columns and `.tool-header-actions` spans full width below the title.
  `max-width:100%` on the `h1` prevents overflow. Verified across all 60 tool pages.

### Changed
- `app/Views/tool/show.php` — Save button moved into dedicated `.tool-header-actions` region.
- `public/assets/css/three-experience.css` — Replaced absolute-positioning hack with CSS Grid layout for `.tool-header-master`; removed `padding-right:84px` spacer.
- `public/assets/css/tools.css` — Added `.tool-header-content` and `.tool-header-actions` base styles; removed `margin-left:auto` from `.fav-toggle` (now handled by grid placement).
- `CHANGELOG.md` — Corrected per-category tool counts (PDF 8→13, Image 10→14, Video 6→8, Audio 6→7, Utilities 6→10).

## 1.0.0 — 2026-08-23
**Initial production release.**

### Features
- 60 real, client-side tools across 6 categories:
  - **PDF (13):** merge, split, compress, JPG→PDF, PDF→JPG, rotate, reorder, delete pages, add page numbers, watermark, extract pages, protect (AES), unlock.
  - **Image (14):** compress, resize, crop, convert, remove background (AI), add watermark, rotate, round corners, HEIC→JPG, strip EXIF, image-to-text (OCR), image upscaler (AI), add text, rotate & flip.
  - **Video (8):** compress, trim, mute, to-GIF, resize, extract audio, MOV→MP4, MKV→MP4 (all via ffmpeg.wasm).
  - **Audio (7):** convert, trim, merge, change speed, to-mono, volume boost, M4A→MP3 (ffmpeg.wasm).
  - **Text/Font (8):** case converter, word counter, remove duplicate lines, sort lines, text cleaner, text compare (diff), font styler (Unicode math glyphs), text formatter (JSON).
  - **Utilities (10):** password generator, QR code generator, color picker/converter, favicon generator, Base64 tool, file hash checker, QR reader, barcode generator, barcode reader, what-is-my-ip.
- Premium responsive frontend: sticky header, mega menu, mobile nav, dark/light/system theme, universal `/` search, recents & favourites (localStorage).
- Clean URL routing (`/pdf-tools/merge-pdf`) via Apache `.htaccess` front controller.
- SEO built-in: unique titles, canonicals, Open Graph, JSON-LD (WebSite/Organization/WebApplication/FAQPage), `sitemap.xml`, `robots.txt`, `manifest.webmanifest`.
- Security: CSRF (`hash_equals`) on contact, security headers (HSTS/X-Frame-Options/nosniff/Referrer-Policy/Permissions-Policy), sensitive-path deny rules, no server-side file storage.
- Accessibility: semantic landmarks, aria-labels, keyboard-operable dropzone and nav, focus management.
- Updated registry, sitemap, smoke checks, docs, and deployment package to the current 60-tool inventory.

### Architecture
- PHP 8.1+ lightweight MVC (front controller, router, controllers, views, PSR-4 autoloader). No Laravel/WordPress, no DB, no production Node runtime.
- Browser engines: pdf-lib, pdfjs, Canvas, ffmpeg.wasm, @imgly/background-removal, heic2any, qrcode, jszip — all vendored under `public/vendor/`; heavy engines lazy-load on first use.

### Known limitations
- `pdf-to-jpg` harness is limited by the Node canvas shim (lacks `fillRect`); rasterization runs in a real browser.
- Background and HEIC engines are verified by code review + vendored library; they require a real browser WASM/onnx runtime and are not exercised by the headless Node harness.
- Default ffmpeg.wasm core does not include `libx264` (uses mpeg4/vp8/vorbis/mp3/wav/aac/ogg/flac); H.264 output is not advertised.
