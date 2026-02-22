// ActionSceneManager (foundation) — UI-only, no gameplay.

class ActionSceneManager {
    constructor() {
        this._active = null; // { type, context, openedAt }
        this._rootEl = null; // container DOM
        // combat animation runtime
        this._combatAnim = null; // { engine, queue }
        this._combatCanvasPositions = null; // { left, right }
        this._combatDistanceNode = null;
        this._mountNode = null; // si défini, la scène est rendue dans ce node (body du modal)
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

    _isTargetScannedNow() {
        const ctx = this.getContext?.();
        if (!ctx) return false;
        return window.isScanned?.(ctx.targetKey) === true;
    }

    _setTargetHiddenUI() {
        const targetContainer = document.getElementById("combat-target-stats");
        if (!targetContainer) return;

        targetContainer.querySelector(".hp").textContent = "???";
        targetContainer.querySelector(".ap").textContent = "???";
        targetContainer.querySelector(".shield-missile").textContent = "???";
        targetContainer.querySelector(".shield-thermal").textContent = "???";
        targetContainer.querySelector(".shield-ballistic").textContent = "???";
    }

    _getTargetSnapshotFromModalCache() {
        const ctx = this.getContext?.();
        if (!ctx) return null;

        const modalId = ctx.originalModalId; // le modal "de base" de la cible
        const cached = window.modalDataCache?.[modalId];
        if (!cached?.data) return null;

        // cached.data = responseData.target (structure pc/npc complète)
        // on récupère les champs utiles de snapshot :
        const d = cached.data;

        // PC:
        const ship = d?.ship;
        const user = d?.user;

        // NPC:
        const npcShip = d?.ship;
        const npcObj = d?.npc;

        return {
            hp: ship?.current_hp ?? npcShip?.current_hp,
            ap: user?.current_ap ?? null,
            shields: {
                MISSILE: ship?.current_missile_defense ?? npcShip?.current_missile_defense,
                THERMAL: ship?.current_thermal_defense ?? npcShip?.current_thermal_defense,
                BALLISTIC: ship?.current_ballistic_defense ?? npcShip?.current_ballistic_defense,
            }
        };
    }

    _bindScanListener() {
        if (this._scanExpiredHandler) return;

        this._scanExpiredHandler = (e) => {
            if (!this.isActive("combat")) return;

            const ctx = this.getContext?.();
            if (!ctx) return;

            const expiredKey = e.detail?.targetKey;
            if (!expiredKey) return;

            // si la cible du combat perd le scan => on masque immédiatement
            if (expiredKey === ctx.targetKey) {
                this._setTargetHiddenUI();
            }
        };

        window.addEventListener("scan:expired", this._scanExpiredHandler);
    }

    _unbindScanListener() {
        if (!this._scanExpiredHandler) return;
        window.removeEventListener("scan:expired", this._scanExpiredHandler);
        this._scanExpiredHandler = null;
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

        this._mountNode = context.mountNode || null;
        this._context = context || {};

        if (type === "combat") {
            this._mountCombatScene(context);

            this._onScanExpired = (ev) => {

                const k = ev?.detail?.targetKey;
                if (!k) return;

                // si le scan expiré concerne la cible courante
                // alors on change les stats adverse en "???"
                if (k === this._context?.targetKey) {
                    this._setTargetHiddenUI();
                }
            };

            this._bindScanListener();

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
        this._unbindScanListener();

        window.dispatchEvent(new CustomEvent("actionscene:close", { detail: closed }));

        this._onScanExpired = null;

        // cleanup combat anim si présent
        if (this._combatAnim) {
            this._combatAnim.queue?.dispose?.();
            this._combatAnim = null;
        }
        this._combatCanvasPositions = null;
        this._combatDistanceNode = null;
        this._context = null;

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

        const mountNode = context.mountNode || this._mountNode || null;

        // Utilisation du worker existant
        const worker = window.canvasEngine?.gameWorker;

        if (!worker || typeof worker.call !== "function") {
            console.warn("CombatScene: worker unavailable");
            distance.textContent = "Distance: ?";
            return;
        }

        // Backdrop (uniquement si pas de mountNode)
        let backdrop = null;
        if (!mountNode) {
            backdrop = document.createElement("div");
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
        }

        // Container principal
        const container = document.createElement("div");
        container.id = mountNode ? `${context.originalModalId}-combat-scene` : "modal-combat";
        container.dataset.modalId = "modal-combat";

        if (mountNode) {
            // mode "renderer" : on ne remet pas de bg/border, car le modal de base fournit le skin
            container.classList.add(
                "w-full",
                "h-full",
                "flex",
                "flex-col",
                "gap-1",
                "p-2"
            );
        } else {
            // mode "overlay" : comportement actuel
            container.classList.add(
                "flex","shadow","rounded-t-xl",
                "h-full",
                "md:h-[70vh]",
                "w-full",
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
        }

        // Header
        const header = document.createElement("div");
        header.classList.add("text-center", "text-xl", "font-bold", "text-emerald-400");
        header.textContent = "Combat en cours";

        // Distance placeholder
        const distance = document.createElement("div");
        distance.classList.add("text-center", "text-sm", "text-sky-300");
        this._combatDistanceNode = distance;

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
        visualWrapper.classList.add("relative", "w-full", "h-40", "overflow-hidden", "bg-[#020617]");

        // Background spatial (CSS only)
        const stars1 = document.createElement("div");
        stars1.classList.add("stars-layer", "l1");

        const stars2 = document.createElement("div");
        stars2.classList.add("stars-layer", "l2");

        const stars3 = document.createElement("div");
        stars3.classList.add("stars-layer", "l3");

        visualWrapper.append(stars1, stars2, stars3);

        // Ships container
        const shipsLayer = document.createElement("div");
        shipsLayer.classList.add("absolute", "inset-0", "flex", "items-center", "justify-between", "px-10");
        shipsLayer.id = "combat-ships-layer";

        // Attacker
        const attackerImg = document.createElement("img");
        attackerImg.id = "combat-ship-left";
        attackerImg.classList.add("transition-transform", "duration-300");
        shipsLayer.append(attackerImg);

        // Target (flip horizontal)
        const targetImg = document.createElement("img");
        targetImg.id = "combat-ship-right";
        targetImg.classList.add("transition-transform", "duration-300", "scale-x-[-1]");
        shipsLayer.append(targetImg);

        // Overlay canvas
        const overlayCanvas = document.createElement("canvas");
        overlayCanvas.id = "combat-overlay";
        overlayCanvas.classList.add("absolute", "inset-0", "pointer-events-none");

        visualWrapper.append(shipsLayer, overlayCanvas);

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
            "gap-1",
            "justify-center",
            "mt-2",
            "overflow-y-scroll",
            "h-[24vh]"
        );

        // Footer
        const footer = document.createElement("div");
        footer.classList.add("flex", "justify-end");

        container.append(header, distance, visualWrapper, stats, log, modulesContainer, footer);

        // Montage DOM
        if (mountNode) {
            mountNode.innerHTML = "";
            mountNode.appendChild(container);
            this._rootEl = container; // close() retire juste le container (parfait)
        } else {
            backdrop.append(container);
            document.body.append(backdrop);
            this._rootEl = backdrop;
        }
        
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
                this._applyCooldown(btn, 1000);
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
        const targetContainer   = document.getElementById("combat-target-stats");
        if (!attackerContainer || !targetContainer) return;

        const engine = window.canvasEngine;
        if (!engine?.map) return;

        const attackerActor = engine.map.findActorByKey(context.attackerKey);
        const targetActor   = engine.map.findActorByKey(context.targetKey);

        const attackerRt = attackerActor?.runtime;
        const targetRt   = targetActor?.runtime;

        const isTargetScanned = window.isScanned?.(context.targetKey) === true;

        // ======================================================
        // 🟢 JOUEUR LOCAL (toujours visible)
        // ======================================================

        attackerContainer.querySelector(".hp").textContent =
            attackerRt?.current_hp ??
            window.currentPlayer?.ship?.current_hp ?? "0";

        attackerContainer.querySelector(".ap").textContent =
            attackerRt?.current_ap ??
            window.currentPlayer?.user?.current_ap ?? "0";

        attackerContainer.querySelector(".shield-missile").textContent =
            window.currentPlayer?.ship?.current_missile_defense ?? "0";

        attackerContainer.querySelector(".shield-thermal").textContent =
            window.currentPlayer?.ship?.current_thermal_defense ?? "0";

        attackerContainer.querySelector(".shield-ballistic").textContent =
            window.currentPlayer?.ship?.current_ballistic_defense ?? "0";

        // ======================================================
        // 🔴 CIBLE (visible uniquement si scannée)
        // ======================================================

        if (isTargetScanned) {
            const snap = this._getTargetSnapshotFromModalCache();

            targetContainer.querySelector(".hp").textContent =
                targetRt?.current_hp ?? snap?.hp ?? "--";

            targetContainer.querySelector(".ap").textContent =
                targetRt?.current_ap ?? snap?.ap ?? "--";

            targetContainer.querySelector(".shield-missile").textContent =
                targetRt?.shields?.MISSILE ?? snap?.shields?.MISSILE ?? "--";

            targetContainer.querySelector(".shield-thermal").textContent =
                targetRt?.shields?.THERMAL ?? snap?.shields?.THERMAL ?? "--";

            targetContainer.querySelector(".shield-ballistic").textContent =
                targetRt?.shields?.BALLISTIC ?? snap?.shields?.BALLISTIC ?? "--";

        } else {
            this._setTargetHiddenUI();
        }
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

            case "mp_update":
                this._recomputeDistance(entity_key);
                break;
        }
    }

    _updateCombatHp(entityKey, changes) {

        const ctx = this.getContext?.();
        if (!ctx) return;

        const isTarget = entityKey === ctx.targetKey;
        if (isTarget && !this._isTargetScannedNow()) {
            // Si la cible n'est pas scannée, on ne révèle rien.
            this._setTargetHiddenUI();
            return;
        }

        const container =
            entityKey === this._active.context.attackerKey
                ? document.getElementById("combat-attacker-stats")
                : document.getElementById("combat-target-stats");

        if (!container) return;

        if (changes.hp?.current != null) {
            const hpSpan = container.querySelector(".hp");
            if (hpSpan) hpSpan.textContent = changes.hp.current;
        }

        if (changes.shields) {
            const shields = changes.shields;

            if (shields.MISSILE != null)
                container.querySelector(".shield-missile").textContent = shields.MISSILE;

            if (shields.THERMAL != null)
                container.querySelector(".shield-thermal").textContent = shields.THERMAL;

            if (shields.BALLISTIC != null)
                container.querySelector(".shield-ballistic").textContent = shields.BALLISTIC;
        }
    }

    _updateCombatAp(entityKey, changes) {

        const ctx = this.getContext?.();
        if (!ctx) return;

        const isTarget = entityKey === ctx.targetKey;
        if (isTarget && !this._isTargetScannedNow()) {
            // Si la cible n'est pas scannée, on ne révèle rien.
            this._setTargetHiddenUI();
            return;
        }

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

    _applyCooldown(btn, duration = 1000) {

        btn.classList.add("opacity-40", "pointer-events-none");

        const overlay = document.createElement("div");
        overlay.classList.add(
            "absolute",
            "inset-0",
            "bg-black/60",
            "rounded-lg",
        );

        btn.style.position = "relative";
        btn.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
            btn.classList.remove("opacity-40", "pointer-events-none");
        }, duration);
    }

