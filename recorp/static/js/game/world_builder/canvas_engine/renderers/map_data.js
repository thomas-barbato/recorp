export default class MapData {
    constructor(raw, spriteManager, tileSize) {
        this.raw = raw || window.map_informations || {};
        this.spriteManager = spriteManager;
        this.tileSize = tileSize || 32;
        this.currentPlayerState = window.currentPlayerState;

        this.mapWidth = this.raw.map_width || 40;
        this.mapHeight = this.raw.map_height || 40;

        this.worldObjects = []; // includes foreground, players, npcs
        this.players = {};
        this.npcs = {};
        this.wrecks = {};
        this.wreckExpiryTimers = new Map();
        this.foregrounds = [];
        this._renderOrderCounter = 0;
        this._resetSpatialIndex();
        this.background = this.raw.sector?.background || null;
        this._pathfindingStaticGrid = null;
        this._pathfindingDynamicGrid = null;
        this._pathfindingStaticVersion = 0;
        this._pathfindingDynamicVersion = 0;
        this._pathfindingDynamicDirty = true;
    }

    async prepare() {
        if (!this.raw) throw new Error('MapData.prepare: raw undefined');

        this.worldObjects = [];
        this.players = {};
        this.npcs = {};
        this.wrecks = {};
        this._clearWreckExpiryTimers();
        this.foregrounds = [];
        this._renderOrderCounter = 0;
        this._resetSpatialIndex();

        const tryEnsure = (url) => {
            if (!url || !this.spriteManager || !this.spriteManager.ensure) return;
            try {
                this.spriteManager.ensure(this.spriteManager.makeUrl(url)).catch(()=>{ /* ignore */ });
            } catch (e) {
                // defensive
            }
        };

        // ------------ FOREGROUND (sector_element) ------------
        const fgList = Array.isArray(this.raw.sector_element) ? this.raw.sector_element : (this.raw.foreground || []);
        fgList.forEach(fg => {
            if (!fg || !fg.data) return;

            const anim = fg.animations || fg.data.animations || '';
            const type = fg.data.type || 'unknown';

            // defensive size parsing
            const sizeX = (fg.size && Number.isFinite(Number(fg.size.x))) ? Number(fg.size.x) : 1;
            const sizeY = (fg.size && Number.isFinite(Number(fg.size.y))) ? Number(fg.size.y) : 1;

            const obj = {
                id: `${type}_${fg.item_id}`,
                type: "foreground",
                subtype: type,
                x: Number.parseInt(fg.data.coordinates?.x ?? fg.data.x ?? 0, 10),
                y: Number.parseInt(fg.data.coordinates?.y ?? fg.data.y ?? 0, 10),
                sizeX,
                sizeY,
                image: anim || null,
                spritePath: anim ? `foreground/${type}/${anim}/0.gif` : null,
                data: fg
            };
            this.foregrounds.push(obj);
            this.worldObjects.push(obj);

            if (obj.spritePath) tryEnsure(obj.spritePath);
        });

        // ------------ PLAYERS (pc) ------------
        const pcList = Array.isArray(this.raw.pc) ? this.raw.pc : (this.raw.players || []);
        pcList.forEach(p => {
            if (!p || !p.user) return;

            const ship = p.ship || {};
            const shipImage = ship.image || null;
            const reversed = !!ship.is_reversed;

            const sizeX = (ship.size && Number.isFinite(Number(ship.size.x))) ? Number(ship.size.x) : 1;
            const sizeY = (ship.size && Number.isFinite(Number(ship.size.y))) ? Number(ship.size.y) : 1;

            const obj = {
                id: `pc_${p.user.player}`,
                type: 'player',
                data: p,
                subtype: ship.name || null,
                x: Number.parseInt(p.user.coordinates?.x ?? p.user.x ?? 0, 10),
                y: Number.parseInt(p.user.coordinates?.y ?? p.user.y ?? 0, 10),
                sizeX,
                sizeY,
                image: shipImage,
                spritePath: shipImage ? `foreground/SHIPS/${shipImage}.png` : null,
                reversedSprite: shipImage ? `foreground/SHIPS/${shipImage}.png` : null
            };

            // stockage par ID joueur
            this.players[p.user.player] = obj;

            this.worldObjects.push(obj);

            if (obj.spritePath) tryEnsure(obj.spritePath);
            if (obj.reversedSprite) tryEnsure(obj.reversedSprite);
        });

        // ------------ NPCs ------------
        const npcList = Array.isArray(this.raw.npc) ? this.raw.npc : [];
        npcList.forEach(n => {
            if (!n || !n.npc) return;

            const ship = n.ship || {};
            const shipImage = ship.image || null;

            const sizeX = (ship.size && Number.isFinite(Number(ship.size.x))) ? Number(ship.size.x) : 1;
            const sizeY = (ship.size && Number.isFinite(Number(ship.size.y))) ? Number(ship.size.y) : 1;

            const obj = {
                id: `npc_${n.npc.id}`,
                type: 'npc',
                data: n,
                subtype: ship.name || null,
                x: Number.parseInt(n.npc.coordinates?.x ?? n.npc.x ?? 0, 10),
                y: Number.parseInt(n.npc.coordinates?.y ?? n.npc.y ?? 0, 10),
                sizeX,
                sizeY,
                image: shipImage,
                spritePath: shipImage ? `foreground/SHIPS/${shipImage}.png` : null,
                reversedSprite: shipImage ? `foreground/SHIPS/${shipImage}.png` : null
            };

            this.npcs[n.npc.id] = obj;
            this.worldObjects.push(obj);
            if (obj.spritePath) tryEnsure(obj.spritePath);
            if (obj.reversedSprite) tryEnsure(obj.reversedSprite);
        });

        // ------------ Wrecks ------------
        const wreckList = Array.isArray(this.raw.wrecks) ? this.raw.wrecks : [];
        wreckList.forEach(w => {
            this.addWreckActor(w);
        });

        // ------------ MAP SIZE OVERRIDES ------------
        if (this.raw.map_width) this.mapWidth = Number(this.raw.map_width);
        if (this.raw.map_height) this.mapHeight = Number(this.raw.map_height);

        this._rebuildSpatialIndex();
        this._rebuildPathfindingStaticGrid();
        this.markPathfindingDynamicDirty();
    }


    findPlayerById(id) {
        if (id == null) return null;
        
        // on tolÃ¨re number / string
        const keyStr = String(id);
        const keyNum = Number.isFinite(Number(id)) ? Number(id) : null;

        if (keyStr in this.players) {
            return this.players[keyStr];
        }
        if (keyNum !== null && keyNum in this.players) {
            return this.players[keyNum];
        }

        return null;
    }

    findNpcById(id) {
        if (id == null) return null;

        const idStr = String(id);
        const idNum = Number.isFinite(Number(id)) ? Number(id) : null;

        if (this.npcs?.[idStr]) return this.npcs[idStr];
        if (idNum !== null && this.npcs?.[idNum]) return this.npcs[idNum];

        // fallback : chercher dans worldObjects
        return this.worldObjects.find(o =>
            o.type === "npc" &&
            (String(o.id) === `npc_${idStr}`)
        ) || null;
    }

    findActorByKey(targetKey) {
        if (!targetKey) return null;

        // targetKey attendu : "pc_23", "npc_12", "foreground_5", etc.
        const [type, id] = targetKey.split("_");
        if (!type || !id) return null;

        switch (type) {
            case "pc":
                return this.findPlayerById(id);

            case "npc":
                return this.findNpcById(id);

            default:
                return this.worldObjects.find(o => o.id === targetKey) || null;
        }
    }

    getCurrentPlayer() {
        if (typeof window === "undefined") return null;
        const pid = window.current_player_id;
        if (pid == null) return null;
        return this.findPlayerById(pid);
    }
    
    _getObjectPriority(obj) {
        const priority = { player: 3, npc: 3, wreck: 3, foreground: 2, background: 1 };
        return priority[obj?.type] || 0;
    }

    _compareObjectsForTile(a, b) {
        const priorityDelta = this._getObjectPriority(b) - this._getObjectPriority(a);
        if (priorityDelta !== 0) return priorityDelta;
        return (b?._renderOrder ?? 0) - (a?._renderOrder ?? 0);
    }

    _ensureObjectRenderOrder(obj) {
        if (!obj) return;
        if (!Number.isInteger(obj._renderOrder)) {
            obj._renderOrder = this._renderOrderCounter++;
        }
    }

    _resetSpatialIndex() {
        this._spatialIndex = new Array(Math.max(0, this.mapWidth * this.mapHeight));
        this._spatialRects = new WeakMap();
    }

    _normalizeObjectRect(obj) {
        const { sizeX, sizeY } = this._normalizeObjectSize(obj);
        return {
            x: Number.parseInt(obj?.x ?? 0, 10),
            y: Number.parseInt(obj?.y ?? 0, 10),
            sizeX,
            sizeY
        };
    }

    _forEachTileInRect(rect, callback) {
        if (!rect || typeof callback !== "function") return;

        for (let dy = 0; dy < rect.sizeY; dy++) {
            for (let dx = 0; dx < rect.sizeX; dx++) {
                const tx = rect.x + dx;
                const ty = rect.y + dy;

                if (tx < 0 || ty < 0 || tx >= this.mapWidth || ty >= this.mapHeight) {
                    continue;
                }

                callback(tx, ty, this._getPathfindingCellId(tx, ty));
            }
        }
    }

    _ensureSpatialIndexReady() {
        const expectedSize = Math.max(0, this.mapWidth * this.mapHeight);
        if (!this._spatialIndex || this._spatialIndex.length !== expectedSize) {
            this._rebuildSpatialIndex();
        }
    }

    _addObjectToSpatialIndex(obj) {
        if (!obj) return;

        this._ensureSpatialIndexReady();
        this._ensureObjectRenderOrder(obj);

        const rect = this._normalizeObjectRect(obj);
        this._spatialRects.set(obj, rect);

        this._forEachTileInRect(rect, (_tx, _ty, cellId) => {
            let bucket = this._spatialIndex[cellId];
            if (!bucket) {
                bucket = [];
                this._spatialIndex[cellId] = bucket;
            }
            bucket.push(obj);
        });
    }

    _removeObjectFromSpatialIndex(obj, rect = null) {
        if (!obj) return;
        this._ensureSpatialIndexReady();

        const targetRect = rect || this._spatialRects.get(obj) || this._normalizeObjectRect(obj);
        this._forEachTileInRect(targetRect, (_tx, _ty, cellId) => {
            const bucket = this._spatialIndex[cellId];
            if (!bucket || !bucket.length) return;

            for (let i = bucket.length - 1; i >= 0; i--) {
                if (bucket[i] === obj) {
                    bucket.splice(i, 1);
                }
            }

            if (!bucket.length) {
                this._spatialIndex[cellId] = null;
            }
        });

        this._spatialRects.delete(obj);
    }

    _rebuildSpatialIndex() {
        this._resetSpatialIndex();
        for (const obj of this.worldObjects || []) {
            this._addObjectToSpatialIndex(obj);
        }
    }

    _getBucketAtTile(tileX, tileY) {
        if (tileX < 0 || tileY < 0 || tileX >= this.mapWidth || tileY >= this.mapHeight) {
            return [];
        }

        this._ensureSpatialIndexReady();
        return this._spatialIndex[this._getPathfindingCellId(tileX, tileY)] || [];
    }

    getObjectsAtTile(tileX, tileY) {
        const bucket = this._getBucketAtTile(tileX, tileY);
        if (!bucket.length) return [];
        return bucket.slice().sort((a, b) => this._compareObjectsForTile(a, b));
    }

    getTopObjectAt(tileX, tileY) {
        const bucket = this._getBucketAtTile(tileX, tileY);
        if (!bucket.length) return null;

        let best = bucket[0];
        for (let i = 1; i < bucket.length; i++) {
            if (this._compareObjectsForTile(bucket[i], best) < 0) {
                best = bucket[i];
            }
        }
        return best;
    }

    getObjectsInRect(minX, minY, maxX, maxY, options = {}) {
        this._ensureSpatialIndexReady();

        const startX = Math.max(0, Math.floor(minX));
        const startY = Math.max(0, Math.floor(minY));
        const endX = Math.min(this.mapWidth, Math.ceil(maxX));
        const endY = Math.min(this.mapHeight, Math.ceil(maxY));
        if (startX >= endX || startY >= endY) return [];

        const allowedTypes = Array.isArray(options.types) && options.types.length
            ? new Set(options.types)
            : null;
        const seen = new Set();
        const result = [];

        for (let ty = startY; ty < endY; ty++) {
            for (let tx = startX; tx < endX; tx++) {
                const bucket = this._spatialIndex[this._getPathfindingCellId(tx, ty)] || [];
                for (const obj of bucket) {
                    if (seen.has(obj)) continue;
                    if (allowedTypes && !allowedTypes.has(obj.type)) continue;
                    seen.add(obj);
                    result.push(obj);
                }
            }
        }

        return result.sort((a, b) => (a?._renderOrder ?? 0) - (b?._renderOrder ?? 0));
    }

    getObjectsInViewport(camera, options = {}) {
        if (!camera) return [];

        const bounds = camera.getWorldBounds
            ? camera.getWorldBounds(options.paddingTiles || 0)
            : {
                minX: camera.worldX,
                minY: camera.worldY,
                maxX: camera.worldX + camera.visibleTilesX,
                maxY: camera.worldY + camera.visibleTilesY
            };

        return this.getObjectsInRect(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, options);
    }

    _getPathfindingCellId(x, y) {
        return (y * this.mapWidth) + x;
    }

    _createEmptyPathfindingGrid() {
        return new Uint8Array(Math.max(0, this.mapWidth * this.mapHeight));
    }

    _normalizeObjectSize(obj) {
        return {
            sizeX: Math.max(1, Number.parseInt(obj?.sizeX ?? obj?.size?.x ?? 1, 10) || 1),
            sizeY: Math.max(1, Number.parseInt(obj?.sizeY ?? obj?.size?.y ?? 1, 10) || 1)
        };
    }

    _markPathfindingArea(grid, obj) {
        if (!grid || !obj) return;

        const originX = Number.parseInt(obj.x ?? 0, 10);
        const originY = Number.parseInt(obj.y ?? 0, 10);
        const { sizeX, sizeY } = this._normalizeObjectSize(obj);

        for (let dy = 0; dy < sizeY; dy++) {
            for (let dx = 0; dx < sizeX; dx++) {
                const tx = originX + dx;
                const ty = originY + dy;

                if (tx < 0 || ty < 0 || tx >= this.mapWidth || ty >= this.mapHeight) {
                    continue;
                }

                grid[this._getPathfindingCellId(tx, ty)] = 1;
            }
        }
    }

    _rebuildPathfindingStaticGrid() {
        const grid = this._createEmptyPathfindingGrid();

        for (const obj of this.foregrounds || []) {
            this._markPathfindingArea(grid, obj);
        }

        this._pathfindingStaticGrid = grid;
        this._pathfindingStaticVersion += 1;
        this._pathfindingDynamicGrid = null;
        this._pathfindingDynamicDirty = true;
    }

    markPathfindingDynamicDirty() {
        this._pathfindingDynamicDirty = true;
        this._pathfindingDynamicVersion += 1;
    }

    _isDynamicPathfindingBlocker(obj) {
        if (!obj) return false;
        if (obj.type === "player" || obj.type === "npc" || obj.type === "wreck") {
            return true;
        }
        if (obj.type === "unknown") {
            return true;
        }
        return typeof obj.id === "string" && obj.id.includes("unknown");
    }

    _ensurePathfindingDynamicGrid() {
        const expectedSize = Math.max(0, this.mapWidth * this.mapHeight);
        if (
            !this._pathfindingDynamicDirty &&
            this._pathfindingDynamicGrid &&
            this._pathfindingDynamicGrid.length === expectedSize
        ) {
            return this._pathfindingDynamicGrid;
        }

        const grid = this._createEmptyPathfindingGrid();
        const currentPlayerId = String(window.current_player_id ?? "");

        for (const obj of this.worldObjects || []) {
            if (!this._isDynamicPathfindingBlocker(obj)) continue;

            if (
                obj.type === "player" &&
                String(obj.data?.user?.player ?? "") === currentPlayerId
            ) {
                continue;
            }

            this._markPathfindingArea(grid, obj);
        }

        this._pathfindingDynamicGrid = grid;
        this._pathfindingDynamicDirty = false;
        return this._pathfindingDynamicGrid;
    }

    getPathfindingSnapshot() {
        if (!this._pathfindingStaticGrid) {
            this._rebuildPathfindingStaticGrid();
        }

        return {
            width: this.mapWidth,
            height: this.mapHeight,
            staticGrid: this._pathfindingStaticGrid,
            staticVersion: this._pathfindingStaticVersion,
            dynamicGrid: this._ensurePathfindingDynamicGrid(),
            dynamicVersion: this._pathfindingDynamicVersion
        };
    }

    setActorPosition(actor, x, y) {
        if (!actor) return false;

        const nextX = Number.parseInt(x, 10);
        const nextY = Number.parseInt(y, 10);
        if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) {
            return false;
        }

        if (actor.x === nextX && actor.y === nextY) {
            return false;
        }

        const previousRect = this._spatialRects.get(actor) || this._normalizeObjectRect(actor);
        this._removeObjectFromSpatialIndex(actor, previousRect);
        actor.x = nextX;
        actor.y = nextY;
        this._syncActorDataCoordinates(actor, nextX, nextY);
        this._addObjectToSpatialIndex(actor);
        this.markPathfindingDynamicDirty();
        return true;
    }

    _syncActorDataCoordinates(actor, x, y) {
        const assignCoords = (target) => {
            if (!target || typeof target !== "object") return;

            if (!target.coordinates || typeof target.coordinates !== "object") {
                target.coordinates = { x, y };
            } else {
                target.coordinates.x = x;
                target.coordinates.y = y;
            }

            if ("x" in target) target.x = x;
            if ("y" in target) target.y = y;
        };

        assignCoords(actor?.data);
        assignCoords(actor?.data?.user);
        assignCoords(actor?.data?.npc);
    }

     // -----------------------------------------------------------------
    //  NOUVEAU : test si une case est bloquÃ©e pour le pathfinding
    // -----------------------------------------------------------------
    isBlocked(x, y, ignoreIds = new Set()) {
        // hors de la carte => bloquÃ©
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return true;
        }

        const objs = this.getObjectsAtTile(x, y);
        if (!objs.length) return false;

        for (const o of objs) {
            if (ignoreIds.has(o.id)) continue;

            // âœ… NE PAS se bloquer soi-mÃªme (important pour ships > 1x1)
            if ((o.type === "player" || o.type === "npc")
                && String(o.data?.user?.player) === String(window.current_player_id)) {
                continue;
            }

            if (
                o.type === "player" ||
                o.type === "npc" ||
                o.type === "foreground" ||
                o.type === "wreck" ||
                o.type === "unknown"
            ) {
                return true;
            }
        }

        return false;
    }

    isBlockedTile(x, y) {
        // Limites de la carte
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return true;
        }

        // On vÃ©rifie si un objet occupe cette tuile
        const obj = this.getTopObjectAt(x, y);

        if (!obj) return false;

        // foreground (planÃ¨tes, astÃ©roÃ¯des, stations...) = bloquant
        if (obj.type === "foreground") return true;
        if (obj.type === "wreck") return true;

        // NPC ou Player (autre que moi) = bloquant
        if (obj.type === "player" || obj.type === "npc") {
            // mais pas le joueur lui-mÃªme !
            if (String(obj.data?.user?.player) !== String(window.current_player_id)) {
                return true;
            }
        }

        return false;
    }

    // -----------------------------------------------------------------
    //  NOUVEAU : A* sur la grille
    //  start / goal : { x, y }
    //  options: { maxCost?: number, ignoreIds?: string[] }
    //  Retourne un tableau [{x,y}, ...] (sans le point de dÃ©part)
    // -----------------------------------------------------------------
    computePath(start, goal, options = {}) {
        if (!start || !goal) return [];

        const sx = start.x;
        const sy = start.y;
        const gx = goal.x;
        const gy = goal.y;

        const maxCost = (options && typeof options.maxCost === "number")
            ? options.maxCost
            : 9999;

        const ignoreIds = new Set(options.ignoreIds || []);

        const key = (x, y) => `${x},${y}`;
        const h = (x, y) => Math.abs(x - gx) + Math.abs(y - gy);

        // A* open & closed
        const open = new Map();       // key -> {x,y,g,f}
        const closed = new Set();     // key
        const cameFrom = new Map();   // key -> parentKey

        const startKey = key(sx, sy);
        open.set(startKey, { x: sx, y: sy, g: 0, f: h(sx, sy) });

        let bestGoalKey = null;

        while (open.size > 0) {
            // node avec le plus petit f
            let currentKey = null;
            let currentNode = null;

            for (const [k, n] of open) {
                if (!currentNode || n.f < currentNode.f) {
                    currentNode = n;
                    currentKey = k;
                }
            }

            if (!currentNode) break;

            // objectif atteint
            if (currentNode.x === gx && currentNode.y === gy) {
                bestGoalKey = currentKey;
                break;
            }

            open.delete(currentKey);
            closed.add(currentKey);

            const neighbors = [
                { x: currentNode.x + 1, y: currentNode.y },
                { x: currentNode.x - 1, y: currentNode.y },
                { x: currentNode.x,     y: currentNode.y + 1 },
                { x: currentNode.x,     y: currentNode.y - 1 }
            ];

            for (const nb of neighbors) {
                const nx = nb.x;
                const ny = nb.y;
                const nk = key(nx, ny);

                if (closed.has(nk)) continue;

                // case bloquante ?
                if (this.isBlocked(nx, ny, ignoreIds)) continue;

                const gCost = currentNode.g + 1;
                if (gCost > maxCost) continue;

                const existing = open.get(nk);
                if (existing && gCost >= existing.g) continue;

                cameFrom.set(nk, currentKey);

                open.set(nk, {
                    x: nx,
                    y: ny,
                    g: gCost,
                    f: gCost + h(nx, ny)
                });
            }
        }

        if (!bestGoalKey) return [];

        // âœ… reconstruction via cameFrom (fiable)
        const pathReversed = [];
        let cur = bestGoalKey;

        while (cur !== startKey) {
            const n = open.get(cur) || null;

            // si le goal a Ã©tÃ© trouvÃ©, il est possible qu'il ne soit plus dans open
            // donc on reconstruit la coord Ã  partir de la clÃ©
            if (n) {
                pathReversed.push({ x: n.x, y: n.y });
            } else {
                const [x, y] = cur.split(",").map(Number);
                pathReversed.push({ x, y });
            }

            cur = cameFrom.get(cur);
            if (!cur) break; // safety
        }

        return pathReversed.reverse();
    }

    addPlayerActor(p) {
        if (!p || !p.user) return;

        const playerId = p.user.player;
        const pidStr = String(playerId);

        // On nettoie d'abord tout acteur existant pour ce joueur
        this.removeActorByPlayerId(playerId);

        const ship = p.ship || {};
        const shipSize = ship.size || {};
        const sizeX = Number.isFinite(Number(shipSize.x)) ? Number(shipSize.x) : 1;
        const sizeY = Number.isFinite(Number(shipSize.y)) ? Number(shipSize.y) : 1;

        const x = Number.parseInt(p.user.coordinates?.x ?? p.user.x ?? 0, 10);
        const y = Number.parseInt(p.user.coordinates?.y ?? p.user.y ?? 0, 10);

        const image = ship.image || null;
        const spritePath = image ? `foreground/SHIPS/${image}.png` : null;
        const reversedSprite = image ? `foreground/SHIPS/${image}.png` : null;

        const obj = {
            id: `pc_${playerId}`,
            type: "player",
            data: p,
            subtype: ship.name || null,
            x,
            y,
            sizeX,
            sizeY,
            image,
            spritePath,
            reversedSprite,
            runtime : {
                current_hp: null,
                current_ap: null,
                current_movement: null,
                shields: {
                    TORPEDO: null,
                    LASER: null,
                    BALLISTIC: null
                }
            }
        };

        // players indexÃ© Ã  la fois par number et par string pour plus de robustesse
        this.players[playerId] = obj;
        this.players[pidStr] = obj;

        this.worldObjects.push(obj);
        this._addObjectToSpatialIndex(obj);
        this.markPathfindingDynamicDirty();

        // PrÃ©chargement des sprites si le spriteManager est dispo
        if (this.spriteManager && this.spriteManager.ensure && this.spriteManager.makeUrl) {
            try {
                if (spritePath) {
                    this.spriteManager
                        .ensure(this.spriteManager.makeUrl(spritePath))
                        .catch(() => {});
                }
                if (reversedSprite) {
                    this.spriteManager
                        .ensure(this.spriteManager.makeUrl(reversedSprite))
                        .catch(() => {});
                }
            } catch (e) {
                // mode dÃ©fensif : ne rien casser si le prefetch foire
            }
        }
    }

    // ======================================================================
    // Suppression dâ€™un PC Ã  partir de son pc_id
    // (supprime pc_<id> + toute forme unknown liÃ©e)
    // ======================================================================
    removeActorByPlayerId(playerId) {
        if (playerId == null) return;

        const pidStr = String(playerId);
        const before = this.worldObjects.length;

        this.worldObjects = this.worldObjects.filter(o => {
            // id direct pc_XX
            if (String(o.id) === `pc_${pidStr}`) return false;

            // acteur "unknown" mais qui possÃ¨de un user.player
            const objPid = o?.data?.user ? String(o.data.user.player) : null;
            if (objPid === pidStr) return false;

            return true;
        });
        this._rebuildSpatialIndex();

        // Nettoyage du cache players
        delete this.players[pidStr];
        const pidNum = Number(pidStr);
        if (!Number.isNaN(pidNum)) {
            delete this.players[pidNum];
        }

        const after = this.worldObjects.length;
        if (before !== after) {
            console.warn(`[MAP] removeActorByPlayerId(${pidStr}) â†’ ${before} -> ${after}`);
            this.markPathfindingDynamicDirty();
        }
    }

    // ======================================================================
    // Suppression dâ€™un NPC Ã  partir de son npc_id
    // (supprime npc_<id> + toute forme unknown liÃ©e)
    // ======================================================================
    removeNpcById(npcId) {
        if (npcId == null) return;

        const nidStr = String(npcId);
        const before = this.worldObjects.length;

        this.worldObjects = this.worldObjects.filter(o => {

            // --- 1. npc_<id> normal ---
            if (String(o.id) === `npc_${nidStr}`) return false;

            // --- 2. unknown avec data.npc_id ---
            if (o?.data?.npc_id && String(o.data.npc_id) === nidStr) return false;

            // --- 2bis. structure cache standard: data.npc.id ---
            if (o?.data?.npc?.id && String(o.data.npc.id) === nidStr) return false;

            // --- 3. unknown avec data.user.npc ---
            if (o?.data?.user?.npc && String(o.data.user.npc) === nidStr) return false;

            // --- 4. id style "unknown-npc-<id>" ---
            if (o.id && o.id.includes("unknown") && o.id.endsWith("_" + nidStr)) return false;

            return true;
        });
        this._rebuildSpatialIndex();

        delete this.npcs?.[nidStr];
        const nidNum = Number(nidStr);
        if (!Number.isNaN(nidNum)) delete this.npcs?.[nidNum];
        if (before !== this.worldObjects.length) {
            this.markPathfindingDynamicDirty();
        }

    }

    // ======================================================================
    // Ajout dynamique d'un NPC (pour spawn, apparition d'ennemis, scriptsâ€¦)
    // Structure identique Ã  celle gÃ©nÃ©rÃ©e dans prepare() â†’ compatible modals
    // ======================================================================
    addNpcActor(npcData) {
        if (!npcData) return;

        const nestedNpc = npcData.npc || null;
        const npcId = npcData.npc_id || npcData.id || npcData.pk || nestedNpc?.id;
        if (!npcId) {
            console.warn("[MAP] addNpcActor: npcData sans npc_id", npcData);
            return;
        }

        const idStr = String(npcId);

        // Supprimer toute version existante (npc_<id> ou unknown liÃ©)
        this.removeNpcById(npcId);

        // DÃ©termination de la taille
        const size = npcData.size || npcData.ship?.size || {};
        const sizeX = Number.isFinite(Number(size.x)) ? Number(size.x) : 1;
        const sizeY = Number.isFinite(Number(size.y)) ? Number(size.y) : 1;

        // CoordonnÃ©es du NPC
        const x = Number.parseInt(
            npcData.coordinates?.x ?? npcData.x ?? nestedNpc?.coordinates?.x ?? nestedNpc?.x ?? 0,
            10
        );
        const y = Number.parseInt(
            npcData.coordinates?.y ?? npcData.y ?? nestedNpc?.coordinates?.y ?? nestedNpc?.y ?? 0,
            10
        );

        // Image & sprites
        const img = npcData.image || npcData.ship?.image || null;
        const spritePath = img ? `foreground/SHIPS/${img}.png` : null;
        const reversedSprite = img ? `foreground/SHIPS/${img}.png` : null;

        // Construction du worldObject NPC
        const obj = {
            id: `npc_${idStr}`,
            type: "npc",
            data: npcData,
            subtype: npcData.ship?.name || npcData.name || nestedNpc?.displayed_name || nestedNpc?.name || null,
            x,
            y,
            sizeX,
            sizeY,
            image: img,
            spritePath,
            reversedSprite,
        };

        // Stocker dans this.npcs
        if (!this.npcs) this.npcs = {};
        this.npcs[idStr] = obj;

        // Ajouter au worldObjects
        this.worldObjects.push(obj);
        this._addObjectToSpatialIndex(obj);
        this.markPathfindingDynamicDirty();

        // PrÃ©chargement des images si spriteManager existe
        if (this.spriteManager && this.spriteManager.ensure && this.spriteManager.makeUrl) {
            try {
                if (spritePath) {
                    this.spriteManager.ensure(this.spriteManager.makeUrl(spritePath)).catch(() => {});
                }
                if (reversedSprite) {
                    this.spriteManager.ensure(this.spriteManager.makeUrl(reversedSprite)).catch(() => {});
                }
            } catch (e) {
                // Ne jamais casser : silencieux
            }
        }
    }

    addWreckActor(wreckData) {
        if (!wreckData) return;

        const wreckId = wreckData.wreck_id ?? wreckData.id;
        if (!wreckId) {
            console.warn("[MAP] addWreckActor: missing wreck_id", wreckData);
            return;
        }

        const idStr = String(wreckId);
        // Idempotent: si on reÃ§oit une mise Ã  jour/recrÃ©ation de la mÃªme carcasse,
        // on remplace proprement l'ancienne entrÃ©e + son timer local.
        this.removeWreckById(idStr);

        const deadKey = String(wreckData?.dead_key || "").trim();
        if (deadKey.startsWith("pc_")) {
            this.removeActorByPlayerId(deadKey.replace("pc_", ""));
        } else if (deadKey.startsWith("npc_")) {
            this.removeNpcById(deadKey.replace("npc_", ""));
        }

        const size = wreckData.size || {};
        const x = Number.parseInt(wreckData.coordinates?.x ?? wreckData.x ?? 0, 10);
        const y = Number.parseInt(wreckData.coordinates?.y ?? wreckData.y ?? 0, 10);
        const sizeX = Number.isFinite(Number(size.x)) ? Number(size.x) : 1;
        const sizeY = Number.isFinite(Number(size.y)) ? Number(size.y) : 1;

        const shipImage = wreckData.ship?.image || wreckData.image || null;
        const spritePath = shipImage ? `foreground/SHIPS/${shipImage}.png` : null;

        const obj = {
            id: `wreck_${idStr}`,
            type: "wreck",
            data: wreckData,
            x,
            y,
            sizeX,
            sizeY,
            image: shipImage,
            spritePath,
            reversedSprite: spritePath,
        };

        this.wrecks[idStr] = obj;
        this.worldObjects.push(obj);
        this._addObjectToSpatialIndex(obj);
        this.markPathfindingDynamicDirty();
        // Timer local = disparition visuelle Ã  l'heure exacte, mÃªme sans trafic WS.
        this._scheduleWreckExpiry(idStr, wreckData?.expires_at);

        if (this.spriteManager?.ensure && this.spriteManager?.makeUrl && spritePath) {
            try {
                this.spriteManager.ensure(this.spriteManager.makeUrl(spritePath)).catch(() => {});
            } catch (e) {
                // no-op
            }
        }
    }

    removeWreckById(wreckId) {
        if (wreckId == null) return;
        const wid = String(wreckId);
        const before = this.worldObjects.length;
        this.worldObjects = this.worldObjects.filter(o => String(o.id) !== `wreck_${wid}`);
        this._rebuildSpatialIndex();
        delete this.wrecks?.[wid];
        // Nettoie aussi le timer local associÃ© (sinon timeout zombie).
        const t = this.wreckExpiryTimers?.get?.(wid);
        if (t) {
            clearTimeout(t);
            this.wreckExpiryTimers.delete(wid);
        }
        if (before !== this.worldObjects.length) {
            this.markPathfindingDynamicDirty();
        }
    }

    _clearWreckExpiryTimers() {
        for (const t of this.wreckExpiryTimers.values()) clearTimeout(t);
        this.wreckExpiryTimers.clear();
    }

    _scheduleWreckExpiry(wreckId, expiresAtIso) {
        if (!this.wreckExpiryTimers) this.wreckExpiryTimers = new Map();
        const wid = String(wreckId);
        const existing = this.wreckExpiryTimers.get(wid);
        if (existing) {
            clearTimeout(existing);
            this.wreckExpiryTimers.delete(wid);
        }
        if (!expiresAtIso) return;

        const expiresAtMs = new Date(expiresAtIso).getTime();
        if (!Number.isFinite(expiresAtMs)) return;
        const delay = Math.max(0, expiresAtMs - Date.now());

        const timerId = setTimeout(() => {
            this.removeWreckById(wid);
            window.canvasEngine?.renderer?.requestRedraw?.();
            // On notifie le reste du front via un event local pour rÃ©utiliser le mÃªme
            // chemin de cleanup que le WS `wreck_expired` (modal, etc.).
            window.dispatchEvent?.(new CustomEvent("wreck:expired_local", {
                detail: { wreck_id: wid, wreck_key: `wreck_${wid}` }
            }));
            this.wreckExpiryTimers.delete(wid);
        }, delay);

        this.wreckExpiryTimers.set(wid, timerId);
    }
}
