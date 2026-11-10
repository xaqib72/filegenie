<?php
namespace App\Registry;

/**
 * Central motion registry for the premium 3D / interaction phase.
 *
 * Every tool declares a reusable motion FAMILY (the visual grammar it gets:
 * merge, split, compress, scan, wave, …) plus a VARIANT (the format nuance,
 * e.g. "pdf", "jpg→png", "network"). Individual templates never hardcode their
 * own animation — they receive motion via a data attribute and MotionScenes
 * (public/assets/js/motion.js) builds the matching decorative scene.
 *
 * This keeps the 60 tool animations in one place, lets families adapt across
 * formats, and stays entirely declarative so it cannot break tool logic or
 * processing engines.
 *
 * Category pages get a COMPOSITION (a distinct floating 3D arrangement) rather
 * than a single tool family.
 */
class MotionRegistry
{
    /**
     * slug => [family, variant, composition?]
     * family     = scene builder name in motion.js Scenes{} (drives the visual)
     * variant    = label/colour nuance for the scene (never functional)
     * composition (category pages only) = arrangement key
     *
     * Prototype families (Phase B redesign):
     *   hero-float     — homepage hero large floating file cards
     *   merge-pdf      — three PDFs merging together
     *   background     — image subject isolation
     *   barcode-scan   — barcode scan + decode result
     *   qr-build       — QR code assembly
     *
     * All other tools retain the 60 mappings; families outside the 5 prototypes
     * fall back to their existing scene or the 'floating' static fallback.
     */
    private static array $tools = [
        // ----------------------- PDF TOOLS -----------------------
        'merge-pdf'          => ['family' => 'merge',    'variant' => 'PDF'],
        'split-pdf'          => ['family' => 'split',    'variant' => 'PDF'],
        'compress-pdf'       => ['family' => 'compress', 'variant' => 'PDF'],
        'jpg-to-pdf'         => ['family' => 'convert',  'variant' => 'JPG → PDF'],
        'pdf-to-jpg'         => ['family' => 'convert',  'variant' => 'PDF → JPG'],
        'rotate-pdf-pages'   => ['family' => 'rotate',   'variant' => 'PDF'],
        'reorder-pdf-pages'  => ['family' => 'reorder',  'variant' => 'PDF'],
        'delete-pdf-pages'   => ['family' => 'delete',   'variant' => 'PDF'],
        'add-page-numbers'   => ['family' => 'pagenum',  'variant' => 'PDF'],
        'watermark-pdf'      => ['family' => 'watermark','variant' => 'PDF'],
        'extract-pdf-pages'  => ['family' => 'extract',  'variant' => 'PDF'],
        'protect-pdf'        => ['family' => 'protect',  'variant' => 'PDF'],
        'unlock-pdf'         => ['family' => 'unlock',   'variant' => 'PDF'],

        // ----------------------- IMAGE TOOLS ----------------------
        'compress-image'     => ['family' => 'compress', 'variant' => 'IMG'],
        'resize-image'       => ['family' => 'resize',   'variant' => 'IMG'],
        'crop-image'         => ['family' => 'crop',     'variant' => 'IMG'],
        'convert-image'      => ['family' => 'convert',  'variant' => 'IMG'],
        'remove-background'  => ['family' => 'background','variant' => 'IMG'],
        'add-watermark'      => ['family' => 'watermark','variant' => 'IMG'],
        'rotate-image'       => ['family' => 'rotate',   'variant' => 'IMG'],
        'round-corners'      => ['family' => 'round',    'variant' => 'IMG'],
        'heic-to-jpg'        => ['family' => 'convert',  'variant' => 'HEIC → JPG'],
        'strip-exif'         => ['family' => 'strip',    'variant' => 'IMG'],
        'image-to-text'      => ['family' => 'ocr',      'variant' => 'IMG'],
        'image-upscaler'     => ['family' => 'upscale',  'variant' => 'IMG'],
        'add-text-to-image'  => ['family' => 'textimage','variant' => 'IMG'],
        'rotate-flip-image'  => ['family' => 'rotate',   'variant' => 'IMG'],

        // ----------------------- VIDEO TOOLS ----------------------
        'compress-video'     => ['family' => 'compress', 'variant' => 'VID'],
        'trim-video'         => ['family' => 'trim',     'variant' => 'VID'],
        'mute-video'         => ['family' => 'mute',     'variant' => 'VID'],
        'video-to-gif'       => ['family' => 'convert',  'variant' => 'VID → GIF'],
        'resize-video'       => ['family' => 'resize',   'variant' => 'VID'],
        'extract-audio'      => ['family' => 'extract',  'variant' => 'VID → AUDIO'],
        'mov-to-mp4'         => ['family' => 'convert',  'variant' => 'MOV → MP4'],
        'mkv-to-mp4'         => ['family' => 'convert',  'variant' => 'MKV → MP4'],

        // ----------------------- AUDIO TOOLS ----------------------
        'audio-converter'    => ['family' => 'convert',  'variant' => 'AUDIO'],
        'trim-audio'         => ['family' => 'trim',     'variant' => 'AUDIO'],
        'merge-audio'        => ['family' => 'merge',    'variant' => 'AUDIO'],
        'change-speed'       => ['family' => 'speed',    'variant' => 'AUDIO'],
        'audio-to-mono'      => ['family' => 'mono',     'variant' => 'AUDIO'],
        'volume-boost'       => ['family' => 'volume',   'variant' => 'AUDIO'],
        'm4a-to-mp3'         => ['family' => 'convert',  'variant' => 'M4A → MP3'],

        // ---------------------- TEXT & FONT -----------------------
        'case-converter'     => ['family' => 'text',     'variant' => 'case'],
        'word-counter'       => ['family' => 'text',     'variant' => 'count'],
        'remove-duplicate-lines' => ['family' => 'text', 'variant' => 'dedupe'],
        'sort-lines'         => ['family' => 'text',     'variant' => 'sort'],
        'text-cleaner'       => ['family' => 'text',     'variant' => 'clean'],
        'text-compare'       => ['family' => 'text',     'variant' => 'diff'],
        'font-styler'        => ['family' => 'font',     'variant' => 'font'],
        'text-formatter'     => ['family' => 'text',     'variant' => 'format'],

        // ---------------------- UTILITY TOOLS ---------------------
        'password-generator' => ['family' => 'password', 'variant' => 'text'],
        'qr-code-generator'  => ['family' => 'qr-build', 'variant' => 'QR'],
        'color-picker'       => ['family' => 'color',    'variant' => 'color'],
        'favicon-generator'  => ['family' => 'convert',  'variant' => 'ICO'],
        'base64-tool'        => ['family' => 'base64',   'variant' => 'text'],
        'file-hash-checker'  => ['family' => 'hash',     'variant' => 'file'],
        'qr-code-reader'     => ['family' => 'qr-scan',  'variant' => 'QR'],
        'what-is-my-ip'      => ['family' => 'ip',       'variant' => 'network'],
        'barcode-generator'  => ['family' => 'barcode-build', 'variant' => 'barcode'],
        'barcode-reader'     => ['family' => 'barcode-scan',  'variant' => 'barcode'],
    ];

    /** Category slug => composition (3D arrangement) key. */
    private static array $categories = [
        'pdf-tools'     => ['composition' => 'pdf-pages'],
        'image-tools'   => ['composition' => 'photo-frames'],
        'video-tools'   => ['composition' => 'video-frames'],
        'audio-tools'   => ['composition' => 'audio-cards'],
        'text-tools'    => ['composition' => 'type-layers'],
        'utility-tools' => ['composition' => 'utility-orbit'],
    ];

    public static function get(string $slug): ?array
    {
        return self::$tools[$slug] ?? null;
    }

    public static function forTool(string $slug): array
    {
        return self::$tools[$slug] ?? ['family' => 'floating', 'variant' => ''];
    }

    public static function categoryComposition(string $categorySlug): string
    {
        return self::$categories[$categorySlug]['composition'] ?? 'utility-orbit';
    }

    /** Whether every registered tool has a motion assignment. */
    public static function countMapped(): int
    {
        return count(self::$tools);
    }

    /** Distinct motion families currently in use. */
    public static function families(): array
    {
        $out = [];
        foreach (self::$tools as $cfg) {
            $out[$cfg['family']] = true;
        }
        return array_keys($out);
    }
}
