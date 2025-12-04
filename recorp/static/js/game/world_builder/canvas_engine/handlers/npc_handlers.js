export function addNpc(data){
    const engine = window.canvasEngine;
    if (!engine) return;

    engine.map.addNpcActor(data.npc);

    engine.renderer.requestRedraw();
}

export function removeNpc(data){
    const engine = window.canvasEngine;
    if (!engine) return;

    engine.map.removeNpcById(data.npc_id);

    engine.renderer.requestRedraw();
}