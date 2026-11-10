<?php
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';

use App\Registry\CategoryRegistry;
use App\Registry\ToolRegistry;

$tools = ToolRegistry::getAll();
$lines = [
    '# FileGenie — Tool Manifest',
    '',
    count($tools) . ' tools across ' . count(CategoryRegistry::getAll()) . ' categories. Every tool runs 100% client-side (browser). PHP serves pages only. The registry is the source of truth; this manifest is regenerated from it for releases.',
    '',
    '| # | Tool | Category | URL | Engine | Input | Output |',
    '|---|------|----------|-----|--------|-------|-------|',
];

foreach (array_values($tools) as $index => $tool) {
    $lines[] = sprintf(
        '| %d | %s | %s | /%s/%s | %s | %s | %s |',
        $index + 1,
        $tool['name'],
        $tool['category'],
        $tool['category'],
        $tool['slug'],
        $tool['processing_engine'],
        strtoupper(implode(', ', $tool['input_formats'] ?: ['—'])),
        strtoupper(implode(', ', $tool['output_formats'] ?: ['—']))
    );
}

$lines[] = '';
$lines[] = '## By Category';
foreach (CategoryRegistry::getAll() as $category) {
    $lines[] = '';
    $lines[] = '### ' . $category['name'];
    foreach ($tools as $tool) {
        if ($tool['category'] === $category['slug']) {
            $lines[] = '- ' . $tool['name'] . ' — /' . $tool['category'] . '/' . $tool['slug'];
        }
    }
}

file_put_contents(__DIR__ . '/../TOOL_MANIFEST.md', implode("\n", $lines) . "\n");
echo 'Generated TOOL_MANIFEST.md with ' . count($tools) . " tools.\n";
