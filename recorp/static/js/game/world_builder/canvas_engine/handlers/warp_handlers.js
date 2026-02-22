function getGameState() {
    return window.GameState || null;
}

function getEngine() {
    return getGameState()?.canvasEngine ?? window.canvasEngine ?? null;
}

function getCurrentPlayerId() {
    return getGameState()?.currentPlayerId ?? window.current_player_id ?? null;
}

function getCurrentPlayerData() {
    return getGameState()?.currentPlayer ?? window.currentPlayer ?? null;
}

function requestWorldRedraw() {
    getEngine()?.renderer?.requestRedraw?.();
}

function getCurrentSectorId() {
    return getGameState()?.mapInformations?.sector?.id ?? window.map_informations?.sector?.id ?? null;
}

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
    const engine = getEngine();
    const currentPlayer = getCurrentPlayerData();
    if (engine?.floatingMessages) {
        engine.floatingMessages.addMessage(
            "⚠ Warp impossible : zone saturée",
            {
                x: currentPlayer?.user?.coordinates?.x,
                y: currentPlayer?.user?.coordinates?.y
            }
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
        const engine = getEngine();
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

        const playerId = getCurrentPlayerId();
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

        const currentSectorId = getCurrentSectorId();
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

    const engine = getEngine();
    if (!engine) return;

    const map = engine.map;
    if (!map) return;

    // 1️⃣ Supprimer l’acteur de la map
    map.removeActorByPlayerId(shipId);

    // 2️⃣ 🔥 PURGE DES DONNÉES DE SCAN
    if (window.isScanned(actorId)) {

        window.clearScan(actorId);
        delete window.scannedMeta?.[actorId];
        delete window.scannedModalData?.[actorId];

        // Si un modal est ouvert → rebuild propre
        if (typeof refreshModalAfterScan === "function") {
            refreshModalAfterScan(actorId);
        }
    }

    // 3️⃣ Redraw
    requestWorldRedraw();

    // Fermer CombatScene si cible ou joueur concerné
    if (window.ActionSceneManager?.isActive?.("combat")) {
        const context = window.ActionSceneManager.getContext?.();
        const removedKey = `pc_${data.player_id}`;

        if (context &&
            (context.attackerKey === removedKey ||
            context.targetKey === removedKey)) {

            window.ActionSceneManager.close({ reason: "actor_removed" });
        }
    }

}

export function handlerShipRemoved(data){
    const actorId = `pc_${data.ship_id}`;
    const engine = getEngine();
    if (!engine) return;

    const map = engine.map;
    if (!map) return;

    map.removeActorByPlayerId(data.player_id);
    requestWorldRedraw();

    // Fermer CombatScene si cible ou joueur concerné
    if (window.ActionSceneManager?.isActive?.("combat")) {
        const context = window.ActionSceneManager.getContext?.();
        const removedKey = `pc_${data.ship_id}`;

        if (context &&
            (context.attackerKey === removedKey ||
            context.targetKey === removedKey)) {

            window.ActionSceneManager.close({ reason: "actor_removed" });
        }
    }
}

export function handlerUserJoin(data){
    const actors = data;  // backend envoie directement la liste des PC
    const engine = getEngine();
    if (!engine) return;

    const map = engine.map;

    actors.forEach(actor => {
        map.addPlayerActor(actor);
    });

    requestWorldRedraw();
}

export function handlerShipAdded(data){
    const engine = getEngine();
    if (!engine) return;

    engine.map.addPlayerActor(data.actor);
    requestWorldRedraw();
}

export function handlerWarpComplete(){
    // Fermer CombatScene si cible ou joueur concerné
    if (window.ActionSceneManager?.isActive?.("combat")) {
        window.ActionSceneManager.close({ reason: "warp_complete" });
    }
    window.location.reload()

}

// Rendre disponible globalement pour modals.js
window.handleWarpTravel = handleWarpTravel;
