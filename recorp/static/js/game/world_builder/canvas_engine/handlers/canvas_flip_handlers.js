// ============================================================================
// Handler du flip vaisseau reçu via WebSocket
// ============================================================================

export function handleCanvasFlipShip(message) {
    let payload = message;
    if (typeof payload === "string") {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.warn("[CANVAS] payload flip invalide:", message);
            return;
        }
    }
    if (!payload || typeof payload !== "object") {
        return;
    }

    const player_id = payload.player_id ?? payload.player;
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

    if (Object.prototype.hasOwnProperty.call(payload, "is_reversed")) {
        player.data.ship.is_reversed = !!payload.is_reversed;
    } else {
        player.data.ship.is_reversed = !player.data.ship.is_reversed;
    }

    renderer.requestRedraw();
}
