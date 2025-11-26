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
