import { LOG_TYPE_STYLE, DEFAULT_LOG_STYLE } from "./events_config.js";

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
    log,
    {
        container,
        prepend = true,
        mode = "hud",
        isMobile = false
    }
) {
    if (!container) return;

    const p = log.content || {};
    const eventType = p.event || log.log_type || "DEFAULT";
    const style = LOG_TYPE_STYLE[eventType] || DEFAULT_LOG_STYLE;

    const li = document.createElement("li");

    li.className = `
        flex items-center gap-2
        text-xs leading-tight
        ${style.color}
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
        <span class="wrap">
            ${buildEventText(log)}
        </span>
    `;

    // IMPORTANT :
    // - HUD: container est en flex-col-reverse => pour avoir "nouveau en haut visuellement", on fait append (prepend=false)
    // - MODAL: prepend/append dépend du contexte (pagination vs temps réel)
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
            FALLBACK
        ======================= */
        default:
            if (p.author && p.target) {
                return `<b>${p.author}</b> → <b>${p.target}</b>`;
            }
            return "Événement";
    }
}