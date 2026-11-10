const stages = [...document.querySelectorAll('[data-fg-3d-scene]')];

if (stages.length) {
    const runtimes = [];
    let runtimeModule;
    const loadStage = async (stage) => {
        if (stage.dataset.fg3dLoaded) return;
        stage.dataset.fg3dLoaded = '1';
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const lowPower = navigator.connection?.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
        const canvas = document.createElement('canvas');
        const webglAvailable = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
        if (reducedMotion || lowPower || !webglAvailable) {
            stage.dataset.fg3dState = reducedMotion ? 'reduced-motion' : 'fallback';
            return;
        }
        try {
            runtimeModule ||= import('./ThreeRuntime.js?v=6');
            const { ThreeRuntime } = await runtimeModule;
            const runtime = new ThreeRuntime(stage);
            runtimes.push(runtime);
            await runtime.init();
        } catch (error) {
            console.warn('FileGenie 3D could not start:', error);
            stage.dataset.fg3dState = 'fallback';
        }
    };

    window.FileGenie3D = { runtimes };
    if ('IntersectionObserver' in window) {
        const lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                lazyObserver.unobserve(entry.target);
                loadStage(entry.target);
            });
        }, { rootMargin: '260px 0px', threshold: 0.01 });
        stages.forEach((stage) => lazyObserver.observe(stage));
    } else {
        stages.forEach(loadStage);
    }
}

const storySteps = [...document.querySelectorAll('.fg-story-step')];
if (storySteps.length) {
    const storyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            storySteps.forEach((step) => step.classList.toggle('is-active', step === entry.target));
        });
    }, { rootMargin: '-35% 0px -45%', threshold: 0.05 });
    storySteps.forEach((step) => storyObserver.observe(step));
}
