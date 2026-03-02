// canvas_pathfinding.js — VERSION FINALE

// Binary heap implementation used for the open set (module level)
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
    sinkDown(n) {
        const element = this.content[n];
        const score = this.scoreFunction(element);
        while (n > 0) {
            const parentN = Math.floor((n + 1) / 2) - 1;
            const parent = this.content[parentN];
            if (score >= this.scoreFunction(parent)) break;
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }
    bubbleUp(n) {
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.scoreFunction(element);
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const child2N = (n + 1) * 2;
            const child1N = child2N - 1;
            let swap = null;
            let child1Score;
            if (child1N < length) {
                const child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);
                if (child1Score < elemScore) swap = child1N;
            }
            if (child2N < length) {
                const child2 = this.content[child2N];
                const child2Score = this.scoreFunction(child2);
                if ((swap === null ? elemScore : child1Score) > child2Score) swap = child2N;
            }
            if (swap === null) break;
            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
}

export default class CanvasPathfinding {
    /**
     * options = {
     *   tileSize: 32,
     *   map: MapData instance,
     *   renderer: Renderer instance
     * }
     */
    constructor(options = {}) {
        this.map = options.map;
        this.renderer = options.renderer;
        this.tileSize = options.tileSize || 32;

        // stockage interne du résultat visible à l'écran
        this.current = null;
        this.path = [];

        this.hoverTx = null;
        this.hoverTy = null;
    }

    // ---------------------------------------------------------
    // Événement de clic (déclenché par Input.onTileClick)
    // ---------------------------------------------------------
    handleClick(tx, ty) {
        // 1) si clic sur même case → tentative de validation
        if (this.current && this.current.dest &&
            this.current.dest.x === tx &&
            this.current.dest.y === ty &&
            !this.invalidPreview) {

            // chemin valide → envoi WS
            this._sendMoveToServer();
            this.clear();
            return;
        }

        // 2) si clic sur même case mais preview rouge → on efface juste
        if (this.invalidPreview &&
            this.invalidPreview.x === tx &&
            this.invalidPreview.y === ty) {

            // Si la raison de la preview rouge est la surcharge, afficher
            // un message flottant rouge indiquant l'impossibilité.
            if (this.invalidPreview.reason === "overloaded") {
                try {
                    const engine = window.canvasEngine;
                    const me = this.map.findPlayerById(window.current_player_id);
                    const sizeX = me?.sizeX || 1;
                    const sizeY = me?.sizeY || 1;
                    const worldX = tx + (sizeX - 1) / 2;
                    const worldY = ty + (sizeY - 1) / 2;
                    const text = "Vous êtes surchargé";

                    if (engine?.renderer?.drawFloatingText) {
                        engine.renderer.drawFloatingText(text, worldX, worldY, "rgba(255,80,80,0.95)", 1500);
                    } else if (engine?.renderer?.addFloatingMessage) {
                        engine.renderer.addFloatingMessage({ text, worldX, worldY, color: "rgba(255,80,80,0.95)", duration: 1500 });
                    }
                } catch (e) {
                    console.warn("Erreur affichage message surcharge:", e);
                }
                return;
            }

            this.clear();
            return;
        }

        // 3) sinon → calcul du pathfinding
        this._compute(tx, ty);
    }

    // ---------------------------------------------------------
    // Hover : met à jour le tile pointé — NE CALCULE PAS le path
    // ---------------------------------------------------------
    handleHover(tx, ty) {
        this.hoverTx = tx;
        this.hoverTy = ty;

        // Si on a un chemin courant et que la souris quitte la tuile de destination → clear
        if (this.current && this.current.dest) {
            if (tx !== this.current.dest.x || ty !== this.current.dest.y) {
                this.clear();
            }
        }

        // ---- Effacer la zone rouge ----
        if (this.invalidPreview) {
            const inv = this.invalidPreview;

            const inside =
                tx >= inv.x &&
                tx < inv.x + inv.sizeX &&
                ty >= inv.y &&
                ty < inv.y + inv.sizeY;

            if (!inside) {
                this.clear();
            }
        }
    }

