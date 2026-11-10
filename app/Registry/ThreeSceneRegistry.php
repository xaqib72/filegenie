<?php

namespace App\Registry;

/**
 * Visual-only configuration for the shared Three.js tool experience.
 *
 * Tool processing remains owned by ToolRegistry and the existing engines. This
 * registry only describes the objects and transformation the 3D scene should
 * communicate for each route.
 */
final class ThreeSceneRegistry
{
    private const SCENES = [
        'merge-pdf' => ['family' => 'pdf', 'variant' => 'merge', 'input' => 'PDF ×3', 'action' => 'MERGE', 'output' => 'MERGED PDF'],
        'split-pdf' => ['family' => 'pdf', 'variant' => 'split', 'input' => 'PDF STACK', 'action' => 'SPLIT', 'output' => 'PDF ×3'],
        'compress-pdf' => ['family' => 'pdf', 'variant' => 'compress', 'input' => 'PDF 12.8 MB', 'action' => 'COMPRESS', 'output' => 'PDF 4.1 MB'],
        'jpg-to-pdf' => ['family' => 'pdf', 'variant' => 'convert', 'input' => 'JPG ×3', 'action' => 'BUILD', 'output' => 'PDF'],
        'pdf-to-jpg' => ['family' => 'pdf', 'variant' => 'convert', 'input' => 'PDF', 'action' => 'RENDER', 'output' => 'JPG ×3'],
        'rotate-pdf-pages' => ['family' => 'pdf', 'variant' => 'rotate', 'input' => 'PDF', 'action' => 'ROTATE 90°', 'output' => 'PDF'],
        'reorder-pdf-pages' => ['family' => 'pdf', 'variant' => 'reorder', 'input' => 'PAGES 3·1·2', 'action' => 'REORDER', 'output' => 'PAGES 1·2·3'],
        'delete-pdf-pages' => ['family' => 'pdf', 'variant' => 'delete', 'input' => 'PDF PAGES', 'action' => 'REMOVE', 'output' => 'CLEAN PDF'],
        'add-page-numbers' => ['family' => 'pdf', 'variant' => 'number', 'input' => 'PDF', 'action' => 'NUMBER', 'output' => 'PDF #01'],
        'watermark-pdf' => ['family' => 'pdf', 'variant' => 'watermark', 'input' => 'PDF', 'action' => 'STAMP', 'output' => 'WATERMARKED'],
        'extract-pdf-pages' => ['family' => 'pdf', 'variant' => 'extract', 'input' => 'PDF PAGES', 'action' => 'EXTRACT', 'output' => 'SELECTED PDF'],
        'protect-pdf' => ['family' => 'pdf', 'variant' => 'protect', 'input' => 'PDF', 'action' => 'PROTECT', 'output' => 'LOCKED PDF'],
        'unlock-pdf' => ['family' => 'pdf', 'variant' => 'unlock', 'input' => 'LOCKED PDF', 'action' => 'UNLOCK', 'output' => 'OPEN PDF'],

        'compress-image' => ['family' => 'image', 'variant' => 'compress', 'input' => 'IMAGE 8.4 MB', 'action' => 'COMPRESS', 'output' => 'IMAGE 2.1 MB'],
        'resize-image' => ['family' => 'image', 'variant' => 'resize', 'input' => '1920×1080', 'action' => 'RESIZE', 'output' => '1080×1080'],
        'crop-image' => ['family' => 'image', 'variant' => 'crop', 'input' => 'FULL IMAGE', 'action' => 'CROP', 'output' => 'CROPPED'],
        'convert-image' => ['family' => 'image', 'variant' => 'convert', 'input' => 'JPG', 'action' => 'CONVERT', 'output' => 'WEBP'],
        'remove-background' => ['family' => 'image', 'variant' => 'background-remove', 'input' => 'PHOTO', 'action' => 'REMOVE BG', 'output' => 'TRANSPARENT PNG'],
        'add-watermark' => ['family' => 'image', 'variant' => 'watermark', 'input' => 'PHOTO', 'action' => 'OVERLAY', 'output' => 'WATERMARKED'],
        'rotate-image' => ['family' => 'image', 'variant' => 'rotate', 'input' => 'PHOTO', 'action' => 'ROTATE 90°', 'output' => 'ROTATED'],
        'round-corners' => ['family' => 'image', 'variant' => 'round', 'input' => 'PHOTO', 'action' => 'ROUND', 'output' => 'ROUNDED'],
        'heic-to-jpg' => ['family' => 'image', 'variant' => 'convert', 'input' => 'HEIC', 'action' => 'CONVERT', 'output' => 'JPG'],
        'strip-exif' => ['family' => 'image', 'variant' => 'strip', 'input' => 'PHOTO + EXIF', 'action' => 'STRIP DATA', 'output' => 'CLEAN PHOTO'],
        'image-to-text' => ['family' => 'image', 'variant' => 'ocr', 'input' => 'IMAGE', 'action' => 'OCR SCAN', 'output' => 'TEXT'],
        'image-upscaler' => ['family' => 'image', 'variant' => 'upscale', 'input' => '1× IMAGE', 'action' => 'UPSCALE', 'output' => '4× HD'],
        'add-text-to-image' => ['family' => 'image', 'variant' => 'compose', 'input' => 'PHOTO', 'action' => 'ADD TEXT', 'output' => 'COMPOSED'],
        'rotate-flip-image' => ['family' => 'image', 'variant' => 'flip', 'input' => 'PHOTO', 'action' => 'FLIP', 'output' => 'MIRRORED'],

        'compress-video' => ['family' => 'video', 'variant' => 'compress', 'input' => 'MP4 84 MB', 'action' => 'COMPRESS', 'output' => 'MP4 28 MB'],
        'trim-video' => ['family' => 'video', 'variant' => 'trim', 'input' => 'VIDEO 00:48', 'action' => 'TRIM', 'output' => 'CLIP 00:18'],
        'mute-video' => ['family' => 'video', 'variant' => 'mute', 'input' => 'VIDEO + AUDIO', 'action' => 'MUTE', 'output' => 'SILENT VIDEO'],
        'video-to-gif' => ['family' => 'video', 'variant' => 'gif', 'input' => 'MP4', 'action' => 'CAPTURE', 'output' => 'GIF STACK'],
        'resize-video' => ['family' => 'video', 'variant' => 'resize', 'input' => '1920×1080', 'action' => 'RESIZE', 'output' => '1080×1080'],
        'extract-audio' => ['family' => 'video', 'variant' => 'extract', 'input' => 'VIDEO', 'action' => 'EXTRACT', 'output' => 'MP3'],
        'mov-to-mp4' => ['family' => 'video', 'variant' => 'convert', 'input' => 'MOV', 'action' => 'CONVERT', 'output' => 'MP4'],
        'mkv-to-mp4' => ['family' => 'video', 'variant' => 'convert', 'input' => 'MKV', 'action' => 'CONVERT', 'output' => 'MP4'],

        'audio-converter' => ['family' => 'audio', 'variant' => 'convert', 'input' => 'WAV', 'action' => 'CONVERT', 'output' => 'MP3'],
        'trim-audio' => ['family' => 'audio', 'variant' => 'trim', 'input' => 'WAVE 03:42', 'action' => 'TRIM', 'output' => 'CLIP 01:18'],
        'merge-audio' => ['family' => 'audio', 'variant' => 'merge', 'input' => 'TRACK A + B', 'action' => 'MERGE', 'output' => 'ONE TRACK'],
        'change-speed' => ['family' => 'audio', 'variant' => 'speed', 'input' => '1.0×', 'action' => 'SPEED', 'output' => '1.5×'],
        'audio-to-mono' => ['family' => 'audio', 'variant' => 'mono', 'input' => 'STEREO', 'action' => 'COLLAPSE', 'output' => 'MONO'],
        'volume-boost' => ['family' => 'audio', 'variant' => 'volume', 'input' => '+0 dB', 'action' => 'BOOST', 'output' => '+6 dB'],
        'm4a-to-mp3' => ['family' => 'audio', 'variant' => 'convert', 'input' => 'M4A', 'action' => 'CONVERT', 'output' => 'MP3'],

        'case-converter' => ['family' => 'text', 'variant' => 'case', 'input' => 'lowercase', 'action' => 'TRANSFORM', 'output' => 'UPPERCASE'],
        'word-counter' => ['family' => 'text', 'variant' => 'count', 'input' => 'DOCUMENT', 'action' => 'COUNT', 'output' => '342 WORDS'],
        'remove-duplicate-lines' => ['family' => 'text', 'variant' => 'dedupe', 'input' => '8 LINES', 'action' => 'DEDUPE', 'output' => '5 UNIQUE'],
        'sort-lines' => ['family' => 'text', 'variant' => 'sort', 'input' => 'C · B · A', 'action' => 'SORT', 'output' => 'A · B · C'],
        'text-cleaner' => ['family' => 'text', 'variant' => 'clean', 'input' => 'NOISY TEXT', 'action' => 'CLEAN', 'output' => 'CLEAN TEXT'],
        'text-compare' => ['family' => 'text', 'variant' => 'compare', 'input' => 'TEXT A + B', 'action' => 'COMPARE', 'output' => '3 CHANGES'],
        'font-styler' => ['family' => 'text', 'variant' => 'style', 'input' => 'HELLO', 'action' => 'STYLE', 'output' => '𝓗𝓔𝓛𝓛𝓞'],
        'text-formatter' => ['family' => 'text', 'variant' => 'format', 'input' => 'RAW JSON', 'action' => 'FORMAT', 'output' => 'INDENTED'],

        'password-generator' => ['family' => 'utility', 'variant' => 'generate', 'input' => '••••••••', 'action' => 'GENERATE', 'output' => 'SECURE KEY'],
        'qr-code-generator' => ['family' => 'utility', 'variant' => 'qr-generate', 'input' => 'DATA', 'action' => 'BUILD QR', 'output' => 'PNG + SVG'],
        'color-picker' => ['family' => 'utility', 'variant' => 'color', 'input' => 'COLOR FIELD', 'action' => 'PICK', 'output' => '#4F46E5'],
        'favicon-generator' => ['family' => 'utility', 'variant' => 'favicon', 'input' => 'IMAGE', 'action' => 'GENERATE', 'output' => '16·32·180'],
        'base64-tool' => ['family' => 'utility', 'variant' => 'encode', 'input' => 'IMAGE', 'action' => 'ENCODE', 'output' => 'BASE64'],
        'file-hash-checker' => ['family' => 'utility', 'variant' => 'hash', 'input' => 'FILE', 'action' => 'HASH', 'output' => 'SHA-256'],
        'qr-code-reader' => ['family' => 'utility', 'variant' => 'qr-read', 'input' => 'QR CARD', 'action' => 'SCAN', 'output' => 'DECODED'],
        'what-is-my-ip' => ['family' => 'utility', 'variant' => 'resolve', 'input' => 'DEVICE', 'action' => 'RESOLVE', 'output' => '203.0.113.42'],
        'barcode-generator' => ['family' => 'utility', 'variant' => 'barcode-generate', 'input' => 'DIGITS', 'action' => 'BUILD', 'output' => 'BARCODE'],
        'barcode-reader' => ['family' => 'utility', 'variant' => 'barcode-read', 'input' => 'BARCODE', 'action' => 'SCAN', 'output' => 'EAN-13'],
    ];

    public static function forTool(string $slug): array
    {
        if (!isset(self::SCENES[$slug])) {
            throw new \InvalidArgumentException("No 3D scene mapping registered for {$slug}");
        }

        return self::SCENES[$slug];
    }

    public static function all(): array
    {
        return self::SCENES;
    }

    public static function count(): int
    {
        return count(self::SCENES);
    }
}
