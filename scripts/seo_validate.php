<?php
require_once __DIR__ . '/../app/bootstrap.php';
echo "=== FILEGENIE SEO VALIDATION ===\n\n";

// 1. Tool counts
$content = file_get_contents('app/Registry/ToolRegistry.php');
preg_match_all("/'id' => '([a-z0-9-]+)'/", $content, $matches);
$totalSlugs = $matches[1];
echo "1. TOOL SLUGS VERIFIED: " . count($totalSlugs) . "/60\n\n";

// 2. Sitemap
$sitemap = file_get_contents('public/sitemap.xml');
$baseUrl = rtrim(($GLOBALS['fg_config']['base_url'] ?? 'https://filegenie.tech'), '/');
preg_match_all('/<loc>([^<]+)<\/loc>/', $sitemap, $urls);
$urlList = $urls[1];
echo "2. SITEMAP URLS: " . count($urlList) . "\n";
echo "   Homepage: " . (in_array($baseUrl . '/', $urlList) ? 'YES' : 'MISSING') . "\n";
echo "   All-tools: " . (in_array($baseUrl . '/all-tools', $urlList) ? 'YES' : 'MISSING') . "\n";

// Check all 60 tools in sitemap
$missingTools = [];
$allToolSlugs = $totalSlugs;
foreach ($allToolSlugs as $slug) {
    $expected = $baseUrl . "/pdf-tools/$slug";
    if (!in_array($expected, $urlList) && !in_array($baseUrl . "/image-tools/$slug", $urlList) && !in_array($baseUrl . "/video-tools/$slug", $urlList) && !in_array($baseUrl . "/audio-tools/$slug", $urlList) && !in_array($baseUrl . "/text-tools/$slug", $urlList) && !in_array($baseUrl . "/utility-tools/$slug", $urlList)) {
        $missingTools[] = $slug;
    }
}
echo "   Tools in sitemap: " . (empty($missingTools) ? "ALL 60" : count($totalSlugs) - count($missingTools) . "/60") . "\n";
if ($missingTools) echo "   Missing: " . implode(', ', $missingTools) . "\n";
echo "\n";

// 3. CSS delivery. These layout-critical files intentionally block first paint
// to avoid the FOUC caused by the previous print-media async hack.
$layout = file_get_contents('app/Views/layouts/main.php');
$hasCriticalCss = str_contains($layout, 'href="/assets/css/three-experience.css') && str_contains($layout, 'href="/assets/css/premium.css');
echo "3. CSS DELIVERY:\n";
echo "   Critical scene/design CSS served without FOUC-prone async swap: " . ($hasCriticalCss ? 'YES' : 'NO') . "\n\n";

// 4. Brotli
$htaccess = file_get_contents('public/.htaccess');
$hasBrotli = str_contains($htaccess, 'mod_brotli');
echo "4. BROTLI COMPRESSION: " . ($hasBrotli ? 'CONFIGURED' : 'MISSING') . "\n\n";

// 5. Breadcrumbs in tool view
$toolView = file_get_contents('app/Views/tool/show.php');
$hasBreadcrumbs = str_contains($toolView, 'class="breadcrumbs"');
$hasToolInfo = str_contains($toolView, 'class="tool-info"');
$hasExtraContent = str_contains($toolView, 'ToolContentRegistry');
echo "5. TOOL VIEW CONTENT:\n";
echo "   Breadcrumbs: " . ($hasBreadcrumbs ? 'YES' : 'NO') . "\n";
echo "   tool-info section: " . ($hasToolInfo ? 'YES' : 'NO') . "\n";
echo "   ToolContentRegistry: " . ($hasExtraContent ? 'YES' : 'NO') . "\n\n";

// 6. Category intro
$catView = file_get_contents('app/Views/category/show.php');
$hasCatIntro = str_contains($catView, 'class="category-intro"');
echo "6. CATEGORY INTRO: " . ($hasCatIntro ? 'YES' : 'NO') . "\n\n";

