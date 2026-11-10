<?php
/** @var array $tool */
/** @var array $category */
/** @var array $relatedTools */
$engine = $tool['processing_engine'];
$masterAction = empty($tool['input_formats'])
    ? 'Open ' . $tool['name']
    : ($tool['batch_support'] ? 'Choose files' : 'Choose a file');
$acceptFormats = array_map(static function (string $format): string {
    return $format === '*' ? '*/*' : '.' . ltrim($format, '.');
}, $tool['input_formats'] ?: ['*']);


// The AI background-removal engine lazy-imports the bare specifier
// "onnxruntime-web". Keep the runtime and WASM same-origin in production; the
// segmentation model remains a documented first-use provider download.
if ($engine === 'background') {
    $importmapHtml = '<script type="importmap">' . json_encode([
        'imports' => [
            'onnxruntime-web' => '/vendor/onnxruntime/ort.all.min.mjs',
            'onnxruntime-web/webgpu' => '/vendor/onnxruntime/ort.all.min.mjs',
        ],
    ], JSON_UNESCAPED_SLASHES) . '</script>';
}
?>
<section class="section tool-section">
    <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a> <span aria-hidden="true">/</span>
            <a href="/<?= $category['slug'] ?>"><?= htmlspecialchars($category['name'], ENT_QUOTES, 'UTF-8') ?></a> <span aria-hidden="true">/</span>
            <span aria-current="page"><?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?></span>
        </nav>

        <div class="tool-master-hero">
            <div class="tool-master-copy">
                <div class="tool-header tool-header-master" role="group" aria-label="<?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?> header">
                    <span class="tool-hero-icon" aria-hidden="true"><?= App\Helpers\Icons::svg($tool['icon']) ?></span>
                    <div class="tool-header-content">
                        <h1><?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?></h1>
                        <p class="tool-tagline"><?= htmlspecialchars($tool['short_description'], ENT_QUOTES, 'UTF-8') ?></p>
                    </div>
                    <div class="tool-header-actions">
                        <button type="button" class="fav-toggle" id="fav-toggle"
                                data-tool-id="<?= htmlspecialchars($tool['id'], ENT_QUOTES, 'UTF-8') ?>"
                                data-tool-name="<?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?>"
                                data-tool-category="<?= htmlspecialchars($tool['category'], ENT_QUOTES, 'UTF-8') ?>"
                                data-tool-slug="<?= htmlspecialchars($tool['slug'], ENT_QUOTES, 'UTF-8') ?>"
                                aria-pressed="false" aria-label="Save to favourites">
                            <span class="fav-star" aria-hidden="true">☆</span>
                            <span class="fav-label">Save</span>
                        </button>
                    </div>
                </div>
                <div class="tool-master-trust" aria-label="Privacy and performance">
                    <span><i aria-hidden="true"></i> Runs on your device</span>
                    <span><i aria-hidden="true"></i> No file uploads</span>
                </div>
                <a class="btn btn-primary tool-master-action" href="#workspace"><?= htmlspecialchars($masterAction, ENT_QUOTES, 'UTF-8') ?></a>
            </div>
        </div>

        <div class="tool-layout">
            <div class="tool-workspace" id="workspace"
                 data-tool-id="<?= htmlspecialchars($tool['id'], ENT_QUOTES, 'UTF-8') ?>"
                 data-engine="<?= htmlspecialchars($engine, ENT_QUOTES, 'UTF-8') ?>"
                 data-category="<?= htmlspecialchars($tool['category'], ENT_QUOTES, 'UTF-8') ?>"
                 data-batch="<?= $tool['batch_support'] ? '1' : '0' ?>">

                <div class="ws-intro">
                    <p><?= htmlspecialchars($tool['full_description'], ENT_QUOTES, 'UTF-8') ?></p>
                    <p class="formats-line">
                        <strong>Input:</strong> <?= htmlspecialchars(implode(', ', array_map('strtoupper', $tool['input_formats'] ?: ['—'])), ENT_QUOTES, 'UTF-8') ?>
                        &nbsp;&middot;&nbsp;
                        <strong>Output:</strong> <?= htmlspecialchars(implode(', ', array_map('strtoupper', $tool['output_formats'] ?: ['—'])), ENT_QUOTES, 'UTF-8') ?>
                        <?php if ($tool['batch_support']): ?>&nbsp;&middot;&nbsp;<strong>Batch:</strong> Yes<?php endif; ?>
                    </p>
                </div>

                <!-- Upload state -->
                <div class="ws-state ws-upload" id="ws-upload">
                    <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Upload files">
                        <input type="file" id="file-input" class="visually-hidden" multiple
                               aria-label="Select files for <?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?>"
                               accept="<?= htmlspecialchars(implode(',', $acceptFormats), ENT_QUOTES, 'UTF-8') ?>">
                        <span class="dropzone-icon" aria-hidden="true">⬆</span>
                        <p class="dropzone-title">Drop files here or click to browse</p>
                        <p class="dropzone-hint">
                            <?php if (!empty($tool['input_formats'])): ?>
                                Accepts: <?= htmlspecialchars(strtoupper(implode(', ', $tool['input_formats'])), ENT_QUOTES, 'UTF-8') ?>
                            <?php else: ?>
                                No file needed for this tool
                            <?php endif; ?>
                            <?php if ($tool['batch_support']): ?> · Multiple files supported<?php endif; ?>
                        </p>
                    </div>
                </div>

                <!-- Active state -->
                <div class="ws-state ws-active" id="ws-active" hidden>
                    <div class="file-queue" id="file-queue" aria-live="polite"></div>

                    <div class="settings-panel" id="settings-panel">
                        <!-- engine-specific controls injected here -->
                    </div>

                    <div class="ws-actions">
                        <button class="btn btn-primary" id="process-btn" type="button">Process</button>
                        <button class="btn btn-ghost" id="reset-btn" type="button">Reset</button>
                    </div>

                    <div class="progress" id="progress" hidden>
                        <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="progress-fill"></span></div>
                        <p class="progress-label" id="progress-label" role="status" aria-live="polite">Working…</p>
                    </div>

                    <div class="result" id="result" hidden role="status" aria-live="polite">
                        <div class="result-icon" aria-hidden="true">✓</div>
                        <p class="result-msg" id="result-msg"></p>
                        <a class="btn btn-primary" id="download-btn" download>Download</a>
                    </div>

                    <p class="ws-error" id="ws-error" hidden role="alert"></p>
                </div>
            </div>

            <aside class="tool-side">
                <div class="side-card">
                    <h3>How it works</h3>
                    <p><?= htmlspecialchars($tool['instructions'], ENT_QUOTES, 'UTF-8') ?></p>
                </div>
                <div class="side-card">
                    <h3>Privacy</h3>
                    <?php if (($tool['privacy_mode'] ?? 'client-side') === 'server-side-ip'): ?>
                        <p>This tool reads the <strong>connection information your browser presents to our server</strong> (your public IP address, IP version, and User-Agent). It uses no third-party geolocation service — <strong>no city, country, ISP, or location is looked up</strong>. We do not store this information.</p>
                    <?php elseif ($tool['processing_engine'] === 'background'): ?>
                        <p>This tool runs <strong>100% in your browser</strong>. Your files are never uploaded to a server. The AI background model is fetched once from its provider on first use; your image itself is processed locally.</p>
                    <?php elseif (!empty($tool['input_formats'])): ?>
                        <p>This tool runs <strong>100% in your browser</strong>. Your files are never uploaded to a server — everything is processed locally on your device.</p>
                    <?php else: ?>
                        <p>This tool runs <strong>100% in your browser</strong>. No file is uploaded and no data leaves your device — the result is generated locally and only when you click Process.</p>
                    <?php endif; ?>
                </div>
                <?php if (!empty($relatedTools)): ?>
                <div class="side-card">
                    <h3>Related tools</h3>
                    <ul class="related-list">
                        <?php foreach ($relatedTools as $rel): ?>
                            <li><a href="/<?= $rel['category'] ?>/<?= $rel['slug'] ?>"><?= htmlspecialchars($rel['name'], ENT_QUOTES, 'UTF-8') ?></a></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>
            </aside>
        </div>

        <div class="tool-info">
            <h2>About <?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?></h2>
            <?php
            $extra = \App\Registry\ToolContentRegistry::getExtraContent($tool['slug']);
            foreach ($extra as $section):
            ?>
                <h3><?= htmlspecialchars($section['title'], ENT_QUOTES, 'UTF-8') ?></h3>
                <?= $section['html'] ?>
            <?php endforeach; ?>
        </div>

        <?php if (!empty($tool['faq'])): ?>
        <div class="faq-block">
            <h2>Frequently asked questions</h2>
            <?php foreach ($tool['faq'] as $f): ?>
                <details class="faq-item">
                    <summary><?= htmlspecialchars($f['q'], ENT_QUOTES, 'UTF-8') ?></summary>
                    <p><?= htmlspecialchars($f['a'], ENT_QUOTES, 'UTF-8') ?></p>
                </details>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</section>

