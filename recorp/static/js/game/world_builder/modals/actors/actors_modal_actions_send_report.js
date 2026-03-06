// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {

    function t(text) {
        if (typeof gettext === "function") return gettext(text);
        return text;
    }

    let lastTargetContext = null;

    function getModalLive() {
        return window.ModalLive || null;
    }

    window.openSendReportModal = function ({
        targetKey,
        targetType,
        targetId,
        modalData,
        targetModalId,
        modalId
    }) {
        const resolvedTargetModalId =
            targetModalId ||
            modalId ||
            (targetType && targetId != null ? `modal-${targetType}_${targetId}` : null);

        lastTargetContext = {
            targetKey,
            targetType,
            targetId,
            modalData,
            targetModalId: resolvedTargetModalId
        };

        const targetEl = resolvedTargetModalId ? document.getElementById(resolvedTargetModalId) : null;
        if (targetEl) {
            getModalLive()?.unregister?.(resolvedTargetModalId);
            targetEl.remove();
        }

        const modalContainer = document.getElementById("modal-container");
        if (modalContainer) {
            modalContainer.innerHTML = "";
        }

        createSendReportModal(modalData, resolvedTargetModalId);
    };

    function createSendReportModal(modalData, targetModalId) {
        const modalId = "send-report-modal";

        const modal = document.createElement("div");
        modal.id = modalId;
        modal.className = `
            modal modal-z-index fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-hidden
            bg-black/60 backdrop-blur-sm
        `;
        modal.style.zIndex = "9999";
        modal.style.paddingTop = "max(env(safe-area-inset-top), 0.5rem)";
        modal.style.paddingBottom = "max(env(safe-area-inset-bottom), 0.5rem)";

        modal.innerHTML = `
            <div class="relative shadow-2xl w-full md:w-[60vw] md:max-w-2xl h-[94dvh] md:h-[90dvh] max-h-[94dvh] md:max-h-[90dvh] min-h-0 flex flex-col overflow-hidden transition-all bg-zinc-950/95 border border-emerald-500/40 rounded-xl md:rounded-2xl shadow-[0_0_30px_rgba(10,185,129,0.4)] scale-100 opacity-100">
                ${renderHeader()}
                ${renderBody(modalData)}
                ${renderFooter()}
            </div>
        `;

        const modalHost = document.getElementById("modal-container") || document.body;
        modalHost.appendChild(modal);

        const scrollBody = modal.querySelector('[data-send-report-scroll]');
        if (scrollBody) {
            scrollBody.style.webkitOverflowScrolling = "touch";
            scrollBody.style.overscrollBehavior = "contain";
            scrollBody.style.touchAction = "pan-y";
        }

        bindSendReportEvents(modalId, targetModalId);
    }

    function renderHeader() {
        return `
            <div class="shrink-0 flex justify-between items-center px-5 py-4 border-b border-emerald-500/40 bg-gradient-to-r from-emerald-900/60 to-zinc-900/60 shadow-inner">
                <h2 class="font-orbitron text-emerald-400 text-xl md:text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                    <i class="fa-solid fa-envelope"></i>
                    ${t("Intel Report Transmission").toUpperCase()}
                </h2>

                <button id="send-report-close" class="text-emerald-300 hover:text-red-400 transition" aria-label="${t("Close")}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    }

    function renderBody(modalData) {
        return `
            <div data-send-report-scroll="1" class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4">
                <div>
                    <label class="text-xs text-emerald-300 uppercase tracking-wide font-bold font-orbitron">
                        ${t("Recipient")}
                    </label>
                    <div class="relative p-2 bg-black/40 border border-emerald-500/30 rounded">
                        <input
                            id="recipient"
                            type="text"
                            placeholder="${t("Enter player name...")}"
                            class="w-full bg-transparent text-emerald-200 outline-none text-sm"
                        />
                        <input id="recipient-player-id" type="hidden" value="">
                        <div id="recipient-autocomplete"
                            class="absolute left-0 right-0 bg-zinc-900/90 border border-emerald-500/20 rounded shadow-lg hidden z-50 max-h-44 overflow-y-auto text-xs">
                        </div>
                    </div>
                    <div id="report-toast-container" class="mt-2"></div>
                </div>

                <div>
                    <label class="text-xs text-emerald-300 uppercase tracking-wide font-bold font-orbitron">
                        ${t("Optional message")}
                    </label>
                    <textarea
                        id="optional-message"
                        rows="3"
                        placeholder="${t("Add a personal note...")}"
                        class="w-full bg-black/40 border border-emerald-500/30 rounded text-emerald-200 text-sm p-2 resize-none outline-none">
                    </textarea>
                </div>

                <div>
                    <label class="text-xs text-emerald-300 uppercase tracking-wide font-bold font-orbitron">
                        ${t("Intel report")}
                    </label>

                    <div id="report-content" class="p-3 md:max-h-[38dvh] md:overflow-y-auto bg-black/50 border border-emerald-500/20 rounded text-xs text-emerald-200 whitespace-pre-wrap break-words">
                        ${renderIntelReport(modalData)}
                    </div>
                </div>
            </div>
        `;
    }

    function renderFooter() {
        return `
            <div class="border-t border-emerald-500/30 p-3 flex items-center gap-2 justify-center">
                <button id="send-report-cancel"
                    class="px-4 py-1 text-sm rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 transition">
                    ${t("Cancel")}
                </button>

                <button id="send-report-submit"
                    class="px-4 py-1 text-sm rounded bg-emerald-600/80 text-black hover:bg-emerald-500 transition font-semibold">
                    ${t("Send report")}
                </button>
            </div>
        `;
    }

    function renderIntelReport(data) {
        const lines = [];
        const apLabel = t("AP");
        const mpLabel = t("MP");
        const ship = data.ship || {};
        const faction = data.player.faction_name || "";
        const userType = data.player.is_npc === false ? t("PLAYER") : t("NPC");

        lines.push(`${t("NAME")}: ${data.player.name}`);
        lines.push("");
        lines.push(`--- ${t("TARGET")} ---`);
        lines.push(`${t("TYPE")}: ${userType}`);

        if (faction) {
            lines.push(`${t("FACTION")}: ${faction}`);
        }

        const sectorName = document.getElementById("sector-name")?.textContent;
        if (data.player.coordinates && sectorName) {
            lines.push(`${t("POSITION")}: ${sectorName} [Y: ${data.player.coordinates.y} ; X: ${data.player.coordinates.x}]`);
        }

        if (data.player.current_ap && data.player.max_ap) {
            lines.push(`${apLabel}: ${data.player.current_ap} / ${data.player.max_ap}`);
        }

        lines.push("");
        lines.push(`--- ${t("SHIP")} ---`);

        if (ship.name) {
            lines.push(`${t("SHIP NAME")}: ${ship.name}`);
        }

        if (ship.category) {
            lines.push(`${t("SHIP CATEGORY")}: ${ship.category}`);
        }

        if (ship.current_hp !== undefined) {
            lines.push(`HP: ${ship.current_hp} / ${ship.max_hp}`);
        }

        if (data.player.current_ap !== undefined) {
            lines.push(`${apLabel}: ${data.player.current_ap} / ${data.player.max_ap}`);
        }

        if (ship.current_movement !== undefined) {
            lines.push(`${mpLabel}: ${ship.current_movement} / ${ship.max_movement}`);
        }

        if (ship.current_ballistic_defense !== undefined) {
            lines.push(`${t("Ballistic")}: ${ship.current_ballistic_defense} / ${ship.max_ballistic_defense}`);
            lines.push(`${t("Thermal")}: ${ship.current_thermal_defense} / ${ship.max_thermal_defense}`);
            lines.push(`${t("Missile")}: ${ship.current_missile_defense} / ${ship.max_missile_defense}`);
        }

        if (Array.isArray(ship.modules) && ship.modules.length > 0) {
            lines.push("");
            lines.push(`--- ${t("MODULES")} ---`);
            ship.modules.forEach((moduleEntry) => {
                lines.push(`- ${moduleEntry.name}`);
            });
        }

        return lines.join("\n");
    }

    function bindSendReportEvents(modalId, targetModalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        bindRecipientAutocomplete(modal);

        const close = () => {
            modal.remove();
            if (targetModalId) open_close_modal(targetModalId);
        };

        modal.querySelector("#send-report-close")?.addEventListener("click", close);
        modal.querySelector("#send-report-cancel")?.addEventListener("click", close);

        modal.querySelector("#send-report-submit")?.addEventListener("click", async (event) => {
            const btn = event.target;
            const recipient = modal.querySelector("#recipient")?.value?.trim();
            let recipientId = modal.querySelector("#recipient-player-id")?.value;
            const optionalMessage = modal.querySelector("#optional-message")?.value || "";

            if (!recipient) {
                showToast(t("Recipient not found"), false);
                return;
            }

            if (!recipientId) {
                recipientId = await resolveRecipientIdByName(recipient);
                if (!recipientId) {
                    showToast(t("Unknown player"), false, "report-toast-container");
                    return;
                }
            }

            const report = renderIntelReport(lastTargetContext.modalData);
            const body = composeFinalMessage(optionalMessage, report);
            const subject = `${t("Scan report")} - ${lastTargetContext.modalData.player.name}`;

            const payload = {
                recipient,
                recipient_type: "player",
                subject,
                body,
                senderId: currentPlayer.user.player
            };

            setLoadingState(btn, true);
            try {
                await sendPrivateMessage(payload);
                window.showToast(t("Report sent"), true, "report-toast-container");
            } catch (err) {
                window.showToast(t("Send failed"), false, "report-toast-container");
            } finally {
                setLoadingState(btn, false);
            }
        });
    }

    function reopenTargetModal() {
        const modal = document.getElementById("send-report-modal");
        modal?.remove();

        if (!lastTargetContext) return;

        open_close_modal(lastTargetContext.targetType, lastTargetContext.targetId);
        lastTargetContext = null;
    }

    function bindRecipientAutocomplete(modalEl) {
        const input = modalEl.querySelector("#recipient");
        const hidden = modalEl.querySelector("#recipient-player-id");
        const box = modalEl.querySelector("#recipient-autocomplete");

        if (!input || !hidden || !box) return;

        let searchTimer = null;

        function clear() {
            box.innerHTML = "";
            box.classList.add("hidden");
        }

        async function search(query) {
            try {
                const response = await fetch(`/messages/search_players/?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                const results = data?.results || [];

                if (!results.length) {
                    clear();
                    return;
                }

                box.innerHTML = "";
                results.forEach((player) => {
                    const row = document.createElement("div");
                    row.className = "px-3 py-1 text-xs hover:bg-emerald-500/10 cursor-pointer";
                    row.textContent = player.faction ? `${player.name} - ${player.faction}` : player.name;

                    row.addEventListener("click", () => {
                        input.value = player.name;
                        hidden.value = String(player.id);
                        clear();
                    });

                    box.appendChild(row);
                });

                box.classList.remove("hidden");
            } catch (err) {
                clear();
            }
        }

        input.addEventListener("input", () => {
            const query = input.value.trim();
            hidden.value = "";

            if (query.length < 2) {
                clear();
                return;
            }

            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => search(query), 250);
        });

        document.addEventListener("click", (event) => {
            if (!box.contains(event.target) && event.target !== input) clear();
        });
    }

    function composeFinalMessage(optionalText, reportText) {
        const cleanOptional = optionalText?.trim();
        if (!cleanOptional) return reportText;
        return `${cleanOptional}\n\n${reportText}`;
    }

    async function resolveRecipientIdByName(name) {
        const response = await fetch(`/messages/search_players/?q=${encodeURIComponent(name)}`);
        if (!response.ok) return null;

        const data = await response.json();
        const results = data?.results || [];
        const exact = results.find((player) => player.name.toLowerCase() === name.toLowerCase());
        return exact ? String(exact.id) : null;
    }
})();
