// engine/pathfinding.js
// Contrôleur de pathfinding pour le moteur canvas (PC).
// - calcule une couronne de départ autour du vaisseau (taille variable)
// - A* avec obstacles (foreground + ships)
// - intègre la règle des points de mouvement + couleurs teal / rouge
// - 1er clic sur une tile vide : affiche le chemin
// - 2e clic sur la même tile : "confirmation" (déplacement plus tard)
// - si la souris quitte la tile cible : le chemin est effacé

const BLOCKING_FOREGROUND_TYPES = ["planet", "asteroid", "station", "star", "blackhole", "satellite"];

export default class PathfindingController {
    /**
     * @param {Object} options
     * @param {Object} options.map      - MapData
     * @param {Object} options.camera   - Camera
     * @param {Object} options.uiLayer  - instance de UIRenderer
     */
    constructor({ map, camera, uiLayer }) {
        this.map = map;
        this.camera = camera;
        this.ui = uiLayer;

        this.lockedTarget = null; // {x,y} une fois qu'on a cliqué une première fois
        this.currentPath = [];

        // pour éviter du travail inutile à chaque mouvement
        this._lastMouseTile = null;
    }

    // ---------------------------
    // HELPERS : joueur courant
    // ---------------------------

    getCurrentPlayer() {
        if (!window.current_player_id) return null;
        return this.map.findPlayerById(window.current_player_id);
    }

    getCurrentMovementPoints() {
        const me = this.getCurrentPlayer();
        if (!me || !me.data || !me.data.ship) return 0;
        return me.data.ship.current_movement || 0;
    }

    // ---------------------------
    // API depuis Input
    // ---------------------------

    /**
     * Clic sur une tile "vide" (sans objet cliquable)
     */
    handleClick(tileX, tileY) {
        const me = this.getCurrentPlayer();
        if (!me) return;

        // 2e clic sur la même tile = confirmation
        if (this.lockedTarget &&
            this.lockedTarget.x === tileX &&
            this.lockedTarget.y === tileY) {
            // ici plus tard : envoi WS / déplacement réel
            console.log("[Pathfinding] Confirmation de déplacement vers :", tileX, tileY);
            // on nettoie le chemin (ou on pourra le laisser jusqu'à la fin de l'anim)
            this.clear();
            return;
        }

        // Nouveau clic = nouvelle cible
        const path = this._computePathFromShipTo(tileX, tileY);
        if (!path || path.length === 0) {
            this.clear();
            return;
        }

        this.lockedTarget = { x: tileX, y: tileY };
        this.currentPath = path;

        const mp = this.getCurrentMovementPoints();
        this.ui.setPath(path, mp);
    }

    /**
     * Mouvement de souris : si on avait une cible verrouillée
     * et qu'on quitte cette tile, on efface le chemin.
     */
    handleMouseMove(tileX, tileY) {
        this._lastMouseTile = { x: tileX, y: tileY };

        if (this.lockedTarget) {
            if (tileX !== this.lockedTarget.x || tileY !== this.lockedTarget.y) {
                // la souris a quitté la tile de destination → on annule
                this.clear();
            }
        }
    }

    /**
     * Sortie du canvas UI : on efface le chemin.
     */
    handleMouseLeave() {
        this.clear();
        this._lastMouseTile = null;
    }

    clear() {
        this.lockedTarget = null;
        this.currentPath = [];
        this.ui.clearPath();
    }

    // ---------------------------
    // Cœur du pathfinding
    // ---------------------------

    /**
     * Calcule le chemin depuis la couronne autour du vaisseau
     * jusqu'à la tile destination.
     */
    _computePathFromShipTo(destX, destY) {
        const me = this.getCurrentPlayer();
        if (!me) return null;

        const shipX = me.x;
        const shipY = me.y;
        const sizeX = me.sizeX || 1;
        const sizeY = me.sizeY || 1;

        // 1) construire la couronne de départ autour du vaisseau
        const ring = this._buildStartRing(shipX, shipY, sizeX, sizeY);
        if (ring.length === 0) return null;

        // 2) choisir la tile de départ la plus proche de la destination
        let bestStart = null;
        let bestDist = Infinity;

        for (const c of ring) {
            if (!this._isWalkable(c.x, c.y)) continue;
            const dx = c.x - destX;
            const dy = c.y - destY;
            const dist = Math.abs(dx) + Math.abs(dy); // Manhattan
            if (dist < bestDist) {
                bestDist = dist;
                bestStart = c;
            }
        }

        if (!bestStart) return null;

        // 3) A* classique
        const path = this._aStar(bestStart, { x: destX, y: destY });
        return path;
    }

