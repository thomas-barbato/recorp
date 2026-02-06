// static/js/workers/game_worker_client.js

export default class GameWorkerClient {
    constructor() {
        this.worker = new Worker(
            "/static/js/game/world_builder/workers/game_worker.js",
            { type: "module" }
        );

        this._pending = new Map();
        this._id = 0;

        this.worker.onerror = (e) => {
            console.error("[GAME WORKER ERROR]", e.message, e);
        };

        this.worker.onmessage = (e) => {
            const { requestId, result, error } = e.data;
            const cb = this._pending.get(requestId);
            if (!cb) return;

            this._pending.delete(requestId);
            error ? cb.reject(error) : cb.resolve(result);
        };
    }

    call(type, payload) {
        const requestId = ++this._id;

        return new Promise((resolve, reject) => {
            this._pending.set(requestId, { resolve, reject });
            this.worker.postMessage({ type, payload, requestId });
        });
    }
}
