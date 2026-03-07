class BinaryHeap {
    constructor(scoreFunction) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }

    push(element) {
        this.content.push(element);
        this.sinkDown(this.content.length - 1);
    }

    pop() {
        const result = this.content[0];
        const end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    }

    size() {
        return this.content.length;
    }

    sinkDown(index) {
        const element = this.content[index];
        const score = this.scoreFunction(element);
        while (index > 0) {
            const parentIndex = Math.floor((index + 1) / 2) - 1;
            const parent = this.content[parentIndex];
            if (score >= this.scoreFunction(parent)) break;
            this.content[parentIndex] = element;
            this.content[index] = parent;
            index = parentIndex;
        }
    }

    bubbleUp(index) {
        const length = this.content.length;
        const element = this.content[index];
        const elementScore = this.scoreFunction(element);
        while (true) {
            const rightIndex = (index + 1) * 2;
            const leftIndex = rightIndex - 1;
            let swapIndex = null;
            let leftScore;

            if (leftIndex < length) {
                const left = this.content[leftIndex];
                leftScore = this.scoreFunction(left);
                if (leftScore < elementScore) {
                    swapIndex = leftIndex;
                }
            }

            if (rightIndex < length) {
                const right = this.content[rightIndex];
                const rightScore = this.scoreFunction(right);
                const compareScore = swapIndex === null ? elementScore : leftScore;
                if (rightScore < compareScore) {
                    swapIndex = rightIndex;
                }
            }

            if (swapIndex === null) break;
            this.content[index] = this.content[swapIndex];
            this.content[swapIndex] = element;
            index = swapIndex;
        }
    }
}

export default class CanvasPathfinding {
    constructor(options = {}) {
        this.map = options.map;
        this.renderer = options.renderer;
        this.tileSize = options.tileSize || 32;
        this.gameWorker = options.gameWorker || null;

        this.current = null;
        this.path = [];
        this.invalidPreview = null;
        this.shipSizeX = 1;
        this.shipSizeY = 1;

        this.hoverTx = null;
        this.hoverTy = null;
        this._lastOverloadMessageAt = 0;
        this._computeRequestId = 0;
        this._workerStaticVersion = 0;
        this._workerDynamicVersion = -1;
        this._workerGridKey = "";
        this._workerReady = false;
        this._workerWarmupPromise = null;
    }

    setWorkerClient(gameWorker) {
        this.gameWorker = gameWorker || null;
        this._workerStaticVersion = 0;
        this._workerDynamicVersion = -1;
        this._workerGridKey = "";
        this._workerReady = false;
        this._workerWarmupPromise = null;
        this._scheduleWorkerWarmup();
    }

    handleClick(tx, ty) {
        if (
            this.current &&
            this.current.dest &&
            this.current.dest.x === tx &&
            this.current.dest.y === ty &&
            !this.invalidPreview
        ) {
            this._sendMoveToServer();
            this.clear();
            return;
        }

        if (
            this.invalidPreview &&
            this.invalidPreview.x === tx &&
            this.invalidPreview.y === ty
        ) {
            if (this.invalidPreview.reason === "overloaded") {
                this._showOverloadMessage();
                return;
            }

            this.clear();
            return;
        }

        void this._compute(tx, ty);
    }

    handleHover(tx, ty) {
        this.hoverTx = tx;
        this.hoverTy = ty;

        if (this.current?.dest) {
            if (tx !== this.current.dest.x || ty !== this.current.dest.y) {
                this.clear();
            }
        }

        if (this.invalidPreview) {
            const preview = this.invalidPreview;
            const inside =
                tx >= preview.x &&
                tx < preview.x + preview.sizeX &&
                ty >= preview.y &&
                ty < preview.y + preview.sizeY;

            if (!inside) {
                this.clear();
            }
        }
    }

    clear(options = {}) {
        if (options.invalidatePending !== false) {
            this._computeRequestId += 1;
        }

        this.current = null;
        this.path = [];
        this.invalidPreview = null;
        if (this.renderer?.requestRedraw) {
            this.renderer.requestRedraw();
        }
    }

