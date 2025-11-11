document.addEventListener('DOMContentLoaded', () => {
    const chatModal = document.getElementById("chat-modal");
    const chatContent = document.getElementById("chat-modal-content");
    const chatOpenBtn = document.getElementById("chat-modal-button");
    const chatOpenBtnMobile = document.getElementById("chat-modal-button-mobile");
    const chatCloseBtn = document.getElementById("close-chat-modal");
    const chatMessagesContainer = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const chatSendBtn = document.getElementById("chat-send");

    // Onglets
    const chatTabSector = document.getElementById("tab-sector");
    const chatTabFaction = document.getElementById("tab-faction");
    const chatTabGroup = document.getElementById("tab-group");

    let currentChannel = "sector";
    let altColor = false;
    let messageIndex = 0;

    // === OUVERTURE / FERMETURE MODAL ===
    function openModal() {
        chatModal.classList.remove("hidden");
        setTimeout(() => {
            chatContent.classList.remove("scale-90", "opacity-0");
            chatContent.classList.add("scale-100", "opacity-100");
        }, 50);
        document.body.style.overflow = "hidden";
        loadChatMessages(currentChannel);
    }

    function closeModal() {
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

    // === CHANGEMENT D’ONGLET ===
    function setTab(tab) {
        currentChannel = tab;

        [chatTabSector, chatTabFaction, chatTabGroup].forEach((b) => {
            b.classList.remove("border-b-2", "border-emerald-400", "text-emerald-400");
            b.classList.add("border-b", "border-transparent", "text-emerald-300", "hover:text-emerald-200");
        });

        const activeTab = document.getElementById(`tab-${tab}`);
        activeTab.classList.remove("border-transparent", "text-emerald-300", "hover:text-emerald-200");
        activeTab.classList.add("border-b-2", "border-emerald-400", "text-emerald-400");

        loadChatMessages(tab);
    }

    chatTabSector.addEventListener("click", () => setTab("sector"));
    chatTabFaction.addEventListener("click", () => setTab("faction"));
    chatTabGroup.addEventListener("click", () => setTab("group"));

    // === CHARGER LES MESSAGES ===
    async function loadChatMessages(channel) {
        const url = `/chat/get/${channel}/`;
        try {
            const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            const data = await response.json();
            renderMessages(data.messages);
        } catch (err) {
            console.error("Erreur lors du chargement du chat :", err);
        }
    }

    function renderMessages(messages) {
        chatMessagesContainer.innerHTML = "";
        messageIndex = 0;
        messages.forEach(m => appendMessage(m));
    }

    // === AJOUTER UN MESSAGE ===
    function appendMessage({ author, faction, faction_color, content, timestamp }) {
        const sideClass = altColor ? "text-emerald-300" : "text-emerald-400";
        const bgClass = altColor ? "bg-emerald-900/20" : "bg-emerald-800/10";
        altColor = !altColor;

        const div = document.createElement("div");
        div.className = `chat-msg p-2 rounded-md my-1 ${bgClass} ${sideClass}`;
        div.innerHTML = `
            <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold ${faction_color || 'text-emerald-400'}">${author}</span>
                ${faction ? `<span class="text-[10px] px-2 py-0.5 rounded-md border ${faction_color} uppercase font-bold">${faction}</span>` : ''}
                <span class="text-emerald-500/60 text-[10px] italic">${timestamp || ''}</span>
            </div>
            <p class="text-emerald-300 text-xs break-words mt-1">${content}</p>
        `;
        chatMessagesContainer.appendChild(div);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    // === ENVOI DE MESSAGE ===
    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        const payload = {
            action: "async_chat_message",
            channel_type: currentChannel,
            content: text,
        };

        // Envoi via WebSocket (déjà géré dans async_action_register.js)
        async_send_chat_msg(payload);

        // Ajout immédiat côté client
        appendMessage({
            author: currentPlayer.user.name || "You",
            faction: currentPlayer.faction_name,
            faction_color: "text-emerald-400",
            content: text,
        });

        chatInput.value = "";
    }

    chatSendBtn.addEventListener(action_listener_touch_click, sendChatMessage);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendChatMessage();
    });

    // === RÉCEPTION DES MESSAGES VIA CONSUMER ===
    window.handleChatMessage = function (data) {
        if (data.channel_type === currentChannel) {
            appendMessage(data);
        }
    };
});