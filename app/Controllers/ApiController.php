<?php
namespace App\Controllers;

use App\Core\Controller;

/**
 * JSON API endpoints. Currently exposes the connection's public IP address as
 * observed by this server — no third-party geolocation service, no city/country/
 * ISP lookup.
 */
class ApiController extends Controller
{
    public function ip(): void
    {
        // The address the connection actually arrived on. Behind a trusted proxy
        // the real client IP is the first entry of X-Forwarded-For; otherwise it
        // is REMOTE_ADDR. We deliberately do NOT enrich this with any geolocation
        // API — only what the request itself carries.
        $remote = $_SERVER['REMOTE_ADDR'] ?? '';
        $ip = $remote;
        $forwarded = trim($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
        $trustedProxies = $GLOBALS['fg_config']['trusted_proxies'] ?? [];
        $proxyIsTrusted = $remote !== '' && in_array($remote, $trustedProxies, true);
        if ($proxyIsTrusted && $forwarded !== '') {
            $parts = array_map('trim', explode(',', $forwarded));
            $client = $parts[0];
            if (filter_var($client, FILTER_VALIDATE_IP)) {
                $ip = $client;
            }
        }

        $ip = (string) $ip;
        $version = '';
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $version = 'IPv4';
        } elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $version = 'IPv6';
        }

        $this->json([
            'ip'       => $ip,
            'version'  => $version,
            'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'protocol' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http',
            'method'   => $_SERVER['REQUEST_METHOD'] ?? 'GET',
            'remoteAddr' => $remote,
            'serverTime' => gmdate('c'),
            'note'     => 'This address is what your connection presented to our server. No geolocation service was used, so city, country, ISP, and location are not shown.',
        ]);
    }
}
