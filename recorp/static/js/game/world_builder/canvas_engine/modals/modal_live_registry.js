// Global registry pour les modals "vivants" (PC / NPC)

(function () {
    const registry = new Map(); // targetKey -> { modalId, type, id, createdAt }

    function parseTargetKeyFromModalId(modalId) {
        if (!modalId || typeof modalId !== "string") return null;

        // modal-pc_12 / modal-npc_5 / modal-unknown-pc_12
        const raw = modalId.replace("modal-", "");
        const clean = raw.startsWith("unknown-")
            ? raw.replace("unknown-", "")
            : raw;

        if (!/^((pc|npc)_\d+)$/.test(clean)) return null;
        return clean;
    }

    function register(modalId) {
        const targetKey = parseTargetKeyFromModalId(modalId);
        if (!targetKey) return null;

        const [type, idStr] = targetKey.split("_");
        const id = parseInt(idStr, 10);

        registry.set(targetKey, {
            modalId,
            type,
            id,
            createdAt: Date.now(),
        });

        return targetKey;
    }

    function unregister(modalIdOrTargetKey) {
        if (!modalIdOrTargetKey) return;

        let targetKey = modalIdOrTargetKey;

        if (String(modalIdOrTargetKey).startsWith("modal-")) {
            targetKey = parseTargetKeyFromModalId(modalIdOrTargetKey);
        }

        if (!targetKey) return;
        registry.delete(targetKey);
    }

    function isOpen(targetKey) {
        if (!targetKey) return false;

        const entry = registry.get(targetKey);
        if (!entry?.modalId) return false;

        return Boolean(document.getElementById(entry.modalId));
    }

    function notify(targetKey, updateType, payload = {}) {
        if (!isOpen(targetKey)) return false;

        // Étape 2+ : ici on branchera les patchers DOM
        if (typeof window.onModalLiveUpdate === "function") {
            window.onModalLiveUpdate({ targetKey, updateType, payload });
        }

        return true;
    }

    // Exposition globale
    window.ModalLive = {
        _registry: registry,
        register,
        unregister,
        isOpen,
        notify,
        parseTargetKeyFromModalId,
    };
})();
