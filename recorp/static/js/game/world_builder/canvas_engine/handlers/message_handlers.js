// static/js/world_builder/canvas_engine/handlers/message_handlers.js
// Gestion des notifications de messages privés depuis le WebSocket
// Utilise les fonctions exposées par world_builder/modals/message_modal.js

export function handleIncomingPrivateMessage(payload) {
    let data = typeof payload === "string" ? JSON.parse(payload) : payload;

    // data = { recipient_id, note }
    const note = data.note || gettext?.("You have received a private message");

    // Afficher la notification
    if (window.showPrivateMessageNotification) {
        window.showPrivateMessageNotification(note);
    }

    // Mettre à jour les compteurs
    if (window.loadUnreadCount) {
        window.loadUnreadCount();
    }

    // Si le modal est ouvert → refresh liste
    const modal = document.getElementById("message-modal");
    if (modal && !modal.classList.contains("hidden") && window.loadMessages) {
        window.loadMessages();
    }
    // Si le modal est ouvert → afficher un toast interne
    if (modal && !modal.classList.contains("hidden") && window.showToast) {
        window.showToast(note, true);
    }
}

// Message pour AUTEUR
export function handlePrivateMessageSent(payload) {
    let data = typeof payload === "string" ? JSON.parse(payload) : payload;
    
    // Optionnel : toast visuel
    if (window.showToast) {
        window.showToast(gettext("Message sent ✓"), true);
    }

    // Recharger la count list
    if (window.loadMessages) {
        window.loadMessages();
    }
}
