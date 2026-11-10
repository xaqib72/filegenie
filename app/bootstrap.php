<?php
/**
 * FileGenie application bootstrap.
 *
 * Registers a PSR-4-style autoloader for the App\ namespace, loads the
 * environment config, and boots the application kernel.
 */

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));
const FG_VERSION = '1.0.0';

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $file = BASE_PATH . '/app/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

// Load site configuration (safe defaults if file missing).
$configFile = BASE_PATH . '/config/site.php';
$GLOBALS['fg_config'] = is_file($configFile) ? require $configFile : [
    'site_name'       => 'FileGenie',
    'tagline'         => 'Every file. One smart toolkit.',
    'base_url'        => 'https://filegenie.tech',
    'contact_email'   => 'hello@filegenie.com',
    'company'         => 'FileGenie',
    'default_title'   => 'FileGenie - Every file. One smart toolkit.',
    'default_description' => 'Free online tools to compress, convert, merge, split, and edit PDFs, images, video, audio, and text directly in your browser. 100% client-side and private.',
];

// Initialise session only if headers not already sent (controllers need it
// for CSRF). We start it here so forms can access the token lazily.
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    $secureCookie = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $remoteAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $trustedProxies = $GLOBALS['fg_config']['trusted_proxies'] ?? [];
    if ($remoteAddress !== '' && in_array($remoteAddress, $trustedProxies, true)) {
        $secureCookie = $secureCookie || strtolower(trim($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
    }
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'cookie_secure' => $secureCookie,
    ]);
}

// Boot the app only when this is the front-controller request (not when a
// CLI script includes bootstrap for the autoloader and registries).
if (PHP_SAPI === 'cli') {
    return;
}

(new App\Core\App())->run();
