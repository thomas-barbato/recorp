// static/world_builder/modals/events_modal.js
import { renderEventLog } from "../events/events_renderer.js";

/* =========================
   STATE
========================= */
let currentPage = 1;
let maxPages = null;
let hasNext = false;
let hasPrevious = false;
let loading = false;
let isOpen = false;

// gettext safe (au cas où non exposé globalement)
const t = window.gettext || ((s) => s);

/* =========================
   DATA / PAGINATION
========================= */
async function loadEventModalPage(page = 1) {
    if (loading) return;
    loading = true;

    const container = document.getElementById("event-modal-log-container");
    if (!container) {
        loading = false;
        return;
    }

    try {
        const res = await fetch(`/events/?page=${page}`, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        });
        if (!res.ok) return;

        const data = await res.json();

        // Backend-driven pagination (comme messages)
        currentPage = data.current_page ?? data.page ?? page;
        maxPages = data.total_pages ?? data.pages ?? 1;
        hasNext = !!data.has_next;
        hasPrevious = !!data.has_previous;

        container.innerHTML = "";

        (data.results || []).forEach(log => {
            renderEventLog(log, {
                container,
                prepend: false,
                mode: "modal"
            });
        });

        updateEventPaginationUI();

    } catch (e) {
        console.error("[event-modal] load error", e);
    } finally {
        loading = false;
    }
}

function updateEventPaginationUI() {
    const prevBtn = document.getElementById("event-prev-page");
    const nextBtn = document.getElementById("event-next-page");
    const indicator = document.getElementById("event-page-indicator");

    if (indicator) {
        indicator.textContent = `${t("Page")} ${currentPage} / ${maxPages || 1}`;
    }

    if (prevBtn) prevBtn.disabled = !hasPrevious;
    if (nextBtn) nextBtn.disabled = !hasNext;
}

function bindEventPagination() {
    const prevBtn = document.getElementById("event-prev-page");
    const nextBtn = document.getElementById("event-next-page");

    if (prevBtn) {
        prevBtn.onclick = () => {
            if (hasPrevious) {
                loadEventModalPage(currentPage - 1);
            }
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            if (hasNext) {
                loadEventModalPage(currentPage + 1);
            }
        };
    }
}

function initEventModal() {
    currentPage = 1;
    maxPages = null;
    hasNext = false;
    hasPrevious = false;

    bindEventPagination();
    loadEventModalPage(1);
}

/* =========================
   MODAL LIFECYCLE (CHAT-LIKE)
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("event-modal");
    const content = document.getElementById("event-modal-content");
    const closeBtn = document.getElementById("close-event-modal");
    const container = document.getElementById("event-modal-log-container");

    if (!modal || !content || !container) {
        console.warn("[event-modal] missing DOM nodes");
        return;
    }

    function openModal() {
        if (isOpen) return;
        isOpen = true;

        modal.classList.remove("hidden");

        // animation IN (comme chat)
        setTimeout(() => {
            content.classList.remove("scale-90", "opacity-0");
            content.classList.add("scale-100", "opacity-100");
        }, 50);

        document.body.style.overflow = "hidden";
        initEventModal();
    }

    function closeModal() {
        if (!isOpen) return;
        isOpen = false;

        // animation OUT
        content.classList.add("scale-90", "opacity-0");
        content.classList.remove("scale-100", "opacity-100");

        setTimeout(() => {
            modal.classList.add("hidden");
            document.body.style.overflow = "";

            // reset propre
            currentPage = 1;
            maxPages = null;
            hasNext = false;
            hasPrevious = false;
            loading = false;

            if (container) container.innerHTML = "";
        }, 300);
    }

    /* =========================
       OPEN TRIGGERS (PC + MOBILE)
       Interception du système externe
    ========================= */
    document
        .querySelectorAll('[data-modal-target="event-modal"]')
        .forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                openModal();
            }, true);
        });

    /* =========================
       CLOSE TRIGGERS
    ========================= */
    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
    }

    // clic backdrop = close
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ESC = close (bonus cohérent)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
            closeModal();
        }
    });
});
