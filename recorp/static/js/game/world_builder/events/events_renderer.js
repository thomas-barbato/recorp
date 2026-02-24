import { LOG_TYPE_STYLE, DEFAULT_LOG_STYLE } from "./events_config.js";

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getCurrentPlayerIdSafe() {
    if (window.current_player_id != null) {
        return String(window.current_player_id);
    }
    try {
        const script = document.getElementById("script_current_player_id");
        if (!script) return "";
        return String(JSON.parse(script.textContent));
    } catch {
        return "";
    }
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

function redDamageHtml(amount, damageType) {
    const icon = damageIconHtml(damageType);
    return `<span class="font-semibold">${amount} dégâts</span> ${icon}`;
}

function neutralDamageHtml(amount, damageType) {
    const icon = damageIconHtml(damageType);
    return `<span class="font-semibold">${amount} dégâts</span> ${icon}`;
}

function getCombatActionRowColorClass(log) {
    const p = log.content || {};
    const role = log.role;
    const eventType = p.combat_event_type;

    if (eventType !== "ATTACK_HIT") {
        return "text-white";
    }

    if (role === "OBSERVER") {
        return "text-white";
    }

    if (role === "TRANSMITTER" || role === "RECEIVER") {
        return "text-emerald-300";
    }

    return "text-white";
}

function getDynamicEventRowColorClass(log, fallbackColorClass) {
    const eventType = (log.content || {}).event || log.log_type;
    if (eventType === "COMBAT_ACTION") {
        return getCombatActionRowColorClass(log);
    }
    if (eventType === "COMBAT_DEATH") {
        const deadKey = String((log.content || {}).dead_key || "");
        const localPlayerId = getCurrentPlayerIdSafe();
        if (localPlayerId && deadKey === `pc_${localPlayerId}`) {
            return "text-red-300";
        }
        if (log.role === "RECEIVER") {
            return "text-red-300";
        }
        return "text-emerald-300";
    }
    return fallbackColorClass;
}

function buildCombatActionText(log) {
    const p = log.content || {};
    const role = log.role;
    const eventType = p.combat_event_type;
    const isCounter = p.is_counter === true;
    const isCritical = p.is_critical === true;
    const sourceName = `<b>${escapeHtml(p.source_name || "Inconnu")}</b>`;
    const targetName = `<b>${escapeHtml(p.target_name || "Inconnu")}</b>`;
    const damage = Number(p.damage_total || 0);
    const damageType = p.damage_type;
    const critSuffix = isCritical ? ` <span class="text-yellow-300">c'est un coup critique !</span>` : "";
    const colorWrap = (html) => {
        if (role === "OBSERVER") return `<span class="text-white">${html}</span>`;
        if (eventType !== "ATTACK_HIT") return `<span class="text-white">${html}</span>`;
        if (role === "TRANSMITTER") {
            return `<span class="${isCounter ? "text-red-300" : "text-emerald-300"}">${html}</span>`;
        }
        if (role === "RECEIVER") {
            return `<span class="${isCounter ? "text-emerald-300" : "text-red-300"}">${html}</span>`;
        }
        return `<span class="text-white">${html}</span>`;
    };

    if (role === "TRANSMITTER") {
        if (eventType === "ATTACK_HIT") {
            if (isCounter) {
                return colorWrap(`${sourceName} riposte et vous touche, il vous inflige ${redDamageHtml(damage, damageType)}${critSuffix}`);
            }
            return colorWrap(`Vous attaquez ${targetName} pour ${neutralDamageHtml(damage, damageType)}${critSuffix}`);
        }
        if (eventType === "ATTACK_MISS") {
            return colorWrap(isCounter
                ? `${sourceName} riposte mais il vous rate`
                : `Vous attaquez ${targetName} mais vous ratez`);
        }
        if (eventType === "ATTACK_EVADED") {
            return colorWrap(isCounter
                ? `${sourceName} riposte mais vous esquivez`
                : `Vous attaquez ${targetName} mais il esquive`);
        }
    }

    if (role === "RECEIVER") {
        if (eventType === "ATTACK_HIT") {
            if (isCounter) {
                return colorWrap(`Vous ripostez à ${targetName} et le touchez pour ${neutralDamageHtml(damage, damageType)}${critSuffix}`);
            }
            return colorWrap(`${sourceName} vous attaque et vous touche pour ${redDamageHtml(damage, damageType)}${critSuffix}`);
        }
        if (eventType === "ATTACK_MISS") {
            return colorWrap(isCounter
                ? `Vous ripostez à ${targetName} mais vous ratez`
                : `${sourceName} vous attaque mais vous rate`);
        }
        if (eventType === "ATTACK_EVADED") {
            return colorWrap(isCounter
                ? `Vous ripostez à ${targetName} mais il esquive`
                : `${sourceName} vous attaque mais vous esquivez`);
        }
    }

    // OBSERVER (et fallback)
    if (eventType === "ATTACK_HIT") {
        if (isCounter) {
            return colorWrap(`${sourceName} riposte à ${targetName} pour ${neutralDamageHtml(damage, damageType)}${critSuffix}`);
        }
        return colorWrap(`${sourceName} attaque ${targetName} pour ${neutralDamageHtml(damage, damageType)}${critSuffix}`);
    }
    if (eventType === "ATTACK_MISS") {
        return colorWrap(isCounter
            ? `${sourceName} riposte à ${targetName} mais rate`
            : `${sourceName} attaque ${targetName} et rate`);
    }
    if (eventType === "ATTACK_EVADED") {
        return colorWrap(isCounter
            ? `${sourceName} riposte à ${targetName} mais il esquive`
            : `${sourceName} attaque ${targetName} mais il esquive`);
    }

    return "Combat";
}

function normalizeLogShape(inputLog) {
    if (!inputLog || typeof inputLog !== "object") {
        return { content: {}, role: null, log_type: "UNKNOWN", created_at: new Date().toISOString() };
    }

    // Compat si un wrapper inattendu est encore présent
    const log = inputLog.message && typeof inputLog.message === "object"
        ? { ...inputLog.message, ...inputLog }
        : { ...inputLog };

    let content = log.content;
    if (typeof content === "string") {
        try {
            content = JSON.parse(content);
        } catch {
            content = { raw: log.content };
        }
    }
    if (!content || typeof content !== "object") {
        content = {};
    }

    log.content = content;
    return log;
}

function formatTimestamp(isoDate) {
    const d = new Date(isoDate);

    const date = d.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });

    const time = d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    return `${date} ${time}`;
}

