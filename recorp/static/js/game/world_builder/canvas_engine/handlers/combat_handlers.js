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

    // Les effets "plateau" (observateurs/cible) doivent respecter l'ordre visuel
    // attaque -> impact -> (éventuelle) riposte, et non partir tous en même temps.
    let worldSequenceDelay = 0;

    events.forEach(ev => {
        if (!ev || !ev.type) return;

            switch (ev.type) {
            case "ATTACK_HIT":
                queueWorldCombatEvent(ev.payload, "HIT", worldSequenceDelay);
                worldSequenceDelay += 720; // projectile + fenêtre d'impact bouclier/coque
                renderModalAttackHit(ev.payload);
                break;

            case "ATTACK_MISS":
                queueWorldCombatEvent(ev.payload, "MISS", worldSequenceDelay);
                worldSequenceDelay += 560;
                renderModalAttackMiss(ev.payload);
                break;

            case "ATTACK_EVADED":
                queueWorldCombatEvent(ev.payload, "EVADE", worldSequenceDelay);
                worldSequenceDelay += 560;
                renderModalAttackEvaded(ev.payload);
                break;

            default:
                console.warn("[Combat] Unknown event:", ev);
                break;
        }
    });
}

export function handleCombatDeath(payload) {
    if (!payload) return;

    const asm = window.ActionSceneManager;
    const ctx = asm?.getContext?.();
    if (!ctx) return;

    const deadKey = normalizeActorKey(payload.dead_key);
    if (!deadKey) return;

    // On force l'état UI local avant même les prochains patchs WS pour éviter
    // les HP/shields "stale" visibles pendant la transition vers la carcasse.
    applyDeadUiState(deadKey);
    purgeDeadTargetTransientEffects(deadKey);
    showDeathOverlayIfLocal(deadKey, payload);

    const attackerKey = normalizeActorKey(ctx.attackerKey);
    const targetKey = normalizeActorKey(ctx.targetKey);
    if (deadKey !== attackerKey && deadKey !== targetKey) {
        return;
    }

    safeAddCombatLog(`Destruction: ${deadKey}`);

    // La scène combat se ferme, puis ActionSceneManager affiche le message terminal
    // dans le modal parent (ex: "X a ete detruit").
    asm?.close?.({
        reason: "combat_death",
        payload,
    });
}

export function handleWreckCreated(payload) {
    if (!payload) return;

    const engine = window.GameState?.canvasEngine ?? window.canvasEngine;
    const map = engine?.map;
    if (!map) return;

    const deadKey = normalizeActorKey(payload.dead_key);
    if (deadKey) {
        applyDeadUiState(deadKey);
        purgeDeadTargetTransientEffects(deadKey);
        showDeathOverlayIfLocal(deadKey, payload);
    }

    // On remplace explicitement l'acteur vivant par la carcasse sur la map.
    if (deadKey?.startsWith("pc_")) {
        map.removeActorByPlayerId?.(deadKey.replace("pc_", ""));
    } else if (deadKey?.startsWith("npc_")) {
        map.removeNpcById?.(deadKey.replace("npc_", ""));
    }

    map.addWreckActor?.(payload);
    engine?.renderer?.requestRedraw?.();
}

export function handleWreckExpired(payload) {
    if (!payload) return;

    const wreckId = payload.wreck_id ?? String(payload.wreck_key || "").replace("wreck_", "");
    if (wreckId == null || wreckId === "") return;

    const wreckKey = payload.wreck_key || `wreck_${wreckId}`;
    const engine = window.GameState?.canvasEngine ?? window.canvasEngine;
    engine?.map?.removeWreckById?.(wreckId);
    engine?.renderer?.requestRedraw?.();

    // Si le joueur a encore le modal carcasse ouvert au moment de l'expiration,
    // on le ferme localement pour éviter un écran "fantôme".
    const modalId = `modal-${wreckKey}`;
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        window.ModalLive?.unregister?.(modalId);
        modalEl.remove();
    }
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

function shouldRenderWorldCombatForLocal(payload) {
    if (!payload) return false;

    // L'initiateur a déjà le focus sur le modal de combat (backdrop flouté).
    // Si un modal combat est ouvert localement, on n'affiche pas la version "plateau".
    if (window.ActionSceneManager?.isActive?.("combat")) {
        return false;
    }

    const localKey = getLocalPlayerKey();
    const initiatorKey = normalizeActorKey(payload.initiator_key);
    const initialTargetKey = normalizeActorKey(payload.initial_target_key);

    // Règle voulue:
    // - initiateur: non
    // - cible initiale: oui
    // - observateurs: oui
    if (initiatorKey && localKey === initiatorKey) return false;
    if (initialTargetKey && localKey === initialTargetKey) return true;
    return true; // observateur (ou fallback best effort)
}

