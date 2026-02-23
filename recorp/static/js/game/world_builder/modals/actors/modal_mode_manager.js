(function () {
    const actionSceneCloseMetaByModalId = new Map();

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

    function getLastActionSceneCloseMeta(modalId) {
        return actionSceneCloseMetaByModalId.get(modalId) || null;
    }

    function consumeLastActionSceneCloseMeta(modalId) {
        const meta = getLastActionSceneCloseMeta(modalId);
        actionSceneCloseMetaByModalId.delete(modalId);
        return meta;
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

        const lastSceneClose = consumeLastActionSceneCloseMeta(modalId);

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

        // Combat death: the original target modal (pc_/npc_) can no longer be fetched.
        // If a wreck was spawned for the dead target, reopen the wreck modal instead.
        if (lastSceneClose?.reason === "combat_death") {
            const payload = lastSceneClose?.payload || {};
            const deadKey = payload.dead_key ? String(payload.dead_key) : null;
            const wreckKey = payload.wreck_key ? String(payload.wreck_key) : null;
            if (wreckKey && deadKey && deadKey === targetKey) {
                reopenId = `modal-${wreckKey}`;
            } else if (deadKey && deadKey === targetKey) {
                // No wreck payload available: just close, don't refetch a dead target modal (HTTP 400).
                modal.remove();
                return;
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

    window.addEventListener("actionscene:close", (e) => {
        const detail = e?.detail;
        const modalId = detail?.context?.originalModalId;
        const meta = detail?.meta || null;
        if (!modalId || !meta) return;
        actionSceneCloseMetaByModalId.set(modalId, meta);
    });

})();
