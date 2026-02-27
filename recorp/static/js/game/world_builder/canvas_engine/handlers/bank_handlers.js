function extractPayload(msg, rawMsg) {
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

function toMoneyNumber(value, fallback = null) {
    if (value == null || value === "") return fallback;
    const normalized = String(value).replace(",", ".");
    const num = Number(normalized);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(0, num);
}

function getCurrentPlayerId() {
    return window.GameState?.player?.currentPlayerId ?? window.current_player_id ?? null;
}

function applyToCurrentPlayerState(accountBalance, shipCredits) {
    const currentPlayer =
        window.GameState?.player?.currentPlayer ??
        window.currentPlayer ??
        null;

    if (currentPlayer && typeof currentPlayer === "object") {
        currentPlayer.user = currentPlayer.user || {};
        currentPlayer.ship = currentPlayer.ship || {};

        if (accountBalance != null) currentPlayer.user.credit_amount = accountBalance;
        if (shipCredits != null) currentPlayer.ship.ship_credits = shipCredits;

        if (window.GameState?.player) {
            window.GameState.player.currentPlayer = currentPlayer;
        }
        window.currentPlayer = currentPlayer;
    }

    if (window.currentPlayerState && typeof window.currentPlayerState === "object") {
        window.currentPlayerState.user = window.currentPlayerState.user || {};
        window.currentPlayerState.ship = window.currentPlayerState.ship || {};
        if (accountBalance != null) window.currentPlayerState.user.credit_amount = accountBalance;
        if (shipCredits != null) window.currentPlayerState.ship.ship_credits = shipCredits;
    }
}

export function handleBankBalanceUpdate(msg, rawMsg) {
    const payload = extractPayload(msg, rawMsg);
    const targetPlayerId = payload?.player_id ?? payload?.player ?? null;
    const localPlayerId = getCurrentPlayerId();

    if (targetPlayerId != null && localPlayerId != null) {
        if (String(targetPlayerId) !== String(localPlayerId)) return;
    }

    const balances = (payload?.balances && typeof payload.balances === "object")
        ? payload.balances
        : payload;

    const accountBalance = toMoneyNumber(
        balances?.account_balance ?? balances?.accountBalance,
        null
    );
    const shipCredits = toMoneyNumber(
        balances?.ship_credits ?? balances?.shipCredits,
        null
    );

    if (accountBalance == null && shipCredits == null) return;

    applyToCurrentPlayerState(accountBalance, shipCredits);

    window.BankModalController?.applyBalanceUpdate?.({
        account_balance: accountBalance,
        ship_credits: shipCredits,
        message: payload?.message || "",
        tone: "info",
    });

    if (typeof window.InventoryModalController?.render === "function") {
        window.InventoryModalController.render(
            window.GameState?.player?.currentPlayer ?? window.currentPlayer
        );
    }
}
