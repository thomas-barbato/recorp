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

function getActionSceneManager() {
    return window.ActionSceneManager || null;
}

function isTargetScanned(targetKey) {
    return window.isScanned?.(targetKey) === true;
}

function refreshScannedTargetUi(targetKey) {
    if (typeof refreshModalAfterScan === "function") {
        refreshModalAfterScan(targetKey);
    }
}

function purgeScanData(targetKey) {
    window.clearScan?.(targetKey);
    delete window.scannedMeta?.[targetKey];
    delete window.scannedModalData?.[targetKey];
}

function closeCombatSceneIfActorAffected(removedKey, reason = "actor_removed") {
    const asm = getActionSceneManager();
    if (!asm?.isActive?.("combat")) return;
    const context = asm.getContext?.();
    if (!context) return;

    if (context.attackerKey === removedKey || context.targetKey === removedKey) {
        asm.close?.({ reason });
    }
}

function resolveRemovedActorKey(data) {
    if (!data) return null;
    if (data.actor_key) return String(data.actor_key);
    if (data.target_key) return String(data.target_key);
    if (data.player_id != null) return `pc_${data.player_id}`;
    if (data.player != null) return `pc_${data.player}`;
    if (data.id != null) return `pc_${data.id}`;
    if (data.ship_id != null) return `pc_${data.ship_id}`;
    if (data.npc_id != null) return `npc_${data.npc_id}`;
    return null;
}

function removeActorFromMap(map, actorKey, data) {
    if (!map) return;
    if (actorKey?.startsWith("npc_")) {
        const npcId = actorKey.replace("npc_", "");
        map.removeNpcById?.(npcId);
        return;
    }

    const playerId =
        data?.player_id ??
        data?.player ??
        data?.id ??
        (actorKey?.startsWith("pc_") ? actorKey.replace("pc_", "") : null);
    if (playerId != null) {
        map.removeActorByPlayerId(playerId);
    }
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
    
    const actorId = resolveRemovedActorKey(data) || (data?.player_id != null ? `pc_${data.player_id}` : null);

    const engine = getEngine();
    if (!engine) return;

    const map = engine.map;
    if (!map) return;

    // 1️⃣ Supprimer l’acteur de la map
    removeActorFromMap(map, actorId, data);

    // 2️⃣ 🔥 PURGE DES DONNÉES DE SCAN
    if (actorId && isTargetScanned(actorId)) {
        purgeScanData(actorId);
        refreshScannedTargetUi(actorId);
    }

    // 3️⃣ Redraw
    requestWorldRedraw();

    // Fermer CombatScene si cible ou joueur concerné
    if (actorId) closeCombatSceneIfActorAffected(actorId, "actor_removed");

}

export function handlerShipRemoved(data){
    const actorId = resolveRemovedActorKey(data) || (data?.ship_id != null ? `pc_${data.ship_id}` : null);
    const engine = getEngine();
    if (!engine) return;

    const map = engine.map;
    if (!map) return;

    removeActorFromMap(map, actorId, data);
    requestWorldRedraw();

    // Fermer CombatScene si cible ou joueur concerné
    if (actorId) closeCombatSceneIfActorAffected(actorId, "actor_removed");
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
    getActionSceneManager()?.close?.({ reason: "warp_complete" });
    window.location.reload()

}

// Rendre disponible globalement pour modals.js
window.handleWarpTravel = handleWarpTravel;
