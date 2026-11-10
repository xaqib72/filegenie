export function getQualityProfile() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compact = window.matchMedia('(max-width: 720px)').matches;
    const memory = Number(navigator.deviceMemory || 4);
    const cores = Number(navigator.hardwareConcurrency || 4);

    let tier = 'high';
    if (compact || memory <= 4 || cores <= 4) tier = 'medium';
    if (memory <= 2 || cores <= 2) tier = 'low';

    const profiles = {
        high: { tier, dpr: 1.5, fps: 60, shadows: true, detail: 1 },
        medium: { tier, dpr: compact ? 1.2 : 1.35, fps: 45, shadows: false, detail: 0.82 },
        low: { tier, dpr: 1, fps: 30, shadows: false, detail: 0.62 },
    };

    return { ...profiles[tier], reducedMotion, compact };
}

export function supportsWebGL() {
    try {
        if (navigator.deviceMemory && Number(navigator.deviceMemory) <= 1) return false;
        const canvas = document.createElement('canvas');
        return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch (_) {
        return false;
    }
}