export function renderEventLog(
    rawLog,
    {
        container,
        prepend = true,
        mode = "hud",
        isMobile = false
    }
) {
    if (!container) return;
    const log = normalizeLogShape(rawLog);

    const p = log.content || {};
    const eventType = p.event || log.log_type || "DEFAULT";
    const style = LOG_TYPE_STYLE[eventType] || DEFAULT_LOG_STYLE;
    const colorClass = getDynamicEventRowColorClass(log, style.color);

    const li = document.createElement("li");

    li.className = `
        flex items-start gap-2
        text-xs leading-snug
        font-medium
        ${colorClass}
        ${style.glow || ""}
        ${mode === "modal" ? "p-2 rounded-md" : ""}
    `;

    const showTimestamp = (mode === "modal") || isMobile;
    const timestampHtml = showTimestamp
        ? `<span class="opacity-50 font-mono whitespace-nowrap text-white">
                ${formatTimestamp(log.created_at)}
            </span>`
        : "";

    li.innerHTML = `
        ${timestampHtml}
        <span class="block break-words leading-snug">
            ${buildEventText(log)}
        </span>
    `;

    // Convention retenue:
    // - nouveau message en haut
    // - plus on descend, plus les messages sont anciens
    if (prepend) container.prepend(li);
    else container.append(li);
}


function buildEventText(log) {
    const p = log.content || {};
    const role = log.role;

    const eventType = p.event || log.log_type;

    switch (eventType) {

        /* =======================
            ZONE CHANGE
        ======================= */
        case "ZONE_CHANGE":
            if (p.from && p.to) {
                return `Changement de zone : <b>${p.from.replace('_',' ').replace('-',' ')}</b> → <b>${p.to.replace('_',' ').replace('-',' ')}</b>`;
            }
            return "Changement de zone";

        /* =======================
            SCAN
        ======================= */
        case "SCAN":
            if (role === "TRANSMITTER") {
                return `Vous avez scanné <b>${p.target}</b>`;
            }
            if (role === "RECEIVER") {
                return `<b>${p.author}</b> vous a scanné`;
            }
            if (role === "OBSERVER") {
                return `<b>${p.author}</b> a scanné <b>${p.target}</b>`;
            }
            return "Scan";

        /* =======================
            ATTACK
        ======================= */
        case "ATTACK":
            if (role === "TRANSMITTER") {
                return `Vous attaquez <b>${p.target}</b>`;
            }
            if (role === "RECEIVER") {
                return `<b>${p.author}</b> vous attaque`;
            }
            if (role === "OBSERVER") {
                return `<b>${p.author}</b> attaque <b>${p.target}</b>`;
            }
            return "Attaque";

        /* =======================
            COMBAT_ACTION (attaque / riposte détaillées)
        ======================= */
        case "COMBAT_ACTION":
            return buildCombatActionText(log);

        /* =======================
            COMBAT_DEATH
        ======================= */
        case "COMBAT_DEATH": {
            const dead = `<b>${escapeHtml(p.dead || "Inconnu")}</b>`;
            const killer = `<b>${escapeHtml(p.killer || "Inconnu")}</b>`;
            const deadKey = String(p.dead_key || "");
            const localPlayerId = getCurrentPlayerIdSafe();
            const isLocalDeath = (localPlayerId && deadKey === `pc_${localPlayerId}`) || role === "RECEIVER";
            if (isLocalDeath) {
                return `<span class="text-red-300">Vous avez été tué par ${killer}</span>`;
            }
            return `${dead} a été tué par ${killer}`;
        }

        /* =======================
            FALLBACK
        ======================= */
        default:
            if (p.author && p.target) {
                return `<b>${p.author}</b> → <b>${p.target}</b>`;
            }
            if (p.raw) {
                return `Log: ${escapeHtml(String(p.raw))}`;
            }
            return `Log inconnu (${escapeHtml(eventType || log.log_type || "UNKNOWN")})`;
    }
}