    /**
     * Construit la couronne externe autour du vaisseau.
     * Exemple pour 3x3 :
     *
     *          [U]
     *      [U][X][U]
     *  [U][X][X][X][U]
     *      [U][X][U]
     *          [U]
     */
    _buildStartRing(x, y, sizeX, sizeY) {
        const ring = [];
        const minX = x;
        const minY = y;
        const maxX = x + sizeX - 1;
        const maxY = y + sizeY - 1;

        // haut (au-dessus du vaisseau)
        for (let cx = minX; cx <= maxX; cx++) {
            ring.push({ x: cx, y: minY - 1 });
        }
        // bas
        for (let cx = minX; cx <= maxX; cx++) {
            ring.push({ x: cx, y: maxY + 1 });
        }
        // gauche
        for (let cy = minY; cy <= maxY; cy++) {
            ring.push({ x: minX - 1, y: cy });
        }
        // droite
        for (let cy = minY; cy <= maxY; cy++) {
            ring.push({ x: maxX + 1, y: cy });
        }

        // on peut filtrer éventuellement les coordonnées hors map ici
        return ring.filter(c =>
            c.x >= 0 && c.x < this.map.mapWidth &&
            c.y >= 0 && c.y < this.map.mapHeight
        );
    }

    /**
     * Test si la tile est walkable (foreground bloquant, ships, bords…)
     */
    _isWalkable(x, y) {
        if (x < 0 || y < 0 || x >= this.map.mapWidth || y >= this.map.mapHeight) {
            return false;
        }

        // On récupère tous les objets sur cette case
        const objs = this.map.getObjectsAtTile(x, y);

        for (const o of objs) {
            // foreground : certains types bloquent
            if (o.type === "foreground") {
                const t = o.subtype || o.data?.data?.type || null;
                if (t && BLOCKING_FOREGROUND_TYPES.includes(t)) {
                    return false;
                }
            }

            // ships : on ne peut pas passer à travers les autres vaisseaux
            if (o.type === "player" || o.type === "npc") {
                const me = this.getCurrentPlayer();
                const isMe = me && me.id === o.id;
                if (!isMe) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * A* 4-directions (haut, bas, gauche, droite)
     */
    _aStar(start, goal) {
        const key = (x, y) => `${x},${y}`;

        const openSet = new Set();
        openSet.add(key(start.x, start.y));

        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const setScore = (map, x, y, val) => map.set(key(x, y), val);
        const getScore = (map, x, y, def = Infinity) => map.has(key(x, y)) ? map.get(key(x, y)) : def;

        setScore(gScore, start.x, start.y, 0);
        setScore(fScore, start.x, start.y, this._heuristic(start, goal));

        const neighbors = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        let safety = this.map.mapWidth * this.map.mapHeight * 10; // limite anti-boucle

        while (openSet.size > 0 && safety-- > 0) {
            // node avec le plus petit fScore
            let currentKey = null;
            let currentNode = null;
            let bestF = Infinity;

            for (const k of openSet) {
                const [cx, cy] = k.split(",").map(Number);
                const f = getScore(fScore, cx, cy);
                if (f < bestF) {
                    bestF = f;
                    currentKey = k;
                    currentNode = { x: cx, y: cy };
                }
            }

            if (!currentNode) break;

            // objectif atteint
            if (currentNode.x === goal.x && currentNode.y === goal.y) {
                return this._reconstructPath(cameFrom, currentNode);
            }

            openSet.delete(currentKey);

            for (const n of neighbors) {
                const nx = currentNode.x + n.dx;
                const ny = currentNode.y + n.dy;

                if (!this._isWalkable(nx, ny)) continue;

                const tentativeG = getScore(gScore, currentNode.x, currentNode.y) + 1;
                const gExisting = getScore(gScore, nx, ny);

                if (tentativeG < gExisting) {
                    // meilleur chemin vers ce voisin
                    cameFrom.set(key(nx, ny), currentNode);
                    setScore(gScore, nx, ny, tentativeG);
                    setScore(fScore, nx, ny, tentativeG + this._heuristic({ x: nx, y: ny }, goal));

                    const nk = key(nx, ny);
                    if (!openSet.has(nk)) {
                        openSet.add(nk);
                    }
                }
            }
        }

        // pas de chemin trouvé
        return [];
    }

    _heuristic(a, b) {
        // Manhattan
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    _reconstructPath(cameFrom, current) {
        const path = [current];
        const key = (x, y) => `${x},${y}`;

        while (cameFrom.has(key(current.x, current.y))) {
            current = cameFrom.get(key(current.x, current.y));
            path.push(current);
        }

        path.reverse(); // départ -> arrivée
        return path;
    }
}
