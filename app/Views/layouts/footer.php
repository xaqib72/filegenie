<?php
use App\Registry\CategoryRegistry;
use App\Registry\ToolRegistry;
$categories = CategoryRegistry::getAll();
$toolCount = ToolRegistry::count();
$analyticsEnabled = !empty($GLOBALS['fg_config']['google_tag_id']);
// Hand-picked popular tools spanning categories — real, crawlable links.
$popularSlugs = [
    'compress-pdf', 'compress-image', 'compress-video', 'audio-converter',
    'case-converter', 'password-generator', 'qr-code-generator', 'qr-code-reader',
];
$popular = [];
foreach ($popularSlugs as $slug) {
    $t = ToolRegistry::get($slug);
    if ($t) {
        $popular[] = $t;
    }
}
?>
<footer class="site-footer">
    <div class="container footer-grid" data-reveal="rise">
        <div class="footer-brand">
            <a class="brand-name" href="/">File<b>Genie</b></a>
            <p><?= $toolCount ?> free, private file tools that run entirely in your browser. Your files never leave your device — no uploads and no accounts<?= $analyticsEnabled ? '; optional analytics only with your consent.' : '; no analytics tracking.' ?></p>
            <p class="footer-trust">
                <span class="footer-badge">100% client-side</span>
                <span class="footer-badge">No sign-up</span>
            </p>
        </div>

        <div class="footer-col">
            <h4>Popular Tools</h4>
            <ul>
                <?php foreach ($popular as $t): ?>
                    <li><a href="/<?= $t['category'] ?>/<?= $t['slug'] ?>"><?= htmlspecialchars($t['name'], ENT_QUOTES, 'UTF-8') ?></a></li>
                <?php endforeach; ?>
            </ul>
        </div>

        <div class="footer-col">
            <h4>Categories</h4>
            <ul>
                <?php foreach ($categories as $cat): ?>
                    <li><a href="/<?= $cat['slug'] ?>"><?= htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8') ?></a></li>
                <?php endforeach; ?>
                <li><a href="/all-tools" class="footer-strong">All <?= $toolCount ?> tools →</a></li>
            </ul>
        </div>

        <div class="footer-col">
            <h4>Company</h4>
            <ul>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
            </ul>
        </div>

        <div class="footer-col">
            <h4>Discover</h4>
            <ul>
                <li><a href="/all-tools">Browse all tools</a></li>
                <?php
                $firstCat = array_key_first($categories);
                ?>
                <li><a href="/<?= $firstCat ?>">Get started</a></li>
                <li><a href="/contact">Request a tool</a></li>
                <li><a href="/sitemap.xml">Sitemap</a></li>
            </ul>
        </div>
    </div>

    <div class="container footer-bottom">
        <p class="footer-copy">© <?= date('Y') ?> FileGenie. All tools run locally in your browser — your files are never uploaded or shared.</p>
        <p class="footer-legal">
            <?php if ($analyticsEnabled): ?><button class="privacy-settings-button" type="button" data-privacy-settings>Privacy settings</button><span aria-hidden="true">·</span><?php endif; ?>
            <a href="/privacy">Privacy</a>
            <span aria-hidden="true">·</span>
            <a href="/terms">Terms</a>
        </p>
    </div>
</footer>

<?php require __DIR__ . '/search_modal.php'; ?>
