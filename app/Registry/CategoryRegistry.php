<?php
namespace App\Registry;

class CategoryRegistry {
    private static array $categories = [
        "pdf-tools" => [
            "id" => "pdf-tools",
            "name" => "PDF Tools",
            "slug" => "pdf-tools",
            "icon" => "file-pdf",
            "short_description" => "Merge, split, compress, and edit PDF documents in your browser.",
            "description" => "Complete collection of client-side PDF tools. Compress, merge, split, rotate, convert, and organize PDF documents securely without uploading files to remote servers.",
            "faqs" => [
                ["q" => "Are my PDF files uploaded to any server?", "a" => "No. All PDF processing happens locally inside your browser using WebAssembly and JavaScript."],
                ["q" => "Is there a file size limit?", "a" => "Because files are processed on your computer, FileGenie can handle large documents up to 1GB depending on your device RAM."]
            ]
        ],
        "image-tools" => [
            "id" => "image-tools",
            "name" => "Image Tools",
            "slug" => "image-tools",
            "icon" => "image",
            "short_description" => "Compress, resize, crop, convert, and edit images online.",
            "description" => "Private image editing utilities. Compress PNG/JPG/WebP files, resize photos, crop dimensions, remove backgrounds, add watermarks, and strip EXIF privacy metadata.",
            "faqs" => [
                ["q" => "What image formats are supported?", "a" => "JPG, PNG, WebP, GIF, HEIC, BMP, and SVG formats are supported."],
                ["q" => "Does compressing images reduce visible quality?", "a" => "FileGenie uses smart lossy and lossless algorithms to reduce size by up to 80% while retaining crisp visual quality."]
            ]
        ],
        "video-tools" => [
            "id" => "video-tools",
            "name" => "Video Tools",
            "slug" => "video-tools",
            "icon" => "video",
            "short_description" => "Compress, trim, mute, resize, and convert video clips.",
            "description" => "Browser-side video processing tools. Compress video size for Discord/WhatsApp, trim clips, convert formats, remove audio tracks, and export MP4 videos to animated GIFs.",
            "faqs" => [
                ["q" => "Can I convert MP4 videos to GIF animations?", "a" => "Yes! Use our Video to GIF converter tool to convert clips with custom frame rate control."]
            ]
        ],
        "audio-tools" => [
            "id" => "audio-tools",
            "name" => "Audio Tools",
            "slug" => "audio-tools",
            "icon" => "music",
            "short_description" => "Cut, merge, convert, compress, and speed up audio files.",
            "description" => "Fast Web Audio API tools. Cut ringtones, trim MP3/WAV/AAC files, merge audio tracks, adjust playback speed, and extract background music from video files.",
            "faqs" => [
                ["q" => "Can I extract audio from video files?", "a" => "Yes. Our Extract Audio from Video tool isolates AAC/MP3 audio streams directly in your browser."]
            ]
        ],
        "text-tools" => [
            "id" => "text-tools",
            "name" => "Text & Font Tools",
            "slug" => "text-tools",
            "icon" => "type",
            "short_description" => "Generate fancy text, count words, clean text, and convert cases.",
            "description" => "Text transformation and font tools. Generate stylish unicode fonts, convert letter casing, count words/characters, remove duplicate lines, sort lists, and compare diffs.",
            "faqs" => [
                ["q" => "Where can I use generated fancy unicode text?", "a" => "You can copy and paste fancy text into Instagram bios, TikTok captions, Discord handles, and Twitter posts."]
            ]
        ],
        "utility-tools" => [
            "id" => "utility-tools",
            "name" => "Utility Tools",
            "slug" => "utility-tools",
            "icon" => "grid",
            "short_description" => "QR codes, passwords, color picker, favicons, base64, and file hashes.",
            "description" => "Essential everyday digital developer and productivity tools. Generate QR codes, generate secure passwords, pick color palettes, convert Base64 strings, and verify file hash checksums.",
            "faqs" => [
                ["q" => "How secure is the password generator?", "a" => "FileGenie uses cryptographically strong Web Crypto API (`crypto.getRandomValues`) for non-predictable passwords."]
            ]
        ]
    ];

    public static function getAll(): array {
        return self::$categories;
    }

    public static function get(string $id): ?array {
        return self::$categories[$id] ?? null;
    }
}
