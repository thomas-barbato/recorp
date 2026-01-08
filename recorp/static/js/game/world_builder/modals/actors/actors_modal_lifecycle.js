// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {

    function checkIfModalExists(modalId) {
        return document.getElementById(modalId) !== null;
    }

    function refreshModalIfOpen(modalId) {
        const el = document.getElementById(modalId);
        if (!el) return false; // pas ouvert

        // close puis open
        open_close_modal(modalId);
        open_close_modal(modalId);
        return true;
    }

    // ⚠️ Extraction fidèle de TON modals.js
    async function open_close_modal(modalId) {
        if (!modalId || typeof modalId !== "string") return;

        const modalContainer = document.getElementById("modal-container");
        if (!modalContainer) return;

        // 1) Toggle close si même modal déjà ouvert
        const existing = document.getElementById(modalId);
        if (existing) {
            existing.remove();
            return;
        }

        // Un seul modal à la fois
        modalContainer.innerHTML = "";

        // 2) Création du conteneur modal (VIDE)
        const modal = document.createElement("div");
        modal.id = modalId;
        modal.className = "absolute inset-0 pointer-events-auto z-50";

        modalContainer.appendChild(modal);

        // 3) Loader GLOBAL (dans modal-container)
        const loader = document.createElement("div");
        loader.id = "modal-loader";
        loader.className = `
            absolute inset-0 flex items-center justify-center
            bg-black/60 backdrop-blur-sm z-40
            text-emerald-400 font-semibold
        `;
        loader.innerText = "Transmission en cours…";

        modalContainer.appendChild(loader);

        // 4) Parse modalId
        const raw = modalId.replace("modal-", "");
        const isUnknown = raw.startsWith("unknown-");
        const clean = isUnknown ? raw.replace("unknown-", "") : raw;

        const [elementType, elementIdStr] = clean.split("_");
        const elementId = parseInt(elementIdStr, 10);

        if (!elementType || Number.isNaN(elementId)) {
            loader.remove();
            console.warn("Invalid modalId:", modalId);
            return;
        }

        // 5) Fetch backend (ou cache scan)
        let responseData;
        const targetKey = `${elementType}_${elementId}`;

        try {
            if (window.scannedModalData?.[targetKey]) {
                responseData = {
                    target: window.scannedModalData[targetKey],
                    current_player: window.currentPlayerState,
                    __fromScan: true
                };
            } else {
                const res = await fetch(`/play/modal-data/${elementType}/${elementId}/`, {
                    headers: { "X-Requested-With": "XMLHttpRequest" }
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                responseData = await res.json();
            }
        } catch (err) {
            console.error("Modal fetch failed:", err);
            loader.innerText = "Erreur de transmission";
            return;
        }

        // 6) Contexte UI (UNKNOWN = front only)
        responseData.__ui = {
            isUnknown,
            scanned: Boolean(window.scannedTargets?.has(targetKey))
        };

        // 7) Construction réelle du modal
        try {
            const parsed = define_modal_type(modalId);
            if (!parsed) {
                console.error("define_modal_type failed (parse)");
                loader.remove();
                return;
            }

            const extractedDataForModal = {
                found: true,
                type: parsed.type,
                data: responseData.target,
                current_player: responseData.current_player,
                __fromScan: responseData.__fromScan === true,
                __ui: responseData.__ui
            };

            create_modal(modalId, parsed, extractedDataForModal);

            modal.remove();

            const built = document.getElementById(modalId);
            if (built) built.classList.remove("hidden");
            loader.remove();
            
        } catch (e) {
            console.error("define_modal_type failed:", e);
            loader.innerText = "Erreur de décodage";
            return;
        }
    }

    // Exposition globale + bridge legacy
    window.ModalLifecycle = {
        open_close_modal,
        checkIfModalExists,
        refreshModalIfOpen
    };

    window.open_close_modal = open_close_modal;
    window.checkIfModalExists = checkIfModalExists;
    window.refreshModalIfOpen = refreshModalIfOpen;

})();
