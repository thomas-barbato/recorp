// main_engine.js
import { initGlobals } from './globals.js';
import './touch.js'; // side effects: expose action_listener_touch_click and friends to window
import SpriteManager from './engine/sprite_manager.js';
import CanvasManager from './engine/canvas_manager.js';
import Camera from './engine/camera.js';
import Input from './engine/input.js';
import Renderer from './engine/renderer.js';
import MapData from './renderers/map_data.js';
import UpdateLoop from './engine/update_loop.js';
import { initWebSocket } from './network/websocket_bootstrap.js';

// initialise les globals (lit les json_script injectés)
const ok = initGlobals();
if (!ok) {
    console.error('main_engine: initGlobals failed — aborting bootstrap');
} else {
    (async function bootstrap() {
        const TILE_SIZE = 32;
        const FPS = 60;

        // canvases (créera les éléments s'ils n'existent pas)
        const canvases = CanvasManager.init(['canvas-bg','canvas-fg','canvas-actors','canvas-ui']);

        // init sprite manager
        await SpriteManager.init({ tileSize: TILE_SIZE, basePath: '/static/img' });

        // map data -> prépare worldObjects
        const map = new MapData(window.map_informations, SpriteManager, TILE_SIZE);
        try {
        await map.prepare();
        } catch (e) {
        console.error('Map.prepare failed', e);
        }

        // camera
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

        // input: ui canvas is top layer
        const input = new Input({
        uiCanvas: canvases.ui,
        camera,
        map,
        onObjectClick: obj => {
            if (!obj) return;
            if (obj.type === 'player') {
            if (typeof open_close_modal === 'function') open_close_modal(`modal-pc_${obj.data.user.player}`);
            } else if (obj.type === 'foreground') {
            if (typeof open_close_modal === 'function') open_close_modal(`modal-${obj.data.name}`);
            } else {
            console.log('clicked object', obj);
            }
        },
        onTileClick: coord => {
            if (typeof display_pathfinding_mobile === 'function') display_pathfinding_mobile(coord);
        }
        });

        // websocket (init and expose)
        const ws = initWebSocket();
        window.ws = ws;

        console.log(TILE_SIZE)
        renderer.updateGridCoordinatesUI(camera, TILE_SIZE);
        // loop
        const loop = new UpdateLoop({ fps: FPS, map, renderer, camera, input });
        window.addEventListener('resize', () => {
            CanvasManager.resizeAll();
            camera.resize(CanvasManager.width, CanvasManager.height);
            console.log(TILE_SIZE)
            renderer.updateGridCoordinatesUI(camera, TILE_SIZE);
            renderer.requestRedraw();
        });

        // expose for debugging
        window.canvasEngine = { canvases, camera, map, renderer, input, loop, ws };

        loop.start();
        console.log('Canvas engine started');
    })();
}