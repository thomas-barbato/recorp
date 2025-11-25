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

        // Compteur pour le sonar pulsant
        this._sonarPulseTime = 0;

        if (this.sonar.range === undefined || this.sonar.range === null) {
            this.sonar.range = window.currentPlayer.ship.view_range// rayon de X tiles 
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
    
    renderSonar() {
        const ctx = this.ctx;
        const cam = this.camera;

        const playerData = currentPlayer;
        if (!playerData || !playerData.ship || !playerData.user) return;

        const tile = cam.tileSize;
        const zoom = cam.zoom || 1;

        // Position dans le monde
        const worldX = playerData.user.coordinates.x;
        const worldY = playerData.user.coordinates.y;
        const sizeX = playerData.ship.size.x;
        const sizeY = playerData.ship.size.y;

        // Centre monde
        const cxWorld = worldX + (sizeX - 1) / 2;
        const cyWorld = worldY + (sizeY - 1) / 2;

        // Conversion en écran
        const base = cam.worldToScreen(cxWorld, cyWorld);
        const cx = base.x;
        const cy = base.y;

        const radius = this.sonar.range * tile;

        // --------------------------------------
        // 1) CERCLE PERMANENT — VERT FLUO
        // --------------------------------------
        ctx.save();
        ctx.globalAlpha = 0.20;
        ctx.strokeStyle = "#00ff64";        // bord vert fluo
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Glow interne (équivalent box-shadow inset)
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grd.addColorStop(0, "rgba(0,255,100,0.4)");
        grd.addColorStop(1, "rgba(0,255,100,0.0)");
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.restore();


        // --------------------------------------
        // 2) BALAYAGE RADAR — CYAN FLUO
        // --------------------------------------
        const angle = (this._sonarPulseTime * 0.004) % (Math.PI * 2);
        const sweep = (22 * Math.PI) / 180; // 22° comme CSS (~20°)

        const a1 = angle - sweep / 2;
        const a2 = angle + sweep / 2;

        ctx.save();
        ctx.globalAlpha = 0.55; // proche rgba(0,255,255,0.6)

        // Glow cyan externe (équivalent box-shadow)
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        glow.addColorStop(0, "rgba(0,255,255,0.6)");
        glow.addColorStop(0.7, "rgba(0,255,255,0.3)");
        glow.addColorStop(1, "rgba(0,255,255,0.0)");
        ctx.fillStyle = glow;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, a1, a2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();


        // -------------------------------------------------------
        // 3) BALAYAGE "NUCLEAIRE" FIN — Ligne cyan pure (#00FFFF)
        // -------------------------------------------------------
        ctx.save();
        ctx.globalAlpha = 0.90;
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.stroke();

        ctx.restore();

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
        this._sonarPulseTime += delta;
        if (this.sonar && this.sonar.active) {
            this.renderSonar();
        }
    }
}
