// ActionSceneManager (foundation) — UI-only, no gameplay.

class ActionSceneManager {
    constructor() {
        this._active = null; // { type, context, openedAt }
        this._rootEl = null; // container DOM
        // combat animation runtime
        this._combatAnim = null; // { engine, queue }
        this._combatCanvasPositions = null; // { left, right }
    }

    isActive(type = null) {
        if (!this._active) return false;
        if (!type) return true;
        return this._active.type === type;
    }

    getContext() {
        return this._active?.context || null;
    }

    getActive() {
        return this._active;
    }

    /**
     * Ouvre une ActionScene exclusive.
     * Pour l'instant: ne fait rien de visuel (on branchera le DOM à l'étape 4).
     */
    open(type, context = {}) {
        if (!type) return false;

        if (this._active) {
            this.close({ reason: "replaced" });
        }

        this._active = {
            type,
            context,
            openedAt: Date.now(),
        };

        if (type === "combat") {
            this._mountCombatScene(context);
        }

        this._bindMovementListener();

        window.dispatchEvent(new CustomEvent("actionscene:open", { detail: this._active }));
        return true;
    }

    /**
     * Ferme la scène active.
     * Pour l'instant: ne fait rien de visuel.
     */
    close(meta = {}) {
        if (!this._active) return false;

        if (this._rootEl) {
            this._rootEl.remove();
            this._rootEl = null;
        }

        const closed = { ...this._active, closedAt: Date.now(), meta };
        this._active = null;

        this._unbindMovementListener();

        window.dispatchEvent(new CustomEvent("actionscene:close", { detail: closed }));

        // cleanup combat anim si présent
        if (this._combatAnim) {
            this._combatAnim.queue?.dispose?.();
            this._combatAnim = null;
        }
        this._combatCanvasPositions = null;

        return true;
    }

