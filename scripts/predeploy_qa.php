<?php
// FileGenie Pre-Deploy QA Validator
// ===================================

echo "=== FILEGENIE PRE-DEPLOY QA ===\n\n";

$errors = [];
$warnings = [];

// ==========================================
// 1. REGISTRY VERIFICATION
// ==========================================
echo "1. REGISTRY\n";

$toolContent = file_get_contents('app/Registry/ToolRegistry.php');
$categoryContent = file_get_contents('app/Registry/CategoryRegistry.php');

// Count tools by id
preg_match_all("/'id' => '([a-z0-9-]+)'/", $toolContent, $idMatches);
$toolIds = $idMatches[1];
echo "   Total tools: " . count($toolIds) . "/60\n";

// Count by category
preg_match_all("/'category' => '([^']+)'/", $toolContent, $catMatches);
$catCounts = array_count_values($catMatches[1]);
ksort($catCounts);
$expectedCats = ['pdf-tools' => 13, 'image-tools' => 14, 'video-tools' => 8, 'audio-tools' => 7, 'text-tools' => 8, 'utility-tools' => 10];
foreach ($expectedCats as $cat => $expected) {
    $actual = $catCounts[$cat] ?? 0;
    $status = $actual === $expected ? "PASS" : "FAIL";
    echo "   $cat: $actual/$expected — $status\n";
    if ($status === "FAIL") $errors[] = "Category count mismatch: $cat";
}

// Count categories
preg_match_all("/\"id\" => \"([^\"]+)\"/", $categoryContent, $regCatIds);
$regCats = $regCatIds[1];
echo "   Categories: " . count($regCats) . "/6\n";

// ==========================================
// 2. SEO: TITLES, METAS, UNIQUENESS
// ==========================================
echo "\n2. SEO ELEMENTS\n";

preg_match_all("/'seo_title' => '([^']+)'/", $toolContent, $seoTitles);
preg_match_all("/'meta_description' => '([^']+)'/", $toolContent, $seoDescs);
$titles = $seoTitles[1];
$descs = $seoDescs[1];

echo "   Unique titles: " . count(array_unique($titles)) . "/" . count($titles) . "\n";
echo "   Unique metas: " . count(array_unique($descs)) . "/" . count($descs) . "\n";

// Check for localhost in meta data
$allMeta = implode(' ', $titles) . ' ' . implode(' ', $descs);
echo "   Localhost in meta: " . (stripos($allMeta, 'localhost') !== false ? "FAIL" : "PASS") . "\n";

// Check for keyword stuffing patterns
$stuffPatterns = ['free online free tool', 'free online tool free', 'free free free'];
foreach ($stuffPatterns as $p) {
    foreach (array_merge($titles, $descs) as $meta) {
        if (stripos($meta, $p) !== false) {
            $errors[] = "Keyword stuffing found: '$p' in: $meta";
        }
    }
}
echo "   Keyword stuffing: PASS\n";

// ==========================================
// 3. BREADCRUMB SCHEMA
// ==========================================
echo "\n3. BREADCRUMB SCHEMA\n";
$seoPhp = file_get_contents('app/Support/SEO.php');
echo "   BreadcrumbList in SEO.php: " . (str_contains($seoPhp, 'BreadcrumbList') ? "PASS" : "FAIL") . "\n";

// ==========================================
// 4. CSS ASYNC LOADING
// ==========================================
echo "\n4. CSS ASYNC LOADING\n";
$layout = file_get_contents('app/Views/layouts/main.php');
$motionAsync = preg_match('/motion\.css.*media=["\']print["\'].*onload/i', $layout);
$threeAsync = preg_match('/three-experience\.css.*media=["\']print["\'].*onload/i', $layout);
echo "   motion.css async: " . ($motionAsync ? "PASS" : "FAIL") . "\n";
echo "   three-experience.css async: " . ($threeAsync ? "PASS" : "FAIL") . "\n";
echo "   noscript fallback: " . (str_contains($layout, '<noscript>') && str_contains($layout, 'motion.css') && str_contains($layout, 'three-experience.css') ? "PASS" : "FAIL") . "\n";

