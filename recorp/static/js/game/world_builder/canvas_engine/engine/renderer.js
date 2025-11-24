// engine/renderer.js
// Pipeline de rendu. Instancie les renderers de chaque couche.
// fournit reloadMapData(newRaw) pour appliquer un sync serveur.

import BackgroundRenderer from "../renderers/background_renderer.js";
import ForegroundRenderer from "../renderers/foreground_renderer.js";
import ActorsRenderer from "../renderers/actors_renderer.js";
import UIRenderer from "../renderers/ui_renderer.js";


export default class Renderer {
    constructor({canvases, camera, spriteManager, map}) {
        this.canvases = canvases;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
        this.needsRedraw = true;
        
        this.bg = new BackgroundRenderer(canvases.bg.ctx, camera, spriteManager, map);
        this.fg = new ForegroundRenderer(canvases.fg.ctx, camera, spriteManager, map);
        this.actors = new ActorsRenderer(canvases.actors.ctx, camera, spriteManager, map);

        // UI créée sans pathfinder, qu'on branchera après
        this.ui = new UIRenderer(canvases.ui.ctx, camera, spriteManager, map, {});
        this.uiCtx = canvases.ui.ctx;

        // nouvelle couche floating pour le texte
        this.floating = canvases.floating || null;
        this.floatingCtx = this.floating ? this.floating.ctx : null;
        
        // sonar partagé pour les acteurs
        this.sonar = this.ui.sonar;
        this.actors.sonar = this.sonar;
    }

    requestRedraw() { this.needsRedraw = true; }

    setPathfinder(pathfinder) {
        this.pathfinder = pathfinder;
        if (this.ui && typeof this.ui.setPathfinder === "function") {
            this.ui.setPathfinder(pathfinder);
        }
        this.requestRedraw();
    }

    // render appelé par la loop (delta en ms)
    render(delta) {
        // efface canvas
        const { bg, fg, actors, ui, floating } = this.canvases;
        [bg, fg, actors, ui].forEach(c => {
            // Laisser la couche UI intacte (elle est nettoyée manuellement)
            c.ctx.clearRect(0, 0, c.el.width, c.el.height);
        });

        // dessine couches dans l'ordre
        this.bg.render();
        this.fg.render();
        this.actors.render(delta);
        this.ui.render();
        this.needsRedraw = false;
        if (this.floatingCtx) {
            // rien à faire ici, c'est juste pour assurer que la couche existe
            // tout est déjà dessiné par drawFloatingText()
        }
    }

    updateGridCoordinatesUI(camera, tileSize) {
        const contX = document.getElementById("ui-coordinates-x");
        const contY = document.getElementById("ui-coordinates-y");

        //
        // --- AXE X (haut) ---
        //

        // 2) Ajoute les coordonnées X
        for (let i = 0; i < camera.visibleTilesX; i++) {
            const worldX = camera.worldX + i;

            const div = document.createElement("div");
            div.className =
                "flex items-center justify-center text-emerald-300 font-orbitron font-semibold " +
                "border border-emerald-400/20 bg-zinc-800/50 " +
                "w-[32px] h-[32px] md:p-1 text-xs tracking-wider shadow-sm " +
                "hover:bg-emerald-500/10 transition-all duration-200";

            div.innerText = worldX;
            contX.appendChild(div);
        }

        //
        // --- AXE Y (gauche) ---
        //
        for (let i = 0; i < camera.visibleTilesY; i++) {
            const worldY = camera.worldY + i;

            const div = document.createElement("div");
            div.className =
                "flex items-center justify-center text-emerald-300 font-orbitron font-semibold " +
                "border border-emerald-400/20 bg-zinc-800/50 " +
                "w-[32px] h-[32px] md:p-1 text-xs tracking-wider shadow-sm " +
                "hover:bg-emerald-500/10 transition-all duration-200";

            div.innerText = worldY;
            contY.appendChild(div);
        }
    }

    clearUILayer() {
        const ui = this.canvases.ui;
        if (!ui) return;
        ui.ctx.clearRect(0, 0, ui.el.width, ui.el.height);
    }

    clearFloatingLayer() {
        const f = this.canvases.floating;
        if (!f) return;
        f.ctx.clearRect(0, 0, f.el.width, f.el.height);
    }

    drawFloatingText(text, worldX, worldY, color = "rgba(0,255,180,0.95)", duration = 1200) {
        const ctx = this.floatingCtx;
        const camera = this.camera;
        if (!ctx || !camera) return;

        const screen = camera.worldToScreenCoords(worldX, worldY);

        // Nettoie uniquement la couche floating
        this.clearFloatingLayer();

        ctx.font = "22px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.lineWidth = 3;

        ctx.strokeStyle = "black";
        ctx.fillStyle = color;

        const textY = screen.y - 20;

        ctx.strokeText(text, screen.x, textY);
        ctx.fillText(text, screen.x, textY);

        setTimeout(() => {
            this.clearFloatingLayer();
            this.requestRedraw();
        }, duration);
    }


    drawObject(obj, ctx) {
        const tileSize = this.tileSize;

        const screenX = Math.floor((obj.x - this.camera.originX) * tileSize);
        const screenY = Math.floor((obj.y - this.camera.originY) * tileSize);

        const screenW = obj.sizeX * tileSize;
        const screenH = obj.sizeY * tileSize;

        const img = this.spriteManager.get(obj.spritePath);
        if (!img) return; // pas encore chargé

        const isShip = (obj.type === "player" || obj.type === "npc");
        const reversed = isShip && obj.data?.ship?.is_reversed;

        if (!reversed) {
            // ---- Normal draw ----
            ctx.drawImage(img, screenX, screenY, screenW, screenH);
            return;
        }

        // ---- Reversed (flipped horizontally) ----
        ctx.save();
        ctx.translate(screenX + screenW, screenY); // déplace le point d'origine à droite
        ctx.scale(-1, 1); // flip horizontal
        ctx.drawImage(img, 0, 0, screenW, screenH);
        ctx.restore();
    }

    // appelé par bootstrap quand un sync serveur ouvre de nouvelles données
    reloadMapData(newRaw) {
        this.map.raw = newRaw;
        this.map.prepare()
            .then(() => this.requestRedraw())
            .catch(e => console.error('reloadMapData prepare failed', e));
    }
}