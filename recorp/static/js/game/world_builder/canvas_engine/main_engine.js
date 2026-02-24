import { currentPlayer, initGlobals } from './globals.js';
import './touch.js';
import '../events/events_hud.js'
import SpriteManager from './engine/sprite_manager.js';
import CanvasManager from './engine/canvas_manager.js';
import Camera from './engine/camera.js';
import Input from './engine/input.js';
import Renderer from './engine/renderer.js';
import MapData from './renderers/map_data.js';
import UpdateLoop from './engine/update_loop.js';
import CanvasPathfinding from './engine/canvas_pathfinding.js';
import { initMobilePathfinding } from "./engine/mobile_pathfinding.js";
import { resizeCanvasWrapper } from "./engine/canvas_wrapper_resize.js"
import WebSocketManager from "./engine/websocket_manager.js";
import "./network/ws_actions.js";
import "./modals/modal_live_registry.js";
import "./modals/modal_live_router.js"
import "./modals/action_scene_manager.js";
import {
    isDesktop,
    updatePlayerCoords,
    updateTargetCoords,
    clearTargetCoords,
    updateHoverTooltip, 
    hideHoverTooltip
} from "./engine/update_coordinate_display.js";
import GameWorkerClient from "../workers/game_worker_client.js";

function getCurrentPlayerLifeStatus() {
    return window.GameState?.player?.currentPlayerStatus ?? window.current_player_status ?? "ALIVE";
}

function removeDeathRespawnOverlay() {
    document.getElementById("death-respawn-overlay")?.remove();
}

