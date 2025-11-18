// actions/action_manager.js
// manager minimal d'actions, compatible avec l'ancien code (actionManager.execute(...))

export default class ActionManager {
    constructor() {
        this.handlers = new Map();
        this.syncInProgress = false;
        this._state = { pending: [], lastError: null };
    }

    register(name, fn) {
        this.handlers.set(name, fn);
    }

    registerAll(map = {}) {
        Object.entries(map).forEach(([k, v]) => this.register(k, v));
    }

    execute(type, payload) {
        const handler = this.handlers.get(type);
        if (!handler) {
        console.warn(`ActionManager: no handler for ${type}`);
        return;
        }
        try {
        handler(payload);
        } catch (err) {
        console.error('ActionManager handler error', err);
        this._state.lastError = err;
        throw err;
        }
    }

    isDataError(err) {
        return err && (err.message?.includes?.('sync') || err.message?.includes?.('data'));
    }

    requestSync() {
        this.syncInProgress = true;
        if (typeof window.requestDataSync === 'function') {
        window.requestDataSync();
        } else {
        console.warn('ActionManager.requestSync: window.requestDataSync not defined');
        }
    }

    onSyncComplete() {
        this.syncInProgress = false;
    }

    getState() {
        return this._state;
    }
}

// expose singleton instance and class for legacy code
export const DefaultActionManager = new ActionManager();
window.ActionManager = ActionManager;
window.actionManager = DefaultActionManager;