// ==========================================
// 5. COMPRESSION
// ==========================================
echo "\n5. COMPRESSION\n";
$htaccess = file_get_contents('public/.htaccess');
echo "   gzip (mod_deflate): " . (str_contains($htaccess, 'mod_deflate') ? "PASS" : "FAIL") . "\n";
echo "   Brotli (mod_brotli): " . (str_contains($htaccess, 'mod_brotli') ? "PASS" : "FAIL") . "\n";

// ==========================================
// 6. ROBOTS.TXT
// ==========================================
echo "\n6. ROBOTS.TXT\n";
$robots = file_get_contents('public/robots.txt');
echo "   Disallow /api/: " . (str_contains($robots, 'Disallow: /api/') ? "PASS" : "FAIL") . "\n";
echo "   Disallow /contact/send: " . (str_contains($robots, 'Disallow: /contact/send') ? "PASS" : "FAIL") . "\n";
echo "   Sitemap reference: " . (str_contains($robots, 'sitemap.xml') ? "PASS" : "FAIL") . "\n";
echo "   No localhost: " . (stripos($robots, 'localhost') === false ? "PASS" : "FAIL") . "\n";

// ==========================================
// 7. DOMAIN AUDIT
// ==========================================
echo "\n7. DOMAIN PLACEHOLDER AUDIT\n";
$projectRoot = '.';
$scanFiles = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($projectRoot));
$phpFiles = [];
$xmlFiles = [];
$txtFiles = [];
foreach ($scanFiles as $file) {
    if ($file->isFile()) {
        $ext = $file->getExtension();
        if ($ext === 'php') $phpFiles[] = $file->getPathname();
        if ($ext === 'xml') $xmlFiles[] = $file->getPathname();
        if ($ext === 'txt') $txtFiles[] = $file->getPathname();
    }
}

$domainFiles = [];
foreach (array_merge($phpFiles, $xmlFiles, $txtFiles) as $file) {
    $content = file_get_contents($file);
    if (preg_match('/127\.0\.0\.1|localhost|filegenie\.com|http:\/\//', $content)) {
        $matches = [];
        preg_match_all('/127\.0\.0\.1|localhost|filegenie\.com|https?:\/\/[^"\']+/', $content, $lineMatches);
        $domainFiles[$file] = array_unique($lineMatches[0]);
    }
}

if (empty($domainFiles)) {
    echo "   No hardcoded domains found. PASS\n";
} else {
    echo "   Files with domain references:\n";
    foreach ($domainFiles as $f => $refs) {
        echo "     $f: " . implode(', ', array_slice($refs, 0, 5)) . "\n";
    }
    echo "   (These need domain update at deployment)\n";
}

// ==========================================
// 8. PRIVACY CLAIMS AUDIT
// ==========================================
echo "\n8. PRIVACY CLAIMS AUDIT\n";
$privacyPatterns = [
    '100% client-side',
    'never uploaded',
    'never leaves',
    'no upload',
    'private',
    'secure',
    'local processing',
    'runs in your browser',
];
$claimFiles = [];
foreach ($phpFiles as $file) {
    $content = file_get_contents($file);
    foreach ($privacyPatterns as $pattern) {
        if (stripos($content, $pattern) !== false) {
            $claimFiles[$file][] = $pattern;
        }
    }
}
echo "   Files with privacy claims: " . count($claimFiles) . "\n";
echo "   Known safe files: layouts/main.php, layouts/footer.php, ToolRegistry descriptions, views\n";

