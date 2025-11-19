// world/ui_renderer.js
// dessin du quadrillage léger, survol, et coordonnées X/Y (top & right).
// ne modifie pas la taille des tiles, seulement le nombre de tiles visibles.
import SonarSystem from './sonar_system.js';
import { renderPathfinding } from "./pathfinding_renderer.js";

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

        // chemin courant (tableau de {x,y})
        this.pathTiles = [];
        this.maxMovement = 0; // points de mouvement restants du joueur
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

    /**
     * Efface le chemin affiché.
     */
    clearPath() {
        this.pathTiles = [];
        this.maxMovement = 0;
    }

    render() {
        const pf = window.__canvasPathPreview;

        if (!pf || !pf.tiles || pf.tiles.length === 0) {
            return;
        }

        const tilePx = this.camera.tileSize * (this.camera.zoom || 1);

        for (const t of pf.tiles) {
            const scr = this.camera.worldToScreen(t.x, t.y);
            const x = scr.x;
            const y = scr.y;

            // Style selon si la tuile est valide ou hors distance
            if (pf.valid) {
                // turquoise semi-transparent
                this.ctx.fillStyle = "rgba(0, 255, 200, 0.35)";
                this.ctx.strokeStyle = "rgba(0, 255, 200, 0.55)";
            } else {
                // rouge semi-transparent
                this.ctx.fillStyle = "rgba(255, 50, 50, 0.35)";
                this.ctx.strokeStyle = "rgba(255, 80, 80, 0.8)";
            }

            // carré semi transparent
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.rect(x, y, tilePx, tilePx);
            this.ctx.fill();
            this.ctx.stroke();

            // Affichage du numéro (step)
            // On ne met PAS de numéro sur t.step === 0 (tuile du ring)
            if (t.step > 0) {
                this.ctx.fillStyle = pf.valid ? "#00ffee" : "#ff5555";
                this.ctx.font = `${Math.floor(tilePx * 0.45)}px Orbitron, sans-serif`;
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";

                this.ctx.fillText(
                    t.step.toString(),
                    x + tilePx / 2,
                    y + tilePx / 2
                );
            }
        }
    }
}
