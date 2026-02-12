// ActionSceneManager (foundation) — UI-only, no gameplay.

class ActionSceneManager {
    constructor() {
        this._active = null;     // { type, context, openedAt }
        this._rootEl = null;     // container DOM si besoin plus tard
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
            "bg-black/80",
            "flex",
            "items-center",
            "justify-center",
            "z-[9999]"
        );

        // Container principal
        const container = document.createElement("div");
        container.id = "combat-scene";
        container.classList.add(
            "w-[90%]",
            "max-w-[1000px]",
            "bg-zinc-900",
            "border",
            "border-emerald-500/40",
            "rounded-xl",
            "shadow-2xl",
            "p-6",
            "flex",
            "flex-col",
            "gap-4"
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

        // Preview zone
        const preview = document.createElement("div");
        preview.classList.add(
            "h-[200px]",
            "border",
            "border-emerald-500/20",
            "rounded-lg",
            "flex",
            "items-center",
            "justify-center",
            "text-emerald-300"
        );
        preview.textContent = "Preview Canvas Placeholder";

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
            "h-[120px]",
            "overflow-y-auto",
            "border",
            "border-emerald-500/20",
            "rounded-lg",
            "p-2",
            "text-xs",
            "text-emerald-300"
        );
        log.textContent = "Combat log...";

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

        container.append(header, distance, preview, stats, log, footer);
        backdrop.append(container);
        document.body.append(backdrop);

        this._rootEl = backdrop;
        this._initStatsFromRuntime();
    }

    _initStatsFromRuntime() {

        if (!this.isActive("combat")) return;

        const context = this.getContext();
        if (!context) return;

        const attackerContainer = document.getElementById("combat-attacker-stats");
        const targetContainer = document.getElementById("combat-target-stats");

        // ===== Attacker (toujours visible) =====
        const me = window.currentPlayer;

        if (me && attackerContainer) {
            attackerContainer.querySelector(".hp").textContent = me.current_hp ?? "--";
            attackerContainer.querySelector(".ap").textContent = me.current_ap ?? "--";
            attackerContainer.querySelector(".shield-missile").textContent = me.current_missile_defense ?? "--";
            attackerContainer.querySelector(".shield-thermal").textContent = me.current_thermal_defense ?? "--";
            attackerContainer.querySelector(".shield-ballistic").textContent = me.current_ballistic_defense ?? "--";
        }

        // ===== Target (uniquement si scannée) =====
        const scanned = window.scannedModalData?.[context.targetKey];

        if (scanned && targetContainer) {
            targetContainer.querySelector(".hp").textContent = scanned.current_hp ?? "--";
            targetContainer.querySelector(".ap").textContent = scanned.current_ap ?? "--";
            targetContainer.querySelector(".shield-missile").textContent = scanned.current_missile_defense ?? "--";
            targetContainer.querySelector(".shield-thermal").textContent = scanned.current_thermal_defense ?? "--";
            targetContainer.querySelector(".shield-ballistic").textContent = scanned.current_ballistic_defense ?? "--";
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
            const distanceNode = document.querySelector("#combat-scene .text-sky-300");
            if (distanceNode) {
                distanceNode.textContent = `Distance: ${dist}`;
            }
        });
    }
}

// Singleton
export const actionSceneManager = new ActionSceneManager();

// Compat globale (important car une partie de ton code est encore "non-module")
window.ActionSceneManager = actionSceneManager;
