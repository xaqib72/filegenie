<?php
/**
 * Headless smoke test: dispatch real URLs through the front controller logic
 * and assert the rendered output contains expected markers. No server needed.
 */
require_once __DIR__ . '/../app/bootstrap.php';

use App\Core\App;
use App\Core\Router;
use App\Registry\ToolRegistry;

// Capture emitted HTML by overriding how the app outputs. We replicate App::run
// but render into an output buffer per request instead of sending headers.
function dispatch_url(string $path): string
{
    $_SERVER['REQUEST_URI'] = $path;
    $_SERVER['HTTP_HOST'] = 'localhost';
    unset($_SERVER['HTTPS']);

    ob_start();
    try {
        $app = new App();
        $ref = new ReflectionMethod($app, 'run');
        $ref->setAccessible(true);
        $ref->invoke($app);
    } catch (\Throwable $e) {
        ob_end_clean();
        return "!!FATAL!! " . $e->getMessage() . "\n" . $e->getTraceAsString();
    }
    return ob_get_clean();
}

$checks = [
    '/'              => ['FileGenie', '<title>', 'tool-grid', 'category-grid'],
    '/all-tools'     => ['All Tools', 'tool-card'],
    '/pdf-tools'     => ['PDF Tools', 'tool-card'],
    '/image-tools'   => ['Image Tools', 'tool-card'],
    '/video-tools'   => ['Video Tools', 'tool-card'],
    '/audio-tools'   => ['Audio Tools', 'tool-card'],
    '/text-tools'    => ['Text &amp; Font Tools', 'tool-card'],
    '/utility-tools' => ['Utility Tools', 'tool-card'],
    '/about'         => ['About'],
    '/privacy'       => ['Privacy Policy'],
    '/terms'         => ['Terms'],
    '/contact'       => ['Contact', '_csrf', 'contact-form'],
    '/pdf-tools/merge-pdf'      => ['Merge PDF', 'id="workspace"', 'data-engine="pdf"', '-engine.js'],
    '/pdf-tools/split-pdf'      => ['Split PDF', 'data-engine="pdf"'],
    '/image-tools/compress-image' => ['Compress Image', 'data-engine="image"'],
    '/image-tools/remove-background' => ['Remove Background', 'data-engine="background"'],
    '/image-tools/heic-to-jpg'  => ['HEIC to JPG', 'data-engine="heic"'],
    '/video-tools/compress-video' => ['Compress Video', 'data-engine="ffmpeg"'],
    '/audio-tools/audio-converter' => ['Audio Converter', 'data-engine="ffmpeg"'],
    '/text-tools/case-converter' => ['Case Converter', 'data-engine="text"'],
    '/utility-tools/password-generator' => ['Password Generator', 'data-engine="utility"'],
    '/utility-tools/file-hash-checker'  => ['File Hash Checker', 'data-engine="utility"'],
    '/api/search?q=merge' => ['merge-pdf'],
];

$fail = 0;
$total = 0;
foreach ($checks as $url => $needles) {
    $total++;
    $html = dispatch_url($url);
    if (str_starts_with($html, '!!FATAL!!')) {
        echo "[FAIL] {$url}\n       {$html}\n";
        $fail++;
        continue;
    }
    $missing = [];
    foreach ($needles as $n) {
        if (!str_contains($html, $n)) {
            $missing[] = $n;
        }
    }
    if ($missing) {
        echo "[FAIL] {$url} — missing: " . implode(', ', $missing) . "\n";
        $fail++;
    } else {
        echo "[PASS] {$url}\n";
    }
}

// Tool count sanity
$count = ToolRegistry::count();
echo "\nToolRegistry count: {$count} " . ($count === 60 ? "(OK)" : "(EXPECTED 60!)") . "\n";

echo "\n==== {$total} routes checked, {$fail} failed ====\n";
exit($fail === 0 && $count === 60 ? 0 : 1);
