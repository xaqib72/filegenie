(function () {
    'use strict';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cards = document.querySelectorAll('.tool-card, .category-card');
    if (!reduced && window.matchMedia('(pointer:fine)').matches) {
        cards.forEach(function (card) {
            card.addEventListener('pointermove', function (event) {
                var rect = card.getBoundingClientRect();
                var x = (event.clientX - rect.left) / rect.width - .5;
                var y = (event.clientY - rect.top) / rect.height - .5;
                card.style.setProperty('--card-rx', (y * -3).toFixed(2) + 'deg');
                card.style.setProperty('--card-ry', (x * 4).toFixed(2) + 'deg');
                card.style.transform = 'translateY(-4px) perspective(700px) rotateX(var(--card-rx)) rotateY(var(--card-ry))';
            });
            card.addEventListener('pointerleave', function () { card.style.removeProperty('transform'); });
        });
    }
}());
