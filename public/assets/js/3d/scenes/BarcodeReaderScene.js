import { addStudioLighting } from '../lighting.js';
import { createContactShadow, roundedBoxGeometry, createPanel } from '../geometry.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

const BAR_WIDTHS = [2,1,2,1,1,3,1,2,2,1,3,1,1,2,3,1,2,1,2,2,1,3,1,1,2,1,3,2,1,2,1,1,3,1,2,2,1,1,2,3,1,2,1,2,3,1,1,2,2,1,3,1];

export function createBarcodeReaderScene(ctx) {
    const { THREE, scene, camera, quality, dark } = ctx;
    addStudioLighting(THREE, scene, quality, dark);
    camera.fov = quality.compact ? 44 : 37;
    camera.position.set(0, 0.25, quality.compact ? 10.2 : 9.5);
    camera.updateProjectionMatrix();

    const root = new THREE.Group();
    scene.add(root);
    const card = new THREE.Mesh(
        roundedBoxGeometry(THREE, 5.8, 3.35, 0.24, 0.28),
        [
            new THREE.MeshStandardMaterial({ color: 0xf9fafc, roughness: 0.38 }),
            new THREE.MeshStandardMaterial({ color: 0xbfc5d8, roughness: 0.46 }),
        ]
    );
    card.castShadow = true;
    root.add(card);

    const bars = [];
    let cursor = -2.36;
    BAR_WIDTHS.forEach((width, index) => {
        const w = width * 0.042;
        if (index % 2 === 0) {
            const bar = new THREE.Mesh(
                new THREE.BoxGeometry(w, index % 10 === 0 ? 1.82 : 1.58, 0.12),
                new THREE.MeshStandardMaterial({ color: 0x11131c, roughness: 0.4, emissive: 0x22d3ee, emissiveIntensity: 0 })
            );
            bar.position.set(cursor + w / 2, 0.18, 0.22);
            root.add(bar);
            bars.push(bar);
        }
        cursor += w;
    });

    const digits = createPanel(THREE, 3.55, 0.46, 0.04, 0xf9fafc, [
        { text: '5 901234 123457', size: 31, weight: 650, color: '#11131c', mono: true },
    ], { texture: { top: 88, left: 48 } });
    digits.position.set(0, -1.18, 0.22);
    root.add(digits);

    const frameMaterial = new THREE.MeshStandardMaterial({ color: dark ? 0x96a0d7 : 0x4f58a7, roughness: 0.3, metalness: 0.16 });
    const frame = new THREE.Group();
    [[0,1.88,5.4,.045],[0,-1.88,5.4,.045],[-3.08,0,.045,3.18],[3.08,0,.045,3.18]].forEach(([x,y,w,h]) => {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameMaterial);
        edge.position.set(x, y, 0.5);
        frame.add(edge);
    });
    root.add(frame);

    const beam = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 3.1),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    beam.position.set(-2.68, 0, 0.54);
    root.add(beam);

    const result = createPanel(THREE, 3.15, 1.82, 0.18, dark ? 0x18243a : 0xecfff9, [
        { text: 'EAN-13', size: 25, weight: 750, color: dark ? '#78efd0' : '#087e5d', gap: 56 },
        { text: '5901234123457', size: 35, weight: 800, color: dark ? '#f2f5ff' : '#172038', mono: true, gap: 64 },
        { text: '✓  SCAN COMPLETE', size: 24, weight: 800, color: dark ? '#78efd0' : '#087e5d' },
    ], { texture: { top: 72, left: 48, rule: true } });
    result.position.set(3.7, -0.25, 0.78);
    result.rotation.y = -0.2;
    result.scale.setScalar(0.001);
    root.add(result);

    const shadow = createContactShadow(THREE, 6.6, dark ? 0.36 : 0.2);
    shadow.position.set(0, -2.35, -0.92);
    root.add(shadow);

    return {
        root,
        update(time, pointer) {
            const cycle = time % 7.8;
            const scan = smooth(clamp((cycle - 0.85) / 2.7));
            const reset = smooth(clamp((cycle - 6.65) / 0.72));
            beam.visible = cycle > 0.7 && cycle < 4.15;
            beam.position.x = THREE.MathUtils.lerp(-2.65, 2.65, scan);
            bars.forEach((bar) => {
                const near = Math.max(0, 1 - Math.abs(bar.position.x - beam.position.x) / 0.42);
                bar.material.emissiveIntensity = near * 1.6;
            });
            const show = smooth(clamp((cycle - 3.25) / 0.6)) * (1 - reset);
            result.scale.setScalar(Math.max(0.001, show));
            result.position.x = 3.7 - (1 - show) * 0.42;
            root.rotation.y = pointer.x * 0.04 - 0.04;
            root.rotation.x = -0.04 + pointer.y * 0.026;
        },
        resize({ compact }) {
            root.position.x = compact ? -0.15 : -0.55;
            root.scale.setScalar(compact ? 0.71 : 0.82);
        },
    };
}
