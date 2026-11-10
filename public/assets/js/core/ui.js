(function () {
    'use strict';

    // ---- Mega menu ----
    var trigger = document.getElementById('mega-trigger');
    var menu = document.getElementById('mega-menu');
    if (trigger && menu) {
        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var willOpen = menu.hidden;
            menu.hidden = !willOpen;
            trigger.setAttribute('aria-expanded', String(willOpen));
        });
        document.addEventListener('click', function (e) {
            if (!menu.hidden && !menu.contains(e.target) && e.target !== trigger) {
                menu.hidden = true;
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !menu.hidden) {
                menu.hidden = true;
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ---- Mobile nav ----
    var burger = document.getElementById('nav-burger');
    var mobile = document.getElementById('mobile-nav');
    if (burger && mobile) {
        burger.addEventListener('click', function () {
            var willOpen = mobile.hidden;
            mobile.hidden = !willOpen;
            burger.setAttribute('aria-expanded', String(willOpen));
            burger.setAttribute('aria-label', willOpen ? 'Close menu' : 'Open menu');
        });
    }

    // ---- All-tools category filter + search ----
    var chips = document.querySelectorAll('#tool-filter .chip');
    var blocks = document.querySelectorAll('.category-block');
    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            chips.forEach(function (c) { c.classList.remove('is-active'); });
            chip.classList.add('is-active');
            var filter = chip.dataset.filter;
            blocks.forEach(function (b) {
                b.hidden = !(filter === 'all' || b.dataset.category === filter);
            });
        });
    });

    var listSearch = document.getElementById('tool-list-search');
    if (listSearch) {
        listSearch.addEventListener('input', function () {
            var q = listSearch.value.toLowerCase().trim();
            document.querySelectorAll('#tools-index .tool-card, .category-block .tool-card').forEach(function (card) {
                var name = card.dataset.name || '';
                card.style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';
            });
        });
    }
})();
