<?php
/**
 * Site configuration. Edit these values for your deployment.
 * Safe defaults are applied in bootstrap.php if this file is missing.
 *
 * FILEGENIE_BASE_URL may be supplied by the hosting environment. The explicit
 * production fallback is intentional; it prevents localhost canonical URLs
 * from leaking into a public deployment. Change this one value for a custom
 * domain, or set FILEGENIE_BASE_URL before serving the site.
 */
$configuredBaseUrl = getenv('FILEGENIE_BASE_URL') ?: 'https://filegenie.tech';
$configuredBaseUrl = rtrim($configuredBaseUrl, '/');
if (!preg_match('#^https://[^/]+$#i', $configuredBaseUrl)) {
    $configuredBaseUrl = 'https://filegenie.tech';
}

$trustedProxyList = array_filter(array_map('trim', explode(',', getenv('FILEGENIE_TRUSTED_PROXIES') ?: '')));
$googleTagId = trim(getenv('FILEGENIE_GOOGLE_TAG_ID') ?: getenv('FILEGENIE_GA_MEASUREMENT_ID') ?: '');

return [
    'site_name'            => 'FileGenie',
    'tagline'              => 'Every file. One smart toolkit.',
    'base_url'             => $configuredBaseUrl,
    'trusted_proxies'      => array_values($trustedProxyList),
    'google_tag_id'        => $googleTagId,
    'contact_email'        => 'hello@filegenie.com',
    'company'              => 'FileGenie',
    'default_title'        => 'FileGenie - Every file. One smart toolkit.',
    'default_description'  => 'Free online tools to compress, convert, merge, split, and edit PDFs, images, video, audio, and text directly in your browser. 100% client-side and private.',
    'social'               => [
        'twitter'  => '@filegenie',
        'github'   => '',
    ],
];
