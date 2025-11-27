export default class BackgroundRenderer {
    constructor(ctx, camera, spriteManager, map) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
    }

    render() {
        const canvas = this.ctx.canvas;
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);

        // Fond couleur si pas d’image
        this.ctx.fillStyle = '#0b1220';
        this.ctx.fillRect(0, 0, w, h);

        // Aucune image ?
        const bgId = this.map.raw?.sector?.image;
        if (!bgId) return;

        // Charge l’image
        const src = this.spriteManager.makeUrl(`background/${bgId}/0.webp`);
        const img = this.spriteManager.get(src);
        if (!img) {
            this.spriteManager.ensure(src).catch(()=>{});
            return;
        }

        // --- CALCUL DU VIEWPORT DANS L’IMAGE ---
        // Exemple :
        // sx = offset horizontal dans l'image
        // sy = offset vertical dans l'image

        // Ratio pixel/tile
        const pxPerTile = this.camera.tileSize * this.camera.zoom;

        const sx = this.camera.x;      // offset horizontal en px dans l’image
        const sy = this.camera.y;      // offset vertical en px
        const sw = w;                  // largeur affichée
        const sh = h;                  // hauteur affichée

        // Clamp pour éviter hors-image
        const clampedSx = Math.max(0, Math.min(img.width  - sw, sx));
        const clampedSy = Math.max(0, Math.min(img.height - sh, sy));

        // --- DESSIN D’UNE PORTION DE L’IMAGE ---
        this.ctx.drawImage(
            img,
            clampedSx, clampedSy,  // partie de l’image à lire
            sw, sh,                // taille de la partie à lire
            0, 0,                  // où la dessiner sur le canvas
            w, h                   // taille du rendu final
        );
    }
}
