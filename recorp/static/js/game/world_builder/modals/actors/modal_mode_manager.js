(function () {

    function getBody(modalId) {
        return document.getElementById(`${modalId}-body`);
    }

    function enter(modalId, mode, context = {}) {

        const modal = document.getElementById(modalId);
        if (!modal) return;

        const body = getBody(modalId);
        if (!body) return;

        const headerClose = modal?.querySelector(`#${modalId}-header img[src$="close.svg"]`);
        const footerClose = modal?.querySelector("button"); // ton footer n'a qu’un bouton "close"

        if (headerClose) {
            headerClose.onclick = () => window.ModalModeManager.exit(modalId);
        }
        if (footerClose) {
            footerClose.onclick = () => window.ModalModeManager.exit(modalId);
        }

        modal.dataset.mode = mode;
        body.classList.remove("overflow-hidden");

        if (mode === "combat") {

            body.innerHTML = "";
            body.classList.remove("overflow-y-auto", "md:max-h-[70vh]", "max-h-[80vh]");
            body.classList.add("overflow-hidden");
            // container interne pour le combat
            const combatContainer = document.createElement("div");
            combatContainer.id = `${modalId}-combat-container`;
            combatContainer.classList.add("w-full", "h-full");

            body.append(combatContainer);

            if (window.ActionSceneManager?.open) {
                window.ActionSceneManager.open("combat", {
                    attackerKey: context.attackerKey,
                    targetKey: context.targetKey,
                    originalModalId: modalId,
                    mountNode: combatContainer
                });
            }
        }
    }

    function exit(modalId) {

        const modal = document.getElementById(modalId);
        if (!modal) return;

        const body = document.getElementById(`${modalId}-body`);
        if (!body) return;

        const cached = window.modalDataCache?.[modalId];
        if (!cached) return;

        // 🔥 Fermer proprement le combat
        if (window.ActionSceneManager?.close) {
            window.ActionSceneManager.close({ silent: true });
        }

        // 🔥 Supprimer complètement le modal existant
        modal.remove();

        // 🔥 Le recréer proprement (modal de base)
        if (typeof window.open_close_modal === "function") {
            open_close_modal(modalId);
        }

        modal.dataset.mode = "info";
    }
    
    // ---- Bridge global ----
    window.ModalModeManager = {
        enter,
        exit
    };

})();