    _showOverloadMessage() {
        const now = performance.now();
        if (now - this._lastOverloadMessageAt < 500) return;
        this._lastOverloadMessageAt = now;

        try {
            const engine = window.canvasEngine;
            const me = this.map.findPlayerById(window.current_player_id);
            if (!engine?.renderer?.addFloatingMessage || !me) return;

            const sizeX = me.sizeX || 1;
            const sizeY = me.sizeY || 1;
            const worldX = me.x + sizeX / 2;
            const worldY = me.y + sizeY / 2;

            engine.renderer.addFloatingMessage({
                text: "Vous etes en surcharge",
                icon: "movement",
                worldX,
                worldY,
                sizeX,
                sizeY,
                placement: "above_target",
                color: "rgba(255,80,80,0.95)",
                duration: 1500
            });
        } catch (error) {
            console.warn("Erreur affichage message surcharge:", error);
        }
    }

    _sendMoveToServer() {
        try {
            const engine = window.canvasEngine;
            const ws = engine?.ws;
            const me = engine?.map.findPlayerById(window.current_player_id);

            if (!ws || !me || !this.current) return;

            const path = this.current.path;
            if (!path || path.length < 1) {
                console.warn("[MOVE] move_cost < 1 -> mouvement ignore");
                return;
            }

            const moveCost = path.length;
            if (moveCost < 1) return;

            const dest = this.current.dest;

            ws.send({
                type: "async_move",
                payload: {
                    player: window.current_player_id,
                    start_x: me.x,
                    start_y: me.y,
                    end_x: dest.x,
                    end_y: dest.y,
                    move_cost: moveCost,
                    size_x: me.sizeX,
                    size_y: me.sizeY,
                    is_reversed: me.isReversed,
                    path
                }
            });
        } catch (error) {
            console.error("Erreur _sendMoveToServer:", error);
        }
    }

    _isDestinationAreaFree(x, y, me) {
        const sizeX = me.sizeX || 1;
        const sizeY = me.sizeY || 1;

        for (let dy = 0; dy < sizeY; dy++) {
            for (let dx = 0; dx < sizeX; dx++) {
                const tx = x + dx;
                const ty = y + dy;

                if (tx < 0 || ty < 0 || tx >= this.map.mapWidth || ty >= this.map.mapHeight) {
                    return false;
                }

                if (this.map.isBlockedTile(tx, ty)) {
                    return false;
                }
            }
        }

        return true;
    }

