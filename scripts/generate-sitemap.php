<?php
require_once __DIR__ . '/../app/bootstrap.php';

use App\Registry\CategoryRegistry;
use App\Registry\ToolRegistry;

$baseUrl = rtrim(($GLOBALS['fg_config']['base_url'] ?? 'https://filegenie.tech'), '/');
$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

$xml .= "  <url><loc>{$baseUrl}/</loc><priority>1.0</priority></url>\n";
$xml .= "  <url><loc>{$baseUrl}/all-tools</loc><priority>0.9</priority></url>\n";

foreach (CategoryRegistry::getAll() as $cat) {
    $xml .= "  <url><loc>{$baseUrl}/{$cat['slug']}</loc><priority>0.8</priority></url>\n";
}

foreach (ToolRegistry::getAll() as $tool) {
    $xml .= "  <url><loc>{$baseUrl}/{$tool['category']}/{$tool['slug']}</loc><priority>0.8</priority></url>\n";
}

$xml .= '</urlset>';

file_put_contents(__DIR__ . '/../public/sitemap.xml', $xml);
echo "Generated public/sitemap.xml successfully with all " . count(ToolRegistry::getAll()) . " tools!\n";
