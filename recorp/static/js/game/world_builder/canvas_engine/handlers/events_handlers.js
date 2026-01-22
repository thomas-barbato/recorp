import { renderEventLog } from "../../events/events_renderer.js"

export function getEventsLog(payload) {
    const log = payload;

    // =========================
    // HUD DESKTOP (flex-col-reverse)
    // => pour afficher le nouveau en haut visuellement : append => prepend:false
    // =========================
    const desktop = document.getElementById("player-event-container");
    if (desktop) {
        renderEventLog(log, {
            container: desktop,
            prepend: true,
            mode: "hud",
            isMobile: false
        });

        // limite hard à 25 (supprime le plus ancien visuellement)
        while (desktop.children.length >= 25) {
            desktop.removeChild(desktop.lastElementChild);
        }
    }

    // =========================
    // HUD MOBILE (flex-col-reverse + horodatage)
    // =========================
    const mobile = document.getElementById("player-event-mobile-container");
    if (mobile) {
        renderEventLog(log, {
            container: mobile,
            prepend: true,
            mode: "hud",
            isMobile: true
        });

        while (mobile.children.length >= 25) {
            mobile.removeChild(mobile.lastElementChild);
        }
    }

    // =========================
    // MODAL EVENT (si ouvert)
    // => temps réel: on veut en haut => prepend:true
    // =========================
    const modal = document.getElementById("event-modal");
    const modalContainer = document.getElementById("event-modal-log-container");

    if (modal && !modal.classList.contains("hidden") && modalContainer) {
        renderEventLog(log, {
            container: modalContainer,
            prepend: true,
            mode: "modal",
            isMobile: false
        });
    }
}