    _mountCombatScene(context) {

        const engine = window.canvasEngine;
        if (!engine || !engine.map || !engine.renderer) return;

        const attacker = engine.map.findActorByKey(context.attackerKey);
        const target = engine.map.findActorByKey(context.targetKey);

        if (!attacker || !target) {
            console.warn("CombatScene: actor not found");
            this.close({ reason: "invalid_actor" });
            return;
        }

        // Utilisation du worker existant
        const worker = window.canvasEngine?.gameWorker;

        if (!worker || typeof worker.call !== "function") {
            console.warn("CombatScene: worker unavailable");
            distance.textContent = "Distance: ?";
            return;
        }

        // Backdrop
        const backdrop = document.createElement("div");
        backdrop.id = "combat-scene-backdrop";
        backdrop.classList.add(
            "fixed", "inset-0",
            "bg-black/40",
            "flex",
            "justify-center",
            "backdrop-blur-md", 
            "backdrop-brightness-50", 
            "animate-modal-fade",
            "z-[9999]", 
            "md:p-3",
            "right-0",
            "left-0",
            "z-50",
            "w-full",
            "h-screen",
            "md:inset-0",
        );

        // Container principal
        const container = document.createElement("div");
        container.id = "modal-combat";
        container.dataset.modalId = "modal-combat";
        container.classList.add(
            "flex","shadow","rounded-t-xl",
            "max-h-[70vh]",
            "w-[98%]",
            "md:w-[600px]",
            "lg:w-[680px]",
            "xl:w-[520px]",
            "bg-zinc-900",
            "border",
            "border-emerald-500/40",
            "rounded-xl",
            "shadow-2xl",
            "p-3",
            "flex",
            "flex-col",
            "gap-4",
            "h-screen"
        );

        // Header
        const header = document.createElement("div");
        header.classList.add("text-center", "text-xl", "font-bold", "text-emerald-400");
        header.textContent = "Combat en cours";

        // Distance placeholder
        const distance = document.createElement("div");
        distance.classList.add("text-center", "text-sm", "text-sky-300");

        worker.call("compute_distance", {
            from: {
                x: attacker.x,
                y: attacker.y,
                sizeX: attacker.sizeX,
                sizeY: attacker.sizeY
            },
            to: {
                x: target.x,
                y: target.y,
                sizeX: target.sizeX,
                sizeY: target.sizeY
            }
        }).then(dist => {
            distance.textContent = `Distance: ${dist}`;
        }).catch(err => {
            console.warn("CombatScene distance error:", err);
            distance.textContent = "Distance: ?";
        });

        const visualWrapper = document.createElement("div");
        visualWrapper.classList.add("relative", "w-full", "h-32", "overflow-hidden", "bg-[#020617]");

        // 🌌 Background spatial (CSS only)
        const stars1 = document.createElement("div");
        stars1.classList.add("stars-layer", "l1");

        const stars2 = document.createElement("div");
        stars2.classList.add("stars-layer", "l2");

        const stars3 = document.createElement("div");
        stars3.classList.add("stars-layer", "l3");

        visualWrapper.append(stars1, stars2, stars3);

        // 🚀 Ships canvas
        const shipsCanvas = document.createElement("canvas");
        shipsCanvas.id = "combat-ships";
        shipsCanvas.classList.add("absolute", "inset-0");

        // 💬 Overlay canvas
        const overlayCanvas = document.createElement("canvas");
        overlayCanvas.id = "combat-overlay";
        overlayCanvas.classList.add("absolute", "inset-0", "pointer-events-none");

        visualWrapper.append(shipsCanvas, overlayCanvas);

        // Stats
        const stats = document.createElement("div");
        stats.classList.add(
            "flex",
            "justify-between",
            "gap-8",
            "text-sm",
            "text-emerald-200"
        );

        stats.innerHTML = `
            <div id="combat-attacker-stats" class="flex-1">
                <div class="font-bold mb-2">Attacker</div>
                <div>HP: <span class="hp">--</span></div>
                <div>AP: <span class="ap">--</span></div>
                <div>Missile: <span class="shield-missile">--</span></div>
                <div>Thermal: <span class="shield-thermal">--</span></div>
                <div>Ballistic: <span class="shield-ballistic">--</span></div>
            </div>
            <div id="combat-target-stats" class="flex-1 text-right">
                <div class="font-bold mb-2">Target</div>
                <div>HP: <span class="hp">--</span></div>
                <div>AP: <span class="ap">--</span></div>
                <div>Missile: <span class="shield-missile">--</span></div>
                <div>Thermal: <span class="shield-thermal">--</span></div>
                <div>Ballistic: <span class="shield-ballistic">--</span></div>
            </div>
        `;

        // Log placeholder
        const log = document.createElement("div");
        log.classList.add(
            "h-[60px]",
            "overflow-y-auto",
            "border",
            "border-emerald-500/20",
            "rounded-lg",
            "p-2",
            "text-xs",
            "text-emerald-300"
        );
        log.textContent = "Combat log...";

        // Modules container
        const modulesContainer = document.createElement("div");
        modulesContainer.id = "combat-modules";
        modulesContainer.classList.add(
            "flex",
            "flex-wrap",
            "gap-3",
            "justify-center",
            "mt-4"
        );

        // Footer
        const footer = document.createElement("div");
        footer.classList.add("flex", "justify-end");

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Fermer";
        closeBtn.classList.add(
            "px-4",
            "py-2",
            "bg-red-600",
            "rounded",
            "text-white",
            "hover:bg-red-700"
        );

        closeBtn.addEventListener("click", () => {
            this.close({ reason: "manual" });

            // réouvrir modal cible
            if (typeof window.open_close_modal === "function") {
                open_close_modal(context.originalModalId);
            }
        });

        footer.append(closeBtn);

        container.append(header, distance, visualWrapper, stats, log, modulesContainer, footer);
        backdrop.append(container);
        document.body.append(backdrop);

        this._rootEl = backdrop;
        this._initStatsFromRuntime();
        this._buildCombatModules();
        this._initCombatCanvases(attacker, target);

        // init animation engine + queue
        if (overlayCanvas && this._combatCanvasPositions) {
            const engine = new CombatAnimationEngine({
                overlayCanvas,
                positions: this._combatCanvasPositions,
                durationMs: 350
            });
            const queue = new CombatAnimationQueue(engine);
            this._combatAnim = { engine, queue };
        }
    }