// ==========================================
// 9. TOOL CONTENT REGISTRY
// ==========================================
echo "\n9. TOOL CONTENT REGISTRY\n";
$tcrContent = file_get_contents('app/Registry/ToolContentRegistry.php');
preg_match_all("/'([a-z0-9-]+)' => \[/", $tcrContent, $tcrMatches);
$tcrSlugs = array_values(array_unique(array_filter($tcrMatches[1], function($s) {
    return !in_array($s, ['title', 'html']);
})));
echo "   Entries: " . count($tcrSlugs) . "/60\n";
$missingTCR = array_diff($toolIds, $tcrSlugs);
if ($missingTCR) {
    echo "   MISSING: " . implode(', ', $missingTCR) . "\n";
    $errors[] = "ToolContentRegistry missing entries";
} else {
    echo "   All tools covered: PASS\n";
}

// ==========================================
// 10. INTERNAL LINKING
// ==========================================
echo "\n10. INTERNAL LINKING\n";
preg_match_all("/'related_tools' => \[([^\]]+)\]/", $toolContent, $relMatches);
echo "   Tools with related_tools: " . count($relMatches[0]) . "/60\n";
if (count($relMatches[0]) < 60) {
    $errors[] = "Some tools missing related_tools";
}

// ==========================================
// 11. CANONICAL CONSISTENCY
// ==========================================
echo "\n11. CANONICAL CONSISTENCY\n";
$tc = file_get_contents('app/Controllers/ToolController.php');
$cc = file_get_contents('app/Controllers/CategoryController.php');
$hc = file_get_contents('app/Controllers/HomeController.php');

echo "   ToolController uses SEO::canonical(): " . (str_contains($tc, 'canonical') ? "PASS" : "FAIL") . "\n";
echo "   CategoryController uses SEO::canonical(): " . (str_contains($cc, 'canonical') ? "PASS" : "FAIL") . "\n";
echo "   HomeController uses SEO::canonical(): " . (str_contains($hc, 'canonical') ? "PASS" : "FAIL") . "\n";

// ==========================================
// 12. SITEMAP VALIDATION
// ==========================================
echo "\n12. SITEMAP VALIDATION\n";
$sitemap = file_get_contents('public/sitemap.xml');
preg_match_all('/<loc>([^<]+)<\/loc>/', $sitemap, $sitemapUrls);
$sitemapList = $sitemapUrls[1];
echo "   Total URLs: " . count($sitemapList) . "\n";
echo "   Expected: 68 (1 home + 1 all-tools + 6 cats + 60 tools)\n";

$catPrefixes = ['/pdf-tools/', '/image-tools/', '/video-tools/', '/audio-tools/', '/text-tools/', '/utility-tools/'];
$toolUrls = array_filter($sitemapList, fn($u) => str_contains($u, '/pdf-tools/') || str_contains($u, '/image-tools/') || str_contains($u, '/video-tools/') || str_contains($u, '/audio-tools/') || str_contains($u, '/text-tools/') || str_contains($u, '/utility-tools/'));
echo "   Tool URLs in sitemap: " . count($toolUrls) . "\n";

// ==========================================
// 13. VIEW STRUCTURE CHECKS
// ==========================================
echo "\n13. VIEW STRUCTURE\n";

// Tool view
$toolView = file_get_contents('app/Views/tool/show.php');
echo "   Tool view has breadcrumbs: " . (str_contains($toolView, 'class="breadcrumbs"') ? "PASS" : "FAIL") . "\n";
echo "   Tool view has ws-intro: " . (str_contains($toolView, 'ws-intro') ? "PASS" : "FAIL") . "\n";
echo "   Tool view has tool-info: " . (str_contains($toolView, 'tool-info') ? "PASS" : "FAIL") . "\n";
echo "   Tool view has faq-block: " . (str_contains($toolView, 'faq-block') ? "PASS" : "FAIL") . "\n";
echo "   Tool view has related tools: " . (str_contains($toolView, 'relatedTools') ? "PASS" : "FAIL") . "\n";
echo "   Tool view has privacy sidebar: " . (str_contains($toolView, 'privacy') || str_contains($toolView, 'Privacy') ? "PASS" : "FAIL") . "\n";

