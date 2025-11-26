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
        const sonar = this.sonar;
        if (!sonar.active) return;

        const ctx = this.ctx;
        const cam = this.camera;

        const player = window.currentPlayer;
        if (!player) return;

        // --------------- CALCUL CENTRE ----------------
        const worldX = player.user.coordinates.x;
        const worldY = player.user.coordinates.y;

        const sizeX = player.ship.size?.x || 1;
        const sizeY = player.ship.size?.y || 1;

        const topLeft = cam.worldToScreen(worldX, worldY);

        const sprite = this.spriteManager.get(player.ship.image);
        let cx, cy;

        if (sprite) {
            const zoom = cam.zoom || 1;
            const w = sprite.width * (cam.tileSize / 32) * zoom;
            const h = sprite.height * (cam.tileSize / 32) * zoom;

            cx = topLeft.x + w / 2;
            cy = topLeft.y + h / 2;
        } else {
            const scr = cam.worldToScreen(worldX + sizeX / 2, worldY + sizeY / 2);
            cx = scr.x;
            cy = scr.y;
        }

        if (!isFinite(cx) || !isFinite(cy)) return;

        // -------------- RAYON SONAR ------------------
        const tile = cam.tileSize * cam.zoom;
        const radius = sonar.range * tile;

        if (!isFinite(radius) || radius <= 0) return;

        // -------------- UPDATE DU TEMPS ----------------
        sonar.update(dt);
        const t = sonar._pulse;
        const angle = t % (Math.PI * 2);

        // -------------- CLEAR LOCAL ----------------
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // -------------- FOND ----------------
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,255,100,0.20)";
        ctx.fill();
        ctx.restore();

        // -------------- RAYON ----------------
        const x2 = cx + Math.cos(angle) * radius;
        const y2 = cy + Math.sin(angle) * radius;

        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,255,255,0.85)";
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(0,255,255,0.9)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();

        // -------------- TRAÎNÉE ----------------
        if (sonar.trail > 0) {
            const trailLen = sonar.trail; // 0.25 = 1/4 de cercle

            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, angle - trailLen, angle);
            ctx.lineTo(cx, cy);

            const grad = ctx.createRadialGradient(cx, cy, radius * 0.35, cx, cy, radius);
            grad.addColorStop(0, "rgba(0,255,255,0.45)");
            grad.addColorStop(1, "rgba(0,190,255,0)");

            ctx.fillStyle = grad;
            ctx.fill();

            ctx.restore();
        }
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
