/**
 * Text & Font engine — real, client-side text transformations. No placeholders.
 * Tools: case-converter, word-counter, remove-duplicate-lines, sort-lines,
 *        text-cleaner, text-compare, font-styler, text-formatter.
 *
 * Text tools read a <textarea>, not a file. app.js waives the file requirement
 * for engine "text". Each tool genuinely transforms text and returns a
 * downloadable text blob plus a human-readable in-page result.
 */
(function () {
    'use strict';

    function get(id) { return document.getElementById(id); }

    function renderControls(toolId, container) {
        if (!container) return;
        var h = '';
        switch (toolId) {
            case 'case-converter':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="tc-mode">Case mode</label>' +
                    '<select class="setting-select" id="tc-mode">' +
                    '<option value="upper">UPPERCASE</option>' +
                    '<option value="lower">lowercase</option>' +
                    '<option value="title">Title Case</option>' +
                    '<option value="sentence">Sentence case</option>' +
                    '<option value="alternating">aLtErNaTiNg</option>' +
                    '</select></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="tc-input">Your text</label>' +
                    '<textarea class="diff-box" id="tc-input" placeholder="Type or paste text to transform"></textarea></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="tc-output">Result</label>' +
                    '<textarea class="diff-box" id="tc-output" readonly></textarea></div>';
                break;
            case 'word-counter':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="wc-input">Your text</label>' +
                    '<textarea class="diff-box" id="wc-input" placeholder="Type or paste text"></textarea></div>' +
                    '<div class="stats-grid" id="wc-stats"></div>';
                break;
            case 'remove-duplicate-lines':
                h =
                    '<label class="setting-check"><input type="checkbox" id="dup-ignore-case"> Ignore case when comparing</label>' +
                    '<label class="setting-check"><input type="checkbox" id="dup-drop-blank" checked> Drop blank lines</label>' +
                    '<div class="setting-group" style="margin-top:12px">' +
                    '<label class="setting-label" for="dup-input">Your text</label>' +
                    '<textarea class="diff-box" id="dup-input" placeholder="One item per line"></textarea></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="dup-output">Result (duplicates removed)</label>' +
                    '<textarea class="diff-box" id="dup-output" readonly></textarea></div>';
                break;
            case 'sort-lines':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="sort-dir">Order</label>' +
                    '<select class="setting-select" id="sort-dir">' +
                    '<option value="asc">A to Z (ascending)</option>' +
                    '<option value="desc">Z to A (descending)</option>' +
                    '</select></div>' +
                    '<label class="setting-check"><input type="checkbox" id="sort-ignore-case" checked> Ignore case</label>' +
                    '<div class="setting-group" style="margin-top:12px">' +
                    '<label class="setting-label" for="sort-input">Your text</label>' +
                    '<textarea class="diff-box" id="sort-input" placeholder="One item per line"></textarea></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="sort-output">Result</label>' +
                    '<textarea class="diff-box" id="sort-output" readonly></textarea></div>';
                break;
            case 'text-cleaner':
                h =
                    '<label class="setting-check"><input type="checkbox" id="clean-trim" checked> Trim trailing whitespace on each line</label>' +
                    '<label class="setting-check"><input type="checkbox" id="clean-spaces" checked> Collapse runs of spaces to one</label>' +
                    '<label class="setting-check"><input type="checkbox" id="clean-blank" checked> Remove blank lines</label>' +
                    '<label class="setting-check"><input type="checkbox" id="clean-crlf" checked> Normalize line endings (Unix LF)</label>' +
                    '<div class="setting-group" style="margin-top:12px">' +
                    '<label class="setting-label" for="clean-input">Your text</label>' +
                    '<textarea class="diff-box" id="clean-input" placeholder="Paste messy text"></textarea></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="clean-output">Result</label>' +
                    '<textarea class="diff-box" id="clean-output" readonly></textarea></div>';
                break;
            case 'text-compare':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="cmp-a">Original text</label>' +
                    '<textarea class="diff-box" id="cmp-a" placeholder="Paste the original"></textarea></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="cmp-b">Changed text</label>' +
                    '<textarea class="diff-box" id="cmp-b" placeholder="Paste the modified version"></textarea></div>' +
                    '<div class="diff-view" id="cmp-diff"></div>';
                break;
            case 'font-styler':
                renderFontStylerUI(container);
                return;
            case 'text-formatter':
                h =
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="fmt-mode">Operation</label>' +
                    '<select class="setting-select" id="fmt-mode">' +
                    '<option value="json-pretty">Pretty-print JSON</option>' +
                    '<option value="json-minify">Minify JSON</option>' +
                    '<option value="json-validate">Validate JSON</option>' +
                    '</select></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="fmt-input">Your text</label>' +
                    '<textarea class="diff-box" id="fmt-input" placeholder="Paste JSON"></textarea></div>' +
                    '<div class="setting-group">' +
                    '<label class="setting-label" for="fmt-output">Result</label>' +
                    '<textarea class="diff-box" id="fmt-output" readonly></textarea></div>';
                break;
            default:
                h = '<p class="setting-hint">No extra settings for this tool.</p>';
        }
        container.innerHTML = h;
    }
    // ---------- helpers ----------
    function textBlob(text, name) {
        return { blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), filename: name };
    }

    function setOut(id, val) {
        var el = get(id);
        if (el) { try { el.value = val; } catch (e) { el.textContent = val; } }
    }

    function transformCase(text, mode) {
        if (mode === 'upper') return text.toUpperCase();
        if (mode === 'lower') return text.toLowerCase();
        if (mode === 'title') return text.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        if (mode === 'sentence') {
            var cap = true; var out = '';
            for (var i = 0; i < text.length; i++) {
                var ch = text[i];
                if (cap && /[a-z]/.test(ch)) { out += ch.toUpperCase(); cap = false; }
                else { out += ch; }
                if (/[.!?]/.test(ch)) cap = true;
                else if (ch === '\n') cap = true;
            }
            return out;
        }
        if (mode === 'alternating') {
            var upper = true; var s = '';
            for (var j = 0; j < text.length; j++) {
                var c = text[j];
                if (/[a-zA-Z]/.test(c)) { s += upper ? c.toUpperCase() : c.toLowerCase(); upper = !upper; }
                else { s += c; }
            }
            return s;
        }
        return text;
    }

    function countStats(text) {
        var words = (text.trim().match(/\S+/g) || []).length;
        var sentences = (text.match(/[.!?]+(?=\s|$)/g) || []).length;
        if (text.trim() === '') sentences = 0;
        var lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length;
        var paragraphs = (text.trim().split(/\n\s*\n/).filter(function (p) { return p.trim() !== ''; })).length;
        var minutes = words / 200;
        return {
            words: words, chars: text.length, charsNoSpaces: text.replace(/\s/g, '').length,
            sentences: sentences, lines: lines, paragraphs: paragraphs,
            readingTime: minutes < 1 ? '< 1 min' : (Math.round(minutes) + ' min')
        };
    }

    function dedupeLines(text, ignoreCase, dropBlank) {
        var lines = text.split(/\r\n|\r|\n/);
        if (dropBlank) lines = lines.filter(function (l) { return l.trim() !== ''; });
        var seen = {}; var out = [];
        for (var i = 0; i < lines.length; i++) {
            var key = ignoreCase ? lines[i].toLowerCase() : lines[i];
            if (!seen[key]) { seen[key] = true; out.push(lines[i]); }
        }
        return out.join('\n');
    }

    function sortLines(text, dir, ignoreCase) {
        var lines = text.split(/\r\n|\r|\n/);
        lines.sort(function (a, b) {
            var x = ignoreCase ? a.toLowerCase() : a;
            var y = ignoreCase ? b.toLowerCase() : b;
            return dir === 'desc' ? (x < y ? 1 : x > y ? -1 : 0) : (x < y ? -1 : x > y ? 1 : 0);
        });
        return lines.join('\n');
    }

    function cleanText(text, opts) {
        var lines = text.split(/\r\n|\r|\n/);
        lines = lines.map(function (l) {
            if (opts.trim) l = l.replace(/\s+$/, '');
            if (opts.spaces) l = l.replace(/[ \t]+/g, ' ');
            return l;
        });
        if (opts.blank) lines = lines.filter(function (l) { return l.trim() !== ''; });
        return lines.join('\n');
    }
    function diffLines(aText, bText) {
        var a = aText.split(/\r\n|\r|\n/);
        var b = bText.split(/\r\n|\r|\n/);
        var n = a.length, m = b.length;
        var dp = [];
        for (var i = 0; i <= n; i++) dp[i] = new Array(m + 1).fill(0);
        for (var i2 = n - 1; i2 >= 0; i2--) {
            for (var j2 = m - 1; j2 >= 0; j2--) {
                dp[i2][j2] = a[i2] === b[j2] ? dp[i2 + 1][j2 + 1] + 1 : Math.max(dp[i2 + 1][j2], dp[i2][j2 + 1]);
            }
        }
        var res = []; var x = 0, y = 0;
        while (x < n && y < m) {
            if (a[x] === b[y]) { res.push({ t: ' ', a: a[x], b: b[y] }); x++; y++; }
            else if (dp[x + 1][y] >= dp[x][y + 1]) { res.push({ t: '-', a: a[x], b: null }); x++; }
            else { res.push({ t: '+', a: null, b: b[y] }); y++; }
        }
        while (x < n) { res.push({ t: '-', a: a[x], b: null }); x++; }
        while (y < m) { res.push({ t: '+', a: null, b: b[y] }); y++; }
        return res;
    }

    function renderDiff(aText, bText) {
        var rows = diffLines(aText, bText);
        var added = 0, removed = 0;
        var html = rows.map(function (r) {
            if (r.t === '-') { removed++; return '<div class="diff-row diff-del"><span class="diff-gutter">-</span><span class="diff-txt"></span><span class="diff-txt">' + esc(r.a) + '</span></div>'; }
            if (r.t === '+') { added++; return '<div class="diff-row diff-add"><span class="diff-gutter"></span><span class="diff-txt">' + esc(r.b) + '</span><span class="diff-txt"></span></div>'; }
            return '<div class="diff-row"><span class="diff-gutter"></span><span class="diff-txt">' + esc(r.a) + '</span><span class="diff-txt">' + esc(r.b) + '</span></div>';
        }).join('');
        var box = get('cmp-diff');
        if (box) {
            box.innerHTML = '<div class="diff-summary">+ ' + added + ' added, - ' + removed + ' removed</div>' +
                '<div class="diff-cols"><span>Original</span><span>Changed</span></div>' + html;
        }
        return rows.map(function (r) {
            if (r.t === '-') return '- ' + r.a;
            if (r.t === '+') return '+ ' + r.b;
            return '  ' + r.a;
        }).join('\n');
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
        'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'q': 'q', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ',
        'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
        'A': 'ᴬ', 'B': 'ᴮ', 'C': 'ᶜ', 'D': 'ᴰ', 'E': 'ᴱ', 'F': 'ᶠ', 'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ',
        'K': 'ᴷ', 'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'Q': 'Q', 'R': 'ᴿ', 'S': 'ˢ', 'T': 'ᵀ',
        'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ', 'X': 'ˣ', 'Y': 'ʸ', 'Z': 'ᶻ' };
    var SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
        'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ' };

    function mapRange(ch, up, lo, dig) {
        var c = ch.charCodeAt(0);
        if (c >= 65 && c <= 90) return String.fromCodePoint(c + (up - 65));
        if (c >= 97 && c <= 122) return String.fromCodePoint(c + (lo - 97));
        if (c >= 48 && c <= 57 && dig) return String.fromCodePoint(c + (dig - 48));
        return ch;
    }

    function styleChar(ch, style) {
        if (style === 'bold') return mapRange(ch, 0x1D400, 0x1D41A, 0x1D7CE);
        if (style === 'italic') return mapRange(ch, 0x1D434, 0x1D44E, null);
        if (style === 'mono') return mapRange(ch, 0x1D670, 0x1D68A, 0x1D7F6);
        if (style === 'sans') return mapRange(ch, 0x1D5A0, 0x1D5BA, 0x1D7E2);
        if (style === 'double') return mapRange(ch, 0x1D538, 0x1D552, 0x1D7D8);
        if (style === 'fullwidth') return mapRange(ch, 0xFF21, 0xFF41, 0xFF10);
        if (style === 'circled') {
            var c = ch.charCodeAt(0);
            if (c >= 65 && c <= 90) return String.fromCharCode(c + (0x24B6 - 65));
            if (c >= 97 && c <= 122) return String.fromCharCode(c + (0x24D0 - 97));
            if (c >= 49 && c <= 57) return String.fromCharCode(c + (0x2460 - 49));
            if (c === 48) return '⓪';
            return ch;
        }
        if (style === 'sup') return SUP[ch] || ch;
        if (style === 'sub') return SUB[ch] || ch;
        if (style === 'strike') return ch + '̶';
        return ch;
    }

    function styleText(text, style) {
        var out = '';
        for (var i = 0; i < text.length; i++) out += styleChar(text[i], style);
        return out;
    }
    // ---------- process ----------
    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        var text, out;
        switch (toolId) {
            case 'case-converter':
                text = (get('tc-input') && get('tc-input').value) || '';
                out = transformCase(text, (get('tc-mode') && get('tc-mode').value) || 'upper');
                setOut('tc-output', out);
                onProgress(100, 'Done');
                return textBlob(out, 'converted.txt');

            case 'word-counter': {
                text = (get('wc-input') && get('wc-input').value) || '';
                var s = countStats(text);
                var grid = get('wc-stats');
                if (grid) {
                    grid.innerHTML = statCard('Words', s.words) + statCard('Characters', s.chars) +
                        statCard('Chars (no spaces)', s.charsNoSpaces) + statCard('Sentences', s.sentences) +
                        statCard('Lines', s.lines) + statCard('Paragraphs', s.paragraphs) +
                        statCard('Reading time', s.readingTime);
                }
                var summary = 'Words: ' + s.words + '\nCharacters: ' + s.chars +
                    '\nCharacters (no spaces): ' + s.charsNoSpaces + '\nSentences: ' + s.sentences +
                    '\nLines: ' + s.lines + '\nParagraphs: ' + s.paragraphs +
                    '\nReading time: ' + s.readingTime;
                onProgress(100, 'Counted');
                return textBlob(summary, 'word-count.txt');
            }

            case 'remove-duplicate-lines':
                text = (get('dup-input') && get('dup-input').value) || '';
                out = dedupeLines(text,
                    get('dup-ignore-case') && get('dup-ignore-case').checked,
                    get('dup-drop-blank') && get('dup-drop-blank').checked);
                setOut('dup-output', out);
                onProgress(100, 'Done');
                return textBlob(out, 'unique-lines.txt');

            case 'sort-lines':
                text = (get('sort-input') && get('sort-input').value) || '';
                out = sortLines(text,
                    (get('sort-dir') && get('sort-dir').value) || 'asc',
                    get('sort-ignore-case') && get('sort-ignore-case').checked);
                setOut('sort-output', out);
                onProgress(100, 'Done');
                return textBlob(out, 'sorted-lines.txt');

            case 'text-cleaner':
                text = (get('clean-input') && get('clean-input').value) || '';
                out = cleanText(text, {
                    trim: get('clean-trim') && get('clean-trim').checked,
                    spaces: get('clean-spaces') && get('clean-spaces').checked,
                    blank: get('clean-blank') && get('clean-blank').checked,
                    crlf: get('clean-crlf') && get('clean-crlf').checked
                });
                setOut('clean-output', out);
                onProgress(100, 'Done');
                return textBlob(out, 'cleaned.txt');
            case 'text-compare': {
                var a = (get('cmp-a') && get('cmp-a').value) || '';
                var b = (get('cmp-b') && get('cmp-b').value) || '';
                var unified = renderDiff(a, b);
                onProgress(100, 'Compared');
                return textBlob(unified, 'diff.txt');
            }

            case 'font-styler':
                text = (get('fs-input') && get('fs-input').value) || '';
                if (!text) throw new Error('Type some text to style first.');
                // The first generated style is the deterministic Mathematical
                // Bold variant shown in the live preview. The UI still exposes
                // the complete style browser and copy actions for exploration.
                var styled = fsStyleText(text, FS_BASES[0], FS_DECOR[0]);
                onProgress(100, 'Styled');
                return textBlob(styled, 'font-styler-bold.txt');

            case 'text-formatter': {
                text = (get('fmt-input') && get('fmt-input').value) || '';
                var mode = (get('fmt-mode') && get('fmt-mode').value) || 'json-pretty';
                var parsed;
                try { parsed = JSON.parse(text); }
                catch (e) { throw new Error('Invalid JSON: ' + e.message); }
                if (mode === 'json-minify') out = JSON.stringify(parsed);
                else if (mode === 'json-validate') out = 'Valid JSON (' + (typeof parsed) + ').';
                else out = JSON.stringify(parsed, null, 2);
                setOut('fmt-output', out);
                onProgress(100, 'Formatted');
                return textBlob(out, 'formatted.json');
            }

            default:
                throw new Error('This text tool is not implemented yet.');
        }
    }

    function statCard(label, value) {
        return '<div class="stat-card"><span class="stat-value">' + value + '</span><span class="stat-label">' + label + '</span></div>';
    }

    // ===================== FONT STYLER ENGINE =====================
    // A structured Unicode transformation engine. It combines a set of base
    // letter/number transforms (mathematical alphabets, circled/squared letters,
    // regional indicators, inverted, small-caps, superscript/subscript, line
    // decorations) with combining-mark decorators to produce 1000+ genuinely
    // distinct, copy-pasteable stylish-text variations. Nothing is a font file;
    // everything is real Unicode. Items are generated lazily and rendered in
    // pages (Load More) so the DOM never holds thousands of cards at once.

    function fsScript(ch) {
        var c = ch.charCodeAt(0);
        var CAP = { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ' };
        if (c >= 65 && c <= 90) {
            if (CAP[ch]) return CAP[ch];
            return String.fromCodePoint(c + (0x1D49C - 65));
        }
        if (c >= 97 && c <= 122) {
            if (ch === 'h') return 'ℎ';
            return String.fromCodePoint(c + (0x1D4B6 - 97));
        }
        return ch;
    }
    function fsCircled(ch) {
        var c = ch.charCodeAt(0);
        if (c >= 65 && c <= 90) return String.fromCharCode(c + (0x24B6 - 65));
        if (c >= 97 && c <= 122) return String.fromCharCode(c + (0x24D0 - 97));
        if (c >= 49 && c <= 57) return String.fromCharCode(c + (0x2460 - 49));
        if (c === 48) return '⓪';
        return ch;
    }
    function fsParen(ch) {
        var c = ch.charCodeAt(0);
        if (c >= 65 && c <= 90) return String.fromCharCode(c + (0x249C - 65));
        return ch;
    }
    function fsSquared(ch) {
        var c = ch.charCodeAt(0);
        if (c >= 65 && c <= 90) return String.fromCodePoint(c + (0x1F130 - 65));
        return ch;
    }
    function fsNegCircled(ch) {
        var c = ch.charCodeAt(0);
        if (c >= 65 && c <= 90) return String.fromCodePoint(c + (0x1F150 - 65));
        if (c >= 97 && c <= 122) return String.fromCodePoint(c + (0x1F170 - 97));
        return ch;
    }
    function fsFullwidth(ch) { return mapRange(ch, 0xFF21, 0xFF41, 0xFF10); }
    function fsRegional(ch) {
        var c = ch.toLowerCase().charCodeAt(0);
        if (c >= 97 && c <= 122) return String.fromCodePoint(0x1F1E6 + (c - 97));
        return ch;
    }
    var INVERT = { a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ı', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɟ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z' };
    function fsInvert(ch) {
        var c = ch.toLowerCase();
        return INVERT[c] || ch;
    }
    function fsSmallCaps(ch) {
        var c = ch.charCodeAt(0);
        if (c >= 97 && c <= 122) return String.fromCharCode(c - 32);
        return ch;
    }
    function fsStrike(ch) { return ch + '̶'; }
    function fsUnderline(ch) { return ch + '̲'; }
    function fsOverline(ch) { return ch + '̅'; }

    var FS_BASES = [
        { id: 'bold', name: 'Bold', cat: 'Bold & Serif', fn: function (c) { return mapRange(c, 0x1D400, 0x1D41A, 0x1D7CE); } },
        { id: 'italic', name: 'Italic', cat: 'Italic & Script', fn: function (c) { return mapRange(c, 0x1D434, 0x1D44E, null); } },
        { id: 'bold-italic', name: 'Bold Italic', cat: 'Italic & Script', fn: function (c) { return mapRange(c, 0x1D468, 0x1D482, null); } },
        { id: 'script', name: 'Script', cat: 'Italic & Script', fn: fsScript },
        { id: 'bold-script', name: 'Bold Script', cat: 'Italic & Script', fn: function (c) { return mapRange(c, 0x1D4D0, 0x1D4EA, null); } },
        { id: 'fraktur', name: 'Fraktur', cat: 'Blackletter', fn: function (c) { return mapRange(c, 0x1D51E, 0x1D538, null); } },
        { id: 'bold-fraktur', name: 'Bold Fraktur', cat: 'Blackletter', fn: function (c) { return mapRange(c, 0x1D56C, 0x1D586, null); } },
        { id: 'mono', name: 'Monospace', cat: 'Monospace', fn: function (c) { return mapRange(c, 0x1D670, 0x1D68A, 0x1D7F6); } },
        { id: 'sans', name: 'Sans Serif', cat: 'Bold & Serif', fn: function (c) { return mapRange(c, 0x1D5A0, 0x1D5BA, 0x1D7E2); } },
        { id: 'sans-bold', name: 'Sans Bold', cat: 'Bold & Serif', fn: function (c) { return mapRange(c, 0x1D5D4, 0x1D5EE, 0x1D7EC); } },
        { id: 'sans-italic', name: 'Sans Italic', cat: 'Italic & Script', fn: function (c) { return mapRange(c, 0x1D608, 0x1D622, null); } },
        { id: 'sans-bold-italic', name: 'Sans Bold Italic', cat: 'Bold & Serif', fn: function (c) { return mapRange(c, 0x1D63C, 0x1D656, null); } },
        { id: 'double', name: 'Double-struck', cat: 'Bold & Serif', fn: function (c) { return mapRange(c, 0x1D538, 0x1D552, 0x1D7D8); } },
        { id: 'bold-double', name: 'Bold Double-struck', cat: 'Bold & Serif', fn: function (c) { return mapRange(c, 0x1D53C, 0x1D556, 0x1D7D8); } },
        { id: 'circled', name: 'Circled', cat: 'Circled & Boxed', fn: fsCircled },
        { id: 'paren', name: 'Parenthesized', cat: 'Circled & Boxed', fn: fsParen },
        { id: 'squared', name: 'Squared', cat: 'Circled & Boxed', fn: fsSquared },
        { id: 'neg-circled', name: 'Negative Circled', cat: 'Circled & Boxed', fn: fsNegCircled },
        { id: 'fullwidth', name: 'Fullwidth', cat: 'Fullwidth', fn: fsFullwidth },
        { id: 'regional', name: 'Regional', cat: 'Regional & Inverted', fn: fsRegional },
        { id: 'inverted', name: 'Inverted', cat: 'Regional & Inverted', fn: fsInvert, reverse: true },
        { id: 'small-caps', name: 'Small Caps', cat: 'Caps & Sub/Superscript', fn: fsSmallCaps },
        { id: 'sup', name: 'Superscript', cat: 'Caps & Sub/Superscript', fn: function (c) { return SUP[c] || c; } },
        { id: 'sub', name: 'Subscript', cat: 'Caps & Sub/Superscript', fn: function (c) { return SUB[c] || c; } },
        { id: 'strike', name: 'Strikethrough', cat: 'Line Decorations', fn: fsStrike },
        { id: 'underline', name: 'Underline', cat: 'Line Decorations', fn: fsUnderline },
        { id: 'overline', name: 'Overline', cat: 'Line Decorations', fn: fsOverline }
    ];

    // Combining marks used as decorators (each appended after the base glyph).
    var FS_MARKS = ['̅', '̲', '̳', '̶', '̃', '̄', '̇', '̊'];
    var FS_MARK_NAMES = ['Overline', 'Underline', 'Double underline', 'Strikethrough', 'Tilde', 'Macron', 'Dot above', 'Ring above'];

    function fsBuildDecor() {
        var decors = [{ name: 'Plain', marks: '' }];
        for (var i = 0; i < FS_MARKS.length; i++) {
            decors.push({ name: FS_MARK_NAMES[i], marks: FS_MARKS[i] });
            for (var j = i + 1; j < FS_MARKS.length; j++) {
                decors.push({ name: FS_MARK_NAMES[i] + ' + ' + FS_MARK_NAMES[j], marks: FS_MARKS[i] + FS_MARKS[j] });
                for (var k = j + 1; k < FS_MARKS.length; k++) {
                    decors.push({
                        name: FS_MARK_NAMES[i] + ' + ' + FS_MARK_NAMES[j] + ' + ' + FS_MARK_NAMES[k],
                        marks: FS_MARKS[i] + FS_MARKS[j] + FS_MARKS[k]
                    });
                }
            }
        }
        return decors;
    }
    var FS_DECOR = fsBuildDecor();

    function fsStyleText(text, base, decor) {
        var out = '';
        for (var i = 0; i < text.length; i++) {
            out += base.fn(text[i]) + decor.marks;
        }
        if (base.reverse) {
            // Inverted text reads right-to-left.
            out = out.split('').reverse().join('');
        }
        return out;
    }

    function fsStore(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }
    function fsLoad(key, fallback) {
        try {
            var v = localStorage.getItem(key);
            return v ? JSON.parse(v) : fallback;
        } catch (e) { return fallback; }
    }

    function renderFontStylerUI(container) {
        if (!container) return;

        // Build the flat item list once (each item = base + decor variant).
        var items = [];
        FS_BASES.forEach(function (base) {
            FS_DECOR.forEach(function (decor) {
                items.push({
                    name: decor.marks === '' ? base.name : (base.name + ' · ' + decor.name),
                    cat: base.cat,
                    base: base,
                    decor: decor
                });
            });
        });

        var favs = fsLoad('fg-fs-fav', []);
        var recent = fsLoad('fg-fs-recent', []);
        var PAGE = 30, page = 0, current = items, filterCat = 'All', query = '';

        container.innerHTML =
            '<style>' +
            '.fs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.75rem;margin-top:1rem;}' +
            '.fs-card{border:1px solid var(--border,#e5e7eb);border-radius:12px;padding:.75rem;display:flex;flex-direction:column;gap:.4rem;background:var(--card,#fff);}' +
            '.fs-preview{font-size:1.25rem;line-height:1.5;word-break:break-word;min-height:2.2rem;}' +
            '.fs-name{font-size:.78rem;color:var(--muted,#6b7280);}' +
            '.fs-card-actions{display:flex;gap:.4rem;align-items:center;}' +
            '.fs-copy,.fs-star{cursor:pointer;border:1px solid var(--border,#e5e7eb);background:transparent;border-radius:8px;padding:.3rem .5rem;font-size:.8rem;}' +
            '.fs-star.on{background:#fef3c7;border-color:#f59e0b;}' +
            '.fs-cats{display:flex;flex-wrap:wrap;gap:.4rem;margin:.6rem 0;}' +
            '.fs-cat{cursor:pointer;border:1px solid var(--border,#e5e7eb);border-radius:999px;padding:.3rem .7rem;font-size:.8rem;background:transparent;}' +
            '.fs-cat.on{background:#4f46e5;color:#fff;border-color:#4f46e5;}' +
            '.fs-recent{margin-top:1rem;}' +
            '.fs-recent-item{display:flex;gap:.5rem;align-items:center;padding:.3rem 0;border-bottom:1px dashed var(--border,#e5e7eb);}' +
            '.fs-recent-txt{font-size:1rem;flex:1;word-break:break-word;}' +
            '</style>' +
            '<div class="setting-group">' +
            '<label class="setting-label" for="fs-input">Your text</label>' +
            '<textarea class="diff-box" id="fs-input" placeholder="Type text to style (e.g. FileGenie)"></textarea></div>' +
            '<div class="fs-toolbar" style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;">' +
            '<input type="search" class="setting-input" id="fs-search" placeholder="Search styles…" style="flex:1;min-width:180px;">' +
            '<button type="button" class="btn btn-ghost" id="fs-copy-plain">Copy plain text</button>' +
            '<button type="button" class="btn btn-ghost" id="fs-clear">Clear input</button>' +
            '</div>' +
            '<div class="fs-cats" id="fs-cats"></div>' +
            '<div class="fs-grid" id="fs-grid" aria-live="polite"></div>' +
            '<div class="fs-more" id="fs-more-wrap" style="margin-top:1rem;text-align:center;">' +
            '<button type="button" class="btn btn-ghost" id="fs-more">Load more styles</button></div>' +
            '<div class="fs-recent" id="fs-recent"></div>' +
            '<p class="setting-hint" style="margin-top:1rem;">Compatibility note: some styles use less-common Unicode glyphs (regional indicators, circled/squared letters) and may not render on every device or font. Mathematical bold/italic styles work almost everywhere. Combining-mark decorations render best on letters.</p>';

        var grid = container.querySelector('#fs-grid');
        var catsEl = container.querySelector('#fs-cats');
        var searchEl = container.querySelector('#fs-search');
        var moreBtn = container.querySelector('#fs-more');

        var cats = ['All'].concat(FS_BASES.map(function (b) { return b.cat; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
        cats.forEach(function (cat) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'fs-cat' + (cat === 'All' ? ' on' : '');
            b.textContent = cat;
            b.addEventListener('click', function () {
                filterCat = cat;
                Array.prototype.forEach.call(catsEl.children, function (c) { c.classList.remove('on'); });
                b.classList.add('on');
                resetAndRender();
            });
            catsEl.appendChild(b);
        });

        function isFav(name) { return favs.indexOf(name) !== -1; }

        function makeCard(item, text) {
            var card = document.createElement('div');
            card.className = 'fs-card';

            var prev = document.createElement('div');
            prev.className = 'fs-preview';
            prev.textContent = fsStyleText(text, item.base, item.decor) || '—';

            var name = document.createElement('div');
            name.className = 'fs-name';
            name.textContent = item.name;

            var actions = document.createElement('div');
            actions.className = 'fs-card-actions';

            var copy = document.createElement('button');
            copy.type = 'button';
            copy.className = 'fs-copy';
            copy.textContent = 'Copy';
            copy.addEventListener('click', function () {
                var styled = fsStyleText(text, item.base, item.decor);
                if (navigator.clipboard && navigator.clipboard.writeText && styled) {
                    navigator.clipboard.writeText(styled).then(function () {
                        copy.textContent = 'Copied!';
                        setTimeout(function () { copy.textContent = 'Copy'; }, 1500);
                        pushRecent(item, styled);
                    }).catch(function () {});
                }
            });

            var star = document.createElement('button');
            star.type = 'button';
            star.className = 'fs-star' + (isFav(item.name) ? ' on' : '');
            star.textContent = isFav(item.name) ? '★' : '☆';
            star.title = 'Save to favourites';
            star.addEventListener('click', function () {
                if (isFav(item.name)) {
                    favs = favs.filter(function (n) { return n !== item.name; });
                    star.classList.remove('on'); star.textContent = '☆';
                } else {
                    favs.push(item.name);
                    star.classList.add('on'); star.textContent = '★';
                }
                fsStore('fg-fs-fav', favs);
            });

            actions.appendChild(copy);
            actions.appendChild(star);
            card.appendChild(prev);
            card.appendChild(name);
            card.appendChild(actions);
            return card;
        }

        function pushRecent(item, styled) {
            recent = recent.filter(function (r) { return r.name !== item.name; });
            recent.unshift({ name: item.name, text: styled });
            if (recent.length > 8) recent = recent.slice(0, 8);
            fsStore('fg-fs-recent', recent);
            renderRecent();
        }

        function renderRecent() {
            var el = container.querySelector('#fs-recent');
            if (!el) return;
            if (!recent.length) { el.innerHTML = ''; return; }
            el.innerHTML = '<h3 style="margin-bottom:.4rem;">Recently copied</h3>';
            recent.forEach(function (r) {
                var row = document.createElement('div');
                row.className = 'fs-recent-item';
                var t = document.createElement('span');
                t.className = 'fs-recent-txt';
                t.textContent = r.text;
                var b = document.createElement('button');
                b.type = 'button'; b.className = 'fs-copy'; b.textContent = 'Copy';
                b.addEventListener('click', function () {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(r.text).then(function () {
                            b.textContent = 'Copied!'; setTimeout(function () { b.textContent = 'Copy'; }, 1500);
                        }).catch(function () {});
                    }
                });
                row.appendChild(t); row.appendChild(b);
                el.appendChild(row);
            });
        }

        function getInput() {
            var el = container.querySelector('#fs-input');
            return el ? el.value : '';
        }

        function render() {
            var text = getInput();
            var frag = document.createDocumentFragment();
            for (var i = page * PAGE; i < Math.min(current.length, (page + 1) * PAGE); i++) {
                frag.appendChild(makeCard(current[i], text));
            }
            grid.appendChild(frag);
            moreBtn.style.display = ((page + 1) * PAGE < current.length) ? 'inline-block' : 'none';
        }

        function resetAndRender() {
            page = 0;
            grid.innerHTML = '';
            query = (searchEl && searchEl.value || '').toLowerCase().trim();
            current = items.filter(function (it) {
                if (filterCat !== 'All' && it.cat !== filterCat) return false;
                if (query && (it.name.toLowerCase().indexOf(query) === -1 && it.cat.toLowerCase().indexOf(query) === -1)) return false;
                return true;
            });
            render();
        }

        moreBtn.addEventListener('click', function () { page++; render(); });
        if (searchEl) {
            searchEl.addEventListener('input', function () { resetAndRender(); });
        }
        var plainBtn = container.querySelector('#fs-copy-plain');
        if (plainBtn) plainBtn.addEventListener('click', function () {
            var t = getInput();
            if (t && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(t).then(function () {
                    plainBtn.textContent = 'Copied!'; setTimeout(function () { plainBtn.textContent = 'Copy plain text'; }, 1500);
                }).catch(function () {});
            }
        });
        var clearBtn = container.querySelector('#fs-clear');
        if (clearBtn) clearBtn.addEventListener('click', function () {
            var el = container.querySelector('#fs-input');
            if (el) el.value = '';
            resetAndRender();
        });

        resetAndRender();
        renderRecent();
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
