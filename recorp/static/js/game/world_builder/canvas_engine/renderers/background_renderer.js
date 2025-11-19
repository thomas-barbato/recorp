// world/background_renderer.js
// dessine un fond en "tiling" (ou couleur uni si pas d'image).
// note: canvas ne gère pas d'animation GIF - on dessine la frame actuelle.

export default class BackgroundRenderer {
    constructor(ctx, camera, spriteManager, map) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
    }

    render() {
        const w = this.ctx.canvas.clientWidth;
        const h = this.ctx.canvas.clientHeight;

        // fond par défaut (espace)
        this.ctx.fillStyle = '#0b1220';
        this.ctx.fillRect(0, 0, w, h);
        // si map.background défini, on tente de tiler l'image
        if (this.map.img) {
        const rel = this.map.raw.sector.image; // ex: 'background/nebula01'
        const src = this.spriteManager.makeUrl(`background/${rel}/0.webp`);
        const img = this.spriteManager.get(src);
        if (img) {
            const tilePx = this.camera.tileSize * this.camera.zoom;
            // calculer le tile de début en pixels pour la position de la caméra
            // nous dessinons des tuiles de la taille d'une case (pour correspondre à l'ancienne logique)
            const startTileX = Math.floor(this.camera.x / tilePx) - 1;
            const startTileY = Math.floor(this.camera.y / tilePx) - 1;
            const cols = Math.ceil(w / tilePx) + 2;
            const rows = Math.ceil(h / tilePx) + 2;
            this.ctx.drawImage(img, screenX, screenY, tilePx, tilePx);
            for (let ry = 0; ry < rows; ry++) {
            for (let cx = 0; cx < cols; cx++) {
                const worldTileX = startTileX + cx;
                const worldTileY = startTileY + ry;
                const screenX = (worldTileX * tilePx) - this.camera.x;
                const screenY = (worldTileY * tilePx) - this.camera.y;
            }
            }
        } else {
            // si image pas preloaded : demande le preload (non-bloquant)
            this.spriteManager.ensure(src).catch(()=>{});
        }
        }
    }
}
