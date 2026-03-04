function normalizePayload(payload) {
    if (typeof payload === "string") {
        try {
            return JSON.parse(payload);
        } catch (_) {
            return {};
        }
    }
    return payload && typeof payload === "object" ? payload : {};
}

function getQueue() {
    if (!window.__groupModalQueue || typeof window.__groupModalQueue !== "object") {
        window.__groupModalQueue = {
            stateSync: null,
            invitations: [],
            feedback: [],
        };
    }
    return window.__groupModalQueue;
}

function applyGroupRuntimeState(payload) {
    const snapshot = normalizePayload(payload);
    if (typeof window.applyGroupStateSnapshot === "function") {
        window.applyGroupStateSnapshot(snapshot);
    } else {
        window.__pendingGroupStateSnapshot = snapshot;
    }
}

let groupRuntimeBootstrapStarted = false;

async function bootstrapGroupRuntimeFromHttp() {
    if (groupRuntimeBootstrapStarted) return;
    groupRuntimeBootstrapStarted = true;

    try {
        const response = await fetch("/group/state/", {
            headers: { "X-Requested-With": "XMLHttpRequest" },
        });
        const data = await response.json();
        if (!data?.ok) return;
        applyGroupRuntimeState(data.state || {});
    } catch (_) {
        // Silent fallback: runtime state will still update via websocket sync.
    }
}

export function handleGroupStateSync(payload) {
    const data = normalizePayload(payload);
    applyGroupRuntimeState(data);
    const controller = window.GroupModalController;
    if (controller?.onGroupStateSync) {
        controller.onGroupStateSync(data);
        return;
    }
    getQueue().stateSync = data;
}

export function handleGroupInvitation(payload) {
    const data = normalizePayload(payload);
    const controller = window.GroupModalController;
    if (controller?.onGroupInvitation) {
        controller.onGroupInvitation(data);
        return;
    }
    getQueue().invitations.push(data);
}

export function handleGroupActionFeedback(payload) {
    const data = normalizePayload(payload);
    const controller = window.GroupModalController;
    if (controller?.onGroupActionFeedback) {
        controller.onGroupActionFeedback(data);
        return;
    }
    getQueue().feedback.push(data);
}

// Prime local group runtime once at startup (even before first WS group sync).
if (typeof window !== "undefined") {
    window.setTimeout(() => {
        bootstrapGroupRuntimeFromHttp();
    }, 0);
}
