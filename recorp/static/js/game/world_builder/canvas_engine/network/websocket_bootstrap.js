// websocket_bootstrap.js
import WebSocketManager from './websocket_manager.js';
import { map_informations, current_player_id } from '../globals.js';
import { DefaultActionManager } from '../actions/action_manager.js';


// expose legacy hooks
window.requestDataSync = requestDataSync;
window.handle_websocket_message = handle_websocket_message;

let wsInstance = null;

export function initWebSocket() {
    const room = map_informations?.sector?.id || map_informations?.room || null;
    if (!room) {
        console.warn('initWebSocket: sector id (room) missing in map_informations');
        return null;
    }
    wsInstance = new WebSocketManager(room);
    window.wsManager = wsInstance;
    return wsInstance;
}

function requestDataSync() {
    if (!wsInstance) return;
    console.log("request data sync.")
    wsInstance.send({
        type: "request_sync",
        player_id: window.current_player_id
    });
    window._syncInProgress = true;
}

// central handler called by WebSocketManager when messages arrive
function handle_websocket_message(data) {
    if (!data || !data.type) return;

    switch (data.type) {
        case 'sync_sector':
            applySectorSync(data.sector);
            break;
        case 'player_move':
            updatePlayerPosition(data);
            break;
        case 'npc_move':
            updateNpcPosition(data);
            break;
        case 'update_foreground':
            updateForeground(data);
            break;
        default:
        // fallback: try to pass to legacy action manager if present
        if (window.actionManager && typeof window.actionManager.execute === 'function') {
            window.actionManager.execute(data.type, data);
        } else {
            console.log('Unhandled ws message', data);
        }
    }
}

function applySectorSync(syncData) {
    if (!syncData) return;
    Object.assign(window.map_informations, syncData);
    // notify canvasEngine to reload map
    if (window.canvasEngine?.renderer?.reloadMapData) {
        window.canvasEngine.renderer.reloadMapData(window.map_informations);
    }
}

function updatePlayerPosition(ev) {
    const id = ev.player_id;
    const coords = ev.coordinates;
    const map = window.canvasEngine?.map;
        if (!map) return;
        const p = map.findPlayerById(id);
        if (!p) return;
        p.x = coords.x;
        p.y = coords.y;
        if (String(id) === String(window.current_player_id)) {
            const camera = window.canvasEngine.camera;
            const centerX = p.x + (p.sizeX - 1) / 2;
            const centerY = p.y + (p.sizeY - 1) / 2;
            camera.centerOn(centerX, centerY);
        }
}

function updateNpcPosition(ev) {
    const npcId = ev.npc_id;
    const coords = ev.coordinates;
    const m = window.canvasEngine?.map;
    if (!m) return;
    const obj = m.worldObjects.find(o => o.type === 'npc' && o.data?.id === npcId);
    if (!obj) return;
    obj.x = coords.x; obj.y = coords.y;
}

function updateForeground(ev) {
    const id = ev.element_id;
    const data = ev.data;
    const m = window.canvasEngine?.map;
    if (!m) return;
    const obj = m.worldObjects.find(o => o.type === 'foreground' && o.data?.id === id);
    if (!obj) return;
    Object.assign(obj.data, data);
}