function getWorldCombatFloatingTextConfig(payload, kind) {
    const damageType = String(payload?.damage_type || "").toUpperCase();
    const dmg = Number(payload?.damage_total_applied ?? ((payload?.damage_to_hull || 0) + (payload?.damage_to_shield || 0)) ?? 0);

    if (kind === "HIT") {
        const text = `-${dmg} ${damageType}`.trim();
        const icon = String(damageType || "").toLowerCase() || null;
        return {
            text,
            icon,
            color: "rgba(0,255,180,0.95)",
        };
    }

    if (kind === "MISS") {
        return { text: "MISS", icon: null, color: "rgba(255,255,255,0.95)" };
    }
    if (kind === "EVADE") {
        return { text: "EVADE", icon: null, color: "rgba(255,255,255,0.95)" };
    }
    return null;
}

function renderWorldCombatEvent(payload, kind) {
    if (!payload || !shouldRenderWorldCombatForLocal(payload)) return;

    const engine = window.GameState?.canvasEngine ?? window.canvasEngine;
    const renderer = engine?.renderer;
    const map = engine?.map;
    if (!renderer || !map) return;

    const { attackerKey, targetKey } = extractCombatKeysFromPayload(payload);
    if (!attackerKey || !targetKey) return;

    // Projectile visible pour hit/miss/eva (attaque + riposte), au-dessus du plateau.
    renderer.addWorldCombatProjectile?.({
        sourceKey: attackerKey,
        targetKey: targetKey,
        weaponType: payload.damage_type || "THERMAL",
        duration: 520,
        damageToShield: payload.damage_to_shield || 0,
        damageToHull: payload.damage_to_hull || 0,
    });

    // Message flottant sur la cible de l'événement (source/target déjà corrects même en riposte).
    const msg = getWorldCombatFloatingTextConfig(payload, kind);
    if (msg) {
        window.renderTextAboveTarget?.(
            targetKey,
            msg.text,
            msg.color,
            msg.icon,
            { placement: "above_target", offsetYPx: -4 }
        );
    }
}

