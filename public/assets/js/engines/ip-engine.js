/**
 * What Is My IP engine.
 *
 * Displays the public IP address observed by our server (via the local
 * /api/ip endpoint, which reads REMOTE_ADDR / X-Forwarded-For). NO third-party
 * geolocation service, no city/country/ISP lookup — only what the request itself
 * carries. Copy / Refresh / Clear controls. This is a no-file tool.
 */
(function () {
    'use strict';

    function get(id) { return document.getElementById(id); }

    function renderControls(toolId, container) {
        if (!container) return;
        container.innerHTML =
            '<div class="ip-card" id="ip-card">' +
            '  <div class="ip-row"><span class="ip-label">IP address</span><span class="ip-value" id="ip-address">—</span></div>' +
            '  <div class="ip-row"><span class="ip-label">Version</span><span class="ip-value" id="ip-version">—</span></div>' +
            '  <div class="ip-row"><span class="ip-label">User-Agent</span><span class="ip-value ip-ua" id="ip-ua">—</span></div>' +
            '  <div class="ip-row"><span class="ip-label">Protocol</span><span class="ip-value" id="ip-protocol">—</span></div>' +
            '  <div class="ip-row"><span class="ip-label">Remote address</span><span class="ip-value" id="ip-remote">—</span></div>' +
            '</div>' +
            '<p class="setting-hint" id="ip-note" style="margin-top:1rem;"></p>' +
            '<div class="ip-actions">' +
            '  <button type="button" class="btn btn-primary" id="ip-copy">Copy IP</button>' +
            '  <button type="button" class="btn btn-ghost" id="ip-refresh">Refresh</button>' +
            '  <button type="button" class="btn btn-ghost" id="ip-clear">Clear</button>' +
            '</div>';

        var copyBtn = get('ip-copy');
        var refreshBtn = get('ip-refresh');
        var clearBtn = get('ip-clear');
        if (copyBtn) copyBtn.onclick = function () { copyIp(copyBtn); };
        if (refreshBtn) refreshBtn.onclick = function () { loadIp(true); };
        if (clearBtn) clearBtn.onclick = function () { clearIp(); };

        // Auto-load on render.
        loadIp(false);
    }

    function loadIp(showProgress) {
        fetch('/api/ip', { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (data) { renderIp(data); })
            .catch(function () {
                var addr = get('ip-address');
                if (addr) addr.textContent = 'Could not read your IP.';
            });
    }

    function renderIp(data) {
        if (!data) return;
        setText('ip-address', data.ip || '—');
        setText('ip-version', data.version || '—');
        setText('ip-ua', data.userAgent || '—');
        setText('ip-protocol', data.protocol || '—');
        setText('ip-remote', data.remoteAddr || '—');
        setText('ip-note', data.note || '');
    }

    function setText(id, val) {
        var el = get(id);
        if (el) el.textContent = val;
    }

    function clearIp() {
        ['ip-address', 'ip-version', 'ip-ua', 'ip-protocol', 'ip-remote'].forEach(function (id) {
            setText(id, '—');
        });
        setText('ip-note', 'Cleared. Click Refresh to read it again.');
    }

    function copyIp(btn) {
        var ip = (get('ip-address') || {}).textContent || '';
        if (!ip || ip === '—') return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(ip).then(function () {
                btn.textContent = 'Copied!';
                setTimeout(function () { btn.textContent = 'Copy IP'; }, 1500);
            }).catch(function () {});
        }
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        onProgress(40, 'Reading your IP…');
        var resp = await fetch('/api/ip', { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
        var data = await resp.json();
        renderIp(data);
        onProgress(100, 'Done');
        var text = 'IP Address: ' + (data.ip || '') + '\n' +
            'Version: ' + (data.version || '') + '\n' +
            'User-Agent: ' + (data.userAgent || '') + '\n' +
            'Protocol: ' + (data.protocol || '') + '\n' +
            'Remote Address: ' + (data.remoteAddr || '');
        return { blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), filename: 'filegenie-my-ip.txt' };
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
