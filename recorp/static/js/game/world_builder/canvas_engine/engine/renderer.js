// engine/renderer.js
// Pipeline de rendu. Instancie les renderers de chaque couche.
// fournit reloadMapData(newRaw) pour appliquer un sync serveur.

import BackgroundRenderer from "../renderers/background_renderer.js";
import ForegroundRenderer from "../renderers/foreground_renderer.js";
import ActorsRenderer from "../renderers/actors_renderer.js";
import UIRenderer from "../renderers/ui_renderer.js";
import FloatingMessageManager from "./floating_message_manager.js"


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
        
        // sonar partagé pour les acteurs
        this.sonar = this.ui.sonar;
        this.actors.sonar = this.sonar;
        // Texte flottant (coût de mouvement, etc.)
        this.floatingText = null;
        // Gestionnaire de messages flottants (texte + icônes)
        this.floatingMessages = new FloatingMessageManager();
    }

    requestRedraw() { this.needsRedraw = true; }

    setPathfinder(pathfinder) {
        this.pathfinder = pathfinder;
        if (this.ui && typeof this.ui.setPathfinder === "function") {
            this.ui.setPathfinder(pathfinder);
        }
        this.requestRedraw();
    }

    addFloatingMessage(opts) {
        if (!this.floatingMessages) return;
        this.floatingMessages.addMessage(opts);
        this.requestRedraw();
    }

    // render appelé par la loop (delta en ms)
    render(delta) {
        const { bg, fg, actors, ui } = this.canvases;

        // 1) Effacer TOUTES les couches de rendu principales, y compris l'UI
        [bg, fg, actors, ui].forEach(c => {
            c.ctx.clearRect(0, 0, c.el.width, c.el.height);
        });

        // 2) Dessiner dans l'ordre
        this.bg.render();
        this.fg.render();
        this.actors.render(delta);
        this.ui.render();

        // 🔥 Messages flottants par-dessus l'UI
        if (this.floatingMessages) {
            this.floatingMessages.updateAndRender(this.uiCtx, this.camera);
        }

        // 3) Texte flottant (au-dessus de l'UI)
        if (this.floatingText) {
            const now = performance.now();
            const { text, worldX, worldY, color, startTime, duration } = this.floatingText;

            const elapsed = now - startTime;
            if (elapsed >= duration) {
                this.floatingText = null;
            } else {
                const fadeIn = 200;
                const fadeOut = 300;
                const visible = Math.max(0, duration - fadeIn - fadeOut);

                let alpha = 1;
                if (elapsed < fadeIn) {
                    alpha = elapsed / fadeIn;                // fade-in
                } else if (elapsed > fadeIn + visible) {
                    alpha = 1 - (elapsed - fadeIn - visible) / fadeOut; // fade-out
                }

                const screen = this.camera.worldToScreen(worldX, worldY);
                const tile = this.camera.tileSize;

                // juste au-dessus du vaisseau (centre + petit offset)
                const textX = screen.x;
                const textY = screen.y - tile * 0.5 - 4;

                const ctx = this.uiCtx;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = "18px Orbitron, sans-serif";
                ctx.fontWeight = 'bold';
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.lineWidth = 3;
                ctx.strokeStyle = "black";
                ctx.fillStyle = color;

                ctx.strokeText(text, textX, textY);
                ctx.fillText(text, textX, textY);
                ctx.restore();

                // on redemandera un redraw tant que l'anim n'est pas finie
                this.needsRedraw = true;
            }
        }

        this.needsRedraw = false;
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

    drawFloatingText(text, worldX, worldY, color = "rgba(0,255,180,0.95)", duration = 1200) {
        // On enregistre juste les infos ; le dessin se fait dans render()
        this.floatingText = {
            text: String(text),
            worldX,
            worldY,
            color,
            startTime: performance.now(),
            duration
        };
        this.requestRedraw();
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