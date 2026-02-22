function ensureActorRuntime(actor) {
    if (!actor) return null;
    actor.runtime ??= {};
    actor.runtime.shields ??= {
        MISSILE: 0,
        THERMAL: 0,
        BALLISTIC: 0,
    };
    return actor.runtime;
}

function patchActorRuntime(msg) {
    const { entity_key, change_type, changes } = msg || {};
    if (!entity_key || !change_type || !changes) return;

    const actor = window.canvasEngine?.map?.findActorByKey?.(entity_key);
    const runtime = ensureActorRuntime(actor);
    if (!runtime) return;

    if (change_type === "ap_update") {
        if (changes.ap?.current != null) runtime.current_ap = changes.ap.current;
        if (changes.ap?.max != null) runtime.max_ap = changes.ap.max;
        return;
    }

    if (change_type === "hp_update") {
        if (changes.hp?.current != null) runtime.current_hp = changes.hp.current;
        if (changes.hp?.max != null) runtime.max_hp = changes.hp.max;
        if (changes.shields) {
            runtime.shields = { ...runtime.shields, ...changes.shields };
        }
        if (changes.shield?.current != null && changes.shield?.damage_type) {
            runtime.shields[changes.shield.damage_type] = changes.shield.current;
        }
        return;
    }

    if (change_type === "mp_update") {
        if (changes.movement?.current != null) runtime.current_movement = changes.movement.current;
        if (changes.movement?.max != null) runtime.max_movement = changes.movement.max;
        if (changes.position?.x != null) runtime.x = changes.position.x;
        if (changes.position?.y != null) runtime.y = changes.position.y;
    }
}

function patchLocalHud(msg) {
    const { entity_key, change_type, changes } = msg || {};
    if (!entity_key || !change_type || !changes) return;

    const [kind, id] = String(entity_key).split("_");
    if (kind !== "pc" || String(id) !== String(window.current_player_id)) return;

    if (change_type === "ap_update") {
        const current = changes?.ap?.current;
        if (current == null) return;

        const apDesktop = document.getElementById("actionPoint-container-value-min");
        if (apDesktop) apDesktop.textContent = String(current);

        const apMobile = document.getElementById("ap-container-value-min");
        if (apMobile) apMobile.textContent = String(current);

        if (window.currentPlayer?.user && current != null) {
            window.currentPlayer.user.current_ap = current;
        }
        return;
    }

    if (change_type === "hp_update") {
        const hpCurrent = changes?.hp?.current;
        if (hpCurrent != null) {
            const hpEl = document.getElementById("hp-container-value-min");
            if (hpEl) hpEl.textContent = String(hpCurrent);
            if (window.currentPlayer?.ship) window.currentPlayer.ship.current_hp = hpCurrent;
        }

        const hpMax = parseInt(document.getElementById("hp-container-value-max")?.textContent, 10);
        if (hpCurrent != null && hpMax) {
            const hpBar = document.getElementById("hp-percent");
            if (hpBar) hpBar.style.width = `${(hpCurrent / hpMax) * 100}%`;
        }

        // Supporte format complet { shields: {MISSILE,THERMAL,BALLISTIC} }
        if (changes.shields && typeof changes.shields === "object") {
            const shieldFieldMap = {
                MISSILE: {
                    min: "missile-container-value-min",
                    max: "missile-container-value-max",
                    pct: "missile-percent",
                    currentPlayerField: "current_missile_defense",
                },
                THERMAL: {
                    min: "thermal-container-value-min",
                    max: "thermal-container-value-max",
                    pct: "thermal-percent",
                    currentPlayerField: "current_thermal_defense",
                },
                BALLISTIC: {
                    min: "ballistic-container-value-min",
                    max: "ballistic-container-value-max",
                    pct: "ballistic-percent",
                    currentPlayerField: "current_ballistic_defense",
                },
            };

            Object.entries(shieldFieldMap).forEach(([shieldType, ids]) => {
                const current = changes.shields?.[shieldType];
                if (current == null) return;

                const minEl = document.getElementById(ids.min);
                if (minEl) minEl.textContent = String(current);

                const maxEl = document.getElementById(ids.max);
                const pctEl = document.getElementById(ids.pct);
                const maxVal = maxEl ? parseInt(maxEl.textContent, 10) : null;
                if (pctEl && maxVal) {
                    const pct = Math.max(0, Math.min(100, (current / maxVal) * 100));
                    pctEl.style.width = `${pct}%`;
                }

                if (window.currentPlayer?.ship) {
                    window.currentPlayer.ship[ids.currentPlayerField] = current;
                }
            });
        }

        // Compat ancien format partiel { shield: { current, damage_type } }
        const shieldCurrent = changes?.shield?.current;
        const dmgType = changes?.shield?.damage_type;
        if (shieldCurrent != null && dmgType && !changes.shields) {
            patchLocalHud({
                entity_key,
                change_type,
                changes: { shields: { [dmgType]: shieldCurrent } },
            });
        }
        return;
    }

    if (change_type === "mp_update") {
        const mpCurrent = changes?.movement?.current;
        const mpMax = changes?.movement?.max;
        if (window.currentPlayer?.ship) {
            if (mpCurrent != null) window.currentPlayer.ship.current_movement = mpCurrent;
            if (mpMax != null) window.currentPlayer.ship.max_movement = mpMax;
        }
    }
}

function patchModalLive(msg) {
    const { entity_key, change_type, changes } = msg || {};
    if (!window.ModalLive?.isOpen?.(entity_key)) return;

    if (change_type === "ap_update") {
        window.ModalLive?.notify?.(entity_key, "ap_update", {
            ap: changes.ap?.current,
            max_ap: changes.ap?.max,
        });
        return;
    }

    if (change_type === "hp_update") {
        window.ModalLive?.notify?.(entity_key, "hp_update", {
            hp: changes.hp?.current,
            shields: changes.shields,
            shield: changes.shield,
        });
        return;
    }

    if (change_type === "mp_update") {
        window.ModalLive?.notify?.(entity_key, "mp_update", {
            x: changes.position?.x,
            y: changes.position?.y,
            mp: changes.movement?.current,
            max_mp: changes.movement?.max,
        });
    }
}

function patchStateContainer(msg) {
    const gs = window.GameState;
    if (!gs?.patchEntityState) return;
    gs.patchEntityState(msg);
}

export function applyEntityStatePatch(msg) {
    if (!msg?.entity_key || !msg?.change_type || !msg?.changes) return;

    patchStateContainer(msg);
    patchActorRuntime(msg);
    patchLocalHud(msg);
    patchModalLive(msg);
}

