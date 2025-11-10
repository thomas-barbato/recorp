
    let chatModal = document.getElementById("chat-modal");
    let chatContent = document.getElementById("chat-modal-content");
    let chatOpenBtn = document.getElementById("chat-modal-button");
    let chatOpenBtnMobile = document.getElementById("chat-modal-button-mobile");
    let chatCloseBtn = document.getElementById("close-chat-modal");
    let chatCloseBtnMobile = document.getElementById("close-chat-modal");
    let chatMessagesContainer = document.getElementById("sector-chat-messages");
    let chatInput = document.getElementById("sector-chat-input");
    let chatSendBtn = document.getElementById("sector-chat-send");

    let chatTabGlobal = document.getElementById("tab-global");
    let chatTabFaction = document.getElementById("tab-faction");
    let chatTabGroup = document.getElementById("tab-group");

    let chatCurrentTab = "global";
    let messageIndex = 0;

    console.log(action_listener_touch_click)


    function openModal() {
        chatModal.classList.remove("hidden");
        setTimeout(() => {
        chatContent.classList.remove("scale-90", "opacity-0");
        chatContent.classList.add("scale-100", "opacity-100");
        }, 50);
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        chatContent.classList.add('scale-90', 'opacity-0');
        setTimeout(() => {
            chatModal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }
    
    if (chatOpenBtn) chatOpenBtn.addEventListener(action_listener_touch_click, openModal);
    if (chatOpenBtnMobile) chatOpenBtnMobile.addEventListener(action_listener_touch_click, openModal);
    if (chatCloseBtn) chatCloseBtn.addEventListener(action_listener_touch_click, closeModal);
    if (chatCloseBtnMobile) chatCloseBtnMobile.addEventListener(action_listener_touch_click, closeModal);
    chatModal.addEventListener(action_listener_touch_click, (e) => { if (e.target === modal) closeModal(); });

    // === CHANGEMENT D'ONGLET ===
    function setTab(tab) {
        chatCurrentTab = tab;

        // On réinitialise tous les onglets
        [chatTabGlobal, chatTabFaction, chatTabGroup].forEach((b) => {
            b.classList.remove("border-b-2", "border-emerald-400", "text-emerald-400");
            b.classList.add("border-b", "border-transparent", "text-emerald-300", "hover:text-emerald-200");
        });

        // On applique uniquement au tab sélectionné
        let activeTab = document.getElementById(`tab-${tab}`);
        activeTab.classList.remove("border-transparent", "text-emerald-300", "hover:text-emerald-200");
        activeTab.classList.add("border-b-2", "border-emerald-400", "text-emerald-400");
    }

    chatTabGlobal.addEventListener("click", () => setTab("global"));
    chatTabFaction.addEventListener("click", () => setTab("faction"));
    chatTabGroup.addEventListener("click", () => setTab("group"));

    // Append message
    function appendMessage({ playerName, factionName, factionColor, body }) {
        let side = messageIndex % 2 === 0 ? "text-emerald-300" : "text-emerald-400";
        let div = document.createElement("div");
        div.className = `chat-msg ${side}`;
        div.innerHTML = `
        <span class="font-bold ${factionColor}">${playerName}</span>
        <span class="text-emerald-500/60 text-xs italic ml-1">(${factionName})</span> :
        <span class="ml-1">${body}</span>
        `;
        chatMessagesContainer.appendChild(div);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        messageIndex++;
    }

    // Simulation (à remplacer par WebSocket)
    chatSendBtn.addEventListener("click", () => {
        let text = input.value.trim();
        if (!text) return;
        appendMessage({
        playerName: "You",
        factionName: "Neutral",
        factionColor: "text-emerald-400",
        body: text
        });
        input.value = "";
    });