function queueWorldCombatEvent(payload, kind, delayMs = 0) {
    const delay = Math.max(0, Number(delayMs) || 0);
    if (delay <= 0) {
        renderWorldCombatEvent(payload, kind);
        return;
    }

    window.setTimeout(() => {
        renderWorldCombatEvent(payload, kind);
    }, delay);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getDamageIconPath(damageType) {
    const t = String(damageType || "").toUpperCase();
    if (t === "THERMAL") return "/static/img/ux/laser-icon.svg";
    if (t === "BALLISTIC") return "/static/img/ux/ballistic-icon.svg";
    if (t === "MISSILE") return "/static/img/ux/missile-icon.svg";
    return null;
}

function damageIconHtml(damageType) {
    const src = getDamageIconPath(damageType);
    if (!src) return "";
    return `<img src="${src}" alt="${escapeHtml(damageType)}" class="inline-block w-4 h-4 align-text-bottom mx-1 opacity-90" />`;
}

function getLocalPlayerKey() {
    return `pc_${window.current_player_id}`;
}

function getCombatEventSourceTargetKeys(payload) {
    const { attackerKey, targetKey } = extractCombatKeysFromPayload(payload || {});
    // `extractCombatKeysFromPayload` renvoie déjà la source/cible réelles de l'événement,
    // y compris pour les ripostes. Ne pas ré-inverser ici.
    return { sourceKey: attackerKey, targetKey };
}

function getCombatModalRowClass(payload, kind) {
    if (kind === "MISS" || kind === "EVADE") {
        return "text-white";
    }

    // Simplification visuelle demandée: plus de rouge sur les logs combat.
    // Tous les HITS restent verts, miss/eva restent blancs.
    if (kind === "HIT") {
        return "text-emerald-300";
    }

    const localKey = getLocalPlayerKey();
    const { sourceKey, targetKey } = getCombatEventSourceTargetKeys(payload);

    if (targetKey === localKey) {
        return "text-red-300";
    }
    if (sourceKey === localKey) {
        return "text-emerald-300";
    }
    return "text-white";
}

function buildCombatModalLogHtml(payload, kind) {
    const targetName = `<b>${escapeHtml(payload?.target_name || payload?.initial_target_name || "la cible")}</b>`;
    const sourceName = `<b>${escapeHtml(payload?.source_name || "La cible")}</b>`;
    const damageType = String(payload?.damage_type || "").toUpperCase();
    const icon = damageIconHtml(damageType);
    const dmg = Number(payload?.damage_total_applied ?? ((payload?.damage_to_hull || 0) + (payload?.damage_to_shield || 0)) ?? 0);
    const critSuffix = payload?.is_critical ? ` <span class="text-yellow-300">C'est un coup critique !</span>` : "";

    if (kind === "HIT") {
        if (payload?.is_counter) {
            return `${sourceName} riposte et vous touche, il vous inflige <span class="font-bold">${dmg} dégâts</span> ${icon}${critSuffix}`;
        }
        return `Vous attaquez ${targetName} pour <span class="font-bold">${dmg} dégâts</span> ${icon}${critSuffix}`;
    }

    if (kind === "MISS") {
        if (payload?.is_counter) {
            return `${sourceName} riposte mais il vous rate.`;
        }
        return `Vous attaquez ${targetName} mais vous ratez.`;
    }

    if (kind === "EVADE") {
        if (payload?.is_counter) {
            return `${sourceName} riposte mais vous esquivez.`;
        }
        return `Vous attaquez ${targetName} mais il esquive.`;
    }

    return "";
}

function applyDeadUiState(deadKey) {
    if (!deadKey) return;

    const engine = window.GameState?.canvasEngine ?? window.canvasEngine;
    const actor = engine?.map?.findActorByKey?.(deadKey);
    if (actor) {
        actor.runtime ??= {};
        actor.runtime.current_hp = 0;
        actor.runtime.shields = {
            MISSILE: 0,
            THERMAL: 0,
            BALLISTIC: 0,
        };
        if (actor.data?.ship) {
            actor.data.ship.current_hp = 0;
            actor.data.ship.current_missile_defense = 0;
            actor.data.ship.current_thermal_defense = 0;
            actor.data.ship.current_ballistic_defense = 0;
        }
    }

    // Synchronise les modals (normal + combat) sans attendre l'ordre exact des frames WS.
    window.ModalLive?.notify?.(deadKey, "hp_update", {
        hp: 0,
        shields: { MISSILE: 0, THERMAL: 0, BALLISTIC: 0 },
    });

    const asm = window.ActionSceneManager;
    const ctx = asm?.getContext?.();
    if (ctx && (String(ctx.attackerKey) === deadKey || String(ctx.targetKey) === deadKey)) {
        asm?._handleEntityUpdate?.({
            entity_key: deadKey,
            change_type: "hp_update",
            changes: {
                hp: { current: 0 },
                shields: { MISSILE: 0, THERMAL: 0, BALLISTIC: 0 },
            }
        });
    }

    // HUD local: un joueur mort n'a plus de vaisseau actif, donc on force un état lisible.
    const localKey = `pc_${window.current_player_id}`;
    if (deadKey === localKey) {
        window.current_player_status = "DEAD";
        if (window.GameState?.player) {
            window.GameState.player.currentPlayerStatus = "DEAD";
        }
        if (window.currentPlayer?.ship) {
            window.currentPlayer.ship.current_hp = 0;
            window.currentPlayer.ship.current_missile_defense = 0;
            window.currentPlayer.ship.current_thermal_defense = 0;
            window.currentPlayer.ship.current_ballistic_defense = 0;
        }

        const hpEl = document.getElementById("hp-container-value-min");
        if (hpEl) hpEl.textContent = "0";
        const hpBar = document.getElementById("hp-percent");
        if (hpBar) hpBar.style.width = "0%";
    }
}

function purgeDeadTargetTransientEffects(deadKey) {
    if (!deadKey) return;

    // Evite les refreshs différés (scan timers / modal refresh) sur une cible qui n'existe plus.
    window.clearScan?.(deadKey);
    delete window.scannedMeta?.[deadKey];
    delete window.scannedModalData?.[deadKey];
    window.scannedTargets?.delete?.(deadKey);

    const timers = window.effectVisualTimers;
    if (timers?.has?.(`scan:${deadKey}`)) {
        clearTimeout(timers.get(`scan:${deadKey}`));
        timers.delete(`scan:${deadKey}`);
    }
    if (timers?.has?.(`share_scan:${deadKey}`)) {
        clearTimeout(timers.get(`share_scan:${deadKey}`));
        timers.delete(`share_scan:${deadKey}`);
    }
}

function showDeathOverlayIfLocal(deadKey, payload) {
    const localKey = `pc_${window.current_player_id}`;
    if (deadKey !== localKey) return;
    window.showDeathRespawnOverlay?.(payload);
}

window.addEventListener?.("wreck:expired_local", (e) => {
    const payload = e?.detail;
    if (!payload) return;
    // Réutilise le même handler que le WS pour avoir un seul chemin de cleanup UI.
    handleWreckExpired(payload);
});

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

    safeAddCombatLog({
        html: buildCombatModalLogHtml(payload, "HIT"),
        className: getCombatModalRowClass(payload, "HIT"),
    });

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

    safeAddCombatLog({
        html: buildCombatModalLogHtml(payload, "MISS"),
        className: getCombatModalRowClass(payload, "MISS"),
    });
    
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

    safeAddCombatLog({
        html: buildCombatModalLogHtml(payload, "EVADE"),
        className: getCombatModalRowClass(payload, "EVADE"),
    });
    
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


