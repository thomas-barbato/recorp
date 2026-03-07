// static/js/workers/game_worker_client.js

export default class GameWorkerClient {
    constructor() {
        this._pending = new Map();
        this._id = 0;
        this._workerUrl = "/static/js/game/world_builder/workers/game_worker.js";
        this._reloadToken = 0;
        this._spawnWorker();
    }

    _buildWorkerUrl(forceReload = false) {
        const url = new URL(this._workerUrl, window.location.origin);
        if (forceReload) {
            this._reloadToken += 1;
            url.searchParams.set("v", `${Date.now()}-${this._reloadToken}`);
        }
        return url.toString();
    }

    _spawnWorker(forceReload = false) {
        if (this.worker) {
            this.worker.terminate();
        }

        this.worker = new Worker(this._buildWorkerUrl(forceReload), { type: "module" });

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

    async _retryWithFreshWorker(type, payload, originalError) {
        this._spawnWorker(true);
        try {
            return await this.call(type, payload, { allowRetry: false });
        } catch (retryError) {
            throw retryError || originalError;
        }
    }

    call(type, payload, options = {}) {
        const allowRetry = options.allowRetry !== false;
        const requestId = ++this._id;

        return new Promise((resolve, reject) => {
            this._pending.set(requestId, {
                resolve,
                reject: async (error) => {
                    if (
                        allowRetry &&
                        typeof error === "string" &&
                        error.startsWith("Unknown worker action:")
                    ) {
                        try {
                            const retriedResult = await this._retryWithFreshWorker(type, payload, error);
                            resolve(retriedResult);
                            return;
                        } catch (retryError) {
                            reject(retryError);
                            return;
                        }
                    }
                    reject(error);
                }
            });
            this.worker.postMessage({ type, payload, requestId });
        });
    }
}