    async _compute(destX, destY, options = {}) {
        const retryCount = options.retryCount || 0;
        const requestId = ++this._computeRequestId;
        const me = this.map.findPlayerById(window.current_player_id);
        if (!me) return;

        try {
            const shipData = window.currentPlayer?.ship || {};
            const load = Number(shipData?.cargo_load_current ?? 0);
            const capacity = Number(shipData?.cargo_capacity ?? shipData?.current_cargo_size ?? 0);
            const isOverloaded = Boolean(shipData?.cargo_over_capacity)
                || (Number.isFinite(load) && Number.isFinite(capacity) && load > capacity);

            if (isOverloaded) {
                if (requestId !== this._computeRequestId) return;
                this.current = null;
                this.path = [];
                this.invalidPreview = {
                    x: destX,
                    y: destY,
                    sizeX: me.sizeX,
                    sizeY: me.sizeY,
                    reason: "overloaded"
                };
                this.renderer?.requestRedraw?.();
                this._showOverloadMessage();
                return;
            }
        } catch (error) {
            console.warn("Erreur verification surcharge:", error);
        }

        this.shipSizeX = me.sizeX || 1;
        this.shipSizeY = me.sizeY || 1;
        this.invalidPreview = null;

        const startRing = this._computeStartRing(me);
        if (startRing.length === 0) {
            if (requestId !== this._computeRequestId) return;
            this.current = null;
            this.path = [];
            this.renderer?.requestRedraw?.();
            return;
        }

        const bestStart = this._pickClosest(startRing, { x: destX, y: destY });
        if (!bestStart) {
            if (requestId !== this._computeRequestId) return;
            this.current = null;
            this.path = [];
            this.renderer?.requestRedraw?.();
            return;
        }

        const result = await this._computePathAsync(bestStart, { x: destX, y: destY });
        if (requestId !== this._computeRequestId) return;

        if (result?.stale) {
            if (retryCount < 1) {
                await this._compute(destX, destY, { retryCount: retryCount + 1 });
            }
            return;
        }

        const path = Array.isArray(result?.path) ? result.path : result;
        if (!path || path.length === 0) {
            this.current = null;
            this.path = [];
            this.invalidPreview = null;
            this.renderer?.requestRedraw?.();
            return;
        }

        const pathCost = path.length;
        let pmRemaining = 0;
        if (window.currentPlayer?.ship?.current_movement != null) {
            pmRemaining = window.currentPlayer.ship.current_movement;
        }

        if (pathCost > pmRemaining) {
            this.current = null;
            this.path = [];
            this.invalidPreview = {
                x: destX,
                y: destY,
                sizeX: me.sizeX,
                sizeY: me.sizeY,
                reason: "not_enough_pm",
                pathCost,
                pmRemaining
            };
            this.renderer?.requestRedraw?.();
            return;
        }

        if (!this._isDestinationAreaFree(destX, destY, me)) {
            this.current = null;
            this.path = [];
            this.invalidPreview = {
                x: destX,
                y: destY,
                sizeX: me.sizeX,
                sizeY: me.sizeY
            };
            this.renderer?.requestRedraw?.();
            return;
        }

        this.current = {
            startList: startRing,
            start: bestStart,
            dest: { x: destX, y: destY },
            path
        };
        this.path = path;
        this.invalidPreview = null;
        this.renderer?.requestRedraw?.();
    }

    async _computePathAsync(start, dest) {
        if (!this.gameWorker?.call || !this.map?.getPathfindingSnapshot) {
            return { path: this._computePath(start, dest), stale: false };
        }

        if (!this._workerReady) {
            this._scheduleWorkerWarmup();
            return { path: this._computePath(start, dest), stale: false };
        }

        try {
            if (this._workerWarmupPromise) {
                await this._workerWarmupPromise;
            }

            const snapshot = this.map.getPathfindingSnapshot();
            await this._ensureWorkerState(snapshot);
            this._workerReady = true;
            const result = await this.gameWorker.call("find_path", { start, dest });
            const latestDynamicVersion = this.map.getPathfindingSnapshot().dynamicVersion;

            if (result?.dynamicVersion !== latestDynamicVersion) {
                return { path: null, stale: true };
            }

            return {
                path: Array.isArray(result?.path) ? result.path : null,
                stale: false
            };
        } catch (error) {
            console.warn("[PATHFINDING] worker fallback to main thread:", error);
            this._workerStaticVersion = 0;
            this._workerDynamicVersion = -1;
            this._workerGridKey = "";
            this._workerReady = false;
            this._scheduleWorkerWarmup();
            return { path: this._computePath(start, dest), stale: false };
        }
    }

    _scheduleWorkerWarmup() {
        if (!this.gameWorker?.call || !this.map?.getPathfindingSnapshot) {
            return;
        }

        if (this._workerWarmupPromise) {
            return;
        }

        this._workerWarmupPromise = (async () => {
            const snapshot = this.map.getPathfindingSnapshot();
            await this._ensureWorkerState(snapshot);
            this._workerReady = true;
        })().catch((error) => {
            this._workerStaticVersion = 0;
            this._workerDynamicVersion = -1;
            this._workerGridKey = "";
            this._workerReady = false;
            console.warn("[PATHFINDING] worker warmup failed:", error);
        }).finally(() => {
            this._workerWarmupPromise = null;
        });
    }