    _buildCombatModules() {

        if (!this.isActive("combat")) return;

        const context = this.getContext();
        if (!context) return;

        const container = document.getElementById("combat-modules");
        if (!container) return;

        container.innerHTML = "";

        const me = window.currentPlayer;
        if (!me?.ship?.modules) return;

        const weaponModules = me.ship.modules.filter(m => m.type === "WEAPONRY");

        if (!weaponModules.length) {
            container.textContent = "Aucun module d'attaque";
            return;
        }

        weaponModules.forEach(module => {

            const btn = document.createElement("button");
            btn.classList.add(
                "px-4",
                "py-2",
                "bg-emerald-600",
                "hover:bg-emerald-700",
                "rounded",
                "text-white",
                "text-sm"
            );
            const apCost = 1;
            btn.textContent = `${module.name} (AP:${apCost})`;

            btn.addEventListener("click", () => {

                window.ws?.send(JSON.stringify({
                    type: "action_attack",
                    payload: {
                        target_id: context.targetKey.split("_")[1],
                        module_id: module.id
                    }
                }));

            });

            container.append(btn);
        });
        window.refreshModalActionRanges?.("modal-combat");
    }

    _buildCombatModules() {

        if (!this.isActive("combat")) return;

        const context = this.getContext();
        if (!context) return;

        const container = document.getElementById("combat-modules");
        if (!container) return;

        container.innerHTML = "";

        const engine = window.canvasEngine;
        if (!engine?.map) return;

        const transmitterActor = engine.map.findActorByKey(context.attackerKey);
        const receiverActor = engine.map.findActorByKey(context.targetKey);

        if (!transmitterActor || !receiverActor) return;

        const modules = window.currentPlayer?.ship?.modules || [];

        const list = document.createElement("div");
        list.classList.add("flex", "flex-col", "gap-2");

        modules.forEach(m => {

            if (m.type !== "WEAPONRY") return;

            const wrapper = document.createElement("div");
            wrapper.classList.add(
                "flex", "flex-row", "justify-between",
                "items-center", "p-2", "rounded-lg",
                "border", "gap-4", "border-emerald-900"
            );

            // === LEFT DESCRIPTION ===
            const left = document.createElement("div");
            left.classList.add("w-full");
            left.innerHTML = window.createFormatedLabel
                ? window.createFormatedLabel(m)
                : m.name;

            // === ATTACK BUTTON ===
            const btnIcon = document.createElement("img");
            btnIcon.src = "/static/img/ux/target_icon.svg";
            btnIcon.classList.add("action-button-sf-icon");

            const btn = document.createElement("div");
            btn.classList.add("action-button-sf");

            btn.append(btnIcon);

            // AP = 1 (comme ton système actuel)
            window.decorateActionButtonWithRangeAndAp?.(btn, m, 1);

            // === ASYNC RANGE CHECK ===
            window.computeModuleRange?.({
                module: m,
                transmitterActor,
                receiverActor
            }).then(rangeResult => {

                if (rangeResult.reason === "ok" && !rangeResult.allowed) {
                    btn.classList.add(
                        "opacity-40",
                        "pointer-events-none",
                        "cursor-not-allowed"
                    );
                    wrapper.classList.add("opacity-40");
                }
            });

            // === CLICK HANDLER ===
            btn.addEventListener("click", () => {

                if (btn.classList.contains("pointer-events-none")) return;

                window.canvasEngine?.ws?.send({
                    type: "action_attack",
                    payload: {
                        player: window.currentPlayer.user.player,
                        subtype: `attack-${m.id}`,
                        module_id: m.id,
                        target_key: context.targetKey
                    }
                });
            });

            wrapper.dataset.actionKey = "attack";
            wrapper.dataset.moduleId = m.id;
            wrapper.dataset.moduleType = "WEAPONRY";

            btn.dataset.moduleId = String(m.id);

            wrapper.append(left, btn);
            list.append(wrapper);
        });

        container.append(list);
    }



