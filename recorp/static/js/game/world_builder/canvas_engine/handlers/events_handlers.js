import { renderEventLog } from "../../events/events_renderer.js";

const MAX_HUD_LOGS = 25;

export function getEventsLog(payload) {
    const log = payload;

    const appendAndTrim = (container, isMobile) => {
        if (!container) return;
        renderEventLog(log, {
            container,
            prepend: true,
            mode: "hud",
            isMobile,
        });

        while (container.children.length > MAX_HUD_LOGS) {
            container.removeChild(container.lastElementChild);
        }
    };

    // Desktop + tablette
    appendAndTrim(document.getElementById("player-event-container"), false);
    appendAndTrim(document.getElementById("player-event-tablet-container"), false);

    // Mobile
    appendAndTrim(document.getElementById("player-event-mobile-container"), true);

    // Modal event (si ouvert)
    const modal = document.getElementById("event-modal");
    const modalContainer = document.getElementById("event-modal-log-container");

    if (modal && !modal.classList.contains("hidden") && modalContainer) {
        renderEventLog(log, {
            container: modalContainer,
            prepend: true,
            mode: "modal",
            isMobile: false,
        });
    }
}
