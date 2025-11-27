// main_engine.js
import { currentPlayer, initGlobals } from './globals.js';
import './touch.js'; // side effects: expose action_listener_touch_click and friends to window
import SpriteManager from './engine/sprite_manager.js';
import CanvasManager from './engine/canvas_manager.js';
import Camera from './engine/camera.js';
import Input from './engine/input.js';
import Renderer from './engine/renderer.js';
import MapData from './renderers/map_data.js';
import UpdateLoop from './engine/update_loop.js';
import CanvasPathfinding from './engine/canvas_pathfinding.js';
import PathfindingController from './engine/pathfinding.js';
import { initMobilePathfinding } from "./engine/mobile_pathfinding.js";
import WebSocketManager from "./engine/websocket_manager.js";
import ActionRegistry from "./network/action_registry.js";
import { initWebSocket } from './network/websocket_bootstrap.js';
import "./network/ws_actions.js";

// initialise les globals (lit les json_script injectés)
const ok = initGlobals();
if (!ok) {
    console.error('main_engine: initGlobals failed — aborting bootstrap');
} else {

    function resizeCanvasWrapper() {
        const TILE = 32;
        const w = window.innerWidth;

        let maxX, maxY;

        if (w < 640) {         // MOBILE
            maxX = 11; maxY = 11;

        } else if (w < 1024) { // TABLETTE
            maxX = 20; maxY = 20;

        } else {               // PC
            maxX = 39; maxY = 23;
        }

        const wrapper = document.getElementById('canvas-wrapper');

        const widthPx  = maxX * TILE;
        const heightPx = maxY * TILE;

        wrapper.style.width  = widthPx + "px";
        wrapper.style.height = heightPx + "px";

        wrapper.style.maxWidth  = widthPx + "px";
        wrapper.style.maxHeight = heightPx + "px";

        wrapper.style.marginLeft  = "auto";
        wrapper.style.marginRight = "auto";
    }

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
        } else {
            // center roughly in middle of map if no player
            camera.centerOn(Math.floor(map.mapWidth / 2), Math.floor(map.mapHeight / 2));
        }
        // renderer
        const renderer = new Renderer({ canvases, camera, spriteManager: SpriteManager, map });

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

                const inRange = isInRange(obj);

                // -------------------------------
                // 2) Flip si joueur clique sur lui-même
                // -------------------------------
                if (obj.type === 'player' && String(obj.data.user.player) === String(window.current_player_id)) {
                    console.log("%c[CANVAS] Flip ship envoyé via WebSocket color:#00ff9d;font-weight:bold;");
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
                } else if (obj.type === 'foreground') {
                    // foreground : nom = data.data.name
                    modalId = `modal-${obj.data.data.name}`;
                } else {
                    console.warn('Unknown object type for modal:', obj.type);
                    return;
                }

                // foreground hors portée sonar -> pas cliquable
                if (obj.type === 'foreground' && !inRange) {
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
            onMouseMove: (tx, ty, info) => {
                // 1) Pathfinding : garder ta logique existante
                canvasPathfinding.handleHover(tx, ty);

                const player = map.findPlayerById(window.current_player_id);
                const obj = info.topObject || null;
                const canvasZone = document.getElementById("canvas-zone");

                // 2) Gestion du sonar (ta logique d'origine, conservée)
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

                // 3) Gestion du curseur (NOUVEAU) sans casser les classes Tailwind
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
                    } else if (obj.type === 'player' || obj.type === 'npc') {
                        // tous les vaisseaux = pointer, même hors sonar
                        cursorClass = 'cursor-pointer';
                    }

                    cls.add(cursorClass);
                }

                // 4) Stocker la cible survolée pour les bordures (ActorsRenderer / ForegroundRenderer)
                if (window.canvasEngine) {
                    window.canvasEngine.hoverTarget = obj;
                }

                // 5) Redraw pour mettre à jour les bordures hover
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
            }
        });
        
        // websocket
        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws_url = `${ws_scheme}://${window.location.host}/ws/play_${map_informations.sector.id}/`;
        const ws = new WebSocketManager(ws_url);
        ws.connect();

        const loop = new UpdateLoop({ fps: FPS, map, renderer, camera, input });
        window.addEventListener('resize', () => {
            resizeCanvasWrapper();
            CanvasManager.resizeAll();
            camera.resize(CanvasManager.width, CanvasManager.height);
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

        window.canvasEngine = { 
            canvases, 
            camera, 
            map, 
            renderer, 
            input, 
            loop, 
            ws,
            pathfinding: canvasPathfinding,
        };

        try {
            initMobilePathfinding(window.canvasEngine);
        } catch (e) {
            console.error("[MOBILE PF] initMobilePathfinding error:", e);
        }

        loop.start();
        console.log('Canvas engine started');
    })();
}
