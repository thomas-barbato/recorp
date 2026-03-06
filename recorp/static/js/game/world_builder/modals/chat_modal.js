document.addEventListener('DOMContentLoaded', () => {
    const chatModal = document.getElementById("chat-modal");
    const chatContent = document.getElementById("chat-modal-content");
    const chatOpenBtn = document.getElementById("chat-modal-button");
    const chatOpenBtnMobile = document.getElementById("chat-modal-button-mobile");
    const chatCloseBtn = document.getElementById("close-chat-modal");
    const chatCloseBtnBottom = document.getElementById("close-chat-modal-bottom");
    const chatInput = document.getElementById("chat-input");
    const chatSendBtn = document.getElementById("chat-send");

    const chatTabSector = document.getElementById("tab-sector");
    const chatTabFaction = document.getElementById("tab-faction");
    const chatTabGroup = document.getElementById("tab-group");
    const chatTabsByChannel = {
        sector: chatTabSector,
        faction: chatTabFaction,
        group: chatTabGroup,
    };
    const CHANNELS = ["sector", "faction", "group"];

    const chatContainers = {
        sector: document.getElementById('chat-sector-messages'),
        faction: document.getElementById('chat-faction-messages'),
        group: document.getElementById('chat-group-messages'),
    };
    const hasChatUi = Boolean(chatModal && chatContent);

    let currentChannel = "sector";
    let altColor = false;
    let isModalOpen = false;
    let unreadCounts = { sector: 0, faction: 0, group: 0 };
    let unreadPollIntervalId = null;
    let unreadCountsRequestInFlight = false;
    const chatMessageRequestSeqByChannel = {};
    const chatMessageAbortControllerByChannel = {};
    const markReadRequestInFlightByChannel = {};

    function normalizeUnreadCounts(raw = {}) {
        return {
            sector: Number(raw.sector || 0),
            faction: Number(raw.faction || 0),
            group: Number(raw.group || 0),
        };
    }

    function unreadCountsChanged(prev, next) {
        return CHANNELS.some((channel) => Number(prev?.[channel] || 0) !== Number(next?.[channel] || 0));
    }

    loadUnreadCounts();

    function openModal() {
        if (!hasChatUi) return;
        isModalOpen = true;

        if (window.ModalAnimator?.open) {
            window.ModalAnimator.open(chatModal, {
                panel: chatContent,
                durationMs: 300,
            });
            setTimeout(() => {
                forceScrollToBottom();
            }, 50);
        } else {
            chatModal.classList.remove("hidden");
            setTimeout(() => {
                chatContent.classList.remove("scale-90", "opacity-0");
                chatContent.classList.add("scale-100", "opacity-100");
                forceScrollToBottom();
            }, 50);
            document.body.style.overflow = "hidden";
        }

        loadChatMessages(currentChannel).then(() => {
            forceScrollToBottom();
            markChannelAsRead(currentChannel);
        });
    }

    function closeModal() {
        if (!hasChatUi) return;
        isModalOpen = false;
        Object.keys(chatMessageAbortControllerByChannel).forEach((channel) => {
            const controller = chatMessageAbortControllerByChannel[channel];
            if (controller) {
                controller.abort();
            }
            delete chatMessageAbortControllerByChannel[channel];
        });

        if (window.ModalAnimator?.close) {
            window.ModalAnimator.close(chatModal, {
                panel: chatContent,
                durationMs: 300,
            });
            return;
        }

        chatContent.classList.add("scale-90", "opacity-0");
        setTimeout(() => {
            chatModal.classList.add("hidden");
            document.body.style.overflow = "";
        }, 300);
    }

    if (chatOpenBtn) chatOpenBtn.addEventListener(action_listener_touch_click, openModal);
    if (chatOpenBtnMobile) chatOpenBtnMobile.addEventListener(action_listener_touch_click, openModal);
    if (chatCloseBtn) chatCloseBtn.addEventListener(action_listener_touch_click, closeModal);
    if (chatCloseBtnBottom) chatCloseBtnBottom.addEventListener(action_listener_touch_click, closeModal);
    if (chatModal) {
        chatModal.addEventListener(action_listener_touch_click, (e) => {
            if (e.target === chatModal) closeModal();
        });
    }

    function setTab(tab) {
        currentChannel = tab;

        [chatTabSector, chatTabFaction, chatTabGroup].forEach((b) => {
            if (!b) return;
            b.classList.remove("border-b-2", "border-emerald-400", "hover:text-emerald-200", "text-emerald-400", "font-semibold", "font-orbitron");
            b.classList.add("border-b", "border-transparent", "hover:text-emerald-200", "transition", "font-orbitron");
        });
        const activeTab = chatTabsByChannel[tab];
        if (activeTab) {
            activeTab.classList.remove("border-b", "border-transparent", "hover:text-emerald-200", "transition", "font-orbitron");
            activeTab.classList.add("border-b-2", "border-emerald-400", "hover:text-emerald-200", "text-emerald-400", "font-semibold", "font-orbitron");
        }

        Object.keys(chatContainers).forEach(k => {
            const c = chatContainers[k];
            if (!c) return;
            c.classList.toggle('hidden', k !== tab);
        });

        loadChatMessages(tab);
        markChannelAsRead(tab);
    }

    if (chatTabSector) chatTabSector.addEventListener("click", () => setTab("sector"));
    if (chatTabFaction) chatTabFaction.addEventListener("click", () => setTab("faction"));
    if (chatTabGroup) chatTabGroup.addEventListener("click", () => setTab("group"));

    async function loadUnreadCounts() {
        if (document.hidden) {
            return;
        }
        if (unreadCountsRequestInFlight) {
            return;
        }

        unreadCountsRequestInFlight = true;

        try {
            const response = await fetch('/chat/unread-counts/', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();

            const normalizedCounts = normalizeUnreadCounts(data);
            const hasChanged = unreadCountsChanged(unreadCounts, normalizedCounts);
            unreadCounts = normalizedCounts;

            if (hasChanged) {
                updateNotificationBadge();
                CHANNELS.forEach(updateTabBadge);
            }

            const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
            if (totalUnread > 0 && !isModalOpen) {
                addShakeAnimation();
            } else {
                removeShakeAnimation();
            }

        } catch (err) {
            console.error("Erreur chargement compteurs:", err);
        } finally {
            unreadCountsRequestInFlight = false;
        }
    }

    async function loadChatMessages(channel) {
        const requestSeq = (chatMessageRequestSeqByChannel[channel] || 0) + 1;
        chatMessageRequestSeqByChannel[channel] = requestSeq;
        const prevController = chatMessageAbortControllerByChannel[channel];
        if (prevController) {
            prevController.abort();
        }
        const controller = new AbortController();
        chatMessageAbortControllerByChannel[channel] = controller;

        const url = `/chat/get/${channel}/`;
        try {
            const response = await fetch(url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                signal: controller.signal,
            });
            const data = await response.json();
            if (chatMessageRequestSeqByChannel[channel] !== requestSeq) {
                return;
            }
            renderMessages(channel, data.messages || []);
        } catch (err) {
            if (err && err.name === "AbortError") {
                return;
            }
            console.error("Erreur lors du chargement du chat :", err);
        } finally {
            if (chatMessageAbortControllerByChannel[channel] === controller) {
                delete chatMessageAbortControllerByChannel[channel];
            }
        }
    }

    function renderMessages(channel, messages) {
        const container = chatContainers[channel];
        if (!container) return;

        container.innerHTML = "";
        altColor = false;
        const fragment = document.createDocumentFragment();
        messages.forEach(m => appendMessage({ ...m, channel }, { shouldScroll: false, targetContainer: fragment }));
        container.appendChild(fragment);
        if (channel === currentChannel) forceScrollToBottom(container);
    }

    function appendMessage({ author, faction, faction_color, content, timestamp, channel, is_read }, options = {}) {
        const { shouldScroll = true, targetContainer = null } = options;
        const container = chatContainers[channel || currentChannel];
        if (!container) return;

        const sideClass = altColor ? "text-emerald-300" : "text-emerald-400";
        const bgClass = altColor ? "bg-emerald-900/20" : "bg-emerald-800/10";
        altColor = !altColor;

        const div = document.createElement("div");
        div.className = `chat-msg rounded-md p-1 ${bgClass} ${sideClass}`;
        div.innerHTML = `
            <div class="flex items-center flex-wrap gap-1">
                ${faction ? `<small class="${faction_color} font-shadow font-bold">(${faction})</small>` : ''}
                <span class="font-bold font-shadow ${faction_color || 'text-emerald-400'}">${escapeHtml(author)}</span>
                <small class="text-emerald-500/60 italic font-shadow ml-2">${timestamp || ''}</small>
            </div>
            <p class="text-emerald-300 text-xs break-words p-2 font-shadow">${escapeHtml(content)}</p>
        `;
        if (targetContainer) {
            targetContainer.appendChild(div);
        } else {
            container.appendChild(div);
        }

        if (shouldScroll) {
            forceScrollToBottom(container);
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        const payload = {
            channel: currentChannel,
            sender_id: currentPlayer.user.player,
            content: text,
        };

        async_send_chat_msg(payload);

        chatInput.value = "";
    }

    if (chatSendBtn) chatSendBtn.addEventListener(action_listener_touch_click, sendChatMessage);
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendChatMessage();
        });
    }

    async function markChannelAsRead(channel) {
        if (unreadCounts[channel] === 0) {
            return;
        }
        if (markReadRequestInFlightByChannel[channel]) {
            return;
        }

        markReadRequestInFlightByChannel[channel] = true;
        
        const url = `/chat/mark-read/${channel}/`
        try {
            const response = await fetch(url, {headers: { 'X-Requested-With': 'XMLHttpRequest' },});
            const data = await response.json();
            
            unreadCounts[channel] = 0;
            updateNotificationBadge();
            updateTabBadge(channel);
            removeShakeAnimation();
            
        } catch (err) {
            console.error("Erreur :", err);
        } finally {
            markReadRequestInFlightByChannel[channel] = false;
        }
    }

    function incrementUnreadCount(channel) {
        const currentValue = Number(unreadCounts[channel] || 0);
        unreadCounts[channel] = currentValue + 1;
        updateNotificationBadge();
        updateTabBadge(channel);
        
        if (!isModalOpen) {
            addShakeAnimation();
        }
    }

    function updateNotificationBadge() {
        const totalUnread = CHANNELS.reduce((acc, channel) => acc + Number(unreadCounts[channel] || 0), 0);
        updateBadgeElement(chatOpenBtn, totalUnread);
        updateBadgeElement(chatOpenBtnMobile, totalUnread);
    }

    function updateBadgeElement(button, count) {
        if (!button) return;
        
        let badge = button.querySelector('.chat-badge');
        
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'chat-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold';
                button.style.position = 'relative';
                button.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else if (badge) {
            badge.remove();
        }
    }

    function updateTabBadge(channel) {
        const tab = chatTabsByChannel[channel];
        if (!tab) return;
        
        let badge = tab.querySelector('.tab-badge');
        const count = unreadCounts[channel];
        
        if (count > 0 && channel !== currentChannel) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'tab-badge ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold';
                tab.appendChild(badge);
            }
            badge.textContent = count;
            tab.classList.add("holo-pulse");
        } else if (badge) {
            badge.remove();
            tab.classList.remove("holo-pulse");
        }
    }

    function addShakeAnimation() {
        if (chatOpenBtn && !chatOpenBtn.classList.contains('chat-shake')) {
            chatOpenBtn.classList.add('chat-shake');
        }
        if (chatOpenBtnMobile && !chatOpenBtnMobile.classList.contains('chat-shake')) {
            chatOpenBtnMobile.classList.add('chat-shake');
        }
    }

    function removeShakeAnimation() {
        if (chatOpenBtn) chatOpenBtn.classList.remove('chat-shake');
        if (chatOpenBtnMobile) chatOpenBtnMobile.classList.remove('chat-shake');
    }

    // === RÉCEPTION DES MESSAGES VIA WEBSOCKET ===
    window.handleChatMessage = function (data) {
        const channel = data.channel_type || data.channel || "sector";
        appendMessage({ ...data, channel });

        if (channel !== currentChannel || !isModalOpen) {
            incrementUnreadCount(channel);
        }

        if (channel !== currentChannel) {
            const tabEl = chatTabsByChannel[channel];
            if (tabEl && !tabEl.classList.contains("holo-pulse")) {
                tabEl.classList.add("holo-pulse");
            }
        }
    };

    function forceScrollToBottom(targetContainer = null) {
        const container = targetContainer || chatContainers[currentChannel] || document.getElementById("chat-messages");
        if (!container) return;
        container.scrollTop = container.scrollHeight;
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }

    

async function async_send_chat_msg(payload) {
    try {
        
        const ws = window.canvasEngine?.ws;
        
        if (!ws) {
            console.error("[MP] WebSocket (canvasEngine.ws) non initialisé");
            return;
        }
        const msg = {
            type: "async_chat_message",
            message: payload
        };

        ws.send(msg);

    } catch (e) {
        console.error("[MP] Erreur lors de l'envoi MP via WebSocket:", e);
    }
}

    if (unreadPollIntervalId) {
        clearInterval(unreadPollIntervalId);
    }
    unreadPollIntervalId = setInterval(() => {
        if (!document.hidden) {
            loadUnreadCounts();
        }
    }, 30000);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            loadUnreadCounts();
        }
    });

    window.addEventListener("beforeunload", () => {
        if (unreadPollIntervalId) {
            clearInterval(unreadPollIntervalId);
            unreadPollIntervalId = null;
        }
    });
    window.appendMessage = appendMessage;
    window.incrementUnreadCount = incrementUnreadCount;
    window.markChannelAsRead = markChannelAsRead;
    window.getCurrentChannel = () => currentChannel;
});
