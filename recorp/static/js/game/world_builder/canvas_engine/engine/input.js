// input.js — version finale basée sur un objet config
export default class Input {

    /**
     * new Input({
     *   uiCanvas: HTMLCanvasElement,
     *   camera,
     *   map,
     *   renderer,
     *   pathfinding,
     *   onObjectClick(obj),
     *   onTileClick(tx, ty, info),
     *   onMouseMove(tx, ty, info),
     *   onMouseLeave()
     * })
     */
    constructor(options = {}) {
        this.uiCanvas = options.uiCanvas;     // HTMLCanvasElement obligatoire
        this.camera = options.camera;
        this.map = options.map;
        this.renderer = options.renderer;
        this.pathfinding = options.pathfinding;

        // callbacks utilisateur
        this.onObjectClick = options.onObjectClick || function () {};
        this.onTileClick = options.onTileClick || function () {};
        this.onMouseMove = options.onMouseMove || function () {};
        this.onMouseLeave = options.onMouseLeave || function () {};

        this.hoveredPlayer = false;

        if (!this.uiCanvas) {
            console.error("Input ERROR: uiCanvas manquant.");
            return;
        }

        this._bindEvents();
    }

    // ---------------------------------------------------------------------
    // Bind des events sur le canvas UI
    // ---------------------------------------------------------------------
    _bindEvents() {

        // Click → tile + object
        this.uiCanvas.addEventListener("click", ev => {
            const info = this._eventToTile(ev);
            if (!info) return;

            const { tx, ty, topObject } = info;

            if (topObject) {
                this.onObjectClick(topObject);
            } else {
                this.onTileClick(tx, ty, info);
            }
        });

        // Mouse move → tile hover
        this.uiCanvas.addEventListener("mousemove", ev => {
            const info = this._eventToTile(ev);
            if (!info) return;

            this.onMouseMove(info.tx, info.ty, info);
        });

        // Mouse leave du canvas UI
        this.uiCanvas.addEventListener("mouseleave", () => {
            this.onMouseLeave();
        });
    }
    

    // ---------------------------------------------------------------------
    // Convertit un event souris → case 32×32 du monde
    // ---------------------------------------------------------------------
    _eventToTile(ev) {
        const rect = this.uiCanvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;

        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        const worldX = Math.floor((mx + this.camera.x) / tilePx);
        const worldY = Math.floor((my + this.camera.y) / tilePx);

        if (worldX < 0 || worldY < 0 ||
            worldX >= this.map.mapWidth ||
            worldY >= this.map.mapHeight) {
            return null;
        }

        const topObject = this.map.getTopObjectAt(worldX, worldY);

        return {
            tx: worldX,
            ty: worldY,
            mx, my,
            worldX, worldY,
            topObject
        };
    }
}
