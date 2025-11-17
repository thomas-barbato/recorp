document.addEventListener('DOMContentLoaded', () => {
    const chatModal = document.getElementById("chat-modal");
    const chatContent = document.getElementById("chat-modal-content");
    const chatOpenBtn = document.getElementById("chat-modal-button");
    const chatOpenBtnMobile = document.getElementById("chat-modal-button-mobile");
    const chatCloseBtn = document.getElementById("close-chat-modal");
    const chatInput = document.getElementById("chat-input");
    const chatSendBtn = document.getElementById("chat-send");

    const chatTabSector = document.getElementById("tab-sector");
    const chatTabFaction = document.getElementById("tab-faction");
    const chatTabGroup = document.getElementById("tab-group");

    const chatContainers = {
        sector: document.getElementById('chat-sector-messages'),
        faction: document.getElementById('chat-faction-messages'),
        group: document.getElementById('chat-group-messages'),
    };

    let currentChannel = "sector";
    let altColor = false;
    let messageIndex = 0;
    let isModalOpen = false; // ✅ Tracker si le modal est ouvert
    let unreadCounts = { sector: 0, faction: 0, group: 0 }; // ✅ Compteur de messages non lus

    // === OUVERTURE / FERMETURE MODAL ===
    function openModal() {
        isModalOpen = true; // ✅
        chatModal.classList.remove("hidden");
        setTimeout(() => {
            chatContent.classList.remove("scale-90", "opacity-0");
            chatContent.classList.add("scale-100", "opacity-100");
            forceScrollToBottom(); 
        }, 50);
        document.body.style.overflow = "hidden";
        loadChatMessages(currentChannel).then(() => forceScrollToBottom());
        
        // ✅ Marquer les messages comme lus et retirer les notifications
        markChannelAsRead(currentChannel);
    }

    function closeModal() {
        isModalOpen = false; // ✅
        chatContent.classList.add("scale-90", "opacity-0");
        setTimeout(() => {
            chatModal.classList.add("hidden");
            document.body.style.overflow = "";
        }, 300);
    }

    if (chatOpenBtn) chatOpenBtn.addEventListener(action_listener_touch_click, openModal);
    if (chatOpenBtnMobile) chatOpenBtnMobile.addEventListener(action_listener_touch_click, openModal);
    if (chatCloseBtn) chatCloseBtn.addEventListener(action_listener_touch_click, closeModal);
    chatModal.addEventListener(action_listener_touch_click, (e) => {
        if (e.target === chatModal) closeModal();
    });

    // === CHANGEMENT D'ONGLET ===
    function setTab(tab) {
        currentChannel = tab;

        // Changement visuel des onglets
        [chatTabSector, chatTabFaction, chatTabGroup].forEach((b) => {
            if (!b) return;
            b.classList.remove("border-b-2", "border-emerald-400", "text-emerald-400");
            b.classList.add("border-b", "border-transparent", "text-emerald-300", "hover:text-emerald-200");
        });
        const activeTab = document.getElementById(`tab-${tab}`);
        if (activeTab) {
            activeTab.classList.remove("border-transparent", "text-emerald-300", "hover:text-emerald-200");
            activeTab.classList.add("border-b-2", "border-emerald-400", "text-emerald-400");
        }

        // Masquer / afficher les bons conteneurs
        Object.keys(chatContainers).forEach(k => {
            const c = chatContainers[k];
            if (!c) return;
            c.classList.toggle('hidden', k !== tab);
        });

        // charger l'historique du canal sélectionné
        loadChatMessages(tab);
        
        // ✅ Marquer le canal comme lu
        markChannelAsRead(tab);
    }

    if (chatTabSector) chatTabSector.addEventListener("click", () => setTab("sector"));
    if (chatTabFaction) chatTabFaction.addEventListener("click", () => setTab("faction"));
    if (chatTabGroup) chatTabGroup.addEventListener("click", () => setTab("group"));

    // === CHARGER LES MESSAGES ===
    async function loadChatMessages(channel) {
        const url = `/chat/get/${channel}/`;
        try {
            const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            const data = await response.json();
            renderMessages(channel, data.messages || []);
        } catch (err) {
            console.error("Erreur lors du chargement du chat :", err);
        }
    }

    function renderMessages(channel, messages) {
        const container = chatContainers[channel];
        if (!container) return;

        container.innerHTML = "";
        messageIndex = 0;
        altColor = false;
        messages.forEach(m => appendMessage({ ...m, channel }));
        if (channel === currentChannel) forceScrollToBottom();
    }

    function appendMessage({ author, faction, faction_color, content, timestamp, channel }) {
        const container = chatContainers[channel || currentChannel];
        if (!container) return;

        const sideClass = altColor ? "text-emerald-300" : "text-emerald-400";
        const bgClass = altColor ? "bg-emerald-900/20" : "bg-emerald-800/10";
        altColor = !altColor;

        const div = document.createElement("div");
        div.className = `chat-msg rounded-md p-1 ${bgClass} ${sideClass}`;
        div.innerHTML = `
            <div class="flex items-center flex-wrap">
                ${faction ? `<small class="${faction_color} font-shadow">(${faction})</small>` : ''}
                <span class="font-bold font-shadow ${faction_color || 'text-emerald-400'}">${escapeHtml(author)}</span>
                <small class="text-emerald-500/60 italic font-shadow ml-2">${timestamp || ''}</small>
            </div>
            <p class="text-emerald-300 text-xs break-words p-2 font-shadow">${escapeHtml(content)}</p>
        `;
        container.appendChild(div);
        forceScrollToBottom();
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
            action: "async_chat_message",
            channel: currentChannel,
            sender_id: current_player_id,
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

    // ✅ === SYSTÈME DE NOTIFICATION ===
    function markChannelAsRead(channel) {
        unreadCounts[channel] = 0;
        updateNotificationBadge();
        updateTabBadge(channel);
        
        // Retirer l'animation de secousse
        removeShakeAnimation();
    }

    function incrementUnreadCount(channel) {
        unreadCounts[channel]++;
        updateNotificationBadge();
        updateTabBadge(channel);
        
        // Ajouter l'animation de secousse si modal fermé
        if (!isModalOpen) {
            addShakeAnimation();
        }
    }

    function updateNotificationBadge() {
        const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
        
        // Badge sur le bouton principal
        updateBadgeElement(chatOpenBtn, totalUnread);
        
        // Badge sur le bouton mobile
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
        const tab = document.getElementById(`tab-${channel}`);
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
            
            // Animation de pulsation sur l'onglet
            tab.classList.add("holo-pulse");
        } else if (badge) {
            badge.remove();
            tab.classList.remove("holo-pulse");
        }
    }

    function addShakeAnimation() {
        // Animation sur bouton desktop
        if (chatOpenBtn && !chatOpenBtn.classList.contains('chat-shake')) {
            chatOpenBtn.classList.add('chat-shake');
        }
        
        // Animation sur bouton mobile
        if (chatOpenBtnMobile && !chatOpenBtnMobile.classList.contains('chat-shake')) {
            chatOpenBtnMobile.classList.add('chat-shake');
        }
    }

    function removeShakeAnimation() {
        if (chatOpenBtn) {
            chatOpenBtn.classList.remove('chat-shake');
        }
        if (chatOpenBtnMobile) {
            chatOpenBtnMobile.classList.remove('chat-shake');
        }
    }

    // === RÉCEPTION DES MESSAGES VIA CONSUMER ===
    window.handleChatMessage = function (data) {
        const channel = data.channel_type || data.channel || "sector";
        appendMessage({ ...data, channel });

        // ✅ Si le message n'est pas pour le canal actif ou modal fermé
        if (channel !== currentChannel || !isModalOpen) {
            incrementUnreadCount(channel);
        }

        // Si message pour autre onglet, pulser l'onglet
        if (channel !== currentChannel) {
            const tabEl = document.getElementById(`tab-${channel}`);
            if (tabEl && !tabEl.classList.contains("holo-pulse")) {
                tabEl.classList.add("holo-pulse");
            }
        }
    };

    function maybeScrollToBottom(container) {
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom < 100) {
            try {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            } catch (e) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }

    function forceScrollToBottom() {
        const container = document.getElementById("chat-messages");
        if (!container) return;
        container.scrollTop = container.scrollHeight;
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }

    function handleKeyboardResize(container) {
        if (!container) return;
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            let originalHeight = window.innerHeight;
            window.addEventListener('resize', () => {
                const isKeyboardOpen = window.innerHeight < originalHeight * 0.85;
                if (isKeyboardOpen) {
                    setTimeout(() => forceScrollToBottom(), 120);
                }
            });
        }
    }

    window.appendMessage = appendMessage;
});