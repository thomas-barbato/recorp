import { renderEventLog } from "../events/events_renderer.js";

/* =========================
   STATE
========================= */
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let isOpen = false;

// gettext safe
const t = window.gettext || ((s) => s);

/* =========================
   DATA / PAGINATION
========================= */
async function loadEventModalPage(page = 1) {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById("event-modal-log-container");
    if (!container) {
        isLoading = false;
        return;
    }

    container.innerHTML = "";

    try {
        const res = await fetch(`/events/?page=${page}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // 🔥 ADAPTATION À TON BACKEND
        currentPage = data.page;
        totalPages = data.pages;

        (data.results || []).forEach(log => {
            renderEventLog(log, {
                container,
                mode: "modal",
                prepend: false   // historique = append
            });
        });

        updatePaginationControls();
    } catch (e) {
        console.error("[event-modal] load failed", e);
    }

    isLoading = false;
}

function updatePaginationControls() {
    const prevBtn = document.getElementById("event-prev-page");
    const nextBtn = document.getElementById("event-next-page");
    const indicator = document.getElementById("event-page-indicator");

    if (indicator) {
        indicator.textContent = `${t("Page")} ${currentPage} / ${totalPages}`;
    }

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

function bindPaginationButtons() {
    const prevBtn = document.getElementById("event-prev-page");
    const nextBtn = document.getElementById("event-next-page");

    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                loadEventModalPage(currentPage - 1);
            }
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                loadEventModalPage(currentPage + 1);
            }
        };
    }
}

/* =========================
   MODAL LIFECYCLE (CONSERVÉ)
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("event-modal");
    const content = document.getElementById("event-modal-content");
    const closeBtn = document.getElementById("close-event-modal");
    const closeBtnBottom = document.getElementById("close-event-modal-bottom");

    if (!modal || !content) return;

    function openModal() {
        if (isOpen) return;
        isOpen = true;

        modal.classList.remove("hidden");

        setTimeout(() => {
            content.classList.remove("scale-90", "opacity-0");
            content.classList.add("scale-100", "opacity-100");
        }, 50);

        document.body.style.overflow = "hidden";

        currentPage = 1;
        bindPaginationButtons();
        loadEventModalPage(1);
    }

    function closeModal() {
        if (!isOpen) return;
        isOpen = false;

        content.classList.add("scale-90", "opacity-0");
        content.classList.remove("scale-100", "opacity-100");

        setTimeout(() => {
            modal.classList.add("hidden");
            document.body.style.overflow = "";
        }, 300);
    }

    // OPEN triggers (PC + mobile)
    document
        .querySelectorAll('[data-modal-target="event-modal"]')
        .forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                openModal();
            }, true);
        });

    // CLOSE triggers
    if (closeBtn) closeBtn.onclick = closeModal;
    if (closeBtnBottom) closeBtnBottom.onclick = closeModal;

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) closeModal();
    });
});
