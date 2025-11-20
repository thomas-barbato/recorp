// -----------------------------------------------------------
// ACTION REGISTRY — Nouveau système
// -----------------------------------------------------------

export default class ActionRegistry {

    constructor() {
        this.table = new Map(); // action → handler
    }

    register(action, handler) {
        if (!handler || typeof handler !== "function") {
            console.error(`ActionRegistry: invalid handler for "${action}"`);
            return;
        }
        this.table.set(action, handler);
    }

    run(action, message) {
        const handler = this.table.get(action);
        if (!handler) {
            console.warn(`ActionRegistry: no handler for "${action}"`);
            return;
        }
        handler(message);
    }
}
