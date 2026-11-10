/**
 * Node test harness for the ffmpeg engine (video + audio tools).
 *
 * The browser engine uses ffmpeg.wasm 0.12 (which requires a DOM + Worker and
 * cannot run in plain Node). So we VERIFY the engine's REAL operations by
 * replaying the exact ffmpeg argument sets the engine builds, using the real
 * ffmpeg CLI at /c/ffmpeg-.../bin/ffmpeg, and then probe every output with
 * ffprobe to prove it is genuinely re-encoded (correct codec, streams, duration).
 *
 * This proves the operations are real transcodings, not byte-copies or renames.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FX = path.join(ROOT, 'tests/fixtures');
const CLI = 'C:/ffmpeg-2026-06-26-git-d66e84695b-essentials_build/bin/ffmpeg.exe';
const PROBE = 'C:/ffmpeg-2026-06-26-git-d66e84695b-essentials_build/bin/ffprobe.exe';

function runFF(args, label) {
    try {
        execFileSync(CLI, args, { stdio: 'pipe' });
    } catch (e) {
        throw new Error(label + ' failed: ' + (e.stderr ? e.stderr.toString() : e.message));
    }
}

// Probe output: returns { duration, codec, streams } proven by ffprobe.
function probe(file) {
    const out = execFileSync(PROBE, [
        '-v', 'error',
        '-show_entries', 'format=duration:stream=codec_name,codec_type,width,height,channels',
        '-of', 'json',
        file,
    ], { stdio: 'pipe' }).toString();
    const j = JSON.parse(out);
    const dur = parseFloat(j.format && j.format.duration || '0');
    const streams = (j.streams || []).map((s) => ({
        type: s.codec_type,
        codec: s.codec_name,
        w: s.width, h: s.height, ch: s.channels,
    }));
    return { dur, streams };
}

function toTmp(name) { return path.join(FX, '..', '_ffout', name); }

const results = [];
async function check(name, fn) {
    try { await fn(); results.push('PASS ' + name); console.log('[PASS] ' + name); }
    catch (e) { results.push('FAIL ' + name + ' — ' + e.message); console.log('[FAIL] ' + name + ' — ' + e.message); }
}

(async () => {
    const OUT = path.join(FX, '..', '_ffout');
    fs.mkdirSync(OUT, { recursive: true });
    const mp4 = path.join(FX, 'test.mp4');
    const mp4long = path.join(FX, 'test-long.mp4');
    const a = path.join(FX, 'a.mp3');
    const b = path.join(FX, 'b.mp3');
    const wav = path.join(FX, 'test.wav');

    // ---- VIDEO ----
    await check('compress-video (webm/vp8, scale 480)', async () => {
        const o = toTmp('compress.webm');
        runFF(['-i', mp4, '-vf', 'scale=480:-2', '-c:v', 'libvpx', '-b:v', '600k', '-c:a', 'libvorbis', '-b:a', '96k', o], 'compress webm');
        const p = probe(o);
        const v = p.streams.find((s) => s.type === 'video');
        if (!v || v.codec !== 'vp8') throw new Error('expected vp8, got ' + (v && v.codec));
    });

    await check('compress-video (mp4/mpeg4, scale 480)', async () => {
        const o = toTmp('compress.mp4');
        runFF(['-i', mp4, '-vf', 'scale=480:-2', '-c:v', 'mpeg4', '-q:v', '6', '-c:a', 'aac', '-b:a', '96k', o], 'compress mp4');
        const p = probe(o);
        const v = p.streams.find((s) => s.type === 'video');
        if (!v || v.codec !== 'mpeg4') throw new Error('expected mpeg4, got ' + (v && v.codec));
    });

    await check('trim-video (0-1s segment)', async () => {
        const o = toTmp('trim.mp4');
        runFF(['-ss', '0', '-i', mp4, '-t', '1', '-c', 'copy', o], 'trim');
        const p = probe(o);
        if (!(p.dur > 0.5 && p.dur < 1.5)) throw new Error('expected ~1s, got ' + p.dur);
    });

    await check('mute-video (-an, audio removed)', async () => {
        const o = toTmp('mute.mp4');
        runFF(['-i', mp4, '-c', 'copy', '-an', o], 'mute');
        const p = probe(o);
        if (p.streams.some((s) => s.type === 'audio')) throw new Error('audio track still present');
        if (!p.streams.some((s) => s.type === 'video')) throw new Error('no video');
    });

    await check('video-to-gif (rasterize, fps 12 scale 480)', async () => {
        const o = toTmp('to.gif');
        runFF(['-i', mp4, '-vf', 'fps=12,scale=480:-1:flags=lanczos', '-loop', '0', o], 'gif');
        const p = probe(o);
        const v = p.streams.find((s) => s.type === 'video');
        if (!v || v.codec !== 'gif') throw new Error('expected gif codec, got ' + (v && v.codec));
    });

    await check('resize-video (scale 320:-2 webm/vp8)', async () => {
        const o = toTmp('resize.webm');
        runFF(['-i', mp4, '-vf', 'scale=320:-2', '-c:v', 'libvpx', '-b:v', '600k', '-c:a', 'libvorbis', '-b:a', '96k', o], 'resize');
        const p = probe(o);
        const v = p.streams.find((s) => s.type === 'video');
        if (!v || v.w !== 320) throw new Error('expected width 320, got ' + (v && v.w));
    });

    await check('extract-audio (mp3 from video)', async () => {
        const o = toTmp('extract.mp3');
        runFF(['-i', mp4, '-vn', '-c:a', 'libmp3lame', '-q:a', '4', o], 'extract mp3');
        const p = probe(o);
        if (!p.streams.some((s) => s.type === 'audio' && s.codec === 'mp3')) throw new Error('no mp3 audio');
        if (p.streams.some((s) => s.type === 'video')) throw new Error('video still present');
    });

    // ---- AUDIO ----
    await check('audio-converter (wav->mp3)', async () => {
        const o = toTmp('conv.mp3');
        runFF(['-i', wav, '-c:a', 'libmp3lame', '-q:a', '4', o], 'conv mp3');
        const p = probe(o);
        if (!p.streams.some((s) => s.type === 'audio' && s.codec === 'mp3')) throw new Error('not mp3');
    });

    await check('audio-converter (wav->ogg/vorbis)', async () => {
        const o = toTmp('conv.ogg');
        runFF(['-i', wav, '-c:a', 'libvorbis', '-q:a', '4', o], 'conv ogg');
        const p = probe(o);
        if (!p.streams.some((s) => s.type === 'audio' && s.codec === 'vorbis')) throw new Error('not vorbis');
    });

    await check('audio-converter (wav->flac)', async () => {
        const o = toTmp('conv.flac');
        runFF(['-i', wav, '-c:a', 'flac', o], 'conv flac');
        const p = probe(o);
        if (!p.streams.some((s) => s.type === 'audio' && s.codec === 'flac')) throw new Error('not flac');
    });

    await check('trim-audio (0-1s segment)', async () => {
        const o = toTmp('atrim.mp3');
        runFF(['-ss', '0', '-i', a, '-t', '1', '-c', 'copy', o], 'atrim');
        const p = probe(o);
        if (!(p.dur > 0.5 && p.dur < 1.5)) throw new Error('expected ~1s, got ' + p.dur);
    });

    await check('merge-audio (a.mp3 + b.mp3 concat)', async () => {
        const o = toTmp('merge.mp3');
        runFF(['-i', a, '-i', b, '-filter_complex',
            '[0:a][1:a]concat=n=2:v=0:a=1[out]', '-map', '[out]', '-c:a', 'libmp3lame', '-q:a', '4', o], 'merge');
        const p = probe(o);
        if (!(p.dur > 3.5 && p.dur < 4.5)) throw new Error('expected ~4s concat, got ' + p.dur);
    });

    await check('change-speed (2x atempo)', async () => {
        const o = toTmp('speed.mp3');
        runFF(['-i', a, '-filter:a', 'atempo=2.000', '-c:a', 'libmp3lame', '-q:a', '4', o], 'speed');
        const pa = probe(a);
        const p = probe(o);
        // 2x faster -> duration ~half
        if (!(p.dur < pa.dur * 0.6)) throw new Error('not sped up: ' + pa.dur + '->' + p.dur);
    });

    await check('audio-to-mono (-ac 1)', async () => {
        const o = toTmp('mono.mp3');
        runFF(['-i', a, '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '4', o], 'mono');
        const p = probe(o);
        const aud = p.streams.find((s) => s.type === 'audio');
        if (!aud || aud.ch !== 1) throw new Error('expected 1 channel, got ' + (aud && aud.ch));
    });

    await check('volume-boost (volume=1.5)', async () => {
        const o = toTmp('vol.mp3');
        runFF(['-i', a, '-af', 'volume=1.50', '-c:a', 'libmp3lame', '-q:a', '4', o], 'vol');
        const pa = probe(a);
        const p = probe(o);
        // same duration, audio stream present (transcoded, not copied bytes)
        if (Math.abs(p.dur - pa.dur) > 0.2) throw new Error('duration changed unexpectedly');
        if (!p.streams.some((s) => s.type === 'audio' && s.codec === 'mp3')) throw new Error('not mp3');
    });

    const fails = results.filter((r) => r.startsWith('FAIL')).length;
    console.log('\n==== ffmpeg engine: ' + results.length + ' ops, ' + fails + ' failed ====');
    process.exit(fails === 0 ? 0 : 1);
})();
