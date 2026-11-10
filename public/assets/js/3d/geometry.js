export function roundedRectShape(THREE, width, height, radius) {
    const x = -width / 2;
    const y = -height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
}

export function roundedBoxGeometry(THREE, width, height, depth = 0.14, radius = 0.16) {
    const shape = roundedRectShape(THREE, width, height, Math.min(radius, width / 3, height / 3));
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: Math.min(0.045, radius / 2),
        bevelThickness: 0.035,
        curveSegments: 8,
    });
    geometry.center();
    return geometry;
}

export function makeLabelTexture(THREE, label, color = '#ffffff', sublabel = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    ctx.beginPath();
    ctx.roundRect(34, 30, 148, 60, 18);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '800 38px Inter, Arial, sans-serif';
    ctx.fillText(label, 56, 73);
    ctx.globalAlpha = 0.58;
    for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(38, 145 + (i * 34), i === 1 ? 290 : 360, 10);
    }
    ctx.globalAlpha = 0.78;
    ctx.font = '600 18px Inter, Arial, sans-serif';
    ctx.fillText(sublabel || 'LOCAL FILE', 38, 282);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
}

export function makePanelTexture(THREE, lines, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = options.width || 768;
    canvas.height = options.height || 420;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (options.background) {
        ctx.fillStyle = options.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const left = options.left || 54;
    let y = options.top || 92;
    lines.forEach((line, index) => {
        ctx.globalAlpha = line.opacity ?? 1;
        ctx.fillStyle = line.color || '#ffffff';
        ctx.font = `${line.weight || 700} ${line.size || 34}px ${line.mono ? 'ui-monospace, monospace' : 'Inter, Arial, sans-serif'}`;
        ctx.fillText(line.text, left, y);
        y += line.gap || (line.size || 34) * 1.5;
        if (index === 0 && options.rule) {
            ctx.globalAlpha = 0.2;
            ctx.fillRect(left, y - 12, canvas.width - left * 2, 2);
            y += 15;
        }
    });
    ctx.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
}

export function createPanel(THREE, width, height, depth, faceColor, lines, options = {}) {
    const group = new THREE.Group();
    const geometry = roundedBoxGeometry(THREE, width, height, depth, options.radius || 0.18);
    const body = new THREE.Mesh(geometry, [
        new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.3, metalness: 0.07, transparent: Boolean(options.transparent), opacity: options.opacity || 1 }),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(faceColor).multiplyScalar(0.55), roughness: 0.4, metalness: 0.1 }),
    ]);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    if (lines?.length) {
        const texture = makePanelTexture(THREE, lines, options.texture || {});
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(width * 0.93, height * 0.9),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
        );
        plane.position.z = depth / 2 + 0.055;
        group.add(plane);
        group.userData.disposeTextures = [texture];
    }
    return group;
}

export function createFileObject(THREE, label, color, options = {}) {
    const width = options.width || 2.05;
    const height = options.height || 1.36;
    const depth = options.depth || 0.16;
    const group = new THREE.Group();
    const geometry = roundedBoxGeometry(THREE, width, height, depth, 0.15);
    const face = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.08 });
    const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.55), roughness: 0.44, metalness: 0.12 });
    const body = new THREE.Mesh(geometry, [face, side]);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const labelTexture = makeLabelTexture(THREE, label, '#ffffff', options.sublabel || 'LOCAL FILE');
    const labelPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.92, height * 0.92),
        new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false })
    );
    labelPlane.position.z = depth / 2 + 0.055;
    group.add(labelPlane);

    const fold = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.028, 0.035),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0.25 })
    );
    fold.position.set(width * 0.27, height * 0.34, depth / 2 + 0.075);
    fold.rotation.z = -0.52;
    group.add(fold);
    group.userData.disposeTextures = [labelTexture];
    return group;
}

let shadowTexture;
export function createContactShadow(THREE, width = 2.4, opacity = 0.26) {
    if (!shadowTexture) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
        gradient.addColorStop(0, 'rgba(8,10,28,.72)');
        gradient.addColorStop(0.52, 'rgba(8,10,28,.22)');
        gradient.addColorStop(1, 'rgba(8,10,28,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        shadowTexture = new THREE.CanvasTexture(canvas);
    }
    const material = new THREE.SpriteMaterial({ map: shadowTexture, transparent: true, opacity, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width, width * 0.38, 1);
    return sprite;
}

export function createConnector(THREE, from, to, material) {
    const mid = from.clone().lerp(to, 0.5);
    mid.z -= 0.55;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
    return new THREE.Line(geometry, material.clone());
}
