<?php
// FileGenie Route Smoke Test
$base = 'http://127.0.0.1:8082';

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

    // Sample tool routes (8 per category for brevity in core check)
    ['name' => 'Merge PDF', 'path' => '/pdf-tools/merge-pdf'],
    ['name' => 'Split PDF', 'path' => '/pdf-tools/split-pdf'],
    ['name' => 'Compress PDF', 'path' => '/pdf-tools/compress-pdf'],
    ['name' => 'JPG to PDF', 'path' => '/pdf-tools/jpg-to-pdf'],
    ['name' => 'PDF to JPG', 'path' => '/pdf-tools/pdf-to-jpg'],
    ['name' => 'Rotate PDF', 'path' => '/pdf-tools/rotate-pdf-pages'],
    ['name' => 'Protect PDF', 'path' => '/pdf-tools/protect-pdf'],
    ['name' => 'Unlock PDF', 'path' => '/pdf-tools/unlock-pdf'],
    ['name' => 'Watermark PDF', 'path' => '/pdf-tools/watermark-pdf'],
    ['name' => 'Extract PDF', 'path' => '/pdf-tools/extract-pdf-pages'],
    ['name' => 'Add Page Nums', 'path' => '/pdf-tools/add-page-numbers'],
    ['name' => 'Delete PDF', 'path' => '/pdf-tools/delete-pdf-pages'],
    ['name' => 'Reorder PDF', 'path' => '/pdf-tools/reorder-pdf-pages'],

    ['name' => 'Compress Image', 'path' => '/image-tools/compress-image'],
    ['name' => 'Resize Image', 'path' => '/image-tools/resize-image'],
    ['name' => 'Crop Image', 'path' => '/image-tools/crop-image'],
    ['name' => 'Convert Image', 'path' => '/image-tools/convert-image'],
    ['name' => 'Remove BG', 'path' => '/image-tools/remove-background'],
    ['name' => 'Add Watermark', 'path' => '/image-tools/add-watermark'],
    ['name' => 'Rotate Image', 'path' => '/image-tools/rotate-image'],
    ['name' => 'Round Corners', 'path' => '/image-tools/round-corners'],
    ['name' => 'HEIC to JPG', 'path' => '/image-tools/heic-to-jpg'],
    ['name' => 'Strip EXIF', 'path' => '/image-tools/strip-exif'],
    ['name' => 'Image to Text', 'path' => '/image-tools/image-to-text'],
    ['name' => 'Image Upscaler', 'path' => '/image-tools/image-upscaler'],
    ['name' => 'Add Text Image', 'path' => '/image-tools/add-text-to-image'],
    ['name' => 'Rotate Flip', 'path' => '/image-tools/rotate-flip-image'],

    ['name' => 'Compress Video', 'path' => '/video-tools/compress-video'],
    ['name' => 'Trim Video', 'path' => '/video-tools/trim-video'],
    ['name' => 'Mute Video', 'path' => '/video-tools/mute-video'],
    ['name' => 'Video to GIF', 'path' => '/video-tools/video-to-gif'],
    ['name' => 'Resize Video', 'path' => '/video-tools/resize-video'],
    ['name' => 'Extract Audio', 'path' => '/video-tools/extract-audio'],
    ['name' => 'MOV to MP4', 'path' => '/video-tools/mov-to-mp4'],
    ['name' => 'MKV to MP4', 'path' => '/video-tools/mkv-to-mp4'],

    ['name' => 'Audio Converter', 'path' => '/audio-tools/audio-converter'],
    ['name' => 'Trim Audio', 'path' => '/audio-tools/trim-audio'],
    ['name' => 'Merge Audio', 'path' => '/audio-tools/merge-audio'],
    ['name' => 'Change Speed', 'path' => '/audio-tools/change-speed'],
    ['name' => 'Audio to Mono', 'path' => '/audio-tools/audio-to-mono'],
    ['name' => 'Volume Boost', 'path' => '/audio-tools/volume-boost'],
    ['name' => 'M4A to MP3', 'path' => '/audio-tools/m4a-to-mp3'],

    ['name' => 'Case Converter', 'path' => '/text-tools/case-converter'],
    ['name' => 'Word Counter', 'path' => '/text-tools/word-counter'],
    ['name' => 'Remove Dupes', 'path' => '/text-tools/remove-duplicate-lines'],
    ['name' => 'Sort Lines', 'path' => '/text-tools/sort-lines'],
    ['name' => 'Text Cleaner', 'path' => '/text-tools/text-cleaner'],
    ['name' => 'Text Compare', 'path' => '/text-tools/text-compare'],
    ['name' => 'Font Styler', 'path' => '/text-tools/font-styler'],
    ['name' => 'Text Formatter', 'path' => '/text-tools/text-formatter'],

    ['name' => 'Password Gen', 'path' => '/utility-tools/password-generator'],
    ['name' => 'QR Generator', 'path' => '/utility-tools/qr-code-generator'],
    ['name' => 'Color Picker', 'path' => '/utility-tools/color-picker'],
    ['name' => 'Favicon Gen', 'path' => '/utility-tools/favicon-generator'],
    ['name' => 'Base64', 'path' => '/utility-tools/base64-tool'],
    ['name' => 'File Hash', 'path' => '/utility-tools/file-hash-checker'],
    ['name' => 'QR Reader', 'path' => '/utility-tools/qr-code-reader'],
    ['name' => 'What Is My IP', 'path' => '/utility-tools/what-is-my-ip'],
    ['name' => 'Barcode Gen', 'path' => '/utility-tools/barcode-generator'],
    ['name' => 'Barcode Read', 'path' => '/utility-tools/barcode-reader'],

    ['name' => '404 Test', 'path' => '/nonexistent-page-404-test'],
];

