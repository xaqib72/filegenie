<?php
// FileGenie Route Smoke Test — uses file_get_contents with stream context
$base = 'http://localhost:8082';

$routes = [
    ['name' => 'Homepage', 'path' => '/'],
    ['name' => 'All Tools', 'path' => '/all-tools'],
    ['name' => 'PDF Tools', 'path' => '/pdf-tools'],
    ['name' => 'Image Tools', 'path' => '/image-tools'],
    ['name' => 'Video Tools', 'path' => '/video-tools'],
    ['name' => 'Audio Tools', 'path' => '/audio-tools'],
    ['name' => 'Text Tools', 'path' => '/text-tools'],
    ['name' => 'Utility Tools', 'path' => '/utility-tools'],
    ['name' => 'About', 'path' => '/about'],
    ['name' => 'Contact', 'path' => '/contact'],
    ['name' => 'Privacy', 'path' => '/privacy'],
    ['name' => 'Terms', 'path' => '/terms'],
    ['name' => 'Sitemap', 'path' => '/sitemap.xml'],
    ['name' => 'Robots', 'path' => '/robots.txt'],

    // PDF tools
    ['name' => 'Merge PDF', 'path' => '/pdf-tools/merge-pdf'],
    ['name' => 'Split PDF', 'path' => '/pdf-tools/split-pdf'],
    ['name' => 'Compress PDF', 'path' => '/pdf-tools/compress-pdf'],
    ['name' => 'JPG to PDF', 'path' => '/pdf-tools/jpg-to-pdf'],
    ['name' => 'PDF to JPG', 'path' => '/pdf-tools/pdf-to-jpg'],
    ['name' => 'Rotate PDF', 'path' => '/pdf-tools/rotate-pdf-pages'],
    ['name' => 'Protect PDF', 'path' => '/pdf-tools/protect-pdf'],
    ['name' => 'Unlock PDF', 'path' => '/pdf-tools/unlock-pdf'],

    // Image tools
    ['name' => 'Compress Image', 'path' => '/image-tools/compress-image'],
    ['name' => 'Resize Image', 'path' => '/image-tools/resize-image'],
    ['name' => 'Remove Background', 'path' => '/image-tools/remove-background'],
    ['name' => 'HEIC to JPG', 'path' => '/image-tools/heic-to-jpg'],
    ['name' => 'Image to Text', 'path' => '/image-tools/image-to-text'],
    ['name' => 'Image Upscaler', 'path' => '/image-tools/image-upscaler'],

    // Video tools
    ['name' => 'Compress Video', 'path' => '/video-tools/compress-video'],
    ['name' => 'Trim Video', 'path' => '/video-tools/trim-video'],
    ['name' => 'MOV to MP4', 'path' => '/video-tools/mov-to-mp4'],
    ['name' => 'MKV to MP4', 'path' => '/video-tools/mkv-to-mp4'],

    // Audio tools
    ['name' => 'Audio Converter', 'path' => '/audio-tools/audio-converter'],
    ['name' => 'Trim Audio', 'path' => '/audio-tools/trim-audio'],
    ['name' => 'M4A to MP3', 'path' => '/audio-tools/m4a-to-mp3'],

    // Text tools
    ['name' => 'Case Converter', 'path' => '/text-tools/case-converter'],
    ['name' => 'Word Counter', 'path' => '/text-tools/word-counter'],
    ['name' => 'Font Styler', 'path' => '/text-tools/font-styler'],

    // Utility tools
    ['name' => 'Password Generator', 'path' => '/utility-tools/password-generator'],
    ['name' => 'QR Generator', 'path' => '/utility-tools/qr-code-generator'],
    ['name' => 'QR Reader', 'path' => '/utility-tools/qr-code-reader'],
    ['name' => 'Barcode Generator', 'path' => '/utility-tools/barcode-generator'],
    ['name' => 'Barcode Reader', 'path' => '/utility-tools/barcode-reader'],
    ['name' => 'File Hash Checker', 'path' => '/utility-tools/file-hash-checker'],
    ['name' => 'What Is My IP', 'path' => '/utility-tools/what-is-my-ip'],

    // 404 test
    ['name' => '404 Test', 'path' => '/nonexistent-page-404'],
];

$ctx = stream_context_create([
    'http' => [
        'timeout' => 15,
        'follow_location' => 0,
    ]
]);

$pass = 0;
$fail = 0;
$errors = [];

foreach ($routes as $route) {
    $url = $base . $route['path'];
    $body = @file_get_contents($url, false, $ctx);
    $httpCode = $http_response_header[0] ?? 'HTTP/0.0';

    preg_match('/HTTP\/\d\.\d\s+(\d+)/', $httpCode, $codeMatch);
    $code = $codeMatch[1] ?? 0;

    $is404 = $route['name'] === '404 Test';
    $expected = $is404 ? 404 : 200;

    if ($code === (string)$expected) {
        $pass++;
        echo "  PASS: {$route['name']} ({$route['path']}) — $code\n";
    } else {
        $fail++;
        $errors[] = "{$route['name']}: expected $expected, got $code";
        echo "  FAIL: {$route['name']} ({$route['path']}) — expected $expected, got $code\n";
    }

    // For tool pages, verify content
    $isTool = str_contains($route['path'], '/pdf-tools/') || str_contains($route['path'], '/image-tools/') ||
              str_contains($route['path'], '/video-tools/') || str_contains($route['path'], '/audio-tools/') ||
              str_contains($route['path'], '/text-tools/') || str_contains($route['path'], '/utility-tools/');

    if ($isTool && $body) {
        $checks = [
            'title tag' => str_contains($body, '<title>') && !str_contains($body, '<title>FileGenie – Free Online'),
            'H1' => preg_match('/<h1[^>]*>/', $body),
            'breadcrumbs' => str_contains($body, 'class="breadcrumbs"'),
            'tool-info' => str_contains($body, 'class="tool-info"'),
            'workspace' => str_contains($body, 'id="workspace"'),
            'schema' => str_contains($body, 'application/ld+json'),
            'canonical' => str_contains($body, 'rel="canonical"'),
        ];

        $failed = [];
        foreach ($checks as $check => $result) {
            if (!$result) $failed[] = $check;
        }

        if ($failed) {
            echo "    WARNING missing: " . implode(', ', $failed) . "\n";
        }

        // Localhost check
        if (stripos($body, 'http://localhost') !== false) {
            $errors[] = "{$route['name']}: localhost URL in output";
            echo "    FAIL: localhost in output\n";
        }
    }
}

echo "\n=== ROUTE TEST SUMMARY ===\n";
echo "PASS: $pass\n";
echo "FAIL: $fail\n";
if ($errors) {
    echo "ERRORS:\n";
    foreach ($errors as $e) echo "  - $e\n";
}
echo ($fail === 0 ? "\nALL ROUTES PASS" : "\nFAILURES DETECTED") . "\n";
