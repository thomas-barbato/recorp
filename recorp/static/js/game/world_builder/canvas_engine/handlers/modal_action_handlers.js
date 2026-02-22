function getGameState() {
    return window.GameState || null;
}

function getEngine() {
    return getGameState()?.canvasEngine ?? window.canvasEngine;
}

function getCurrentPlayerId() {
    return getGameState()?.currentPlayerId ?? window.current_player_id ?? null;
}

function requestWorldRedraw() {
    getEngine()?.renderer?.requestRedraw?.();
}

function ensureScanStores() {
    window.scannedTargets ??= new Set();
    window.sharedTargets ??= new Set();
    window.scannedModalData ??= {};
    window.scannedMeta ??= {};
}

function registerScanVisualEffect(targetKey, data, expiresAt, effect = "scan") {
    window.registerEffect?.(effect, targetKey, {
        expires_at: expiresAt,
        data,
    });

    window.scanExpiredLocal?.delete?.(targetKey);

    window.scheduleEffectVisualExpire?.(
        effect,
        targetKey,
        expiresAt
    );
}

function setScanData(targetKey, data) {
    ensureScanStores();
    window.scannedTargets.add(targetKey);
    if (data !== undefined) {
        window.scannedModalData[targetKey] = data;
    }
}

function setScanMeta(targetKey, expiresAt) {
    ensureScanStores();
    if (expiresAt) {
        window.scannedMeta[targetKey] = { expires_at: expiresAt };
    }
}

function renderScanFloatingTexts({ senderId, targetKey }) {
    if (senderId) {
        window.renderTextAboveTarget?.(senderId, "- 1 AP", "rgba(231, 0, 11, 0.95)");
    }
    if (targetKey) {
        window.renderTextAboveTarget?.(targetKey, "+ scan", "rgba(0,255,180,0.95)", "scan");
    }
}

function getOpenedModalTargetKey(openedId) {
    if (!openedId) return null;
    const parsed = window.define_modal_type?.(openedId);
    if (parsed?.type && parsed.id != null) {
        return `${parsed.type}_${parsed.id}`;
    }
    const m = openedId.match(/([a-z_]+_\d+)$/);
    return m ? m[1] : null;
}

export function getScanResult(msg) {
    
    if (!msg?.target_key || !msg?.data) return;
    const { target_key, data, expires_at} = msg;
    const remaning_ap = msg?.remaining_ap;
    const sender_id = `pc_${getCurrentPlayerId()}`;

    ensureScanStores();
    registerScanVisualEffect(target_key, data, expires_at, "scan");
    setScanData(target_key, data);
    setScanMeta(target_key, expires_at);

    requestWorldRedraw();

    syncCanvasPlayerAp(getCurrentPlayerId(), remaning_ap)
    
    renderScanFloatingTexts({ senderId: sender_id, targetKey: target_key });

    refreshModalAfterScan(target_key);
    refreshOpenedModalRanges();
}

export function sendScanResultToGroup(msg) {
    if (!msg?.recipients?.includes(getCurrentPlayerId())) return;
    if (!msg?.target_key) return;

    ensureScanStores();
    window.sharedTargets.add(msg.target_key);
    registerScanVisualEffect(msg.target_key, undefined, msg.expires_at, "share_scan");
    setScanMeta(msg.target_key, msg.expires_at);

    refreshModalAfterScan(msg.target_key);
    requestWorldRedraw();
    renderScanFloatingTexts({ targetKey: msg.target_key });
    refreshOpenedModalRanges();

}

export function handleScanStateSync(msg) {
    const targets = msg?.message?.targets || msg?.targets || [];

    ensureScanStores();

    // garder l'id du modal actuellement ouvert
    const openedModal = document.querySelector("#modal-container > .modal"); // adapte si besoin
    const openedId = openedModal?.id || null;

    targets.forEach(t => {
        if (!t?.target_key) return;

        registerScanVisualEffect(t.target_key, t.data, t.expires_at, "scan");
        setScanData(t.target_key, t.data);
        setScanMeta(t.target_key, t.expires_at);
    });

    //  redraw
    requestWorldRedraw();

    // si un modal est ouvert, le rafraîchir une seule fois
    if (openedId && typeof refreshModalAfterScan === "function") {
        const targetKey = getOpenedModalTargetKey(openedId);
        if (targetKey) refreshModalAfterScan(targetKey);
        refreshOpenedModalRanges();
    }
}

export function handleScanVisibilityUpdate(msg) {
    const remove = msg?.remove || [];
    if (!remove.length) return;

    ensureScanStores();

    remove.forEach(targetKey => {
        // Nettoyage état global
        window.clearScan(targetKey);
        delete window.scannedMeta[targetKey];
        delete window.scannedModalData?.[targetKey];

        // Si un modal est ouvert → rebuild
        const modalId = `modal-${targetKey}`;
        const modalEl = document.getElementById(modalId);

        if (modalEl) {
            // rebuild propre du modal en mode UNKNOWN
            if (typeof refreshModalAfterScan === "function") {
                refreshModalAfterScan(targetKey);
            }
        }
    });
    requestWorldRedraw();
    refreshOpenedModalRanges();
}

function syncCanvasPlayerAp(playerId, remainingAp) {
    const gs = window.GameState || null;
    const engine = gs?.canvasEngine ?? getEngine();
    if (!engine || !engine.map) return;

    const actor = engine.map.findPlayerById(playerId);
    if (!actor || !actor.data || !actor.data.ship) return;

    if (typeof remainingAp === "number") {
        if (gs?.updatePlayerAp) {
            gs.updatePlayerAp(playerId, remainingAp);
        } else if (window.currentPlayer?.user) {
            window.currentPlayer.user.current_ap = remainingAp;
        }
    }

    let progressBarApRemaining = document.getElementById("actionPoint-container-value-min");
    let progressBarApMaxEl = document.getElementById("actionPoint-container-value-max");
    let progressBarApMax = progressBarApMaxEl?.textContent;
    let progressBarApWidth = document.getElementById("ap-percent");
    let apRemaningText = document.getElementById("ap-container-value-min");

    if(progressBarApRemaining){
        progressBarApRemaining.textContent = remainingAp;
    }

    if(progressBarApMax){
        if(progressBarApWidth){
            let ap_percent = Math.max(0, Math.min(100, (remainingAp / parseInt(progressBarApMax)) * 100));
            progressBarApWidth.style.width = `${ap_percent}%`; 
        }
    }

    if(apRemaningText){
        apRemaningText.textContent = remainingAp;
    }
}

function refreshOpenedModalRanges() {
    const modal = document.querySelector("#modal-container > .modal");
    if (!modal) return;

    if (typeof window.refreshModalActionRanges === "function") {
        window.refreshModalActionRanges(modal.id);
    }
}

