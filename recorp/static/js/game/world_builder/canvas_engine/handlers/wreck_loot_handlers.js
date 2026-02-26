function getMsgPayload(msg, rawMsg) {
    if (msg && typeof msg === "object" && msg.message && typeof msg.message === "object") {
        return msg.message;
    }
    if (msg && typeof msg === "object") {
        return msg;
    }
    if (rawMsg && typeof rawMsg === "object") {
        if (rawMsg.message && typeof rawMsg.message === "object") {
            return rawMsg.message;
        }
        return rawMsg;
    }
    return {};
}

export function handleWreckLootSessionState(msg, rawMsg) {
    const payload = getMsgPayload(msg, rawMsg);
    if (!payload || !payload.wreck_id) return;
    window.dispatchEvent?.(new CustomEvent("wreck:loot_state", { detail: payload }));
    window.WreckLootModalController?.applyServerState?.(payload);
}

export function handleWreckLootSessionClosed(msg, rawMsg) {
    const payload = getMsgPayload(msg, rawMsg);
    window.dispatchEvent?.(new CustomEvent("wreck:loot_closed", { detail: payload }));
    window.WreckLootModalController?.handleSessionClosed?.(payload);
}
