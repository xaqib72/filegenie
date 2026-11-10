import { addStudioLighting } from '../lighting.js';
import { createFileObject, createContactShadow, createPanel } from '../geometry.js';

const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function createMergePdfScene(ctx) {
    const { THREE, scene, camera, quality, dark } = ctx;
    addStudioLighting(THREE, scene, quality, dark);
    camera.fov = quality.compact ? 41 : 36;
    camera.position.set(0, 0.15, quality.compact ? 9.8 : 9.2);
    camera.updateProjectionMatrix();

    const root = new THREE.Group();
    root.rotation.x = -0.07;
    scene.add(root);

    const positions = [-2.15, 0, 2.15];
    const docs = positions.map((x, index) => {
        const doc = createFileObject(THREE, 'PDF', index === 1 ? 0xff7657 : 0xd6ff57, {
            width: 2.15,
            height: 2.78,
            depth: 0.22,
            sublabel: `DOCUMENT ${index + 1}`,
        });
        doc.position.set(x, index === 1 ? 0.08 : -0.08, index === 1 ? 0.2 : -0.32);
        doc.rotation.set(-0.04 + index * 0.025, (index - 1) * -0.2, (index - 1) * 0.06);
        doc.userData.startX = x;
        doc.userData.phase = index * 0.8;
        root.add(doc);
        return doc;
    });

    const shadow = createContactShadow(THREE, 6.2, dark ? 0.34 : 0.2);
    shadow.position.set(0, -2.15, -1.25);
    root.add(shadow);

    const success = createPanel(THREE, 2.15, 0.66, 0.11, dark ? 0x1c3c35 : 0xe9fff7, [
        { text: '✓  MERGE COMPLETE', size: 30, weight: 800, color: dark ? '#7ef0c0' : '#087f5b' },
    ], { texture: { top: 104, left: 62 } });
    success.position.set(2.15, -1.55, 0.75);
    success.rotation.y = -0.13;
    success.scale.setScalar(0.001);
    root.add(success);

    return {
        root,
        update(time, pointer) {
            const cycle = time % 8.4;
            const merge = smooth(clamp((cycle - 1.7) / 1.7));
            const release = smooth(clamp((cycle - 6.55) / 1.1));
            const amount = merge * (1 - release);

            docs.forEach((doc, index) => {
                const targetX = (index - 1) * 0.1;
                doc.position.x = THREE.MathUtils.lerp(doc.userData.startX, targetX, amount);
                doc.position.y = Math.sin(time * 0.72 + doc.userData.phase) * 0.07 * (1 - amount) + (index - 1) * 0.045 * amount;
                doc.position.z = THREE.MathUtils.lerp(index === 1 ? 0.2 : -0.32, (index - 1) * 0.24, amount);
                doc.rotation.y = THREE.MathUtils.lerp((index - 1) * -0.2, -0.16, amount) + pointer.x * 0.025;
                doc.rotation.z = THREE.MathUtils.lerp((index - 1) * 0.06, -0.035, amount);
            });

            root.rotation.y = pointer.x * 0.045 + amount * 0.08;
            root.rotation.x = -0.07 + pointer.y * 0.035;
            const successScale = smooth(clamp((cycle - 3.75) / 0.55)) * (1 - smooth(clamp((cycle - 6.2) / 0.45)));
            success.scale.setScalar(Math.max(0.001, successScale));
            success.position.y = -1.55 + (1 - successScale) * 0.18;
        },
        resize({ compact }) {
            root.scale.setScalar(compact ? 0.76 : 0.95);
        },
    };
}
