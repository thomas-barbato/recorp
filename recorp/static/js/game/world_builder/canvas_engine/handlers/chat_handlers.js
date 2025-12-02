// static/js/world_builder/canvas_engine/handlers/chat_handlers.js
// Gestion des messages de chat reçus via WebSocket
// S'appuie sur les helpers exposés par world_builder/modals/chat_modal.js

export function handleIncomingChatMessage(payload) {
    let data = payload;

    try {
        if (typeof payload === "string") {
            data = JSON.parse(payload);
        }
    } catch (e) {
        console.error("[Chat Handler] Invalid JSON payload:", payload, e);
        return;
    }

    const channel = data.channel_type || data.channel || "sector";

    // 1) Ajout du message dans le bon container (sector/faction/group)
    if (typeof window.appendMessage === "function") {
        window.appendMessage({ ...data, channel });
    } else {
        console.warn("[Chat Handler] window.appendMessage is not defined");
    }

    // 2) Gestion des compteurs "unread" par channel
    const modal = document.getElementById("chat-modal");
    const isOpen = modal && !modal.classList.contains("hidden");

    const currentChannel = typeof window.getCurrentChannel === "function"
        ? window.getCurrentChannel()
        : "sector";

    if (!isOpen || channel !== currentChannel) {
        if (typeof window.incrementUnreadCount === "function") {
            window.incrementUnreadCount(channel);
        } else {
            console.warn(
                "[Chat Handler] window.incrementUnreadCount is not defined"
            );
        }
    } else {
        if (typeof window.markChannelAsRead === "function") {
            window.markChannelAsRead(channel);
        } else {
            console.warn(
                "[Chat Handler] window.markChannelAsRead is not defined"
            );
        }
    }
}
