# FileGenie — Redesign Audit & QA

**Audit date:** 2026-10-19 (tool-header fix: 2026-10-21)  
**Source:** `Website/` extracted from the supplied `Website.zip`  
**Release artifact:** `../FileGenie-Hostinger-Ready.zip`  
**Runtime checked:** PHP 8.3.33 CLI, Node.js 24, Apache configuration reviewed  
**Registry source of truth:** 60 tools across six categories

## Executive summary

The source was audited and rebuilt around a new Meridian visual system: dark
ink and light editorial surfaces, indigo/cyan accents, tighter typography,
stronger task hierarchy, deliberate depth, and shared workspace states. The
existing PHP/MVC architecture, browser engines, vendor runtime, routes, and
Three.js scenes were preserved rather than replaced with a mock interface.

The current registry is **60 tools**, not 44. The release now consistently
uses 60 in generated sitemap output, route checks, manifest copy, registry
validation, smoke checks, and documentation. The final ZIP is a flattened
production staging build with no `node_modules/`, `storage/`, `tests/`,
`scripts/`, package files, or development reports.

The full browser QA was completed after installing the missing Chromium
runtime dependencies. Every current registry entry was executed through the
real workspace with representative fixtures, and every output was downloaded
and signature/content-validated. The 60-row matrix records **60/60 PASS**.
The remaining release caveats are Lighthouse measurement, final Hostinger
Apache settings, and the external first-use background model provider.

## Relevant available skills

Loaded and applied:

- `omnirush-setup` — repository mapping, stack/check discovery, runtime gaps.
- `omnirush-feature` — acceptance-oriented implementation and focused changes.
- `omnirush-test` — boundary cases, real-user-flow test selection, honest gaps.
- `omnirush-build` — runtime/toolchain reproduction and build/package evidence.
- `omnirush-performance` — lazy loading, reduced-motion, payload and FOUC review.
- `omnirush-review` — independent audit of routes, engines, security, and UI.

No specialized frontend/3D/Playwright/Hostinger skill was installed in the
environment. Equivalent practices were applied manually. Two independent
read-only audits were also run: one for PHP/deployment/security and one for
frontend/motion/accessibility.

## Defects found and fixes

| Area | Finding | Fix |
|---|---|---|
| `/about` | View used `../Registry/ToolRegistry.php`, which resolved outside the registry directory and caused a 500. | Removed the path-relative include and used the bootstrap autoloader. `/about` now returns 200. |
| Router | Literal dots in `sitemap.xml` and `robots.txt` were treated as regex wildcards. | Router now quotes literal segments and only expands `{param}` segments. |
| Private paths | Root `.htaccess` filename matching did not protect nested `app`, `config`, `scripts`, `storage`, or test paths. | Added directory-level rewrite denials, defense-in-depth nested `.htaccess` files, hidden/source-file rules, no indexes, engine MIME types, and staging checks. |
| Domain config | `base_url` was `http://127.0.0.1:8080`; sitemap and robots were hardcoded independently. | `FILEGENIE_BASE_URL` with explicit HTTPS fallback; dynamic sitemap/robots use config; static sitemap is generated from config. |
| Sitemap | Static files could bypass config on custom domains. | Apache routes `/sitemap.xml` and `/robots.txt` through the front controller; controller emits configured URLs. |
| Documentation | README, manifest, QA, and deployment docs said 44 tools. | Current docs and generated manifest now use the actual 60-tool registry. |
| QA gates | Smoke check expected 44; corrupt-file acceptance was hardcoded true; browser link audit looked for obsolete `/tools/` paths. | Smoke expects 60, corrupt-file result is asserted, and link audit discovers all six category URL prefixes. |
| Base64 | Decode mode was blocked by the generic “needs files” gate. | Base64 is file-optional; encode still uses a selected file and decode uses the text control. |
| Wildcard picker | Hash checker rendered `accept=".*"`. | `*` now renders as the browser-standard `*/*`. |
| Batch images/HEIC | Several registry batch tools silently processed only `files[0]`. | Resize, convert, watermark, rotate, EXIF, rotate/flip, and HEIC batch paths process every file and package outputs in a real ZIP. |
| Font Styler | Process downloaded plain input instead of a styled result. | Process now emits the deterministic Unicode bold transformation shown in the style browser. |
| Result state | Success icon stayed hidden because `is-shown` was never added. | Workspace adds/removes the result state class and revokes object URLs on reset. |
| Batch ordering | Merge-style tools promised ordering but only rendered remove controls. | Batch queue includes accessible move up/down controls and reflects the actual processing order. |
| 3D state timing | Family scenes mixed `performance.now()` seconds with `THREE.Clock` elapsed seconds. | Scene state transitions now use one elapsed-time clock. |
| 3D fallback | Three.js imported before reduced-motion/WebGL/low-power checks. | Bootstrap checks reduced motion, save-data/low-power, and WebGL before loading the runtime. |
| Theme/accessibility | Deferred theme application caused flash; toggle ARIA and mobile labels were stale; search lacked focus restoration and listbox state. | Inline theme bootstrap, synchronized `aria-pressed`/labels, focus restoration, abortable search, and `aria-selected` updates. |
| CSS delivery | Print-media async CSS could leave the hero/3D layout unstyled. | Critical motion/scene/design styles are linked normally to avoid FOUC; SEO validator now checks the intended behavior. |
| IP utility | Any client could spoof `X-Forwarded-For`. | Forwarded IPs are honored only for explicitly configured trusted proxy addresses. |

