const familyFactories = {
    pdf: () => import('./families/PdfSceneFamily.js').then((module) => module.createPdfSceneFamily),
    image: () => import('./families/ImageSceneFamily.js').then((module) => module.createImageSceneFamily),
    video: () => import('./families/VideoSceneFamily.js').then((module) => module.createVideoSceneFamily),
    audio: () => import('./families/AudioSceneFamily.js').then((module) => module.createAudioSceneFamily),
    text: () => import('./families/TextSceneFamily.js').then((module) => module.createTextSceneFamily),
    utility: () => import('./families/UtilitySceneFamily.js').then((module) => module.createUtilitySceneFamily),
};

export async function createToolScene(context) {
    const family = context.container.dataset.fg3dFamily;
    const load = familyFactories[family] || familyFactories.utility;
    const factory = await load();
    return factory(context);
}
