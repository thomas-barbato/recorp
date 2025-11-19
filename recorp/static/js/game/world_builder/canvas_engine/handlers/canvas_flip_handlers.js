// ============================================================================
// Handler du flip vaisseau reçu via WebSocket
// ============================================================================

export function handleCanvasFlipShip(payload) {

    console.log("[CANVAS] flip reçu :", payload);

    const { player_id } = payload;
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

    console.log(
        `%c[CANVAS] Ship flipped (player ${player_id}) → ${player.data.ship.is_reversed}`,
        "color:#00eaff;font-weight:bold;"
    );

    renderer.requestRedraw();
}
