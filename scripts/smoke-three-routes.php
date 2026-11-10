<?php

declare(strict_types=1);

require dirname(__DIR__) . '/app/bootstrap.php';

use App\Registry\ThreeSceneRegistry;
use App\Registry\ToolRegistry;

$baseUrl = rtrim($argv[1] ?? 'http://127.0.0.1:8080', '/');
$failures = [];
$checked = 0;

foreach (ToolRegistry::getAll() as $slug => $tool) {
    $url = sprintf('%s/%s/%s', $baseUrl, $tool['category'], $slug);
    $context = stream_context_create(['http' => ['timeout' => 12, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $context);
    $statusLine = $http_response_header[0] ?? '';
    preg_match('/\s(\d{3})\s/', $statusLine, $matches);
    $status = (int) ($matches[1] ?? 0);
    $scene = ThreeSceneRegistry::forTool($slug);
    $checks = [
        'HTTP 200' => $status === 200,
        'tool scene' => is_string($body) && str_contains($body, 'data-fg3d-tool="' . $slug . '"'),
        'family mapping' => is_string($body) && str_contains($body, 'data-fg3d-family="' . $scene['family'] . '"'),
        'variant mapping' => is_string($body) && str_contains($body, 'data-fg3d-variant="' . $scene['variant'] . '"'),
        'action mapping' => is_string($body) && str_contains($body, 'data-fg3d-action="' . htmlspecialchars($scene['action'], ENT_QUOTES, 'UTF-8') . '"'),
        'workspace' => is_string($body) && str_contains($body, 'id="workspace"'),
        'process' => is_string($body) && str_contains($body, 'id="process-btn"'),
        'reset' => is_string($body) && str_contains($body, 'id="reset-btn"'),
        'result' => is_string($body) && str_contains($body, 'id="result"'),
        'download' => is_string($body) && str_contains($body, 'id="download-btn"'),
        'favourite' => is_string($body) && str_contains($body, 'id="fav-toggle"'),
        'old tool scene absent' => is_string($body) && !str_contains($body, 'tool-motion-scene'),
    ];
    foreach ($checks as $name => $passed) {
        if (!$passed) $failures[] = "{$tool['category']}/{$slug}: {$name}";
    }
    $checked++;
}

echo "FileGenie live route smoke test\n";
echo "Routes checked: {$checked}\n";
echo 'Assertions: ' . ($checked * 12) . "\n";
echo 'Failures: ' . count($failures) . "\n";

if ($failures) {
    fwrite(STDERR, "- " . implode("\n- ", $failures) . "\n");
    exit(1);
}

echo "PASS — all 60 live tool routes render the mapped 3D experience and core workspace controls.\n";
