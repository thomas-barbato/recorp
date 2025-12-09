export async function handleSectorSync(message) {
    console.log("[WS] sector_sync reçu :", message);

    const raw = message.data || message;

    const engine = window.canvasEngine;
    if (!engine) {
        console.warn("[sector_sync] canvasEngine non prêt");
        return;
    }

    // Prépare la MapData (nouveau cache minimal)
    if (!window.mapData) {
        console.error("[sector_sync] mapData manquant");
        return;
    }

    window.mapData.raw = raw;

    // prepare peut être async
    const res = window.mapData.prepare?.();
    if (res && typeof res.then === "function") {
        await res;
    }

    // Demander un rendu complet
    if (engine.renderer?.renderAll) {
        engine.renderer.renderAll();
    } else if (engine.render) {
        engine.render();
    }

    // Cacher éventuel loader
    if (window.sectorLoader) {
        window.sectorLoader.hide?.();
    }

    console.log("[WS] sector_sync appliqué ✓");
}