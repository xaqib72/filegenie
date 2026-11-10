<?php
$searchCount = \App\Registry\ToolRegistry::count();
?>
<div class="search-modal" id="search-modal" hidden role="dialog" aria-modal="true" aria-labelledby="search-title">
    <div class="search-backdrop" id="search-backdrop"></div>
    <div class="search-panel">
        <div class="search-field">
            <h2 id="search-title" class="visually-hidden">Search FileGenie tools</h2>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM5 10a5 5 0 1110 0 5 5 0 01-10 0z"/></svg>
            <input type="text" id="search-input" placeholder="Search <?= $searchCount ?> tools…" autocomplete="off" aria-label="Search tools">
            <kbd id="search-esc">Esc</kbd>
        </div>
        <div class="search-results" id="search-results" role="listbox" aria-live="polite">
            <p class="search-empty">Type to find a tool.</p>
        </div>
    </div>
</div>