    _initStatsFromRuntime() {

        if (!this.isActive("combat")) return;

        const context = this.getContext();
        if (!context) return;

        const attackerContainer = document.getElementById("combat-attacker-stats");
        const targetContainer = document.getElementById("combat-target-stats");

        // ===== Attacker =====
        const me = window.currentPlayer;

        if (me && attackerContainer) {

            attackerContainer.querySelector(".hp").textContent =
                me.ship?.current_hp ?? "--";

            attackerContainer.querySelector(".ap").textContent =
                me.user?.current_ap ?? "--";

            attackerContainer.querySelector(".shield-missile").textContent =
                me.ship?.current_missile_defense ?? "--";

            attackerContainer.querySelector(".shield-thermal").textContent =
                me.ship?.current_thermal_defense ?? "--";

            attackerContainer.querySelector(".shield-ballistic").textContent =
                me.ship?.current_ballistic_defense ?? "--";
        }

        // ===== Target =====
        const scanned = window.scannedModalData?.[context.targetKey];

        if (!scanned || !targetContainer) return;

        // HP
        targetContainer.querySelector(".hp").textContent =
            scanned.ship?.current_hp ?? "--";

        // AP (only if PC)
        targetContainer.querySelector(".ap").textContent =
            scanned.user?.current_ap ?? "--";

        // Shields
        targetContainer.querySelector(".shield-missile").textContent =
            scanned.ship?.current_missile_defense ?? "--";

        targetContainer.querySelector(".shield-thermal").textContent =
            scanned.ship?.current_thermal_defense ?? "--";

        targetContainer.querySelector(".shield-ballistic").textContent =
            scanned.ship?.current_ballistic_defense ?? "--";
    }


    _handleEntityUpdate(msg) {
        if (!this.isActive("combat")) return;

        const context = this.getContext();
        if (!context) return;

        const { entity_key, change_type, changes } = msg;

        if (
            entity_key !== context.attackerKey &&
            entity_key !== context.targetKey
        ) {
            return;
        }

        switch (change_type) {

            case "hp_update":
                this._updateCombatHp(entity_key, changes);
                break;

            case "ap_update":
                this._updateCombatAp(entity_key, changes);
                break;
        }
    }

    _updateCombatHp(entityKey, changes) {

        const container =
            entityKey === this._active.context.attackerKey
                ? document.getElementById("combat-attacker-stats")
                : document.getElementById("combat-target-stats");

        if (!container) return;

        // HULL
        if (changes.hp?.current != null) {
            const hpSpan = container.querySelector(".hp");
            if (hpSpan) hpSpan.textContent = changes.hp.current;
        }

        // SHIELD par type
        if (changes.shield?.current != null && changes.shield?.damage_type) {

            const type = changes.shield.damage_type;

            const shieldSpan = container.querySelector(
                `.shield-${type.toLowerCase()}`
            );

            if (shieldSpan) {
                shieldSpan.textContent = changes.shield.current;
            }
        }
    }

    _updateCombatAp(entityKey, changes) {

        const container =
            entityKey === this._active.context.attackerKey
                ? document.getElementById("combat-attacker-stats")
                : document.getElementById("combat-target-stats");

        if (!container) return;

        if (changes.ap?.current != null) {
            const apSpan = container.querySelector(".ap");
            if (apSpan) apSpan.textContent = changes.ap.current;
        }
    }

    _bindMovementListener() {
        this._movementHandler = (e) => {
            if (!this.isActive("combat")) return;

            const context = this.getContext();
            if (!context) return;

            const movedKey = e.detail?.actorKey;
            if (!movedKey) return;

            if (movedKey === context.attackerKey || movedKey === context.targetKey) {
                this._recomputeDistance();
            }
        };

        window.addEventListener("actor:moved", this._movementHandler);
    }

    _unbindMovementListener() {
        if (this._movementHandler) {
            window.removeEventListener("actor:moved", this._movementHandler);
            this._movementHandler = null;
        }
    }

