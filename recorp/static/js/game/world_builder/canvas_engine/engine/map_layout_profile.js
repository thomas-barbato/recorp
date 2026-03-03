const DEFAULT_TILE_SIZE = 32;
const AXIS_PADDING_TILES = 1;

const VIEWPORT_TILE_PROFILES = [
    { maxWidth: 639, tilesX: 11, tilesY: 11 },   // Mobile
    { maxWidth: 819, tilesX: 16, tilesY: 16 },   // Small tablets
    { maxWidth: 1023, tilesX: 20, tilesY: 20 },  // Tablets
    { maxWidth: 1279, tilesX: 26, tilesY: 18 },  // Small desktops
    { maxWidth: 1535, tilesX: 32, tilesY: 20 },  // Standard desktops
    { maxWidth: 1919, tilesX: 36, tilesY: 22 },  // Large desktops
    { maxWidth: Infinity, tilesX: 39, tilesY: 23 }, // XL+
];

export function getViewportTileProfile(viewportWidth = window.innerWidth) {
    const width = Number.isFinite(viewportWidth) ? viewportWidth : window.innerWidth;
    const profile = VIEWPORT_TILE_PROFILES.find(({ maxWidth }) => width <= maxWidth);
    return profile || VIEWPORT_TILE_PROFILES[VIEWPORT_TILE_PROFILES.length - 1];
}

export function getMapLayoutProfile({ viewportWidth = window.innerWidth, tileSize = DEFAULT_TILE_SIZE } = {}) {
    const { tilesX, tilesY } = getViewportTileProfile(viewportWidth);
    const safeTileSize = Number(tileSize) > 0 ? Number(tileSize) : DEFAULT_TILE_SIZE;

    const wrapperTilesX = tilesX + AXIS_PADDING_TILES;
    const wrapperTilesY = tilesY + AXIS_PADDING_TILES;

    return {
        tileSize: safeTileSize,
        visibleTilesX: tilesX,
        visibleTilesY: tilesY,
        wrapperTilesX,
        wrapperTilesY,
        wrapperWidthPx: wrapperTilesX * safeTileSize,
        wrapperHeightPx: wrapperTilesY * safeTileSize,
    };
}

export function getVisibleTilesFromCanvas({ canvasWidth = 0, canvasHeight = 0, tileSize = DEFAULT_TILE_SIZE } = {}) {
    const safeTileSize = Number(tileSize) > 0 ? Number(tileSize) : DEFAULT_TILE_SIZE;
    const width = Number(canvasWidth) || 0;
    const height = Number(canvasHeight) || 0;

    return {
        visibleTilesX: Math.max(1, Math.floor(width / safeTileSize)),
        visibleTilesY: Math.max(1, Math.floor(height / safeTileSize)),
    };
}
