(function () {
    const state = {
        root: null,
        inline: null,
        payload: null,
        message: null,
        tickerId: null,
        pingedActionKey: null,
        requestedMode: "FOUILLE",
    };

    function getWs() {
        return window.canvasEngine?.ws || window.ws || null;
    }

    function sendWs(type, payload) {
        const ws = getWs();
        if (!ws || typeof ws.send !== "function") return false;
        ws.send({ type, payload });
        return true;
    }

    function getRemainingSecondsFromIso(isoDateString) {
        if (!isoDateString) return 0;
        const targetMs = Date.parse(isoDateString);
        if (!Number.isFinite(targetMs)) return 0;
        return Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
    }

    function ensureRoot() {
        if (state.root && document.body.contains(state.root)) return state.root;

        const overlay = document.createElement("div");
        overlay.id = "wreck-loot-modal";
        overlay.className = "wreck-loot-overlay hidden";
        overlay.innerHTML = `
            <div class="wreck-loot-panel" role="dialog" aria-modal="true" aria-labelledby="wreck-loot-title">
                <div class="wreck-loot-header p-1 flex flex-row items-center">
                    <div class="wreck-loot-title-wrap flex flex-col w-[95%]">
                        <div id="wreck-loot-title" class="wreck-loot-title lg:text-xl text-md text-center font-bold flex w-full text-white p-1 justify-center">Loot Wreck</div>
                        <div id="wreck-loot-subtitle" class="wreck-loot-subtitle"></div>
                    </div>
                    <button type="button" id="wreck-loot-close-btn" class="wreck-loot-close" aria-label="Close">×</button>
                </div>
                <div id="wreck-loot-tabs" class="wreck-loot-tabs hidden"></div>
                <div id="wreck-loot-timer" class="wreck-loot-timer hidden"></div>
                <div id="wreck-loot-message" class="wreck-loot-message hidden"></div>
                <div id="wreck-loot-content" class="wreck-loot-content"></div>
                <div class="p-2 flex flex-row w-full mx-auto">
                    <div class="w-full flex justify-center items-center py-3 relative z-10">
                        <button type="button" id="wreck-loot-close-footer-btn" class="text-emerald-400 hover:text-[#B1F1CB] font-bold px-6 py-1.5 rounded-md border border-emerald-400/30 hover:border-[#B1F1CB] text-sm transition-all">Close</button>
                    </div>
                </div>
            </div>
        `;

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                requestClose();
            }
        });

        overlay.querySelector("#wreck-loot-close-btn")?.addEventListener("click", () => {
            requestClose();
        });
        overlay.querySelector("#wreck-loot-close-footer-btn")?.addEventListener("click", () => {
            requestClose();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
                requestClose();
            }
        });

        document.body.appendChild(overlay);
        state.root = overlay;
        return overlay;
    }

    function ensureInlineHost() {
        if (!state.inline?.mountNode) return null;
        if (state.inline.hostRoot && state.inline.hostRoot.isConnected) return state.inline.hostRoot;
        const host = document.createElement("div");
        host.className = "w-full flex flex-col gap-2";
        host.innerHTML = `
            <div id="wreck-loot-subtitle" class="wreck-loot-subtitle text-center"></div>
            <div id="wreck-loot-tabs" class="wreck-loot-tabs hidden"></div>
            <div id="wreck-loot-timer" class="wreck-loot-timer hidden"></div>
            <div id="wreck-loot-message" class="wreck-loot-message hidden"></div>
            <div id="wreck-loot-content" class="wreck-loot-content"></div>
        `;
        state.inline.mountNode.innerHTML = "";
        state.inline.mountNode.appendChild(host);
        state.inline.hostRoot = host;
        return host;
    }

    function getHostRoot() {
        return state.inline ? (ensureInlineHost() || ensureRoot()) : ensureRoot();
    }

    function getEl(id) {
        return getHostRoot().querySelector(`#${id}`);
    }

    function show() {
        if (state.inline) {
            ensureInlineHost();
            return;
        }
        ensureRoot().classList.remove("hidden");
    }

    function hide() {
        if (state.inline) {
            if (state.inline.hostRoot?.isConnected) state.inline.hostRoot.remove();
            state.inline.hostRoot = null;
            return;
        }
        ensureRoot().classList.add("hidden");
    }

    function clearTicker() {
        if (state.tickerId) {
            clearInterval(state.tickerId);
            state.tickerId = null;
        }
    }

    function currentActionKey(payload = state.payload) {
        const p = payload?.pending_action;
        if (!p) return null;
        return `${p.mode || ""}:${p.item_kind || ""}:${p.item_uid || ""}:${p.execute_at || ""}`;
    }

    function maybePingNearActionEnd() {
        const pending = state.payload?.pending_action;
        if (!pending?.execute_at) return;
        const remaining = getRemainingSecondsFromIso(pending.execute_at);
        const key = currentActionKey();
        if (!key) return;
        if (remaining <= 1 && state.pingedActionKey !== key) {
            const ws = getWs();
            if (ws && typeof ws.send === "function") {
                ws.send({ type: "ping" });
                state.pingedActionKey = key;
            }
        }
    }

    function startTicker() {
        clearTicker();
        state.tickerId = setInterval(() => {
            if (!state.payload) return;
            maybePingNearActionEnd();
            render();
        }, 1000);
    }

    function showMessage(text, tone = "info") {
        state.message = {
            text: String(text || ""),
            tone: tone === "error" ? "error" : "info",
            ts: Date.now(),
        };
        render();
    }

    function clearMessageIfOld() {
        if (!state.message) return;
        if (Date.now() - state.message.ts > 5000) {
            state.message = null;
        }
    }

    function requestOpen(wreckId, mode = "FOUILLE") {
        state.requestedMode = String(mode || "FOUILLE").toUpperCase();
        return sendWs("action_wreck_loot_open", {
            wreck_id: Number(wreckId),
            mode: state.requestedMode,
        });
    }

    function requestClose() {
        const wreckId = state.payload?.wreck_id;
        if (!wreckId) {
            if (state.inline?.modalId) {
                window.ModalModeManager?.exit?.(state.inline.modalId);
                return;
            }
            hide();
            return;
        }
        sendWs("action_wreck_loot_close", { wreck_id: Number(wreckId) });
    }

    function requestCloseInline(modalId) {
        if (state.inline?.modalId && modalId && String(state.inline.modalId) !== String(modalId)) return;
        requestClose();
    }

    function requestTake(item, mode) {
        if (!item?.uid || !state.payload?.wreck_id) return;
        if (state.payload?.pending_action) return;
        sendWs("action_wreck_loot_take", {
            wreck_id: Number(state.payload.wreck_id),
            mode: String(mode || state.payload.active_mode || state.requestedMode || "FOUILLE").toUpperCase(),
            item_uid: String(item.uid),
            item_kind: String(item.kind || "RESOURCE").toUpperCase(),
        });
    }

    function createListSection(title, count, items, mode) {
        const section = document.createElement("section");
        section.className = "wreck-loot-section";

        const header = document.createElement("div");
        header.className = "wreck-loot-section-header";
        header.innerHTML = `<span>${title}</span><span class="wreck-loot-count">${count}</span>`;
        section.appendChild(header);

        const list = document.createElement("div");
        list.className = "wreck-loot-list";
        section.appendChild(list);

        if (!Array.isArray(items) || items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "wreck-loot-empty";
            empty.textContent = title.toLowerCase().includes("module")
                ? "Aucun module disponible."
                : "Aucune ressource disponible.";
            list.appendChild(empty);
            return section;
        }

        const lockOwned = state.payload?.lock?.owned_by_current_player === true;
        const pending = Boolean(state.payload?.pending_action);

        items.forEach((item) => {
            const row = document.createElement("div");
            row.className = "wreck-loot-item";
            if (item?.description) row.title = String(item.description);

            const left = document.createElement("div");
            left.className = "wreck-loot-item-main";

            const name = document.createElement("div");
            name.className = "wreck-loot-item-name";
            name.textContent = item?.name || (item?.kind === "MODULE" ? "Module" : "Resource");
            left.appendChild(name);

            const meta = document.createElement("div");
            meta.className = "wreck-loot-item-meta";

            if (item?.kind === "RESOURCE") {
                const qty = document.createElement("span");
                qty.className = "wreck-loot-pill";
                qty.textContent = `x${Number(item.quantity || 0)}`;
                meta.appendChild(qty);
            } else {
                if (item?.type) {
                    const type = document.createElement("span");
                    type.className = "wreck-loot-pill";
                    type.textContent = String(item.type);
                    meta.appendChild(type);
                }
                if (typeof item?.tier === "number") {
                    const tier = document.createElement("span");
                    tier.className = "wreck-loot-pill";
                    tier.textContent = `T${item.tier}`;
                    meta.appendChild(tier);
                }
            }

            if (mode === "SALVAGE" && item?.kind === "MODULE" && typeof item?.chance_percent === "number") {
                const chance = document.createElement("span");
                chance.className = "wreck-loot-pill is-chance";
                chance.textContent = `${item.chance_percent}%`;
                meta.appendChild(chance);
            }

            left.appendChild(meta);
            row.appendChild(left);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "wreck-loot-btn";
            btn.textContent = "Loot";
            btn.disabled = !lockOwned || pending;
            btn.addEventListener("click", () => requestTake(item, mode));
            row.appendChild(btn);

            list.appendChild(row);
        });

        return section;
    }

    function render() {
        clearMessageIfOld();
        const payload = state.payload;
        if (!payload) {
            hide();
            return;
        }

        const root = getHostRoot();
        show();

        const activeMode = String(payload.active_mode || state.requestedMode || "FOUILLE").toUpperCase();
        const titleEl = getEl("wreck-loot-title");
        const subtitleEl = getEl("wreck-loot-subtitle");
        const tabsEl = getEl("wreck-loot-tabs");
        const timerEl = getEl("wreck-loot-timer");
        const msgEl = getEl("wreck-loot-message");
        const contentEl = getEl("wreck-loot-content");

        if (titleEl) {
            titleEl.textContent = activeMode === "SALVAGE" ? "Salvage" : "Fouille";
        }
        if (state.inline?.modalId) {
            const outerTitle = document.querySelector(`#${state.inline.modalId}-header h3`);
            if (outerTitle) outerTitle.textContent = activeMode === "SALVAGE" ? "Salvage" : "Fouille";
        }
        if (subtitleEl) {
            subtitleEl.textContent = payload.ship_name ? `Carcasse: ${payload.ship_name}` : "";
        }

        if (tabsEl) {
            tabsEl.innerHTML = "";
            tabsEl.classList.add("hidden");
        }

        const pending = payload.pending_action || null;
        if (timerEl) {
            if (pending) {
                const remaining = getRemainingSecondsFromIso(pending.execute_at);
                const modeLabel = String(pending.mode || activeMode).toUpperCase() === "SALVAGE" ? "Salvage" : "Fouille";
                timerEl.classList.remove("hidden");
                timerEl.textContent = `${modeLabel} en cours: ${remaining}s`;
            } else {
                timerEl.classList.add("hidden");
                timerEl.textContent = "";
            }
        }

        if (msgEl) {
            const lock = payload.lock;
            const lockedByOther = lock && lock.owned_by_current_player === false;
            const baseMsg = lockedByOther
                ? "Cette carcasse est déjà en cours de loot par un autre joueur."
                : null;
            const dynamicMsg = state.message?.text || baseMsg;
            if (dynamicMsg) {
                msgEl.classList.remove("hidden");
                msgEl.textContent = dynamicMsg;
                msgEl.dataset.tone = state.message?.tone || (lockedByOther ? "error" : "info");
            } else {
                msgEl.classList.add("hidden");
                msgEl.textContent = "";
                msgEl.dataset.tone = "info";
            }
        }

        if (contentEl) {
            contentEl.innerHTML = "";

            if (activeMode === "SALVAGE") {
                const req = payload.salvage?.requires_module;
                const currentAp = Number(payload.salvage?.current_ap || 0);
                const apCost = Number(payload.salvage?.ap_cost || 1);

                const info = document.createElement("div");
                info.className = "wreck-loot-mode-info";
                info.innerHTML = `
                    <span class="wreck-loot-pill ${req?.satisfied ? "is-ok" : "is-bad"}">Scavenging module ${req?.satisfied ? "OK" : "requis"}</span>
                    <span class="wreck-loot-pill ${currentAp >= apCost ? "is-ok" : "is-bad"}">AP ${currentAp} / coût ${apCost}</span>
                    <span class="wreck-loot-pill">Portée max ${3}</span>
                `;
                contentEl.appendChild(info);

                contentEl.appendChild(createListSection("Ressources de salvage", Number(payload.salvage?.resource_count || 0), payload.salvage?.resources || [], "SALVAGE"));
                contentEl.appendChild(createListSection("Modules récupérables", Number(payload.salvage?.module_count || 0), payload.salvage?.modules || [], "SALVAGE"));
            } else {
                contentEl.appendChild(createListSection("Ressources en soute", Number(payload.fouille?.resource_count || 0), payload.fouille?.resources || [], "FOUILLE"));
                contentEl.appendChild(createListSection("Modules en soute", Number(payload.fouille?.module_count || 0), payload.fouille?.modules || [], "FOUILLE"));
            }
        }

        root.dataset.mode = activeMode;
    }

    function applyServerState(payload) {
        if (!payload || !payload.wreck_id) return;
        const incomingWreckId = Number(payload.wreck_id || 0);
        const currentWreckId = Number(state.payload?.wreck_id || 0);
        const awaitingInline = Boolean(state.inline?.mountNode);
        const overlayAlreadyOpen = Boolean(state.payload && !state.inline);

        // Ignore unsolicited sector-wide refreshes unless this client already has the
        // corresponding wreck loot view open (inline or legacy overlay path).
        if (!awaitingInline && !overlayAlreadyOpen) return;
        if (currentWreckId && incomingWreckId && currentWreckId !== incomingWreckId) return;

        state.payload = payload;
        state.requestedMode = String(payload.active_mode || state.requestedMode || "FOUILLE").toUpperCase();
        state.pingedActionKey = null;
        startTicker();
        render();
    }

    function handleSessionClosed(payload) {
        const wreckId = Number(payload?.wreck_id || 0);
        const currentWreckId = Number(state.payload?.wreck_id || 0);
        if (wreckId && currentWreckId && wreckId !== currentWreckId) return;

        const inlineModalId = state.inline?.modalId || null;
        state.payload = null;
        state.message = null;
        state.pingedActionKey = null;
        state.requestedMode = "FOUILLE";
        clearTicker();
        hide();
        state.inline = null;
        if (inlineModalId) {
            window.ModalModeManager?.exit?.(inlineModalId);
        }
    }

    function handleWreckExpired(payload) {
        const expiredId = Number(payload?.wreck_id || String(payload?.wreck_key || "").replace("wreck_", "") || 0);
        const currentWreckId = Number(state.payload?.wreck_id || 0);
        if (!expiredId || !currentWreckId || expiredId !== currentWreckId) return;
        handleSessionClosed({ wreck_id: expiredId });
    }

    window.addEventListener?.("game:action_failed", (e) => {
        const p = e?.detail || {};
        const reason = String(p.reason || "");
        const relevant =
            reason.startsWith("WRECK_") ||
            reason.startsWith("SALVAGE_") ||
            reason === "SCAVENGING_MODULE_REQUIRED" ||
            reason === "NOT_ENOUGH_AP";
        if (!relevant) return;
        if (p.message) showMessage(p.message, "error");
    });

    window.addEventListener?.("wreck:expired", (e) => {
        handleWreckExpired(e?.detail || {});
    });

    window.WreckLootModalController = {
        openInline({ modalId, mountNode, wreckId, mode } = {}) {
            if (!modalId || !mountNode || !wreckId) return false;
            state.inline = {
                modalId: String(modalId),
                mountNode,
                hostRoot: null,
            };
            state.payload = null;
            state.message = null;
            state.pingedActionKey = null;
            state.requestedMode = String(mode || "FOUILLE").toUpperCase();
            const outerTitle = document.querySelector(`#${modalId}-header h3`);
            if (outerTitle) outerTitle.textContent = state.requestedMode === "SALVAGE" ? "Salvage" : "Fouille";
            ensureInlineHost();
            return requestOpen(wreckId, state.requestedMode);
        },
        requestCloseInline,
        requestOpen,
        requestClose,
        applyServerState,
        handleSessionClosed,
        handleWreckExpired,
        showMessage,
    };
})();
