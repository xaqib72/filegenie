/**
 * PDF Secure engine — REAL, client-side PDF encryption & decryption.
 *
 * protect-pdf: applies genuine AES (RC4/AESV2 depending on revision) encryption
 *   using the vendored pdf-lib fork's save({ userPassword, ownerPassword,
 *   permissions }). The password is written into the file's /Encrypt dictionary
 *   (AES-CBC), exactly as a reader expects. Opening the file without the password
 *   is blocked by the encryption at the format level — not faked via filename or
 *   metadata.
 *
 * unlock-pdf: loads a password-protected PDF WITH the user-supplied password
 *   (verified by the decryptor), then re-saves it without a password. If the
 *   password is wrong the decryptor throws and we surface an error — we never
 *   bypass unknown passwords.
 *
 * This tool is only useful for PDFs the user is authorized to unlock.
 */
(function () {
    'use strict';

    var PDFLib = window.PDFLib;
    if (!PDFLib) {
        window.FileGenieEngine = {
            renderControls: function (id, c) {
                if (c) c.innerHTML = '<p class="setting-hint">PDF security library failed to load.</p>';
            },
            process: function () { throw new Error('PDF security library failed to load.'); }
        };
        return;
    }
    var PDFDocument = PDFLib.PDFDocument;

    function readBytes(file) {
        return file.arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
    }

    function toBlob(bytes) {
        return new Blob([bytes.buffer && bytes.buffer.byteLength === bytes.length ? bytes.buffer : bytes], { type: 'application/pdf' });
    }

    function base(file) {
        return (file.name || 'document').replace(/\.[^.]+$/, '');
    }

    function renderControls(toolId, container) {
        if (!container) return;
        var h = '';
        if (toolId === 'protect-pdf') {
            h = `
                <div class="setting-group">
                    <label class="setting-label" for="sec-open-pw">Open password (required)</label>
                    <input type="password" class="setting-input" id="sec-open-pw" placeholder="Password needed to open the file" autocomplete="new-password">
                </div>
                <div class="setting-group">
                    <label class="setting-label" for="sec-owner-pw">Owner password (optional)</label>
                    <input type="password" class="setting-input" id="sec-owner-pw" placeholder="Restricts permissions" autocomplete="new-password">
                </div>
                <div class="setting-group">
                    <label class="setting-label" for="sec-perm">Allowed permissions when opened</label>
                    <select class="setting-select" id="sec-perm">
                        <option value="all">Allow printing &amp; copying</option>
                        <option value="print">Allow printing only</option>
                        <option value="none">Lock everything (no print/copy)</option>
                    </select>
                </div>
                <p class="setting-hint">The password is encrypted into the PDF using the standard /Encrypt dictionary. The file cannot be opened without it.</p>`;
        } else if (toolId === 'unlock-pdf') {
            h = `
                <div class="setting-group">
                    <label class="setting-label" for="sec-unlock-pw">Current password</label>
                    <input type="password" class="setting-input" id="sec-unlock-pw" placeholder="Enter the password for this PDF" autocomplete="off">
                </div>
                <p class="setting-hint">Provide the correct password. The PDF is decrypted locally and re-saved without protection. Only use this on files you are authorized to unlock.</p>`;
        } else {
            h = '<p class="setting-hint">This tool is not configured.</p>';
        }
        container.innerHTML = h;
    }

    async function process(toolId, files, onProgress) {
        onProgress = onProgress || function () {};
        if (!files || !files.length) throw new Error('Please add a PDF first.');
        onProgress(10, 'Reading PDF…');
        var bytes = await readBytes(files[0]);

        if (toolId === 'protect-pdf') {
            var openPw = (document.getElementById('sec-open-pw') || {}).value || '';
            if (!openPw) throw new Error('Set an open password to protect the PDF.');
            var ownerPw = (document.getElementById('sec-owner-pw') || {}).value || '';
            var perm = (document.getElementById('sec-perm') || {}).value || 'all';
            onProgress(40, 'Encrypting PDF…');
            var doc = await PDFDocument.load(bytes);
            // This pdf-lib fork encrypts only via doc.encrypt(options); save()
            // ignores password params on its own. Apply the /Encrypt dictionary
            // with a genuine AES-256 user password + optional owner/permissions.
            var permList = perm === 'all'
                ? ['Printing', 'Copying', 'Modifying', 'Annotating', 'FillingForms', 'Assembling']
                : perm === 'print'
                    ? ['Printing']
                    : [];
            var encOpts = { userPassword: openPw, permissions: permList };
            if (ownerPw) encOpts.ownerPassword = ownerPw;
            doc.encrypt(encOpts);
            var out = await doc.save();
            onProgress(100, 'Done');
            return { blob: toBlob(out), filename: base(files[0]) + '-protected.pdf' };
        }

        if (toolId === 'unlock-pdf') {
            var pw = (document.getElementById('sec-unlock-pw') || {}).value || '';
            if (!pw) throw new Error('Enter the current password to unlock the PDF.');
            onProgress(40, 'Decrypting PDF…');
            var loaded;
            try {
                loaded = await PDFDocument.load(bytes, { password: pw });
            } catch (e) {
                throw new Error('Could not decrypt this PDF. The password is incorrect or the file is unsupported.');
            }
            // Re-saving an AES-256 doc in this fork keeps the /Encrypt context,
            // so instead rebuild the pages into a brand-new (unencrypted) doc.
            // This genuinely removes the password — the output opens with no
            // password and no secret key attached.
            var fresh = await PDFDocument.create();
            var srcPages = await fresh.copyPages(loaded, loaded.getPageIndices());
            for (var pi = 0; pi < srcPages.length; pi++) fresh.addPage(srcPages[pi]);
            var unlocked = await fresh.save();
            onProgress(100, 'Done');
            return { blob: toBlob(unlocked), filename: base(files[0]) + '-unlocked.pdf' };
        }

        throw new Error('Unknown tool: ' + toolId);
    }

    window.FileGenieEngine = { renderControls: renderControls, process: process };
})();
