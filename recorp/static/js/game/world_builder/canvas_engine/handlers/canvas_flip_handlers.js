// ============================================================================
// Handler du flip vaisseau reçu via WebSocket
// ============================================================================

export function handleCanvasFlipShip(message) {

    const { player_id } = message;
    const engine = window.canvasEngine;
    if (!engine) {
        console.warn("[CANVAS] window.canvasEngine introuvable");
        return;
    }

    const { map, renderer } = engine;

    const player = map.findPlayerById(player_id);
    if (!player || !player.data || !player.data.ship) {
        console.warn("[CANVAS] joueur introuvable pour flip :", player_id);
        return;
    }

    // --- ON RETOURNE SON VAISSEAU ---
    player.data.ship.is_reversed = !player.data.ship.is_reversed;

    renderer.requestRedraw();
}
