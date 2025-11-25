// world/ui_renderer.js
// dessin du quadrillage léger, survol, et coordonnées X/Y (top & right).
// ne modifie pas la taille des tiles, seulement le nombre de tiles visibles.
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

        // Pour un affichage plus net
        this.ctx.imageSmoothingEnabled = false;

        // instantiate sonar with UI ctx so it can render there
        this.sonar = new SonarSystem({
            camera: camera,
            map: map,
            ctx: this.ctx,
            tileSize: camera.tileSize
        });

        // Compteur temps pour le sonar (rotation)
        this._sonarPulseTime = 0;

        // Sécu: si jamais view_range est absent
        if (currentPlayer.ship.view_range === undefined || currentPlayer.ship.view_range === null) {
            currentPlayer.ship.view_range = window.currentPlayer.ship.view_range; // rayon de X tiles
        }

        // chemin courant (tableau de {x,y})
        this.pathTiles = [];
        this.maxMovement = currentPlayer.ship.current_movement;

        // 🔗 pathfinder (CanvasPathfinding)
        this.pathfinder = options.pathfinder || null;
    }

    /**
     * Définit le chemin à afficher et le nombre max de cases "déplaçables"
     * @param {Array<{x:number,y:number}>} tiles
     * @param {number} maxMovement
     */
    setPath(tiles, maxMovement) {
        this.pathTiles = Array.isArray(tiles) ? tiles : [];
        this.maxMovement = typeof maxMovement === "number" ? maxMovement : 0;
    }

    setPathfinder(pathfinder) {
        this.pathfinder = pathfinder || null;
    }

    /**
     * Efface le chemin affiché.
     */
    clearPath() {
        this.pathTiles = [];
        this.maxMovement = 0;
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
        ctx.shadowColor = "rgba(255, 80, 80, 0.9)"; // glow rouge
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(255, 80, 80, 0.95)";
        ctx.fillStyle = "rgba(255, 80, 80, 0.35)";

        // rectangle arrondi (même fonction que pour le jaune)
        this._roundedRectPath(ctx, x + 3, y + 3, w - 6, h - 6, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
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

    _renderGrid() {
        const ctx = this.ctx;
        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        // dimensions affichées (CSS pixels, plus robustes avec le DPR)
        const w = ctx.canvas.clientWidth || ctx.canvas.width;
        const h = ctx.canvas.clientHeight || ctx.canvas.height;

        const startTileX = this.camera.worldX;
        const startTileY = this.camera.worldY;

        const endTileX = startTileX + this.camera.visibleTilesX + 1;
        const endTileY = startTileY + this.camera.visibleTilesY + 1;

        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(15, 118, 110, 0.35)"; // teal discret

        // lignes horizontales
        for (let ty = startTileY; ty <= endTileY; ty++) {
            const y = (ty * tilePx) - this.camera.y;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // lignes verticales
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
     * Sonar visuel : fond rempli + rayon unique qui balaye
     * @param {number} delta temps écoulé (ms)
     */
    renderSonar(delta) {
        if (!this.sonar.active) return;

        const ctx = this.ctx;
        const cam = this.camera;
        const playerData = currentPlayer;

        if (!playerData || !playerData.ship || !playerData.user) return;

        const tile = cam.tileSize;
        const zoom = cam.zoom || 1;

        const worldX = playerData.user.coordinates.x;
        const worldY = playerData.user.coordinates.y;
        const sizeX = playerData.ship.size.x;
        const sizeY = playerData.ship.size.y;

        // Centre du vaisseau, peu importe la taille (1x1, 1x2, 3x3…)
        const cxWorld = worldX + (sizeX - 1) / 2;
        const cyWorld = worldY + (sizeY - 1) / 2;
        const pos = cam.worldToScreen(cxWorld, cyWorld);
        const cx = pos.x;
        const cy = pos.y;

        const radius = playerData.ship.view_range * tile * zoom;

        // === 1) FOND COMPLET (équivalent .in-range CSS) ===
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "rgba(0, 255, 100, 0.22)";  // fond vert

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // bordure + glow interne vert
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00ff64";
        ctx.shadowBlur = 18;
        ctx.shadowColor = "rgba(0, 255, 100, 0.35)";
        ctx.stroke();
        ctx.restore();

        // === 2) BALAYAGE : rayon unique, sens horaire ===

        // delta est en ms → on le convertit en secondes pour un contrôle plus fin
        const dtSeconds = (delta || 16) / 1000;

        // vitesse configurable via this.sonar.speed (sinon défaut lent)
        const speed = this.sonar.speed || 3; // plus petit = plus lent

        this._sonarPulseTime = (this._sonarPulseTime || 0) + dtSeconds * speed;

        const angle = this._sonarPulseTime % (Math.PI * 2);

        // Coordonnées du bout du rayon
        const endX = cx + Math.cos(angle) * radius;
        const endY = cy + Math.sin(angle) * radius;

        /* ==========================================================
        BALAYAGE PRINCIPAL — RAYON UNIQUE
        ========================================================== */
        ctx.save();

        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = "rgba(0, 255, 255, 0.95)";
        ctx.lineWidth = 4;

        // Glow
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(0, 255, 255, 0.85)";

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();

        /* ==========================================================
        TRAILING EFFECT (OPTIONNEL)
        → tu peux le réactiver ici si tu veux plusieurs traits
        ========================================================== */

        ctx.save();
        const tailCount = 8;          // nombre de traits dans la “traîne”
        const tailOpacity = 0.07;     // intensité de la trace
        for (let i = 1; i <= tailCount; i++) {
            const a = angle - i * 0.12; // léger décalage derrière le rayon
            const ex = cx + Math.cos(a) * radius;
            const ey = cy + Math.sin(a) * radius;
            ctx.globalAlpha = tailOpacity * (1 - i / tailCount);
            ctx.strokeStyle = "rgba(0, 255, 255, 1)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }
        ctx.restore();
    }

    getCenter() {
        const me = this._getPlayer?.();
        if (!me) return null;

        // Centre basé sur la taille du vaisseau
        const cx = me.x + me.sizeX / 2;
        const cy = me.y + me.sizeY / 2;

        return { x: cx, y: cy };
    }

    getRadius() {
        const me = this._getPlayer?.();
        if (!me) return 0;

        // le radius = range * tileSize
        return me.ship.view_range * this.tileSize;
    }

    render(delta = 0) {
        this._time += delta;
        const ctx = this.ctx;

        // 1) Clear UI (première étape !)
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 2) Grille
        this._renderGrid();

        // 3) Pathfinding
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

        // 4) SONAR
        if (this.sonar && this.sonar.active) {
            this.renderSonar(delta);
        }
    }
}
