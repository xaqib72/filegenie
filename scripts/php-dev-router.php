<?php
declare(strict_types=1);

// Local PHP server router for source-tree development and browser QA.
// Production continues to use Apache .htaccess or the VPS reverse proxy.
$publicRoot = realpath(__DIR__ . '/../public');
$requestPath = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$candidate = realpath($publicRoot . DIRECTORY_SEPARATOR . ltrim($requestPath, '/\\'));

if ($candidate && is_file($candidate) && str_starts_with($candidate, $publicRoot . DIRECTORY_SEPARATOR)) {
    return false;
}

require $publicRoot . '/index.php';
