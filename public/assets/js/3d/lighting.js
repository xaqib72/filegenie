export function addStudioLighting(THREE, scene, quality, dark = false) {
    const ambient = new THREE.HemisphereLight(dark ? 0xa7b3ff : 0xf7f8ff, dark ? 0x080916 : 0xd8def4, dark ? 1.15 : 1.6);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, dark ? 4.4 : 3.7);
    key.position.set(-5.5, 7, 8);
    key.castShadow = quality.shadows;
    if (quality.shadows) {
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.bias = -0.0008;
    }
    scene.add(key);

    const rim = new THREE.PointLight(0xd6ff57, dark ? 18 : 11, 20, 2);
    rim.position.set(5, 2, 3);
    scene.add(rim);

    const fill = new THREE.PointLight(0xff7657, dark ? 10 : 6, 18, 2);
    fill.position.set(-5, -3, 4);
    scene.add(fill);

    return { ambient, key, rim, fill };
}