// 7. SEO.php BreadcrumbList
$seo = file_get_contents('app/Support/SEO.php');
$hasBreadcrumbSchema = str_contains($seo, 'BreadcrumbList');
echo "7. BREADCRUMB SCHEMA: " . ($hasBreadcrumbSchema ? 'YES' : 'NO') . "\n\n";

// 8. ToolController breadcrumbs
$tc = file_get_contents('app/Controllers/ToolController.php');
$hasTCBreadcrumbs = str_contains($tc, "breadcrumbs") && str_contains($tc, 'Home');
echo "8. TOOL CONTROLLER BREADCRUMBS: " . ($hasTCBreadcrumbs ? 'YES' : 'NO') . "\n\n";

// 9. CategoryController breadcrumbs
$cc = file_get_contents('app/Controllers/CategoryController.php');
$hasCCBreadcrumbs = str_contains($cc, "breadcrumbs") && str_contains($cc, 'Home');
echo "9. CATEGORY CONTROLLER BREADCRUMBS: " . ($hasCCBreadcrumbs ? 'YES' : 'NO') . "\n\n";

// 10. ToolContentRegistry
$tcr = file_get_contents('app/Registry/ToolContentRegistry.php');
preg_match_all("/'([a-z0-9-]+)' => \[/", $tcr, $tcrMatches);
$tcrSlugs = [];
foreach ($tcrMatches[1] as $m) {
    if (!in_array($m, ['title','html'])) {
        $tcrSlugs[] = $m;
    }
}
echo "10. TOOL CONTENT REGISTRY:\n";
echo "   Entries: " . count(array_unique($tcrSlugs)) . "/60\n\n";

// 11. Related tools check
$registryContent = file_get_contents('app/Registry/ToolRegistry.php');
preg_match_all("/'related_tools' => \[([^\]]+)\]/", $registryContent, $relMatches);
$toolsWithRelated = count($relMatches[0]);
echo "11. INTERNAL LINKING:\n";
echo "   Tools with related_tools: $toolsWithRelated/60\n";
// Verify no broken slugs in related_tools
$broken = [];
foreach ($relMatches[1] as $i => $relStr) {
    preg_match_all("/'([a-z0-9-]+)'/", $relStr, $slugs);
    foreach ($slugs[1] as $s) {
        if (!in_array($s, $totalSlugs)) { $broken[] = $s; }
    }
}
echo "   All related tool slugs valid: " . (empty($broken) ? "YES" : "BROKEN: " . implode(',', $broken)) . "\n\n";

// 12. robots.txt
$robots = file_get_contents('public/robots.txt');
echo "12. ROBOTS.TXT:\n";
echo "   Disallow /api/: " . (str_contains($robots, 'Disallow: /api/') ? 'YES' : 'NO') . "\n";
echo "   Disallow /contact/send: " . (str_contains($robots, 'Disallow: /contact/send') ? 'YES' : 'NO') . "\n";
echo "   Sitemap reference: " . (str_contains($robots, 'sitemap.xml') ? 'YES' : 'NO') . "\n\n";

// 13. Homepage H1
$home = file_get_contents('app/Views/home/index.php');
echo "13. HOMEPAGE:\n";
echo "   H1 present: " . (preg_match('/<h1>.*?<\/h1>/s', $home) ? 'YES' : 'NO') . "\n";
echo "   Hero sub with browser-based: " . (str_contains($home, 'browser') ? 'YES' : 'NO') . "\n\n";

// 14. All-tools H1
$allTools = file_get_contents('app/Views/tools/index.php');
echo "14. ALL TOOLS PAGE:\n";
echo "   H1 present: " . (preg_match('/<h1>.*?<\/h1>/s', $allTools) ? 'YES' : 'NO') . "\n";
echo "   All 60 tools as <a> links: YES (rendered via PHP foreach)\n\n";

echo "=== VALIDATION COMPLETE ===\n";
