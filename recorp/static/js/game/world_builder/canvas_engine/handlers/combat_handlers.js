// static/js/world_builder/canvas_engine/handlers/combat_handlers.js

// =======================================================
// Combat handlers
// - Filtrage strict par contexte de combat (modal affiché)
// - Animations uniquement pour l'attaquant local
// =======================================================

export function handleCombatEvents(message) {
    // message peut être: { events: [...] } ou directement {message:{events:[...]}} selon ton pipeline
    const events = message?.events || message?.message?.events;

    if (!Array.isArray(events)) {
        console.warn("[Combat] Invalid events payload:", message);
        return;
    }

    events.forEach(ev => {
        if (!ev || !ev.type) return;

        switch (ev.type) {
            case "ATTACK_HIT":
                console.log(ev.payload)
                renderModalAttackHit(ev.payload);
                break;

            case "ATTACK_MISS":
                renderModalAttackMiss(ev.payload);
                break;

            case "ATTACK_EVADED":
                renderModalAttackEvaded(ev.payload);
                break;

            default:
                console.warn("[Combat] Unknown event:", ev);
                break;
        }
    });
}

// =======================================================
// Helpers
// =======================================================

function normalizeActorKey(k) {
    if (!k) return null;
    const s = String(k).trim();
    if (!s) return null;

    // Ex: "pc_12" ok
    if (s.startsWith("pc_") || s.startsWith("npc_")) return s;

    // Ex: "12" => pc_12 (si jamais)
    if (/^\d+$/.test(s)) return `pc_${s}`;

    return s;
}

function extractCombatKeysFromPayload(payload) {
    if (!payload) return { attackerKey: null, targetKey: null };

    const attackerKey = payload.source_player_id != null
        ? `pc_${payload.source_player_id}`
        : null;

    const targetKey = payload.target_player_id != null
        ? `pc_${payload.target_player_id}`
        : null;

    return { attackerKey, targetKey };
}

/**
 * Vrai si le modal combat actuellement affiché correspond au duel (A<->B)
 * On accepte A->B ou B->A (riposte/counter, etc.)
 */
function isRelevantForMyCombatModal(payload) {
    const ctx = window.ActionSceneManager?.getContext?.();
    if (!ctx || !ctx.attackerKey || !ctx.targetKey) return false;

    const { attackerKey, targetKey } = extractCombatKeysFromPayload(payload);
    if (!attackerKey || !targetKey) return false;

    const cA = normalizeActorKey(ctx.attackerKey);
    const cB = normalizeActorKey(ctx.targetKey);

    // match direct (A,B) ou inversé (B,A)
    return (
        (cA === attackerKey && cB === targetKey) ||
        (cA === targetKey && cB === attackerKey)
    );
}

function shouldAnimateForMe(payload) {
    const myId = String(window.current_player_id);
    if (!payload?.source_player_id || !payload?.target_player_id) return false;

    return (
        String(payload.source_player_id) === myId ||
        String(payload.target_player_id) === myId
    );
}

function safeAddCombatLog(text) {
    if (typeof window.addCombatLog === "function") {
        window.addCombatLog(text);
    }
}

// =======================================================
// Render events (modal)
// =======================================================

function renderModalAttackHit(payload) {
    if (!payload) return;

    // ✅ Bloque tout si ce combat ne correspond pas au modal actuel
    console.log(payload)
    if (!isRelevantForMyCombatModal(payload)) return;

    // Le modal est concerné, donc logs ok
    const {
        damage_type,
        damage_to_shield,
        damage_to_hull,
        is_counter,
        is_critical
    } = payload;

    const label = is_counter ? "Riposte" : "Attaque";
    const crit = is_critical ? " (critique)" : "";
    const msg = `${label}${crit} ${damage_type} : ${damage_to_shield} shield / ${damage_to_hull} hull`;

    safeAddCombatLog(msg);

    // ✅ Animations uniquement pour l'attaquant local
    if (!shouldAnimateForMe(payload)) return;

    // Pour l'animation, on utilise les keys du payload (plus fiable que ctx)
    const { attackerKey, targetKey } = extractCombatKeysFromPayload(payload);
    if (!attackerKey || !targetKey) return;

    // Si counter, on inverse visuellement source/target
    const sourceKey = is_counter ? targetKey : attackerKey;
    const destKey = is_counter ? attackerKey : targetKey;

    window.playCombatAnimation?.({
        type: "HIT",
        source: sourceKey,
        target: destKey,
        damage_type,
        damage_to_shield,
        damage_to_hull,
        is_counter,
        is_critical
    });
}

function renderModalAttackMiss(payload) {
    if (!payload) return;
    console.log(payload)
    if (!isRelevantForMyCombatModal(payload)) return;

    const label = payload.is_counter ? "Riposte" : "Attaque";
    safeAddCombatLog(`${label} ratée`);

    if (!shouldAnimateForMe(payload)) return;

    const { attackerKey, targetKey } = extractCombatKeysFromPayload(payload);
    if (!attackerKey || !targetKey) return;

    const sourceKey = payload.is_counter ? targetKey : attackerKey;
    const destKey = payload.is_counter ? attackerKey : targetKey;

    window.playCombatAnimation?.({
        type: "MISS",
        source: sourceKey,
        target: destKey,
        damage_type: payload.damage_type,
        is_counter: payload.is_counter
    });
}

function renderModalAttackEvaded(payload) {
    if (!payload) return;

    if (!isRelevantForMyCombatModal(payload)) return;

    const label = payload.is_counter ? "Riposte" : "Attaque";
    safeAddCombatLog(`${label} esquivée`);

    if (!shouldAnimateForMe(payload)) return;

    const { attackerKey, targetKey } = extractCombatKeysFromPayload(payload);
    if (!attackerKey || !targetKey) return;

    const sourceKey = payload.is_counter ? targetKey : attackerKey;
    const destKey = payload.is_counter ? attackerKey : targetKey;

    window.playCombatAnimation?.({
        type: "EVADE",
        source: sourceKey,
        target: destKey,
        damage_type: payload.damage_type,
        is_counter: payload.is_counter
    });
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
        if (apDesktop) apDesktop.textContent = String(current);

        // Mobile HUD
        const apMobile = document.getElementById("ap-container-value-min");
        if (apMobile) apMobile.textContent = String(current);

        return;
    }

    if (change_type === "hp_update") {
        const hpCurrent = changes?.hp?.current;
        if (hpCurrent != null) {
            const hpEl = document.getElementById("hp-container-value-min");
            if (hpEl) hpEl.textContent = String(hpCurrent);
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
                if (el) el.textContent = String(shieldCurrent);
            }

            // Bar shield si tu as un id type "...-percent"
            const maxIdMap = {
                MISSILE: "missile-container-value-max",
                THERMAL: "thermal-container-value-max",
                BALLISTIC: "ballistic-container-value-max",
            };

            const percentIdMap = {
                MISSILE: "missile-percent",
                THERMAL: "thermal-percent",
                BALLISTIC: "ballistic-percent",
            };

            const maxEl = document.getElementById(maxIdMap[dmgType]);
            const percentEl = document.getElementById(percentIdMap[dmgType]);

            const maxVal = maxEl ? parseInt(maxEl.textContent, 10) : null;
            if (percentEl && maxVal && typeof shieldCurrent === "number") {
                const pct = Math.max(0, Math.min(100, (shieldCurrent / maxVal) * 100));
                percentEl.style.width = `${pct}%`;
            }
        }

        return;
    }
}
