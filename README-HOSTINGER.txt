FILEGENIE — HOSTINGER DEPLOYMENT

1. In Hostinger hPanel, select PHP 8.1 or newer for the domain and enable HTTPS.
2. Open the domain's public_html directory.
3. Upload FileGenie-Hostinger-Ready.zip and extract it in public_html.
   The archive is already flattened: do not move files out of a Website/ or
   public/ wrapper.
4. For a custom domain, edit config/site.php and set base_url to the full
   HTTPS origin, or set FILEGENIE_BASE_URL in the hosting environment. The
   default is https://filegenie.tech.
5. Confirm that Apache allows .htaccess overrides (FileInfo + Indexes). Visit
   the home page, /all-tools, /about, and one tool URL.

No npm, Composer, database, or server-side build step is required. User files
are processed in the browser. The AI background-removal tool fetches its model
from its documented provider on first use; its ONNX runtime is included in this
archive and the uploaded image is not posted to FileGenie.

Troubleshooting:
- A 404 on clean URLs means mod_rewrite/.htaccess overrides are disabled.
- A 500 error usually means PHP is older than 8.1 or the archive was nested
  one directory too deep.
- If a heavy video, OCR, upscaler, or HEIC tool is slow, keep the tab open and
  use a modern browser with sufficient memory; processing remains local.
