// engine/camera.js
// Camera en tiles, centrée sur le joueur. Conserve tileSize fixe.
// Expose worldX/worldY : coordonnées tile en haut-gauche du viewport

export default class Camera {
    constructor({canvasWidth=800, canvasHeight=600, tileSize=32, worldCols=40, worldRows=40}) {
        this.tileSize = tileSize;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.worldCols = worldCols;
        this.worldRows = worldRows;
        this.zoom = 1; // pas de zoom actif, tileSize est constant
        this.x = 0; // pixel offset world -> screen (top-left)
        this.y = 0;
        this.updateViewport();
    }

    resize(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.updateViewport();
    }

    updateViewport() {
        this.visibleTilesX = Math.max(1, Math.floor(this.canvasWidth / (this.tileSize * this.zoom)));
        this.visibleTilesY = Math.max(1, Math.floor(this.canvasHeight / (this.tileSize * this.zoom)));
        // worldX/Y correspondent à la tile en haut-gauche visible
        this.worldX = 0;
        this.worldY = 0;
    }

    // centerOn: center camera on tile coordinates (float allowed for centering multi-tile objects)
    centerOn(worldTileX, worldTileY) {
        const halfX = this.visibleTilesX / 2;
        const halfY = this.visibleTilesY / 2;

        const minX = halfX;
        const minY = halfY;
        const maxX = this.worldCols - halfX;
        const maxY = this.worldRows - halfY;

        const clampedX = Math.max(minX, Math.min(maxX, worldTileX));
        const clampedY = Math.max(minY, Math.min(maxY, worldTileY));

        // calculate pixel offset for top-left tile
        this.x = (clampedX - halfX) * this.tileSize * this.zoom;
        this.y = (clampedY - halfY) * this.tileSize * this.zoom;

        // update worldX/Y (tile indices)
        this.worldX = Math.floor(this.x / (this.tileSize * this.zoom));
        this.worldY = Math.floor(this.y / (this.tileSize * this.zoom));
    }

    // convert tile coords to screen pixels (for drawImage positions)
    worldToScreen(worldTileX, worldTileY) {
        const px = (worldTileX * this.tileSize * this.zoom) - this.x;
        const py = (worldTileY * this.tileSize * this.zoom) - this.y;
        return { x: px, y: py };
    }

    // convert screen pixel to tile coords (integers)
    screenToWorld(screenPxX, screenPxY) {
        const worldX = (screenPxX + this.x) / (this.tileSize * this.zoom);
        const worldY = (screenPxY + this.y) / (this.tileSize * this.zoom);
        return { x: Math.floor(worldX), y: Math.floor(worldY) };
    }
}
