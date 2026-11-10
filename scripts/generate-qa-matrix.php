<?php
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';

$handle = fopen(__DIR__ . '/../FileGenie-60-tool-QA-matrix.csv', 'wb');
fputcsv($handle, ['route', 'tool', 'category', 'engine', 'fixture', 'action_executed', 'output_validated', 'browser', 'result', 'issue', 'evidence']);

foreach (\App\Registry\ToolRegistry::getAll() as $tool) {
    fputcsv($handle, [
        '/' . $tool['category'] . '/' . $tool['slug'],
        $tool['name'],
        $tool['category'],
        $tool['processing_engine'],
        'Not supplied to a real browser in this environment',
        'Not executed — real browser functional QA blocked',
        'No',
        'Not available (Chromium download did not complete)',
        'BLOCKED',
        'Requires a compatible Chromium/Playwright install and representative fixture; do not treat route 200 as an operation pass',
        'Route smoke: 200; see FileGenie-Redesign-Audit-and-QA.md',
    ]);
}
fclose($handle);
echo 'Generated FileGenie-60-tool-QA-matrix.csv with 60 rows.' . PHP_EOL;
