export default class Input {
    /**
     * @param {Object} options
     * @param {Object} options.uiCanvas - { el, ctx } provenant de CanvasManager
     * @param {Object} options.camera   - instance de Camera
     * @param {Object} options.map      - instance de MapData
     * @param {Function} [options.onObjectClick] - (obj, info) => void
     * @param {Function} [options.onTileClick]   - (tx, ty, info) => void
     * @param {Function} [options.onMouseMove]   - (tx, ty, info) => void
     * @param {Function} [options.onMouseLeave]  - () => void
     */
    constructor({ uiCanvas, camera, map, onObjectClick, onTileClick, onMouseMove, onMouseLeave }) {
        // uiCanvas = { el, ctx } → on garde le vrai <canvas>
        this.canvas = uiCanvas.el || uiCanvas;
        this.ctx = uiCanvas.ctx || null;
        this.camera = camera;
        this.map = map;

        this.onObjectClick = onObjectClick || null;
        this.onTileClick   = onTileClick   || null;
        this.onMouseMove   = onMouseMove   || null;
        this.onMouseLeave  = onMouseLeave  || null;

        this._bindEvents();
    }

    _bindEvents() {
        // CLICK
        this.canvas.addEventListener("click", (ev) => {
            const info = this._eventToWorld(ev);
            if (!info) return;

            const { tileX, tileY } = info;

            // Y a-t-il un objet sur cette tile ?
            const obj = this.map.getTopObjectAt(tileX, tileY);

            if (obj && this.onObjectClick) {
                this.onObjectClick(obj, info);
                return;
            }

            // Sinon, clic "vide" sur une tile → pathfinding / autre
            if (this.onTileClick) {
                this.onTileClick(tileX, tileY, info);
            }
        });

        // MOUSE MOVE
        this.canvas.addEventListener("mousemove", (ev) => {
            if (!this.onMouseMove) return;
            const info = this._eventToWorld(ev);
            if (!info) return;
            const { tileX, tileY } = info;
            this.onMouseMove(tileX, tileY, info);
        });

        // MOUSE LEAVE
        this.canvas.addEventListener("mouseleave", () => {
            if (this.onMouseLeave) {
                this.onMouseLeave();
            }
        });
    }

    /**
     * Convertit un event souris en coordonnées monde & tile.
     */
    _eventToWorld(ev) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;

        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        // world pixel = camera.x/y + offset
        const worldPxX = this.camera.x + mx;
        const worldPxY = this.camera.y + my;

        const tileX = Math.floor(worldPxX / tilePx);
        const tileY = Math.floor(worldPxY / tilePx);

        return {
            mouseX: mx,
            mouseY: my,
            worldPxX,
            worldPxY,
            tileX,
            tileY
        };
    }
}