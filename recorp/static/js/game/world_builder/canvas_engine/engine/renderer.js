// engine/renderer.js
// Pipeline de rendu. Instancie les renderers de chaque couche.
// fournit reloadMapData(newRaw) pour appliquer un sync serveur.

import BackgroundRenderer from "../renderers/background_renderer.js";
import ForegroundRenderer from "../renderers/foreground_renderer.js";
import ActorsRenderer from "../renderers/actors_renderer.js";
import UIRenderer from "../renderers/ui_renderer.js";
import FloatingMessageManager from "./floating_message_manager.js"
import SonarSystem from "../renderers/sonar_system.js";


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

        this.ui = new UIRenderer(canvases.ui.ctx, camera, spriteManager, map, {});
        this.uiCtx = canvases.ui.ctx;

        this.floatingCtx = canvases.floating.ctx;

        // Création du sonar système logique et visuel
        this.sonar = new SonarSystem({
            camera,
            map,
            ctx: canvases.ui.ctx,
            tileSize: camera.tileSize,
            playerId: window.current_player_id
        });
        // Partage avec acteurs (pour flip / highlight etc.)
        this.actors.sonar = this.sonar;
        // Transfert vers l'UI pour dessin (UIRenderer doit appeler sonar.render())
        this.ui.sonar = this.sonar;
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
        this.ui.render(delta);

        // Messages flottants par-dessus l'UI
        if (this.floatingMessages) {
            this.floatingCtx.clearRect(0, 0, this.floatingCtx.canvas.width, this.floatingCtx.canvas.height);
            this.floatingMessages.updateAndRender(this.floatingCtx, this.camera);
        }
        this.needsRedraw = false;
    }

    updateGridCoordinatesUI(camera, tileSize) {
        const contX = document.getElementById("ui-coordinates-x");
        const contY = document.getElementById("ui-coordinates-y");

        if (!contX || !contY) return;

        // ⚠️ tu as dit avoir déjà corrigé cette partie,
        // je garde donc ta logique d'origine (sans clear) telle quelle.

        // coordonnées X
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
        // coordonnées Y
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
            .then(() => {
                this.requestRedraw();

                // 🔥 APRES SYNC SERVEUR : mettre à jour les coords joueur (PC uniquement)
                const player = this.map.findPlayerById(window.current_player_id);
                if (player && window.updatePlayerCoords) {
                    window.updatePlayerCoords(player);
                }
            })
            .catch(e => console.error('reloadMapData prepare failed', e));
    }
}
