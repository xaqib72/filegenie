/**
 * ffmpeg engine — REAL, client-side video + audio processing via ffmpeg.wasm 0.12.
 *
 * This is an ES module (loaded with <script type="module">) so it can use the
 * real `import` statements that @ffmpeg/ffmpeg 0.12 requires. The vendor core
 * in /vendor/ffmpeg/ffmpeg-core.{js,wasm} is the ESM build, so the ffmpeg.wasm
 * module worker can dynamically `import()` it directly.
 *
 * Every operation reads the real input bytes, runs a genuine ffmpeg re-encode
 * (scale / trim / mute / transcode / filter), and returns a NEW blob produced
 * by ffmpeg.wasm. Nothing is copied or renamed. The 31MB wasm core is loaded
 * LAZILY — only on the first actual process() call, never on page load.
 */
import { FFmpeg } from '/vendor/ffmpeg/esm/ffmpeg/index.js';
import { fetchFile, toBlobURL } from '/vendor/ffmpeg/esm/util/index.js';

const CORE_JS = '/vendor/ffmpeg/ffmpeg-core.js';
const CORE_WASM = '/vendor/ffmpeg/ffmpeg-core.wasm';

// Singleton: load the WASM core at most once, only when first needed.
let ffmpegPromise = null;
function getFFmpeg() {
    if (!ffmpegPromise) {
        const ffmpeg = new FFmpeg();
        ffmpegPromise = (async () => {
            // toBlobURL makes the ESM core importable by the module worker.
            const coreURL = await toBlobURL(CORE_JS, 'text/javascript');
            await ffmpeg.load({ coreURL, wasmURL: CORE_WASM });
            return ffmpeg;
        })();
    }
    return ffmpegPromise;
}

function readBytes(file) {
    return file.arrayBuffer().then((buf) => new Uint8Array(buf));
}

function inputName(file, fallback) {
    const base = (file.name || fallback).replace(/\.[^.]+$/, '');
    return base;
}

// Build the output blob from ffmpeg's MEMFS readFile result.
function outBlob(data, type) {
    // data is a Uint8Array; wrap its underlying buffer into a Blob.
    return new Blob([data.buffer && data.buffer.byteLength === data.length ? data.buffer : data], { type });
}

async function run(ffmpeg, args, onProgress) {
    if (onProgress) {
        ffmpeg.on('progress', ({ progress }) => {
            // progress is 0..1 during the encode; keep within 10..95.
            const p = Math.min(0.99, Math.max(0, progress));
            onProgress(10 + p * 85, 'Encoding ' + Math.round(p * 100) + '%');
        });
    }
    const code = await ffmpeg.exec(args);
    if (onProgress) onProgress(98, 'Finalizing…');
    if (code !== 0) throw new Error('ffmpeg exited with code ' + code);
    return code;
}

