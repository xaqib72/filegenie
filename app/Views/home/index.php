<?php
/** @var array $categories */
/** @var array $popularTools */
/** @var array $allTools */
$toolCount = count($allTools);
?>
<section class="fg-hero">
    <div class="container fg-hero-inner">
        <div class="fg-hero-copy">
            <span class="badge">A private toolkit for the open web</span>
            <h1>Make every file<br><em>work harder.</em></h1>
                <p class="hero-sub">Explore <?= $toolCount ?> free online tools for PDF, image, video, audio and text. Transform files right in your browser, with no upload to our servers.</p>
            <div class="hero-cta">
                <a class="btn btn-primary" href="/all-tools">Browse all tools</a>
                <button class="btn btn-ghost search-trigger">Search a tool</button>
            </div>
            <ul class="hero-stats">
                <li><strong><?= $toolCount ?></strong><span>Tools</span></li>
                <li><strong><?= count($categories) ?></strong><span>Categories</span></li>
                <li><strong>100%</strong><span>On-device</span></li>
            </ul>
        </div>
        <div class="fg3d-stage fg3d-home" data-fg-3d-scene="home" aria-hidden="true">
            <span class="fg3d-scene-kicker">Live transformation field</span>
            <div class="fg3d-fallback">
                <div class="fg3d-fallback-core">FILEGENIE<small>TRANSFORMATION CORE</small></div>
                <span class="fg3d-fallback-file" data-format="PDF">PDF</span>
                <span class="fg3d-fallback-file" data-format="JPG">JPG</span>
                <span class="fg3d-fallback-file" data-format="MP4">MP4</span>
                <span class="fg3d-fallback-file" data-format="MP3">MP3</span>
                <span class="fg3d-fallback-file" data-format="TXT">TXT</span>
                <span class="fg3d-fallback-file" data-format="QR">QR</span>
            </div>
            <div class="fg3d-canvas"></div>
            <span class="fg3d-scene-footer">6 file families · on device · no cloud</span>
        </div>
    </div>
</section>

<div class="format-ribbon" aria-label="Supported file formats">
    <div class="format-ribbon-track" aria-hidden="true">
        <span>PDF <i>✳</i></span><span>IMAGE <i>✳</i></span><span>VIDEO <i>✳</i></span><span>AUDIO <i>✳</i></span><span>TEXT <i>✳</i></span><span>UTILITY <i>✳</i></span>
        <span>PDF <i>✳</i></span><span>IMAGE <i>✳</i></span><span>VIDEO <i>✳</i></span><span>AUDIO <i>✳</i></span><span>TEXT <i>✳</i></span><span>UTILITY <i>✳</i></span>
    </div>
</div>

<section class="fg-story" data-fg3d-scroll>
    <div class="container fg-story-grid">
        <div class="fg-story-copy">
            <article class="fg-story-step is-active" data-story-step="0">
                <span>01 · Many formats</span>
                <h2>One spatial workspace for every kind of file.</h2>
                <p>Documents, images, video, audio, text, and utility formats share one coherent transformation system.</p>
            </article>
            <article class="fg-story-step" data-story-step="1">
                <span>02 · Private by architecture</span>
                <h2>Your file enters the browser—and never leaves it.</h2>
                <p>Processing stays inside your device. No cloud detour, no upload queue, no hidden copy.</p>
            </article>
            <article class="fg-story-step" data-story-step="2">
                <span>03 · A clean three-step flow</span>
                <h2>Choose. Process. Download.</h2>
                <p>The interface stays quiet while the right local engine does the work behind the scene.</p>
            </article>
        </div>
        <div class="fg-story-visual">
            <div class="fg3d-stage fg3d-story-stage" data-fg-3d-scene="home" data-fg-3d-variant="story" aria-hidden="true">
                <span class="fg3d-scene-kicker">Local processing architecture</span>
                <div class="fg3d-fallback">
                    <div class="fg3d-fallback-core">ON DEVICE<small>NOTHING LEAVES</small></div>
                    <span class="fg3d-fallback-file" data-format="PDF">PDF</span>
                    <span class="fg3d-fallback-file" data-format="JPG">JPG</span>
                    <span class="fg3d-fallback-file" data-format="MP4">MP4</span>
                    <span class="fg3d-fallback-file" data-format="MP3">MP3</span>
                    <span class="fg3d-fallback-file" data-format="TXT">TXT</span>
                    <span class="fg3d-fallback-file" data-format="QR">QR</span>
                </div>
                <div class="fg3d-canvas"></div>
                <span class="fg3d-scene-footer">Upload 0% · device 100%</span>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-head" data-reveal="rise">
            <h2>Popular tools</h2>
            <a class="link-more" href="/all-tools">See all <?= $toolCount ?> →</a>
        </div>
        <div class="tool-grid m-stagger">
            <?php foreach ($popularTools as $tool): ?>
                <a class="tool-card" href="/<?= $tool['category'] ?>/<?= $tool['slug'] ?>" data-reveal="rise">
                    <span class="tool-icon"><?= App\Helpers\Icons::svg($tool['icon']) ?></span>
                    <span class="tool-name"><?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?></span>
                    <span class="tool-desc"><?= htmlspecialchars($tool['short_description'], ENT_QUOTES, 'UTF-8') ?></span>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section section-alt">
    <div class="container">
        <div class="section-head" data-reveal="rise">
            <h2>Browse by category</h2>
        </div>
        <div class="category-grid m-stagger">
            <?php foreach ($categories as $cat): ?>
                <a class="category-card" href="/<?= $cat['slug'] ?>" data-reveal="rise">
                    <span class="category-icon"><?= App\Helpers\Icons::svg($cat['icon']) ?></span>
                    <h3><?= htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8') ?></h3>
                    <p><?= htmlspecialchars($cat['short_description'], ENT_QUOTES, 'UTF-8') ?></p>
                    <span class="category-count">
                        <?php
                        $slug = $cat['slug'];
                        $count = 0;
                        foreach ($allTools as $t) { if ($t['category'] === $slug) $count++; }
                        echo htmlspecialchars((string)$count, ENT_QUOTES, 'UTF-8') . ' tools';
                        ?>
                    </span>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section">
    <div class="container privacy-band m-stagger">
        <div class="privacy-item" data-reveal="rise"><span class="privacy-ic" aria-hidden="true">🔒</span><div><h3>Private</h3><p>Your files are processed on your device and never uploaded.</p></div></div>
        <div class="privacy-item" data-reveal="rise"><span class="privacy-ic" aria-hidden="true">⚡</span><div><h3>Fast</h3><p>No server round-trips. Results appear in seconds.</p></div></div>
        <div class="privacy-item" data-reveal="rise"><span class="privacy-ic" aria-hidden="true">🆓</span><div><h3>Free</h3><p>Every tool is free to use, with no account required.</p></div></div>
    </div>
</section>
