// engine/renderer.js
// Pipeline de rendu. Instancie les renderers de chaque couche.
// fournit reloadMapData(newRaw) pour appliquer un sync serveur.

import BackgroundRenderer from "../renderers/background_renderer.js";
import ForegroundRenderer from "../renderers/foreground_renderer.js";
import ActorsRenderer from "../renderers/actors_renderer.js";
import UIRenderer from "../renderers/ui_renderer.js";
import FloatingMessageManager from "./floating_message_manager.js";
import WorldCombatEffectsManager from "./world_combat_effects_manager.js";
import SonarSystem from "../renderers/sonar_system.js";

export default class Renderer {
    constructor({ canvases, camera, spriteManager, map }) {
        this.canvases = canvases;
        this.camera = camera;
        this.spriteManager = spriteManager;
        this.map = map;
        this.needsRedraw = true;
        this._lastViewportSignature = null;

        this.bg = new BackgroundRenderer(canvases.bg.ctx, camera, spriteManager, map);
        this.fg = new ForegroundRenderer(canvases.fg.ctx, camera, spriteManager, map);
        this.actors = new ActorsRenderer(canvases.actors.ctx, camera, spriteManager, map);

        this.ui = new UIRenderer(canvases.ui.ctx, camera, spriteManager, map, {});
        this.uiCtx = canvases.ui.ctx;

        this.floatingCtx = canvases.floating.ctx;

        this.sonar = new SonarSystem({
            camera,
            map,
            ctx: canvases.ui.ctx,
            tileSize: camera.tileSize,
            playerId: window.current_player_id
        });
        this.actors.sonar = this.sonar;
        this.ui.sonar = this.sonar;

        this.floatingText = null;
        this.floatingMessages = new FloatingMessageManager();
        this.worldCombatEffects = new WorldCombatEffectsManager();
    }

    requestRedraw() {
        this.needsRedraw = true;
    }

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

    addWorldCombatProjectile(opts) {
        if (!this.worldCombatEffects) return;
        this.worldCombatEffects.addProjectile(opts);
        this.requestRedraw();
    }

    _getViewportSignature() {
        return [
            this.camera.worldX,
            this.camera.worldY,
            this.camera.visibleTilesX,
            this.camera.visibleTilesY,
            this.camera.zoom,
            this.canvases.bg.el.width,
            this.canvases.bg.el.height
        ].join("|");
    }

    _computeRenderPlan() {
        const viewportSignature = this._getViewportSignature();
        const viewportChanged = viewportSignature !== this._lastViewportSignature;
        const fullSceneDirty = this.needsRedraw || viewportChanged;
        const foregroundAnimated = this.fg?.hasActiveAnimations?.() === true;
        const actorAnimated = this.actors?.hasActiveAnimations?.() === true;
        const uiAnimated = this.ui?.hasActiveAnimations?.() === true;
        const floatingActive =
            this.floatingMessages?.hasActiveMessages?.() === true ||
            this.worldCombatEffects?.hasActiveEffects?.() === true;

        const plan = {
            viewportSignature,
            viewportChanged,
            fullSceneDirty,
            bg: fullSceneDirty,
            fg: fullSceneDirty || foregroundAnimated,
            actors: fullSceneDirty || actorAnimated,
            ui: fullSceneDirty || uiAnimated,
            floating: fullSceneDirty || floatingActive,
        };

        plan.shouldRender = plan.bg || plan.fg || plan.actors || plan.ui || plan.floating;
        return plan;
    }

    shouldRender() {
        return this._computeRenderPlan().shouldRender;
    }

    _clearLayer(layer) {
        layer.ctx.clearRect(0, 0, layer.el.width, layer.el.height);
    }

    render(delta) {
        const plan = this._computeRenderPlan();
        if (!plan.shouldRender) return;

        if (plan.viewportChanged) {
            this.updateGridCoordinatesUI(this.camera, this.camera.tileSize);
        }

        if (plan.bg) {
            this._clearLayer(this.canvases.bg);
            this.bg.render(delta);
        }

        if (plan.fg) {
            this._clearLayer(this.canvases.fg);
            this.fg.render(delta);
        }

        if (plan.actors) {
            this._clearLayer(this.canvases.actors);
            this.actors.render(delta);
        }

        if (plan.ui) {
            this._clearLayer(this.canvases.ui);
            this.ui.render(delta);
        }

        if (plan.floating) {
            this.floatingCtx.clearRect(0, 0, this.floatingCtx.canvas.width, this.floatingCtx.canvas.height);
            this.floatingMessages?.updateAndRender?.(this.floatingCtx, this.camera);
            this.worldCombatEffects?.updateAndRender?.(this.floatingCtx, this.camera, this.map);
        }

        this._lastViewportSignature = plan.viewportSignature;
        this.needsRedraw = false;
    }

    updateGridCoordinatesUI(camera, tileSize) {
        const contX = document.getElementById("ui-coordinates-x");
        const contY = document.getElementById("ui-coordinates-y");

        if (!contX || !contY) return;

        contX.textContent = "";
        contY.textContent = "";

        const xFragment = document.createDocumentFragment();
        const yFragment = document.createDocumentFragment();

        for (let i = 0; i < camera.visibleTilesX; i++) {
            const worldX = camera.worldX + i;
            const div = document.createElement("div");
            div.className =
                "flex items-center justify-center text-emerald-300 font-orbitron font-semibold " +
                "border border-emerald-400/20 bg-zinc-800/50 " +
                "w-[32px] h-[32px] md:p-1 text-xs tracking-wider shadow-sm " +
                "hover:bg-emerald-500/10 transition-all duration-200";
            div.innerText = worldX;
            xFragment.appendChild(div);
        }

        for (let i = 0; i < camera.visibleTilesY; i++) {
            const worldY = camera.worldY + i;
            const div = document.createElement("div");
            div.className =
                "flex items-center justify-center text-emerald-300 font-orbitron font-semibold " +
                "border border-emerald-400/20 bg-zinc-800/50 " +
                "w-[32px] h-[32px] md:p-1 text-xs tracking-wider shadow-sm " +
                "hover:bg-emerald-500/10 transition-all duration-200";
            div.innerText = worldY;
            yFragment.appendChild(div);
        }

        contX.appendChild(xFragment);
        contY.appendChild(yFragment);
    }

    clearUILayer() {
        const ui = this.canvases.ui;
        if (!ui) return;
        ui.ctx.clearRect(0, 0, ui.el.width, ui.el.height);
    }

    drawFloatingText(text, worldX, worldY, color = "rgba(0,255,180,0.95)", duration = 1200) {
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
        if (!img) return;

        const isShip = obj.type === "player" || obj.type === "npc";
        const reversed = isShip && obj.data?.ship?.is_reversed;

        if (!reversed) {
            ctx.drawImage(img, screenX, screenY, screenW, screenH);
            return;
        }

        ctx.save();
        ctx.translate(screenX + screenW, screenY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, screenW, screenH);
        ctx.restore();
    }

    reloadMapData(newRaw) {
        this.map.raw = newRaw;
        this.map.prepare()
            .then(() => {
                this.requestRedraw();

                const player = this.map.findPlayerById(window.current_player_id);
                if (player && window.updatePlayerCoords) {
                    window.updatePlayerCoords(player);
                }
            })
            .catch((e) => console.error("reloadMapData prepare failed", e));
    }
}