import ActionRegistry from "../network/action_registry.js";

const WS_TYPE_ALIASES = Object.freeze({
    async_recieve_mp: "async_receive_mp",
});

export default class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.handlers = new Map();
    }

    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log("You are connected...");
            if (this.handlers.has("open")) {
                for (const cb of this.handlers.get("open")) {
                    cb();
                }
            }
        };

        this.socket.onclose = (e) => {
            console.warn("Connection closed, retrying...", e.reason);
            setTimeout(() => this.connect(), 1000);
        };

        this.socket.onerror = (err) => {
            console.error("Connection Error:", err);
        };

        this.socket.onmessage = (event) => this._onMessage(event.data);
    }

    send(obj) {
        try {
            const payload = JSON.stringify(obj);
            this.socket.send(payload);
        } catch (e) {
            console.error("[WS] Could not send:", obj, e);
        }
    }

    on(type, callback) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(callback);
    }

    _onMessage(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch (e) {
            console.error("[WS] Invalid JSON:", raw);
            return;
        }

        const normalized = this._normalizeInboundMessage(msg);
        const { type, payload } = normalized;

        if (!type) {
            console.warn("[WS] Message sans type:", msg);
            return;
        }

        const localHandlers = this.handlers.get(type);
        if (localHandlers) {
            for (const cb of localHandlers) cb(payload, normalized);
        }

        if (ActionRegistry.has(type)) {
            ActionRegistry.run(type, payload, normalized);
        } else if (!localHandlers) {
            console.warn(`[WS] No handler for type "${type}"`);
        }
    }

    _normalizeInboundMessage(msg) {
        const rawType = msg?.type;
        const type = WS_TYPE_ALIASES[rawType] ?? rawType;
        const hasPayload = Object.prototype.hasOwnProperty.call(msg, "payload");

        return {
            ...msg,
            type,
            payload: hasPayload ? msg.payload : msg.message,
        };
    }
}
