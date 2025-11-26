// ws_actions.js
// Gestion des actions reçues via WebSocket pour le moteur canvas
// (déplacements, mise à jour des points de mouvement, etc.)

import ActionRegistry from "./action_registry.js";

/**
 * Met à jour le HUD des points de mouvement pour le joueur courant.
 * - PC : #movement-container-value-min / #movement-container-value-max / #movement-percent
 * - Mobile : #movement-container-value-current / #movement-container-value-max
 */
function updateHudMovement(playerId, remainingMovement, maxMove) {
    // On ne met à jour le HUD complet que pour le joueur courant
    if (String(playerId) !== String(window.current_player_id)) {
        return;
    }

    const remaining = typeof remainingMovement === "number" ? remainingMovement : 0;
    const max = typeof maxMove === "number" && maxMove > 0 ? maxMove : remaining;

    // -------------------------
    // PC : barre + texte
    // -------------------------
    try {
        const spanMin = document.getElementById("movement-container-value-min");
        const spanMax = document.getElementById("movement-container-value-max");
        const bar = document.getElementById("movement-percent");

        if (spanMin) {
            spanMin.textContent = remaining.toString();
        }
        if (spanMax) {
            spanMax.textContent = max.toString();
        }
        if (bar) {
            const pct = Math.max(0, Math.min(100, (remaining / max) * 100));
            bar.style.width = `${pct}%`;
        }
    } catch (e) {
        console.warn("[HUD] Erreur update HUD PC movement:", e);
    }

    // -------------------------
    // Mobile : valeur simple
    // -------------------------
    try {
        const spanCurrentMobile = document.getElementById("movement-container-value-current");
        const spanMaxMobile = document.getElementById("movement-container-value-max");

        if (spanCurrentMobile) {
            spanCurrentMobile.textContent = remaining.toString();
        }
        if (spanMaxMobile && max) {
            spanMaxMobile.textContent = max.toString();
        }
    } catch (e) {
        console.warn("[HUD] Erreur update HUD mobile movement:", e);
    }
}

/**
 * Met à jour la structure map_informations côté client
 * en cohérence avec ce que renvoie le backend.
 *
 * On cherche le bon PC dans map_informations.pc[]
 * puis on met à jour ship.current_movement / ship.max_movement.
 */
function syncMapInformationsMovement(playerId, remainingMovement, maxMove) {
    if (!window.map_informations) return;

    const pcList = Array.isArray(window.map_informations.pc)
        ? window.map_informations.pc
        : [];

    const idx = pcList.findIndex(
        p => String(p.user?.player) === String(playerId)
    );

    if (idx === -1) {
        return;
    }

    const ship = pcList[idx].ship || {};
    if (typeof remainingMovement === "number") {
        ship.current_movement = remainingMovement;
    }
    if (typeof maxMove === "number") {
        ship.max_movement = maxMove;
    }

    pcList[idx].ship = ship;
}

/**
 * Met à jour aussi l’acteur dans la MapData (côté canvas)
 * pour que toutes les logiques qui lisent me.data.ship.* soient cohérentes.
 */
function syncCanvasPlayerMovement(playerId, remainingMovement, maxMove) {
    const engine = window.canvasEngine;
    if (!engine || !engine.map) return;

    const actor = engine.map.findPlayerById(playerId);
    if (!actor || !actor.data || !actor.data.ship) return;

    if (typeof remainingMovement === "number") {
        actor.data.ship.current_movement = remainingMovement;
    }
    if (typeof maxMove === "number") {
        actor.data.ship.max_movement = maxMove;
    }
}

/**
 * Handler générique pour les updates de PM (par ex. type "update_mp")
 */
function handleUpdateMovementGeneric(msg) {
    if (!msg) return;

    const playerId = msg.player_id ?? msg.player ?? window.current_player_id;
    const remaining = msg.move;
    const maxMove = msg.max_move ?? msg.max_movement;

    if (playerId == null || remaining == null) {
        return;
    }

    syncMapInformationsMovement(playerId, remaining, maxMove);
    syncCanvasPlayerMovement(playerId, remaining, maxMove);
    updateHudMovement(playerId, remaining, maxMove);
}

/**
 * Handler pour les messages de déplacement "player_move"
 * (avec path, end_x, end_y, move_cost, move, max_move, etc.)
 */