$pass = 0;
$fail = 0;
$errors = [];

foreach ($routes as $route) {
    $url = $base . $route['path'];
    $body = @file_get_contents($url);
    $httpCode = $http_response_header[0] ?? 'HTTP/0.0';
    preg_match('/HTTP\/\d\.\d\s+(\d+)/', $httpCode, $codeMatch);
    $code = $codeMatch[1] ?? 0;

    $is404 = str_contains($route['name'], '404');
    $expected = $is404 ? 404 : 200;

    if ((string)$code === (string)$expected) {
        $pass++;
        echo "  PASS: {$route['name']} ({$route['path']}) — $code\n";
    } else {
        $fail++;
        $errors[] = "{$route['name']}: expected $expected, got $code";
        echo "  FAIL: {$route['name']} ({$route['path']}) — expected $expected, got $code\n";
    }

    // Tool page checks
    $isTool = str_contains($route['path'], '/pdf-tools/') || str_contains($route['path'], '/image-tools/') ||
              str_contains($route['path'], '/video-tools/') || str_contains($route['path'], '/audio-tools/') ||
              str_contains($route['path'], '/text-tools/') || str_contains($route['path'], '/utility-tools/');

    if ($isTool && $body) {
        $warnings = [];
        if (!str_contains($body, '<title>') || str_contains($body, '<title>FileGenie – Free Online')) $warnings[] = 'title';
        if (!preg_match('/<h1[^>]*>/', $body)) $warnings[] = 'H1';
        if (!str_contains($body, 'class="breadcrumbs"')) $warnings[] = 'breadcrumbs';
        if (!str_contains($body, 'class="tool-info"')) $warnings[] = 'tool-info';
        if (!str_contains($body, 'id="workspace"')) $warnings[] = 'workspace';
        if (!str_contains($body, 'application/ld+json')) $warnings[] = 'schema';
        if (!str_contains($body, 'rel="canonical"')) $warnings[] = 'canonical';
        if (!empty($warnings)) echo "    WARNING missing: " . implode(', ', $warnings) . "\n";

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
