<?php
// FileGenie Tool Page Deep QA
chdir(__DIR__ . '/../');

// Load bootstrap (registers autoloader, loads config)
require_once 'app/bootstrap.php';

use App\Registry\ToolRegistry;
use App\Registry\CategoryRegistry;
use App\Support\SEO;

$tools = ToolRegistry::getAll();
$categories = CategoryRegistry::getAll();

echo "=== TOOL PAGE DEEP QA ===\n\n";
echo "Base URL: " . SEO::baseUrl() . "\n\n";

// Deep test sample
$deepTest = [
    'merge-pdf', 'compress-pdf', 'pdf-to-jpg', 'protect-pdf', 'unlock-pdf',
    'compress-image', 'remove-background', 'heic-to-jpg', 'image-to-text', 'image-upscaler',
    'compress-video', 'mov-to-mp4', 'mkv-to-mp4',
    'audio-converter', 'm4a-to-mp3', 'merge-audio',
    'case-converter', 'word-counter', 'font-styler', 'text-compare',
    'qr-code-generator', 'qr-code-reader', 'barcode-generator', 'barcode-reader',
    'password-generator', 'file-hash-checker', 'what-is-my-ip',
];

$pass = 0;
$fail = 0;
$errors = [];
$warnings = [];
$allTitles = [];
$allMetas = [];

foreach ($deepTest as $slug) {
    $tool = ToolRegistry::get($slug);
    if (!$tool) {
        $fail++;
        $errors[] = "$slug: not found";
        continue;
    }

    $cat = CategoryRegistry::get($tool['category']);
    $_SERVER['REQUEST_URI'] = '/' . $cat['slug'] . '/' . $tool['slug'];
    $expectedCanonical = SEO::baseUrl() . '/' . $cat['slug'] . '/' . $tool['slug'];
    $meta = SEO::generateMeta([
        'title' => $tool['seo_title'],
        'meta_description' => $tool['meta_description'],
        'tool' => $tool,
        'breadcrumbs' => [
            ['name' => 'Home', 'url' => rtrim(SEO::baseUrl(), '/')],
            ['name' => $cat['name'], 'url' => SEO::baseUrl() . '/' . $cat['slug']],
            ['name' => $tool['name'], 'url' => $expectedCanonical],
        ],
    ]);

    $desc = $meta['description'] ?? '';
    $allTitles[] = $meta['title'];
    $allMetas[] = $desc;

    $checks = [];
    $checks['title'] = !empty($meta['title']) && strlen($meta['title']) > 20 && stripos($meta['title'], 'localhost') === false;
    $desc = $meta['description'] ?? '';
    $checks['meta (>50ch, <200ch)'] = strlen($desc) > 50 && strlen($desc) < 200;
    $checks['canonical'] = !empty($meta['canonical']) && $meta['canonical'] === $expectedCanonical;
    $checks['no localhost'] = stripos($meta['title'], 'localhost') === false && stripos($desc, 'localhost') === false;

    // Schema
    $hasBreadcrumb = false; $hasWebApp = false; $hasFAQ = false;
    foreach ($meta['schema'] as $s) {
        if (($s['@type'] ?? '') === 'BreadcrumbList') $hasBreadcrumb = true;
        if (($s['@type'] ?? '') === 'WebApplication') $hasWebApp = true;
        if (($s['@type'] ?? '') === 'FAQPage') $hasFAQ = true;
    }
    $checks['BreadcrumbList'] = $hasBreadcrumb;
    $checks['WebApplication'] = $hasWebApp;
    if (!empty($tool['faq'])) $checks['FAQPage'] = $hasFAQ;

    $failed = array_filter($checks, fn($v) => !$v);
    if (empty($failed)) { $pass++; } else { $fail++; $errors[] = "$slug: " . implode(', ', array_keys($failed)); }

    // Title quality warnings
    $freeCount = substr_count(strtolower($tool['seo_title']), 'free');
    if ($freeCount > 2) $warnings[] = "$slug: 'free' used $freeCount times: {$tool['seo_title']}";

    // Cannibalization checks
    if (in_array($slug, ['split-pdf', 'extract-pdf-pages'])) {
        if (!str_contains($tool['meta_description'], 'range') && !str_contains($tool['meta_description'], 'selected')) {
            $warnings[] = "$slug: meta could better differentiate from sibling tool";
        }
    }
    if (in_array($slug, ['resize-image', 'image-upscaler'])) {
        if (!str_contains($tool['seo_title'], 'AI') && $slug === 'image-upscaler') {
            $warnings[] = "$slug: title could mention AI (genuine capability)";
        }
    }

    printf("  %-25s title=%s meta=%dch breadcrumb=%s webapp=%s%s\n",
        $tool['name'],
        $checks['title'] ? 'OK' : 'FAIL',
        strlen($desc),
        $hasBreadcrumb ? 'OK' : 'FAIL',
        $hasWebApp ? 'OK' : 'FAIL',
        !empty($tool['faq']) ? ($hasFAQ ? ' faq=OK' : ' faq=FAIL') : ''
    );
}

// Check uniqueness
echo "\n=== UNIQUENESS CHECK ===\n";
echo "Unique titles: " . count(array_unique($allTitles)) . "/" . count($allTitles) . "\n";
echo "Unique metas: " . count(array_unique($allMetas)) . "/" . count($allMetas) . "\n";

// Check all 60 tools have related_tools
echo "\n=== INTERNAL LINKING ===\n";
$allWithRelated = 0;
foreach ($tools as $t) {
    if (!empty($t['related_tools'])) $allWithRelated++;
}
echo "Tools with related_tools: $allWithRelated/60\n";

echo "\n=== SUMMARY ===\n";
echo "PASS: $pass/" . count($deepTest) . "\n";
echo "FAIL: $fail\n";
if ($errors) { echo "ERRORS:\n"; foreach ($errors as $e) echo "  - $e\n"; }
if ($warnings) { echo "WARNINGS:\n"; foreach ($warnings as $w) echo "  - $w\n"; }
echo ($fail === 0 ? "\nALL DEEP CHECKS PASS" : "\nFAILURES DETECTED") . "\n";
