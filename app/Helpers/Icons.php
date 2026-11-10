<?php
namespace App\Helpers;

/**
 * Server-rendered inline SVG icon set.
 *
 * Every FileGenie tool and category has a local, dependency-free icon. Icons
 * are inline <svg> markup (no external CDN, no emoji, no JS hydration) so they
 * render immediately, inherit the surrounding text color via currentColor, and
 * stay crisp at any size. A missing key falls back to a neutral default so a
 * tool can never ship an empty box.
 */
class Icons
{
    /** @var array<string,string> inner SVG markup per icon key */
    private static array $paths = [
        // ---------- PDF ----------
        'merge' => '<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 6l-6 6-3-3"/><rect x="8" y="8" width="8" height="11" rx="1.5"/>',
        'split' => '<path d="M6 3h9l5 5v13a0 0 0 0 1 0 0H6a0 0 0 0 1 0 0z" opacity="0"/><rect x="6" y="4" width="12" height="16" rx="1.5"/><path d="M12 4v6M9 10h6"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>',
        'pages' => '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/><circle cx="17" cy="17" r="2.5"/>',
        'lock' => '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2"/>',
        'unlock' => '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/><circle cx="12" cy="15.5" r="1.2"/>',
        'extract' => '<rect x="4" y="4" width="9" height="16" rx="1.5"/><path d="M17 9l4 3-4 3M21 12h-7" opacity=".9"/>',
        'compress' => '<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4M9 12h6"/>',
        'image-to-pdf' => '<rect x="3" y="4" width="8" height="7" rx="1"/><circle cx="6.5" cy="7" r=".8"/><path d="M5 11l2.5-2 2 1.5L13 6"/><path d="M14 14h7v6h-7z"/><path d="M17.5 17h1M17.5 17v3"/>',
        'pdf-to-image' => '<rect x="3" y="13" width="8" height="7" rx="1"/><path d="M5 20l2.5-2 2 1.5L13 15"/><path d="M14 4h7v6h-7z"/><circle cx="17.5" cy="7" r=".8"/><path d="M14 14h7v6h-7z"/>',

        // ---------- Image ----------
        'resize' => '<rect x="4" y="6" width="10" height="10" rx="1"/><path d="M14 14h4a2 2 0 0 1 2 2v2M20 4v4M20 8h-4"/>',
        'crop' => '<path d="M6 2v16a2 2 0 0 0 2 2h16"/><path d="M2 6h16a2 2 0 0 1 2 2v16"/>',
        'convert' => '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
        'bg-remove' => '<circle cx="9" cy="8" r="3"/><path d="M4 20c0-3 2.5-5 5-5s5 2 5 5"/><path d="M16 4l1.5 3 3 1.5-3 1.5L16 13l-1.5-3L11 8.5l3-1.5z" opacity=".9"/>',
        'watermark' => '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 15l4-4 3 3 4-4 5 5"/><circle cx="9" cy="10" r="1.5"/><path d="M14 9c0-1 1-2 2-2s2 1 2 2-1 2-2 2"/>',
        'corner' => '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9v8a2 2 0 0 0 2 2h8"/>',
        'heic' => '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="M5 17l4-4 3 2 4-4 3 3"/><path d="M14 8h4v4" opacity=".7"/>',
        'strip' => '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M9 4v16M9 4h4M9 9h4M9 14h4M14 4v16" opacity=".6"/>',
        'rotate' => '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
        'reorder' => '<path d="M4 7h10M4 12h10M4 17h10M18 7h2M18 12h2M18 17h2" opacity=".4"/><circle cx="17" cy="7" r="1.4"/><circle cx="17" cy="12" r="1.4"/><circle cx="17" cy="17" r="1.4"/>',
        'delete' => '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
        'ocr' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15l2-3 2 2 3-4 3 5"/><circle cx="8" cy="9" r="1.2"/><path d="M4 19h16" opacity="0"/>',
        'upscale' => '<path d="M4 14l4-4 3 3 5-6 4 4"/><path d="M14 6h4v4" opacity=".9"/><path d="M4 19h16"/>',
        'text-image' => '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h6M7 13h8M7 16h4" opacity=".9"/>',
        'rotate-flip' => '<path d="M3 12a9 9 0 0 1 15-6.7"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7" opacity=".6"/><path d="M3 21v-5h5" opacity=".6"/>',

        // ---------- Video / Audio ----------
        'trim' => '<path d="M3 12h4l2-4 4 8 2-4h6"/>',
        'mute' => '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>',
        'gif' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10v4a2 2 0 0 0 4 0v-4M7 12h4M14 10h2a2 2 0 0 1 0 4h-2v-4z" opacity=".9"/>',
        'audio' => '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
        'speed' => '<path d="M3 13a9 9 0 1 1 18 0"/><path d="M12 13l5-3"/>',
        'mono' => '<path d="M3 12h2l2-6 3 12 3-9 2 3h6"/>',
        'volume' => '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 7a7 7 0 0 1 0 10"/>',
        'mov' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l4 3-4 3z"/><path d="M7 8v8" opacity=".5"/>',
        'mkv' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 9v6M8 9l4 6M12 9v6" opacity=".8"/><path d="M16 9l3 6-3 0" opacity=".8"/>',
        'm4a' => '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/><path d="M14 10h2" opacity=".5"/>',

        // ---------- Text ----------
        'case' => '<path d="M5 17L5 7M5 17H9M5 12H8M12 17h3a2 2 0 0 0 0-4h-3v-1h4V8h-4l-1 1M12 17v-5"/>',
        'counter' => '<path d="M4 9h16M4 15h10"/><circle cx="18" cy="15" r="2"/>',
        'dedupe' => '<path d="M4 7h10M4 12h7M4 17h10"/><path d="M17 9l3 3-3 3M17 12h3"/>',
        'sort' => '<path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3"/>',
        'clean' => '<path d="M19 4l1 2-9 9-3 1 1-3z"/><path d="M5 20h9"/>',
        'diff' => '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/><path d="M6 9h2M6 12h2M16 9h2" opacity=".7"/>',
        'font' => '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
        'format' => '<path d="M4 6h16M4 12h16M4 18h10"/>',

        // ---------- Utility ----------
        'password' => '<circle cx="8" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/><path d="M4 4h16v16H4z" opacity="0"/>',
        'qr' => '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3zM19 13v3M13 19h3v-3M19 19v-3h-3" opacity=".9"/>',
        'color' => '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2 0-1.5 1.5-2 2-3 .8-1.2 3-2 3-6a9 9 0 0 0-9-7z"/><circle cx="8" cy="12" r="1.2"/><circle cx="12" cy="8" r="1.2"/><circle cx="16" cy="10" r="1.2"/>',
        'favicon' => '<path d="M4 4h10l6 6v10a0 0 0 0 1 0 0H4z"/><path d="M14 4v6h6"/><path d="M9 14l1.5 3 1.5-3 1.5 3" opacity=".8"/>',
        'base64' => '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/>',
        'hash' => '<path d="M4 9h16M4 15h16M10 4L8 20M16 4l-2 16"/>',
        'privacy' => '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
        'ip' => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
        'barcode' => '<path d="M4 5v14M7 5v14M10 5v14M13 5v14M16 5v14M19 5v14" /><path d="M4 5h16M4 19h16" opacity=".4"/>',
        'scan' => '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M4 12h16" opacity=".5"/>',

        // ---------- Category ----------
        'file-pdf' => '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zM9 16v2M13 13h2M13 18h2"/>',
        'image' => '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
        'video' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
        'music' => '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
        'type' => '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
        'grid' => '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    ];

    /** Inner fallback markup for unknown keys. */
    private const FALLBACK = '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/>';

    /**
     * Return an inline <svg> for the given key. Uses a 24x24 viewBox,
     * inherits color via currentColor, and scales to its container.
     */
    public static function svg(string $key, array $attrs = []): string
    {
        $inner = self::$paths[$key] ?? self::FALLBACK;
        $cls = $attrs['class'] ?? '';
        if ($cls) {
            $cls = ' ' . $cls;
        }
        $extra = '';
        foreach (['title'] as $k) {
            if (isset($attrs[$k])) {
                $extra .= ' ' . $k . '="' . htmlspecialchars($attrs[$k], ENT_QUOTES, 'UTF-8') . '"';
            }
        }
        return '<svg class="fg-icon' . $cls . '" viewBox="0 0 24 24" fill="none" '
            . 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
            . ' aria-hidden="true" focusable="false"' . $extra . '>' . $inner . '</svg>';
    }

    /** Whether a key has a dedicated icon (vs. the fallback). */
    public static function has(string $key): bool
    {
        return isset(self::$paths[$key]);
    }
}
