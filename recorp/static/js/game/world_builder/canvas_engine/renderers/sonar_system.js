export default class SonarSystem {
    /**
     * options:
     *  - camera
     *  - map (MapData instance)
     *  - ctx (ui canvas 2d ctx)
     *  - tileSize (base tile size in px)
     *  - playerId (id num du joueur courant)
     */
    constructor({ camera, map, ctx, tileSize, playerId }) {
        this.camera = camera;
        this.map = map;
        this.ctx = ctx;
        this.tileSize = tileSize;

        // on garde playerId pour tout : rendu + logique de portée
        this.playerId = playerId || window.current_player_id || (window.currentPlayer?.user?.player ?? null);

        // état
        this.active = false;
        this._pulse = 0;
        this._time = 0;
        this._playerCache = null;

        // range par défaut : on regarde d’abord l’actor dans la map,
        // sinon on retombe sur window.currentPlayer, sinon fallback 6
        let range = 6;

        const actor = this._getPlayerFromMapOnce();
        if (actor?.data?.ship?.view_range != null) {
            range = Number(actor.data.ship.view_range) || 6;
        } else if (window.currentPlayer?.ship?.view_range != null) {
            range = Number(window.currentPlayer.ship.view_range) || 6;
        }

        this.range = range;       // en tiles
        this.speed = 1.25;        // vitesse rotation
        this.trail = 0.35;        // longueur de traînée (0 = pas de traînée)
    }

    // --- helpers d’état ---
    enable() { this.active = true; }
    disable() { this.active = false; }
    toggle() { this.active = !this.active; }
    isActive() { return !!this.active; }

    setPlayerId(playerId) {
        this.playerId = playerId;
        this._playerCache = null;
    }

    /**
     * Cherche le joueur dans la map une fois (utilisé au constructeur)
     */
    _getPlayerFromMapOnce() {
        if (!this.map || !Array.isArray(this.map.worldObjects) || !this.playerId) {
            return null;
        }
        return this.map.worldObjects.find(obj =>
            obj.type === 'player' &&
            obj.data &&
            obj.data.user &&
            String(obj.data.user.player) === String(this.playerId)
        ) || null;
    }

    /**
     * Returns player actor from map (avec cache)
     */
    _getPlayer() {
        // Cache simple
        if (this._playerCache && this._playerCache.data?.user?.player === this.playerId) {
            return this._playerCache;
        }

        if (!this.map || !Array.isArray(this.map.worldObjects) || !this.playerId) {
            return null;
        }

        const found = this.map.worldObjects.find(obj =>
            obj.type === 'player' &&
            obj.data &&
            obj.data.user &&
            String(obj.data.user.player) === String(this.playerId)
        );

        this._playerCache = found || null;
        return this._playerCache;
    }

    update(dt) {
        if (!this.active) return;
        this._pulse += (dt / 1000) * this.speed;
    }

    /**
     * compute whether object is within sonar (circular)
     * obj must provide x,y,sizeX,sizeY in tile coords
     */
    isVisible(obj) {
        if (!obj) return false;

        const player = this._getPlayer();
        if (!player) return false;

        // centre du joueur en coords monde (tiles)
        const px = player.x + (player.sizeX || 1) / 2;
        const py = player.y + (player.sizeY || 1) / 2;

        const range = this.range; // en tiles

        // Bounding box de l'objet (rect)
        const left = obj.x;
        const right = obj.x + (obj.sizeX || 1);
        const top = obj.y;
        const bottom = obj.y + (obj.sizeY || 1);

        // point du rectangle le plus proche du centre du sonar
        const closestX = Math.max(left, Math.min(px, right));
        const closestY = Math.max(top, Math.min(py, bottom));

        const dx = closestX - px;
        const dy = closestY - py;
        const distSq = dx * dx + dy * dy;

        return distSq <= range * range;
    }

    /**
     * returns array of object ids (worldObjects) visible
     */
    getVisibleObjectIds() {
        const set = new Set();
        const objs = this.map.worldObjects || [];
        for (const o of objs) {
            if (this.isVisible(o)) set.add(o.id);
        }
        this.lastVisibleSet = set;
        return Array.from(set);
    }

    /**
     * render sonar visuals on provided UI ctx
     * delta in ms
     */
    render(ctx, delta) {
        if (!this.active) return;

        this._time += delta;

        const player = this._getPlayer();
        if (!player) return;

        // pixels par tile
        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        // centre du joueur en pixels écran
        const centerX = (player.x + (player.sizeX || 1) / 2) * tilePx - this.camera.x;
        const centerY = (player.y + (player.sizeY || 1) / 2) * tilePx - this.camera.y;

        const viewRange = Number(player.data?.ship?.view_range ?? this.range) || this.range;
        const baseRadius = viewRange * tilePx;

        ctx.save();

        // assombrir tout l'écran
        ctx.fillStyle = 'rgba(2,6,12,0.55)';
        ctx.beginPath();
        ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fill();

        // trous du sonar
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 1.02, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';

        // halo décoratif
        const g = ctx.createRadialGradient(
            centerX, centerY, baseRadius * 0.1,
            centerX, centerY, baseRadius * 1.15
        );
        g.addColorStop(0, 'rgba(44,255,200,0.12)');
        g.addColorStop(0.6, 'rgba(44,255,200,0.02)');
        g.addColorStop(1, 'rgba(8,18,25,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 1.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
