(function () {
    function getActionSceneManager() {
        return window.ActionSceneManager || null;
    }

    function openModalById(modalId) {
        if (typeof window.open_close_modal === "function") {
            window.open_close_modal(modalId);
        }
    }

    function isTargetScanned(targetKey) {
        return window.isScanned?.(targetKey) === true;
    }

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

            if (getActionSceneManager()?.open) {
                getActionSceneManager().open("combat", {
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

        // Fermer proprement la scène combat
        if (getActionSceneManager()?.close) {
            getActionSceneManager().close({ silent: true });
        }

        // Déduire la targetKey depuis modalId :
        // modal-npc_1223 / modal-unknown-npc_1223 => npc_1223
        const raw = modalId.replace("modal-", "");
        const targetKey = raw.startsWith("unknown-") ? raw.replace("unknown-", "") : raw;

        // Choisir le bon modalId à rouvrir (UNKNOWN si hors sonar ET non scanné)
        let reopenId = `modal-${targetKey}`;

        const isPcOrNpc = targetKey.startsWith("pc_") || targetKey.startsWith("npc_");
        if (isPcOrNpc) {
            const inSonar = window.isTargetInSonarRange?.(targetKey) === true;
            const scanned = isTargetScanned(targetKey);

            if (!inSonar && !scanned) {
                reopenId = `modal-unknown-${targetKey}`;
            }
        }

        // Fermer l'actuel modal (on le retire du DOM)
        modal.remove();

        // Réouvrir le bon modal
        openModalById(reopenId);
    }
    
    // ---- Bridge global ----
    window.ModalModeManager = {
        enter,
        exit
    };

})();