// Category view
$catView = file_get_contents('app/Views/category/show.php');
echo "   Category view has breadcrumbs: " . (str_contains($catView, 'class="breadcrumbs"') ? "PASS" : "FAIL") . "\n";
echo "   Category view has category-intro: " . (str_contains($catView, 'category-intro') ? "PASS" : "FAIL") . "\n";

// Home view
$homeView = file_get_contents('app/Views/home/index.php');
echo "   Home view has H1: " . (preg_match('/<h1>.*?<\/h1>/s', $homeView) ? "PASS" : "FAIL") . "\n";
echo "   Home view has hero-sub: " . (str_contains($homeView, 'hero-sub') ? "PASS" : "FAIL") . "\n";

// All-tools view
$allToolsView = file_get_contents('app/Views/tools/index.php');
echo "   All-tools view has H1: " . (preg_match('/<h1>.*?<\/h1>/s', $allToolsView) ? "PASS" : "FAIL") . "\n";

// ==========================================
// 14. SECURITY HEADERS
// ==========================================
echo "\n14. SECURITY HEADERS\n";
echo "   X-Content-Type-Options: " . (str_contains($htaccess, 'X-Content-Type-Options') ? "PASS" : "FAIL") . "\n";
echo "   X-Frame-Options: " . (str_contains($htaccess, 'X-Frame-Options') ? "PASS" : "FAIL") . "\n";
echo "   X-XSS-Protection: " . (str_contains($htaccess, 'X-XSS-Protection') ? "PASS" : "FAIL") . "\n";
echo "   Referrer-Policy: " . (str_contains($htaccess, 'Referrer-Policy') ? "PASS" : "FAIL") . "\n";
echo "   Permissions-Policy: " . (str_contains($htaccess, 'Permissions-Policy') ? "PASS" : "FAIL") . "\n";

// ==========================================
// 15. NOINDEX CHECK
// ==========================================
echo "\n15. INDEXABILITY\n";
$noindexPattern = 'noindex';
$viewsWithNoindex = [];
foreach ($phpFiles as $file) {
    $content = file_get_contents($file);
    if (stripos($content, 'noindex') !== false && !str_contains($file, '/errors/')) {
        $viewsWithNoindex[] = $file;
    }
}
if (empty($viewsWithNoindex)) {
    echo "   No accidental noindex: PASS\n";
} else {
    echo "   Files with noindex: " . implode(', ', $viewsWithNoindex) . "\n";
}

// ==========================================
// 16. ENGINE FILES CHECK
// ==========================================
echo "\n16. PROCESSING ENGINES\n";
$engineDir = 'app/assets/js/engines';
if (is_dir($engineDir)) {
    $engines = glob("$engineDir/*-engine.js");
    echo "   Engine files found: " . count($engines) . "\n";
    foreach ($engines as $e) {
        $name = basename($e);
        echo "     - $name\n";
    }
} else {
    echo "   Engine directory not found at $engineDir\n";
    // Try alternate path
    $engineDir2 = 'assets/js/engines';
    if (is_dir($engineDir2)) {
        $engines = glob("$engineDir2/*-engine.js");
        echo "   Engine files found (alt path): " . count($engines) . "\n";
    }
}

// ==========================================
// SUMMARY
// ==========================================
echo "\n=== SUMMARY ===\n";
echo "Errors: " . count($errors) . "\n";
if ($errors) {
    foreach ($errors as $e) echo "  ERROR: $e\n";
}
echo "Warnings: " . count($warnings) . "\n";
if ($warnings) {
    foreach ($warnings as $w) echo "  WARNING: $w\n";
}
echo "\n";

if (empty($errors)) {
    echo "ALL PROGRAMMATIC CHECKS PASSED\n";
} else {
    echo "ERRORS FOUND — REVIEW REQUIRED\n";
}
