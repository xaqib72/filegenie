<?php
namespace App\Controllers;

class SitemapController extends \App\Core\Controller
{
    public function index(): void
    {
        header('Content-Type: application/xml; charset=utf-8');
        $base = rtrim(($GLOBALS['fg_config']['base_url'] ?? 'https://filegenie.tech'), '/');
        $urls = [
            [$base . '/', '1.0'],
            [$base . '/all-tools', '0.9'],
        ];
        foreach (\App\Registry\CategoryRegistry::getAll() as $category) {
            $urls[] = [$base . '/' . $category['slug'], '0.8'];
        }
        foreach (\App\Registry\ToolRegistry::getAll() as $tool) {
            $urls[] = [$base . '/' . $tool['category'] . '/' . $tool['slug'], '0.8'];
        }
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as [$url, $priority]) {
            $xml .= '  <url><loc>' . htmlspecialchars($url, ENT_XML1, 'UTF-8') . '</loc><priority>' . $priority . "</priority></url>\n";
        }
        $xml .= '</urlset>';
        echo $xml;
        exit;
    }

    public function robots(): void
    {
        header('Content-Type: text/plain; charset=utf-8');
        $base = ($GLOBALS['fg_config']['base_url'] ?? 'https://filegenie.tech');
        echo "User-agent: *\n";
        echo "Allow: /\n";
        echo "Disallow: /api/\n";
        echo "Disallow: /contact/send\n";
        echo "Sitemap: " . rtrim($base, '/') . "/sitemap.xml\n";
        exit;
    }
}
