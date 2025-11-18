// world/ui_renderer.js
// dessin du quadrillage léger, survol, et coordonnées X/Y (top & right).
// ne modifie pas la taille des tiles, seulement le nombre de tiles visibles.

export default class UIRenderer {
    constructor(ctx, camera, spriteManager, map) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
    }

    render() {
        const ctx = this.ctx;
        const tilePx = this.camera.tileSize * this.camera.zoom;
        const cols = this.camera.visibleTilesX;
        const rows = this.camera.visibleTilesY;
        const w = ctx.canvas.clientWidth;
        const h = ctx.canvas.clientHeight;

        // grille faint
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 1;
        for (let c = 0; c <= cols; c++) {
            const x = Math.round(c * tilePx - (this.camera.x % tilePx));
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let r = 0; r <= rows; r++) {
            const y = Math.round(r * tilePx - (this.camera.y % tilePx));
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        ctx.restore();
    }
}