    async _ensureWorkerState(snapshot) {
        const gridKey = `${snapshot.width}x${snapshot.height}`;

        if (this._workerGridKey !== gridKey || this._workerStaticVersion !== snapshot.staticVersion) {
            await this.gameWorker.call("init_pathfinding_grid", {
                width: snapshot.width,
                height: snapshot.height,
                staticGrid: snapshot.staticGrid,
                staticVersion: snapshot.staticVersion
            });
            this._workerGridKey = gridKey;
            this._workerStaticVersion = snapshot.staticVersion;
            this._workerDynamicVersion = -1;
        }

        if (this._workerDynamicVersion !== snapshot.dynamicVersion) {
            await this.gameWorker.call("sync_pathfinding_dynamic", {
                dynamicGrid: snapshot.dynamicGrid,
                dynamicVersion: snapshot.dynamicVersion
            });
            this._workerDynamicVersion = snapshot.dynamicVersion;
        }
    }

    _computeStartRing(me) {
        const sx = me.x;
        const sy = me.y;
        const w = me.sizeX || 1;
        const h = me.sizeY || 1;
        const raw = [];

        for (let i = 0; i < w; i++) raw.push({ x: sx + i, y: sy - 1 });
        for (let i = 0; i < w; i++) raw.push({ x: sx + i, y: sy + h });
        for (let j = 0; j < h; j++) raw.push({ x: sx - 1, y: sy + j });
        for (let j = 0; j < h; j++) raw.push({ x: sx + w, y: sy + j });

        return raw.filter(point =>
            point.x >= 0 &&
            point.y >= 0 &&
            point.x < this.map.mapWidth &&
            point.y < this.map.mapHeight &&
            !this.map.isBlockedTile(point.x, point.y)
        );
    }

    _pickClosest(list, dest) {
        let best = null;
        let bestDistance = Infinity;

        for (const point of list) {
            const dx = point.x - dest.x;
            const dy = point.y - dest.y;
            const distance = (dx * dx) + (dy * dy);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = point;
            }
        }

        return best;
    }

    _computePath(start, dest) {
        const width = this.map.mapWidth;
        const height = this.map.mapHeight;
        const isBlocked = (x, y) => this.map.isBlockedTile(x, y);

        const closed = new Set();
        const parent = new Map();
        const gScore = new Map();
        const openSet = new Set();
        const key = (x, y) => `${x},${y}`;
        const startKey = key(start.x, start.y);
        const destKey = key(dest.x, dest.y);
        const heuristic = point => Math.abs(point.x - dest.x) + Math.abs(point.y - dest.y);

        const openHeap = new BinaryHeap(node => gScore.get(key(node.x, node.y)) + heuristic(node));
        openHeap.push(start);
        openSet.add(startKey);
        gScore.set(startKey, 0);

        while (openHeap.size() > 0) {
            const current = openHeap.pop();
            const currentKey = key(current.x, current.y);
            openSet.delete(currentKey);

            if (currentKey === destKey) {
                const final = [];
                let traceKey = currentKey;
                while (parent.has(traceKey)) {
                    final.push(traceKey);
                    traceKey = parent.get(traceKey);
                }
                final.push(startKey);
                final.reverse();

                return final.map(serialized => {
                    const [x, y] = serialized.split(",").map(Number);
                    return { x, y };
                });
            }

            closed.add(currentKey);

            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (const neighbor of neighbors) {
                if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) {
                    continue;
                }

                const neighborKey = key(neighbor.x, neighbor.y);
                if (closed.has(neighborKey)) continue;
                if (isBlocked(neighbor.x, neighbor.y)) continue;

                const tentative = gScore.get(currentKey) + 1;
                if (!gScore.has(neighborKey) || tentative < gScore.get(neighborKey)) {
                    parent.set(neighborKey, currentKey);
                    gScore.set(neighborKey, tentative);

                    if (!openSet.has(neighborKey)) {
                        openHeap.push(neighbor);
                        openSet.add(neighborKey);
                    }
                }
            }
        }

        return null;
    }
}
