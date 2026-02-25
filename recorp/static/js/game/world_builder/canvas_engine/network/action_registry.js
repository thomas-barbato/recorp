// static/js/game/world_builder/network/action_registry.js

class ActionRegistryClass {
    constructor() {
        this.table = new Map();
    }

    register(action, handler) {
        if (!handler || typeof handler !== "function") {
            console.error(`ActionRegistry: invalid handler for "${action}"`);
            return;
        }
        this.table.set(action, handler);
    }

    has(action) {
        return this.table.has(action);
    }

    run(action, payload, meta) {
        const handler = this.table.get(action);
        if (!handler) {
            console.warn(`ActionRegistry: no handler for "${action}"`);
            return;
        }
        handler(payload, meta);
    }
}

const ActionRegistry = new ActionRegistryClass();

export default ActionRegistry;
