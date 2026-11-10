/**
 * FileGenie workspace orchestrator.
 *
 * Drives the tool workspace markup in app/Views/tool/show.php:
 *   upload -> file queue -> engine.renderControls -> process -> progress -> download
 *
 * The engine contract (window.FileGenieEngine) is provided per tool page by an
 * engine script (/assets/js/engines/{engine}-engine.js) and MUST implement:
 *   renderControls(toolId, settingsContainer)
 *   async process(toolId, files, onProgress) -> { blob, filename }
 */
(function () {
    'use strict';

    var Workspace = {
        ws: null,
        toolId: null,
        engineName: null,
        batch: false,
        files: [],
        downloadUrl: null,

        init: function () {
            this.ws = document.getElementById('workspace');
            if (!this.ws) return;

            this.toolId = this.ws.dataset.toolId;
            this.engineName = this.ws.dataset.engine;
            this.batch = this.ws.dataset.batch === '1';

            this.upload = document.getElementById('ws-upload');
            this.active = document.getElementById('ws-active');
            this.dropzone = document.getElementById('dropzone');
            this.fileInput = document.getElementById('file-input');
            this.queue = document.getElementById('file-queue');
            this.settings = document.getElementById('settings-panel');
            this.processBtn = document.getElementById('process-btn');
            this.resetBtn = document.getElementById('reset-btn');
            this.progress = document.getElementById('progress');
            this.progressFill = document.getElementById('progress-fill');
            this.progressLabel = document.getElementById('progress-label');
            this.result = document.getElementById('result');
            this.resultMsg = document.getElementById('result-msg');
            this.downloadBtn = document.getElementById('download-btn');
            this.errorBox = document.getElementById('ws-error');

            this.bind();

            // No-file tools (generators, etc.) need the workspace controls and
            // Process button available immediately — there is nothing to upload.
            if (!this.needsFiles()) {
                this.files = this.files || [];
                this.showActive();
                this.renderControls();
            }
        },

        bind: function () {
            var self = this;

            if (this.fileInput) {
                this.fileInput.addEventListener('change', function (e) {
                    if (e.target.files && e.target.files.length) {
                        self.addFiles(e.target.files);
                    }
                });
            }

            if (this.dropzone) {
                this.dropzone.addEventListener('click', function () {
                    if (self.fileInput) self.fileInput.click();
                });
                this.dropzone.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (self.fileInput) self.fileInput.click();
                    }
                });
                ['dragenter', 'dragover'].forEach(function (evt) {
                    self.dropzone.addEventListener(evt, function (e) {
                        e.preventDefault();
                        self.dropzone.classList.add('drag-over');
                    });
                });
                ['dragleave', 'dragend'].forEach(function (evt) {
                    self.dropzone.addEventListener(evt, function () {
                        self.dropzone.classList.remove('drag-over');
                    });
                });
                this.dropzone.addEventListener('drop', function (e) {
                    e.preventDefault();
                    self.dropzone.classList.remove('drag-over');
                    if (e.dataTransfer && e.dataTransfer.files.length) {
                        self.addFiles(e.dataTransfer.files);
                    }
                });
            }

            if (this.processBtn) {
                this.processBtn.addEventListener('click', function () { self.process(); });
            }
            if (this.resetBtn) {
                this.resetBtn.addEventListener('click', function () { self.reset(); });
            }
        },

        addFiles: function (fileList) {
            var incoming = Array.prototype.slice.call(fileList);
            // Large-file warning: anything over the threshold still works (all
            // processing is local), but we flag that it may be slow on low-end
            // devices so the user isn't surprised by a long wait.
            var LARGE_FILE_BYTES = 100 * 1024 * 1024; // 100 MB
            var tooLarge = incoming.filter(function (f) { return f.size > LARGE_FILE_BYTES; });
            if (!this.batch) {
                // Single-file tools keep only the latest selection.
                this.files = incoming.slice(0, 1);
            } else {
                this.files = this.files.concat(incoming);
            }
            this.renderQueue();
            this.showActive();
            this.renderControls();
            if (tooLarge.length) {
                var names = tooLarge.map(function (f) { return f.name; }).join(', ');
                this.showError('Large file detected (' + names + '). It will be processed entirely in your browser, but may take a while on slower devices.');
            }
        },

        renderQueue: function () {
            if (!this.queue) return;
            var self = this;
            if (!this.files.length) {
                this.queue.innerHTML = '';
                return;
            }
            this.queue.innerHTML = this.files.map(function (f, i) {
                var size = f.size / 1024;
                var sizeLabel = size < 1024 ? size.toFixed(1) + ' KB' : (size / 1024).toFixed(2) + ' MB';
                var orderControls = self.batch ?
                    '<span class="fr-order" role="group" aria-label="Reorder ' + escapeHtml(f.name) + '">' +
                    '<button type="button" class="fr-move" data-move="up" data-i="' + i + '" aria-label="Move ' + escapeHtml(f.name) + ' up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
                    '<button type="button" class="fr-move" data-move="down" data-i="' + i + '" aria-label="Move ' + escapeHtml(f.name) + ' down"' + (i === self.files.length - 1 ? ' disabled' : '') + '>↓</button>' +
                    '</span>' : '';
                return '<div class="file-row" draggable="' + (self.batch ? 'true' : 'false') + '">' +
                    '<span class="fr-icon" aria-hidden="true">📄</span>' +
                    '<span class="fr-name">' + escapeHtml(f.name) + '</span>' +
                    '<span class="fr-size">' + sizeLabel + '</span>' +
                    orderControls +
                    '<button type="button" class="fr-remove" data-i="' + i + '" aria-label="Remove ' + escapeHtml(f.name) + '">×</button>' +
                    '</div>';
            }).join('');

            Array.prototype.forEach.call(this.queue.querySelectorAll('.fr-remove'), function (btn) {
                btn.addEventListener('click', function () {
                    self.removeFile(parseInt(btn.dataset.i, 10));
                });
            });
            Array.prototype.forEach.call(this.queue.querySelectorAll('.fr-move'), function (btn) {
                btn.addEventListener('click', function () {
                    self.moveFile(parseInt(btn.dataset.i, 10), btn.dataset.move === 'up' ? -1 : 1);
                });
            });
        },

        moveFile: function (index, delta) {
            var target = index + delta;
            if (target < 0 || target >= this.files.length) return;
            var moved = this.files.splice(index, 1)[0];
            this.files.splice(target, 0, moved);
            this.renderQueue();
        },

        removeFile: function (index) {
            this.files.splice(index, 1);
            if (!this.files.length) {
                this.reset();
            } else {
                this.renderQueue();
            }
        },

        renderControls: function () {
            if (!this.settings) return;
            if (window.FileGenieEngine && typeof window.FileGenieEngine.renderControls === 'function') {
                try {
                    window.FileGenieEngine.renderControls(this.toolId, this.settings);
                } catch (err) {
                    this.settings.innerHTML = '';
                }
            } else {
                this.settings.innerHTML = '';
            }
        },

        showActive: function () {
            if (this.upload) this.upload.hidden = true;
            if (this.active) this.active.hidden = false;
            this.clearError();
            this.hideResult();
        },

        showError: function (msg) {
            if (!this.errorBox) return;
            this.errorBox.textContent = msg;
            this.errorBox.hidden = false;
            if (this.progress) this.progress.hidden = true;
        },

        clearError: function () {
            if (this.errorBox) {
                this.errorBox.textContent = '';
                this.errorBox.hidden = true;
            }
        },

        hideResult: function () {
            if (this.result) {
                this.result.hidden = true;
                this.result.classList.remove('is-shown');
            }
        },

        setProgress: function (percent, label) {
            if (this.progress) this.progress.hidden = false;
            if (this.progressFill) this.progressFill.style.width = Math.max(0, Math.min(100, percent)) + '%';
            var progressBar = this.progress && this.progress.querySelector('[role="progressbar"]');
            if (progressBar) progressBar.setAttribute('aria-valuenow', String(Math.round(Math.max(0, Math.min(100, percent)))));
            if (this.progressLabel && label) this.progressLabel.textContent = label;
        },

        needsFiles: function () {
            // No-file engines: generators that build output from controls only.
            if (this.engineName === 'text') return false;
            if (this.engineName === 'barcode') return false; // barcode-generator
            if (this.engineName === 'ip') return false;      // what-is-my-ip
            // Utility tools that generate output with no file input.
            return !(this.toolId === 'password-generator' || this.toolId === 'qr-code-generator' || this.toolId === 'color-picker' || this.toolId === 'base64-tool');
        },

        process: function () {
            var self = this;
            if (this.needsFiles() && !this.files.length) {
                this.showError('Please add at least one file to continue.');
                return;
            }

            if (!window.FileGenieEngine || typeof window.FileGenieEngine.process !== 'function') {
                this.showError('This tool is not available right now. Please try again later.');
                return;
            }

            if (this.progress) this.progress.hidden = false;
            if (this.processBtn) this.processBtn.disabled = true;
            this.setProgress(5, 'Starting…');
            this.clearError();

            var onProgress = function (p, label) {
                self.setProgress(p, label || ('Working… ' + Math.round(p) + '%'));
            };

            window.FileGenieEngine.process(self.toolId, self.files, onProgress)
                .then(function (result) {
                    if (!result || !result.blob) {
                        throw new Error('The tool returned no output.');
                    }
                    self.showResult(result);
                })
                .catch(function (err) {
                    var msg = (err && err.message) ? err.message : 'Processing failed. Please try again.';
                    self.showError('Something went wrong: ' + msg);
                })
                .finally(function () {
                    if (self.processBtn) self.processBtn.disabled = false;
                });
        },

        showResult: function (result) {
            if (this.progress) this.progress.hidden = true;
            this.hideResult();

            if (this.downloadUrl) {
                URL.revokeObjectURL(this.downloadUrl);
                this.downloadUrl = null;
            }

            var url = URL.createObjectURL(result.blob);
            this.downloadUrl = url;

            if (this.downloadBtn) {
                this.downloadBtn.href = url;
                this.downloadBtn.download = result.filename || 'filegenie-result';
            }
            if (this.resultMsg) {
                this.resultMsg.textContent = 'Your file is ready. Download it below — it never left your device.';
            }
            if (this.result) {
                this.result.hidden = false;
                var result = this.result;
                requestAnimationFrame(function () { result.classList.add('is-shown'); });
            }

            this.recordRecent();
        },

        recordRecent: function () {
            try {
                if (window.FileGenieStorage && typeof window.FileGenieStorage.addRecent === 'function') {
                    window.FileGenieStorage.addRecent({ id: this.toolId });
                }
            } catch (e) {}
        },

        reset: function () {
            this.files = [];
            if (this.fileInput) this.fileInput.value = '';
            if (this.queue) this.queue.innerHTML = '';
            if (this.settings) this.settings.innerHTML = '';
            this.clearError();
            this.hideResult();
            if (this.progress) this.progress.hidden = true;
            if (this.progressFill) this.progressFill.style.width = '0%';
            var progressBar = this.progress && this.progress.querySelector('[role="progressbar"]');
            if (progressBar) progressBar.setAttribute('aria-valuenow', '0');
            if (this.downloadUrl) {
                URL.revokeObjectURL(this.downloadUrl);
                this.downloadUrl = null;
            }
            if (this.active) this.active.hidden = true;
            if (this.upload) this.upload.hidden = false;
        }
    };

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        Workspace.init();
    });

    window.FileGenieWorkspace = Workspace;
})();

/* Favourites: per-tool "Save" toggle backed by FileGenieStorage. */
(function () {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('fav-toggle');
        if (!btn || !window.FileGenieStorage) return;

        var id = btn.dataset.toolId;
        var tool = {
            id: id,
            name: btn.dataset.toolName,
            category: btn.dataset.toolCategory,
            slug: btn.dataset.toolSlug,
        };

        function render() {
            var on = window.FileGenieStorage.isFavourite(id);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            btn.classList.toggle('is-favourite', on);
            var star = btn.querySelector('.fav-star');
            var label = btn.querySelector('.fav-label');
            if (star) star.textContent = on ? '★' : '☆';
            if (label) label.textContent = on ? 'Saved' : 'Save';
        }

        btn.addEventListener('click', function () {
            if (window.FileGenieStorage.isFavourite(id)) {
                window.FileGenieStorage.removeFavourite(id);
            } else {
                window.FileGenieStorage.addFavourite(tool);
            }
            render();
        });

        render();
    });
})();
