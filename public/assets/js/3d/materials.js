export const FILE_COLORS = Object.freeze({
    PDF: 0xd6ff57,
    JPG: 0xff7657,
    PNG: 0xffad66,
    MP4: 0xb2a6ff,
    MP3: 0x64dbc1,
    TXT: 0xe7e6df,
    QR: 0x181b1a,
    ZIP: 0xffcf5a,
});

export function createMaterialSystem(THREE, dark = false) {
    const ink = dark ? 0xf5f4ec : 0x131715;
    const paper = dark ? 0x202522 : 0xf7f4e9;
    const glass = new THREE.MeshPhysicalMaterial({
        color: dark ? 0x343a32 : 0xe7e7d9,
        roughness: 0.22,
        metalness: 0.03,
        transmission: 0.42,
        transparent: true,
        opacity: 0.66,
        thickness: 0.7,
        side: THREE.DoubleSide,
    });

    return {
        ink,
        paper,
        glass,
        core: new THREE.MeshStandardMaterial({
            color: dark ? 0x202420 : 0xffffff,
            roughness: 0.28,
            metalness: 0.12,
        }),
        edge: new THREE.MeshStandardMaterial({
            color: dark ? 0x68705e : 0xc7cfb4,
            roughness: 0.34,
            metalness: 0.16,
        }),
        line: new THREE.LineBasicMaterial({
            color: dark ? 0x98a589 : 0x9aa98d,
            transparent: true,
            opacity: dark ? 0.38 : 0.3,
        }),
    };
}

export function fileFaceMaterial(THREE, color, dark = false) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: dark ? 0.3 : 0.38,
        metalness: 0.08,
    });
}

export function fileSideMaterial(THREE, color) {
    const c = new THREE.Color(color).multiplyScalar(0.58);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.12 });
}