    _bindMovementListener() {
        if (this._movementHandler) return;

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

        const DEFAULT_PIVOT_X = 0.5;
        const DEFAULT_PIVOT_Y = 0.3;

        const shipsLayer = document.getElementById("combat-ships-layer");
        const overlayCanvas = document.getElementById("combat-overlay");
        if (!shipsLayer || !overlayCanvas) return;

        const wrapper = shipsLayer.parentElement;
        const rect = wrapper.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        overlayCanvas.width = rect.width;
        overlayCanvas.height = rect.height;

        const dpr = window.devicePixelRatio || 1;

        overlayCanvas.width = rect.width * dpr;
        overlayCanvas.height = rect.height * dpr;

        overlayCanvas.style.width = rect.width + "px";
        overlayCanvas.style.height = rect.height + "px";

        const ctx = overlayCanvas.getContext("2d");
        ctx.scale(dpr, dpr);

        const leftEl = document.getElementById("combat-ship-left");
        const rightEl = document.getElementById("combat-ship-right");
        if (!leftEl || !rightEl) return;

        // chemins images
        leftEl.src = `/static/img/${attacker.spritePath}`;
        rightEl.src = `/static/img/${target.spritePath}`;

        // tailles sprites
        const tile = 32;

        const attackerW = attacker.sizeX * tile;
        const attackerH = attacker.sizeY * tile;

        const targetW = target.sizeX * tile;
        const targetH = target.sizeY * tile;

        leftEl.style.width = `${attackerW}px`;
        leftEl.style.height = `${attackerH}px`;

        rightEl.style.width = `${targetW}px`;
        rightEl.style.height = `${targetH}px`;

        leftEl.style.setProperty('--flip', '1');
        rightEl.style.setProperty('--flip', '-1');

        // calcul centres pour projectiles
        const wrapperRect = wrapper.getBoundingClientRect();
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();  

        this._combatCanvasPositions = {
            left: {
                x: leftRect.left - wrapperRect.left + leftRect.width * DEFAULT_PIVOT_X,
                y: leftRect.top - wrapperRect.top + leftRect.height * DEFAULT_PIVOT_Y
            },
            right: {
                x: rightRect.left - wrapperRect.left + rightRect.width * DEFAULT_PIVOT_X,
                y: rightRect.top - wrapperRect.top + rightRect.height * DEFAULT_PIVOT_Y
            }
        };

        // tailles pour shield impact
        this._combatSpriteSizes = {
            left:  { w: attackerW, h: attackerH },
            right: { w: targetW,   h: targetH }
        };

        this._combatActors = { attacker, target };
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

        const distancePromise = window.computeActorsDistance?.({
            transmitterActor: attacker,
            receiverActor: target
        });
        if (!distancePromise || typeof distancePromise.then !== "function") return;

        distancePromise.then(dist => {
            if (dist == null) return;

            const distanceNode =
                (this._combatDistanceNode && this._combatDistanceNode.isConnected)
                    ? this._combatDistanceNode
                    : document.querySelector("#modal-combat .text-sky-300");

            if (distanceNode) {
                distanceNode.textContent = `Distance: ${dist}`;
            }

            // recalcul range après mouvement
            window.refreshModalActionRanges?.("modal-combat");

        }).catch(err => {
            console.warn("CombatScene distance error:", err);
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

    playShieldImpact({ side, damageType }) {

        if (!this.ctx || !this.canvas || !this.positions) return;

        const pos = this.positions[side];
        if (!pos) return;

        const sizeMap = window.ActionSceneManager?._combatSpriteSizes;
        if (!sizeMap) return;

        const spriteSize = sizeMap[side];
        if (!spriteSize) return;

        const baseRadius = Math.max(spriteSize.w, spriteSize.h) * 0.6;

        const COLORS = {
            MISSILE:   "#22c55e",
            THERMAL:   "#ef4444",
            BALLISTIC: "#3b82f6"
        };

        const color = COLORS[damageType?.toUpperCase()] || "#ffffff";

        const duration = 900;
        const start = performance.now();

        const animate = (now) => {

            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);

            // Fade plus doux
            const alpha = 1 - (progress * 0.8);

            // Pulse léger (agrandissement progressif)
            const radius = baseRadius * (1 + progress * 0.15);

            this.clear();

            this.ctx.save();
            this.ctx.globalAlpha = alpha;

            // Glow plus intense
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 30;

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 5;

            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.restore();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.clear();
            }
        };

        requestAnimationFrame(animate);
    }

    playDodge({ side }) {

        const el = side === "left"
            ? document.getElementById("combat-ship-left")
            : document.getElementById("combat-ship-right");

        if (!el) return;

        el.classList.add("animate-dodge");

        setTimeout(() => {
            el.classList.remove("animate-dodge");
        }, 350);
    }

    /**
     * data:
     * { weaponType, fromSide, toSide, result }
     */
    async playProjectile(data) {
        if (!this.ctx || !this.canvas || !this.positions) return;

        const { weaponType, fromSide, toSide, damageToShield } = data || {};
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

                // nettoyage frame-by-frame
                this.clear();

                if (img) {
                    this._drawRotatedImage(img, x, y, angle, 24);
                }

                if (t < 1) {
                    this._rafId = requestAnimationFrame(step);
                } else {

                    // Impact moment précis
                    if (damageToShield > 0) {
                        this.playShieldImpact({
                            side: toSide,
                            damageType: weaponType
                        });
                    } else {
                        // si pas de shield impact → on clear normalement
                        this.clear();
                    }

                    this._rafId = null;
                    this._running = false;
                    resolve();
                }
            };

            requestAnimationFrame(step);
        });
    }

    playFloatingDamage({ side, amount, is_critical = false }) {
        
        const pos = this.positions?.[side];
        if (!pos) return;

        const el = document.createElement("div");

        let color = !is_critical ? "#f87171" : "#facc15";

        if(!is_critical){
            color = "#f87171";
            el.textContent = `-${amount}`;
        }else{
            color = "#facc15";
            el.textContent = `CRIT -${amount}`;
        }
        
        el.classList.add(
            "absolute",
            "font-extrabold",
            "text-2xl", 
            "md:text-3xl",
            "pointer-events-none",
            "drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]",
            "animate-float-damage"
        );
        el.style.color = color;

        const wrapper = document.getElementById("combat-ships-layer")?.parentElement;
        if (!wrapper) return;

        wrapper.appendChild(el);

        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;

        setTimeout(() => el.remove(), 1200);
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
    let result;
    if (payload?.type === "MISS" || payload?.type === "EVADE") {

        result = "miss";
        mgr._combatAnim?.engine?.playDodge({ side: toSide });

    }else{

        result = "hit";
        mgr._combatAnim?.engine?.playFloatingDamage({
            side: toSide,
            amount: payload.damage_to_hull > 0 ? payload.damage_to_hull : payload.damage_to_shield,
            is_critical: payload.is_critical
        });

    }

    q.enqueue({
        kind: "projectile",
        weaponType,
        fromSide,
        toSide,
        result,
        damageToShield: payload?.damage_to_shield || 0
    });
};
