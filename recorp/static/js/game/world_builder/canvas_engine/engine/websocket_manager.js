import ActionRegistry from "../network/action_registry.js";

export default class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.socket = null;

        // callbacks locaux optionnels
        this.handlers = new Map();
    }

    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log("[WS] Connected to", this.url);
        };

        this.socket.onclose = (e) => {
            console.warn("[WS] Connection closed, retrying...", e.reason);
            setTimeout(() => this.connect(), 1000);
        };

        this.socket.onerror = (err) => {
            console.error("[WS] Error:", err);
        };

        this.socket.onmessage = (event) => this._onMessage(event.data);
    }

    /**
     * ---- Envoi d’un message standardisé ----
     */
    send(obj) {
        
        try {
            const payload = JSON.stringify(obj);
            this.socket.send(payload);
        } catch (e) {
            console.error("[WS] Could not send:", obj, e);
        }
    }

    /**
     * ---- Abonnement local ----
     * ws.on("player_move", fn)
     */
    on(type, callback) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(callback);
    }

    /**
     * ---- Dispatcher ----
     */
    _onMessage(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch (e) {
            console.error("[WS] Invalid JSON:", raw);
            return;
        }

        const type = msg.type;
        const message = msg.message ?? msg.payload; // compatibilité

        if (!type) {
            console.warn("[WS] Message sans type:", msg);
            return;
        }

        // --- 1) Dispatch LOCAL (via ws.on)
        const localHandlers = this.handlers.get(type);
        if (localHandlers) {
            for (const cb of localHandlers) cb(message, msg);
        }

        // --- 2) Dispatch GLOBAL (via ActionRegistry)
        if (ActionRegistry.has(type)) {
            ActionRegistry.run(type, message);
        } else if (!localHandlers) {
            console.warn(`[WS] No handler for type "${type}"`);
        }
    }
}
