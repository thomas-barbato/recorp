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

    const attackerKey =
        payload.source_kind === "NPC"
            ? `npc_${payload.source_id}`
            : `pc_${payload.source_player_id}`;

    const targetKey =
        payload.target_kind === "NPC"
            ? `npc_${payload.target_id}`
            : `pc_${payload.target_player_id}`;

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

    // Animations uniquement pour l'attaquant local
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


