// dessine tous les objets foreground (planetes, stations...).
// chaque objet multi-tile est dessiné en une seule drawImage.

export default class ForegroundRenderer {
    constructor(ctx, camera, spriteManager, map) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
    }

    render() {
        const tilePx = this.camera.tileSize * this.camera.zoom;
        this.map.foregrounds.forEach(obj => {
            const scr = this.camera.worldToScreen(obj.x, obj.y);
            const pxW = obj.sizeX * tilePx;
            const pxH = obj.sizeY * tilePx;
            const src = this.spriteManager.makeUrl(obj.spritePath);
            const img = this.spriteManager.get(src);
            if (img) {
                this.ctx.drawImage(img, scr.x, scr.y, pxW, pxH);
                const ctx = this.ctx;
                const sonar = this.map?.sonar || this.sonar; // selon ta structure
                const sonarVisible = sonar ? sonar.isVisible(obj) : true;
                const hover = window.canvasEngine?.hoverTarget || null;
                if (hover && hover === obj) {
                    // Si tu veux la bordure uniquement quand c'est dans le sonar :
                    ctx.save();
                    ctx.lineWidth = Math.max(1, Math.round(tilePx * 0.06));
                    ctx.setLineDash([4, 4]);
                    ctx.strokeStyle = "rgba(52, 211, 153, 1)"; // emerald-400
                    ctx.strokeRect(scr.x + 1, scr.y + 1, pxW - 2, pxH - 2);
                    ctx.restore();
                }
                // Si tu la veux même hors sonar, enlève simplement le if(sonarVisible).
            } else {
                // placeholder semi-translucent if pas chargé
                this.ctx.fillStyle = 'rgba(180, 120, 255, 0.25)';
                this.ctx.fillRect(scr.x, scr.y, pxW, pxH);
                // demande preload
                this.spriteManager.ensure(src).catch(()=>{});
            }
        });
    }
}
