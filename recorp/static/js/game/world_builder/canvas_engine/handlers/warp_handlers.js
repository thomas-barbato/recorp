export function handlerWarpFailed(data) {
    console.warn("[warp] Warp impossible :", data);

    // cacher loader si actif
    if (window.sectorLoader) {
        window.sectorLoader.setText("Impossible d'effectuer le warp.");
        setTimeout(() => window.sectorLoader.hide?.(), 200);
    }

    // réactiver actions
    window._syncInProgress = false;

    // message UI
    if (window.canvasEngine?.floatingMessages) {
        window.canvasEngine.floatingMessages.addMessage(
            "⚠ Warp impossible : zone saturée",
            { x: window.currentPlayer.user.coordinates.x,
            y: window.currentPlayer.user.coordinates.y }
        );
    } else {
        alert("Warp impossible : aucune place disponible autour de la warpzone.");
    }
}

function buildStartIdArray(startX, startY, sizeX, sizeY) {
    const arr = [];
    for (let dy = 0; dy < sizeY; dy++) {
        for (let dx = 0; dx < sizeX; dx++) {
            arr.push(`${startY + dy}_${startX + dx}`);
        }
    }
    return arr;
}

export function handleWarpTravel(sectorWarpZoneId) {
    try {
        const engine = window.canvasEngine;
        if (!engine) {
            console.error("[warp] canvasEngine indisponible");
            return;
        }

        const ws = engine.ws;
        const map = engine.map;

        if (!ws) {
            console.error("[warp] ws manquant (engine.ws)");
            return;
        }
        if (!map) {
            console.error("[warp] map manquante (engine.map)");
            return;
        }

        const playerId = window.current_player_id;
        if (!playerId) {
            console.error("[warp] Aucun current_player_id");
            return;
        }

        const me = map.findPlayerById(playerId);
        if (!me) {
            console.error("[warp] Vaisseau du joueur introuvable dans mapData");
            return;
        }

        const sizeX = me.sizeX || 1;
        const sizeY = me.sizeY || 1;
        const startX = me.x;
        const startY = me.y;

        const currentSectorId = window.map_informations?.sector?.id;
        if (!currentSectorId) {
            console.error("[warp] map_informations.sector.id introuvable");
            return;
        }

        const payload = {
            player_id: Number(playerId),
            sectorwarpzone_id: Number(sectorWarpZoneId),
            current_sector_id: Number(currentSectorId),

            start_id_array: buildStartIdArray(startX, startY, sizeX, sizeY),

            coordinates: { x: startX, y: startY },
            size: { x: sizeX, y: sizeY }
        };

        console.log(
            "%c[CANVAS] Envoi async_warp_travel →",
            "color:#00ff9d;font-weight:bold;",
            payload
        );

        // loading screen optionnel
        if (window.sectorLoader) {
            try {
                window.sectorLoader.setText("Saut warp en cours…");
                window.sectorLoader.show?.();
            } catch (e) {
                console.warn("[warp] sectorLoader présent mais erreur :", e);
            }
        }

        ws.send({
            type: "async_warp_travel",
            message: JSON.stringify(payload)
        });

        // éviter actions concurrentes
        window._syncInProgress = true;

    } catch (e) {
        console.error("[warp] Exception handleWarpTravel :", e);
    }
}

export function handlerRemovePlayer(data){
    
    const shipId = data.player_id;
    const actorId = `pc_${shipId}`;

    const engine = window.canvasEngine;
    if (!engine) return;

    const map = engine.map;
    if (!map) return;

    console.log("[WS] Suppression acteur →", actorId);

    map.removeActorByPlayerId(data.player_id);

    // Forcer un rafraîchissement du renderer
    engine.renderer.requestRedraw();

}

export function handlerShipRemoved(data){
    const actorId = `pc_${data.ship_id}`;
    const engine = window.canvasEngine;
    if (!engine) return;

    map.removeActorByPlayerId(data.player_id);
    engine.renderer.requestRedraw();
}

export function handlerUserJoin(data){
    const actors = data;  // backend envoie directement la liste des PC
    const engine = window.canvasEngine;
    if (!engine) return;

    const map = engine.map;

    console.log("[WS] Nouveaux acteurs ajoutés", actors);

    actors.forEach(actor => {
        map.addPlayerActor(actor);
    });

    engine.renderer.requestRedraw();
}

export function handlerShipAdded(data){
    const engine = window.canvasEngine;
    if (!engine) return;

    engine.map.addPlayerActor(data.actor);
    engine.renderer.requestRedraw();
}

export function handlerWarpComplete(){
    window.location.reload()
}

// Rendre disponible globalement pour modals.js
window.handleWarpTravel = handleWarpTravel;