import { createFileObject, createPanel, roundedBoxGeometry } from './geometry.js';

const FAMILY_COLORS = Object.freeze({
    pdf: 0xd6ff57,
    image: 0xff7657,
    video: 0xb2a6ff,
    audio: 0x64dbc1,
    text: 0xe7e6df,
    utility: 0xd6ff57,
});

function addBadge(THREE, group, text, color, y = -0.43) {
    const badge = createPanel(THREE, 1.45, 0.28, 0.06, color, [
        { text, size: 29, weight: 800, color: '#ffffff' },
    ], { radius: 0.08, texture: { width: 560, height: 120, left: 34, top: 63 } });
    badge.position.set(0, y, 0.24);
    group.add(badge);
}

function makeImageObject(THREE, label, color, output) {
    const group = createPanel(THREE, 2.35, 1.55, 0.17, output ? 0x0f9b8e : color, [], { radius: 0.16 });
    const sky = new THREE.Mesh(
        roundedBoxGeometry(THREE, 1.95, 0.92, 0.055, 0.12),
        new THREE.MeshStandardMaterial({ color: output ? 0x8be4d6 : 0x63b8d1, roughness: 0.42 })
    );
    sky.position.set(0, 0.13, 0.2);
    group.add(sky);
    const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(0.58, 0.7, 3),
        new THREE.MeshStandardMaterial({ color: output ? 0x173b55 : 0x243b65, roughness: 0.5 })
    );
    mountain.position.set(-0.25, 0.02, 0.25);
    mountain.rotation.z = 0.04;
    group.add(mountain);
    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 20, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x5a3400, emissiveIntensity: 0.22 })
    );
    sun.position.set(0.58, 0.35, 0.27);
    group.add(sun);
    addBadge(THREE, group, label, output ? 0x087e6a : color, -0.55);
    return group;
}

function makeVideoObject(THREE, label, color, output) {
    const group = createPanel(THREE, 2.42, 1.5, 0.2, output ? 0x4c1d95 : 0x24114a, [], { radius: 0.17 });
    const play = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.42, 3),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    play.rotation.set(0, 0, -Math.PI / 2);
    play.position.set(0, 0.17, 0.27);
    group.add(play);
    for (let index = 0; index < 7; index += 1) {
        const block = new THREE.Mesh(
            new THREE.BoxGeometry(0.23, 0.15 + (index % 2) * 0.08, 0.06),
            new THREE.MeshStandardMaterial({ color: index < (output ? 4 : 7) ? color : 0x55476b, roughness: 0.32 })
        );
        block.position.set(-0.82 + index * 0.28, -0.37, 0.24);
        group.add(block);
    }
    addBadge(THREE, group, label, color, -0.56);
    return group;
}

function makeAudioObject(THREE, label, color, output) {
    const group = createPanel(THREE, 2.42, 1.4, 0.18, output ? 0x064e3b : 0x073c34, [], { radius: 0.18 });
    for (let index = 0; index < 13; index += 1) {
        const height = 0.18 + Math.abs(Math.sin(index * 1.27)) * 0.72;
        const bar = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, height, 0.07),
            new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? 0x86efac : color, roughness: 0.3 })
        );
        bar.position.set(-0.78 + index * 0.13, 0.08, 0.23);
        group.add(bar);
    }
    addBadge(THREE, group, label, color, -0.52);
    return group;
}

function makeTextObject(THREE, label, color, output) {
    const group = createPanel(THREE, 2.15, 1.62, 0.16, output ? 0xf4f6fb : 0xe4e8f2, [], { radius: 0.12 });
    const lengths = output ? [1.45, 1.15, 1.55, 0.9, 1.36] : [0.88, 1.48, 1.02, 1.55, 1.18];
    lengths.forEach((width, index) => {
        const line = new THREE.Mesh(
            new THREE.BoxGeometry(width, index === 0 ? 0.12 : 0.075, 0.035),
            new THREE.MeshStandardMaterial({ color: index === 0 ? color : 0x98a2b8, roughness: 0.45 })
        );
        line.position.set(-0.15 + (width - 1.2) * 0.06, 0.46 - index * 0.22, 0.2);
        group.add(line);
    });
    addBadge(THREE, group, label, color, -0.6);
    return group;
}

function makeUtilityObject(THREE, label, color, output, variant) {
    const group = createPanel(THREE, 2.2, 1.48, 0.19, output ? 0x111827 : 0x26324d, [], { radius: 0.19 });
    if (variant.includes('barcode')) {
        for (let index = 0; index < 15; index += 1) {
            const width = index % 4 === 0 ? 0.07 : 0.035;
            const bar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.7, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            bar.position.set(-0.72 + index * 0.1, 0.12, 0.23);
            group.add(bar);
        }
    } else if (variant.includes('qr')) {
        for (let x = -3; x <= 3; x += 1) for (let y = -2; y <= 2; y += 1) {
            if ((x * y + x + y) % 3 === 0) continue;
            const bit = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            bit.position.set(x * 0.18, y * 0.18 + 0.1, 0.23);
            group.add(bit);
        }
    } else {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.48, 0.08, 12, 40),
            new THREE.MeshStandardMaterial({ color: output ? 0x2dd4bf : 0x818cf8, metalness: 0.28, roughness: 0.25 })
        );
        ring.position.set(0, 0.1, 0.25);
        group.add(ring);
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.15, roughness: 0.2 }));
        core.position.set(0, 0.1, 0.28);
        group.add(core);
    }
    addBadge(THREE, group, label, color, -0.55);
    return group;
}

export function createFamilyObject(THREE, family, label, { output = false, variant = '' } = {}) {
    const color = FAMILY_COLORS[family] || FAMILY_COLORS.utility;
    if (family === 'pdf') return createFileObject(THREE, output ? 'PDF' : 'PDF', color, { width: 1.92, height: 1.48, sublabel: label });
    if (family === 'image') return makeImageObject(THREE, label, color, output);
    if (family === 'video') return makeVideoObject(THREE, label, color, output);
    if (family === 'audio') return makeAudioObject(THREE, label, color, output);
    if (family === 'text') return makeTextObject(THREE, label, color, output);
    return makeUtilityObject(THREE, label, color, output, variant);
}

export function familyColor(family) {
    return FAMILY_COLORS[family] || FAMILY_COLORS.utility;
}
