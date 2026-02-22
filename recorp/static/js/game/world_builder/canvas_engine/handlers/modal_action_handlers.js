export function getScanResult(msg) {
    
    if (!msg?.target_key || !msg?.data) return;
    const { target_key, data, expires_at} = msg;
    const remaning_ap = msg?.remaining_ap;
    const sender_id = `pc_${window.current_player_id}`;

    window.scannedTargets ??= new Set();
    window.scannedModalData ??= {};
    window.scannedMeta ??= {};

    // scan timer status
    window.registerEffect("scan", target_key, {
        expires_at: expires_at,
        data: data,
    });

    /* Exemple:
    registerEffect("buff", "player_23:cloak", { expires_at });
    */

    // supprime l'ancienne instance de ce scan.
    window.scanExpiredLocal.delete(target_key);

    window.scheduleEffectVisualExpire(
        "scan",
        target_key,
        expires_at
    );

    // scan status
    window.scannedTargets.add(target_key);
    window.scannedModalData[target_key] = data;
    window.scannedMeta[target_key] = {
        expires_at: expires_at
    };

    window.canvasEngine?.renderer?.requestRedraw();

    syncCanvasPlayerAp(window.current_player_id, remaning_ap)
    
    window.renderTextAboveTarget(sender_id, "- 1 AP", "rgba(231, 0, 11, 0.95)");
    window.renderTextAboveTarget(target_key, "+ scan", "rgba(0,255,180,0.95)", "scan");

    refreshModalAfterScan(target_key);
    refreshOpenedModalRanges();
}

export function sendScanResultToGroup(msg) {
    if (!msg?.recipients?.includes(window.current_player_id)) return;
    if (!msg?.target_key) return;

    window.scannedTargets ??= new Set();
    window.sharedTargets ??= new Set();
    window.scannedMeta ??= {};

    window.registerEffect("share_scan", msg.target_key, {
        expires_at: msg.expires_at
    });

    if (msg.expires_at) {
        window.scannedMeta[msg.target_key] = {
            expires_at: msg.expires_at
        };
    }

    refreshModalAfterScan(msg.target_key);
    window.canvasEngine?.renderer?.requestRedraw();
    window.renderTextAboveTarget(msg.target_key, "+ scan", "rgba(0,255,180,0.95)", "scan")
    refreshOpenedModalRanges();

}

export function handleScanStateSync(msg) {
    const targets = msg?.message?.targets || msg?.targets || [];

    window.scannedTargets ??= new Set();
    window.sharedTargets ??= new Set();
    window.scannedModalData ??= {};
    window.scannedMeta ??= {};

    // garder l'id du modal actuellement ouvert
    const openedModal = document.querySelector("#modal-container > .modal"); // adapte si besoin
    const openedId = openedModal?.id || null;

    targets.forEach(t => {
        if (!t?.target_key) return;

        window.registerEffect("scan", t.target_key, {
            expires_at: t.expires_at,
            data: t.data,
        });

        // supprime l'ancienne instance de ce scan.
        window.scanExpiredLocal.delete(t.target_key);

        window.scheduleEffectVisualExpire(
            "scan",
            t.target_key,
            t.expires_at
        );

        window.scannedTargets.add(t.target_key);

        if (t.expires_at) {
            window.scannedMeta[t.target_key] = { expires_at: t.expires_at };
        }
        if (t.data) {
            window.scannedModalData[t.target_key] = t.data;
        }
    });

    //  redraw
    window.canvasEngine?.renderer?.requestRedraw();

    // si un modal est ouvert, le rafraîchir une seule fois
    if (openedId && typeof refreshModalAfterScan === "function") {
        // on extrait le targetKey
        const m = openedId.match(/(pc_\d+|npc_\d+)/);
        if (m) refreshModalAfterScan(m[1]);
        refreshOpenedModalRanges();
    }
}

export function handleScanVisibilityUpdate(msg) {
    const remove = msg?.remove || [];
    if (!remove.length) return;

    window.scannedTargets ??= new Set();
    window.sharedTargets ??= new Set();
    window.scannedMeta ??= {};

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
    window.canvasEngine?.renderer?.requestRedraw();
    refreshOpenedModalRanges();
}

function syncCanvasPlayerAp(playerId, remainingAp) {
    const engine = window.canvasEngine;
    if (!engine || !engine.map) return;

    const actor = engine.map.findPlayerById(playerId);
    if (!actor || !actor.data || !actor.data.ship) return;

    if (typeof remainingAp === "number") {
        window.currentPlayer.user.current_ap = remainingAp;
    }

    let progressBarApRemaining = document.getElementById("actionPoint-container-value-min");
    let progressBarApMax = document.getElementById("actionPoint-container-value-max").textContent;
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

