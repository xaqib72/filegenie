<?php
$title = $GLOBALS['fg_view_title'] ?? 'FileGenie';
$description = $GLOBALS['fg_view_description'] ?? '';
$canonical = $GLOBALS['fg_view_canonical'] ?? '';
$schema = $GLOBALS['fg_view_schema'] ?? [];
$bodyClass = $GLOBALS['fg_body_class'] ?? '';
$googleTagId = trim((string) ($GLOBALS['fg_config']['google_tag_id'] ?? ''));
if (!preg_match('/^(?:G-[A-Z0-9]+|GTM-[A-Z0-9]+)$/', $googleTagId)) {
    $googleTagId = '';
}
$canonicalParts = parse_url($canonical);
$ogOrigin = '';
if (is_array($canonicalParts) && isset($canonicalParts['scheme'], $canonicalParts['host'])) {
    $ogOrigin = $canonicalParts['scheme'] . '://' . $canonicalParts['host'];
    if (isset($canonicalParts['port'])) {
        $ogOrigin .= ':' . $canonicalParts['port'];
    }
}
$ogImage = $ogOrigin !== '' ? $ogOrigin . '/og.png' : '';
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#111412">
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <link rel="canonical" href="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:type" content="website">
    <?php if ($ogImage !== ''): ?><meta property="og:image" content="<?= htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8') ?>"><?php endif; ?>
    <meta name="twitter:card" content="summary_large_image">
    <?php if ($ogImage !== ''): ?><meta name="twitter:image" content="<?= htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8') ?>"><?php endif; ?>
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon.png?v=1">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">
    <link rel="shortcut icon" type="image/png" href="/favicon.png?v=1">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=1">
    <link rel="manifest" href="/manifest.webmanifest">
    <script>
        (function () {
            try {
                var saved = localStorage.getItem('filegenie_theme');
                document.documentElement.dataset.theme = saved === 'dark' || saved === 'light' ? saved : 'dark';
            } catch (e) {}
        }());
    </script>
    <?php if (!empty($schema)): ?>
    <script type="application/ld+json">
    <?= json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>
    </script>
    <?php endif; ?>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <?php if (!empty($importmapHtml)): ?><?= $importmapHtml ?><?php endif; ?>
    <link rel="stylesheet" href="/assets/css/variables.css">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/components.css">
    <link rel="stylesheet" href="/assets/css/tools.css">
    <link rel="stylesheet" href="/assets/css/motion.css">
    <link rel="stylesheet" href="/assets/css/three-experience.css?v=7">
    <link rel="stylesheet" href="/assets/css/premium.css?v=1">
    <link rel="stylesheet" href="/assets/css/atelier.css?v=3">
</head>
<body class="<?= htmlspecialchars($bodyClass, ENT_QUOTES, 'UTF-8') ?>">
    <a class="skip-link" href="#main">Skip to content</a>
    <?php require __DIR__ . '/header.php'; ?>
    <main id="main" class="site-main">
        <?= $GLOBALS['fg_view_content'] ?? '' ?>
    </main>
    <?php require __DIR__ . '/footer.php'; ?>
    <?php if ($googleTagId !== ''): ?>
    <aside class="analytics-consent" id="analytics-consent" role="region" aria-labelledby="analytics-consent-title" data-google-tag-id="<?= htmlspecialchars($googleTagId, ENT_QUOTES, 'UTF-8') ?>" hidden>
        <div class="analytics-consent-copy">
            <strong id="analytics-consent-title">Help us improve FileGenie</strong>
            <p>Optional Google Analytics measures visits and page usage. Your files are never included. You can reject analytics or change this choice later in Privacy settings.</p>
            <a href="/privacy">Privacy Policy</a>
        </div>
        <div class="analytics-consent-actions">
            <button class="analytics-button analytics-button-muted" type="button" data-analytics-choice="denied">Reject analytics</button>
            <button class="analytics-button" type="button" data-analytics-choice="granted">Allow analytics</button>
        </div>
    </aside>
    <script src="/assets/js/core/analytics-consent.js?v=1" defer></script>
    <?php endif; ?>
    <script src="/assets/js/core/theme.js" defer></script>
    <script src="/assets/js/core/storage.js" defer></script>
    <script src="/assets/js/core/search.js" defer></script>
    <script src="/assets/js/core/ui.js" defer></script>
    <script src="/assets/js/core/app.js" defer></script>
    <script src="/assets/js/motion.js" defer></script>
    <script src="/assets/js/atelier.js?v=1" defer></script>
    <script type="module" src="/assets/js/3d/bootstrap.js?v=6"></script>
</body>
</html>
