# FileGenie — Deployment Guide

## What this package is
FileGenie is a premium, 100% client-side file-tools platform: 60 tools across PDF, Image, Video, Audio, Text/Font, and Utilities. All processing happens in the visitor's browser. The PHP layer only:
- serves pages via a clean-URL front controller,
- powers instant tool search (`/api/search`),
- emits SEO (`sitemap.xml`, `robots.txt`, JSON-LD),
- handles the contact form CSRF + mailto fallback.

There is **no database, no composer install, no Node runtime in production**. Upload the files; it works.

## Requirements
See `HOSTING_REQUIREMENTS.md`. In short: Apache (or any PHP server) with PHP 8.1+, `mod_rewrite` enabled, and a writable `public/` for `sitemap.xml`.

## Deploy steps
1. Upload **`FileGenie-Hostinger-Ready.zip`** to `public_html` and extract it there. It is already flattened; there is no `Website/` or `public/` wrapper to rearrange.
   - The document root must be the folder containing the package's root `index.php`.
2. If working from the development tree instead, the `public/` directory is the document root and `app/`/`config/` must remain alongside it. The production ZIP is preferred because it already places all runtime assets under root `assets/` and `vendor/` and excludes development files.
3. Ensure the root `.htaccess` is uploaded (Apache). Nginx/other servers: see the rewrite section below.
4. Set the correct `base_url` in `config/site.php` to your domain (e.g. `https://yourdomain.com`) or set `FILEGENIE_BASE_URL`. This drives canonical URLs, robots, Open Graph, JSON-LD, and the sitemap.
5. Generate the sitemap once from the source tree (and after adding tools):
   ```
   php scripts/generate-sitemap.php
   ```
   This writes `public/sitemap.xml`. (You can also run it locally and upload the resulting file.)
6. Visit your domain. No further setup needed.

## Docker
From the `Website/` directory, build and start the app with Docker Compose:
```sh
docker compose up -d --build
```
Then open `http://localhost:8082`. To use another host port, set
`FILEGENIE_PORT` (the default is 8082, bound only to localhost for a reverse
proxy on a VPS). Set `FILEGENIE_BASE_URL` to `https://filegenie.tech` before starting the service so
canonical URLs, robots, and the sitemap use the deployed domain. The container
uses PHP 8.3 with Apache rewrite enabled; no Node.js, database, or uploaded-file
volume is needed because file processing happens in each visitor's browser.
Check startup and health with `docker compose ps` and `docker compose logs`.
To enable Google Analytics, set `FILEGENIE_GOOGLE_TAG_ID` to your `G-...`
Measurement ID or `GTM-...` Tag Manager container ID in `.env`. The tag is
loaded only after a visitor accepts analytics; the footer's Privacy settings
control lets them change their choice. A GTM container must also have a Google
tag configured for your `G-...` Measurement ID and published. Recreate the app
after changing the ID with `docker compose up -d --build --force-recreate filegenie`.
For a VPS that already hosts another website, keep the existing web server on
ports 80/443 and add a separate `filegenie.tech` virtual host that proxies to
`http://127.0.0.1:8082`. Example Nginx and Apache virtual-host files are in
`deploy/`. Point the `filegenie.tech` and `www.filegenie.tech` DNS A records at
the VPS first, then issue an HTTPS certificate for those hostnames. Do not
replace the current site's virtual host. If using the IP-address tool, set
`FILEGENIE_TRUSTED_PROXIES` to the proxy address visible inside the FileGenie
container (often the Docker bridge gateway) so it can safely read the visitor
address from the reverse-proxy header. Start with `cp .env.example .env`, edit
that one VPS environment file, then run Compose from this directory. After
startup, check `/api/ip`; its `remoteAddr` value is the address to trust.

## Web server config
### Apache (recommended)
The included `public/.htaccess` already:
- rewrites all non-file requests to `index.php`,
- sets security headers,
- blocks access to `bootstrap/config/app/scripts` PHP files,
- disables directory listing,
- enables compression + long-cache on static assets.

Ensure `AllowOverride All` (or `FileInfo` + `Indexes`) is set for the docroot so `.htaccess` is honored.

### Nginx
```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
location ~ ^/(app|config|scripts)/ { deny all; }
location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php-fpm.sock;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root/index.php;
}
```

## Verifying the deploy
- Home page loads, shows the tool grid and mega menu.
- Open any tool (e.g. `/pdf-tools/merge-pdf`); upload a file; Process; download.
- `/sitemap.xml` returns valid XML.
- `/robots.txt` returns the rules + sitemap reference.
- Search (`/` key) returns matching tools.
- Lighthouse/console shows no errors on page load (heavy engines lazy-load only when a tool runs).

## Troubleshooting
- **404 on tool URLs:** `.htaccess` not honored — set `AllowOverride All` or use the Nginx config above.
- **Blank page:** check PHP version (needs 8.1+) and that `app/`/`config/` are reachable from `public/index.php`.
- **Engines not loading (e.g. ffmpeg/background):** these lazy-load large WASM/model files from `public/vendor/`. Ensure `public/vendor/` was uploaded in full (ffmpeg is ~31 MB).
- **Sitemap 404:** run `scripts/generate-sitemap.php` to create `public/sitemap.xml`.

## Production ZIP layout
`FileGenie-Production.zip` contains exactly what to upload (the runtime). `FileGenie-Source.zip` contains the full project including `scripts/`, `node_modules` references, and this documentation for re-building engines.
