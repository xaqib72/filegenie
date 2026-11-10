import { FILE_COLORS, createMaterialSystem } from '../materials.js';
import { addStudioLighting } from '../lighting.js';
import { createFileObject, createContactShadow, createConnector, roundedBoxGeometry, makeLabelTexture } from '../geometry.js';

const EASE_OUT = (t) => 1 - Math.pow(1 - t, 4);

export function createHomeScene(ctx) {
    const { THREE, scene, camera, quality, dark, container } = ctx;
    const storyMode = container.dataset.fg3dVariant === 'story';
    const materials = createMaterialSystem(THREE, dark);
    addStudioLighting(THREE, scene, quality, dark);

    camera.fov = quality.compact ? 38 : 32;
    camera.position.set(0, quality.compact ? 0.15 : 0, quality.compact ? 12.4 : 11.2);
    camera.updateProjectionMatrix();

    const root = new THREE.Group();
    root.rotation.x = -0.08;
    scene.add(root);

    const core = new THREE.Group();
    const coreBody = new THREE.Mesh(roundedBoxGeometry(THREE, 3.15, 1.95, 0.28, 0.28), [materials.core, materials.edge]);
    coreBody.castShadow = true;
    coreBody.receiveShadow = true;
    core.add(coreBody);

    const coreTexture = makeLabelTexture(THREE, 'FILEGENIE', dark ? '#f3f1e9' : '#191d19', 'ON-DEVICE FILE STUDIO');
    const coreFace = new THREE.Mesh(
        new THREE.PlaneGeometry(2.85, 1.68),
        new THREE.MeshBasicMaterial({ map: coreTexture, transparent: true, depthWrite: false })
    );
    coreFace.position.z = 0.195;
    core.add(coreFace);

    const glassShell = new THREE.Mesh(roundedBoxGeometry(THREE, 3.52, 2.3, 0.08, 0.34), materials.glass);
    glassShell.position.z = -0.22;
    core.add(glassShell);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.18, 0.025, 8, 96),
        new THREE.MeshBasicMaterial({ color: dark ? 0xd6ff57 : 0x718b1d, transparent: true, opacity: 0.44 })
    );
    ring.scale.y = 0.54;
    ring.rotation.z = -0.16;
    ring.position.z = -0.66;
    root.add(ring);
    root.add(core);

    const privacyRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.95, 0.075, 10, 64),
        new THREE.MeshStandardMaterial({ color: 0xd6ff57, emissive: 0xd6ff57, emissiveIntensity: 0.3, transparent: true, opacity: 0 })
    );
    privacyRing.scale.y = 0.7;
    privacyRing.position.z = 0.48;
    root.add(privacyRing);

    // Two intersecting orbits and a faceted satellite make the homepage
    // transformation core read as a dimensional, active machine.
    const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.6, 0.018, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0xd6ff57, transparent: true, opacity: 0.38 })
    );
    orbitRing.scale.set(1, 0.62, 0.78);
    orbitRing.rotation.set(0.32, -0.18, 0.1);
    orbitRing.position.z = -0.92;
    root.add(orbitRing);

    const orbitRingCross = new THREE.Mesh(
        new THREE.TorusGeometry(2.95, 0.014, 8, 100),
        new THREE.MeshBasicMaterial({ color: 0xff7657, transparent: true, opacity: 0.5 })
    );
    orbitRingCross.scale.set(1, 0.66, 0.82);
    orbitRingCross.rotation.set(-0.48, 0.52, -0.34);
    orbitRingCross.position.z = -0.58;
    root.add(orbitRingCross);

    const satellite = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.17, 1),
        new THREE.MeshPhysicalMaterial({ color: 0xff7657, emissive: 0x4b160d, emissiveIntensity: 0.35, roughness: 0.22, metalness: 0.58, clearcoat: 0.9 })
    );
    satellite.castShadow = true;
    root.add(satellite);

    const coreShadow = createContactShadow(THREE, 4.3, dark ? 0.34 : 0.22);
    coreShadow.position.set(0, -1.35, -0.8);
    root.add(coreShadow);

    const layouts = quality.compact ? [
        ['PDF', FILE_COLORS.PDF, -2.65, 1.78, -0.8, 0.12, -0.26, 0.82],
        ['JPG', FILE_COLORS.JPG, -2.7, -1.58, -0.25, -0.1, 0.2, 0.78],
        ['MP4', FILE_COLORS.MP4, 2.6, 1.62, -0.58, -0.08, 0.2, 0.78],
        ['MP3', FILE_COLORS.MP3, 2.7, -1.42, 0.2, 0.12, -0.2, 0.76],
        ['TXT', FILE_COLORS.TXT, 0.15, 2.68, -1.18, 0.08, 0.02, 0.68],
        ['QR', FILE_COLORS.QR, 0.65, -2.6, -0.58, -0.1, 0.08, 0.65],
    ] : [
        ['PDF', FILE_COLORS.PDF, -3.45, 1.78, -0.7, 0.1, -0.24, 0.9],
        ['JPG', FILE_COLORS.JPG, -3.65, -1.4, 0.28, -0.1, 0.24, 0.86],
        ['MP4', FILE_COLORS.MP4, 3.35, 1.62, -0.45, -0.08, 0.22, 0.88],
        ['MP3', FILE_COLORS.MP3, 3.58, -1.42, 0.3, 0.1, -0.2, 0.84],
        ['TXT', FILE_COLORS.TXT, -0.8, 2.7, -1.35, 0.08, -0.02, 0.72],
        ['QR', FILE_COLORS.QR, 0.55, -2.72, -0.62, -0.1, 0.08, 0.7],
        ['ZIP', FILE_COLORS.ZIP, 2.2, 0.05, -1.65, 0.02, 0.2, 0.62],
    ];

    const fileGroups = [];
    layouts.forEach(([label, color, x, y, z, rx, ry, scale], index) => {
        const file = createFileObject(THREE, label, color, { sublabel: index % 2 ? 'READY' : 'LOCAL FILE' });
        file.position.set(x, y, z);
        file.rotation.set(rx, ry, index % 2 ? 0.05 : -0.04);
        file.scale.setScalar(scale);
        file.userData.base = new THREE.Vector3(x, y, z);
        file.userData.phase = index * 0.72;
        file.userData.targetScale = scale;
        file.scale.setScalar(0.001);
        root.add(file);
        fileGroups.push(file);

        const endpoint = new THREE.Vector3(x * 0.66, y * 0.66, z - 0.2);
        const connector = createConnector(THREE, new THREE.Vector3(0, 0, -0.48), endpoint, materials.line);
        root.add(connector);

        const shadow = createContactShadow(THREE, 2.3 * scale, dark ? 0.25 : 0.16);
        shadow.position.set(x, y - 0.9 * scale, z - 0.52);
        root.add(shadow);
    });

    const motes = new THREE.Group();
    const moteGeometry = new THREE.SphereGeometry(0.035, 8, 8);
    const moteMaterial = new THREE.MeshBasicMaterial({ color: dark ? 0xe2f7a3 : 0x718b1d, transparent: true, opacity: 0.48 });
    const moteCount = quality.tier === 'high' ? 38 : quality.tier === 'medium' ? 22 : 12;
    for (let i = 0; i < moteCount; i += 1) {
        const mote = new THREE.Mesh(moteGeometry, moteMaterial);
        const angle = (i / moteCount) * Math.PI * 2;
        const radius = 3.2 + (i % 4) * 0.42;
        mote.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, -1.8 - (i % 3) * 0.4);
        motes.add(mote);
    }
    root.add(motes);

    const start = performance.now();
    return {
        root,
        update(time, pointer, scrollProgress = 0) {
            const elapsed = Math.max(0, (performance.now() - start) / 1000);
            const intro = EASE_OUT(Math.min(elapsed / 1.15, 1));
            root.position.y = -0.08 + (1 - intro) * -0.78;
            const privacy = storyMode ? Math.max(0, Math.min(1, (scrollProgress - 0.26) / 0.3)) : 0;
            const workflow = storyMode ? Math.max(0, Math.min(1, (scrollProgress - 0.62) / 0.28)) : 0;
            const privacyEase = privacy * privacy * (3 - 2 * privacy);
            const workflowEase = workflow * workflow * (3 - 2 * workflow);
            root.rotation.y = pointer.x * 0.065 + scrollProgress * 0.08;
            root.rotation.x = -0.08 + pointer.y * 0.045;
            core.position.y = Math.sin(time * 0.72) * 0.055;
            core.rotation.y = Math.sin(time * 0.42) * 0.035;
            ring.rotation.z = -0.16 + time * 0.025;
            orbitRing.rotation.y = 0.32 + time * 0.13;
            orbitRing.rotation.z = 0.1 - time * 0.045;
            orbitRingCross.rotation.y = 0.52 - time * 0.1;
            orbitRingCross.rotation.z = -0.34 + time * 0.06;
            satellite.position.set(Math.cos(time * 0.48) * 3.05, Math.sin(time * 0.48) * 1.82, -0.36 + Math.sin(time * 0.48) * 0.58);
            satellite.rotation.set(time * 0.7, time * 0.92, time * 0.38);
            motes.rotation.z = time * 0.018;
            privacyRing.material.opacity = storyMode ? privacyEase * (1 - workflowEase * 0.55) * 0.68 : 0;
            privacyRing.rotation.z = time * 0.06;
            core.scale.setScalar(1 + privacyEase * 0.05);

            fileGroups.forEach((file, index) => {
                const delay = 0.18 + index * 0.075;
                const local = Math.max(0, Math.min((elapsed - delay) / 0.82, 1));
                const scale = file.userData.targetScale * EASE_OUT(local);
                file.scale.setScalar(Math.max(0.001, scale));
                const privacyTargetX = (index - (fileGroups.length - 1) / 2) * 0.13;
                const privacyTargetY = (index % 3 - 1) * 0.16;
                const workflowTargetX = (index - (fileGroups.length - 1) / 2) * 0.9;
                const workflowTargetY = (index % 2 ? -0.28 : 0.28);
                const baseX = THREE.MathUtils.lerp(file.userData.base.x, privacyTargetX, privacyEase);
                const baseY = THREE.MathUtils.lerp(file.userData.base.y, privacyTargetY, privacyEase);
                file.position.x = THREE.MathUtils.lerp(baseX, workflowTargetX, workflowEase);
                file.position.y = THREE.MathUtils.lerp(baseY, workflowTargetY, workflowEase) + Math.sin(time * (0.52 + index * 0.025) + file.userData.phase) * 0.11;
                file.position.z = THREE.MathUtils.lerp(file.userData.base.z + Math.cos(time * 0.38 + file.userData.phase) * 0.035, 0.15 + index * 0.05, privacyEase);
                file.visible = !storyMode || workflowEase < 0.72 || index < 4;
            });
        },
        resize({ compact }) {
            root.scale.setScalar(compact ? 0.84 : 1);
        },
        dispose() {
            coreTexture.dispose();
            satellite.geometry.dispose();
            satellite.material.dispose();
        },
    };
}
