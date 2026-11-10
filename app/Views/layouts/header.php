<?php
use App\Registry\CategoryRegistry;
$categories = CategoryRegistry::getAll();
$currentPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (!function_exists('fg_is_active')) {
    function fg_is_active(string $path, string $currentPath): bool
    {
        if ($path === '/') {
            return $currentPath === '/';
        }
        return $currentPath === $path || str_starts_with($currentPath, $path . '/');
    }
}
?>
<header class="site-header" id="site-header">
    <div class="container header-inner">
        <a class="brand" href="/" aria-label="FileGenie home"<?= $currentPath === '/' ? ' aria-current="page"' : '' ?>>
            <span class="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2.8 19.2 11l8.3 1.8-6.2 5.8 1.3 8.6-6.6-4.4-7.4 4.4 1.8-8.6-6.2-5.8L12.7 11 16 2.8Z" fill="currentColor"/>
                    <circle cx="16" cy="16" r="3.2" fill="#111412"/>
                    <path d="M16 0v4M32 16h-4M16 32v-4M0 16h4" stroke="#ff7657" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </span>
            <span class="brand-name">File<b>Genie</b></span>
        </a>

        <nav class="primary-nav" aria-label="Primary">
            <a href="/all-tools" class="nav-link<?= fg_is_active('/all-tools', $currentPath) ? ' is-current' : '' ?>">All Tools</a>
            <div class="nav-dropdown">
                <button class="nav-link nav-trigger" type="button" id="mega-trigger" aria-expanded="false" aria-controls="mega-menu" aria-haspopup="true">
                    Categories <span class="caret" aria-hidden="true">▾</span>
                </button>
            </div>
            <a href="/about" class="nav-link<?= fg_is_active('/about', $currentPath) ? ' is-current' : '' ?>">About</a>
            <a href="/contact" class="nav-link<?= fg_is_active('/contact', $currentPath) ? ' is-current' : '' ?>">Contact</a>
        </nav>

        <div class="header-actions">
            <button class="search-trigger" type="button" id="search-trigger" aria-label="Search tools">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM5 10a5 5 0 1110 0 5 5 0 01-10 0z"/></svg>
                <span class="search-hint">Search <kbd>/</kbd></span>
            </button>
            <button class="theme-toggle" type="button" id="theme-toggle" aria-label="Toggle dark mode" aria-pressed="false">
                <span class="theme-icon-light" aria-hidden="true">☀</span>
                <span class="theme-icon-dark" aria-hidden="true">☾</span>
            </button>
            <button class="nav-burger" type="button" id="nav-burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
                <span></span><span></span><span></span>
            </button>
        </div>
    </div>

    <?php require __DIR__ . '/mega_menu.php'; ?>
</header>

<div class="mobile-nav" id="mobile-nav" hidden>
    <div class="container mobile-nav-inner">
        <a href="/all-tools" class="mobile-nav-link<?= fg_is_active('/all-tools', $currentPath) ? ' is-current' : '' ?>">All Tools</a>
        <p class="mobile-nav-label">Categories</p>
        <?php foreach ($categories as $cat): ?>
            <a href="/<?= $cat['slug'] ?>" class="mobile-nav-link<?= fg_is_active('/' . $cat['slug'], $currentPath) ? ' is-current' : '' ?>">
                <?= App\Helpers\Icons::svg($cat['icon'], ['class' => 'mobile-nav-icon']) ?>
                <?= htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8') ?>
            </a>
        <?php endforeach; ?>
        <div class="mobile-nav-divider"></div>
        <a href="/about" class="mobile-nav-link<?= fg_is_active('/about', $currentPath) ? ' is-current' : '' ?>">About</a>
        <a href="/contact" class="mobile-nav-link<?= fg_is_active('/contact', $currentPath) ? ' is-current' : '' ?>">Contact</a>
    </div>
</div>
