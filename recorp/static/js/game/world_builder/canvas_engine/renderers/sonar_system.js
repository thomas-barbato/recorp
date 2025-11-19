export default class SonarSystem {
    /**
     * options:
     *  - camera
     *  - map (MapData instance)
     *  - ctx (ui canvas 2d ctx) -> used for measurement when rendering if needed
     *  - tileSize (base tile size in px)
     */
    constructor({ camera, map, ctx, tileSize }) {
        this.camera = camera;
        this.map = map;
        this.ctx = ctx;
        this.tileSize = tileSize || camera.tileSize;
        this.active = false;     // sonar active (mobile toggle) or hovered
        this._time = 0;
        this.pulseSpeed = 0.008; // pulsation speed
        this.pulseStrength = 0.12; // relative extra radius
        this.lastVisibleSet = new Set();
    }

    enable() { this.active = true; }
    disable() { this.active = false; }
    toggle() { this.active = !this.active; }
    isActive() { return !!this.active; }

    /**
     * Returns player center in world tiles
     */
    _getPlayer() {
        // Prefer canvas-engine current map player if available
        const id = window.current_player_id;
        if (!id) return null;
        const p = this.map.findPlayerById(id);
        return p || null;
    }

    /**
     * compute whether object is within sonar (circular)
     * obj must provide x,y,sizeX,sizeY in tile coords
     */
    isVisible(obj) {
        const player = this._getPlayer();
        if (!player || !player.data || !player.data.ship) return false;
        const viewRange = Number(player.data.ship.view_range) || Number(player.data.ship.view_range) === 0 ? Number(player.data.ship.view_range) : (player.data.ship.view_range || 6);
        // center positions (in tiles)
        const px = player.x + (player.sizeX || 1) / 2;
        const py = player.y + (player.sizeY || 1) / 2;
        const ox = obj.x + (obj.sizeX || 1) / 2;
        const oy = obj.y + (obj.sizeY || 1) / 2;

        const dx = ox - px;
        const dy = oy - py;
        const distTiles = Math.sqrt(dx*dx + dy*dy);

        return distTiles <= viewRange + 0.0001;
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
        ctx.strokeStyle = 'rgba(44,255,200,0.14)';
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
        ctx.strokeStyle = 'rgba(44,255,190,0.24)';
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
