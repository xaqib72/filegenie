# FileGenie

FileGenie is a browser-first toolkit with 60 free tools for PDF, image, video, audio, text, and everyday file tasks. Supported file operations run locally in the visitor's browser, so the files are not uploaded to FileGenie's server.

Live site: [https://filegenie.tech](https://filegenie.tech)

## Highlights

- 60 tools across six categories, each with its own page and shareable URL
- Client-side processing with JavaScript, Canvas, Web Audio, and WebAssembly
- Search, category browsing, related tools, and SEO sitemap
- Responsive interface with optional homepage 3D scenes
- Docker image runs PHP 8.3 and Apache; suitable for an Nginx reverse proxy

## Run with Docker

From this directory:

```sh
cp .env.example .env
docker compose up -d --build
```

Open `http://localhost:8082`. Configure `FILEGENIE_BASE_URL` and, when using a reverse proxy, `FILEGENIE_TRUSTED_PROXIES` in `.env`. To enable Google Analytics or a Google Tag Manager container, set `FILEGENIE_GOOGLE_TAG_ID`; the tag loads only after visitors accept analytics.

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for VPS and reverse-proxy setup.

## Run locally without Docker

With PHP 8.1 or newer installed:

```sh
php -S 127.0.0.1:8082 -t public scripts/php-dev-router.php
```

Open `http://127.0.0.1:8082`.

## Project layout

- `app/` — PHP controllers, registries, support code, and page templates
- `config/` — site configuration and environment-backed settings
- `public/` — front controller, styles, scripts, browser engines, and static assets
- `scripts/` — sitemap, validation, and audit tools
- `tests/` — functional and privacy checks
- `deploy/` — example Nginx and Apache reverse-proxy configurations

## Privacy

File processing happens in the user's browser. Optional Google Analytics is consent-gated; the Google tag is not loaded until a visitor allows analytics.
