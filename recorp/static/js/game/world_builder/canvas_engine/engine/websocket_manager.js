// -----------------------------------------------------------
// WEBSOCKET MANAGER 100% NOUVEAU
// -----------------------------------------------------------

export default class WebSocketManager {

    constructor(url) {
        this.url = url;
        this.socket = null;
        this.handlers = new Map(); // type → array of callbacks
        this.isConnected = false;
        this.reconnectDelay = 2000; // 2 sec
        this.shouldReconnect = true;
    }

    // -----------------------------------------------------------------
    // Connect / Reconnect
    // -----------------------------------------------------------------
    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            this.isConnected = true;
            console.log("[WS] Connected");
        };

        this.socket.onclose = (ev) => {
            this.isConnected = false;
            console.warn("[WS] Closed", ev.code, ev.reason);
            if (this.shouldReconnect) {
                setTimeout(() => {
                    console.log("[WS] Reconnecting…");
                    this.connect();
                }, this.reconnectDelay);
            }
        };

        this.socket.onerror = (err) => {
            console.error("[WS] Error", err);
        };

        this.socket.onmessage = (messageEvent) => {
            this._onMessage(messageEvent.data);
        };
    }

    // -----------------------------------------------------------------
    // Send packet
    // -----------------------------------------------------------------
    send(type, message = {}) {
        if (!this.isConnected) {
            console.warn("[WS] Not connected, send skipped");
            return;
        }

        const packet = JSON.stringify({ type, message });
        this.socket.send(packet);
    }

    // -----------------------------------------------------------------
    // Listen: ws.on("flip_ship", callback)
    // -----------------------------------------------------------------
    on(type, callback) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(callback);
    }

    // -----------------------------------------------------------------
    // Internal dispatch
    // -----------------------------------------------------------------
    _onMessage(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch (e) {
            console.error("[WS] Invalid JSON:", raw);
            return;
        }

        const { type, message } = msg;

        if (!type) {
            console.warn("[WS] message with no type:", msg);
            return;
        }

        const list = this.handlers.get(type);
        if (!list || list.length === 0) {
            console.warn(`[WS] No handler for type "${type}"`);
            return;
        }

        list.forEach(cb => cb(message));
    }
}
