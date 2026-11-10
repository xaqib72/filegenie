<?php
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';

use App\Registry\CategoryRegistry;
use App\Registry\ToolRegistry;

$tools = ToolRegistry::getAll();
$categories = CategoryRegistry::getAll();

$requiredFields = [
    'id', 'name', 'slug', 'category', 'short_description', 'full_description',
    'icon', 'keywords', 'search_aliases', 'input_formats', 'output_formats',
    'processing_engine', 'privacy_mode', 'batch_support', 'related_tools',
    'seo_title', 'meta_description', 'instructions', 'faq',
];

echo "Validating FileGenie Registry...\n";
echo "PHP " . PHP_VERSION . "\n";
echo "Total Categories: " . count($categories) . "\n";
echo "Total Tools: " . count($tools) . "\n\n";

$errors = [];
$slugs = [];

foreach ($tools as $id => $tool) {
    if ($id !== $tool['id']) {
        $errors[] = "Key '{$id}' does not match tool id '{$tool['id']}'.";
    }
    if (!isset($categories[$tool['category']])) {
        $errors[] = "Tool {$tool['id']} references unknown category '{$tool['category']}'.";
    }
    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $tool)) {
            $errors[] = "Tool {$tool['id']} missing field '{$field}'.";
        }
    }
    if (!is_array($tool['keywords'] ?? null)) {
        $errors[] = "Tool {$tool['id']} 'keywords' must be an array.";
    }
    if (!is_array($tool['search_aliases'] ?? null)) {
        $errors[] = "Tool {$tool['id']} 'search_aliases' must be an array.";
    }
    if (!is_array($tool['related_tools'] ?? null)) {
        $errors[] = "Tool {$tool['id']} 'related_tools' must be an array.";
    }
    if (!is_array($tool['faq'] ?? null)) {
        $errors[] = "Tool {$tool['id']} 'faq' must be an array.";
    }
    if (isset($slugs[$tool['slug']])) {
        $errors[] = "Duplicate slug '{$tool['slug']}' used by {$tool['id']} and {$slugs[$tool['slug']]}.";
    }
    $slugs[$tool['slug']] = $tool['id'];
}

echo "Per-category tool counts:\n";
foreach ($categories as $catId => $cat) {
    $n = count(ToolRegistry::byCategory($catId));
    echo "  - {$cat['name']}: {$n}\n";
}

if (count($tools) !== 60) {
    $errors[] = "Expected 60 tools, found " . count($tools) . ".";
}

// Each processing_engine must map to a real engine script loaded by show.php.
$engineFiles = [
    'pdf'      => '/assets/js/engines/pdf-engine.js',
    'image'    => '/assets/js/engines/image-engine.js',
    'utility'  => '/assets/js/engines/utility-engine.js',
    'qr-reader' => '/assets/js/engines/qr-reader-engine.js',
    'ffmpeg'   => '/assets/js/engines/ffmpeg-engine.js',
    'background' => '/assets/js/engines/background-engine.js',
    'heic'     => '/assets/js/engines/heic-engine.js',
    'text'     => '/assets/js/engines/text-engine.js',
    'pdf-secure' => '/assets/js/engines/pdf-secure-engine.js',
    'barcode'  => '/assets/js/engines/barcode-engine.js',
    'barcode-reader' => '/assets/js/engines/barcode-reader-engine.js',
    'ocr'      => '/assets/js/engines/ocr-engine.js',
    'upscaler' => '/assets/js/engines/upscaler-engine.js',
    'ip'       => '/assets/js/engines/ip-engine.js',
];
$root = dirname(__DIR__) . '/public';
foreach ($tools as $tool) {
    $engine = $tool['processing_engine'];
    if (!isset($engineFiles[$engine])) {
        $errors[] = "Tool {$tool['id']} uses unknown processing_engine '{$engine}'.";
    } elseif (!file_exists($root . $engineFiles[$engine])) {
        $errors[] = "Tool {$tool['id']} engine file missing: {$engineFiles[$engine]}.";
    }
}

if (empty($errors)) {
    echo "\nSUCCESS: All 60 tools validated.\n";
    exit(0);
}

echo "\nERRORS FOUND (" . count($errors) . "):\n";
foreach ($errors as $e) {
    echo "  - {$e}\n";
}
exit(1);
