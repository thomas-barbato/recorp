import { getMapLayoutProfile, getVisibleTilesFromCanvas } from "./map_layout_profile.js";

// Camera in world tiles. Tracks world top-left offset in pixels.
export default class Camera {
    constructor({ canvasWidth = 800, canvasHeight = 600, tileSize = 32, worldCols = 40, worldRows = 40 }) {
        this.tileSize = tileSize;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.worldCols = worldCols;
        this.worldRows = worldRows;
        this.zoom = 1;
        this.x = 0;
        this.y = 0;
        this.autoCenter = true;
        this.updateViewport();
    }

    resize(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.updateViewport();
    }

    updateViewport() {
        const fromCanvas = getVisibleTilesFromCanvas({
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            tileSize: this.tileSize,
        });

        let maxX = fromCanvas.visibleTilesX;
        let maxY = fromCanvas.visibleTilesY;

        if (!Number.isFinite(maxX) || maxX < 1 || !Number.isFinite(maxY) || maxY < 1) {
            const fallback = getMapLayoutProfile({
                viewportWidth: window.innerWidth,
                tileSize: this.tileSize,
            });
            maxX = fallback.visibleTilesX;
            maxY = fallback.visibleTilesY;
        }

        this.visibleTilesX = Math.max(1, Math.min(this.worldCols, maxX));
        this.visibleTilesY = Math.max(1, Math.min(this.worldRows, maxY));

        const tilePx = this.tileSize * this.zoom;
        this.worldX = Math.floor(this.x / tilePx);
        this.worldY = Math.floor(this.y / tilePx);
    }

    centerOn(worldTileX, worldTileY) {
        const halfX = this.visibleTilesX / 2;
        const halfY = this.visibleTilesY / 2;

        const minX = halfX;
        const minY = halfY;
        const maxX = Math.max(minX, this.worldCols - halfX);
        const maxY = Math.max(minY, this.worldRows - halfY);

        const clampedX = Math.max(minX, Math.min(maxX, worldTileX));
        const clampedY = Math.max(minY, Math.min(maxY, worldTileY));

        const tilePx = this.tileSize * this.zoom;
        this.x = (clampedX - halfX) * tilePx;
        this.y = (clampedY - halfY) * tilePx;

        // Keep camera aligned to tile boundaries to avoid rendering an extra
        // partial row/column when centering on 0.5 tile coordinates.
        this.x = Math.round(this.x / tilePx) * tilePx;
        this.y = Math.round(this.y / tilePx) * tilePx;

        this.worldX = Math.floor(this.x / tilePx);
        this.worldY = Math.floor(this.y / tilePx);
    }

    worldToScreen(worldTileX, worldTileY) {
        const px = (worldTileX * this.tileSize * this.zoom) - this.x;
        const py = (worldTileY * this.tileSize * this.zoom) - this.y;
        return { x: px, y: py };
    }

    screenToWorld(screenPxX, screenPxY) {
        const worldX = (screenPxX + this.x) / (this.tileSize * this.zoom);
        const worldY = (screenPxY + this.y) / (this.tileSize * this.zoom);
        return { x: Math.floor(worldX), y: Math.floor(worldY) };
    }

    worldToScreenCoords(worldX, worldY) {
        return this.worldToScreen(worldX, worldY);
    }

    getWorldBounds(paddingTiles = 0) {
        const padding = Math.max(0, Number(paddingTiles) || 0);
        return {
            minX: Math.max(0, this.worldX - padding),
            minY: Math.max(0, this.worldY - padding),
            maxX: Math.min(this.worldCols, this.worldX + this.visibleTilesX + padding),
            maxY: Math.min(this.worldRows, this.worldY + this.visibleTilesY + padding)
        };
    }

    intersectsWorldRect(worldX, worldY, sizeX = 1, sizeY = 1, paddingTiles = 0) {
        const bounds = this.getWorldBounds(paddingTiles);
        return (
            worldX < bounds.maxX &&
            worldY < bounds.maxY &&
            (worldX + sizeX) > bounds.minX &&
            (worldY + sizeY) > bounds.minY
        );
    }
}