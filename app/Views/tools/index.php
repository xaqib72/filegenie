<?php
/** @var array $categories */
/** @var array $allTools */
$byCat = [];
foreach ($allTools as $t) {
    $byCat[$t['category']][] = $t;
}
$toolCount = count($allTools);
?>
<section class="section">
    <div class="container">
        <div class="page-head">
            <h1>All <?= $toolCount ?> Free Online File Tools</h1>
            <p class="page-sub">Every FileGenie tool runs entirely in your browser. No uploads, no server processing. Filter by category or search the list.</p>
            <div class="tool-filter" id="tool-filter">
                <button class="chip is-active" data-filter="all" type="button">All</button>
                <?php foreach ($categories as $cat): ?>
                    <button class="chip" data-filter="<?= $cat['slug'] ?>" type="button"><?= htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8') ?></button>
                <?php endforeach; ?>
            </div>
            <input type="text" id="tool-list-search" class="tool-list-search" placeholder="Filter tools…" aria-label="Filter tools by name">
        </div>

        <?php foreach ($categories as $cat): ?>
            <div class="category-block" data-category="<?= $cat['slug'] ?>">
                <h2 class="category-block-title"><?= htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8') ?></h2>
                <div class="tool-grid">
                    <?php foreach (($byCat[$cat['slug']] ?? []) as $tool): ?>
                        <a class="tool-card" data-name="<?= htmlspecialchars(strtolower($tool['name']), ENT_QUOTES, 'UTF-8') ?>" href="/<?= $cat['slug'] ?>/<?= $tool['slug'] ?>">
                            <span class="tool-icon"><?= App\Helpers\Icons::svg($tool['icon']) ?></span>
                            <span class="tool-name"><?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?></span>
                            <span class="tool-desc"><?= htmlspecialchars($tool['short_description'], ENT_QUOTES, 'UTF-8') ?></span>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</section>