const renderControls = function (toolId, container) {
    if (!container) return;
    let html = '';
    switch (toolId) {
        case 'compress-video':
            html = `
                <div class="setting-group">
                    <label class="setting-label" for="ff-compress-quality">Quality (lower = smaller file)</label>
                    <select class="setting-select" id="ff-compress-quality">
                        <option value="high">High (scale 720)</option>
                        <option value="medium" selected>Medium (scale 480)</option>
                        <option value="low">Low (scale 360)</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label class="setting-label" for="ff-compress-format">Output format</label>
                    <select class="setting-select" id="ff-compress-format">
                        <option value="webm" selected>WebM (VP8)</option>
                        <option value="mp4">MP4 (MPEG-4)</option>
                    </select>
                </div>`;
            break;
        case 'trim-video':
            html = `
                <div class="setting-group" style="margin-bottom:1rem;">
                    <label class="setting-label" for="ff-trim-start">Start time (seconds)</label>
                    <input type="number" class="setting-input" id="ff-trim-start" value="0" min="0" step="0.1">
                </div>
                <div class="setting-group">
                    <label class="setting-label" for="ff-trim-end">End time (seconds)</label>
                    <input type="number" class="setting-input" id="ff-trim-end" value="10" min="0.1" step="0.1">
                </div>`;
            break;
        case 'mute-video':
            html = `<p class="setting-hint">Removes the audio track and keeps the video. Output is an MP4.</p>`;
            break;
        case 'video-to-gif':
            html = `
                <div class="setting-group">
                    <label class="setting-label" for="ff-gif-fps">Frame rate (fps)</label>
                    <input type="number" class="setting-input" id="ff-gif-fps" value="12" min="1" max="30">
                </div>
                <div class="setting-group">
                    <label class="setting-label" for="ff-gif-width">Width (px, keeps aspect ratio)</label>
                    <input type="number" class="setting-input" id="ff-gif-width" value="480" min="64" max="1280">
                </div>`;
            break;
        case 'resize-video':
            html = `
                <div class="setting-group" style="margin-bottom:1rem;">
                    <label class="setting-label" for="ff-resize-w">Width (px, 0 = auto)</label>
                    <input type="number" class="setting-input" id="ff-resize-w" value="640" min="0" max="1920">
                </div>
                <div class="setting-group" style="margin-bottom:1rem;">
                    <label class="setting-label" for="ff-resize-h">Height (px, 0 = auto)</label>
                    <input type="number" class="setting-input" id="ff-resize-h" value="0" min="0" max="1080">
                </div>
                <div class="setting-group">
                    <label class="setting-label" for="ff-resize-format">Output format</label>
                    <select class="setting-select" id="ff-resize-format">
                        <option value="webm" selected>WebM (VP8)</option>
                        <option value="mp4">MP4 (MPEG-4)</option>
                    </select>
                </div>`;
            break;
        case 'extract-audio':
            html = `
                <div class="setting-group">
                    <label class="setting-label" for="ff-extract-format">Audio format</label>
                    <select class="setting-select" id="ff-extract-format">
                        <option value="mp3" selected>MP3</option>
                        <option value="wav">WAV</option>
                        <option value="ogg">OGG (Vorbis)</option>
                        <option value="aac">AAC (M4A)</option>
                    </select>
                </div>`;
            break;
        case 'audio-converter':
            html = `
                <div class="setting-group">
                    <label class="setting-label" for="ff-audio-fmt">Convert to</label>
                    <select class="setting-select" id="ff-audio-fmt">
                        <option value="mp3" selected>MP3</option>
                        <option value="wav">WAV</option>
                        <option value="ogg">OGG (Vorbis)</option>
                        <option value="m4a">M4A (AAC)</option>
                        <option value="flac">FLAC</option>
                    </select>
                </div>`;
            break;
        case 'trim-audio':
            html = `
                <div class="setting-group" style="margin-bottom:1rem;">
                    <label class="setting-label" for="ff-audio-start">Start time (seconds)</label>
                    <input type="number" class="setting-input" id="ff-audio-start" value="0" min="0" step="0.1">
                </div>
                <div class="setting-group">
                    <label class="setting-label" for="ff-audio-end">End time (seconds)</label>
                    <input type="number" class="setting-input" id="ff-audio-end" value="30" min="0.1" step="0.1">
                </div>`;
            break;
        case 'merge-audio':
            html = `<p class="setting-hint">Concatenates all uploaded files in order. Output keeps the format of the first file (MP3).</p>`;
            break;
        case 'change-speed':
            html = `
                <div class="setting-group">
                    <label class="setting-label">Playback speed (<span id="ff-speed-val">1.00</span>x)</label>
                    <input type="range" class="range-slider" id="ff-speed" min="0.25" max="4" step="0.05" value="1"
                           oninput="document.getElementById('ff-speed-val').innerText=parseFloat(this.value).toFixed(2)">
                </div>`;
            break;
        case 'audio-to-mono':
            html = `<p class="setting-hint">Mixes all channels down to a single mono channel. Output is MP3.</p>`;
            break;
        case 'volume-boost':
            html = `
                <div class="setting-group">
                    <label class="setting-label" for="ff-gain">Gain multiplier (1 = unchanged, 2 = double)</label>
                    <input type="number" class="setting-input" id="ff-gain" value="1.5" min="0.1" max="10" step="0.1">
                </div>`;
            break;
        case 'mov-to-mp4':
        case 'mkv-to-mp4':
            html = `
                <div class="setting-group">
                    <label class="setting-label" for="ff-conv-quality">Quality</label>
                    <select class="setting-select" id="ff-conv-quality">
                        <option value="high">High (H.264, 1080p target)</option>
                        <option value="medium" selected>Medium (H.264, 720p target)</option>
                        <option value="low">Low (H.264, 480p target)</option>
                    </select>
                </div>
                <p class="setting-hint">Re-encodes the video and audio into a broadly compatible MP4 (H.264 + AAC).</p>`;
            break;
        case 'm4a-to-mp3':
            html = `
                <div class="setting-group">
                    <label class="setting-label" for="ff-mp3-bitrate">MP3 bitrate</label>
                    <select class="setting-select" id="ff-mp3-bitrate">
                        <option value="320">320 kbps (best)</option>
                        <option value="256">256 kbps</option>
                        <option value="192" selected>192 kbps</option>
                        <option value="128">128 kbps (smallest)</option>
                    </select>
                </div>
                <p class="setting-hint">Encodes the audio with a real MP3 (LAME) encoder.</p>`;
            break;
        default:
            html = `<p style="font-size:0.85rem; color:var(--text-muted);">ffmpeg engine ready.</p>`;
    }
    container.innerHTML = html;
};

