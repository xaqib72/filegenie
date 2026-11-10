/**
 * FileGenie — Premium 3D Motion System (decorative enhancement layer).
 *
 * Responsibilities:
 *   - Mark the document motion-ready and apply a device performance tier
 *     (FULL / MEDIUM / LITE) + pointer capability class on <html>.
 *   - Build decorative 3D scenes for the homepage hero, category compositions,
 *     and individual tool pages from a central registry (MotionRegistry is
 *     echoed into window.FileGenieMotionMap by the server for free mapping).
 *   - Scroll-reveal entrance via IntersectionObserver (adds .is-revealed).
 *   - Cursor parallax on the hero stage (rAF-eased, pointer-only).
 *   - Pause offscreen animations to save CPU/GPU (IntersectionObserver).
 *   - Header compact-on-scroll; mega-menu column stagger.
 *
 * This file NEVER touches tool logic, engines, search, uploads, or processing.
 * All motion uses transform/opacity. Honours prefers-reduced-motion.
 */
(function () {
    'use strict';

    var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var FINE = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

    /* -----------------------------------------------------------------
       Small DOM helpers
       ----------------------------------------------------------------- */
    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html != null) n.innerHTML = html;
        return n;
    }
    function svgIcon(key) {
        // tiny inline glyphs used only inside decorative scenes
        var paths = {
            pdf:  '<path d="M6 2h8l4 4v14H6z" fill="currentColor"/><text x="9" y="17" font-size="6" fill="#fff" font-family="sans-serif">PDF</text>',
            img:  '<rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor"/><circle cx="9" cy="9" r="2" fill="#fff"/><path d="M5 18l5-5 4 4 3-3 3 3" stroke="#fff" stroke-width="1.4" fill="none"/>',
            mp4:  '<rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor"/><path d="M10 9l5 3-5 3z" fill="#fff"/>',
            mp3:  '<rect x="4" y="8" width="16" height="8" rx="4" fill="currentColor"/><circle cx="12" cy="12" r="2.4" fill="#fff"/>',
            txt:  '<rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#fff" stroke-width="1.4"/>',
            qr:   '<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/><rect x="7" y="7" width="4" height="4" fill="#fff"/><rect x="13" y="7" width="4" height="4" fill="#fff"/><rect x="7" y="13" width="4" height="4" fill="#fff"/>',
            zip:  '<path d="M7 2h7l4 4v16H7z" fill="currentColor"/><path d="M14 2v4h4" fill="none" stroke="#fff" stroke-width="1.2"/>',
            lock: '<rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/>',
            key:  '<circle cx="9" cy="9" r="4" fill="currentColor"/><path d="M12 12l8 8M17 17l2-2M14 14l2-2" stroke="currentColor" stroke-width="2"/>',
            hash: '<text x="4" y="17" font-size="11" font-family="monospace" fill="currentColor">#</text><rect x="6" y="5" width="12" height="2" fill="currentColor"/><rect x="6" y="17" width="12" height="2" fill="currentColor"/>',
            globe:'<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="#fff" stroke-width="1.2" fill="none"/>',
            play: '<path d="M9 7l9 5-9 5z" fill="currentColor"/>'
        };
        return '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">' + (paths[key] || paths.pdf) + '</svg>';
    }

    /* =================================================================
       MotionScenes — reusable declarative scene builders
       ================================================================= */
    var Scenes = {

        /* ---- Helpers ---- */
        card3D: function (label, iconKey, opts) {
            opts = opts || {};
            var c = el('div', 'm-card3d');
            c.innerHTML = '<span class="m-c3d-ic">' + svgIcon(iconKey) + '</span><span class="m-c3d-lb">' + label + '</span>';
            c.style.left = (opts.x != null ? opts.x : 50) + '%';
            c.style.top = (opts.y != null ? opts.y : 50) + '%';
            c.style.width = (opts.w || 72) + 'px';
            c.style.height = (opts.h || 88) + 'px';
            c.style.setProperty('--tz', (opts.tz != null ? opts.tz : 0) + 'px');
            c.style.setProperty('--rx', (opts.rx || 0) + 'deg');
            c.style.setProperty('--ry', (opts.ry || 0) + 'deg');
            c.style.setProperty('--cz', opts.cz || 'var(--brand)');
            c.style.setProperty('--cz2', opts.cz2 || 'var(--accent)');
            c.style.setProperty('--dur', (opts.dur || 7) + 's');
            c.style.setProperty('--delay', (opts.delay || 0) + 's');
            c.style.setProperty('--amp', (opts.amp != null ? opts.amp : -12) + 'px');
            c.style.transform = 'translate(-50%, -50%)';
            return c;
        },

        animEl: function (cls, html, inline) {
            var n = el('div', cls, html);
            if (inline) for (var k in inline) n.style.setProperty(k, inline[k]);
            return n;
        },

        /* =========================================================
           HERO — Large floating file cards with real 3D depth
           ========================================================= */
        hero: function (stage) {
            var layer = el('div', 'm-layer');
            layer.style.setProperty('--par', '0');

            var back = el('div', 'm-card-layer m-layer-back');
            var mid = el('div', 'm-card-layer m-layer-mid');
            var front = el('div', 'm-card-layer m-layer-front');

            [
                { l: 'PNG', k: 'img', x: 78, y: 64, w: 64, h: 76, tz: 0, rx: 5, ry: -8, dur: 9, delay: 2.0, cz: 'var(--emerald)', cz2: 'var(--cyan)' },
                { l: 'TXT', k: 'txt', x: 16, y: 74, w: 56, h: 70, tz: 10, rx: -7, ry: 12, dur: 10, delay: 3.2, cz: 'var(--cyan)', cz2: 'var(--emerald)' },
                { l: 'ZIP', k: 'zip', x: 86, y: 86, w: 54, h: 66, tz: 5, rx: 8, ry: -4, dur: 9.5, delay: 1.5, cz: 'var(--warning)', cz2: 'var(--accent)' }
            ].forEach(function (c) { back.appendChild(Scenes.card3D(c.l, c.k, c)); });

            [
                { l: 'MP3', k: 'mp3', x: 14, y: 28, w: 62, h: 78, tz: 60, rx: 6, ry: -10, dur: 8, delay: 0.8, cz: 'var(--accent)', cz2: 'var(--emerald)' },
                { l: 'MP4', k: 'mp4', x: 54, y: 76, w: 66, h: 82, tz: 50, rx: -5, ry: 6, dur: 8.5, delay: 1.8, cz: 'var(--accent)', cz2: 'var(--brand)' }
            ].forEach(function (c) { mid.appendChild(Scenes.card3D(c.l, c.k, c)); });

            [
                { l: 'PDF', k: 'pdf', x: 34, y: 34, w: 82, h: 100, tz: 110, rx: -8, ry: 10, dur: 6.5, delay: 0, cz: 'var(--brand)', cz2: 'var(--accent)' },
                { l: 'JPG', k: 'img', x: 72, y: 38, w: 76, h: 94, tz: 90, rx: 5, ry: -12, dur: 7, delay: 0.6, cz: 'var(--cyan)', cz2: 'var(--brand)' }
            ].forEach(function (c) { front.appendChild(Scenes.card3D(c.l, c.k, c)); });

            layer.appendChild(back);
            layer.appendChild(mid);
            layer.appendChild(front);
            stage.appendChild(layer);
        },

        /* =========================================================
           MERGE PDF — Three PDFs converge and stack
           ========================================================= */
        'merge-pdf': function (s) {
            var wrap = Scenes.animEl('m-merge-wrap');

            [
                { x: 22, ry: -6, tz: 20, delay: 0 },
                { x: 50, ry: 0, tz: 55, delay: 2.0 },
                { x: 78, ry: 6, tz: 20, delay: 4.0 }
            ].forEach(function (p) {
                var pg = Scenes.animEl('m-merge-pg', null, {
                    left: p.x + '%', top: '50%', '--tz': p.tz + 'px',
                    '--ry': p.ry + 'deg', '--dur': '10s', '--delay': p.delay + 's'
                });
                pg.innerHTML =
                    '<span class="m-pg-bar" style="--w:68%;--d:0s"></span>' +
                    '<span class="m-pg-bar" style="--w:48%;--d:.07s"></span>' +
                    '<span class="m-pg-bar" style="--w:58%;--d:.14s"></span>' +
                    '<span class="m-pg-bar" style="--w:35%;--d:.21s"></span>' +
                    '<span class="m-pg-badge">PDF</span>';
                wrap.appendChild(pg);
            });

            var chk = Scenes.animEl('m-merge-check', '<span class="m-merge-ck">&#10003;</span>', {
                left: '50%', top: '50%', '--dur': '10s', '--delay': '5.5s'
            });
            wrap.appendChild(chk);
            s.appendChild(wrap);
        },

        /* =========================================================
           BACKGROUND REMOVER — Image isolation
           ========================================================= */
        background: function (s) {
            var wrap = Scenes.animEl('m-bg-wrap');
            var checker = Scenes.animEl('m-bg-checker', null, { '--dur': '8s', '--delay': '0s' });
            var card = Scenes.animEl('m-bg-card', null, { '--dur': '8s', '--delay': '0s' });
            card.innerHTML =
                '<svg class="m-bg-icon" viewBox="0 0 24 24" aria-hidden="true">' +
                '<rect x="3" y="4" width="18" height="16" rx="2" fill="var(--c1,var(--brand))"/>' +
                '<circle cx="9" cy="9" r="2.5" fill="#fff"/>' +
                '<path d="M5 18l5-5 4 4 3-3 3 3" stroke="#fff" stroke-width="1.4" fill="none"/>' +
                '</svg>';
            var mask = Scenes.animEl('m-bg-mask', null, { '--dur': '8s', '--delay': '0s' });
            var brackets = Scenes.animEl('m-bg-brackets', null, { '--dur': '8s', '--delay': '3.5s' });
            wrap.appendChild(checker);
            wrap.appendChild(card);
            wrap.appendChild(mask);
            wrap.appendChild(brackets);
            s.appendChild(wrap);
        },

        /* =========================================================
           BARCODE SCAN — Premium scanner composition
           ========================================================= */
        'barcode-scan': function (s) {
            var wrap = Scenes.animEl('m-bc-wrap');
            var card = Scenes.animEl('m-bc-card', null, { '--dur': '9s', '--delay': '0s', '--ry': '5deg' });

            var bc = Scenes.animEl('m-bc-bars');
            [2,1,3,1,2,3,1,2,1,3,2,1,1,3,2,1,2,3].forEach(function (w, i) {
                var bar = el('span');
                bar.style.width = w + 'px';
                bar.style.setProperty('--d', (i * 0.055) + 's');
                bc.appendChild(bar);
            });
            card.appendChild(bc);

            var num = Scenes.animEl('m-bc-num', '590 12341 23457', { '--dur': '9s', '--delay': '0s' });
            card.appendChild(num);

            var corners = Scenes.animEl('m-bc-corners', null, { '--dur': '9s', '--delay': '0.6s' });
            var beam = Scenes.animEl('m-bc-beam', null, { '--dur': '9s', '--delay': '0s' });

            var result = Scenes.animEl('m-bc-result', null, { '--dur': '9s', '--delay': '5s' });
            result.innerHTML =
                '<span class="m-bc-res-type">EAN-13</span>' +
                '<span class="m-bc-res-val">590 12341 23457</span>' +
                '<span class="m-bc-res-ok">&#10003;</span>';

            wrap.appendChild(card);
            wrap.appendChild(corners);
            wrap.appendChild(beam);
            wrap.appendChild(result);
            s.appendChild(wrap);
        },

        /* =========================================================
           QR BUILDER — Controlled staged assembly
           ========================================================= */
        'qr-build': function (s) {
            var wrap = Scenes.animEl('m-qr-wrap');
            var card = Scenes.animEl('m-qr-card', null, { '--dur': '9s', '--delay': '0s', '--ry': '3deg' });

            var grid = Scenes.animEl('m-qr-grid', null, { '--dur': '9s', '--delay': '0s' });
            var pattern = [
                [1,1,1,1,1,1,1],
                [1,0,1,0,1,0,1],
                [1,1,1,1,1,1,1],
                [1,0,1,1,0,1,0],
                [0,1,0,1,0,1,1],
                [1,1,1,1,1,1,1],
                [1,0,1,0,1,0,1]
            ];
            for (var r = 0; r < 7; r++) {
                for (var c = 0; c < 7; c++) {
                    var cell = el('span', 'm-qr-cell');
                    if (pattern[r][c]) cell.classList.add('on');
                    cell.style.setProperty('--r', r);
                    cell.style.setProperty('--c', c);
                    cell.style.setProperty('--d', ((r * 0.07) + (c * 0.035)) + 's');
                    grid.appendChild(cell);
                }
            }
            card.appendChild(grid);

            var dl = Scenes.animEl('m-qr-dl', '<span>PNG</span>', { '--dur': '9s', '--delay': '5.5s' });
            wrap.appendChild(card);
            wrap.appendChild(dl);
            s.appendChild(wrap);
        },

        /* ---- Primitive helpers ---- */
        beam: function () { return Scenes.animEl('m-beam', null, { top: '14%' }); },
        wave: function (n) {
            var w = el('div', 'm-wave');
            n = n || 7;
            for (var i = 0; i < n; i++) {
                var bar = el('i');
                bar.style.setProperty('--i', i);
                bar.style.height = (30 + (i % 3) * 22) + '%';
                w.appendChild(bar);
            }
            return w;
        },
        shield: function () { return Scenes.animEl('m-shield', svgIcon('lock')); },
        lockEl: function () { return Scenes.animEl('m-lock', svgIcon('lock')); },
        globe: function () { return el('div', 'm-globe'); },
        checker: function () { return el('div', 'm-checker'); },
        subject: function () { return el('div', 'm-subject'); },

        /* =========================================================
           CATEGORY COMPOSITIONS — Clean floating 3D arrangements
           ========================================================= */
        'pdf-pages': function (s) {
            for (var i = 0; i < 3; i++) {
                s.appendChild(Scenes.animEl('m-pg3d', '<span class="m-pg3d-badge">PDF</span>', {
                    left: (28 + i * 16) + '%', top: (32 - i * 6) + '%',
                    '--tz': (i * 20) + 'px', '--ry': (i * 5 - 5) + 'deg',
                    '--dur': (7.5 + i * 0.8) + 's', '--delay': (i * 0.4) + 's'
                }));
            }
        },
        'photo-frames': function (s) {
            ['var(--brand)', 'var(--cyan)', 'var(--accent)', 'var(--emerald)'].forEach(function (c, i) {
                s.appendChild(Scenes.animEl('m-frame3d', null, {
                    left: (14 + i * 22) + '%', top: (26 + (i % 2) * 18) + '%',
                    '--cz': c, '--tz': (i * 16) + 'px', '--ry': (i * 5 - 7) + 'deg',
                    '--dur': (7 + i * 0.7) + 's', '--delay': (i * 0.35) + 's'
                }));
            });
        },
        'video-frames': function (s) {
            var vt = Scenes.animEl('m-vtile3d', null, { left: '32%', top: '22%', '--dur': '8s' });
            vt.appendChild(el('span', 'm-vt3d-play', svgIcon('play')));
            s.appendChild(vt);
            s.appendChild(Scenes.animEl('m-vbar3d', null, { left: '22%', top: '60%', '--dur': '8s' }));
        },
        'audio-cards': function (s) {
            ['var(--cyan)', 'var(--brand)', 'var(--accent)'].forEach(function (c, i) {
                var ac = Scenes.animEl('m-atile3d', null, {
                    left: (20 + i * 26) + '%', top: (28 + (i % 2) * 16) + '%',
                    '--cz': c, '--tz': (i * 18) + 'px', '--ry': (i * 5 - 5) + 'deg',
                    '--dur': (7 + i * 0.6) + 's', '--delay': (i * 0.35) + 's'
                });
                var wv = Scenes.wave(5);
                wv.style.left = '14%'; wv.style.top = '34%'; wv.style.width = '72%'; wv.style.height = '32%';
                ac.appendChild(wv);
                s.appendChild(ac);
            });
        },
        'type-layers': function (s) {
            for (var i = 0; i < 4; i++) {
                s.appendChild(Scenes.animEl('m-type3d', 'Aa', {
                    left: (26 + i * 14) + '%', top: (22 + i * 11) + '%',
                    '--tz': (i * 18) + 'px', '--ry': (i * 4 - 6) + 'deg',
                    '--dur': (7 + i * 0.5) + 's', '--delay': (i * 0.3) + 's',
                    '--sz': (1.6 - i * 0.1) + 'em'
                }));
            }
        },
        'utility-orbit': function (s) {
            var core = Scenes.animEl('m-core3d', '<span>' + svgIcon('key') + '</span>', { '--dur': '8s' });
            s.appendChild(core);
            ['qr', 'globe', 'hash', 'lock'].forEach(function (k, i) {
                s.appendChild(Scenes.animEl('m-sat3d', '<span>' + svgIcon(k) + '</span>', {
                    '--i': i, '--n': 4, '--cz': ['var(--brand)', 'var(--cyan)', 'var(--emerald)', 'var(--accent)'][i],
                    '--dur': (7 + i * 0.5) + 's', '--delay': (i * 0.3) + 's'
                }));
            });
        },

        /* =========================================================
           TOOL FAMILIES — Prototypes custom, others simplified
           ========================================================= */
        merge: function (s) { Scenes['merge-pdf'](s); },
        split: function (s) {
            [['1', 26], ['2', 50], ['3', 74]].forEach(function (p, i) {
                s.appendChild(Scenes.card3D(p[0], 'pdf', { x: p[1], y: 50, tz: 20 + i * 12, dur: 6, delay: (i * 0.4) + 's' }));
            });
        },
        compress: function (s) {
            var c = Scenes.card3D('', 'pdf', { x: 50, y: 50, w: 72, h: 56, tz: 30, dur: 6 });
            c.classList.add('m-c3d-shrink');
            s.appendChild(c);
        },
        convert: function (s, v) {
            var a = Scenes.card3D((v || 'A').split(' ')[0], 'file', { x: 30, y: 50, tz: 30, dur: 5 });
            var b = Scenes.card3D((v || 'B').split(' ').pop(), 'file', { x: 70, y: 50, tz: 30, dur: 5, delay: '0.4s' });
            s.appendChild(a); s.appendChild(b);
        },
        rotate: function (s) {
            var c = Scenes.card3D('', 'img', { x: 50, y: 50, w: 60, h: 48, tz: 30, dur: 5, cz: 'var(--cyan)', cz2: 'var(--brand)' });
            c.classList.add('m-c3d-spin');
            s.appendChild(c);
        },
        reorder: function (s) {
            [['1', 26], ['2', 50], ['3', 74]].forEach(function (p, i) {
                s.appendChild(Scenes.card3D(p[0], 'pdf', { x: p[1], y: 50, tz: 20 + i * 12, dur: 6.5, delay: (i * 0.3) + 's' }));
            });
        },
        delete: function (s) {
            s.appendChild(Scenes.card3D('', 'pdf', { x: 50, y: 50, w: 60, h: 48, tz: 30, dur: 5 }));
        },
        pagenum: function (s) {
            var p = Scenes.animEl('m-pg3d', '<span class="m-badge">1</span>', { left: '36%', top: '28%', '--tz': '40px', '--dur': '7s' });
            s.appendChild(p);
        },
        watermark: function (s) {
            var p = Scenes.animEl('m-pg3d', '<span class="m-wm-label">watermark</span>', { left: '32%', top: '24%', '--tz': '30px', '--dur': '7s' });
            s.appendChild(p);
        },
        extract: function (s) {
            s.appendChild(Scenes.animEl('m-pg3d', null, { left: '30%', top: '28%', '--tz': '20px', '--dur': '7s' }));
            s.appendChild(Scenes.animEl('m-pg3d m-peel3d', null, { left: '50%', top: '24%', '--tz': '50px', '--ry': '-12deg', '--dur': '7s' }));
        },
        protect: function (s) { s.appendChild(Scenes.shield()); },
        unlock: function (s) { s.appendChild(Scenes.lockEl()); },
        resize: function (s) {
            var c = Scenes.card3D('', 'img', { x: 50, y: 50, w: 56, h: 46, tz: 30, dur: 5, cz: 'var(--cyan)', cz2: 'var(--brand)' });
            c.classList.add('m-c3d-resize');
            s.appendChild(c);
        },
        crop: function (s) {
            var f = el('div', 'm-crop');
            ['tl','tr','bl','br'].forEach(function (p) { f.appendChild(el('span', 'm-crop-h ' + p)); });
            s.appendChild(f);
        },
        round: function (s) {
            var c = Scenes.card3D('', 'img', { x: 50, y: 50, w: 56, h: 56, tz: 30, dur: 5, cz: 'var(--cyan)', cz2: 'var(--brand)' });
            c.classList.add('m-c3d-round');
            s.appendChild(c);
        },
        strip: function (s) {
            for (var i = 0; i < 3; i++) {
                s.appendChild(Scenes.animEl('m-meta', null, { left: '22%', top: (34 + i * 16) + '%', width: '52%', '--dur': (4 + i) + 's', '--delay': (i * 0.3) + 's' }));
            }
        },
        ocr: function (s) {
            for (var i = 0; i < 3; i++) {
                s.appendChild(Scenes.animEl('m-textline', null, { left: '22%', top: (28 + i * 14) + '%', width: '56%', '--i': i }));
            }
            s.appendChild(Scenes.beam());
        },
        upscale: function (s) {
            var g = Scenes.animEl('m-mag', null, { left: '34%', top: '28%', '--dur': '7s' });
            g.innerHTML = '<span class="m-mag-ic">' + svgIcon('img') + '</span>';
            s.appendChild(g);
            s.appendChild(Scenes.animEl('m-zoom', '2x', { left: '64%', top: '28%' }));
        },
        textimage: function (s) {
            var c = Scenes.card3D('', 'img', { x: 50, y: 50, w: 60, h: 46, tz: 30, dur: 5, cz: 'var(--cyan)', cz2: 'var(--brand)' });
            c.innerHTML = '<span class="m-txt-over">T</span>';
            s.appendChild(c);
        },
        trim: function (s) {
            s.appendChild(Scenes.animEl('m-trimbar', null, { left: '16%', top: '46%', width: '68%', '--dur': '6s' }));
            s.appendChild(Scenes.animEl('m-scissor', '&#x2702;', { x: 50, y: 46 }));
        },
        mute: function (s) {
            s.appendChild(el('span', 'm-speaker', svgIcon('mp3')));
            s.appendChild(Scenes.animEl('m-x', '&#x2715;', { x: 62, y: 50 }));
        },
        speed: function (s) {
            var c = Scenes.card3D('1x', 'mp3', { x: 50, y: 50, w: 56, h: 46, tz: 30, dur: 5, cz: 'var(--accent)', cz2: 'var(--brand)' });
            c.classList.add('m-c3d-speed');
            s.appendChild(c);
        },
        mono: function (s) {
            s.appendChild(Scenes.animEl('m-mono-l', null, { left: '24%', top: '48%' }));
            s.appendChild(Scenes.animEl('m-mono-r', null, { left: '54%', top: '48%' }));
            s.appendChild(Scenes.animEl('m-arrow', '&#x2192;', { x: 50, y: 50 }));
        },
        volume: function (s) {
            for (var i = 0; i < 4; i++) {
                s.appendChild(Scenes.animEl('m-vol', null, { left: (28 + i * 12) + '%', top: '38%', height: (18 + i * 14) + '%', '--i': i }));
            }
        },
        color: function (s) {
            ['var(--brand)', 'var(--cyan)', 'var(--emerald)', 'var(--accent)', 'var(--warning)', 'var(--brand)'].forEach(function (c, i) {
                s.appendChild(Scenes.animEl('m-swatch', null, {
                    left: (14 + (i % 3) * 28) + '%', top: (24 + Math.floor(i / 3) * 32) + '%',
                    background: c, '--dur': (5 + i * 0.4) + 's', '--delay': (i * 0.2) + 's'
                }));
            });
        },
        base64: function (s) {
            s.appendChild(Scenes.animEl('m-code', 'Sgv...', { left: '16%', top: '40%' }));
            s.appendChild(Scenes.animEl('m-arrow', '&#x21C4;', { x: 50, y: 50 }));
            s.appendChild(Scenes.animEl('m-code', 'U2F...', { left: '56%', top: '40%' }));
        },
        hash: function (s) {
            s.appendChild(Scenes.animEl('m-code', 'file', { left: '18%', top: '40%' }));
            s.appendChild(Scenes.animEl('m-hash', '#a1b2', { left: '56%', top: '40%' }));
            s.appendChild(Scenes.animEl('m-arrow', '&#x2192;', { x: 50, y: 50 }));
        },
        'barcode-build': function (s) { Scenes['barcode-scan'](s); },
        font: function (s) {
            s.appendChild(Scenes.animEl('m-font m-serif', 'Aa', { left: '32%', top: '44%', '--dur': '7s' }));
            s.appendChild(Scenes.animEl('m-font m-script', 'Aa', { left: '58%', top: '44%', '--dur': '7s', '--delay': '0.4s' }));
        },
        text: function (s) {
            for (var i = 0; i < 3; i++) {
                s.appendChild(Scenes.animEl('m-textline', null, { left: '22%', top: (32 + i * 15) + '%', width: '56%', '--i': i }));
            }
        },
        ip: function (s) { s.appendChild(Scenes.globe()); },
        password: function (s) {
            var pw = Scenes.animEl('m-pw', null, { '--dur': '7s' });
            pw.innerHTML = '<span class="m-pw-chars">aB3$xK9</span><span class="m-pw-str">STRONG</span>';
            s.appendChild(pw);
        },
        floating: function (s) {
            s.appendChild(Scenes.card3D('', 'file', { x: 50, y: 50, tz: 30, dur: 6 }));
        }
    };

    /* =================================================================
       Injected scene CSS — one-off styles for scene primitives
       ================================================================= */
    var sceneCSS = [
        /* --- Hero: 3D file cards with depth layers --- */
        '.m-card3d{position:absolute;transform-style:preserve-3d;animation:mFloat var(--dur,7s) var(--ease-spring) infinite var(--delay,0s);will-change:transform;backface-visibility:hidden}',
        '.m-card3d::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,var(--cz,var(--brand)),var(--cz2,var(--accent)));opacity:.12;pointer-events:none}',
        '.m-c3d-ic{width:34%;height:34%;color:currentColor;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))}',
        '.m-c3d-lb{position:absolute;bottom:6px;left:0;right:0;text-align:center;font-weight:800;font-size:.62rem;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.4);letter-spacing:.03em}',
        '.m-card-layer{position:absolute;inset:0;transform-style:preserve-3d;pointer-events:none}',
        '.m-layer-back{--par:1}',
        '.m-layer-mid{--par:2}',
        '.m-layer-front{--par:3.2}',

        /* --- Hero card 3D composition (gradient bg + shadow + border) --- */
        '.m-card3d{background:linear-gradient(145deg,var(--cz,var(--brand)),var(--cz2,var(--accent)));border-radius:14px;box-shadow:0 1px 1px rgba(0,0,0,.18),0 12px 32px rgba(0,0,0,.2),0 0 0 1px color-mix(in srgb,var(--cz,var(--brand)) 35%,transparent);display:grid;place-items:center;color:#fff}',

        /* --- Hero float with perspective depth oscillation --- */
        '@keyframes mFloat{0%,100%{transform:translate(-50%,-50%) translateY(0) translateZ(var(--tz,0)) rotateX(var(--rx,0)) rotateY(var(--ry,0))}50%{transform:translate(-50%,-50%) translateY(var(--amp,-12px)) translateZ(calc(var(--tz,0) + 16px)) rotateX(calc(var(--rx,0) + 1deg)) rotateY(calc(var(--ry,0) - 1deg))}}',

        /* --- Merge PDF scene --- */
        '.m-merge-wrap{position:absolute;inset:0;transform-style:preserve-3d}',
        '.m-merge-pg{position:absolute;transform:translate(-50%,-50%) translateZ(var(--tz,0)) rotateY(var(--ry,0));width:28%;height:62%;background:linear-gradient(160deg,#fff,var(--surface));border-radius:8px;border:1px solid var(--border);box-shadow:var(--shadow-md);animation:mMerge var(--dur,10s) ease-in-out infinite var(--delay,0s);display:flex;flex-direction:column;gap:6px;padding:10px 10px 8px}',
        '.m-pg-bar{height:7px;border-radius:5px;background:var(--border);width:var(--w,50%);animation:mPgBar .9s ease-out backwards;animation-delay:calc(var(--d,0) + 1.5s)}',
        '.m-pg-badge{position:absolute;top:5px;right:6px;background:var(--brand);color:#fff;font-size:.5rem;padding:1px 5px;border-radius:5px;font-weight:800}',
        '@keyframes mMerge{0%,100%{transform:translate(-50%,-50%) translateZ(var(--tz,0)) rotateY(var(--ry,0))}35%{transform:translate(-50%,-50%) translateZ(60px) rotateY(0deg)}50%{transform:translate(-50%,-50%) translateZ(70px) rotateY(0deg)}65%{transform:translate(-50%,-50%) translateZ(60px) rotateY(0deg)}}',
        '@keyframes mPgBar{from{transform:scaleX(0);opacity:0}to{transform:scaleX(1);opacity:1}}',
        '.m-merge-check{position:absolute;left:50%;top:50%;width:32px;height:32px;border-radius:50%;background:var(--emerald);display:grid;place-items:center;opacity:0;transform:translate(-50%,-50%) scale(.3);animation:mMergeCheck 10s ease-in-out infinite 5.5s}',
        '.m-merge-ck{color:#fff;font-size:1rem;font-weight:900;animation:mCheck .5s var(--ease-snap) backwards;animation-delay:5.5s}',

        /* --- Background remover scene --- */
        '.m-bg-wrap{position:absolute;inset:0;transform-style:preserve-3d}',
        '.m-bg-checker{position:absolute;inset:16%;border-radius:14px;background-image:linear-gradient(45deg,#c9ccd6 25%,transparent 25%),linear-gradient(-45deg,#c9ccd6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#c9ccd6 75%),linear-gradient(-45deg,transparent 75%,#c9ccd6 75%);background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0;opacity:.85;animation:mBgIn 8s ease-in-out infinite}',
        '.m-bg-card{position:absolute;inset:18%;border-radius:14px;background:linear-gradient(145deg,var(--brand),var(--accent));box-shadow:0 4px 20px rgba(0,0,0,.2);display:grid;place-items:center;z-index:2;animation:mBgCard 8s ease-in-out infinite}',
        '.m-bg-icon{width:42%;height:42%;color:#fff;filter:drop-shadow(0 1px 3px rgba(0,0,0,.3))}',
        '.m-bg-mask{position:absolute;inset:18%;border-radius:14px;background:linear-gradient(145deg,var(--brand),var(--accent));z-index:1;transform-origin:left center;animation:mBgMask 8s ease-in-out infinite}',
        '.m-bg-brackets{position:absolute;inset:16%;border-radius:14px;z-index:3;pointer-events:none;opacity:0;animation:mBgBrackets 8s ease-in-out infinite}',
        '.m-bg-brackets::before,.m-bg-brackets::after{content:"";position:absolute;width:18px;height:18px;border-color:var(--emerald);border-style:solid;border-width:0}',
        '.m-bg-brackets::before{top:-2px;left:-2px;border-top-width:3px;border-left-width:3px;border-radius:4px 0 0 0}',
        '.m-bg-brackets::after{bottom:-2px;right:-2px;border-bottom-width:3px;border-right-width:3px;border-radius:0 0 4px 0}',
        '@keyframes mBgIn{0%,100%{opacity:.85}50%{opacity:1}}',
        '@keyframes mBgCard{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}',
        '@keyframes mBgMask{0%,40%{transform:scaleX(1);transform-origin:left center}50%,90%{transform:scaleX(0);transform-origin:left center}100%{transform:scaleX(1);transform-origin:right center}}',
        '@keyframes mBgBrackets{0%,35%{opacity:0}40%,85%{opacity:1}100%{opacity:0}}',

        /* --- Barcode scan scene --- */
        '.m-bc-wrap{position:absolute;inset:0;transform-style:preserve-3d}',
        '.m-bc-card{position:absolute;left:50%;top:50%;width:52%;height:48%;background:var(--surface);border-radius:10px;border:1px solid var(--border);box-shadow:var(--shadow-md);transform:translate(-50%,-50%) rotateY(var(--ry,5deg));animation:mFloat 9s var(--ease-spring) infinite;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px 14px}',
        '.m-bc-bars{display:flex;align-items:flex-end;gap:2px;height:55%;width:100%}',
        '.m-bc-bars span{display:block;background:var(--text);border-radius:1px;animation:mBcBar .9s ease-out backwards;animation-delay:calc(var(--d,0) + .3s)}',
        '@keyframes mBcBar{from{transform:scaleY(0)}to{transform:scaleY(1)}}',
        '.m-bc-num{font-family:monospace;font-size:.72rem;font-weight:700;color:var(--text);letter-spacing:.06em;text-align:center}',
        '.m-bc-corners{position:absolute;inset:18%;pointer-events:none;opacity:0;animation:mBcCorners 9s ease-in-out infinite}',
        '@keyframes mBcCorners{0%,15%{opacity:0}20%,80%{opacity:1}100%{opacity:0}}',
        '.m-bc-corners::before,.m-bc-corners::after{content:"";position:absolute;width:22px;height:22px;border-color:var(--cyan);border-style:solid;border-width:0}',
        '.m-bc-corners::before{top:0;left:0;border-top-width:2.5px;border-left-width:2.5px;border-radius:3px 0 0 0}',
        '.m-bc-corners::after{bottom:0;right:0;border-bottom-width:2.5px;border-right-width:2.5px;border-radius:0 0 3px 0}',
        '.m-bc-beam{position:absolute;left:12%;right:12%;height:3px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);box-shadow:0 0 16px 2px color-mix(in srgb,var(--cyan) 55%,transparent);border-radius:4px;animation:mScan 3.4s var(--ease-soft) infinite;top:14%}',
        '.m-bc-result{position:absolute;left:50%;bottom:12%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:5px 10px;display:flex;align-items:center;gap:8px;box-shadow:var(--shadow-md);opacity:0;animation:mBcResult 9s ease-in-out infinite 5s;white-space:nowrap}',
        '.m-bc-res-type{font-size:.52rem;color:var(--text);opacity:.7;font-weight:600;text-transform:uppercase}',
        '.m-bc-res-val{font-family:monospace;font-size:.68rem;font-weight:800;color:var(--brand)}',
        '.m-bc-res-ok{width:18px;height:18px;border-radius:50%;background:var(--emerald);color:#fff;display:grid;place-items:center;font-size:.6rem;font-weight:900}',
        '@keyframes mBcResult{0%,50%{opacity:0;transform:translateX(-50%) translateY(6px)}55%,85%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-6px)}}',

        /* --- QR builder scene --- */
        '.m-qr-wrap{position:absolute;inset:0;transform-style:preserve-3d}',
        '.m-qr-card{position:absolute;left:50%;top:50%;width:54%;height:54%;background:#fff;border-radius:12px;box-shadow:var(--shadow-lg),0 0 0 1px var(--border);transform:translate(-50%,-50%) rotateY(var(--ry,3deg));animation:mFloat 9s var(--ease-spring) infinite;display:grid;place-items:center;padding:10px}',
        '.m-qr-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:3px;width:100%;aspect-ratio:1}',
        '.m-qr-cell{background:var(--text);border-radius:2px;opacity:0;animation:mQrPop .5s var(--ease-snap) forwards;animation-delay:calc(var(--d,0) + .2s)}',
        '.m-qr-cell.on{background:var(--text)}',
        '@keyframes mQrPop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}',
        '.m-qr-dl{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);background:linear-gradient(135deg,var(--brand),var(--accent));color:#fff;padding:4px 12px;border-radius:8px;font-size:.68rem;font-weight:800;box-shadow:var(--shadow-md);opacity:0;animation:mQrDl 9s ease-in-out infinite 5.5s;white-space:nowrap}',
        '@keyframes mQrDl{0%,50%{opacity:0;transform:translateX(-50%) translateY(8px)}55%,85%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-6px)}}',

        /* --- Category compositions (simplified 3D card) --- */
        '.m-pg3d{position:absolute;width:22%;height:30%;background:linear-gradient(160deg,#fff,var(--surface));border-radius:8px;border:1px solid var(--border);box-shadow:var(--shadow-md);animation:mFloat var(--dur,7s) var(--ease-spring) infinite var(--delay,0s);transform:translate(-50%,-50%) translateZ(var(--tz,0)) rotateY(var(--ry,0));backface-visibility:hidden}',
        '.m-pg3d-badge{position:absolute;top:5px;right:5px;background:var(--brand);color:#fff;font-size:.5rem;padding:1px 5px;border-radius:5px;font-weight:800}',
        '.m-frame3d{position:absolute;width:18%;height:24%;border-radius:8px;border:3px solid #fff;background:linear-gradient(160deg,var(--cz,var(--brand)),transparent);box-shadow:var(--shadow-md);animation:mFloat var(--dur,7s) var(--ease-spring) infinite var(--delay,0s);transform:translate(-50%,-50%) translateZ(var(--tz,0)) rotateY(var(--ry,0));backface-visibility:hidden}',
        '.m-vtile3d{position:absolute;width:34%;height:34%;border-radius:14px;background:linear-gradient(160deg,var(--brand),var(--accent));display:grid;place-items:center;box-shadow:var(--shadow-lg);animation:mFloat 8s var(--ease-spring) infinite;backface-visibility:hidden}',
        '.m-vt3d-play{width:34%;height:34%;color:#fff}',
        '.m-vbar3d{position:absolute;height:8px;border-radius:6px;background:var(--border);overflow:hidden;animation:mSlideFake 2.6s ease-in-out infinite}',
        '.m-vbar3d::after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(90deg,var(--cyan),var(--brand));animation:mSlide 2.6s ease-in-out infinite}',
        '.m-atile3d{position:absolute;width:20%;height:30%;border-radius:12px;background:linear-gradient(160deg,var(--cz,var(--brand)),transparent);box-shadow:var(--shadow-md);animation:mFloat var(--dur,7s) var(--ease-spring) infinite var(--delay,0s);transform:translate(-50%,-50%) translateZ(var(--tz,0)) rotateY(var(--ry,0));display:grid;place-items:center;backface-visibility:hidden}',
        '.m-type3d{position:absolute;font-weight:900;color:var(--brand);background:var(--surface);border:1px solid var(--border);border-radius:10px;width:1.6em;height:1.6em;display:grid;place-items:center;box-shadow:var(--shadow-md);animation:mFloat var(--dur,7s) var(--ease-spring) infinite var(--delay,0s);transform:translate(-50%,-50%) translateZ(var(--tz,0)) rotateY(var(--ry,0));font-size:var(--sz,1.6em);backface-visibility:hidden}',
        '.m-core3d{position:absolute;left:50%;top:50%;width:18%;height:18%;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--accent));display:grid;place-items:center;box-shadow:var(--shadow-lg);transform:translate(-50%,-50%);backface-visibility:hidden}',
        '.m-core3d span,.m-sat3d span{width:60%;height:60%;color:#fff}',
        '.m-sat3d{position:absolute;left:50%;top:50%;width:10%;height:10%;border-radius:50%;background:linear-gradient(135deg,var(--cz,var(--brand)),var(--accent));display:grid;place-items:center;box-shadow:var(--shadow-md);animation:mSat3d var(--dur,7s) var(--ease-spring) infinite var(--delay,0s);backface-visibility:hidden}',

        /* --- Misc tool scene elements (simplified from previous) --- */
        '.m-crop{position:absolute;left:50%;top:50%;width:46%;height:40%;transform:translate(-50%,-50%);border:2px dashed var(--brand);border-radius:6px}',
        '.m-crop-h{position:absolute;width:12px;height:12px;border:2px solid var(--brand);background:var(--surface)}',
        '.m-crop-h.tl{left:-6px;top:-6px;border-right:none;border-bottom:none}.m-crop-h.tr{right:-6px;top:-6px;border-left:none;border-bottom:none}.m-crop-h.bl{left:-6px;bottom:-6px;border-right:none;border-top:none}.m-crop-h.br{right:-6px;bottom:-6px;border-left:none;border-top:none}',
        '.m-meta{position:absolute;height:8px;border-radius:5px;background:var(--border);animation:mShrinkOut var(--dur,4s) ease-in-out infinite var(--delay,0s)}',
        '@keyframes mShrinkOut{0%,100%{opacity:.9;transform:scaleX(1)}50%{opacity:.2;transform:scaleX(.4)}}',
        '.m-textline{position:absolute;height:8px;border-radius:5px;background:linear-gradient(90deg,var(--text),transparent);opacity:.7;animation:mScanLine 2.6s ease-in-out infinite;animation-delay:calc(var(--i,0) * .25s)}',
        '@keyframes mScanLine{0%{opacity:0;transform:translateX(-20%)}20%{opacity:.8}100%{opacity:0;transform:translateX(20%)}}',
        '.m-mag{position:absolute;width:34%;height:34%;border-radius:12px;background:var(--surface);border:2px solid var(--border);display:grid;place-items:center;box-shadow:var(--shadow-md);animation:mFloat 7s var(--ease-spring) infinite}',
        '.m-mag-ic{width:60%;height:60%;color:var(--brand)}',
        '.m-zoom{position:absolute;left:66%;top:30%;font-weight:900;color:var(--brand);font-size:1.1rem;animation:mPulse 2.4s ease-in-out infinite}',
        '.m-txt-over{position:absolute;left:6px;bottom:4px;font-weight:900;color:#fff;font-size:.9rem;text-shadow:0 1px 2px rgba(0,0,0,.4)}',
        '.m-trimbar{position:absolute;height:8px;border-radius:6px;background:var(--border);overflow:hidden}',
        '.m-trimbar::after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(90deg,var(--cyan),var(--brand));animation:mSlide 2.6s ease-in-out infinite}',
        '.m-scissor{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);font-size:1.5rem;color:var(--brand);font-weight:800;animation:mFloat 5s var(--ease-spring) infinite}',
        '.m-speaker{position:absolute;left:42%;top:50%;width:14%;height:22%;transform:translate(-50%,-50%);color:var(--text)}',
        '.m-mono-l,.m-mono-r{position:absolute;top:50%;width:22%;height:30%;border-radius:8px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-sm)}',
        '.m-mono-l{left:24%;transform:translateY(-50%);animation:mFloat 6s var(--ease-spring) infinite}.m-mono-r{left:54%;transform:translateY(-50%);animation:mFloat 6.6s var(--ease-spring) infinite}',
        '.m-vol{position:absolute;width:8px;border-radius:4px;background:linear-gradient(var(--cyan),var(--brand));animation:mWave 1.6s ease-in-out infinite;animation-delay:calc(var(--i,0) * .12s);transform-origin:bottom}',
        '.m-swatch{position:absolute;width:20%;height:22%;border-radius:10px;box-shadow:var(--shadow-md);animation:mFloat var(--dur,6s) var(--ease-spring) infinite var(--delay,0s)}',
        '.m-code{position:absolute;top:42%;left:18%;font-family:monospace;font-size:.7rem;color:var(--text);background:var(--surface);border:1px solid var(--border);padding:3px 7px;border-radius:7px;animation:mFloat 6s var(--ease-spring) infinite}',
        '.m-code:last-of-type{left:54%}',
        '.m-hash{position:absolute;top:42%;left:54%;font-family:monospace;font-weight:800;font-size:.8rem;color:var(--brand);background:var(--surface);border:1px solid var(--border);padding:3px 7px;border-radius:7px}',
        '.m-shield{position:absolute;inset:12%;display:grid;place-items:center;color:var(--emerald)}',
        '.m-shield svg{width:46%;height:46%;animation:mPulse 3s var(--ease-soft) infinite}',
        '.m-checker{position:absolute;inset:14%;border-radius:12px;background-image:linear-gradient(45deg,#c9ccd6 25%,transparent 25%),linear-gradient(-45deg,#c9ccd6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#c9ccd6 75%),linear-gradient(-45deg,transparent 75%,#c9ccd6 75%);background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0;opacity:.9}',
        '.m-subject{position:absolute;inset:22%;border-radius:14px;background:radial-gradient(circle at 40% 35%,var(--accent),var(--brand));box-shadow:var(--shadow-md)}',
        '.m-globe{position:absolute;inset:16%;border-radius:50%;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--cyan) 70%,#fff),var(--brand) 70%);box-shadow:var(--shadow-lg),inset 0 0 30px rgba(0,0,0,.25);animation:mSpin 16s linear infinite}',
        '.m-globe::after{content:"";position:absolute;inset:0;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);background:repeating-linear-gradient(0deg,transparent 0 22%,rgba(255,255,255,.25) 22.5% 23%),repeating-linear-gradient(90deg,transparent 0 22%,rgba(255,255,255,.18) 22.5% 23%)}',
        '.m-lock{position:absolute;inset:26%;display:grid;place-items:center;color:var(--text);animation:mPulse 3.4s var(--ease-soft) infinite}',
        '.m-lock svg{width:50%;height:50%}',
        '.m-font{position:absolute;top:46%;left:34%;transform:translateY(-50%);font-size:1.8rem;font-weight:900;color:var(--brand);animation:mFloat 6s var(--ease-spring) infinite}',
        '.m-serif{font-family:Georgia,serif}.m-script{font-family:"Brush Script MT",cursive;color:var(--accent)}',
        '.m-pw{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;gap:4px;animation:mFloat 7s var(--ease-spring) infinite}',
        '.m-pw-chars{font-family:monospace;font-size:.8rem;font-weight:800;color:var(--text);background:var(--surface);border:1px solid var(--border);padding:4px 8px;border-radius:7px;letter-spacing:.04em}',
        '.m-pw-str{font-size:.55rem;font-weight:800;color:var(--emerald);text-transform:uppercase;text-align:center}',

        /* --- Card 3D animation modifiers --- */
        '.m-c3d-shrink{animation:mC3dShrink 4s ease-in-out infinite}',
        '@keyframes mC3dShrink{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(.65)}}',
        '.m-c3d-spin{animation:mC3dSpin 6s linear infinite}',
        '@keyframes mC3dSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}',
        '.m-c3d-resize{animation:mC3dResize 4s ease-in-out infinite}',
        '@keyframes mC3dResize{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,-50%) scale(1.15)}}',
        '.m-c3d-round{border-radius:50%!important}',
        '.m-c3d-speed{animation:none}',

        /* --- Satellite orbit (utility category) --- */
        '@keyframes mSat3d{0%,100%{transform:translate(-50%,-50%) translateX(calc(sin(var(--i,0) * 90deg) * 28%)) translateY(calc(cos(var(--i,0) * 90deg) * 28%)) translateZ(20px)}50%{transform:translate(-50%,-50%) translateX(calc(sin(var(--i,0) * 90deg) * 28%)) translateY(calc(cos(var(--i,0) * 90deg) * 28%)) translateZ(40px)}}',
        '@keyframes mSlideFake{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.6)}}',

        /* --- Reduced motion overrides for new scenes --- */
        '@media (prefers-reduced-motion: reduce){.m-card3d,.m-merge-pg,.m-bg-checker,.m-bg-card,.m-bg-mask,.m-bg-brackets,.m-bc-card,.m-bc-beam,.m-bc-result,.m-qr-card,.m-qr-dl,.m-pg3d,.m-frame3d,.m-vtile3d,.m-atile3d,.m-type3d,.m-core3d,.m-sat3d,.m-badge,.m-pw,.m-trimbar::after{animation:none!important}.m-bg-mask{transform:none}.m-bc-result,.m-qr-dl{opacity:1;transform:translate(-50%,-50%) translateX(-50%)}}',

        /* --- Lite mode overrides for new scenes --- */
        'html.motion-lite .m-card3d,html.motion-lite .m-merge-pg,html.motion-lite .m-bg-checker,html.motion-lite .m-bg-card,html.motion-lite .m-bg-mask,html.motion-lite .m-bg-brackets,html.motion-lite .m-bc-card,html.motion-lite .m-bc-beam,html.motion-lite .m-bc-result,html.motion-lite .m-qr-card,html.motion-lite .m-qr-dl,html.motion-lite .m-pg3d,html.motion-lite .m-frame3d,html.motion-lite .m-vtile3d,html.motion-lite .m-atile3d,html.motion-lite .m-type3d,html.motion-lite .m-core3d,html.motion-lite .m-sat3d{animation:none!important}'
    ].join('\n');

    function injectSceneCSS() {
        var st = document.createElement('style');
        st.textContent = sceneCSS;
        document.head.appendChild(st);
    }

    /* =================================================================
       MotionController
       ================================================================= */
    var Controller = {
        revealObserver: null,
        pauseObserver: null,

        start: function () {
            var root = document.documentElement;
            try {
                root.classList.add('motion-ready');
                this.applyTier(root);
                injectSceneCSS();
            } catch (e) {
                root.classList.remove('motion-ready');
                return;
            }
            try { this.buildScenes(); } catch (e) {}
            try { this.setupReveal(); } catch (e) { this.revealAll(); }
            try { this.setupPause(); } catch (e) {}
            try { this.setupHeader(); } catch (e) {}
            try { this.setupMega(); } catch (e) {}
            if (FINE && !REDUCED) {
                try { this.setupParallax(); } catch (e) {}
                try { this.setupTilt(); } catch (e) {}
            }
        },

        revealAll: function () {
            document.querySelectorAll('[data-reveal]').forEach(function (n) { n.classList.add('is-revealed'); });
        },

        applyTier: function (root) {
            if (REDUCED) { root.classList.add('motion-reduced'); return; }
            if (!FINE) root.classList.add('motion-touch');
            var cores = (navigator.hardwareConcurrency || 4);
            var mem = (navigator.deviceMemory || 4);
            if (cores <= 2 || mem <= 2) {
                root.classList.add('motion-lite');
            } else if (cores <= 4 || mem <= 4) {
                root.classList.add('motion-medium');
            } else {
                root.classList.add('motion-full');
            }
        },

        buildScenes: function () {
            var map = window.FileGenieMotionMap || null;

            // Homepage hero
            var hero = document.querySelector('.hero-ecosystem');
            if (hero && Scenes.hero) {
                hero.classList.add('m-stage');
                hero.innerHTML = '';
                hero.setAttribute('aria-hidden', 'true');
                Scenes.hero(hero);
            }

            // Category composition
            var cat = document.querySelector('.category-scene');
            if (cat) {
                cat.classList.add('m-stage');
                var comp = cat.getAttribute('data-composition');
                if (comp && Scenes[comp]) Scenes[comp](cat);
            }

            // Tool page scene
            var tool = document.querySelector('.tool-motion-scene');
            if (tool) {
                tool.classList.add('m-stage');
                var fam = tool.getAttribute('data-motion-family') || 'floating';
                var variant = tool.getAttribute('data-motion-variant') || '';
                if (map && map.family) { fam = map.family; variant = map.variant || ''; }
                if (Scenes[fam]) Scenes[fam](tool, variant);
                else Scenes.floating(tool, variant);
            }
        },

        setupReveal: function () {
            if (REDUCED || !('IntersectionObserver' in window)) {
                document.querySelectorAll('[data-reveal]').forEach(function (n) { n.classList.add('is-revealed'); });
                return;
            }
            var self = this;
            this.revealObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('is-revealed');
                        self.revealObserver.unobserve(e.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

            document.querySelectorAll('.m-stagger').forEach(function (group) {
                Array.prototype.forEach.call(group.children, function (child, i) {
                    child.style.setProperty('--reveal-delay', (i * 0.06) + 's');
                });
            });
            document.querySelectorAll('[data-reveal]').forEach(function (n) {
                self.revealObserver.observe(n);
            });
        },

        setupPause: function () {
            if (!('IntersectionObserver' in window)) return;
            var self = this;
            this.pauseObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    var stage = e.target;
                    if (e.isIntersecting) stage.classList.remove('is-offscreen');
                    else stage.classList.add('is-offscreen');
                });
            }, { threshold: 0.01 });
            document.querySelectorAll('.m-stage').forEach(function (s) { self.pauseObserver.observe(s); });
        },

        setupHeader: function () {
            var header = document.getElementById('site-header');
            if (!header) return;
            var onScroll = function () {
                if (window.scrollY > 12) header.classList.add('is-scrolled');
                else header.classList.remove('is-scrolled');
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        },

        setupMega: function () {
            var cols = document.querySelectorAll('#mega-menu .mega-col');
            Array.prototype.forEach.call(cols, function (c, i) { c.style.setProperty('--col-index', i); });
        },

        setupTilt: function () {
            var cards = document.querySelectorAll('.tool-card, .category-card');
            Array.prototype.forEach.call(cards, function (card) {
                var glow = null;
                card.addEventListener('pointerenter', function () {
                    if (!glow) {
                        glow = document.createElement('span');
                        glow.className = 'm-card-glow';
                        card.insertBefore(glow, card.firstChild);
                    }
                    card.classList.add('is-tilting');
                });
                card.addEventListener('pointermove', function (e) {
                    var r = card.getBoundingClientRect();
                    var px = (e.clientX - r.left) / r.width;
                    var py = (e.clientY - r.top) / r.height;
                    card.style.setProperty('--tiltY', ((px - 0.5) * 8).toFixed(2) + 'deg');
                    card.style.setProperty('--tiltX', ((0.5 - py) * 8).toFixed(2) + 'deg');
                    if (glow) { glow.style.setProperty('--gx', (px * 100) + '%'); glow.style.setProperty('--gy', (py * 100) + '%'); }
                });
                card.addEventListener('pointerleave', function () {
                    card.classList.remove('is-tilting');
                    card.style.setProperty('--tiltX', '0deg');
                    card.style.setProperty('--tiltY', '0deg');
                });
            });
        },

        setupParallax: function () {
            var hero = document.querySelector('.hero-ecosystem');
            if (!hero) return;
            hero.classList.add('is-parallax');

            var targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null, hovering = false;
            var root = document.documentElement;

            function loop() {
                curX += (targetX - curX) * 0.08;
                curY += (targetY - curY) * 0.08;
                root.style.setProperty('--mx', curX.toFixed(3));
                root.style.setProperty('--my', curY.toFixed(3));
                if (hovering) raf = requestAnimationFrame(loop);
            }
            hero.addEventListener('pointermove', function (e) {
                var r = hero.getBoundingClientRect();
                targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
                targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
                if (!hovering) { hovering = true; loop(); }
            });
            hero.addEventListener('pointerleave', function () {
                hovering = false; targetX = 0; targetY = 0;
                if (raf) cancelAnimationFrame(raf);
                root.style.setProperty('--mx', '0');
                root.style.setProperty('--my', '0');
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { Controller.start(); });
    } else {
        Controller.start();
    }

    window.FileGenieMotion = Controller;
})();
