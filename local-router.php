<?php
/**
 * FileGenie — Hostinger fallback router.
 *
 * Use this file ONLY if your Hostinger Apache does not process .htaccess
 * rewrite rules (some shared plans require it). Set it as your custom
 * 404/error handler in hPanel, or request it directly: /local-router.php.
 *
 * It performs the same secure file serving + front-controller dispatch as
 * .htaccess, but in PHP, so it works on any PHP-enabled host.
 */

// Deny direct access to private trees.
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$privatePath = ltrim($uri, '/');
if (preg_match('#^(?:app|config|scripts|storage|tests|node_modules|tmp|\.claude)(?:/|$)#i', $privatePath)) {
    http_response_code(403);
    exit('Forbidden');
}

// Serve real static files directly.
$docRoot = __DIR__;
$requestedFile = $docRoot . str_replace('/', DIRECTORY_SEPARATOR, $uri);
if ($uri !== '/' && !in_array($uri, ['/robots.txt', '/sitemap.xml'], true) && is_file($requestedFile)) {
    $mimes = [
        '.css' => 'text/css',
        '.js' => 'application/javascript',
        '.svg' => 'image/svg+xml',
        '.png' => 'image/png',
        '.jpg' => 'image/jpeg',
        '.jpeg' => 'image/jpeg',
        '.gif' => 'image/gif',
        '.ico' => 'image/x-icon',
        '.woff' => 'font/woff',
        '.woff2' => 'font/woff2',
        '.webmanifest' => 'application/manifest+json',
        '.wasm' => 'application/wasm',
        '.mjs' => 'application/javascript',
    ];
    $ext = strtolower(strrchr($requestedFile, '.'));
    $type = $mimes[$ext] ?? 'application/octet-stream';
    header('Content-Type: ' . $type);
    readfile($requestedFile);
    return;
}

// Everything else goes through the front controller.
require __DIR__ . '/index.php';