    _initCombatCanvases(attacker, target) {

        const shipsCanvas = document.getElementById("combat-ships");
        const overlayCanvas = document.getElementById("combat-overlay");
        if (!shipsCanvas || !overlayCanvas) return;

        const wrapper = shipsCanvas.parentElement;
        const rect = wrapper.getBoundingClientRect();

        if (!rect.width || !rect.height) return;

        shipsCanvas.width = rect.width;
        shipsCanvas.height = rect.height;

        overlayCanvas.width = rect.width;
        overlayCanvas.height = rect.height;

        const ctx = shipsCanvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, shipsCanvas.width, shipsCanvas.height);

        const tile = 32;

        const attackerW = attacker.sizeX * tile;
        const attackerH = attacker.sizeY * tile;

        const targetW = target.sizeX * tile;
        const targetH = target.sizeY * tile;

        const centerY = shipsCanvas.height / 2;

        const attackerX = 40;
        const attackerY = centerY - attackerH / 2;

        const targetX = shipsCanvas.width - targetW - 40;
        const targetY = centerY - targetH / 2;

        // positions centres pour projectiles
        this._combatCanvasPositions = {
            left:  { x: attackerX + attackerW / 2, y: attackerY + attackerH / 2 },
            right: { x: targetX + targetW / 2,   y: targetY + targetH / 2 }
        };

        const attackerImg = new Image();
        attackerImg.src = `/static/img/${attacker.spritePath}`;

        const targetImg = new Image();
        targetImg.src = `/static/img/${target.spritePath}`;

        attackerImg.onload = () => {
            ctx.drawImage(attackerImg, attackerX, attackerY, attackerW, attackerH);
        };

        targetImg.onload = () => {

            ctx.save();

            // Flip horizontal
            ctx.scale(-1, 1);

            ctx.drawImage(
                targetImg,
                -targetX - targetW,  // important
                targetY,
                targetW,
                targetH
            );

            ctx.restore();
        };
    }

    _recomputeDistance(movedKey = null) {
        if (!this.isActive("combat")) return;

        const context = this.getContext();
        if (!context) return;

        // Si un movedKey est fourni, on vérifie s'il nous concerne
        if (movedKey &&
            movedKey !== context.attackerKey &&
            movedKey !== context.targetKey) {
            return;
        }

        const engine = window.canvasEngine;
        if (!engine || !engine.map) return;

        const attacker = engine.map.findActorByKey(context.attackerKey);
        const target = engine.map.findActorByKey(context.targetKey);

        if (!attacker || !target) return;

        const worker = window.canvasEngine?.gameWorker;
        if (!worker) return;

        worker.call("compute_distance", {
            from: {
                x: attacker.x,
                y: attacker.y,
                sizeX: attacker.sizeX,
                sizeY: attacker.sizeY
            },
            to: {
                x: target.x,
                y: target.y,
                sizeX: target.sizeX,
                sizeY: target.sizeY
            }
        }).then(dist => {

            const distanceNode =
                document.querySelector("#modal-combat .text-sky-300");

            if (distanceNode) {
                distanceNode.textContent = `Distance: ${dist}`;
            }

            // recalcul range après mouvement
            window.refreshModalActionRanges?.("modal-combat");

        });
    }
}


// ===============================
// Combat animations (overlay)
// ===============================

class CombatAnimationEngine {
    constructor({ overlayCanvas, positions, durationMs = 350 }) {
        this.canvas = overlayCanvas;
        this.ctx = overlayCanvas?.getContext?.("2d") || null;
        this.positions = positions || null;
        this.durationMs = durationMs;

        this._rafId = null;
        this._running = false;
        this._imgCache = new Map();
    }

