import { addStudioLighting } from '../lighting.js';
import { createContactShadow, roundedBoxGeometry, createPanel } from '../geometry.js';

const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function inFinder(x, y, originX, originY) {
    const dx = x - originX;
    const dy = y - originY;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
    return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
}

function qrValue(x, y) {
    if (inFinder(x, y, 0, 0) || inFinder(x, y, 14, 0) || inFinder(x, y, 0, 14)) return true;
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return false;
    return ((x * 3 + y * 5 + x * y) % 7) < 3 || ((x + y) % 9 === 0);
}

export function createQrGeneratorScene(ctx) {
    const { THREE, scene, camera, quality, dark } = ctx;
    addStudioLighting(THREE, scene, quality, dark);
    camera.fov = quality.compact ? 41 : 35;
    camera.position.set(0, 0.2, quality.compact ? 9.8 : 9.15);
    camera.updateProjectionMatrix();

    const root = new THREE.Group();
    root.rotation.x = -0.08;
    scene.add(root);

    const card = new THREE.Mesh(
        roundedBoxGeometry(THREE, 4.9, 4.9, 0.22, 0.3),
        [
            new THREE.MeshStandardMaterial({ color: dark ? 0xf3f5ff : 0xffffff, roughness: 0.34, metalness: 0.04 }),
            new THREE.MeshStandardMaterial({ color: dark ? 0x8992b2 : 0xcfd4e5, roughness: 0.44 }),
        ]
    );
    card.position.z = -0.28;
    card.castShadow = true;
    root.add(card);

    const moduleGeometry = new THREE.BoxGeometry(0.145, 0.145, 0.2);
    const moduleMaterial = new THREE.MeshStandardMaterial({ color: 0x101426, roughness: 0.32, metalness: 0.11 });
    const cells = [];
    for (let y = 0; y < 21; y += 1) {
        for (let x = 0; x < 21; x += 1) {
            if (qrValue(x, y)) cells.push([x, y]);
        }
    }
    const modules = new THREE.InstancedMesh(moduleGeometry, moduleMaterial, cells.length);
    modules.castShadow = true;
    root.add(modules);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();

    const exportPanel = createPanel(THREE, 1.85, 0.72, 0.12, dark ? 0x28304c : 0xe9ecff, [
        { text: 'PNG  ↓', size: 36, weight: 850, color: dark ? '#eef1ff' : '#343aa8' },
    ], { texture: { top: 110, left: 62 } });
    exportPanel.position.set(2.62, -1.55, 0.78);
    exportPanel.rotation.y = -0.15;
    exportPanel.scale.setScalar(0.001);
    root.add(exportPanel);

    const shadow = createContactShadow(THREE, 5.7, dark ? 0.35 : 0.21);
    shadow.position.set(0, -2.72, -0.85);
    root.add(shadow);

    return {
        root,
        update(time, pointer) {
            const cycle = time % 8.2;
            const appear = smooth(clamp((cycle - 0.55) / 2.35));
            const reset = smooth(clamp((cycle - 7.05) / 0.75));
            const amount = appear * (1 - reset);
            cells.forEach(([x, y], index) => {
                const finder = inFinder(x, y, 0, 0) || inFinder(x, y, 14, 0) || inFinder(x, y, 0, 14);
                const order = finder ? (x + y) * 0.006 : index * 0.0022 + 0.34;
                const local = smooth(clamp((amount - order) / 0.32));
                position.set((x - 10) * 0.185, (10 - y) * 0.185, 0.05 + (1 - local) * (0.8 + (index % 5) * 0.13));
                scale.setScalar(Math.max(0.001, local));
                matrix.compose(position, quaternion, scale);
                modules.setMatrixAt(index, matrix);
            });
            modules.instanceMatrix.needsUpdate = true;
            root.rotation.y = pointer.x * 0.04 + amount * 0.08;
            root.rotation.x = -0.08 + pointer.y * 0.028;
            root.position.y = Math.sin(time * 0.45) * 0.035;
            const panelScale = smooth(clamp((cycle - 3.25) / 0.65)) * (1 - reset);
            exportPanel.scale.setScalar(Math.max(0.001, panelScale));
        },
        resize({ compact }) {
            root.scale.setScalar(compact ? 0.78 : 0.9);
        },
    };
}
