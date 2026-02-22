function getGameState() {
    return window.GameState || null;
}

function getEngine() {
    return getGameState()?.canvasEngine ?? window.canvasEngine ?? null;
}

function requestWorldRedraw() {
    getEngine()?.renderer?.requestRedraw?.();
}

export function addNpc(data){
    const engine = getEngine();
    if (!engine) return;

    engine.map.addNpcActor(data.npc);

    requestWorldRedraw();
}

export function removeNpc(data){
    const engine = getEngine();
    if (!engine) return;

    engine.map.removeNpcById(data.npc_id);

    requestWorldRedraw();
}
