function getGameState() {
    return window.GameState || null;
}

function getEngine() {
    return getGameState()?.canvasEngine ?? window.canvasEngine ?? null;
}

function getMapDataStore() {
    return window.mapData || null;
}

export async function handleSectorSync(message) {

    const raw = message.data || message;

    const engine = getEngine();
    if (!engine) {
        console.warn("[sector_sync] canvasEngine non prêt");
        return;
    }

    // Prépare la MapData (nouveau cache minimal)
    const mapData = getMapDataStore();
    if (!mapData) {
        console.error("[sector_sync] mapData manquant");
        return;
    }

    mapData.raw = raw;

    // prepare peut être async
    const res = mapData.prepare?.();
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

}