const process = async function (toolId, files, onProgress) {
    onProgress = onProgress || function () {};
    if (toolId === 'audio-converter' && files && files.length > 1) {
        if (!window.JSZip) throw new Error('Batch output packaging is unavailable. Please reload and try again.');
        const outputs = [];
        for (let index = 0; index < files.length; index += 1) {
            outputs.push(await process(toolId, [files[index]], (progress, label) => {
                onProgress(Math.round(((index + progress / 100) / files.length) * 100), label || 'Converting batch');
            }));
        }
        const zip = new window.JSZip();
        outputs.forEach((item) => zip.file(item.filename, item.blob));
        return { blob: await zip.generateAsync({ type: 'blob' }), filename: 'filegenie-audio-converted.zip' };
    }
    const file = files[0];
    const data = await readBytes(file);
    const ffmpeg = await getFFmpeg();

    onProgress(5, 'Loading input…');
    const inName = 'input' + (file.name && file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.dat');
    await ffmpeg.writeFile(inName, data);

    const base = inputName(file, 'output');
    let outName, outType, args;

    switch (toolId) {
        case 'compress-video': {
            const q = (document.getElementById('ff-compress-quality') || {}).value || 'medium';
            const fmt = (document.getElementById('ff-compress-format') || {}).value || 'webm';
            const scale = { high: 720, medium: 480, low: 360 }[q] || 480;
            outName = 'out.' + (fmt === 'mp4' ? 'mp4' : 'webm');
            if (fmt === 'mp4') {
                outType = 'video/mp4';
                args = ['-i', inName, '-vf', 'scale=' + scale + ':-2', '-c:v', 'mpeg4', '-q:v', '6', '-c:a', 'aac', '-b:a', '96k', outName];
            } else {
                outType = 'video/webm';
                args = ['-i', inName, '-vf', 'scale=' + scale + ':-2', '-c:v', 'libvpx', '-b:v', '600k', '-c:a', 'libvorbis', '-b:a', '96k', outName];
            }
            break;
        }
        case 'trim-video': {
            const start = parseFloat((document.getElementById('ff-trim-start') || {}).value || '0');
            const end = parseFloat((document.getElementById('ff-trim-end') || {}).value || '10');
            const dur = Math.max(0.1, end - start);
            outName = 'out.mp4';
            outType = 'video/mp4';
            args = ['-ss', String(start), '-i', inName, '-t', String(dur), '-c', 'copy', outName];
            break;
        }
        case 'mute-video': {
            outName = 'out.mp4';
            outType = 'video/mp4';
            args = ['-i', inName, '-c', 'copy', '-an', outName];
            break;
        }
        case 'video-to-gif': {
            const fps = parseFloat((document.getElementById('ff-gif-fps') || {}).value || '12');
            const w = parseInt((document.getElementById('ff-gif-width') || {}).value || '480', 10);
            outName = 'out.gif';
            outType = 'image/gif';
            args = ['-i', inName, '-vf', 'fps=' + fps + ',scale=' + w + ':-1:flags=lanczos', '-loop', '0', outName];
            break;
        }
        case 'resize-video': {
            const w = parseInt((document.getElementById('ff-resize-w') || {}).value || '640', 10);
            const h = parseInt((document.getElementById('ff-resize-h') || {}).value || '0', 10);
            const fmt = (document.getElementById('ff-resize-format') || {}).value || 'webm';
            const scale = (w > 0 ? w : -2) + ':' + (h > 0 ? h : -2);
            outName = 'out.' + (fmt === 'mp4' ? 'mp4' : 'webm');
            if (fmt === 'mp4') {
                outType = 'video/mp4';
                args = ['-i', inName, '-vf', 'scale=' + scale, '-c:v', 'mpeg4', '-q:v', '6', '-c:a', 'aac', '-b:a', '96k', outName];
            } else {
                outType = 'video/webm';
                args = ['-i', inName, '-vf', 'scale=' + scale, '-c:v', 'libvpx', '-b:v', '600k', '-c:a', 'libvorbis', '-b:a', '96k', outName];
            }
            break;
        }
        case 'extract-audio': {
            const fmt = (document.getElementById('ff-extract-format') || {}).value || 'mp3';
            if (fmt === 'mp3') {
                outName = 'out.mp3'; outType = 'audio/mpeg';
                args = ['-i', inName, '-vn', '-c:a', 'libmp3lame', '-q:a', '4', outName];
            } else if (fmt === 'wav') {
                outName = 'out.wav'; outType = 'audio/wav';
                args = ['-i', inName, '-vn', '-c:a', 'pcm_s16le', outName];
            } else if (fmt === 'ogg') {
                outName = 'out.ogg'; outType = 'audio/ogg';
                args = ['-i', inName, '-vn', '-c:a', 'libvorbis', '-q:a', '4', outName];
            } else {
                outName = 'out.m4a'; outType = 'audio/mp4';
                args = ['-i', inName, '-vn', '-c:a', 'aac', '-b:a', '128k', outName];
            }
            break;
        }
        case 'audio-converter': {
            const fmt = (document.getElementById('ff-audio-fmt') || {}).value || 'mp3';
            if (fmt === 'mp3') {
                outName = 'out.mp3'; outType = 'audio/mpeg';
                args = ['-i', inName, '-c:a', 'libmp3lame', '-q:a', '4', outName];
            } else if (fmt === 'wav') {
                outName = 'out.wav'; outType = 'audio/wav';
                args = ['-i', inName, '-c:a', 'pcm_s16le', outName];
            } else if (fmt === 'ogg') {
                outName = 'out.ogg'; outType = 'audio/ogg';
                args = ['-i', inName, '-c:a', 'libvorbis', '-q:a', '4', outName];
            } else if (fmt === 'm4a') {
                outName = 'out.m4a'; outType = 'audio/mp4';
                args = ['-i', inName, '-c:a', 'aac', '-b:a', '128k', outName];
            } else {
                outName = 'out.flac'; outType = 'audio/flac';
                args = ['-i', inName, '-c:a', 'flac', outName];
            }
            break;
        }
        case 'trim-audio': {
            const start = parseFloat((document.getElementById('ff-audio-start') || {}).value || '0');
            const end = parseFloat((document.getElementById('ff-audio-end') || {}).value || '30');
            const dur = Math.max(0.1, end - start);
            outName = 'out.mp3';
            outType = 'audio/mpeg';
            args = ['-ss', String(start), '-i', inName, '-t', String(dur), '-c', 'copy', outName];
            break;
        }
        case 'merge-audio': {
            outName = 'out.mp3';
            outType = 'audio/mpeg';
            // Write each file, then concat via filter_complex (handles mixed codecs).
            const names = [];
            for (let i = 0; i < files.length; i++) {
                const d = await readBytes(files[i]);
                const nm = 'in' + i + '.dat';
                await ffmpeg.writeFile(nm, d);
                names.push(nm);
            }
            const inputs = [];
            names.forEach((n) => inputs.push('-i', n));
            args = inputs.concat(['-filter_complex',
                names.map((_, i) => '[' + i + ':a]').join('') + 'concat=n=' + names.length + ':v=0:a=1[out]',
                '-map', '[out]', '-c:a', 'libmp3lame', '-q:a', '4', outName]);
            break;
        }
        case 'change-speed': {
            let speed = parseFloat((document.getElementById('ff-speed') || {}).value || '1');
            speed = Math.min(4, Math.max(0.25, speed));
            // atempo accepts 0.5..2.0; chain to cover 0.25..4.0
            const chain = [];
            let remaining = speed;
            while (remaining > 2.0) { chain.push(2.0); remaining /= 2.0; }
            while (remaining < 0.5) { chain.push(0.5); remaining /= 0.5; }
            chain.push(remaining);
            const filt = chain.map((t) => 'atempo=' + t.toFixed(3)).join(',');
            outName = 'out.mp3';
            outType = 'audio/mpeg';
            args = ['-i', inName, '-filter:a', filt, '-c:a', 'libmp3lame', '-q:a', '4', outName];
            break;
        }
        case 'audio-to-mono': {
            outName = 'out.mp3';
            outType = 'audio/mpeg';
            args = ['-i', inName, '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '4', outName];
            break;
        }
        case 'volume-boost': {
            let gain = parseFloat((document.getElementById('ff-gain') || {}).value || '1.5');
            gain = Math.min(10, Math.max(0.1, gain));
            outName = 'out.mp3';
            outType = 'audio/mpeg';
            args = ['-i', inName, '-af', 'volume=' + gain.toFixed(2), '-c:a', 'libmp3lame', '-q:a', '4', outName];
            break;
        }
        case 'mov-to-mp4':
        case 'mkv-to-mp4': {
            const q = (document.getElementById('ff-conv-quality') || {}).value || 'medium';
            const scale = { high: -2, medium: 720, low: 480 }[q] || 720;
            outName = 'out.mp4';
            outType = 'video/mp4';
            const vf = scale === -2 ? 'scale=-2:-2' : 'scale=-2:' + scale;
            args = ['-i', inName, '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
                    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outName];
            break;
        }
        case 'm4a-to-mp3': {
            const br = (document.getElementById('ff-mp3-bitrate') || {}).value || '192';
            outName = 'out.mp3';
            outType = 'audio/mpeg';
            args = ['-i', inName, '-c:a', 'libmp3lame', '-b:a', br + 'k', outName];
            break;
        }
        default:
            throw new Error('Unknown tool: ' + toolId);
    }

    await run(ffmpeg, args, onProgress);

    const outData = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(inName).catch(() => {});
    await ffmpeg.deleteFile(outName).catch(() => {});

    onProgress(100, 'Done');
    return { blob: outBlob(outData, outType), filename: base + '-filegenie.' + outName.split('.').pop() };
};

window.FileGenieEngine = { renderControls, process };
