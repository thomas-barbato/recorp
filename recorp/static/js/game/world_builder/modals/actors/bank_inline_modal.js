(function () {
    const MONEY_DRAFT_PATTERN = /^\d*(?:[.,]\d{0,2})?$/;
    const MONEY_FINAL_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

    const state = {
        inline: null,
        accountBalance: 0,
        shipCredits: 0,
        infoMessage: "",
        infoTone: "info",
        busy: false,
        searchTimer: null,
        searchToken: 0,
    };

    function t(text) {
        if (typeof gettext === "function") return gettext(text);
        return text;
    }

    function toMoneyNumber(value, fallback = 0) {
        if (value == null || value === "") return fallback;
        const normalized = String(value).trim().replace(",", ".");
        const num = Number(normalized);
        if (!Number.isFinite(num)) return fallback;
        return Math.max(0, Math.round(num * 100) / 100);
    }

    function formatCredits(value) {
        const amount = toMoneyNumber(value, 0);
        try {
            return new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch (_) {
            return amount.toFixed(2);
        }
    }

    function getCsrfToken() {
        return document.querySelector("[name=csrfmiddlewaretoken]")?.value || window.csrf_token || "";
    }

    function getLanguagePrefix() {
        const pathname = String(window.location.pathname || "/");
        const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
        if (/^[a-z]{2}(?:-[a-z]{2})?$/i.test(firstSegment)) return `/${firstSegment}`;
        return "";
    }

    function buildLocalizedPath(path) {
        const normalized = path.startsWith("/") ? path : `/${path}`;
        const prefix = getLanguagePrefix();
        if (!prefix) return normalized;
        if (normalized.startsWith(`${prefix}/`) || normalized === prefix) return normalized;
        return `${prefix}${normalized}`;
    }

    function getCurrentPlayerFallback(modalId) {
        const cached = window.modalDataCache?.[modalId]?.current_player || null;
        if (cached) return cached;
        return window.GameState?.player?.currentPlayer || window.currentPlayer || null;
    }

    function extractBalances(currentPlayer) {
        const userPayload = currentPlayer?.user || currentPlayer?.player || {};
        const shipPayload = currentPlayer?.ship || {};

        return {
            accountBalance: toMoneyNumber(userPayload?.credit_amount ?? userPayload?.credits ?? 0, 0),
            shipCredits: toMoneyNumber(shipPayload?.ship_credits ?? shipPayload?.credits ?? 0, 0),
        };
    }

    function normalizeCoordinates(coords) {
        if (!coords || typeof coords !== "object") return null;
        const x = Number(coords.x);
        const y = Number(coords.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return { x: Math.trunc(x), y: Math.trunc(y) };
    }

    function resolveBankLocationInfo(modalId, providedName, providedCoordinates) {
        const nameCandidate = String(providedName || "").trim();
        const coordsCandidate = normalizeCoordinates(providedCoordinates);
        if (nameCandidate || coordsCandidate) {
            return {
                name: nameCandidate || "",
                coordinates: coordsCandidate,
            };
        }

        const target = window.modalDataCache?.[modalId]?.data || null;
        return {
            name: String(target?.name || target?.displayed_name || "").trim(),
            coordinates: normalizeCoordinates(target?.coordinates),
        };
    }

    function applyBankHeaderTitle(modalId, locationInfo) {
        const headerEl = document.getElementById(`${modalId}-header`);
        if (!headerEl) return;

        const bankLabel = t("Bank");
        const name = String(locationInfo?.name || "").trim();
        const coords = locationInfo?.coordinates || null;

        // Foreground modal path: custom spans with [data-role="coordinates"].
        const coordEl = headerEl.querySelector('[data-role="coordinates"]');
        const nameEl = coordEl?.previousElementSibling || null;
        if (nameEl) {
            if (name) {
                nameEl.textContent = `${name} ${bankLabel} -`;
            } else {
                nameEl.textContent = `${bankLabel} -`;
            }
            // IMPORTANT: coordinates stay untouched on purpose.
            return;
        }

        // Generic fallback for shells using h3 title.
        const titleEl = headerEl.querySelector("h3");
        if (!titleEl) return;

        if (name && coords) {
            titleEl.textContent = `${name} ${bankLabel} - [Y:${coords.y}, X:${coords.x}]`;
            return;
        }
        if (name) {
            titleEl.textContent = `${name} ${bankLabel}`;
            return;
        }
        if (coords) {
            titleEl.textContent = `${bankLabel} - [Y:${coords.y}, X:${coords.x}]`;
            return;
        }
        titleEl.textContent = bankLabel;
    }

    function ensureMountNode() {
        return state.inline?.mountNode || null;
    }

    function clearAutocompleteBox(box) {
        if (!box) return;
        box.innerHTML = "";
        box.classList.add("is-hidden");
    }

    function setInfo(text, tone = "info") {
        state.infoMessage = String(text || "");
        state.infoTone = tone === "error" ? "error" : "info";
        renderInfoMessage();
    }

    function renderInfoMessage() {
        const slot = state.inline?.elements?.messageSlot;
        if (!slot) return;

        slot.innerHTML = "";
        if (!state.infoMessage) return;

        const info = document.createElement("div");
        info.className = `bank-inline-message${state.infoTone === "error" ? " is-error" : ""}`;
        info.textContent = state.infoMessage;
        slot.appendChild(info);
    }

    function setBusy(flag) {
        state.busy = Boolean(flag);
        const root = ensureMountNode();
        if (!root) return;
        root.querySelectorAll(".bank-inline-btn").forEach((btn) => {
            btn.disabled = state.busy;
        });
    }

    function createInput({ type = "text", placeholder = "" } = {}) {
        const input = document.createElement("input");
        input.type = type;
        input.placeholder = placeholder;
        input.className = "bank-inline-input";
        return input;
    }

    function createButton(label) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bank-inline-btn";
        btn.textContent = label;
        return btn;
    }

    function createStatCard(label, value, tone = "normal") {
        const card = document.createElement("div");
        card.className = `bank-inline-stat-card${tone === "accent" ? " is-accent" : ""}`;

        const labelEl = document.createElement("div");
        labelEl.className = "bank-inline-label";
        labelEl.textContent = label;

        const valueEl = document.createElement("div");
        valueEl.className = "bank-inline-value";
        valueEl.textContent = value;

        card.append(labelEl, valueEl);
        return { card, valueEl };
    }

    function markInputInvalid(input, isInvalid) {
        if (!input) return;
        input.classList.toggle("is-invalid", Boolean(isInvalid));
    }

    function parseAmountFromInput(input) {
        const raw = String(input?.value || "").trim();

        if (!raw || !MONEY_FINAL_PATTERN.test(raw)) {
            return {
                ok: false,
                message: t("Invalid amount. Allowed: digits and optional '.' or ',' with up to 2 decimals."),
            };
        }

        const amount = toMoneyNumber(raw, null);
        if (amount == null || amount <= 0) {
            return {
                ok: false,
                message: t("Enter an amount greater than zero."),
            };
        }

        return { ok: true, amount };
    }

    function bindAmountDraftValidation(input) {
        if (!input) return;

        input.addEventListener("input", () => {
            const raw = String(input.value || "").trim();
            if (!raw || MONEY_DRAFT_PATTERN.test(raw)) {
                markInputInvalid(input, false);
                return;
            }

            markInputInvalid(input, true);
            setInfo(
                t("Only digits and optional decimal separator ('.' or ',') are allowed."),
                "error"
            );
        });
    }

    function refreshBalanceUi() {
        const els = state.inline?.elements;
        if (!els) return;
        if (els.accountValueEl) {
            els.accountValueEl.textContent = `${formatCredits(state.accountBalance)} CR`;
        }
        if (els.shipValueEl) {
            els.shipValueEl.textContent = `${formatCredits(state.shipCredits)} CR`;
        }
    }

    function syncCurrentPlayerSnapshot() {
        const accountBalance = toMoneyNumber(state.accountBalance, 0);
        const shipCredits = toMoneyNumber(state.shipCredits, 0);

        const modalId = state.inline?.modalId;
        const cached = modalId ? window.modalDataCache?.[modalId]?.current_player : null;
        if (cached && typeof cached === "object") {
            cached.user = cached.user || {};
            cached.ship = cached.ship || {};
            cached.user.credit_amount = accountBalance;
            cached.ship.ship_credits = shipCredits;
        }

        const localCurrentPlayer = window.GameState?.player?.currentPlayer || window.currentPlayer;
        if (localCurrentPlayer && typeof localCurrentPlayer === "object") {
            localCurrentPlayer.user = localCurrentPlayer.user || {};
            localCurrentPlayer.ship = localCurrentPlayer.ship || {};
            localCurrentPlayer.user.credit_amount = accountBalance;
            localCurrentPlayer.ship.ship_credits = shipCredits;
        }

        if (window.GameState?.player?.currentPlayer) {
            window.GameState.player.currentPlayer = localCurrentPlayer || window.GameState.player.currentPlayer;
        }
        if (localCurrentPlayer) {
            window.currentPlayer = localCurrentPlayer;
        }
        if (window.currentPlayerState && typeof window.currentPlayerState === "object") {
            window.currentPlayerState.user = window.currentPlayerState.user || {};
            window.currentPlayerState.ship = window.currentPlayerState.ship || {};
            window.currentPlayerState.user.credit_amount = accountBalance;
            window.currentPlayerState.ship.ship_credits = shipCredits;
        }

        if (typeof window.InventoryModalController?.render === "function") {
            window.InventoryModalController.render(localCurrentPlayer || window.currentPlayer);
        }
    }

    function applyBalancesSnapshot(balances = {}) {
        state.accountBalance = toMoneyNumber(
            balances.account_balance ?? balances.accountBalance,
            state.accountBalance
        );
        state.shipCredits = toMoneyNumber(
            balances.ship_credits ?? balances.shipCredits,
            state.shipCredits
        );
        refreshBalanceUi();
        syncCurrentPlayerSnapshot();
    }

    async function postBankAction(endpoint, payload) {
        const response = await fetch(buildLocalizedPath(endpoint), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": getCsrfToken(),
            },
            body: JSON.stringify(payload || {}),
        });

        let data = {};
        try {
            data = await response.json();
        } catch (_) {
            data = {};
        }

        if (!response.ok || data?.ok === false) {
            const message = String(data?.message || t("Bank action failed."));
            const error = new Error(message);
            error.payload = data;
            throw error;
        }

        return data;
    }

    async function runBankAction(executor) {
        if (state.busy) return null;

        setBusy(true);
        try {
            const data = await executor();
            if (data?.balances) applyBalancesSnapshot(data.balances);
            setInfo(data?.message || t("Operation completed."), "info");
            return data;
        } catch (err) {
            setInfo(err?.message || t("Bank action failed."), "error");
            return null;
        } finally {
            setBusy(false);
        }
    }

    async function handleWithdraw(amountInput) {
        const parsed = parseAmountFromInput(amountInput);
        if (!parsed.ok) {
            markInputInvalid(amountInput, true);
            setInfo(parsed.message, "error");
            return;
        }

        markInputInvalid(amountInput, false);
        const data = await runBankAction(() =>
            postBankAction("/bank/withdraw-to-ship/", { amount: parsed.amount.toFixed(2) })
        );
        if (data) amountInput.value = "";
    }

    async function handleDeposit(amountInput) {
        const parsed = parseAmountFromInput(amountInput);
        if (!parsed.ok) {
            markInputInvalid(amountInput, true);
            setInfo(parsed.message, "error");
            return;
        }

        markInputInvalid(amountInput, false);
        const data = await runBankAction(() =>
            postBankAction("/bank/deposit-to-account/", { amount: parsed.amount.toFixed(2) })
        );
        if (data) amountInput.value = "";
    }

    async function handleTransfer(recipientInput, recipientIdInput, amountInput, autocompleteBox) {
        const recipient = String(recipientInput?.value || "").trim();
        const recipientIdRaw = String(recipientIdInput?.value || "").trim();

        if (!recipient && !recipientIdRaw) {
            setInfo(t("Enter a recipient."), "error");
            return;
        }

        const parsed = parseAmountFromInput(amountInput);
        if (!parsed.ok) {
            markInputInvalid(amountInput, true);
            setInfo(parsed.message, "error");
            return;
        }

        markInputInvalid(amountInput, false);

        const payload = {
            recipient,
            amount: parsed.amount.toFixed(2),
        };
        if (recipientIdRaw) {
            const recipientId = Number.parseInt(recipientIdRaw, 10);
            if (Number.isFinite(recipientId) && recipientId > 0) {
                payload.recipient_id = recipientId;
            }
        }

        const data = await runBankAction(() =>
            postBankAction("/bank/transfer-to-player/", payload)
        );

        if (data) {
            amountInput.value = "";
            recipientIdInput.value = "";
            clearAutocompleteBox(autocompleteBox);
        }
    }

    function renderRecipientAutocomplete(autocompleteBox, recipientInput, recipientIdInput, results) {
        if (!autocompleteBox) return;
        autocompleteBox.innerHTML = "";

        if (!Array.isArray(results) || !results.length) {
            autocompleteBox.classList.add("is-hidden");
            return;
        }

        results.forEach((entry) => {
            const row = document.createElement("button");
            row.type = "button";
            row.className = "bank-inline-autocomplete-item";
            row.textContent = `${entry.name || ""} - ${entry.faction || ""}`;
            row.addEventListener("mousedown", (event) => {
                event.preventDefault();
                recipientInput.value = entry.name || "";
                recipientIdInput.value = String(entry.id || "");
                clearAutocompleteBox(autocompleteBox);
            });
            autocompleteBox.appendChild(row);
        });

        autocompleteBox.classList.remove("is-hidden");
    }

    function bindRecipientAutocomplete(recipientInput, recipientIdInput, autocompleteBox) {
        if (!recipientInput || !recipientIdInput || !autocompleteBox) return;

        const search = async () => {
            const query = String(recipientInput.value || "").trim();
            recipientIdInput.value = "";

            if (query.length < 2) {
                clearAutocompleteBox(autocompleteBox);
                return;
            }

            const token = ++state.searchToken;

            try {
                const response = await fetch(
                    buildLocalizedPath(`/messages/search_players/?q=${encodeURIComponent(query)}`)
                );
                const data = await response.json();
                if (token !== state.searchToken) return;
                const results = Array.isArray(data?.results) ? data.results : [];
                renderRecipientAutocomplete(autocompleteBox, recipientInput, recipientIdInput, results);
            } catch (_) {
                if (token !== state.searchToken) return;
                clearAutocompleteBox(autocompleteBox);
            }
        };

        recipientInput.addEventListener("input", () => {
            clearTimeout(state.searchTimer);
            state.searchTimer = setTimeout(search, 250);
        });

        recipientInput.addEventListener("blur", () => {
            setTimeout(() => clearAutocompleteBox(autocompleteBox), 120);
        });
    }

    function render() {
        const mountNode = ensureMountNode();
        if (!mountNode) return;

        const root = document.createElement("div");
        root.className = "bank-inline-root";

        const summary = document.createElement("section");
        summary.className = "bank-inline-summary";
        const accountCard = createStatCard(
            t("Account Balance"),
            `${formatCredits(state.accountBalance)} CR`,
            "accent"
        );
        const shipCard = createStatCard(
            t("Ship Credits"),
            `${formatCredits(state.shipCredits)} CR`
        );
        summary.append(accountCard.card, shipCard.card);
        root.appendChild(summary);

        const withdrawSection = document.createElement("section");
        withdrawSection.className = "bank-inline-section";
        const withdrawTitle = document.createElement("div");
        withdrawTitle.className = "bank-inline-label";
        withdrawTitle.textContent = t("Withdraw To Ship");
        const withdrawHint = document.createElement("p");
        withdrawHint.className = "bank-inline-hint";
        withdrawHint.textContent = t("Move credits from your protected account to your current ship hold.");
        const withdrawRow = document.createElement("div");
        withdrawRow.className = "bank-inline-row";
        const withdrawAmountInput = createInput({ type: "text", placeholder: t("Amount") });
        bindAmountDraftValidation(withdrawAmountInput);
        const withdrawBtn = createButton(t("Withdraw"));
        withdrawBtn.addEventListener("click", () => handleWithdraw(withdrawAmountInput));
        withdrawRow.append(withdrawAmountInput, withdrawBtn);
        withdrawSection.append(withdrawTitle, withdrawHint, withdrawRow);
        root.appendChild(withdrawSection);

        const depositSection = document.createElement("section");
        depositSection.className = "bank-inline-section";
        const depositTitle = document.createElement("div");
        depositTitle.className = "bank-inline-label";
        depositTitle.textContent = t("Deposit To Account");
        const depositHint = document.createElement("p");
        depositHint.className = "bank-inline-hint";
        depositHint.textContent = t("Move credits from your current ship hold to your protected account.");
        const depositRow = document.createElement("div");
        depositRow.className = "bank-inline-row";
        const depositAmountInput = createInput({ type: "text", placeholder: t("Amount") });
        bindAmountDraftValidation(depositAmountInput);
        const depositBtn = createButton(t("Deposit"));
        depositBtn.addEventListener("click", () => handleDeposit(depositAmountInput));
        depositRow.append(depositAmountInput, depositBtn);
        depositSection.append(depositTitle, depositHint, depositRow);
        root.appendChild(depositSection);

        const transferSection = document.createElement("section");
        transferSection.className = "bank-inline-section";
        const transferTitle = document.createElement("div");
        transferTitle.className = "bank-inline-label";
        transferTitle.textContent = t("Transfer Funds");
        const transferHint = document.createElement("p");
        transferHint.className = "bank-inline-hint";
        transferHint.textContent = t("Send credits from your bank account to another player account.");
        const transferRow = document.createElement("div");
        transferRow.className = "bank-inline-row bank-inline-row-split";
        const recipientWrap = document.createElement("div");
        recipientWrap.className = "bank-inline-recipient-wrap";
        const recipientInput = createInput({ type: "text", placeholder: t("Recipient") });
        recipientInput.autocomplete = "off";
        const recipientIdInput = document.createElement("input");
        recipientIdInput.type = "hidden";
        const recipientAutocomplete = document.createElement("div");
        recipientAutocomplete.className = "bank-inline-autocomplete is-hidden";
        recipientWrap.append(recipientInput, recipientIdInput, recipientAutocomplete);
        const transferAmountInput = createInput({ type: "text", placeholder: t("Amount") });
        bindAmountDraftValidation(transferAmountInput);
        transferRow.append(recipientWrap, transferAmountInput);
        const transferBtn = createButton(t("Transfer"));
        transferBtn.addEventListener("click", () => handleTransfer(
            recipientInput,
            recipientIdInput,
            transferAmountInput,
            recipientAutocomplete
        ));
        transferSection.append(transferTitle, transferHint, transferRow, transferBtn);
        root.appendChild(transferSection);

        const messageSlot = document.createElement("div");
        messageSlot.className = "bank-inline-message-slot";
        root.appendChild(messageSlot);

        mountNode.innerHTML = "";
        mountNode.appendChild(root);

        state.inline.elements = {
            accountValueEl: accountCard.valueEl,
            shipValueEl: shipCard.valueEl,
            messageSlot,
            recipientInput,
            recipientIdInput,
            recipientAutocomplete,
        };

        bindRecipientAutocomplete(recipientInput, recipientIdInput, recipientAutocomplete);
        refreshBalanceUi();
        renderInfoMessage();
        setBusy(state.busy);
    }

    function applyBalanceUpdate(payload = {}) {
        const balances = (payload?.balances && typeof payload.balances === "object")
            ? payload.balances
            : payload;
        applyBalancesSnapshot(balances);

        if (payload?.message) {
            setInfo(
                String(payload.message),
                payload?.tone === "error" ? "error" : "info"
            );
        }
    }

    function openInline({
        modalId,
        mountNode,
        currentPlayer,
        targetName,
        targetCoordinates,
    } = {}) {
        if (!modalId || !mountNode) return false;

        const current = currentPlayer || getCurrentPlayerFallback(modalId);
        const balances = extractBalances(current);
        const locationInfo = resolveBankLocationInfo(modalId, targetName, targetCoordinates);

        clearTimeout(state.searchTimer);
        state.searchTimer = null;
        state.searchToken = 0;

        state.inline = {
            modalId: String(modalId),
            mountNode,
            elements: {},
        };
        state.accountBalance = toMoneyNumber(balances.accountBalance, 0);
        state.shipCredits = toMoneyNumber(balances.shipCredits, 0);
        state.infoMessage = "";
        state.infoTone = "info";
        state.busy = false;

        applyBankHeaderTitle(modalId, locationInfo);

        render();
        return true;
    }

    window.BankModalController = {
        openInline,
        applyBalanceUpdate,
    };
})();
