<?php
/** @var array $category */
/** @var array $tools */
$composition = \App\Registry\MotionRegistry::categoryComposition($category['slug']);
?>
<section class="section">
    <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a> <span aria-hidden="true">/</span>
            <span aria-current="page"><?= htmlspecialchars($category['name'], ENT_QUOTES, 'UTF-8') ?></span>
        </nav>
        <div class="page-head" data-reveal="rise">
            <h1><?= htmlspecialchars($category['name'], ENT_QUOTES, 'UTF-8') ?></h1>
            <p class="page-sub"><?= htmlspecialchars($category['description'], ENT_QUOTES, 'UTF-8') ?></p>
        </div>

        <div class="category-intro" data-reveal="rise">
            <p>All <?= htmlspecialchars($category['name'], ENT_QUOTES, 'UTF-8') ?> run entirely in your browser. No uploads, no server processing — your files stay on your device. Choose a tool below to get started.</p>
        </div>

        <div class="category-scene m-stage" data-composition="<?= htmlspecialchars($composition, ENT_QUOTES, 'UTF-8') ?>" aria-hidden="true"></div>

        <div class="tool-grid m-stagger">
            <?php foreach ($tools as $tool): ?>
                <a class="tool-card" href="/<?= $tool['category'] ?>/<?= $tool['slug'] ?>" data-reveal="rise">
                    <span class="tool-icon"><?= App\Helpers\Icons::svg($tool['icon']) ?></span>
                    <span class="tool-name"><?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?></span>
                    <span class="tool-desc"><?= htmlspecialchars($tool['short_description'], ENT_QUOTES, 'UTF-8') ?></span>
                </a>
            <?php endforeach; ?>
        </div>

        <?php if (!empty($category['faqs'])): ?>
        <div class="faq-block">
            <h2>Frequently asked questions</h2>
            <?php foreach ($category['faqs'] as $f): ?>
                <details class="faq-item">
                    <summary><?= htmlspecialchars($f['q'], ENT_QUOTES, 'UTF-8') ?></summary>
                    <p><?= htmlspecialchars($f['a'], ENT_QUOTES, 'UTF-8') ?></p>
                </details>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</section>