<?php
// Engine-specific vendor dependencies. Light libraries load eagerly (defer, in
// order); heavy engines (background, heic, ffmpeg) lazy-load their WASM inside
// the engine so the homepage and tool pages stay fast.
$vendor = [
    'pdf'      => ['/vendor/pdf-lib/pdf-lib.min.js', '/vendor/jszip.min.js'],
     'image'    => ['/vendor/jszip.min.js'],
     'heic'     => ['/vendor/jszip.min.js'],
    'utility'  => ['/vendor/qrcode/qrcode.min.js'],
    'qr-reader' => ['/vendor/jsqr/jsqr.min.js'],
    'pdf-secure' => ['/vendor/pdf-secure/pdf-lib.min.js'],
    'barcode'  => ['/vendor/jsbarcode/JsBarcode.all.min.js'],
     'barcode-reader' => ['/vendor/zxing/zxing-browser.js'],
     'ffmpeg'   => ['/vendor/jszip.min.js'],
    // ocr and upscaler lazy-load their heavy models inside the engine — no eager
    // script here, so the homepage and tool pages stay lightweight.
];
if (!empty($vendor[$engine])):
    foreach ($vendor[$engine] as $v):
?>
<script src="<?= htmlspecialchars($v, ENT_QUOTES, 'UTF-8') ?>" defer></script>
<?php
    endforeach;
