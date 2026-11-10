(function () {
    'use strict';
    var modal = document.getElementById('search-modal');
    var input = document.getElementById('search-input');
    var resultsBox = document.getElementById('search-results');
    var backdrop = document.getElementById('search-backdrop');
    var openers = document.querySelectorAll('.search-trigger');
    var timer = null;
    var selected = -1;
    var currentResults = [];
    var lastOpener = null;
    var queryController = null;

    function isTyping() {
        var el = document.activeElement;
        return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    }

    function open() {
        if (!modal) return;
        modal.hidden = false;
        lastOpener = document.activeElement;
        if (input) { input.value = ''; currentResults = []; renderEmpty(); input.focus(); }
        selected = -1;
    }

    function close() {
        if (!modal) return;
        modal.hidden = true;
        if (lastOpener && typeof lastOpener.focus === 'function') lastOpener.focus();
    }

    function renderEmpty() {
        if (resultsBox) resultsBox.innerHTML = '<p class="search-empty">Type to find a tool.</p>';
    }

    function render(results) {
        if (!resultsBox) return;
        currentResults = results;
        selected = -1;
        if (!results.length) {
            resultsBox.innerHTML = '<p class="search-empty">No matching tools.</p>';
            return;
        }
        resultsBox.innerHTML = results.map(function (t, i) {
            return '<a role="option" aria-selected="false" id="search-result-' + i + '" class="search-result" data-i="' + i + '" href="' + t.url + '">' +
                '<span class="sr-name">' + escapeHtml(t.name) + '</span>' +
                '<span class="sr-cat">' + escapeHtml(t.category) + '</span>' +
                '<span class="sr-desc">' + escapeHtml(t.short_description) + '</span>' +
                '</a>';
        }).join('');
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function runQuery(q) {
        clearTimeout(timer);
        timer = setTimeout(function () {
            if (queryController) queryController.abort();
            queryController = window.AbortController ? new AbortController() : null;
            fetch('/api/search?q=' + encodeURIComponent(q), queryController ? { signal: queryController.signal } : undefined)
                .then(function (r) { return r.json(); })
                .then(function (data) { render(data.results || []); })
                .catch(function (err) { if (!err || err.name !== 'AbortError') renderEmpty(); });
        }, 160);
    }

    openers.forEach(function (b) {
        b.addEventListener('click', function (e) {
            e.preventDefault();
            open();
        });
    });

    if (backdrop) backdrop.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
        if (e.key === '/' && !isTyping()) {
            e.preventDefault();
            open();
        } else if (e.key === 'Escape' && modal && !modal.hidden) {
            close();
        } else if (e.key === 'ArrowDown' && modal && !modal.hidden && currentResults.length) {
            e.preventDefault();
            selected = Math.min(selected + 1, currentResults.length - 1);
            highlight();
        } else if (e.key === 'ArrowUp' && modal && !modal.hidden && currentResults.length) {
            e.preventDefault();
            selected = Math.max(selected - 1, 0);
            highlight();
        } else if (e.key === 'Enter' && modal && !modal.hidden && selected >= 0 && currentResults[selected]) {
            window.location.href = currentResults[selected].url;
        }
    });

    function highlight() {
        var nodes = resultsBox ? resultsBox.querySelectorAll('.search-result') : [];
        nodes.forEach(function (n, i) {
            var active = i === selected;
            n.classList.toggle('active', active);
            n.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        if (input && selected >= 0) input.setAttribute('aria-activedescendant', 'search-result-' + selected);
        else if (input) input.removeAttribute('aria-activedescendant');
    }

    if (input) {
        input.addEventListener('input', function () { runQuery(input.value.trim()); });
    }

    window.FileGenieSearch = { open: open, close: close };
})();
