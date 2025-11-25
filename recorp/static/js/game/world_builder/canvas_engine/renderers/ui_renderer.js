// world/ui_renderer.js
import SonarSystem from './sonar_system.js';
import { renderPathfinding } from "./pathfinding_renderer.js";
import { currentPlayer } from '../globals.js';

export default class UIRenderer {
    constructor(ctx, camera, spriteManager, map, options = {}) {
        this.ctx = ctx;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;

        this._time = 0;

        this.ctx.imageSmoothingEnabled = false;

        this.sonar = new SonarSystem({
            camera: camera,
            map: map,
            ctx: this.ctx,
            tileSize: camera.tileSize
        });

        this._sonarPulseTime = 0;

        if (currentPlayer.ship.view_range === undefined || currentPlayer.ship.view_range === null) {
            currentPlayer.ship.view_range = window.currentPlayer.ship.view_range;
        }

        this.pathTiles = [];
        this.maxMovement = currentPlayer.ship.current_movement;

        this.pathfinder = options.pathfinder || null;
    }

    setPath(tiles, maxMovement) {
        this.pathTiles = Array.isArray(tiles) ? tiles : [];
        this.maxMovement = typeof maxMovement === "number" ? maxMovement : 0;
    }

    setPathfinder(pathfinder) {
        this.pathfinder = pathfinder || null;
    }

    clearPath() {
        this.pathTiles = [];
        this.maxMovement = 0;
    }

    _roundedRectPath(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    _renderInvalidPreview(preview) {
        const ctx = this.ctx;
        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        const screen = this.camera.worldToScreen(preview.x, preview.y);
        const x = screen.x;
        const y = screen.y;

        const w = preview.sizeX * tilePx;
        const h = preview.sizeY * tilePx;

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 80, 80, 0.9)";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(255, 80, 80, 0.95)";
        ctx.fillStyle = "rgba(255, 80, 80, 0.35)";

        this._roundedRectPath(ctx, x + 3, y + 3, w - 6, h - 6, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    _renderGrid() {
        const ctx = this.ctx;
        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        const canvas = ctx.canvas;
        const w = canvas?.clientWidth || canvas?.width || this.camera.width;
        const h = canvas?.clientHeight || canvas?.height || this.camera.height;

        const startTileX = this.camera.worldX;
        const startTileY = this.camera.worldY;
        const endTileX = startTileX + this.camera.visibleTilesX + 1;
        const endTileY = startTileY + this.camera.visibleTilesY + 1;

        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(15, 118, 110, 0.35)";

        for (let ty = startTileY; ty <= endTileY; ty++) {
            const y = (ty * tilePx) - this.camera.y;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        for (let tx = startTileX; tx <= endTileX; tx++) {
            const x = (tx * tilePx) - this.camera.x;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * SONAR — balayage + halo
     */
    renderSonar(dt) {
    if (!this.sonar.active) return;

    const ctx = this.ctx;
    const cam = this.camera;

    // --- Récup joueur ---
    let playerData = window.currentPlayer;
    if (!playerData || !playerData.user || !playerData.ship) return;

    const sizeXTiles = playerData.ship.size?.x || 1;
    const sizeYTiles = playerData.ship.size?.y || 1;
    const maxSize = Math.max(sizeXTiles, sizeYTiles);

    const tile = cam.tileSize;

    // --- Centre du vaisseau (centre visuel réel) ---
    const worldX = playerData.user.coordinates.x;
    const worldY = playerData.user.coordinates.y;

    const topLeft = cam.worldToScreen(worldX, worldY);

    const spriteImg = this.spriteManager.get(playerData.ship.image);
    let cx, cy;

    if (spriteImg) {
        const zoom = cam.zoom || 1;
        const spriteW = spriteImg.width  * (tile / 32) * zoom;
        const spriteH = spriteImg.height * (tile / 32) * zoom;

        // centre exact du sprite
        cx = topLeft.x + spriteW / 2;
        cy = topLeft.y + spriteH / 2;
    } else {
        // fallback centre brut
        const screen = cam.worldToScreen(
            worldX + sizeXTiles / 2,
            worldY + sizeYTiles / 2
        );
        cx = screen.x;
        cy = screen.y;
    }

    const viewRange = playerData.ship.view_range || 0;
    const effectiveRangeTiles = Math.max(viewRange - maxSize / 2, 0.5);
    const radius = effectiveRangeTiles * tile * cam.zoom;

    if (!isFinite(cx) || !isFinite(cy) || !isFinite(radius) || radius <= 0) return;

    // ---------------------------------------------------
    // 1) CLEAR uniquement la zone du sonar (pas la grille !)
    // ---------------------------------------------------
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ---------------------------------------------------
    // 2) Fond vert
    // ---------------------------------------------------
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,255,100,0.22)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(0, 79, 59, 0.4)";
    ctx.strokeStyle = "rgb(94, 233, 181)";
    ctx.stroke();
    ctx.restore();

    // ---------------------------------------------------
    // 3) Balayage (rayon unique)
    // ---------------------------------------------------
    const dtSec = (dt || 16) / 1000;
    const speed = this.sonar.speed || 1.0;

    this._sonarPulseTime = (this._sonarPulseTime || 0) + dtSec * speed;
    const angle = this._sonarPulseTime % (Math.PI * 2);

    const endX = cx + Math.cos(angle) * radius;
    const endY = cy + Math.sin(angle) * radius;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "rgba(0,255,255,0.95)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 25;
    ctx.shadowColor = "rgba(0,255,255,0.85)";

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();

    // trailing désactivé (mais l’emplacement est prêt)
}

    render(delta = 0) {
        this._time += delta;
        const ctx = this.ctx;

        const c = ctx.canvas;
        const w = c?.width  || this.camera.width;
        const h = c?.height || this.camera.height;

        ctx.clearRect(0, 0, w, h);

        this._renderGrid();

        if (this.pathfinder && this.pathfinder.invalidPreview) {
            this._renderInvalidPreview(this.pathfinder.invalidPreview);
        }

        if (this.pathfinder && this.pathfinder.current && this.pathfinder.current.path?.length > 0) {
            renderPathfinding(this.ctx, this.camera, {
                path: this.pathfinder.current.path,
                shipSizeX: currentPlayer.ship.size.x,
                shipSizeY: currentPlayer.ship.size.y
            });
        }

        if (this.sonar && this.sonar.active) {
            this.renderSonar(delta);
        }
    }
}
