import * as THREE from '/vendor/three/three.module.min.js?v=3';
import { getQualityProfile, supportsWebGL } from './QualityManager.js';

const sceneFactories = {
    home: () => import('./scenes/HomeScene.js?v=2').then((module) => module.createHomeScene),
    'merge-pdf': () => import('./scenes/MergePdfScene.js').then((module) => module.createMergePdfScene),
    'background-remover': () => import('./scenes/BackgroundRemoverScene.js').then((module) => module.createBackgroundRemoverScene),
    'qr-generator': () => import('./scenes/QrGeneratorScene.js').then((module) => module.createQrGeneratorScene),
    'barcode-reader': () => import('./scenes/BarcodeReaderScene.js').then((module) => module.createBarcodeReaderScene),
    'tool-scene': () => import('./scenes/ToolScene.js').then((module) => module.createToolScene),
};

export class ThreeRuntime {
    constructor(container) {
        this.container = container;
        this.sceneName = container.getAttribute('data-fg-3d-scene') || container.dataset.fg3dScene;
        this.quality = getQualityProfile();
        this.pointer = { x: 0, y: 0 };
        this.pointerTarget = { x: 0, y: 0 };
        this.scrollProgress = 0;
        this.visible = true;
        this.raf = 0;
        this.lastFrame = 0;
        this.clock = new THREE.Clock();
    }

    async init() {
        if (this.quality.reducedMotion) {
            this.container.dataset.fg3dState = 'fallback';
            this.container.dataset.fg3dReason = 'reduced-motion';
            return;
        }

        if (!supportsWebGL() || !sceneFactories[this.sceneName]) {
            this.container.dataset.fg3dState = 'fallback';
            return;
        }

        try {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: this.quality.tier !== 'low',
                powerPreference: this.quality.tier === 'high' ? 'high-performance' : 'default',
                stencil: false,
            });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.dpr));
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.05;
            this.renderer.shadowMap.enabled = this.quality.shadows;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.domElement.setAttribute('aria-hidden', 'true');
            this.renderer.domElement.tabIndex = -1;
            this.container.querySelector('.fg3d-canvas')?.appendChild(this.renderer.domElement);

            const factory = await sceneFactories[this.sceneName]();
            this.controller = await factory({
                THREE,
                scene: this.scene,
                camera: this.camera,
                quality: this.quality,
                dark: document.documentElement.dataset.theme === 'dark',
                container: this.container,
            });

            this.bind();
            this.bindWorkspaceState();
            this.resize();
            this.render(0);
            requestAnimationFrame(() => this.container.classList.add('is-webgl-ready'));
            this.container.dataset.fg3dState = 'ready';
            this.container.dataset.fg3dQuality = this.quality.tier;
            this.container.dispatchEvent(new CustomEvent('fg3d:ready', { bubbles: true }));
            if (!this.quality.reducedMotion) this.start();
        } catch (error) {
            console.warn('FileGenie 3D fallback active:', error);
            this.container.dataset.fg3dState = 'fallback';
            this.dispose();
        }
    }

    bind() {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.container);

        this.intersectionObserver = new IntersectionObserver(([entry]) => {
            this.visible = entry.isIntersecting;
            if (this.visible && !this.quality.reducedMotion) this.start();
            else this.stop();
        }, { rootMargin: '120px' });
        this.intersectionObserver.observe(this.container);

        this.onPointerMove = (event) => {
            if (this.quality.compact || this.quality.tier === 'low') return;
            const rect = this.container.getBoundingClientRect();
            this.pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            this.pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
        };
        this.onPointerLeave = () => {
            this.pointerTarget.x = 0;
            this.pointerTarget.y = 0;
        };
        this.onVisibility = () => {
            if (document.hidden) this.stop();
            else if (this.visible && !this.quality.reducedMotion) this.start();
        };
        this.onScroll = () => {
            const scrollRoot = this.container.closest('[data-fg3d-scroll]') || this.container;
            const rect = scrollRoot.getBoundingClientRect();
            const distance = Math.max(rect.height - window.innerHeight, 1);
            this.scrollProgress = Math.max(0, Math.min(1, -rect.top / distance));
        };

        this.container.addEventListener('pointermove', this.onPointerMove, { passive: true });
        this.container.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
        document.addEventListener('visibilitychange', this.onVisibility);
        window.addEventListener('scroll', this.onScroll, { passive: true });
    }

    bindWorkspaceState() {
        if (!this.container.classList.contains('fg3d-tool-stage')) return;
        const progress = document.getElementById('progress');
        const progressFill = document.getElementById('progress-fill');
        const result = document.getElementById('result');
        const active = document.getElementById('ws-active');
        if (!progress || !result || !active) return;

        let previousState = 'idle';
        const sync = () => {
            let state = 'idle';
            let value = 0;
            if (!result.hidden) {
                state = 'complete';
                value = 1;
            } else if (!progress.hidden) {
                state = 'processing';
                value = Math.max(0, Math.min(1, parseFloat(progressFill?.style.width || '0') / 100));
            } else if (active.hidden && previousState !== 'idle') {
                state = 'reset';
            }
            this.container.dataset.fg3dProcess = state;
            this.container.style.setProperty('--fg3d-process', value.toFixed(3));
            this.controller?.setProcessState?.(state, value);
            previousState = state === 'reset' ? 'idle' : state;
        };

        this.workspaceObserver = new MutationObserver(sync);
        this.workspaceObserver.observe(progress, { attributes: true, attributeFilter: ['hidden'] });
        this.workspaceObserver.observe(result, { attributes: true, attributeFilter: ['hidden'] });
        this.workspaceObserver.observe(active, { attributes: true, attributeFilter: ['hidden'] });
        if (progressFill) this.workspaceObserver.observe(progressFill, { attributes: true, attributeFilter: ['style'] });
        sync();
    }

    resize() {
        if (!this.renderer || !this.camera) return;
        const width = Math.max(this.container.clientWidth, 1);
        const height = Math.max(this.container.clientHeight, 1);
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.controller?.resize?.({ width, height, compact: width < 560 });
        if (this.quality.reducedMotion) this.render(0);
    }

    start() {
        if (this.raf || !this.renderer) return;
        this.clock.start();
        const loop = (now) => {
            this.raf = requestAnimationFrame(loop);
            const frameInterval = 1000 / this.quality.fps;
            if (now - this.lastFrame < frameInterval) return;
            this.lastFrame = now;
            this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.055;
            this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.055;
            this.render(this.clock.getElapsedTime());
        };
        this.raf = requestAnimationFrame(loop);
    }

    stop() {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.clock.stop();
    }

    render(time) {
        if (!this.renderer) return;
        this.controller?.update?.(time, this.pointer, this.scrollProgress);
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.stop();
        this.resizeObserver?.disconnect();
        this.intersectionObserver?.disconnect();
        this.workspaceObserver?.disconnect();
        this.container.removeEventListener('pointermove', this.onPointerMove);
        this.container.removeEventListener('pointerleave', this.onPointerLeave);
        document.removeEventListener('visibilitychange', this.onVisibility);
        window.removeEventListener('scroll', this.onScroll);
        this.controller?.dispose?.();
        this.scene?.traverse((object) => {
            object.geometry?.dispose?.();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material?.dispose?.());
        });
        this.renderer?.dispose();
    }
}
