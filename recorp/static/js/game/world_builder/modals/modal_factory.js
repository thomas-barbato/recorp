// ======================================================================
// modal_factory.js — version STABLE conforme à tes règles
// ======================================================================

(function () {

    if (window.ModalFactory) return;

    const CONTAINER_ID = "modal-container";

    // ============================================================
    // 1) S'assurer que le container global existe
    // ============================================================
    function ensureContainer() {
        let container = document.getElementById(CONTAINER_ID);
        if (!container) {
            container = document.createElement("div");
            container.id = CONTAINER_ID;
            container.className = "fixed inset-0 z-[9999]";
            document.body.appendChild(container);
        }
        return container;
    }

    function normalizePcNpcData(raw) {

        return {
            ...raw,

            // Compatibilité ancienne version :
            translated_type: raw.type === "pc" ? "PLAYER" : "NPC",

            user: {
                ...raw.user,
                username: raw.user.name,  // ancien nom du champ
            },

            faction: {
                ...raw.faction,
                translated_str: raw.faction.name.toUpperCase(), // fallback
            },

            ship: {
                ...raw.ship,
                category: raw.ship.category_name?.toUpperCase() || "UNKNOWN",
            }
        };
    }

    // ============================================================
    // 2) Parser l'ID de modal → type + id
    // ============================================================
    function parseModalId(modalId) {

        // PC
        let m = modalId.match(/^modal-(?:unknown-)?pc_(\d+)$/);
        if (m) return { type: "pc", id: parseInt(m[1]) };

        // NPC
        m = modalId.match(/^modal-(?:unknown-)?npc_(\d+)$/);
        if (m) return { type: "npc", id: parseInt(m[1]) };

        // Sector element : modal-<name>
        m = modalId.match(/^modal-(.+)$/);
        if (m) return { type: "sector_element", id: m[1] };

        return null;
    }

    // ============================================================
    // 3) Construire l'URL du fetch
    // ============================================================
    function buildUrl(info) {
        switch (info.type) {
            case "pc": return `/modal/pc/${info.id}/`;
            case "npc": return `/modal/npc/${info.id}/`;
            case "sector_element": return `/modal/sector-element/${info.id}/`;
            default:
                throw new Error("Type de modal inconnu : " + info.type);
        }
    }

    // ============================================================
    // 4) Faire le fetch backend
    // ============================================================
    async function fetchModalData(info) {
        const resp = await fetch(buildUrl(info), {
            headers: { "X-Requested-With": "XMLHttpRequest" },
            credentials: "same-origin"
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        return resp.json();
    }

    // ============================================================
    // 5) Création du DOM d'un modal
    // ============================================================
    function createModalElement(modalId) {
        const wrapper = document.createElement("div");
        wrapper.id = modalId;
        wrapper.setAttribute("aria-hidden", "true");
        wrapper.setAttribute("tabindex", "-1");
        wrapper.className = [
            "fixed", "top-0", "right-0", "left-0", "z-50",
            "w-full", "h-full", "md:inset-0",
            "flex", "justify-center", "items-center",
            "bg-black/40", "backdrop-blur-md", "animate-modal-fade"
        ].join(" ");

        // container qui centre le contenu (héritage de ton ancienne structure)
        const container_div = document.createElement("div");
        container_div.className = [
            "fixed", "md:p-3", "top-0", "right-0", "left-0", "z-50",
            "w-full", "md:inset-0", "h-screen",
            "flex", "justify-center", "items-start"
        ].join(" ");

        // carte principale (content_div)
        const content_div = document.createElement("div");
        content_div.className = [
            "relative",
            "flex", "flex-col",
            "rounded-lg", "rounded-t",
            "shadow",
            "w-full", "lg:w-1/4",
            "mx-auto",
            "border-2",
            "border-emerald-500/80",
            "shadow-[0_0_25px_rgba(16,185,129,0.65)]",
            "bg-gradient-to-b",
            "from-emerald-950/90",
            "via-slate-950/95",
            "to-black/95",
            "text-emerald-100"
        ].join(" ");

        // HEADER : bandeau nom / coords / faction + bouton close
        const header_container_div = document.createElement("div");
        header_container_div.className = [
            "relative",
            "md:p-4", "p-2",
            "flex", "flex-row",
            "items-center",
            "w-full",
            "bg-gradient-to-r",
            "from-emerald-700/90",
            "via-emerald-800/70",
            "to-emerald-900/40",
            "border-b",
            "border-emerald-500/70"
        ].join(" ");

        header_container_div.innerHTML = `
            <div 
                id="${modalId}-header-main"
                class="flex flex-1 flex-col items-center justify-center text-center gap-1"
            ></div>

            <button 
                type="button"
                data-close
                class="ml-2 w-7 h-7 flex items-center justify-center rounded-full 
                    border border-emerald-400/70 
                    bg-black/40 hover:bg-emerald-500/20 
                    shadow-[0_0_12px_rgba(16,185,129,0.75)]
                    transition"
            >
                <img 
                    src="/static/img/ux/close.svg" 
                    alt="Close" 
                    class="w-3 h-3 pointer-events-none"
                />
            </button>
        `;

        // BODY : zone scrollable
        const body_container_div = document.createElement("div");
        body_container_div.id = `${modalId}-body`;
        body_container_div.setAttribute("data-modal-body", "true");
        body_container_div.className = [
            "items-center",
            "md:p-5", "p-2",
            "max-h-[70vh]",
            "overflow-y-auto",
            "scrollbar-thin",
            "scrollbar-thumb-emerald-700",
            "scrollbar-track-black/40",
            "space-y-3",
            "mb-3"
        ].join(" ");

        // contenu par défaut (chargement)
        body_container_div.innerHTML = `
            <div class="w-full text-center text-emerald-200 text-sm py-4">
                Chargement...
            </div>
        `;

        // FOOTER : bouton fermer
        const footer_container_div = document.createElement("div");
        footer_container_div.className = [
            "md:p-4", "p-2",
            "flex", "flex-row",
            "w-full",
            "justify-end", "items-center",
            "border-t",
            "border-emerald-500/60"
        ].join(" ");

        footer_container_div.innerHTML = `
            <button
                type="button"
                data-close
                class="px-3 py-1 text-xs font-semibold rounded 
                    bg-emerald-700/80 hover:bg-emerald-500/80 
                    text-emerald-50
                    shadow-inner shadow-emerald-900/40
                    transition"
            >
                Fermer
            </button>
        `;

        content_div.appendChild(header_container_div);
        content_div.appendChild(body_container_div);
        content_div.appendChild(footer_container_div);

        container_div.appendChild(content_div);
        wrapper.appendChild(container_div);

        return wrapper;
    }

    // ============================================================
    // 6) Appeler le renderer adapté
    // ============================================================
    function renderModal(modalId, info, data) {

        if (info.type === "pc") {
            return window.create_pc_npc_modal(modalId, data);
        }

        if (info.type === "npc") {
            return window.create_pc_npc_modal(modalId, data);
        }

        if (info.type === "element") {
            const raw = data.element;
            // TODO si nécessaire converter foreground
            return window.create_foreground_modal(modalId, raw);
        }

        // fallback
        const body = document.getElementById(`${modalId}-body`);
        if (body) body.textContent = JSON.stringify(data, null, 2);
        }

    // ============================================================
    // 7) Fonction principale : ouverture du modal
    // ============================================================
    async function open(modalId) {

        const container = ensureContainer();
        const info = parseModalId(modalId);
        if (!info) return;

        const existing = container.firstElementChild;

        // 🟦 Cas 1 : Un modal existe déjà ET c’est le même → update
        if (existing && existing.id === modalId) {

            // 1) Fetch pour mise à jour
            try {
                const data = await fetchModalData(info);
                renderModal(modalId, info, data);

                // Réactiver WS
                if (window.ModalLiveUpdates && info.id !== null) {
                    window.ModalLiveUpdates.subscribe(info.type, info.id, modalId);
                }

            } catch (err) {
                console.error("Erreur update modal:", err);
            }

            return;
        }

        // 🟦 Cas 2 : Un modal existe mais l'ID est différent
        if (existing && existing.id !== modalId) {

            // désabonnement WS
            if (window.ModalLiveUpdates) {
                window.ModalLiveUpdates.unsubscribeAllForModal(existing.id);
            }

            existing.remove(); // suppression complète
        }

        // 🟦 Cas 3 : Aucun modal → créer
        const modalEl = createModalElement(modalId);
        container.appendChild(modalEl);

        // boutons fermer (header + footer)
        modalEl.querySelectorAll("[data-close]").forEach(btn => {
            btn.addEventListener("click", () => {
                if (window.ModalLiveUpdates) {
                    window.ModalLiveUpdates.unsubscribeAllForModal(modalId);
                }
                modalEl.remove();
            });
        });

        // fetch + render
        try {
            const data = await fetchModalData(info);
            renderModal(modalId, info, data);

            // Activer WS live update
            if (window.ModalLiveUpdates && info.id !== null) {
                window.ModalLiveUpdates.subscribe(info.type, info.id, modalId);
            }

        } catch (err) {
            console.error("Erreur création modal:", err);
            document.getElementById(`${modalId}-body`).textContent =
                "Erreur lors du chargement du modal.";
        }
    }

    window.ModalFactory = { open };

})();