function mountDeathRespawnOverlay(ws) {
    if (getCurrentPlayerLifeStatus() !== "DEAD") {
        removeDeathRespawnOverlay();
        return;
    }
    if (document.getElementById("death-respawn-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "death-respawn-overlay";
    overlay.className = [
        "fixed", "inset-0", "z-[10000]",
        "bg-back/60", "backdrop-blur-sm",
        "flex", "items-center", "justify-center",
        "p-4"
    ].join(" ");

    const panel = document.createElement("div");
    panel.className = [
        "w-full", "max-w-md", "flex", "flex-col", "items-center",
        "rounded-xl", "border", "border-red-500/60",
        "bg-zinc-950/95", "shadow-2xl",
        "p-5", "text-center", "space-y-3", "gap-2"
    ].join(" ");

    const title = document.createElement("div");
    title.textContent = "Vous etes mort";
    title.className = "text-red-400 font-bold text-xl animate-pulse font-shadow";

    const body = document.createElement("div");
    body.className = "text-zinc-100 text-sm font-shadow";
    body.textContent = "Votre vaisseau a ete detruit. Cliquez pour reapparaitre.";

    const sub = document.createElement("div");
    sub.className = "text-zinc-400 text-xs";
    sub.textContent = "Respawn temporaire: secteur 7";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = [
        "px-4", "py-2", "rounded-md",
        "bg-red-700", "hover:bg-red-600",
        "text-white", "font-bold", "border", "border-red-400/50"
    ].join(" ");
    btn.textContent = "Revivre";
    btn.onclick = () => {
        const engineWs = ws || window.canvasEngine?.ws;
        if (!engineWs?.send) {
            btn.disabled = true;
            btn.textContent = "Connexion indisponible";
            return;
        }
        btn.disabled = true;
        btn.textContent = "Respawn en cours...";
        engineWs.send({
            type: "action_respawn",
            payload: {}
        });
    };

    panel.append(title, body, sub, btn);
    overlay.append(panel);
    document.body.append(overlay);
}

window.showDeathRespawnOverlay = function () {
    mountDeathRespawnOverlay(window.canvasEngine?.ws);
};

window.hideDeathRespawnOverlay = function () {
    removeDeathRespawnOverlay();
};

const ok = initGlobals();
if (!ok) {
    console.error('main_engine: initGlobals failed — aborting bootstrap');
} else {

    (async function bootstrap() {

        const TILE_SIZE = 32;
        const FPS = 60;
        await SpriteManager.init({ tileSize: TILE_SIZE, basePath: '/static/img' });

        const map = new MapData(window.map_informations, SpriteManager, TILE_SIZE);
        try {
            await map.prepare();
        } catch (e) {
            console.error('Map.prepare failed', e);
        }

        resizeCanvasWrapper();
        const canvases = CanvasManager.init(['canvas-bg', 'canvas-fg', 'canvas-actors', 'canvas-ui', 'canvas-floating']);

        const camera = new Camera({
            canvasWidth: CanvasManager.width,
            canvasHeight: CanvasManager.height,
            tileSize: TILE_SIZE,
            worldCols: map.mapWidth,
            worldRows: map.mapHeight
        });

        // center camera on player if exists
        const currentPlayerObj = map.findPlayerById(window.current_player_id);
        if (currentPlayerObj) {
            const centerX = currentPlayerObj.x + (currentPlayerObj.sizeX - 1) / 2;
            const centerY = currentPlayerObj.y + (currentPlayerObj.sizeY - 1) / 2;
            camera.centerOn(centerX, centerY);

            // 🔥 coords joueur au chargement (PC uniquement, logique interne dans updatePlayerCoords)
            updatePlayerCoords(currentPlayerObj);
        } else {
            // center roughly in middle of map if no player
            camera.centerOn(Math.floor(map.mapWidth / 2), Math.floor(map.mapHeight / 2));
        }
        if (currentPlayerObj && window.currentPlayerState?.ship) {
            currentPlayerObj.data = currentPlayerObj.data || {};
            currentPlayerObj.data.ship = currentPlayerObj.data.ship || {};

            currentPlayerObj.data.ship.current_movement =
                window.currentPlayerState.ship.current_movement;

            currentPlayerObj.data.ship.max_movement =
                window.currentPlayerState.ship.max_movement;
        }

        window.spriteManager = SpriteManager;
        window.spriteManager.init({
            basePath: "/static/img",
            tileSize: 32
        });

        // renderer
        const renderer = new Renderer({ 
            canvases, 
            camera, 
            spriteManager: window.spriteManager, 
            map 
        });

        // ------ PATHFINDING CANVAS ------
        const canvasPathfinding = new CanvasPathfinding({
            map,
            camera,
            renderer
        });

        // Connecter le pathfinder au renderer/UI
        if (renderer.setPathfinder) {
            renderer.setPathfinder(canvasPathfinding);
        }
        
        const input = new Input({
            uiCanvas: canvases.ui.el, // 💥 Le canvas interactif
            canvases,
            camera,
            map,
            renderer,
            pathfinding: canvasPathfinding,
            onObjectClick: obj => {
                if (!obj) return;
                const player = map.findPlayerById(window.current_player_id);
                if (!player) return;

                // -------------------------------
                // 1) Vérifier la portée (visible_zone / sonar)
                // -------------------------------
                function isInRange(target) {
                    // sonar moderne
                    if (renderer.sonar) {
                        return renderer.sonar.isVisible(target);
                    }
                    // fallback : visible_zone backend
                    const me = map.findPlayerById(window.current_player_id);
                    if (!me) return false;
                    const key = `${target.x}_${target.y}`;
                    return (me.data.ship.visible_zone || []).includes(key);
                }

                let inRange = isInRange(obj);
                let targetKey = null;

                if (obj.type === 'player') {
                    targetKey = `pc_${obj.data.user.player}`;
                } else if (obj.type === 'npc') {
                    targetKey = `npc_${obj.data.npc.id}`;
                }

                if (targetKey && (window.isScanned(targetKey) || window.sharedTargets?.has(targetKey))) {
                    inRange = true;
                }

                // -------------------------------
                // 2) Flip si joueur clique sur lui-même
                // -------------------------------
                if (obj.type === 'player' && String(obj.data.user.player) === String(window.current_player_id)) {
                    ws.send({
                        type: "canvas_flip_ship",
                        message: JSON.stringify({
                            player_id: window.current_player_id
                        })
                    });
                    return;  // TRÈS IMPORTANT : ne pas ouvrir de modal
                }

                // -------------------------------
                // 3) Construction du modalId
                // -------------------------------
                let modalId;
                if (obj.type === 'player') {
                    // PC
                    modalId = `modal-${inRange ? '' : 'unknown-'}pc_${obj.data.user.player}`;
                } else if (obj.type === 'npc') {
                    // NPC
                    modalId = `modal-${inRange ? '' : 'unknown-'}npc_${obj.data.npc.id}`;
                } else if (obj.type === 'foreground' || obj.type === 'wreck') {
                    // foreground / wreck : nom = {type}_{id}
                    modalId = `modal-${obj.id}`;
                } else {
                    console.warn('Unknown object type for modal:', obj.type);
                    return;
                }

                // foreground / wreck hors portée sonar -> pas cliquable
                if ((obj.type === 'foreground' || obj.type === 'wreck') && !inRange) {
                    return;
                }

                // -------------------------------
                // 4) Ouverture / fermeture du modal
                // -------------------------------
                if (typeof open_close_modal === 'function') {
                    open_close_modal(modalId);
                } else {
                    console.warn('open_close_modal is not defined');
                }
            },
            onTileClick: (tx, ty, info) => canvasPathfinding.handleClick(tx, ty),
            onMouseMove: (tx, ty, info, evt) => {
                // 1) Pathfinding : garder ta logique existante
                canvasPathfinding.handleHover(tx, ty);

                const player = map.findPlayerById(window.current_player_id);
                const obj = info.topObject || null;
                const canvasZone = document.getElementById("canvas-zone");

                // 2) Gestion du sonar (logique d'origine)
                if (player) {
                    const inside =
                        tx >= player.x &&
                        tx < player.x + player.sizeX &&
                        ty >= player.y &&
                        ty < player.y + player.sizeY;

                    const shouldBeActive = inside;
                    if (renderer.sonar.active !== shouldBeActive) {
                        renderer.sonar.active = shouldBeActive;
                        renderer.requestRedraw();
                    }
                }

                // 3) Gestion du curseur
                if (canvasZone) {
                    const cls = canvasZone.classList;
                    // on enlève seulement les classes cursor-*
                    cls.remove('cursor-crosshair', 'cursor-pointer', 'cursor-not-allowed');

                    const sonar = renderer.sonar;
                    let cursorClass = 'cursor-crosshair';

                    if (!obj) {
                        // case vide
                        cursorClass = 'cursor-crosshair';
                    } else if (obj.type === 'foreground') {
                        const inSonar = sonar && sonar.isVisible(obj);
                        cursorClass = inSonar ? 'cursor-pointer' : 'cursor-not-allowed';
                    } else if (obj.type === 'player' || obj.type === 'npc' || obj.type === 'wreck') {
                        // tous les vaisseaux = pointer, même hors sonar
                        cursorClass = 'cursor-pointer';
                    }

                    cls.add(cursorClass);
                }

                // 4) Stocker la cible survolée pour les bordures (ActorsRenderer / ForegroundRenderer)
                if (window.canvasEngine) {
                    window.canvasEngine.hoverTarget = obj;
                }

                // 5) 🔥 Mise à jour des coordonnées cibles (PC uniquement – filtré dans la fonction)
                updateTargetCoords(
                    obj,
                    tx,
                    ty,
                    map.raw?.sector?.name ?? ""
                );

                const inSonar = renderer.sonar.isVisible(obj);
                updateHoverTooltip(obj, tx, ty, map.raw.sector.name, evt, inSonar);

                // 6) Redraw pour mettre à jour bordures + pathfinding
                renderer.requestRedraw();
            },

            onMouseLeave: () => {
                canvasPathfinding.clear();
                renderer.sonar.active = false;
                renderer.requestRedraw();

                const canvasZone = document.getElementById("canvas-zone");
                if (canvasZone) {
                    const cls = canvasZone.classList;
                    cls.remove('cursor-crosshair', 'cursor-pointer', 'cursor-not-allowed');
                    cls.add('cursor-crosshair'); // retour au curseur par défaut sur la grille
                }

                if (window.canvasEngine) {
                    window.canvasEngine.hoverTarget = null;
                }

                // reset des coords cibles quand on sort de la carte (PC uniquement)
                clearTargetCoords(map.raw?.sector?.name ?? "Nothing selected");

                // Cacher le tooltip
                hideHoverTooltip();
            }
        });
        
        // websocket
        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws_url = `${ws_scheme}://${window.location.host}/ws/play_${window.map_informations.sector.id}/`;
        const ws = new WebSocketManager(ws_url);
        ws.connect();
        
        ws.on("open", () => {
            ws.send({
                type: "request_scan_state_sync"
            });
        });

        const loop = new UpdateLoop({ fps: FPS, map, renderer, camera, input });
        window.addEventListener('resize', () => {
            resizeCanvasWrapper();                   // adapte le wrapper selon la résolution
            CanvasManager.resizeAll();               // redimensionne les canvas
            camera.resize(CanvasManager.width, CanvasManager.height);   // recalcule visibleTilesX/Y

            // ====== RECENTRAGE DE LA CAMERA SUR LE JOUEUR ======
            const cp = map.findPlayerById(window.current_player_id);
            if (cp) {
                const cx = cp.x + (cp.sizeX - 1) / 2;
                const cy = cp.y + (cp.sizeY - 1) / 2;
                camera.centerOn(cx, cy);

                // 🔥 mettre à jour coords joueur après resize
                updatePlayerCoords(cp);
            }
            
            renderer.requestRedraw();
            renderer.updateGridCoordinatesUI(camera, TILE_SIZE);
        
            const sonarBtn = document.getElementById("sonar-toggle-btn");
            if (sonarBtn) {
                sonarBtn.addEventListener("click", () => {
                    renderer.sonar.active = !renderer.sonar.active;
                    renderer.requestRedraw();

                    // Option : feedback visuel du bouton
                    sonarBtn.classList.toggle("active", renderer.sonar.active);
                });
            }
        });

        renderer.updateGridCoordinatesUI(camera, TILE_SIZE);

        const sonarBtn = document.getElementById("sonar-toggle-btn");
        if (sonarBtn) {
            sonarBtn.addEventListener("click", () => {
                renderer.sonar.active = !renderer.sonar.active;
                renderer.requestRedraw();

                // Option : feedback visuel du bouton
                sonarBtn.classList.toggle("active", renderer.sonar.active);
            });
        }

        const gameWorker = new GameWorkerClient();

        window.canvasEngine = { 
            canvases, 
            camera, 
            map, 
            renderer, 
            input, 
            loop, 
            ws,
            pathfinding: canvasPathfinding,
            gameWorker
        };
        if (window.GameState?.refs) {
            window.GameState.refs.canvasEngine = window.canvasEngine;
        }

        mountDeathRespawnOverlay(ws);

        try {
            initMobilePathfinding(window.canvasEngine);
        } catch (e) {
            console.error("[MOBILE PF] initMobilePathfinding error:", e);
        }

        loop.start();

        if (window.sectorLoader) {
            setTimeout(() => {
                window.sectorLoader.hide();
            }, 800);
        }
        
    })();
}
