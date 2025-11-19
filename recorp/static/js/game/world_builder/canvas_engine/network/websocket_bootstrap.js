// -------------------------------------------------------------------------
// Ce fichier initialise le WebSocketManager ET le système d'actions async_.
// Il garantit que tout est prêt avant de traiter le moindre message.
// -------------------------------------------------------------------------

// Import du WebSocketManager (nouveau moteur canvas)
import WebSocketManager from "../engine/websocket_manager.js";
import DefaultActionManager from "../actions/action_manager.js";
import { handleCanvasFlipShip } from "../handlers/canvas_flip_handlers.js";

// Instance globale
let wsInstance = null;

// ---------------------------------------------------------
// 1) Fonction principale d'initialisation
// ---------------------------------------------------------
export function initWebSocket() {
    if (wsInstance) return wsInstance;

    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const sectorId = window.map_informations?.sector?.id;
    const ws_url = `${ws_scheme}://${window.location.host}/ws/play_${sectorId}/`;

    wsInstance = new WebSocketManager("play_3");
    window.ws = wsInstance;
    return wsInstance;
}

// ---------------------------------------------------------
// 4) Dispatcher global des messages WebSocket
//    (conserve l'ancien fonctionnement côté async_)
// ---------------------------------------------------------
function handle_websocket_message(data) {
    const { type, message } = data;

    // ----------------------------------------------------------------------
    // HANDLERS DÉDIÉS AU CANVAS
    // ----------------------------------------------------------------------
    if (type === "canvas_flip_ship") {
        handleCanvasFlipShip(JSON.parse(message));
        return;
    }

    // Le reste est passé à l'ancien système (chat, inventaire, etc.)
    if (DefaultActionManager && typeof DefaultActionManager.execute === "function") {
        DefaultActionManager.execute(type, message);
    } else {
        console.warn("ActionManager: no handler for", type);
    }
}

// ---------------------------------------------------------
// Fin fichier
// ---------------------------------------------------------
