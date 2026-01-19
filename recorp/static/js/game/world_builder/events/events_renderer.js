import { LOG_TYPE_STYLE, DEFAULT_LOG_STYLE } from "./events_config.js";

function formatTimestamp(isoDate) {
    const d = new Date(isoDate);
    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

export function renderEventLog(log, { container, prepend = true, mode = "hud" }) {
    const style = LOG_TYPE_STYLE[log.log_type] || DEFAULT_LOG_STYLE;

    const li = document.createElement("li");
    li.className = `
        flex flex-col gap-0.5
        ${style.color}
        ${style.glow}
        ${mode === "modal" ? "p-2 rounded-md bg-emerald-900/20" : ""}
    `;

    li.innerHTML = `
        <div class="flex justify-between items-center text-[10px] opacity-70">
            <span class="uppercase tracking-wider font-bold">
                ${log.log_type.replace("_", " ")}
            </span>
            <span class="font-mono">
                ${formatTimestamp(log.created_at)}
            </span>
        </div>
        <div class="text-xs break-words">
            ${log.content}
        </div>
    `;

    if (prepend) {
        container.prepend(li);
    } else {
        container.append(li);
    }
}