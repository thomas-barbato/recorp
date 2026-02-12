export function handleCombatEvents(message) {


    console.log("Received combat events:", message);

    const events = message.events;

    if (!Array.isArray(events)) {
        console.warn("[Combat] Invalid events payload:", events);
        return;
    }

    events.forEach(ev => {

        console.log("⚔️ Combat event:", ev);

        switch (ev.type) {

            case "ATTACK_HIT":
                renderAttackHit(ev.payload);
                break;

            case "ATTACK_MISS":
                renderAttackMiss(ev.payload);
                break;

            case "ATTACK_EVADED":
                renderAttackEvaded(ev.payload);
                break;

            default:
                console.warn("[Combat] Unknown event:", ev);
        }
    });
}

function renderAttackHit(payload) {

    const {
        source,
        target,
        damage_type,
        damage_to_shield,
        damage_to_hull,
        is_counter
    } = payload;

    const label = is_counter ? "Riposte" : "Attaque";

    const msg = `${label} ${damage_type} : `
        + `${damage_to_shield} shield / `
        + `${damage_to_hull} hull`;

    console.log(msg);

    // Préparation animations futures
    window.playCombatAnimation?.({
        type: "HIT",
        source,
        target,
        damage_type,
        is_counter
    });

    window.addCombatLog?.(msg);
}

function renderAttackMiss(payload) {

    const label = payload.is_counter ? "Riposte" : "Attaque";
    const msg = `${label} ratée`;

    console.log(msg);

    window.playCombatAnimation?.({
        type: "MISS",
        ...payload
    });

    window.addCombatLog?.(msg);
}

function renderAttackEvaded(payload) {

    const label = payload.is_counter ? "Riposte" : "Attaque";
    const msg = `${label} esquivée`;

    console.log(msg);

    window.playCombatAnimation?.({
        type: "EVADE",
        ...payload
    });

    window.addCombatLog?.(msg);
}

// ===============================
// HUD (AP / HP / SHIELD) updates
// ===============================

export function handleCombatStateUpdate(msg) {
    
    if (!msg || !msg.entity_key || !msg.change_type || !msg.changes) return;

    const { entity_key, change_type, changes } = msg;

    // HUD = uniquement le joueur local
    // entity_key attendu: "pc_68"
    const parts = String(entity_key).split("_");
    if (parts.length !== 2) return;

    const [kind, id] = parts;
    if (kind !== "pc") return;

    // window.current_player_id doit exister chez toi
    if (String(id) !== String(window.current_player_id)) return;

    if (change_type === "ap_update") {
        const current = changes?.ap?.current;
        if (current == null) return;

        // Desktop HUD
        const apDesktop = document.getElementById("actionPoint-container-value-min");
        if (apDesktop) apDesktop.textContent = current;

        // Mobile HUD
        const apMobile = document.getElementById("ap-container-value-min");
        if (apMobile) apMobile.textContent = current;

        return;
    }

    if (change_type === "hp_update") {
        const hpCurrent = changes?.hp?.current;
        if (hpCurrent != null) {
            const hpEl = document.getElementById("hp-container-value-min");
            if (hpEl) hpEl.textContent = hpCurrent;
        }

        const hpMax = parseInt(
            document.getElementById("hp-container-value-max")?.textContent,
            10
        );

        if (hpCurrent != null && hpMax) {
            const percent = (hpCurrent / hpMax) * 100;
            const hpBar = document.getElementById("hp-percent");
            if (hpBar) hpBar.style.width = `${percent}%`;
        }

        // Shield partiel (par type) : { current, damage_type }
        const shieldCurrent = changes?.shield?.current;
        const dmgType = changes?.shield?.damage_type;

        if (shieldCurrent != null && dmgType) {
            const map = {
                MISSILE: "missile-container-value-min",
                THERMAL: "thermal-container-value-min",
                BALLISTIC: "ballistic-container-value-min",
            };

            const elId = map[dmgType];
            if (elId) {
                const el = document.getElementById(elId);
                if (el) el.textContent = shieldCurrent;
            }

            const maxEl = document.getElementById(`${dmgType.toLowerCase()}-container-value-max`);
            const percentEl = document.getElementById(`${dmgType.toLowerCase()}-percent`);

            if (maxEl && percentEl) {
                const max = parseInt(maxEl.textContent, 10);
                if (max > 0) {
                    const percent = (shieldCurrent / max) * 100;
                    percentEl.style.width = `${percent}%`;
                }
            }
        }
    }
}