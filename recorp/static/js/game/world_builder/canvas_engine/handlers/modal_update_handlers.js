// =======================================================
// modal_live_updates.js
// Gestion des updates temps réel des modals (HP, AP, status…)
// =======================================================

(function () {
    if (window.ModalLiveUpdates) return;

    // ================================================
    // Stockage des abonnements :
    // key = "pc:24", value = { type, id, modalId }
    // ================================================
    const subscriptions = new Map();

    function makeKey(type, id) {
        return `${type}:${id}`;
    }

    // =================================================
    // S'abonner à un flux WS d'un objet (pc/npc/element)
    // =================================================
    function subscribe(type, id, modalId) {
        const key = makeKey(type, id);

        if (subscriptions.has(key)) return; // déjà abonné

        subscriptions.set(key, { type, id, modalId });

        if (window.ws && typeof window.ws.send === "function") {
            window.ws.send({
                type: "subscribe_modal_watch",
                message: JSON.stringify({
                    target_type: type,
                    target_id: id
                })
            });
        }
    }

    // =================================================
    // Désabonnement simple
    // =================================================
    function unsubscribe(type, id) {
        const key = makeKey(type, id);
        if (!subscriptions.has(key)) return;

        subscriptions.delete(key);

        if (window.ws && typeof window.ws.send === "function") {
            window.ws.send({
                type: "unsubscribe_modal_watch",
                message: JSON.stringify({
                    target_type: type,
                    target_id: id
                })
            });
        }
    }

    // =================================================
    // Désabonner TOUT ce qui est lié à un modal donné
    // Ex: fermeture du modal-pc_23 → retire pc:23
    // =================================================
    function unsubscribeAllForModal(modalId) {
        for (const [key, sub] of subscriptions) {
            if (sub.modalId === modalId) {
                subscriptions.delete(key);
                if (window.ws && typeof window.ws.send === "function") {
                    window.ws.send({
                        type: "unsubscribe_modal_watch",
                        message: JSON.stringify({
                            target_type: sub.type,
                            target_id: sub.id
                        })
                    });
                }
            }
        }
    }

    // =================================================
    // Handler appelé lorsque le WS reçoit un "modal_update"
    // =================================================
    function onWsMessage(data) {
        // Exemple reçu :
        // {
        //   type: "modal_update",
        //   target_type: "pc",
        //   target_id: 24,
        //   fields: { current_hp: 58, current_ap: 3 }
        // }

        const key = makeKey(data.target_type, data.target_id);
        const sub = subscriptions.get(key);
        if (!sub) return;

        const modalEl = document.getElementById(sub.modalId);
        if (!modalEl) return;

        // Pour chaque champ dans data.fields → maj du DOM
        Object.entries(data.fields).forEach(([fieldName, value]) => {
            const fieldEl = modalEl.querySelector(`[data-field="${fieldName}"]`);
            if (fieldEl) {
                fieldEl.textContent = value;
            }
        });
    }

    // Exposer l’API globale
    window.ModalLiveUpdates = {
        subscribe,
        unsubscribe,
        unsubscribeAllForModal,
        onWsMessage
    };
})();

export function handleModalUpdate(payload) {
    window.ModalLiveUpdates.onWsMessage(payload);
}