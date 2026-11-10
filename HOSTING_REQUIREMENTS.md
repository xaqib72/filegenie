# FileGenie — Hosting Requirements

## Minimum server
| Component | Requirement |
|---|---|
| PHP | **8.1 or newer** (tested on 8.3.33) |
| Web server | Apache with `mod_rewrite` **OR** Nginx (manual rewrite) |
| Extensions | `json` (standard), `session`, `mbstring`, `hash`, `random_bytes` (all default in PHP 8) |
| Database | **None** |
| Composer | **Not required** (no dependency install at runtime) |
| Node.js | **Not required in production** (only used to build/test engines locally) |
| Writable dirs | None required for the flattened production ZIP; `vendor/` is read-only at runtime |
| Disk | ~75 MB uncompressed for the app + vendored engines; ZIP is substantially smaller |

## Browser requirements (clients)
- Modern evergreen browser (Chrome, Edge, Firefox, Safari) with:
  - Canvas 2D (all image/utility tools)
  - WebAssembly (ffmpeg video/audio, background removal)
  - `crypto.subtle` / `crypto.getRandomValues` (password, hash tools) — served over HTTPS or `localhost`
  - File API + `URL.createObjectURL` (downloads)
- For best results, serve over **HTTPS** (some APIs like `crypto.subtle` require a secure context).

## What is NOT needed
- No MySQL/Postgres/SQLite.
- No Redis, queues, or cron.
- No API keys. The ONNX runtime is bundled; the background-removal segmentation model is fetched from its documented provider on first use.
- No build step on the server.

## Shared hosting notes
- Most cPanel/Plesk shared hosts satisfy this (PHP 8.1+ selectable in the panel).
- If the host disables `mod_rewrite`, switch to the Nginx-style front controller or ask support to enable it.
- The production root `.htaccess` and nested directory rules protect `app/`, `config/`, `scripts/`, `storage/`, tests, hidden files, and package files from direct web access.
- Large client-side engines (ffmpeg and model/WASM assets) are fetched from same-origin `vendor/`; ensure the host does not impose a tiny per-file size cap on static assets (most don't).

## Performance / scaling
- Static assets (CSS/JS/vendor) are cacheable; heavy engines lazy-load only when a tool runs, so the homepage stays light.
- CPU/memory load is on the client, not the server — the server only serves files. A low-tier shared plan handles heavy traffic for the PHP layer.
