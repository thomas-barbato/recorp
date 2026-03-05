document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("group-modal");
    const content = document.getElementById("group-modal-content");
    if (!modal || !content) return;

    const openBtnDesktop = document.getElementById("desktop-group-action-btn");
    const openBtnMobile = document.getElementById("group-action-button-mobile");
    const closeBtnTop = document.getElementById("close-group-modal");
    const closeBtnBottom = document.getElementById("close-group-modal-bottom");

    const toastEl = document.getElementById("group-modal-toast");
    const inviteInput = document.getElementById("group-invite-player-name");
    const invitePlayerIdInput = document.getElementById("group-invite-player-id");
    const inviteAutocomplete = document.getElementById("group-invite-autocomplete");
    const inviteSendBtn = document.getElementById("group-invite-send-btn");
    const inviteHint = document.getElementById("group-invite-hint");
    const inviteSection = document.getElementById("group-modal-invite-section");

    const invitationsRoot = document.getElementById("group-modal-invitations");
    const invitationsList = document.getElementById("group-modal-invitations-list");

    const emptyStateEl = document.getElementById("group-modal-empty-state");
    const membersRoot = document.getElementById("group-modal-members");
    const membersCountEl = document.getElementById("group-modal-member-count");
    const leaveBtn = document.getElementById("group-leave-btn");
    const disbandBtn = document.getElementById("group-disband-btn");

    const stateUrl = "/group/state/";
    const searchUrl = "/group/search_players/";
    const pollMs = 1800;

    let modalOpen = false;
    let state = null;
    let pollIntervalId = null;
    let searchDebounceId = null;
    let handledInvitationIds = new Set();
    let refreshStateRequestInFlight = false;

    function t(text) {
        if (typeof gettext === "function") return gettext(text);
        return text;
    }

    function getWs() {
        return window.canvasEngine?.ws || window.ws || null;
    }

    function showToast(message, level = "info") {
        if (!toastEl) return;
        const cls = {
            info: "border-emerald-500/40 bg-emerald-900/20 text-emerald-300",
            success: "border-emerald-400/60 bg-emerald-900/40 text-emerald-200",
            error: "border-red-500/50 bg-red-950/40 text-red-200",
        };
        toastEl.className = `mx-4 mt-3 rounded-md border px-3 py-2 text-xs font-semibold ${cls[level] || cls.info}`;
        toastEl.textContent = String(message || "");
        toastEl.classList.remove("hidden");

        window.clearTimeout(toastEl._hideTimer);
        toastEl._hideTimer = window.setTimeout(() => {
            toastEl.classList.add("hidden");
        }, level === "error" ? 5200 : 3200);
    }

    function hideAutocomplete() {
        if (!inviteAutocomplete) return;
        inviteAutocomplete.innerHTML = "";
        inviteAutocomplete.classList.add("hidden");
    }

    function sendWsAction(type, payload = {}) {
        const ws = getWs();
        if (!ws || typeof ws.send !== "function") {
            showToast(t("WebSocket unavailable."), "error");
            return false;
        }
        ws.send({ type, payload });
        return true;
    }

    function closeModal() {
        if (!modalOpen) return;
        modalOpen = false;
        content.classList.add("scale-90", "opacity-0");
        stopPolling();
        hideAutocomplete();
        window.setTimeout(() => {
            modal.classList.add("hidden");
            document.body.style.overflow = "";
        }, 260);
    }

    function stopPolling() {
        if (pollIntervalId) {
            window.clearInterval(pollIntervalId);
            pollIntervalId = null;
        }
    }

    function startPolling() {
        if (!modalOpen || document.hidden || pollIntervalId) {
            return;
        }
        pollIntervalId = window.setInterval(() => {
            refreshState({ silent: true });
        }, pollMs);
    }

    function openModal() {
        modalOpen = true;
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
        window.setTimeout(() => {
            content.classList.remove("scale-90", "opacity-0");
            content.classList.add("scale-100", "opacity-100");
        }, 40);
        refreshState();
        stopPolling();
        startPolling();
    }

    function setInviteControlsEnabled(enabled, hintText) {
        if (inviteInput) inviteInput.disabled = !enabled;
        if (inviteSendBtn) inviteSendBtn.disabled = !enabled;
        if (inviteHint) inviteHint.textContent = hintText || "";
    }

    function renderInvitations(invitations) {
        if (!invitationsRoot || !invitationsList) return;
        invitationsList.innerHTML = "";

        if (!Array.isArray(invitations) || invitations.length === 0) {
            invitationsRoot.classList.add("hidden");
            return;
        }

        invitationsRoot.classList.remove("hidden");
        invitations.forEach((inv) => {
            const row = document.createElement("div");
            row.className = "flex items-center justify-between gap-2 rounded-md border border-emerald-500/30 bg-zinc-900/60 px-3 py-2";

            const text = document.createElement("div");
            text.className = "min-w-0 text-emerald-200 text-xs";
            text.innerHTML = `<span class="font-semibold">${inv.group_name}</span> · ${t("Invited by")} ${inv.inviter_name}`;

            const actions = document.createElement("div");
            actions.className = "flex items-center gap-1 shrink-0";

            const acceptBtn = document.createElement("button");
            acceptBtn.type = "button";
            acceptBtn.className = "group-inline-btn group-inline-btn--success";
            acceptBtn.textContent = t("Accept");
            acceptBtn.addEventListener("click", () => {
                sendWsAction("action_group_invitation_response", {
                    invitation_id: inv.id,
                    accept: true,
                });
            });

            const declineBtn = document.createElement("button");
            declineBtn.type = "button";
            declineBtn.className = "group-inline-btn group-inline-btn--danger";
            declineBtn.textContent = t("Decline");
            declineBtn.addEventListener("click", () => {
                sendWsAction("action_group_invitation_response", {
                    invitation_id: inv.id,
                    accept: false,
                });
            });

            actions.append(acceptBtn, declineBtn);
            row.append(text, actions);
            invitationsList.appendChild(row);
        });
    }

    function buildStatLabel(label, current, max) {
        return `
            <span class="group-stat-item">
                <span class="group-stat-label">${label}</span>
                <span class="group-stat-value">${Number(current || 0)} / ${Number(max || 0)}</span>
            </span>
        `;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatMemberLocation(member) {
        const coords = member?.coordinates && typeof member.coordinates === "object"
            ? member.coordinates
            : {};

        const x = Number(coords?.x);
        const y = Number(coords?.y);
        const hasCoordinates = Number.isFinite(x) && Number.isFinite(y);

        const sectorName = String(member?.sector_name || "").trim();
        const sectorId = Number(member?.sector_id);
        const sectorText = sectorName
            || (Number.isFinite(sectorId) ? `${t("Sector")} #${sectorId}` : t("Unknown sector"));

        const coordinatesText = hasCoordinates
            ? `Y:${y}, X:${x}`
            : t("Y:?, X:?");

        return {
            sectorText,
            coordinatesText,
            fullText: `${sectorText} | ${coordinatesText}`,
        };
    }

    function renderMemberCard(member, currentState) {
        const card = document.createElement("article");
        card.className = "group-member-card";

        const title = document.createElement("div");
        title.className = "group-member-title";
        const location = formatMemberLocation(member);
        const sectorLabel = t("Sector");
        const coordsLabel = t("Coords");
        title.innerHTML = `
            <span class="group-member-index">#${Number(member.index || 0)}</span>
            <span class="group-member-name">${escapeHtml(member.name || "Unknown")}</span>
            <span class="group-member-location" title="${escapeHtml(location.fullText)}">
                <span class="group-member-sector" title="${escapeHtml(location.sectorText)}">
                    <span class="group-member-location-key">${escapeHtml(sectorLabel)}</span>
                    <span class="group-member-location-value">${escapeHtml(location.sectorText)}</span>
                </span>
                <span class="group-member-coordinates" title="${escapeHtml(location.coordinatesText)}">
                    <span class="group-member-location-key">${escapeHtml(coordsLabel)}</span>
                    <span class="group-member-location-value group-member-location-value--mono">${escapeHtml(location.coordinatesText)}</span>
                </span>
            </span>
            ${member.is_leader ? `<span class="group-member-badge">${t("Leader")}</span>` : ""}
        `;

        const stats = document.createElement("div");
        stats.className = "group-member-stats";
        const st = member.stats || {};
        stats.innerHTML = [
            buildStatLabel("HP", st.hp?.current, st.hp?.max),
            buildStatLabel("AP", st.ap?.current, st.ap?.max),
            buildStatLabel("MP", st.movement?.current, st.movement?.max),
            buildStatLabel("Ballistic", st.ballistic?.current, st.ballistic?.max),
            buildStatLabel("Thermal", st.thermal?.current, st.thermal?.max),
            buildStatLabel("Missile", st.missile?.current, st.missile?.max),
        ].join("");

        const actions = document.createElement("div");
        actions.className = "group-member-actions";
        const canManageMember = Boolean(currentState?.is_leader && !member.is_leader);
        if (canManageMember) {
            const kickBtn = document.createElement("button");
            kickBtn.type = "button";
            kickBtn.className = "group-inline-btn group-inline-btn--danger";
            kickBtn.textContent = t("Remove");
            kickBtn.addEventListener("click", () => {
                if (!window.confirm(t("Remove this player from the group?"))) return;
                sendWsAction("action_group_kick", { target_player_id: member.player_id });
            });

            const leadBtn = document.createElement("button");
            leadBtn.type = "button";
            leadBtn.className = "group-inline-btn group-inline-btn--info";
            leadBtn.textContent = t("Transfer Lead");
            leadBtn.addEventListener("click", () => {
                if (!window.confirm(t("Transfer group leadership to this player?"))) return;
                sendWsAction("action_group_transfer_lead", { target_player_id: member.player_id });
            });

            actions.append(kickBtn, leadBtn);
        }

        card.append(title, stats, actions);

        if (member.is_destroyed) {
            const overlay = document.createElement("div");
            overlay.className = "group-member-destroyed";
            overlay.textContent = "Destroyed";
            card.appendChild(overlay);
        }

        return card;
    }

    function renderMembers(currentState) {
        if (!emptyStateEl || !membersRoot || !leaveBtn || !disbandBtn) return;

        const inGroup = Boolean(currentState?.in_group);
        const members = Array.isArray(currentState?.members) ? currentState.members : [];
        const maxMembers = Number(currentState?.max_members || 6);
        const memberCount = Number(
            Number.isFinite(Number(currentState?.member_count))
                ? Number(currentState.member_count)
                : members.length
        );

        if (membersCountEl) {
            membersCountEl.textContent = `${Math.max(0, memberCount)}/${Math.max(1, maxMembers)}`;
        }

        if (!inGroup) {
            emptyStateEl.classList.remove("hidden");
            membersRoot.classList.add("hidden");
            membersRoot.innerHTML = "";
            leaveBtn.classList.add("hidden");
            disbandBtn.classList.add("hidden");
            if (inviteSection) inviteSection.classList.remove("hidden");
            setInviteControlsEnabled(true, t("Create a group by inviting a player."));
            return;
        }

        emptyStateEl.classList.add("hidden");
        membersRoot.classList.remove("hidden");
        membersRoot.innerHTML = "";
        members.forEach((member) => {
            membersRoot.appendChild(renderMemberCard(member, currentState));
        });

        leaveBtn.classList.remove("hidden");
        disbandBtn.classList.toggle("hidden", !currentState?.is_leader);

        if (currentState?.is_leader) {
            if (inviteSection) inviteSection.classList.remove("hidden");
            setInviteControlsEnabled(true, t("Invite a player to your group."));
        } else {
            if (inviteSection) inviteSection.classList.add("hidden");
            hideAutocomplete();
            setInviteControlsEnabled(false, t("Only the group leader can invite players."));
        }
    }

    function applyState(nextState) {
        state = nextState && typeof nextState === "object" ? nextState : {};
        if (typeof window.applyGroupStateSnapshot === "function") {
            window.applyGroupStateSnapshot(state);
        } else {
            window.__pendingGroupStateSnapshot = state;
        }
        renderInvitations(state.pending_invitations || []);
        renderMembers(state);
    }

    function promptPendingInvitationsFromState(currentState) {
        const payload = currentState && typeof currentState === "object" ? currentState : {};
        const invitations = Array.isArray(payload.pending_invitations) ? payload.pending_invitations : [];
        if (!invitations.length) return;
        if (payload.in_group) return;

        invitations.forEach((invitation) => {
            handleInvitationPopup(invitation);
        });
    }

    async function refreshState(options = {}) {
        if (document.hidden && options.silent) {
            return;
        }
        if (refreshStateRequestInFlight) {
            return;
        }

        refreshStateRequestInFlight = true;

        try {
            const response = await fetch(stateUrl, {
                headers: { "X-Requested-With": "XMLHttpRequest" },
            });
            const data = await response.json();
            if (!data?.ok) {
                if (!options.silent) {
                    showToast(t("Unable to load group state."), "error");
                }
                return;
            }
            const nextState = data.state || {};
            applyState(nextState);
            if (options.promptPendingInvitations) {
                promptPendingInvitationsFromState(nextState);
            }
        } catch (err) {
            if (!options.silent) {
                showToast(t("Unable to load group state."), "error");
            }
        } finally {
            refreshStateRequestInFlight = false;
        }
    }

    async function searchInviteTargets(query) {
        try {
            const res = await fetch(`${searchUrl}?q=${encodeURIComponent(query)}`, {
                headers: { "X-Requested-With": "XMLHttpRequest" },
            });
            const data = await res.json();
            return Array.isArray(data?.results) ? data.results : [];
        } catch (_) {
            return [];
        }
    }

    function renderInviteAutocomplete(results) {
        if (!inviteAutocomplete) return;
        inviteAutocomplete.innerHTML = "";

        if (!results.length) {
            inviteAutocomplete.classList.add("hidden");
            return;
        }

        results.forEach((entry) => {
            const row = document.createElement("button");
            row.type = "button";
            row.className = "group-autocomplete-row";
            row.innerHTML = `
                <span class="truncate">${entry.name || "Unknown"} · ${entry.faction || "-"}</span>
                ${entry.in_group ? `<span class="group-autocomplete-badge">${t("In Group")}</span>` : ""}
            `;
            row.addEventListener("click", () => {
                if (inviteInput) inviteInput.value = entry.name || "";
                if (invitePlayerIdInput) invitePlayerIdInput.value = String(entry.id || "");
                hideAutocomplete();
            });
            inviteAutocomplete.appendChild(row);
        });
        inviteAutocomplete.classList.remove("hidden");
    }

    function handleInviteInputChanged() {
        if (!inviteInput || inviteInput.disabled) return;
        if (invitePlayerIdInput) invitePlayerIdInput.value = "";
        const value = inviteInput.value.trim();
        window.clearTimeout(searchDebounceId);
        if (value.length < 2) {
            hideAutocomplete();
            return;
        }
        searchDebounceId = window.setTimeout(async () => {
            const results = await searchInviteTargets(value);
            renderInviteAutocomplete(results);
        }, 220);
    }

    function sendInviteFromInput() {
        if (!inviteInput || inviteInput.disabled) return;
        const targetName = inviteInput.value.trim();
        const targetPlayerId = invitePlayerIdInput?.value ? Number(invitePlayerIdInput.value) : null;

        if (!targetName && !targetPlayerId) {
            showToast(t("Choose a player first."), "error");
            return;
        }

        const payload = {};
        if (targetPlayerId) {
            payload.target_player_id = targetPlayerId;
        } else if (targetName) {
            payload.target_name = targetName;
        }

        if (!sendWsAction("action_group_invite", payload)) return;
        showToast(t("Invitation sent."), "info");
        hideAutocomplete();
    }

    function handleInvitationPopup(payload) {
        const invitationId = Number(payload?.id || 0);
        if (!invitationId || handledInvitationIds.has(invitationId)) return;
        handledInvitationIds.add(invitationId);

        const inviter = payload?.inviter_name || "Unknown";
        const groupName = payload?.group_name || "Unnamed Group";
        showToast(`${inviter} ${t("invited you to")} ${groupName}.`, "info");

        const accepted = window.confirm(`${inviter} ${t("invited you to join")} "${groupName}". ${t("Accept invitation?")}`);
        sendWsAction("action_group_invitation_response", {
            invitation_id: invitationId,
            accept: Boolean(accepted),
        });
    }

    if (openBtnDesktop) openBtnDesktop.addEventListener(action_listener_touch_click, openModal);
    if (openBtnMobile) openBtnMobile.addEventListener(action_listener_touch_click, openModal);
    if (closeBtnTop) closeBtnTop.addEventListener(action_listener_touch_click, closeModal);
    if (closeBtnBottom) closeBtnBottom.addEventListener(action_listener_touch_click, closeModal);
    modal.addEventListener(action_listener_touch_click, (event) => {
        if (event.target === modal) closeModal();
    });

    if (inviteInput) inviteInput.addEventListener("input", handleInviteInputChanged);
    if (inviteSendBtn) inviteSendBtn.addEventListener(action_listener_touch_click, sendInviteFromInput);

    document.addEventListener("click", (event) => {
        if (!inviteAutocomplete || !inviteInput) return;
        if (!inviteAutocomplete.contains(event.target) && event.target !== inviteInput) {
            hideAutocomplete();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopPolling();
            return;
        }
        if (modalOpen) {
            refreshState({ silent: true });
            startPolling();
        }
    });

    window.addEventListener("beforeunload", () => {
        stopPolling();
    });

    if (leaveBtn) {
        leaveBtn.addEventListener(action_listener_touch_click, () => {
            if (!window.confirm(t("Leave your current group?"))) return;
            sendWsAction("action_group_leave", {});
        });
    }

    if (disbandBtn) {
        disbandBtn.addEventListener(action_listener_touch_click, () => {
            if (!window.confirm(t("Disband this group?"))) return;
            sendWsAction("action_group_disband", {});
        });
    }

    function flushQueuedGroupEvents() {
        const queue = window.__groupModalQueue;
        if (!queue || typeof queue !== "object") return;

        if (queue.stateSync) {
            applyState(queue.stateSync);
        }
        if (Array.isArray(queue.invitations)) {
            queue.invitations.forEach((payload) => handleInvitationPopup(payload || {}));
        }
        if (Array.isArray(queue.feedback)) {
            queue.feedback.forEach((payload) => {
                const p = payload || {};
                showToast(p.message || t("Group action updated."), p.level || "info");
            });
        }

        window.__groupModalQueue = {
            stateSync: null,
            invitations: [],
            feedback: [],
        };
    }

    window.GroupModalController = {
        open: openModal,
        close: closeModal,
        refresh: refreshState,
        onGroupStateSync(payload) {
            applyState(payload || {});
        },
        onGroupInvitation(payload) {
            handleInvitationPopup(payload || {});
            refreshState({ silent: true });
        },
        onGroupActionFeedback(payload) {
            const p = payload || {};
            showToast(p.message || t("Group action updated."), p.level || "info");
            refreshState({ silent: true });
        },
    };

    flushQueuedGroupEvents();
    refreshState({ silent: true, promptPendingInvitations: true });
});
