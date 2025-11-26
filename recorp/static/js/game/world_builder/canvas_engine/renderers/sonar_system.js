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

        const px = window.currentPlayer.user.coordinates.x;
        const py = window.currentPlayer.user.coordinates.y;

        const dx = obj.x - px;
        const dy = obj.y - py;

        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= this.range;
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

        // --- pulses (STYLE C: double offset pulses + inner ring) ---
        const t = this._time * this.pulseSpeed;
        const pulse1 = baseRadius * (1 + Math.abs(Math.sin(t)) * this.pulseStrength);
        const pulse2 = baseRadius * (1 + Math.abs(Math.sin(t + Math.PI * 0.6)) * this.pulseStrength * 0.7);

        // pulse outline 1
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulse1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(44,255,255,0.09)';
        ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.08));
        ctx.stroke();

        // pulse outline 2
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulse2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(44,255,255,0.09)';
        ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
        ctx.stroke();

        // inner ring (solid)
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.92, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(44,255,255,0.09)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // small center beacon
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(2, tilePx * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(44,255,190,0.95)';
        ctx.fill();

        ctx.restore();
    }
}