    // ---------------------------------------------------------
    // Efface le pathfinding
    // ---------------------------------------------------------
    clear() {
        this.current = null;
        this.path = [];
        this.invalidPreview = null;
        if (this.renderer?.requestRedraw) {
            this.renderer.requestRedraw();
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
                // coût 0 → mouvement invalide
                console.warn("[MOVE] move_cost < 1 → mouvement ignoré");
                return;
            }

            // coût = nombre de pas
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
                    path: path
                }
            });

        } catch (e) {
            console.error("Erreur _sendMoveToServer:", e);
        }
    }
    /**
     * Vérifie que toutes les cases nécessaires à la taille du vaisseau sont libres.
     */
    _isDestinationAreaFree(x, y, me) {
        const sizeX = me.sizeX || 1;
        const sizeY = me.sizeY || 1;

        for (let dy = 0; dy < sizeY; dy++) {
            for (let dx = 0; dx < sizeX; dx++) {
                const tx = x + dx;
                const ty = y + dy;

                // hors map
                if (tx < 0 || ty < 0 ||
                    tx >= this.map.mapWidth ||
                    ty >= this.map.mapHeight) {
                    return false;
                }

                // case bloquante ?
                if (this.map.isBlockedTile(tx, ty)) {
                    return false;
                }
            }
        }

        return true;
    }

    // ---------------------------------------------------------
    // Calcule tout : anneau de départ + A*
    // ---------------------------------------------------------
    _compute(destX, destY) {

        const me = this.map.findPlayerById(window.current_player_id);
        if (!me) return;

        // Bloquer le pathfinding si le vaisseau est en surcapacité
        try {
            const shipData = window.currentPlayer?.ship || {};
            const load = Number(shipData?.cargo_load_current ?? 0);
            const capacity = Number(shipData?.cargo_capacity ?? shipData?.current_cargo_size ?? 0);
            const isOverloaded = Boolean(shipData?.cargo_over_capacity) || (Number.isFinite(load) && Number.isFinite(capacity) && load > capacity);

            if (isOverloaded) {
                this.current = null;
                this.path = [];
                this.invalidPreview = {
                    x: destX,
                    y: destY,
                    sizeX: me.sizeX,
                    sizeY: me.sizeY,
                    reason: "overloaded"
                };
                this.renderer.requestRedraw();
                return;
            }
        } catch (e) {
            // si erreur, on ne bloque pas (sécurité)
            console.warn('Erreur vérification surcharge:', e);
        }

        this.shipSizeX = me.sizeX;
        this.shipSizeY = me.sizeY;

        const startRing = this._computeStartRing(me);
        if (startRing.length === 0) return;

        const bestStart = this._pickClosest(startRing, { x: destX, y: destY });

        const path = this._computePath(bestStart, { x: destX, y: destY });
        // -- Calcul du coût du chemin --
        const pathCost = path.length;
        let pmRemaining = 0;
        if (window.currentPlayer?.ship?.current_movement != null) {
            pmRemaining = window.currentPlayer.ship.current_movement;
        }

        if (!path) {
            this.current = null;
            this.path = [];
        } else {
            this.current = {
                startList: startRing,
                start: bestStart,
                dest: { x: destX, y: destY },
                path
            };
            this.path = path;
        }
        // -- Vérification PM (si zone est libre mais PM insuffisants) --
        if (pathCost > pmRemaining) {
            // preview rouge (destination atteignable mais PM insuffisants)
            this.current = null;
            this.path = [];
            this.invalidPreview = {
                x: destX,
                y: destY,
                sizeX: me.sizeX,
                sizeY: me.sizeY,
                reason: "not_enough_pm",  // Juste au cas où tu veux afficher un message
                pathCost,
                pmRemaining
            };
            this.renderer.requestRedraw();
            return;
        }

        // Vérifier que la zone destination est libre pour la taille du vaisseau
        if (!this._isDestinationAreaFree(destX, destY, me)) {
            // chemin impossible → zone rouge
            this.current = null;
            this.path = [];
            this.invalidPreview = {
                x: destX,
                y: destY,
                sizeX: me.sizeX,
                sizeY: me.sizeY
            };
            this.renderer.requestRedraw();
            return;
        }

        this.renderer.requestRedraw();
    }

    // ---------------------------------------------------------
    // Construit l'anneau de départ autour du vaisseau
    // ---------------------------------------------------------
    _computeStartRing(me) {
        const sx = me.x;
        const sy = me.y;
        const w = me.sizeX;
        const h = me.sizeY;

        const raw = [];

        // TOP
        for (let i = 0; i < w; i++)
            raw.push({ x: sx + i, y: sy - 1 });

        // BOTTOM
        for (let i = 0; i < w; i++)
            raw.push({ x: sx + i, y: sy + h });

        // LEFT
        for (let j = 0; j < h; j++)
            raw.push({ x: sx - 1, y: sy + j });

        // RIGHT
        for (let j = 0; j < h; j++)
            raw.push({ x: sx + w, y: sy + j });

        // ------ Filtre : dans la map & non bloqué ------
        const filtered = raw.filter(p =>
            p.x >= 0 &&
            p.y >= 0 &&
            p.x < this.map.mapWidth &&
            p.y < this.map.mapHeight &&
            !this.map.isBlockedTile(p.x, p.y)
        );

        return filtered;
    }

    // ---------------------------------------------------------
    // Choisit le start le + proche de la destination
    // ---------------------------------------------------------
    _pickClosest(list, dest) {
        let best = null;
        let bestDist = Infinity;
        list.forEach(p => {
            const dx = p.x - dest.x;
            const dy = p.y - dest.y;
            const d = dx * dx + dy * dy;
            if (d < bestDist) {
                bestDist = d;
                best = p;
            }
        });
        return best;
    }

    // ---------------------------------------------------------
    // Pathfinding A* — Contourne les obstacles
    // ---------------------------------------------------------
    _computePath(start, dest) {
        const W = this.map.mapWidth;
        const H = this.map.mapHeight;
        const isBlocked = (x, y) => this.map.isBlockedTile(x, y);

        const closed = new Set();
        const parent = new Map();
        const g = new Map();

        // ensemble pour vérifier rapidement si un nœud est dans la liste ouverte
        const openSet = new Set();

        const key = (x, y) => `${x},${y}`;

        const startKey = key(start.x, start.y);
        const destKey = key(dest.x, dest.y);

        const h = (p) => Math.abs(p.x - dest.x) + Math.abs(p.y - dest.y);

        const openHeap = new BinaryHeap(node => g.get(key(node.x, node.y)) + h(node));
        openHeap.push(start);
        openSet.add(startKey);
        g.set(startKey, 0);

        while (openHeap.size() > 0) {
            const cur = openHeap.pop();
            const ck = key(cur.x, cur.y);
            openSet.delete(ck);

            if (ck === destKey) {
                const final = [];
                let k = ck;
                while (parent.has(k)) {
                    final.push(k);
                    k = parent.get(k);
                }
                final.push(startKey);
                final.reverse();

                return final.map(s => {
                    const [sx, sy] = s.split(',').map(Number);
                    return { x: sx, y: sy };
                });
            }

            closed.add(ck);

            const neighbors = [
                { x: cur.x + 1, y: cur.y },
                { x: cur.x - 1, y: cur.y },
                { x: cur.x, y: cur.y + 1 },
                { x: cur.x, y: cur.y - 1 }
            ];

            for (const nb of neighbors) {
                if (nb.x < 0 || nb.x >= W || nb.y < 0 || nb.y >= H) continue;

                const nk = key(nb.x, nb.y);
                if (closed.has(nk)) continue;

                if (isBlocked(nb.x, nb.y)) continue;

                const tentative = g.get(ck) + 1;

                if (!g.has(nk) || tentative < g.get(nk)) {
                    parent.set(nk, ck);
                    g.set(nk, tentative);

                    if (!openSet.has(nk)) {
                        openHeap.push(nb);
                        openSet.add(nk);
                    }
                }
            }
        }

        return null;
    }
}