endif;
if ($engine === 'ffmpeg'):
// ffmpeg.wasm 0.12 is an ES module: the engine imports @ffmpeg/ffmpeg (which
// spins up a module Worker) and the ESM core in /vendor/ffmpeg. It MUST load as
// a module, and it lazy-loads the 31MB wasm only on first use — never at load.
?>
<script type="module" src="/assets/js/engines/ffmpeg-engine.js"></script>
<?php elseif ($engine === 'background'):
// AI background removal: the engine is an ES module that lazy-imports the heavy
// @imgly ESM (and its model) only when the tool is actually run — never eager.
?>
<script type="module" src="/assets/js/engines/background-engine.js"></script>
<?php elseif ($engine === 'heic'):
// heic2any is a UMD bundle (sets window.heic2any); defer so it doesn't block
// first paint but still lets the engine call it on demand.
?>
<script src="/vendor/heic/heic2any.min.js" defer></script>
<script src="/assets/js/engines/heic-engine.js" defer></script>
<?php elseif ($engine !== 'utility'): ?>
<script src="/assets/js/engines/<?= htmlspecialchars($engine, ENT_QUOTES, 'UTF-8') ?>-engine.js" defer></script>
<?php else: ?>
<script src="/assets/js/engines/utility-engine.js" defer></script>
<?php endif; ?>
