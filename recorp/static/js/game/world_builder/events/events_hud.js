import { renderEventLog } from "./events_renderer.js";

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
    const mobileContainer  = document.getElementById("player-event-mobile-container");

    logs.forEach((log) => {
        renderEventLog(log, {
            container: desktopContainer,
            mode: "hud",
            isMobile: false,
            prepend: false
        });
    });

    logs.forEach((log) => {
        renderEventLog(log, {
            container: mobileContainer,
            mode: "hud",
            isMobile: true,
            prepend: false
        });
    });
}

// ✅ appel immédiat
loadInitialEventLogs();
