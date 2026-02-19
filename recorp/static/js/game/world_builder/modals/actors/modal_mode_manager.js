(function () {

    function getBody(modalId) {
        return document.getElementById(`${modalId}-body`);
    }

    function enter(modalId, mode, context = {}) {

        const modal = document.getElementById(modalId);
        if (!modal) return;

        const body = getBody(modalId);
        if (!body) return;

        modal.dataset.mode = mode;

        if (mode === "combat") {

            body.innerHTML = "";

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

        const body = getBody(modalId);
        if (!body) return;

        const cached = window.modalDataCache?.[modalId];
        if (!cached) return;

        body.innerHTML = "";

        const parsed = define_modal_type(modalId);
        if (!parsed) return;

        if (window.ActionSceneManager?.close) {
            window.ActionSceneManager.close();
        }

        if (window.ActionSceneManager?.close) {
            window.ActionSceneManager.close({ silent: true });
        }

        if (typeof window.open_close_modal === "function") {
            // close
            open_close_modal(modalId);
            // reopen proprement
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