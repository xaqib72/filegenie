<?php

declare(strict_types=1);

require dirname(__DIR__) . '/app/bootstrap.php';

use App\Registry\ThreeSceneRegistry;
use App\Registry\ToolRegistry;

$tools = ToolRegistry::getAll();
$scenes = ThreeSceneRegistry::all();
$expectedCounts = [
    'pdf-tools' => 13,
    'image-tools' => 14,
    'video-tools' => 8,
    'audio-tools' => 7,
    'text-tools' => 8,
    'utility-tools' => 10,
];
$familyForCategory = [
    'pdf-tools' => 'pdf',
    'image-tools' => 'image',
    'video-tools' => 'video',
    'audio-tools' => 'audio',
    'text-tools' => 'text',
    'utility-tools' => 'utility',
];

$errors = [];
$missing = array_diff_key($tools, $scenes);
$extra = array_diff_key($scenes, $tools);
if ($missing) $errors[] = 'Missing mappings: ' . implode(', ', array_keys($missing));
if ($extra) $errors[] = 'Unknown mappings: ' . implode(', ', array_keys($extra));

foreach ($expectedCounts as $category => $expected) {
    $actual = count(ToolRegistry::byCategory($category));
    if ($actual !== $expected) $errors[] = "{$category} expected {$expected}, found {$actual}";
}

foreach ($tools as $slug => $tool) {
    if (!isset($scenes[$slug])) continue;
    $scene = $scenes[$slug];
    foreach (['family', 'variant', 'input', 'action', 'output'] as $field) {
        if (!isset($scene[$field]) || trim((string) $scene[$field]) === '') {
            $errors[] = "{$slug} has an empty {$field}";
        }
    }
    $expectedFamily = $familyForCategory[$tool['category']] ?? null;
    if ($scene['family'] !== $expectedFamily) {
        $errors[] = "{$slug} uses {$scene['family']} family; expected {$expectedFamily}";
    }
}

echo "FileGenie 3D scene audit\n";
echo 'Tools: ' . count($tools) . "\n";
echo 'Mapped: ' . count($scenes) . "\n";
echo 'Missing: ' . count($missing) . "\n";
foreach ($expectedCounts as $category => $expected) {
    echo sprintf("%-16s %2d / %2d\n", $category, count(ToolRegistry::byCategory($category)), $expected);
}
echo "\nMapping\n";
foreach ($tools as $slug => $tool) {
    $scene = $scenes[$slug] ?? [];
    printf(
        "%s/%s | %s | %s/%s | %s → %s → %s\n",
        $tool['category'],
        $slug,
        $tool['name'],
        $scene['family'] ?? 'MISSING',
        $scene['variant'] ?? 'MISSING',
        $scene['input'] ?? 'MISSING',
        $scene['action'] ?? 'MISSING',
        $scene['output'] ?? 'MISSING'
    );
}

if ($errors) {
    fwrite(STDERR, "\nFAIL\n- " . implode("\n- ", $errors) . "\n");
    exit(1);
}

echo "\nPASS — all 60 tools have complete contextual 3D mappings.\n";
