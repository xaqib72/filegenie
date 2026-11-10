<?php
namespace App\Registry;

class ToolContentRegistry
{
    public static function getExtraContent(string $slug): array
    {
        $content = [
            // PDF — 13
            'merge-pdf' => [
                ['title' => 'What does Merge PDF do?', 'html' => '<p>Merge PDF combines multiple PDF documents into a single file while preserving the quality, resolution, and bookmarks of each original. You can drag to reorder pages before merging, so the output reads exactly how you want it to.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Combine separate cover letters and CVs into one document for job applications.</li><li>Merge scanned invoice batches before archiving.</li><li>Build a single report from several chapter PDFs.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Pages are embedded at their original resolution by default — nothing is re-compressed unless you run the result through Compress PDF separately. The tool works entirely in your browser; your documents are never sent to a server.</p>'],
            ],
            'split-pdf' => [
                ['title' => 'What does Split PDF do?', 'html' => '<p>Split PDF divides a large PDF into smaller files. Choose specific page ranges, individual pages, or split by fixed intervals (e.g., every 5 pages).</p>'],
                ['title' => 'Split PDF vs Extract PDF Pages', 'html' => '<p>Use <strong>Split PDF</strong> when you want to divide an entire document into several new files (e.g., split a 50-page contract into 10-page chapters). Use <strong>Extract PDF Pages</strong> when you only want specific pages from a document, regardless of what happens to the rest.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Splitting does not re-encode pages — each output file keeps the original quality. The tool runs locally in your browser with no uploads.</p>'],
            ],
            'compress-pdf' => [
                ['title' => 'What does Compress PDF do?', 'html' => '<p>Compress PDF reduces the file size of a PDF by re-encoding embedded images while keeping text and vector content crisp. Three compression levels let you balance quality against file size.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Shrink a 20MB scanned PDF to under 2MB for email.</li><li>Prepare documents for web upload where size limits apply.</li><li>Free up storage space without losing text quality.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Compression targets embedded images, not text layers. Your text remains selectable and searchable after compression. Higher compression = smaller file but more image quality reduction. Start with "Recommended" for most uses.</p>'],
            ],
            'jpg-to-pdf' => [
                ['title' => 'What does JPG to PDF do?', 'html' => '<p>JPG to PDF converts one or many JPG and PNG images into a single PDF document. You can arrange the order, choose page sizes (A4, Letter, or original image size), and download the combined document.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Combine scanned documents into a single PDF for sharing.</li><li>Turn photo galleries into printable documents.</li><li>Create PDF portfolios from design mockups.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>You can mix JPG and PNG files in the same PDF. Each image becomes one page. The original image quality is preserved in the output. The tool supports batch uploads — add multiple files at once.</p>'],
            ],
            'pdf-to-jpg' => [
                ['title' => 'What does PDF to JPG do?', 'html' => '<p>PDF to JPG renders every page of a PDF as a high-resolution image. Choose JPG or PNG output and adjust the resolution scale (1x, 1.5x, or 2x) before converting.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Extract charts and diagrams from PDFs for presentations.</li><li>Create image previews of document pages.</li><li>Share specific PDF pages as images on social media or documents.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Each PDF page becomes one image file. PNG output preserves transparency; JPG gives smaller files for photos. The resolution scale multiplies the original page dimensions — 2x gives sharper results for detailed pages.</p>'],
            ],
            'rotate-pdf-pages' => [
                ['title' => 'What does Rotate PDF Pages do?', 'html' => '<p>Rotate PDF Pages fixes sideways or upside-down pages by rotating them 90°, 180°, or 270°. You can rotate all pages at once or select specific pages.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Rotation is applied at the page level — the original content quality is preserved. This is different from re-saving a PDF, which can cause quality loss. The tool detects common orientation issues but you can override with manual selection.</p>'],
            ],
            'reorder-pdf-pages' => [
                ['title' => 'What does Reorder PDF Pages do?', 'html' => '<p>Reorder PDF Pages lets you drag and drop page thumbnails to rearrange a PDF. Move pages to any position and save a new document with the updated sequence.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Move a cover page to the front after merging documents.</li><li>Fix page order after a scan comes out reversed.</li><li>Rearrange chapters before finalizing a document.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Pages are re-embedded at their original quality — only the sequence changes. No re-compression happens. Drag any thumbnail to any position in the document.</p>'],
            ],
            'delete-pdf-pages' => [
                ['title' => 'What does Delete PDF Pages do?', 'html' => '<p>Delete PDF Pages removes specific pages or ranges from a PDF and saves the remaining pages as a new file.</p>'],
                ['title' => 'Delete PDF Pages vs Split PDF', 'html' => '<p>Use <strong>Delete PDF Pages</strong> when you want to remove unwanted pages and keep the rest as one document. Use <strong>Split PDF</strong> when you want to divide a document into multiple separate files.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Deleted pages are simply excluded from the output — the remaining pages are untouched. Enter ranges like 2-4 or individual pages like 7.</p>'],
            ],
            'add-page-numbers' => [
                ['title' => 'What does Add Page Numbers do?', 'html' => '<p>Add Page Numbers stamps real page numbers onto every page of a PDF. Choose position (bottom-center, bottom-right, top-center, or custom), starting number, and font size.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Page numbers are drawn into the page content, not overlaid as annotations. This means they print correctly and appear in PDF readers. Choose a page range to skip the cover page. The tool processes everything locally in your browser.</p>'],
            ],
            'watermark-pdf' => [
                ['title' => 'What does Watermark PDF do?', 'html' => '<p>Watermark PDF stamps a diagonal or flat text watermark across every page of a PDF. Adjust opacity, size, rotation, and position.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Add "DRAFT" or "CONFIDENTIAL" to sensitive documents before sharing.</li><li>Brand outgoing documents with your company name.</li><li>Protect intellectual property with visible ownership marks.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>The watermark is drawn into the page content, so it stays visible when the PDF is printed or copied. Lower opacity for a subtle background-style watermark, or increase it for bold protection.</p>'],
            ],
            'extract-pdf-pages' => [
                ['title' => 'What does Extract PDF Pages do?', 'html' => '<p>Extract PDF Pages pulls specific pages or ranges from a PDF into a new document. Only the pages you select are included — the rest are discarded.</p>'],
                ['title' => 'Extract PDF Pages vs Split PDF', 'html' => '<p>Use <strong>Extract PDF Pages</strong> when you want to save only selected pages from a document (e.g., pages 1, 3-5, 8). Use <strong>Split PDF</strong> when you want to divide an entire document into multiple files.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Extracted pages are copied at their original resolution — nothing is re-compressed. You can combine non-contiguous pages: 2, 5-7, 11.</p>'],
            ],
            'protect-pdf' => [
                ['title' => 'What does Protect PDF do?', 'html' => '<p>Protect PDF adds genuine AES encryption to a PDF file. Set a user password that must be entered to open the document — this is real encryption, not a filename or metadata change.</p>'],
                ['title' => 'Things to know', 'html' => '<p>The PDF is encrypted with AES so it cannot be opened without the password you set. Standard PDF readers (Adobe Reader, Preview, browser viewers) will prompt for the password. This is not DRM — it is standard PDF password protection that works everywhere.</p>'],
            ],
            'unlock-pdf' => [
                ['title' => 'What does Unlock PDF do?', 'html' => '<p>Unlock PDF removes the password from a PDF you can already open. Provide the correct password, and the tool saves a version with encryption removed.</p>'],
                ['title' => 'Important', 'html' => '<p>This tool only works for PDFs you are authorized to open. It does not bypass unknown passwords — you must know the correct password. Your password is used once in your browser to decrypt the file and is never stored or sent anywhere.</p>'],
            ],

            // IMAGE — 14
            'compress-image' => [
                ['title' => 'What does Compress Image do?', 'html' => '<p>Compress Image reduces image file size with smart lossy and lossless compression. Process PNG, JPG, and WebP files locally and download noticeably smaller versions.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Shrink images before uploading to websites or social media.</li><li>Reduce email attachment sizes.</li><li>Save storage space on your device without noticeable quality loss.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>At high quality settings the difference is imperceptible while file size drops significantly. Batch processing lets you compress multiple images at once. PNG uses lossless compression by default; JPG uses adjustable lossy compression.</p>'],
            ],
            'resize-image' => [
                ['title' => 'What does Resize Image do?', 'html' => '<p>Resize Image changes image dimensions by width, height, percentage, or preset. Lock aspect ratio to avoid distortion.</p>'],
                ['title' => 'Resize vs Upscale', 'html' => '<p><strong>Resize Image</strong> changes dimensions — making an image larger or smaller. <strong>AI Image Upscaler</strong> uses a neural network to add detail when enlarging. Use Resize for dimension changes; use Upscaler when you want a larger image with reconstructed detail.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Making an image smaller always reduces file size. Making it larger increases file size but the Upscaler can add meaningful detail. Locking aspect ratio prevents stretching.</p>'],
            ],
            'crop-image' => [
                ['title' => 'What does Crop Image do?', 'html' => '<p>Crop Image trims unwanted edges with a draggable crop box. Use free-form cropping or choose preset ratios like 1:1, 4:3, or 16:9.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Cropping removes pixels from the edges — it does not compress or resize the remaining area. Use 1:1 for profile pictures, 16:9 for widescreen, or free-form for custom compositions. Transparent areas are preserved when saving to PNG.</p>'],
            ],
            'convert-image' => [
                ['title' => 'What does Convert Image do?', 'html' => '<p>Convert Image switches between JPG, PNG, WebP, and BMP formats in one click. All conversions happen on a canvas locally in your browser.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Convert PNG to JPG for smaller web file sizes.</li><li>Convert JPG to PNG to preserve transparency.</li><li>Switch to WebP for modern web delivery.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Converting to PNG preserves transparency. Converting from PNG to JPG replaces transparent areas with a background color. Batch processing supports multiple files at once.</p>'],
            ],
            'remove-background' => [
                ['title' => 'What does Remove Background do?', 'html' => '<p>Remove Background uses an in-browser ML model to automatically separate the subject from the background. The result is a transparent PNG you can place on any background.</p>'],
                ['title' => 'How the AI model works', 'html' => '<p>The segmentation model runs entirely in your browser via WebAssembly. It downloads once on first use (~6MB) and caches locally. Subsequent runs are instant — no repeated downloads.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Works best with clear subjects against distinct backgrounds. Complex edges (hair, fur) may need touch-up. Output is always PNG with transparency. No upload — your image never leaves your device.</p>'],
            ],
            'add-watermark' => [
                ['title' => 'What does Add Watermark do?', 'html' => '<p>Add Watermark overlays text on your images. Adjust opacity, size, angle, position, and tiling to protect photos or add branding.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Protect portfolio images from unauthorized use.</li><li>Add copyright notices before sharing online.</li><li>Brand product photos with your store name.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Enable the tile option to repeat the watermark across the entire image for maximum protection. Lower opacity for subtle branding, higher for bold protection. Output format is PNG to preserve quality.</p>'],
            ],
            'rotate-image' => [
                ['title' => 'What does Rotate Image do?', 'html' => '<p>Rotate Image spins photos to the correct orientation or flips them horizontally/vertically. Lossless rotation is used where the format allows.</p>'],
                ['title' => 'Things to know', 'html' => '<p>For JPEG, the tool re-encodes after rotation but keeps quality high with adjustable settings. PNG rotation is lossless. Flip horizontally to mirror an image, or vertically to invert it.</p>'],
            ],
            'round-corners' => [
                ['title' => 'What does Round Corners do?', 'html' => '<p>Round Corners softens image corners with a radius slider, or turns the entire image into a circle — perfect for avatars and profile pictures.</p>'],
                ['title' => 'Things to know', 'html' => '<p>PNG output preserves the transparent corners outside the rounded shape. The circle mode sets the radius to half the smallest dimension automatically. Works great for profile pictures, badges, and social media avatars.</p>'],
            ],
            'heic-to-jpg' => [
                ['title' => 'What does HEIC to JPG do?', 'html' => '<p>HEIC to JPG converts Apple HEIC/HEIF photos to standard JPG or PNG that work on any device, browser, or service.</p>'],
                ['title' => 'Why you need this', 'html' => '<p>HEIC is Apple\'s default photo format on iPhone. It produces smaller files with better quality than JPG, but many devices, email services, and websites don\'t support it. Converting to JPG makes your photos universally compatible.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Batch conversion is supported — upload multiple HEIC files at once. Both JPG and PNG output are available. The tool decodes HEIC directly in your browser with no uploads.</p>'],
            ],
            'strip-exif' => [
                ['title' => 'What does Strip EXIF do?', 'html' => '<p>Strip EXIF removes embedded metadata from images before sharing them publicly. This includes GPS coordinates, camera make/model, timestamps, and software information.</p>'],
                ['title' => 'Why strip metadata', 'html' => '<p>Photos taken with smartphones and cameras embed location data (GPS), device info, and timestamps by default. Sharing these images publicly can reveal where and when the photo was taken. Stripping EXIF protects your privacy.</p>'],
                ['title' => 'Things to know', 'html' => '<p>The tool re-encodes the image without metadata — the visual content is unchanged. GPS coordinates are the most sensitive type of EXIF data. Batch processing is supported for multiple images.</p>'],
            ],
            'image-to-text' => [
                ['title' => 'What does Image to Text (OCR) do?', 'html' => '<p>Image to Text extracts readable text from photos, scanned documents, and screenshots using an in-browser OCR engine. Copy the text, download as .txt, or try another image.</p>'],
                ['title' => 'How OCR works in your browser', 'html' => '<p>The OCR engine and language data are bundled and run entirely in your browser via WebAssembly. Your images never leave your device. The model loads once on first use (~10MB) and caches for instant subsequent runs.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Best results come from clear, well-lit images with horizontal text. Handwritten text and complex layouts may have lower accuracy. Supported input: JPG, PNG, WebP, BMP. Output is plain text (.txt).</p>'],
            ],
            'image-upscaler' => [
                ['title' => 'What does AI Image Upscaler do?', 'html' => '<p>AI Image Upscaler enlarges images using a real Sub-Pixel CNN super-resolution model running in your browser. It genuinely reconstructs detail rather than simply stretching pixels.</p>'],
                ['title' => 'AI upscaling vs regular resize', 'html' => '<p>A regular resize stretches or shrinks pixels — it does not add new detail. AI upscaling uses a trained neural network to predict and reconstruct missing detail at higher resolutions. The result is a larger image that looks sharper, not just bigger.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Choose 2x or 4x scale. The model runs on-device via WebAssembly — larger images and 4x take longer. Output is PNG. This is not magic — very blurry source images have less detail to reconstruct.</p>'],
            ],
            'add-text-to-image' => [
                ['title' => 'What does Add Text to Image do?', 'html' => '<p>Add Text to Image overlays caption text onto a photo. Control font size, color, position, alignment, and opacity.</p>'],
                ['title' => 'Things to know', 'html' => '<p>The text is baked into the final image — it becomes part of the pixel data, not a separate layer. Position options include top, center, bottom, and corner alignment. Output is PNG.</p>'],
            ],
            'rotate-flip-image' => [
                ['title' => 'What does Rotate & Flip Image do?', 'html' => '<p>Rotate & Flip Image rotates photos by 90°, 180°, or 270° and flips them horizontally or vertically. Dimensions are adjusted correctly so the result has the right shape.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Rotating by 90° or 270° swaps width and height — the tool handles this automatically. Horizontal flip mirrors the image left-to-right. Vertical flip mirrors top-to-bottom. Output is PNG to preserve quality.</p>'],
            ],

            // VIDEO — 8
            'compress-video' => [
                ['title' => 'What does Compress Video do?', 'html' => '<p>Compress Video reduces MP4/WebM file sizes using FFmpeg running in your browser via WebAssembly. Adjust CRF quality and resolution to find the right balance.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Shrink videos for WhatsApp, Discord, or email attachments.</li><li>Reduce file size before uploading to social media.</li><li>Free up device storage without losing acceptable quality.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Lower CRF values = higher quality, larger files. Higher CRF = smaller files, more compression artifacts. Reducing resolution (e.g., 1080p to 720p) also significantly reduces file size. All processing happens locally.</p>'],
            ],
            'trim-video' => [
                ['title' => 'What does Trim Video do?', 'html' => '<p>Trim Video cuts a clip to a start and end time. Uses stream copy where possible for speed — no re-encoding needed for simple trims.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Stream-copy mode is fast and lossless — it simply discards unwanted portions without re-encoding. If the trim points don\'t align with keyframes, a brief re-encode may occur. Set start/end times on the timeline visually or enter exact timestamps.</p>'],
            ],
            'mute-video' => [
                ['title' => 'What does Mute Video do?', 'html' => '<p>Mute Video removes the audio track from a video while keeping the visual track intact — ideal for silent background reels or social media clips.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Only the audio stream is dropped — video quality is completely unaffected. The output is MP4. Perfect for creating silent loops, background footage, or clips where you\'ll add your own audio later.</p>'],
            ],
            'video-to-gif' => [
                ['title' => 'What does Video to GIF do?', 'html' => '<p>Video to GIF converts any short video clip into a looping animated GIF with controllable frame rate, scale, and duration.</p>'],
                ['title' => 'Things to know', 'html' => '<p>GIF files can become large quickly. Lower the frame rate and scale to keep the GIF manageable. A 5-second clip at 10fps and 480px wide is usually a good balance. Supported input: MP4, WebM, MOV, MKV.</p>'],
            ],
            'resize-video' => [
                ['title' => 'What does Resize Video do?', 'html' => '<p>Resize Video changes the resolution of a video — for example, scaling 1080p down to 720p or 480p.</p>'],
                ['title' => 'Resize Video vs Compress Video', 'html' => '<p><strong>Resize Video</strong> changes the pixel dimensions (resolution). <strong>Compress Video</strong> reduces file size while keeping the same resolution. Use Resize when you need a specific output size; use Compress when you just need a smaller file.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Scaling requires re-encoding, so choose a quality preset to balance speed and quality. Lower resolutions (480p, 720p) produce much smaller files and load faster on slow connections.</p>'],
            ],
            'extract-audio' => [
                ['title' => 'What does Extract Audio do?', 'html' => '<p>Extract Audio isolates the soundtrack from any video file and saves it as MP3 or WAV using FFmpeg in your browser.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Save the music from a video as a standalone audio file.</li><li>Extract a podcast episode from a video recording.</li><li>Pull a voice-over from a presentation video.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Both MP3 and WAV output are available. MP3 is compressed and smaller; WAV is uncompressed and larger but lossless. The tool processes the video locally — no upload required.</p>'],
            ],
            'mov-to-mp4' => [
                ['title' => 'What does MOV to MP4 do?', 'html' => '<p>MOV to MP4 converts Apple QuickTime MOV files to widely-compatible MP4. Re-mux when possible for speed, or re-encode to H.264 when needed.</p>'],
                ['title' => 'Why convert MOV to MP4', 'html' => '<p>MOV is mostly an Apple format. MP4 plays on virtually every device, browser, and platform — Windows, Android, smart TVs, and web players all handle it natively.</p>'],
                ['title' => 'Things to know', 'html' => '<p>When the MOV\'s codec is already MP4-compatible, the tool re-muxes (copies streams without re-encoding) for fast, lossless conversion. Otherwise it re-encodes to H.264. Choose a quality preset for re-encode cases.</p>'],
            ],
            'mkv-to-mp4' => [
                ['title' => 'What does MKV to MP4 do?', 'html' => '<p>MKV to MP4 converts Matroska videos to MP4. Re-mux when the codecs are compatible for a fast, lossless container swap, or re-encode otherwise.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Re-muxing copies the video and audio streams without re-encoding — zero quality loss and very fast. Re-encoding is only needed when the MKV uses codecs that MP4 doesn\'t support. All processing happens locally.</p>'],
            ],

            // AUDIO — 7
            'audio-converter' => [
                ['title' => 'What does Audio Converter do?', 'html' => '<p>Audio Converter transcodes audio between popular formats using in-browser FFmpeg. Supported formats include MP3, WAV, OGG, AAC, and M4A.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Convert WAV recordings to MP3 for sharing.</li><li>Change audio format for a device that doesn\'t support OGG.</li><li>Convert M4A files from Apple Music to MP3 for portable players.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Set bitrate for lossy formats — higher bitrate = better quality, larger file. Batch processing is supported for multiple files. All conversion happens locally in your browser.</p>'],
            ],
            'trim-audio' => [
                ['title' => 'What does Trim Audio do?', 'html' => '<p>Trim Audio cuts an audio clip to a start and end time. Build ringtones, remove silence, or extract the best part of a recording.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Set start and end times on the waveform timeline. Export as MP3, WAV, or M4A. Make ringtones by trimming to ~30 seconds. The tool preserves the original audio quality within the selected range.</p>'],
            ],
            'merge-audio' => [
                ['title' => 'What does Merge Audio do?', 'html' => '<p>Merge Audio concatenates multiple audio files into one continuous track. Reorder them before merging to build playlists or combined recordings.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Files are normalized to the chosen output format during merge. You can reorder files by dragging. Supported formats: MP3, WAV, OGG, M4A. Batch upload is supported.</p>'],
            ],
            'change-speed' => [
                ['title' => 'What does Change Audio Speed do?', 'html' => '<p>Change Audio Speed adjusts playback speed from 0.5x to 2x using time-stretching so the pitch stays natural. Great for speeding through podcasts or slowing down music to learn.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Time-stretching means the pitch stays the same even when the speed changes. 0.5x is half speed, 2x is double speed. Works with MP3, WAV, OGG, and M4A.</p>'],
            ],
            'audio-to-mono' => [
                ['title' => 'What does Audio to Mono do?', 'html' => '<p>Audio to Mono downmixes stereo (or multi-channel) audio to a single channel. Useful for voice recordings, podcasts, and compatibility with mono playback devices.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Mono audio avoids phase issues and reduces file size — ideal for voice content. The output is MP3 or WAV. Works with any stereo or multi-channel input format.</p>'],
            ],
            'volume-boost' => [
                ['title' => 'What does Volume Boost do?', 'html' => '<p>Volume Boost increases or decreases audio volume by applying a gain control in decibels. Fix quiet recordings or tone down loud clips.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Large positive gains can cause clipping (distortion). Keep the gain moderate for clean results. Negative gains lower the volume. Output is MP3 or WAV.</p>'],
            ],
            'm4a-to-mp3' => [
                ['title' => 'What does M4A to MP3 do?', 'html' => '<p>M4A to MP3 converts Apple M4A/AAC audio files to MP3 using a real MP3 encoder (libmp3lame) running in your browser via FFmpeg.</p>'],
                ['title' => 'Why convert M4A to MP3', 'html' => '<p>M4A is Apple\'s preferred audio format but MP3 is the universal standard — it works on every device, car stereo, and media player. Converting makes your audio files portable.</p>'],
                ['title' => 'Things to know', 'html' => '<p>This is a real re-encode to MP3, not just a container change. Choose a bitrate — higher values give better quality but larger files. The conversion happens entirely in your browser.</p>'],
            ],

            // TEXT & FONT — 8
            'case-converter' => [
                ['title' => 'What does Case Converter do?', 'html' => '<p>Case Converter transforms text between uppercase, lowercase, sentence case, title case, and alternating case instantly.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Title Case capitalizes the first letter of every word. Sentence Case capitalizes only the first letter of each sentence. Alternating Case toggles case per character. All processing is instant and private.</p>'],
            ],
            'word-counter' => [
                ['title' => 'What does Word Counter do?', 'html' => '<p>Word Counter gives instant text statistics: word count, character count (with and without spaces), sentence count, paragraph count, and estimated reading time.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Reading time is estimated at 200 words per minute. Character counts are shown with and without spaces. Live updates happen as you type — no need to click a button. Great for essays, social media posts, and SEO content.</p>'],
            ],
            'remove-duplicate-lines' => [
                ['title' => 'What does Remove Duplicate Lines do?', 'html' => '<p>Remove Duplicate Lines strips repeated lines from text while preserving order, or sorts and deduplicates. Optionally ignore case.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Preserve-order mode keeps the first occurrence of each line in its original position. Sort mode alphabetizes the unique lines. Toggle case sensitivity to treat "Apple" and "apple" as the same or different.</p>'],
            ],
            'sort-lines' => [
                ['title' => 'What does Sort Lines do?', 'html' => '<p>Sort Lines alphabetizes text lines ascending (A-Z) or descending (Z-A), with optional numeric and case-insensitive sorting.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Enable numeric sorting to order values by magnitude (10 comes after 2, not after 1). Case-insensitive mode ignores capitalization. Optionally remove duplicates after sorting.</p>'],
            ],
            'text-cleaner' => [
                ['title' => 'What does Text Cleaner do?', 'html' => '<p>Text Cleaner strips extra whitespace, line breaks, and invisible characters from messy text copied from PDFs, websites, or documents.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Removes zero-width spaces, non-breaking spaces, trailing whitespace, and control characters. Collapses multiple spaces into one. Toggle individual cleanup options to control exactly what gets removed.</p>'],
            ],
            'text-compare' => [
                ['title' => 'What does Text Compare do?', 'html' => '<p>Text Compare finds differences between two versions of text and highlights added, removed, and changed lines using a line-based diff.</p>'],
                ['title' => 'Things to know', 'html' => '<p>This is a line-based diff, which is ideal for comparing documents, code, or lists. Paste the original text in one box and the changed text in the other. Added lines are highlighted green, removed lines red.</p>'],
            ],
            'font-styler' => [
                ['title' => 'What does Font Styler do?', 'html' => '<p>Font Styler converts plain text into stylish Unicode variants — bold, italic, cursive, monospace, and more — to copy into social media bios and captions.</p>'],
                ['title' => 'Fancy Text vs Font Styler', 'html' => '<p><strong>Fancy Text Generator</strong> focuses on decorative Unicode characters for aesthetic text. <strong>Font Styler</strong> provides a broader range of style families specifically designed for social media profiles (Instagram, TikTok, Discord, Twitter).</p>'],
                ['title' => 'Things to know', 'html' => '<p>These are Unicode characters, not installed fonts. They work anywhere that renders Unicode — social media bios, chat apps, and document editors. Not all platforms support every Unicode range.</p>'],
            ],
            'text-formatter' => [
                ['title' => 'What does Text Formatter do?', 'html' => '<p>Text Formatter pretty-prints and validates JSON, and re-indents HTML or other structured text for readability.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Invalid JSON is reported with the location of the error. HTML formatting re-indents tags for readability. All processing is instant and private — your code never leaves your browser.</p>'],
            ],

            // UTILITY — 10
            'password-generator' => [
                ['title' => 'What does Password Generator do?', 'html' => '<p>Password Generator creates cryptographically secure passwords and passphrases using the browser Web Crypto API. Control length and character sets.</p>'],
                ['title' => 'How secure are the passwords?', 'html' => '<p>The tool uses crypto.getRandomValues(), which is cryptographically strong and non-predictable. This is the same API used by browsers for secure token generation. The passwords are generated entirely in your browser — nothing is sent to a server.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Include or exclude uppercase, lowercase, numbers, and symbols. Longer passwords are exponentially harder to crack. This tool generates passwords, not passphrases — each character is randomly selected.</p>'],
            ],
            'qr-code-generator' => [
                ['title' => 'What does QR Code Generator do?', 'html' => '<p>QR Code Generator creates scannable QR codes for URLs, Wi-Fi, contacts, or plain text. Adjust size, colors, error correction, and margin.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Share a website URL as a QR code for printed materials.</li><li>Create Wi-Fi QR codes so guests can connect instantly.</li><li>Generate contact QR codes for business cards.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Higher error correction levels make the QR code more resilient to damage or partial obstruction. Transparent background is supported. Output as PNG or SVG. The tool runs locally — no uploads.</p>'],
            ],
            'color-picker' => [
                ['title' => 'What does Color Picker do?', 'html' => '<p>Color Picker lets you choose a color visually and get its HEX, RGB, and HSL values with copy buttons and a contrast preview.</p>'],
                ['title' => 'Things to know', 'html' => '<p>All color models update live — type a HEX value and RGB/HSL update automatically. The contrast preview shows how the color looks with white and black text. Copy any value with one click.</p>'],
            ],
            'favicon-generator' => [
                ['title' => 'What does Favicon Generator do?', 'html' => '<p>Favicon Generator turns a square image into multi-size ICO/PNG favicons (16, 32, 48, 64, 128, 256 px) packaged for your website.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Upload a square image (PNG, JPG, SVG). The tool generates all standard favicon sizes plus an ICO file. Each size is optimized for its use case — 16x16 for browser tabs, 256x256 for desktop shortcuts.</p>'],
            ],
            'base64-tool' => [
                ['title' => 'What does Base64 Encoder/Decoder do?', 'html' => '<p>Base64 Encoder/Decoder converts text and small files to Base64 encoding, and decodes Base64 back to text or a downloadable file.</p>'],
                ['title' => 'Common use cases', 'html' => '<ul><li>Embed small images directly in HTML/CSS as data URIs.</li><li>Encode credentials for basic auth headers.</li><li>Decode Base64 strings back to readable text or files.</li></ul>'],
                ['title' => 'Things to know', 'html' => '<p>Encode mode converts any text or file to Base64. Decode mode attempts to convert back — if the content looks like binary, a download option appears. All processing is local and private.</p>'],
            ],
            'file-hash-checker' => [
                ['title' => 'What does File Hash Checker do?', 'html' => '<p>File Hash Checker computes SHA-256, SHA-1, and MD5 checksums of any file using the Web Crypto API. Verify file integrity by comparing against known checksums.</p>'],
                ['title' => 'How checksums work', 'html' => '<p>A checksum is a unique fingerprint of a file\'s contents. If even one byte changes, the checksum changes completely. Compare the computed hash against a known-good hash to verify a download wasn\'t corrupted or tampered with.</p>'],
                ['title' => 'Things to know', 'html' => '<p>SHA-256 is the most secure algorithm. MD5 and SHA-1 are included for compatibility with older systems but are not recommended for security-critical verification. The tool computes hashes entirely in your browser.</p>'],
            ],
            'qr-code-reader' => [
                ['title' => 'What does QR Code Reader do?', 'html' => '<p>QR Code Reader scans and decodes QR codes from photos or images in your browser. Supports URLs, plain text, email, phone numbers, Wi-Fi credentials, and SMS.</p>'],
                ['title' => 'Privacy and security', 'html' => '<p>Your image is decoded entirely in your browser — it never leaves your device. No upload, no server processing, no third-party APIs. The tool detects the QR code content type and shows you exactly what it contains.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Supported input: JPG, PNG, WebP. The QR code should be reasonably sharp and well-lit for reliable decoding. URLs are shown with a safe open option. All processing is local and private.</p>'],
            ],
            'what-is-my-ip' => [
                ['title' => 'What does What Is My IP do?', 'html' => '<p>What Is My IP shows the public IP address your connection presents to the server, plus IP version (IPv4/IPv6) and browser metadata.</p>'],
                ['title' => 'Privacy note', 'html' => '<p>This tool does NOT use a geolocation API. No city, country, ISP, or approximate location is looked up. The IP address is derived from your connection to our server — no third-party service is involved. The information is not stored.</p>'],
            ],
            'barcode-generator' => [
                ['title' => 'What does Barcode Generator do?', 'html' => '<p>Barcode Generator creates real, scannable barcodes in many formats: CODE128, CODE39, EAN-13, EAN-8, UPC-A, UPC-E, ITF, and Codabar. Download as PNG or SVG.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Each barcode type has validation rules — the tool checks your input before generating. Adjust size, colors, and format. Output is a real barcode image that scanners can read, not a visual approximation.</p>'],
            ],
            'barcode-reader' => [
                ['title' => 'What does Barcode Reader do?', 'html' => '<p>Barcode Reader scans and decodes barcodes from uploaded images. Supports common 1D symbologies and shows the decoded value with format identification.</p>'],
                ['title' => 'Privacy note', 'html' => '<p>Your image is decoded entirely in your browser — it never leaves your device. No upload, no server processing. Decoding happens locally using JavaScript barcode recognition.</p>'],
                ['title' => 'Things to know', 'html' => '<p>Supported input: JPG, JPEG, PNG, WebP. The barcode should be sharp and well-lit for reliable decoding. Supported formats: CODE128, CODE39, EAN-13, EAN-8, UPC-A, UPC-E, ITF, Codabar.</p>'],
            ],
        ];

        return $content[$slug] ?? [];
    }
}
