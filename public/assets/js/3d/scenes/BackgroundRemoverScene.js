import { addStudioLighting } from '../lighting.js';
import { createContactShadow, roundedBoxGeometry, makePanelTexture } from '../geometry.js';

const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function checkerTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const size = 32;
    for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
            ctx.fillStyle = (x + y) % 2 ? '#d9dce7' : '#f7f8fc';
            ctx.fillRect(x * size, y * size, size, size);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function photoTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, 800);
    sky.addColorStop(0, '#6a7af4');
    sky.addColorStop(0.52, '#83d9d4');
    sky.addColorStop(1, '#284e54');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 800);
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.beginPath();
    ctx.arc(470, 160, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#23304c';
    ctx.beginPath();
    ctx.arc(318, 264, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(170, 340, 300, 460, 132);
    ctx.fill();
    ctx.fillStyle = '#727df2';
    ctx.beginPath();
    ctx.roundRect(205, 390, 230, 410, 105);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function subjectTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#23304c';
    ctx.beginPath();
    ctx.arc(318, 264, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(170, 340, 300, 460, 132);
    ctx.fill();
    ctx.fillStyle = '#727df2';
    ctx.beginPath();
    ctx.roundRect(205, 390, 230, 410, 105);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export function createBackgroundRemoverScene(ctx) {
    const { THREE, scene, camera, quality, dark } = ctx;
    addStudioLighting(THREE, scene, quality, dark);
    camera.fov = quality.compact ? 41 : 35;
    camera.position.set(0, 0.15, quality.compact ? 9.7 : 9.1);
    camera.updateProjectionMatrix();
    const root = new THREE.Group();
    scene.add(root);

    const frame = new THREE.Mesh(
        roundedBoxGeometry(THREE, 4.45, 4.9, 0.18, 0.24),
        new THREE.MeshStandardMaterial({ color: dark ? 0x202641 : 0xf7f8ff, roughness: 0.3, metalness: 0.06 })
    );
    frame.position.z = -0.34;
    frame.castShadow = true;
    root.add(frame);

    const checker = new THREE.Mesh(
        new THREE.PlaneGeometry(4.08, 4.5),
        new THREE.MeshStandardMaterial({ map: checkerTexture(THREE), roughness: 0.8 })
    );
    checker.position.z = -0.18;
    root.add(checker);

    const photoMaterial = new THREE.MeshStandardMaterial({ map: photoTexture(THREE), roughness: 0.72, transparent: true });
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(4.08, 4.5), photoMaterial);
    photo.position.z = -0.08;
    root.add(photo);

    const subjectMaterial = new THREE.MeshStandardMaterial({ map: subjectTexture(THREE), transparent: true, roughness: 0.64, alphaTest: 0.02 });
    const subject = new THREE.Mesh(new THREE.PlaneGeometry(4.08, 4.5), subjectMaterial);
    subject.position.z = 0.04;
    root.add(subject);

    const sweep = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 4.75),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
    );
    sweep.position.set(-2.2, 0, 0.22);
    root.add(sweep);

    const labelTexture = makePanelTexture(THREE, [
        { text: 'BACKGROUND', size: 26, weight: 700, color: '#6c7393', opacity: 0.8 },
        { text: 'REMOVED', size: 48, weight: 850, color: dark ? '#85f3cf' : '#07825f' },
    ], { width: 620, height: 260, top: 76, left: 48 });
    const label = new THREE.Mesh(
        new THREE.PlaneGeometry(2.42, 1.02),
        new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false })
    );
    label.position.set(2.68, -1.62, 0.72);
    label.rotation.y = -0.16;
    label.scale.setScalar(0.001);
    root.add(label);

    const shadow = createContactShadow(THREE, 5.1, dark ? 0.35 : 0.21);
    shadow.position.set(0, -2.72, -0.72);
    root.add(shadow);

    return {
        root,
        update(time, pointer) {
            const cycle = time % 8.6;
            const removal = smooth(clamp((cycle - 1.3) / 2.4));
            const reset = smooth(clamp((cycle - 7.15) / 0.9));
            const amount = removal * (1 - reset);
            sweep.visible = cycle > 1 && cycle < 4.25;
            sweep.position.x = THREE.MathUtils.lerp(-2.05, 2.05, smooth(clamp((cycle - 1.15) / 2.55)));
            photoMaterial.opacity = 1 - amount;
            photo.position.x = amount * -0.72;
            photo.position.z = -0.08 - amount * 0.48;
            subject.position.x = amount * 0.42;
            subject.position.z = 0.04 + amount * 0.66;
            subject.rotation.y = amount * -0.08;
            checker.position.z = -0.18 - amount * 0.08;
            root.rotation.y = pointer.x * 0.035 + amount * 0.1;
            root.rotation.x = -0.025 + pointer.y * 0.025;
            const labelScale = smooth(clamp((cycle - 3.35) / 0.65)) * (1 - reset);
            label.scale.setScalar(Math.max(0.001, labelScale));
        },
        resize({ compact }) {
            root.scale.setScalar(compact ? 0.78 : 0.9);
        },
        dispose() {
            photoMaterial.map?.dispose();
            subjectMaterial.map?.dispose();
            checker.material.map?.dispose();
            labelTexture.dispose();
        },
    };
}