## Design implementation

The new shared layer is `public/assets/css/premium.css`. It re-art-directs
the whole existing page system rather than only recoloring the homepage:

- Meridian tokens for light/dark surfaces, ink, indigo/cyan accents, borders,
  spacing, radii, shadows, typography, focus, and motion behavior.
- Editorial hero hierarchy with a file-transformation 3D stage and a CSS
  fallback; the existing Three.js family scenes remain task-oriented.
- Shared premium cards, category navigation, tool headers, dropzones, queues,
  controls, progress, result, error, FAQ, sidebar, search, header, and footer.
- Skip link, live progress/result states, accessible file input label, mobile
  navigation label state, search listbox semantics, and stronger focus rings.
- Reduced-motion fallback hides decorative WebGL and preserves the static task
  flow. Small screens receive smaller stages and simplified visual density.
- The ONNX runtime and WASM for background removal are now included under
  `vendor/onnxruntime`; the segmentation model remains an explicit first-use
  provider download and is not described as fully offline.

## Checks actually run

### Passed

| Check | Evidence |
|---|---|
| PHP lint | 53 PHP files under `app/`, `config/`, `public/`, and `scripts/` passed `php -l`. |
| JavaScript syntax | `npm test` → `JavaScript syntax OK: 42 files`. |
| Registry | `php scripts/validate-tools.php` → 60 tools; category counts 13/14/8/7/8/10; success. |
| Route smoke | `php scripts/route_smoke.php` → 46 pass, 0 fail, including `/about`, 404, sitemap, robots, and representative tools. |
| Local front-controller smoke | `php scripts/smoke-test.php` → all 22 checks pass; registry count 60. |
| SEO validator | `php scripts/seo_validate.php` → 60/60 slugs, 68 sitemap URLs, 60/60 content and related links, configured CSS delivery. |
| Sitemap generation | `php scripts/generate-sitemap.php` → 68 URLs. |
| Manifest generation | `php scripts/generate-tool-manifest.php` → 60 rows. |
| Text engine | `node scripts/engine-test-text.cjs` → 12 operations, 0 failed, including Font Styler. |
| Development HTTP routes | PHP server checks: homepage, all-tools, six categories, static pages, representative tools, APIs, robots, sitemap, and 404. |
| Every source tool route | Registry-driven curl smoke → 60/60 tool URLs returned HTTP 200. |
| Production staging routes | Extracted flattened package → 60/60 tool URLs returned HTTP 200. |
| Tool page markers/SEO | Extracted package → 60/60 tool pages contained title, H1, and workspace markers; 60/60 titles were unique. |
| Custom-domain SEO | Staged server with `FILEGENIE_BASE_URL=https://example.test`: sitemap/robots/about output had no localhost/filegenie fallback and used example.test. |
| Private-path behavior | Extracted package local-router: app/config/scripts/storage/tests/node_modules/tmp requests returned 403; unknown route returned 404. Apache rules also include directory denials. |
| Archive inspection | ZIP root has `index.php`, `.htaccess`, `assets/`, `vendor/`, `app/`, `config/`, robots, sitemap, manifest, README; forbidden development trees count 0. |
| 60-tool browser operations | `NODE_PATH=/tmp/filegenie-browser/node_modules BASE=http://127.0.0.1:8086 CHROME_PATH=/root/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome node tests/acceptance60.cjs` → **60/60 PASS**, 0 JS/page/network failures. |
| Browser output validation | Real signatures validated for PDF, ZIP, PNG, JPG, GIF, ICO, WebP, MP4, WebM, MP3, text, plus QR/barcode payloads and OCR content. |
| PDF security round-trip | `node tests/verify-pdf-security.cjs` → protected PDF blocked without password, opened with `secret123`, unlocked PDF opened without password. |
| Responsive/UI browser acceptance | `node tests/acceptance3.cjs` → 21/21 pass at 360/390/430/768/1366/1920 px; search, theme, mega menu, mobile nav, invalid-file recovery, sitemap, canonical, JSON-LD, and no page/console errors. |
| Representative category browser acceptance | `node tests/acceptance2.cjs` → 6/6 pass for PDF, image, video, audio, text, and utility flows. |
| User-file network privacy | `node tests/network-privacy-check.cjs` → 30 requests, 0 mutating requests, 0 unexpected file-upload endpoints. |
| Tool-header / Save button overlap fix | `php` front-controller dispatch + live server curl for all 60 tools → 60/60 pages contain `.tool-header-actions` and `.tool-header-content` in correct DOM order; `.tool-header-master` uses CSS Grid (`grid-template-columns: auto 1fr auto`); no `position:absolute` on `.fav-toggle`; tested with short/long/ampersand titles; mobile breakpoint verified. |

