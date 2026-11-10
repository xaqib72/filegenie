<?php
use App\Registry\CategoryRegistry;
use App\Registry\ToolRegistry;
$categories = CategoryRegistry::getAll();
$currentPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
?>
<div class="mega-menu" id="mega-menu" hidden>
    <div class="container mega-inner">
        <?php foreach ($categories as $cat): ?>
            <?php
            $catTools = ToolRegistry::byCategory($cat['slug']);
            $popular = array_slice($catTools, 0, 5);
            ?>
            <div class="mega-col">
                <a class="mega-head" href="/<?= $cat['slug'] ?>"<?= $currentPath === '/' . $cat['slug'] ? ' aria-current="page"' : '' ?>>
                    <span class="mega-icon" aria-hidden="true"><?= App\Helpers\Icons::svg($cat['icon']) ?></span>
                    <span class="mega-title"><?= htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8') ?></span>
                </a>
                <ul class="mega-list">
                    <?php foreach ($popular as $t): ?>
                        <li><a href="/<?= $cat['slug'] ?>/<?= $t['slug'] ?>"><?= htmlspecialchars($t['name'], ENT_QUOTES, 'UTF-8') ?></a></li>
                    <?php endforeach; ?>
                    <li class="mega-more"><a href="/<?= $cat['slug'] ?>">View all <?= count($catTools) ?> →</a></li>
                </ul>
            </div>
        <?php endforeach; ?>
    </div>
</div>
