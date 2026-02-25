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

function notifyInventoryUiError(payload) {
    const text = payload?.message || payload?.reason || "Action failed";
    window.InventoryModalController?.showActionMessage?.(text, "error");
}

function setTextForAllIds(id, value) {
    if (value == null) return;
    document.querySelectorAll(`#${id}`).forEach((el) => {
        el.textContent = String(value);
    });
}

function setWidthForAllIds(id, current, max) {
    if (current == null || max == null) return;
    const currentNum = Number(current);
    const maxNum = Number(max);
    if (!Number.isFinite(currentNum) || !Number.isFinite(maxNum) || maxNum <= 0) return;
    const pct = Math.max(0, Math.min(100, (currentNum / maxNum) * 100));
    document.querySelectorAll(`#${id}`).forEach((el) => {
        el.style.width = `${pct}%`;
    });
}

function syncHudFromCurrentPlayerData(data) {
    const ship = data?.ship;
    const user = data?.user;
    if (!ship) return;

    setTextForAllIds("hp-container-value-min", ship.current_hp);
    setTextForAllIds("hp-container-value-max", ship.max_hp);
    setWidthForAllIds("hp-percent", ship.current_hp, ship.max_hp);

    setTextForAllIds("movement-container-value-min", ship.current_movement);
    setTextForAllIds("movement-container-value-current", ship.current_movement);
    setTextForAllIds("movement-container-value-max", ship.max_movement);
    setWidthForAllIds("mp-percent", ship.current_movement, ship.max_movement);

    if (user) {
        setTextForAllIds("actionPoint-container-value-min", user.current_ap);
        setTextForAllIds("ap-container-value-min", user.current_ap);
        setTextForAllIds("actionPoint-container-value-max", user.max_ap);
        setTextForAllIds("ap-container-value-max", user.max_ap);
    }

    const defenses = [
        ["ballistic", ship.current_ballistic_defense, ship.max_ballistic_defense],
        ["thermal", ship.current_thermal_defense, ship.max_thermal_defense],
        ["missile", ship.current_missile_defense, ship.max_missile_defense],
    ];

    defenses.forEach(([prefix, current, max]) => {
        setTextForAllIds(`${prefix}-container-value-min`, current);
        setTextForAllIds(`${prefix}-container-value-max`, max);
        setWidthForAllIds(`${prefix}-percent`, current, max);
    });
}

export function handleActionFailed(msg, rawMsg) {
    const payload = getMsgPayload(msg, rawMsg);
    console.warn("[action_failed]", payload);

    notifyInventoryUiError(payload);

    window.dispatchEvent?.(new CustomEvent("game:action_failed", { detail: payload }));
}

export function handleShipModuleLocalSync(msg) {
    const payload = getMsgPayload(msg);
    const data = payload?.data;
    if (!data || !data.user || !data.ship) return;

    window.currentPlayer = data;
    if (window.GameState?.player) {
        window.GameState.player.currentPlayer = data;
    }

    syncHudFromCurrentPlayerData(data);
    window.InventoryModalController?.applyServerState?.(payload);
}

export function handleScanTargetDataRefresh(msg) {
    const payload = getMsgPayload(msg);
    if (!payload?.target_key || !payload?.data) return;

    const targetKey = payload.target_key;

    // Ne rafraîchir que si le client possède déjà la donnée (scan direct/partagé)
    const hasScanData = Boolean(window.scannedModalData?.[targetKey]);
    const isScanned =
        window.scannedTargets?.has?.(targetKey) ||
        window.sharedTargets?.has?.(targetKey);

    if (!hasScanData && !isScanned) return;

    window.scannedModalData ??= {};
    window.scannedModalData[targetKey] = payload.data;

    if (typeof refreshModalAfterScan === "function") {
        refreshModalAfterScan(targetKey);
    }

    if (typeof window.refreshModalActionRanges === "function") {
        window.refreshModalActionRanges(`modal-${targetKey}`);
    }
}