## Remaining release limitations

1. Confirm the external background-removal model provider's availability and
   exact license/network policy for the final Hostinger account.
2. Run Lighthouse on homepage, PDF, image ML, and video/audio routes once a
   browser is available; record actual mobile and desktop scores.
3. Reduced-motion/WebGL fallback code is statically verified and the normal
   browser path is verified. A dedicated browser run with forced `prefers-reduced-motion`
   and WebGL disabled remains a follow-up check.
4. Apache binary was available for inspection, but a complete Debian Apache
   service installation could not be initialized in this container. The final
   `.htaccess` was validated structurally and the flattened package was tested
   with the equivalent PHP front-controller harness.
5. No Lighthouse score is reported. Lighthouse requires a usable browser and
   was not installed in this environment; no performance score is invented.

## 60-tool functional QA matrix

The matrix is deliberately generated from `ToolRegistry::getAll()` so it
cannot silently omit a current tool. Every row was executed in Chromium 156
against real fixtures and output-validated:

| Category | Tools | Result |
|---|---:|---|
| PDF | 13 | PASS — 13/13 real operations and output signatures |
| Image | 14 | PASS — 14/14 real operations; OCR/upscaler/background/HEIC included |
| Video | 8 | PASS — 8/8 real FFmpeg WASM operations |
| Audio | 7 | PASS — 7/7 real FFmpeg WASM operations |
| Text & Font | 8 | PASS — 8/8 real transformations with exact/content assertions |
| Utility | 10 | PASS — 10/10 real operations; QR/barcode generate→read round trips included |
| **Total** | **60** | **60/60 browser operation passes; 0 console/page/network failures** |

Required operation groups are present in the registry and route matrix,
including PDF protect/unlock, QR/barcode generation and reading, EXIF,
OCR/upscaler/background/HEIC, video/audio FFmpeg tools, and all text cases.
The CSV contains the route, engine, fixture, action, output validation,
browser, result, issue, and evidence path for every row.

## Hostinger package

The production package is built separately from the development tree and has
the flattened document-root layout required by the request. It includes the
runtime `vendor/` tree (including browser libraries, workers, models/WASM, and
same-origin ONNX runtime) and excludes development-only files.

Deployment instructions are included inside the archive as
`README-HOSTINGER.txt` and also exist at the source root. The domain setting
is explicit: edit `config/site.php` or set `FILEGENIE_BASE_URL`; default
fallback is `https://filegenie.com`, never localhost.

### Production ZIP checksum

```
SHA-256: f90437ea8f26df3793217f7b032979bbfd3f3ce9eb0638c6a8707c34e7f413c7
File:   FileGenie-Hostinger-Ready.zip
```

## Remaining release limitations

1. Confirm the external background-removal model provider's availability and
   exact license/network policy for the final Hostinger account.
2. Run Lighthouse on homepage, PDF, image ML, and video/audio routes once a
   browser is available; record actual mobile and desktop scores.
3. Confirm Hostinger's Apache `AllowOverride` and PHP 8.1+ settings after
   upload. The archive is structured for direct extraction; no rearrangement,
   npm, Composer, or database is required.
