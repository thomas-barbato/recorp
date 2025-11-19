// engine/canvas_pathfinding.js
// Gère la prévisualisation du chemin sur le canvas UI.

export default class CanvasPathfinding {
    constructor({ map, camera, renderer }) {
        this.map = map;
        this.camera = camera;
        this.renderer = renderer;

        this.active = false;          // pathfinding activé après premier clic
        this.lastHoverTile = null;    // dernière tuile survolée
        this.lastComputed = null;     // { tiles:[{x,y,step}], valid:true/false }
    }

    // ---------------------------------------------------------------------
    // Données joueur
    // ---------------------------------------------------------------------
    _getPlayerBoundingBox() {
        const me = this.map.findPlayerById(window.current_player_id);
        if (!me) return null;

        return {
            player: me,
            x: me.x,
            y: me.y,
            sizeX: me.sizeX || 1,
            sizeY: me.sizeY || 1
        };
    }

    // ---------------------------------------------------------------------
    // Construction de l'anneau de départ autour du vaisseau
    // ---------------------------------------------------------------------
    _buildStartRing(box) {
        const tiles = [];

        const minX = box.x;
        const maxX = box.x + box.sizeX - 1;
        const minY = box.y;
        const maxY = box.y + box.sizeY - 1;

        // ligne du haut
        for (let x = minX; x <= maxX; x++) {
            tiles.push({ x, y: minY - 1 });
        }

        // ligne du bas
        for (let x = minX; x <= maxX; x++) {
            tiles.push({ x, y: maxY + 1 });
        }

        // côtés gauche/droit
        for (let y = minY; y <= maxY; y++) {
            tiles.push({ x: minX - 1, y });
            tiles.push({ x: maxX + 1, y });
        }

        return tiles.filter(t =>
            t.x >= 0 &&
            t.y >= 0 &&
            t.x < this.map.mapWidth &&
            t.y < this.map.mapHeight
        );
    }

    // ---------------------------------------------------------------------
    // Trouver le point du ring le plus proche
    // ---------------------------------------------------------------------
    _closestStartTile(ring, target) {
        let best = null;
        let bestDist = Infinity;

        for (const t of ring) {
            const dx = t.x - target.x;
            const dy = t.y - target.y;
            const dist = dx * dx + dy * dy;

            if (dist < bestDist) {
                bestDist = dist;
                best = t;
            }
        }
        return best;
    }

    // ---------------------------------------------------------------------
    // Construire un chemin simple (sans décalage)
    // ---------------------------------------------------------------------
    _buildSimplePath(start, target) {
        const path = [];
        let x = start.x;
        let y = start.y;
        let step = 2;

        path.push({ x, y, step: 1 }); // <-- le vrai début, collé au ring

        while (x !== target.x || y !== target.y) {

            if (x < target.x) x++;
            else if (x > target.x) x--;

            if (y < target.y) y++;
            else if (y > target.y) y--;

            path.push({ x, y, step });
            step++;
        }
        return path;
    }

    // ---------------------------------------------------------------------
    // Calcul depuis la tuile survolée
    // ---------------------------------------------------------------------
    _compute() {
        const hover = this.lastHoverTile;
        if (!hover) return;

        const box = this._getPlayerBoundingBox();
        if (!box) return;

        // si la tuile survolée est une tuile du vaisseau -> effacer
        if (
            hover.x >= box.x &&
            hover.x < box.x + box.sizeX &&
            hover.y >= box.y &&
            hover.y < box.y + box.sizeY
        ) {
            this.clear();
            return;
        }

        const ring = this._buildStartRing(box);
        const start = this._closestStartTile(ring, hover);
        if (!start) {
            this.clear();
            return;
        }

        const path = this._buildSimplePath(start, hover);

        const me = box.player;
        const mp = me.data?.ship?.current_movement ?? 0;
        const valid = path.length - 1 <= mp;   // -1 car step 0 = ring

        // transmettre toutes les infos au renderer
        this.lastComputed = { tiles: path, valid };
        window.__canvasPathPreview = this.lastComputed;
        this.renderer.requestRedraw();
    }

    // ---------------------------------------------------------------------
    // Survol souris
    // ---------------------------------------------------------------------
    handleHover(tileX, tileY) {
        const pos = { x: tileX, y: tileY };

        // Si changement de tuile → recalcul / disparition
        if (
            !this.lastHoverTile ||
            this.lastHoverTile.x !== pos.x ||
            this.lastHoverTile.y !== pos.y
        ) {
            this.lastHoverTile = pos;

            if (!this.active) {
                // pas dans la phase de pathfinding → pas d'affichage permanent
                this.clear();
                return;
            }

            this._compute();
        }
    }

    // ---------------------------------------------------------------------
    // Clic
    // ---------------------------------------------------------------------
    handleClick(tileX, tileY) {

        // 1er clic → activer
        if (!this.active) {
            this.active = true;
            this.lastHoverTile = { x: tileX, y: tileY };
            this._compute();
            return;
        }

        // 2e clic → valider si la tuile = destination finale
        if (this.lastComputed) {
            const final = this.lastComputed.tiles.at(-1);
            if (final && final.x === tileX && final.y === tileY) {
                console.log("➡ Déplacement (à implémenter)");
            }
        }

        // reset pour recommencer
        this.active = false;
        this.clear();
    }

    // ---------------------------------------------------------------------
    // Nettoyage
    // ---------------------------------------------------------------------
    clear() {
        this.lastComputed = null;
        window.__canvasPathPreview = null;
        this.renderer.requestRedraw();
    }
}
