import { renderEventLog } from "./events_renderer.js";

const MAX_HUD_LOGS = 25;

function trimContainer(container, max = MAX_HUD_LOGS) {
    if (!container) return;
    while (container.children.length > max) {
        container.removeChild(container.firstElementChild);
    }
}

function loadInitialEventLogs() {
    const script = document.getElementById("script_player_event_logs");
    if (!script) {
        console.warn("No script_player_event_logs found");
        return;
    }

    let logs;
    try {
        logs = JSON.parse(script.textContent);
    } catch (e) {
        console.error("Invalid event logs JSON", e);
        return;
    }

    const desktopContainer = document.getElementById("player-event-container");
    const tabletContainer  = document.getElementById("player-event-tablet-container");
    const mobileContainer  = document.getElementById("player-event-mobile-container");

    const initialLogs = Array.isArray(logs) ? logs.slice(-MAX_HUD_LOGS) : [];

    const appendLogs = (container, isMobile) => {
        if (!container) return;
        initialLogs.forEach((log) => {
            renderEventLog(log, {
                container,
                mode: "hud",
                isMobile,
                prepend: false
            });
        });
        trimContainer(container);
    };

    appendLogs(desktopContainer, false);
    appendLogs(tabletContainer, false);
    appendLogs(mobileContainer, true);
}

// ✅ appel immédiat
loadInitialEventLogs();