function handlePlayerMove(msg) {
    if (!msg) return;

    const engine = window.canvasEngine;
    const playerId = msg.player_id;
    if (!engine || !engine.map || playerId == null) return;

    const actor = engine.map.findPlayerById(playerId);
    if (!actor) {
        console.warn("[WS player_move] actor not found for player_id", playerId);
        return;
    }

    const endX = msg.end_x;
    const endY = msg.end_y;
    const path = Array.isArray(msg.path) ? msg.path : [];

    const remaining = (typeof msg.move === "number")
        ? msg.move
        : msg.remaining_movement;
    const maxMove = msg.max_move ?? msg.max_movement;

    // ----------------------------------------------------------
    // 1) ANIMATION SI DISPONIBLE
    // ----------------------------------------------------------
    let animationUsed = false;
    try {
        if (engine.renderer &&
            engine.renderer.actors &&
            typeof engine.renderer.actors.addMovementAnimationPath === "function" &&
            path.length > 0) {

            animationUsed = true;

            engine.renderer.actors.addMovementAnimationPath(playerId, path, {
                finalX: endX,
                finalY: endY,
                onComplete: () => {
                    console.log(engine.camera && engine.camera.autoCenter)
                    try {
                        if (engine.camera && engine.camera.autoCenter) {
                            const sizeX = actor.sizeX || actor.data?.ship?.sizeX || 1;
                            const sizeY = actor.sizeY || actor.data?.ship?.sizeY || 1;

                            const centerX = endX + (sizeX - 1) / 2;
                            const centerY = endY + (sizeY - 1) / 2;

                            engine.camera.centerOn(centerX, centerY);

                            renderMoveCostAbovePlayer(playerId, msg.move_cost);
                            // mise à jour de la position du joueur.
                            if (playerId === window.current_player_id) {
                                currentPlayer.user.coordinates.x = endX;
                                currentPlayer.user.coordinates.y = endY;
                            }

                            engine.renderer.requestRedraw();
                            window.canvasEngine.renderer.requestRedraw();

                            // ⭐ FIX SONAR : remettre à zéro pour réinitialiser la rotation
                            if (window.canvasEngine?.renderer?.ui?.sonar) {
                                window.canvasEngine.renderer.ui.sonar._sonarPulseTime = 0;
                            }
                        }
                    } catch (e) {
                        console.warn("[WS player_move] camera recenter error (animation):", e);
                    }
                }
            });

        } else {
            actor.x = endX;
            actor.y = endY;
        }
    } catch (e) {
        console.warn("[WS player_move] erreur animation:", e);
        actor.x = endX;
        actor.y = endY;
    }

    // ----------------------------------------------------------
    // 2) MISE À JOUR PM
    // ----------------------------------------------------------
    if (remaining != null) {
        syncMapInformationsMovement(playerId, remaining, maxMove);
        syncCanvasPlayerMovement(playerId, remaining, maxMove);
        updateHudMovement(playerId, remaining, maxMove);
    }

    // ----------------------------------------------------------
    // 3) RECENTRAGE DIRECT (si pas d'animation)
    // ----------------------------------------------------------
    if (!animationUsed) {
        try {
            if (engine.camera && engine.camera.autoCenter) {
                const sizeX = actor.sizeX || actor.data?.ship?.sizeX || 1;
                const sizeY = actor.sizeY || actor.data?.ship?.sizeY || 1;

                const centerX = endX + (sizeX - 1) / 2;
                const centerY = endY + (sizeY - 1) / 2;

                engine.camera.centerOn(centerX, centerY);
            }
        } catch (e) {
            console.warn("[WS player_move] camera recenter error:", e);
        }
    }

    // ----------------------------------------------------------
    // 4) REDESSIN
    // ----------------------------------------------------------
    if (engine.renderer && typeof engine.renderer.requestRedraw === "function") {
        engine.renderer.requestRedraw();
    }
}

function renderMoveCostAbovePlayer(playerId, cost) {
    const engine = window.canvasEngine;
    if (!engine || !engine.map || !engine.renderer) return;

    const actor = engine.map.findPlayerById(playerId);
    if (!actor) return;

    const sizeX = actor.sizeX || actor.data?.ship?.sizeX || 1;
    const sizeY = actor.sizeY || actor.data?.ship?.sizeY || 1;

    const worldX = (actor.renderX ?? actor.x) + (sizeX - 1) / 2;
    const worldY = (actor.renderY ?? actor.y) + (sizeY - 1) / 2;

    engine.renderer.addFloatingMessage({
        text: cost,
        icon: "ship",
        worldX,
        worldY,
        duration: 1200,
        color: "rgba(0,255,180,0.95)"
    });
}

// -----------------------------------------------------------
// Enregistrement dans ActionRegistry
// -----------------------------------------------------------

// Déplacement complet (avec path, endX, endY, move, max_move…)
ActionRegistry.register("player_move", handlePlayerMove);

// Mise à jour simple des PM (sans forcément de déplacement)
ActionRegistry.register("update_mp", handleUpdateMovementGeneric);

// On exporte éventuellement les helpers si besoin ailleurs
export {
    updateHudMovement,
    syncMapInformationsMovement,
    syncCanvasPlayerMovement,
    handlePlayerMove,
    handleUpdateMovementGeneric
};
