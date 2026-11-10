(function () {
    'use strict';
    var STORAGE_KEY = 'filegenie_theme';

    function apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        var btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        document.dispatchEvent(new CustomEvent('filegenie:themechange', { detail: { theme: theme } }));
    }

    function current() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    // Initial: stored preference, otherwise the FileGenie midnight palette.
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored === 'light' || stored === 'dark') {
        apply(stored);
    } else {
        apply('dark');
    }

    var btn = document.getElementById('theme-toggle');
    if (btn) {
        apply(current());
        btn.addEventListener('click', function () {
            var next = current() === 'dark' ? 'light' : 'dark';
            apply(next);
            try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
        });
    }
})();
