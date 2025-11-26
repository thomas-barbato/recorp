export default class SonarSystem {
    /**
     * options:
     *  - camera
     *  - map (MapData instance)
     *  - ctx (ui canvas 2d ctx) -> used for measurement when rendering if needed
     *  - tileSize (base tile size in px)
     */
    
    constructor({ camera, map, ctx, tileSize, playerId }) {
        this.camera = camera;
        this.map = map;
        this.ctx = ctx;
        this.tileSize = tileSize;

        this.active = false;

        if (currentPlayer.ship.view_range === undefined || currentPlayer.ship.view_range === null) {
            currentPlayer.ship.view_range = window.currentPlayer.ship.view_range;
        }

        this.range = currentPlayer.ship.view_range;      // nombre de tiles
        this.speed = 1.25;   // vitesse rotation
        this.trail = 0.35;   // longueur de traînée (0 = pas de traînée)

        // internes
        this._pulse = 0;
    }

    enable() { this.active = true; }
    disable() { this.active = false; }
    toggle() { this.active = !this.active; }
    isActive() { return !!this.active; }

    /**
     * Returns player center in world tiles
     */
    _getPlayer() {
        // Cache simple pour éviter de rebalayer le tableau à chaque fois
        if (this._playerCache && this._playerCache.data?.user?.player === this.playerId) {
            return this._playerCache;
        }

        if (!this.map || !Array.isArray(this.map.worldObjects)) {
            return null;
        }

        const found = this.map.worldObjects.find(obj =>
            obj.type === 'player' &&
            obj.data &&
            obj.data.user &&
            obj.data.user.player === this.playerId
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

        // Position centrale du joueur (cercle)
        const px = window.currentPlayer.user.coordinates.x + 0.5;
        const py = window.currentPlayer.user.coordinates.y + 0.5;

        const range = this.range; // en tiles

        // Bounding box de l'objet (rect)
        const left = obj.x;
        const right = obj.x + obj.sizeX;
        const top = obj.y;
        const bottom = obj.y + obj.sizeY;

        // Trouver le point du rectangle le plus proche du centre du sonar
        const closestX = Math.max(left, Math.min(px, right));
        const closestY = Math.max(top, Math.min(py, bottom));

        // Distance entre ce point et le centre du sonar
        const dx = closestX - px;
        const dy = closestY - py;

        const distSq = dx*dx + dy*dy;

        // Si ce point est dans le cercle → intersection → visible
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
        // only render when active
        if (!this.active) return;

        this._time += delta;

        const player = this._getPlayer();
        if (!player) return;

        // center in screen pixels
        // camera.x / camera.y are pixel offsets (see your background renderer usage)
        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        // compute player center in pixels
        const centerX = (player.x + (player.sizeX || 1) / 2) * tilePx - this.camera.x;
        const centerY = (player.y + (player.sizeY || 1) / 2) * tilePx - this.camera.y;

        const viewRange = Number(player.data.ship.view_range) || 6;
        const baseRadius = viewRange * tilePx;

        // --- draw dimming mask outside sonar ---
        ctx.save();

        // draw full dark rectangle
        ctx.fillStyle = 'rgba(2,6,12,0.55)'; // subtle space darkening
        ctx.beginPath();
        ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fill();

        // create hole
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 1.02, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';

        // --- decorative gradient halo (slightly glowing) ---
        const g = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.1, centerX, centerY, baseRadius * 1.15);
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
