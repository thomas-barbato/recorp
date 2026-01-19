import { renderEventLog } from "./events_renderer.js";

async function loadHudEvents() {
    const res = await fetch("/events/preview/");
    if (!res.ok) return;

    const data = await res.json();

    const desktopContainer = document.getElementById("player-event-container");
    const mobileContainer = document.getElementById("player-event-mobile-container");

    if (!desktopContainer && !mobileContainer) return;

    data.results.reverse().forEach(log => {
        if (desktopContainer) {
            renderEventLog(log, {
                container: desktopContainer,
                prepend: true,
                mode: "hud"
            });
        }
        if (mobileContainer) {
            renderEventLog(log, {
                container: mobileContainer,
                prepend: true,
                mode: "hud"
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", loadHudEvents);
