import { renderEventLog } from "../../events/events_renderer.js"

export function getEventsLog(payload){
    console.log("dedans")
    const log = payload.data;
    console.log(log)
    // =========================
    // HUD DESKTOP
    // =========================
    const desktop = document.getElementById("player-event-container");
    if (desktop) {
        renderEventLog(log, {
            container: desktop,
            prepend: true,
            mode: "hud"
        });

        // limite hard à 25
        while (desktop.children.length > 25) {
            desktop.removeChild(desktop.lastElementChild);
        }
    }

    // =========================
    // HUD MOBILE
    // =========================
    const mobile = document.getElementById("player-event-mobile-container");
    if (mobile) {
        renderEventLog(log, {
            container: mobile,
            prepend: true,
            mode: "hud"
        });

        while (mobile.children.length > 25) {
            mobile.removeChild(mobile.lastElementChild);
        }
    }

    // =========================
    // MODAL EVENT (si ouvert)
    // =========================
    const modal = document.getElementById("event-modal");
    const modalContainer = document.getElementById("event-modal-log-container");

    if (
        modal &&
        !modal.classList.contains("hidden") &&
        modalContainer
    ) {
        renderEventLog(log, {
            container: modalContainer,
            prepend: true,
            mode: "modal"
        });
    }

}