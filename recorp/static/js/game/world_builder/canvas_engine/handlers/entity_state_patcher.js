function ensureActorRuntime(actor) {
    if (!actor) return null;
    actor.runtime ??= {};
    actor.runtime.shields ??= {
        MISSILE: 0,
        THERMAL: 0,
        BALLISTIC: 0,
    };
    actor.runtime.shield_max ??= {
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
        if (changes.shield_max) {
            runtime.shield_max = { ...runtime.shield_max, ...changes.shield_max };
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
        const hpMaxIncoming = changes?.hp?.max;

        if (hpMaxIncoming != null) {
            const hpMaxEl = document.getElementById("hp-container-value-max");
            if (hpMaxEl) hpMaxEl.textContent = String(hpMaxIncoming);
            if (window.currentPlayer?.ship) window.currentPlayer.ship.max_hp = hpMaxIncoming;
        }

        if (hpCurrent != null) {
            const hpEl = document.getElementById("hp-container-value-min");
            if (hpEl) hpEl.textContent = String(hpCurrent);
            if (window.currentPlayer?.ship) window.currentPlayer.ship.current_hp = hpCurrent;
        }

        const hpMax = hpMaxIncoming != null
            ? Number(hpMaxIncoming)
            : parseInt(document.getElementById("hp-container-value-max")?.textContent, 10);
        if (hpCurrent != null && Number.isFinite(hpMax) && hpMax > 0) {
            const hpBar = document.getElementById("hp-percent");
            if (hpBar) hpBar.style.width = `${(hpCurrent / hpMax) * 100}%`;
        }

        const shieldFieldMap = {
            MISSILE: {
                min: "missile-container-value-min",
                max: "missile-container-value-max",
                pct: "missile-percent",
                currentPlayerField: "current_missile_defense",
                maxPlayerField: "max_missile_defense",
            },
            THERMAL: {
                min: "thermal-container-value-min",
                max: "thermal-container-value-max",
                pct: "thermal-percent",
                currentPlayerField: "current_thermal_defense",
                maxPlayerField: "max_thermal_defense",
            },
            BALLISTIC: {
                min: "ballistic-container-value-min",
                max: "ballistic-container-value-max",
                pct: "ballistic-percent",
                currentPlayerField: "current_ballistic_defense",
                maxPlayerField: "max_ballistic_defense",
            },
        };

        // Supporte format complet { shields, shield_max }
        if (
            (changes.shields && typeof changes.shields === "object") ||
            (changes.shield_max && typeof changes.shield_max === "object")
        ) {
            Object.entries(shieldFieldMap).forEach(([shieldType, ids]) => {
                const current = changes.shields?.[shieldType];
                const maxIncoming = changes.shield_max?.[shieldType];

                const minEl = document.getElementById(ids.min);
                const maxEl = document.getElementById(ids.max);
                const pctEl = document.getElementById(ids.pct);

                if (current != null && minEl) {
                    minEl.textContent = String(current);
                }
                if (maxIncoming != null && maxEl) {
                    maxEl.textContent = String(maxIncoming);
                }

                const currentVal = current != null
                    ? Number(current)
                    : parseInt(minEl?.textContent, 10);
                const maxVal = maxIncoming != null
                    ? Number(maxIncoming)
                    : parseInt(maxEl?.textContent, 10);

                if (pctEl && Number.isFinite(currentVal) && Number.isFinite(maxVal) && maxVal > 0) {
                    const pct = Math.max(0, Math.min(100, (currentVal / maxVal) * 100));
                    pctEl.style.width = `${pct}%`;
                }

                if (window.currentPlayer?.ship) {
                    if (current != null) window.currentPlayer.ship[ids.currentPlayerField] = current;
                    if (maxIncoming != null) window.currentPlayer.ship[ids.maxPlayerField] = maxIncoming;
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

        const minEl = document.getElementById("movement-container-value-min");
        const maxEl = document.getElementById("movement-container-value-max");
        const barEl = document.getElementById("mp-percent");

        if (mpCurrent != null && minEl) minEl.textContent = String(mpCurrent);
        if (mpMax != null && maxEl) maxEl.textContent = String(mpMax);

        const currentVal = mpCurrent != null ? Number(mpCurrent) : parseInt(minEl?.textContent, 10);
        const maxVal = mpMax != null ? Number(mpMax) : parseInt(maxEl?.textContent, 10);
        if (barEl && Number.isFinite(currentVal) && Number.isFinite(maxVal) && maxVal > 0) {
            const pct = Math.max(0, Math.min(100, (currentVal / maxVal) * 100));
            barEl.style.width = `${pct}%`;
        }

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
            max_hp: changes.hp?.max,
            shields: changes.shields,
            shield_max: changes.shield_max,
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

