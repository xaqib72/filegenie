import { addStudioLighting } from '../../lighting.js';
import { createContactShadow, createConnector, createPanel } from '../../geometry.js';
import { createMaterialSystem } from '../../materials.js';
import { createFamilyObject, familyColor } from '../../SceneObjects.js';

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = (value) => 1 - Math.pow(1 - clamp(value), 3);

function makeCopies(object, count) {
    return Array.from({ length: count }, (_, index) => {
        const copy = object.clone(true);
        copy.position.z -= (index + 1) * 0.13;
        copy.position.y += index * 0.09;
        copy.scale.setScalar(1 - index * 0.035);
        return copy;
    });
}

export function createFamilyScene({ THREE, scene, camera, quality, dark, container }, familyOptions = {}) {
    const family = container.dataset.fg3dFamily || familyOptions.family || 'utility';
    const variant = container.dataset.fg3dVariant || 'convert';
    const inputLabel = container.dataset.fg3dInput || 'INPUT';
    const actionLabel = container.dataset.fg3dAction || 'PROCESS';
    const outputLabel = container.dataset.fg3dOutput || 'OUTPUT';
    const accent = familyOptions.accent || familyColor(family);
    const root = new THREE.Group();
    const materials = createMaterialSystem(THREE, dark);
    scene.add(root);
    addStudioLighting(THREE, scene, quality, dark);
    camera.position.set(0, 0.25, 9.4);

    const input = createFamilyObject(THREE, family, inputLabel, { variant });
    const output = createFamilyObject(THREE, family, outputLabel, { output: true, variant });
    input.position.set(-2.55, 0.15, 0.1);
    output.position.set(2.55, 0.15, 0.1);
    root.add(input, output);

    const duplicated = [];
    if (['merge', 'split', 'extract', 'gif', 'reorder', 'compare'].includes(variant)) {
        makeCopies(input, variant === 'merge' ? 2 : 1).forEach((copy, index) => {
            copy.position.set(-2.55 - index * 0.12, 0.15 + (index + 1) * 0.22, -0.15 - index * 0.12);
            root.add(copy);
            duplicated.push(copy);
        });
        if (['split', 'extract', 'gif'].includes(variant)) {
            makeCopies(output, 2).forEach((copy, index) => {
                copy.position.set(2.55 + index * 0.11, 0.15 + (index + 1) * 0.22, -0.14 - index * 0.12);
                root.add(copy);
                duplicated.push(copy);
            });
        }
    }

    const core = new THREE.Group();
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.105, quality.tier === 'low' ? 10 : 16, quality.tier === 'low' ? 40 : 72),
        new THREE.MeshStandardMaterial({ color: accent, metalness: 0.34, roughness: 0.22, emissive: accent, emissiveIntensity: dark ? 0.16 : 0.08 })
    );
    ring.rotation.x = 0.28;
    const inner = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.33, quality.tier === 'high' ? 2 : 1),
        new THREE.MeshStandardMaterial({ color: dark ? 0xf4f6ff : 0xffffff, metalness: 0.2, roughness: 0.22 })
    );
    core.add(ring, inner);
    core.position.set(0, 0.22, 0.45);
    root.add(core);

    const action = createPanel(THREE, 1.66, 0.45, 0.08, accent, [
        { text: actionLabel, size: 29, weight: 850, color: '#ffffff' },
    ], { radius: 0.12, texture: { width: 640, height: 170, left: 38, top: 94 } });
    action.position.set(0, -0.82, 0.35);
    root.add(action);

    const inputPoint = new THREE.Vector3(-1.5, 0.15, 0);
    const corePoint = new THREE.Vector3(-0.72, 0.2, 0.15);
    const coreOut = new THREE.Vector3(0.72, 0.2, 0.15);
    const outputPoint = new THREE.Vector3(1.5, 0.15, 0);
    const connectorA = createConnector(THREE, inputPoint, corePoint, materials.line);
    const connectorB = createConnector(THREE, coreOut, outputPoint, materials.line);
    root.add(connectorA, connectorB);

    const particles = new THREE.Group();
    const particleGeometry = new THREE.SphereGeometry(0.045, 8, 6);
    for (let index = 0; index < (quality.tier === 'low' ? 5 : 9); index += 1) {
        const particle = new THREE.Mesh(particleGeometry, new THREE.MeshBasicMaterial({ color: index % 2 ? accent : 0x22d3ee }));
        particle.userData.offset = index / 9;
        particles.add(particle);
    }
    root.add(particles);

    const inputShadow = createContactShadow(THREE, 2.45, dark ? 0.34 : 0.21);
    const outputShadow = createContactShadow(THREE, 2.45, dark ? 0.34 : 0.21);
    inputShadow.position.set(-2.55, -1.12, -0.6);
    outputShadow.position.set(2.55, -1.12, -0.6);
    root.add(inputShadow, outputShadow);

    const status = createPanel(THREE, 2.4, 0.52, 0.06, dark ? 0x17213c : 0xf2f5ff, [
        { text: `✓  ${outputLabel} READY`, size: 25, weight: 800, color: dark ? '#8af0cf' : '#087e5d' },
    ], { radius: 0.12, texture: { width: 760, height: 170, left: 38, top: 92 } });
    status.position.set(2.35, -1.55, 0.2);
    status.scale.setScalar(0.01);
    root.add(status);

    let externalState = 'idle';
    let externalProgress = 0;
    // The runtime passes THREE.Clock elapsed seconds. Keep choreography on
    // that same clock so complete/reset transitions are deterministic.
    let stateChangedAt = 0;
    let lastTime = 0;
    let compactLayout = false;

    function choreography(time) {
        if (externalState !== 'idle') {
            if (externalState === 'processing') return 1.5 + externalProgress * 2.7;
            if (externalState === 'complete') return 4.8 + Math.min(time - stateChangedAt, 3.4);
            if (externalState === 'reset') return 8.2 + Math.min(time - stateChangedAt, 1.5);
        }
        return time % 10;
    }

    function applyVariant(progress, time) {
        const active = Math.sin(progress * Math.PI);
        if (variant === 'compress') output.scale.setScalar(0.88 + ease(progress) * 0.12);
        if (variant === 'resize' || variant === 'crop' || variant === 'round' || variant === 'upscale') {
            output.scale.set(0.82 + ease(progress) * 0.18, variant === 'crop' ? 0.84 + ease(progress) * 0.16 : 1, 1);
        }
        if (variant === 'rotate' || variant === 'flip') output.rotation.y = variant === 'flip' ? Math.PI * (1 - progress) : 0;
        if (variant === 'reorder' || variant === 'sort') duplicated.forEach((copy, index) => { copy.position.y += Math.sin(time * 1.7 + index) * 0.002; });
        if (['protect', 'unlock', 'scan', 'ocr', 'qr-read', 'barcode-read'].some((token) => variant.includes(token))) {
            ring.rotation.z = time * 1.4;
            ring.scale.setScalar(1 + active * 0.14);
        }
        if (variant === 'delete' || variant === 'strip' || variant === 'mute') input.opacity = 1 - progress;
    }

    return {
        setProcessState(state, progress = 0) {
            externalState = state;
            externalProgress = clamp(progress);
            stateChangedAt = lastTime;
        },
        update(time, pointer) {
            lastTime = time;
            const phase = choreography(time);
            const operation = ease((phase - 1.25) / 2.6);
            const reveal = ease((phase - 3.6) / 1.05);
            const reset = ease((phase - 8.3) / 1.35);
            const transformProgress = clamp(operation * (1 - reset));

            root.rotation.y += ((pointer.x * 0.09) - root.rotation.y) * 0.035;
            root.rotation.x += ((pointer.y * 0.045) - root.rotation.x) * 0.035;
            input.position.x = -2.55 + transformProgress * 0.34;
            output.position.x = 2.55 - transformProgress * 0.28;
            input.position.y = compactLayout ? 0.72 : 0.15;
            output.position.y = compactLayout ? -0.2 : 0.15;
            output.scale.setScalar(Math.max(0.01, 0.76 + reveal * 0.24 - reset * 0.22));
            output.rotation.y += ((1 - reveal) * -0.18 - output.rotation.y) * 0.06;
            core.scale.setScalar(0.96 + Math.sin(time * 2.1) * 0.035 + transformProgress * 0.08);
            core.rotation.y = time * 0.42;
            ring.rotation.z = time * 0.6;
            action.position.y = (compactLayout ? -1.05 : -0.82) + Math.sin(time * 1.35) * 0.035;
            status.scale.setScalar(Math.max(0.01, reveal * (1 - reset)));
            status.position.x = compactLayout ? 1.8 : 2.35;
            status.position.y = (compactLayout ? -1.75 : -1.55) + reveal * 0.15;

            particles.children.forEach((particle) => {
                const travel = (time * 0.21 + particle.userData.offset) % 1;
                particle.position.set(-1.48 + travel * 2.96, 0.18 + Math.sin(travel * Math.PI) * 0.26, -0.05);
                particle.scale.setScalar(0.55 + Math.sin(travel * Math.PI) * transformProgress);
                particle.visible = transformProgress > 0.02;
            });
            applyVariant(transformProgress, time);
        },
        resize({ compact }) {
            compactLayout = compact;
            if (compact) {
                camera.position.z = 10.7;
                root.scale.setScalar(0.86);
                root.rotation.z = -0.025;
                input.position.y = 0.72;
                output.position.y = -0.2;
                action.position.y = -1.05;
                status.position.set(1.8, -1.75, 0.2);
            } else {
                camera.position.z = 9.4;
                root.scale.setScalar(1);
                root.rotation.z = 0;
                input.position.y = 0.15;
                output.position.y = 0.15;
                action.position.y = -0.82;
                status.position.set(2.35, -1.55, 0.2);
            }
        },
        dispose() {
            root.traverse((object) => object.userData?.disposeTextures?.forEach((texture) => texture.dispose()));
        },
    };
}