    clear() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    dispose() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
        this._running = false;
        this.clear();
        this._imgCache.clear();
    }

    async _loadImage(src) {
        if (!src) return null;
        if (this._imgCache.has(src)) return this._imgCache.get(src);

        const img = new Image();
        const p = new Promise((resolve) => {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });
        img.src = src;

        const loaded = await p;
        this._imgCache.set(src, loaded);
        return loaded;
    }

    _drawRotatedImage(img, x, y, angleRad, desiredPx = 24) {
        if (!this.ctx || !img) return;

        const w0 = img.naturalWidth || img.width || desiredPx;
        const h0 = img.naturalHeight || img.height || desiredPx;

        // scale "soft" → évite projectiles énormes si le png est grand
        const scale = desiredPx / Math.max(w0, h0);
        const w = w0 * scale;
        const h = h0 * scale;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angleRad);
        this.ctx.drawImage(img, -w / 2, -h / 2, w, h);
        this.ctx.restore();
    }

    /**
     * data:
     * { weaponType, fromSide, toSide, result }
     */
    async playProjectile(data) {
        if (!this.ctx || !this.canvas || !this.positions) return;

        const { weaponType, fromSide, toSide } = data || {};
        const from = this.positions?.[fromSide];
        const to = this.positions?.[toSide];

        if (!from || !to) return;

        const weapon = String(weaponType || "").toLowerCase() || "thermal";
        const imgSrc = `/static/img/ux/projectiles/${weapon}/red.png`;
        const img = await this._loadImage(imgSrc);

        // Même si l'image manque → on ne bloque pas la queue
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        // sécurité: si une anim est déjà en cours (normalement queue empêche),
        // on la stoppe proprement
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;

        this._running = true;

        const start = performance.now();
        const duration = this.durationMs;

        return new Promise((resolve) => {
            const step = (now) => {
                if (!this._running) {
                    this.clear();
                    return resolve();
                }

                const t = Math.min((now - start) / duration, 1);

                const x = from.x + dx * t;
                const y = from.y + dy * t;

                // ✅ nettoyage frame-by-frame
                this.clear();

                if (img) {
                    this._drawRotatedImage(img, x, y, angle, 24);
                }

                if (t < 1) {
                    this._rafId = requestAnimationFrame(step);
                } else {
                    // ✅ nettoyage final
                    this.clear();
                    this._rafId = null;
                    this._running = false;
                    resolve();
                }
            };

            this._rafId = requestAnimationFrame(step);
        });
    }
}

class CombatAnimationQueue {
    constructor(engine) {
        this.engine = engine;
        this.queue = [];
        this.running = false;
        this._disposed = false;
    }

    dispose() {
        this._disposed = true;
        this.queue.length = 0;
        this.running = false;
        this.engine?.dispose?.();
    }

    async enqueue(animData) {
        if (this._disposed) return;
        this.queue.push(animData);
        if (this.running) return;

        this.running = true;
        while (!this._disposed && this.queue.length > 0) {
            const next = this.queue.shift();
            try {
                await this.engine.playProjectile(next);
            } catch (e) {
                // on ne bloque jamais la queue
                this.engine?.clear?.();
            }
        }
        this.running = false;
    }
}


// Singleton
export const actionSceneManager = new ActionSceneManager();

// Compat globale (important car une partie de ton code est encore "non-module")
window.ActionSceneManager = actionSceneManager;

// ===============================
// Global hook called by combat_handlers.js
// ===============================
window.playCombatAnimation = function (payload) {
    const mgr = window.ActionSceneManager;
    if (!mgr || !mgr.isActive?.("combat")) return;

    const ctx = mgr.getContext?.();
    if (!ctx) return;

    const q = mgr._combatAnim?.queue;
    const pos = mgr._combatCanvasPositions;
    if (!q || !pos) return;

    // payload vient de combat_handlers.js :contentReference[oaicite:5]{index=5}
    // payload.type: "HIT" | "MISS" | "EVADE"
    const sourceKey = payload?.source;
    const targetKey = payload?.target;

    if (!sourceKey || !targetKey) return;

    // mapping left/right basé sur attacker/target context (modal simpliste)
    const isCounter = payload?.is_counter === true;

    let fromSide;
    let toSide;

    if (isCounter) {
        fromSide = "right";
        toSide = "left";
    } else {
        fromSide = "left";
        toSide = "right";
    }

    const weaponType = payload?.damage_type || payload?.weaponType || "thermal";
    const result = (payload?.type === "MISS" || payload?.type === "EVADE") ? "miss" : "hit";

    q.enqueue({
        kind: "projectile",
        weaponType,
        fromSide,
        toSide,
        result
    });
};
