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
        this.wrecks = {};
        this.wreckExpiryTimers = new Map();
        this.foregrounds = [];
        this.background = this.raw.sector?.background || null;
    }

    async prepare() {
        if (!this.raw) throw new Error('MapData.prepare: raw undefined');

        this.worldObjects = [];
        this.players = {};
        this.wrecks = {};
        this._clearWreckExpiryTimers();
        this.foregrounds = [];

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
    }


    findPlayerById(id) {
        if (id == null) return null;
        
        // on tolère number / string
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
    
    getObjectsAtTile(tileX, tileY) {
        return this.worldObjects.filter(o =>
        tileX >= o.x && tileX < (o.x + o.sizeX) &&
        tileY >= o.y && tileY < (o.y + o.sizeY)
        ).sort((a, b) => {
        const pri = { player: 3, npc: 3, wreck: 3, foreground: 2, background: 1 };
        return (pri[b.type] || 0) - (pri[a.type] || 0);
        });
    }

    getTopObjectAt(tileX, tileY) {
        const arr = this.getObjectsAtTile(tileX, tileY);
        return arr.length ? arr[0] : null;
    }

     // -----------------------------------------------------------------
    //  NOUVEAU : test si une case est bloquée pour le pathfinding
    // -----------------------------------------------------------------
    isBlocked(x, y, ignoreIds = new Set()) {
        // hors de la carte => bloqué
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return true;
        }

        const objs = this.getObjectsAtTile(x, y);
        if (!objs.length) return false;

        for (const o of objs) {
            if (ignoreIds.has(o.id)) continue;

            // ✅ NE PAS se bloquer soi-même (important pour ships > 1x1)
            if ((o.type === "player" || o.type === "npc")
                && String(o.data?.user?.player) === String(window.current_player_id)) {
                continue;
            }

            if (o.type === "player" || o.type === "npc" || o.type === "foreground") {
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

        // On vérifie si un objet occupe cette tuile
        const obj = this.getTopObjectAt(x, y);

        if (!obj) return false;

        // foreground (planètes, astéroïdes, stations...) = bloquant
        if (obj.type === "foreground") return true;
        if (obj.type === "wreck") return true;

        // NPC ou Player (autre que moi) = bloquant
        if (obj.type === "player" || obj.type === "npc") {
            // mais pas le joueur lui-même !
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
    //  Retourne un tableau [{x,y}, ...] (sans le point de départ)
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

        // ✅ reconstruction via cameFrom (fiable)
        const pathReversed = [];
        let cur = bestGoalKey;

        while (cur !== startKey) {
            const n = open.get(cur) || null;

            // si le goal a été trouvé, il est possible qu'il ne soit plus dans open
            // donc on reconstruit la coord à partir de la clé
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
                    MISSILE: null,
                    THERMAL: null,
                    BALLISTIC: null
                }
            }
        };

        // players indexé à la fois par number et par string pour plus de robustesse
        this.players[playerId] = obj;
        this.players[pidStr] = obj;

        this.worldObjects.push(obj);

        // Préchargement des sprites si le spriteManager est dispo
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
                // mode défensif : ne rien casser si le prefetch foire
            }
        }
    }

    // ======================================================================
    // Suppression d’un PC à partir de son pc_id
    // (supprime pc_<id> + toute forme unknown liée)
    // ======================================================================
    removeActorByPlayerId(playerId) {
        if (playerId == null) return;

        const pidStr = String(playerId);
        const before = this.worldObjects.length;

        this.worldObjects = this.worldObjects.filter(o => {
            // id direct pc_XX
            if (String(o.id) === `pc_${pidStr}`) return false;

            // acteur "unknown" mais qui possède un user.player
            const objPid = o?.data?.user ? String(o.data.user.player) : null;
            if (objPid === pidStr) return false;

            return true;
        });

        // Nettoyage du cache players
        delete this.players[pidStr];
        const pidNum = Number(pidStr);
        if (!Number.isNaN(pidNum)) {
            delete this.players[pidNum];
        }

        const after = this.worldObjects.length;
        if (before !== after) {
            console.warn(`[MAP] removeActorByPlayerId(${pidStr}) → ${before} -> ${after}`);
        }
    }

    // ======================================================================
    // Suppression d’un NPC à partir de son npc_id
    // (supprime npc_<id> + toute forme unknown liée)
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

            // --- 3. unknown avec data.user.npc ---
            if (o?.data?.user?.npc && String(o.data.user.npc) === nidStr) return false;

            // --- 4. id style "unknown-npc-<id>" ---
            if (o.id && o.id.includes("unknown") && o.id.endsWith("_" + nidStr)) return false;

            return true;
        });

        delete this.npcs?.[nidStr];
        const nidNum = Number(nidStr);
        if (!Number.isNaN(nidNum)) delete this.npcs?.[nidNum];

    }

    // ======================================================================
    // Ajout dynamique d'un NPC (pour spawn, apparition d'ennemis, scripts…)
    // Structure identique à celle générée dans prepare() → compatible modals
    // ======================================================================
    addNpcActor(npcData) {
        if (!npcData) return;

        const npcId = npcData.npc_id || npcData.id || npcData.pk;
        if (!npcId) {
            console.warn("[MAP] addNpcActor: npcData sans npc_id", npcData);
            return;
        }

        const idStr = String(npcId);

        // Supprimer toute version existante (npc_<id> ou unknown lié)
        this.removeNpcById(npcId);

        // Détermination de la taille
        const size = npcData.size || npcData.ship?.size || {};
        const sizeX = Number.isFinite(Number(size.x)) ? Number(size.x) : 1;
        const sizeY = Number.isFinite(Number(size.y)) ? Number(size.y) : 1;

        // Coordonnées du NPC
        const x = Number.parseInt(
            npcData.coordinates?.x ?? npcData.x ?? 0,
            10
        );
        const y = Number.parseInt(
            npcData.coordinates?.y ?? npcData.y ?? 0,
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
            subtype: npcData.ship?.name || npcData.name || null,
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

        // Préchargement des images si spriteManager existe
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
        // Idempotent: si on reçoit une mise à jour/recréation de la même carcasse,
        // on remplace proprement l'ancienne entrée + son timer local.
        this.removeWreckById(idStr);

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
        // Timer local = disparition visuelle à l'heure exacte, même sans trafic WS.
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
        this.worldObjects = this.worldObjects.filter(o => String(o.id) !== `wreck_${wid}`);
        delete this.wrecks?.[wid];
        // Nettoie aussi le timer local associé (sinon timeout zombie).
        const t = this.wreckExpiryTimers?.get?.(wid);
        if (t) {
            clearTimeout(t);
            this.wreckExpiryTimers.delete(wid);
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
            // On notifie le reste du front via un event local pour réutiliser le même
            // chemin de cleanup que le WS `wreck_expired` (modal, etc.).
            window.dispatchEvent?.(new CustomEvent("wreck:expired_local", {
                detail: { wreck_id: wid, wreck_key: `wreck_${wid}` }
            }));
            this.wreckExpiryTimers.delete(wid);
        }, delay);

        this.wreckExpiryTimers.set(wid, timerId);
    }
}
