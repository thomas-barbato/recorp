
let modal = document.getElementById('message-modal');
let content = document.getElementById('mail-modal-content');
let openBtn = document.getElementById('message-modal-button');
let openBtnMobile = document.getElementById('message-modal-button-mobile');
let closeBtn = document.getElementById('close-mail-modal');
let mailList = document.getElementById('mail-list');
let searchInput = document.getElementById('search-message');
let tabInbox = document.getElementById('tab-inbox');
let tabSent = document.getElementById('tab-sent');
let newMsgBtn = document.getElementById('new-message-btn');

let currentPage = 1;
let currentTab = 'received';
let unreadCount = 0;
let isModalOpen = false;

window.mpNotificationQueue = [];
window.mpNotificationIsShowing = false;

// ✅ Charger le compteur au démarrage
loadUnreadCount();

function closeModal() {
    isModalOpen = false;
    content.classList.add('scale-90', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.querySelectorAll('.mail-item').forEach(mail => {
            mail.remove();
        });
        document.body.style.overflow = '';
    }, 300);
}

// === OPEN MODAL ===
function openModal() {
    isModalOpen = true;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        content.classList.remove('scale-90', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 50);
    loadMessages();
}

openBtnMobile.addEventListener(action_listener_touch_click, openModal);
openBtn.addEventListener(action_listener_touch_click, openModal);
closeBtn.addEventListener(action_listener_touch_click, closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ✅ === CHARGEMENT DU COMPTEUR NON LUS ===
async function loadUnreadCount() {
    try {
        const response = await fetch('/messages/unread-count/', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await response.json();
        
        unreadCount = data.unread_count || 0;
        updateUnreadBadge();
        
        // Animation si messages non lus
        if (unreadCount > 0 && !isModalOpen) {
            addShakeAnimation();
        } else {
            removeShakeAnimation();
        }
        
    } catch (err) {
        console.error("Erreur chargement compteur messages:", err);
    }
}

// ✅ === MISE À JOUR DU BADGE ===
function updateUnreadBadge() {
    updateBadgeElement(openBtn, unreadCount);
    updateBadgeElement(openBtnMobile, unreadCount);
}

function updateBadgeElement(button, count) {
    if (!button) return;
    
    let badge = button.querySelector('.mail-badge');
    
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'mail-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold';
            button.style.position = 'relative';
            button.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count;
    } else if (badge) {
        badge.remove();
    }
}

// ✅ === ANIMATIONS ===
function addShakeAnimation() {
    if (openBtn && !openBtn.classList.contains('mail-shake')) {
        openBtn.classList.add('mail-shake');
    }
    if (openBtnMobile && !openBtnMobile.classList.contains('mail-shake')) {
        openBtnMobile.classList.add('mail-shake');
    }
}

function removeShakeAnimation() {
    if (openBtn) openBtn.classList.remove('mail-shake');
    if (openBtnMobile) openBtnMobile.classList.remove('mail-shake');
}

// === FETCH MESSAGES ===
async function loadMessages(direction = null) {
    let url = `/messages/?page=${currentPage}&tab=${currentTab}`;
    let response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    let html = await response.text();

    if (direction) {
        mailList.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
        await new Promise(r => setTimeout(r, 250));
    }

    mailList.innerHTML = html;

    if (direction) {
        mailList.classList.remove('slide-out-left', 'slide-out-right');
        mailList.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
        setTimeout(() => mailList.classList.remove('slide-in-right', 'slide-in-left'), 250);
    }

    bindMailEvents();
    bindPagination();
}

// === PAGINATION ===
function bindPagination() {
    let prev_page = document.getElementById('prev-page');
    let next_page = document.getElementById('next-page');

    if (prev_page) {
        prev_page.addEventListener('click', async () => {
            if (currentPage > 1) {
                currentPage--;
                await loadMessages('prev');
            }
        });
    }

    if (next_page) {
        next_page.addEventListener('click', async () => {
            currentPage++;
            await loadMessages('next');
        });
    }
}

// === BIND EVENTS ===
function bindMailEvents() {
    document.querySelectorAll('.mail-item').forEach(item => {
        item.addEventListener('click', async () => {
            let id = item.dataset.id;
            
            // ✅ Marquer comme lu avant d'afficher
            await markMessageAsRead(id);
            
            let res = await fetch(`/messages/get/${id}/`);
            let data = await res.json();
            showMessage(data);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            let item = e.target.closest('.mail-item');
            let id = item.dataset.id;

            let data = JSON.stringify({id});
            let deleteUrl = window.location.href.split('/play')[0] + '/messages/delete/';
            if (confirm(gettext("Delete this message?"))) {
                await fetch(deleteUrl, {
                    method: "POST",
                    headers: { 
                        "X-CSRFToken": csrf_token 
                    },
                    body: data,
                });
                loadMessages();
                // ✅ Recharger le compteur après suppression
                await loadUnreadCount();
            }
        });
    });
}

// ✅ === MARQUER COMME LU ===
async function markMessageAsRead(messageId) {
    try {
        await fetch(`/messages/mark-read/${messageId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCsrfToken()
            }
        });
        
        // Recharger le compteur
        await loadUnreadCount();
        
    } catch (err) {
        console.error("Erreur marquage lecture message:", err);
    }
}

function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || csrf_token || '';
}

// === SHOW SINGLE MESSAGE ===
function showMessage(data) {
    mailList.innerHTML = `
    <div class="p-4 text-emerald-300 space-y-4 animate-fade-in">
        <h3 class="text-emerald-400 font-bold text-lg md:text-xl">${data.subject}</h3>
        <p class="text-sm">${gettext("From")}: <span class="text-emerald-200">${data.sender}</span></p>
        <p class="text-xs text-emerald-400/70">${data.timestamp}</p>
        <hr class="border-emerald-500/30">
        <p class="text-emerald-200 text-sm leading-relaxed whitespace-pre-wrap">${data.body}</p>

        <div class="flex justify-end gap-2 mt-4">
            <button id="reply" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 rounded font-semibold transition font-orbitron">${gettext("Reply")}</button>
            <button id="back" class="px-4 py-2 border border-emerald-400 text-emerald-400 rounded hover:bg-emerald-400 hover:text-zinc-900 transition font-orbitron">${gettext("Back")}</button>
        </div>
    </div>`;

    if(data.is_author){
        document.getElementById('reply').classList.add('hidden');
    }

    document.getElementById('back').addEventListener('click', loadMessages);

    document.getElementById('reply').addEventListener('click', () => {
        mailList.innerHTML = `
        <div class="p-4 text-emerald-300 space-y-4 animate-fade-in">
            <h3 class="text-emerald-400 font-bold text-lg md:text-xl">${data.subject}</h3>
            <p class="text-sm">${gettext("From")}: <span class="text-emerald-200">${data.sender}</span></p>
            <p class="text-xs text-emerald-400/70">${data.timestamp}</p>
            <hr class="border-emerald-500/30">
            <p class="text-emerald-200 text-sm leading-relaxed whitespace-pre-wrap">${data.body}</p>
        </div>
        <div class="p-4 space-y-4 text-sm md:text-base text-emerald-300 animate-fade-in">
            <input id="reply-recipient" type="text" value="${data.sender}" readonly
                class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2 opacity-80 cursor-not-allowed">

            <input id="reply-subject" type="text" value="RE: ${data.subject}"
                class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2">

            <textarea id="reply-body" placeholder="${gettext("Write your reply...")}"
                class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2 min-h-[120px]"></textarea>

            <div class="flex justify-end gap-3">
                <button id="cancel-reply"
                    class="border border-red-400 text-red-400 px-4 py-2 rounded hover:bg-red-400 hover:text-zinc-900 transition">
                    ${gettext("Cancel")}
                </button>
                <button id="send-reply"
                    class="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 px-4 py-2 rounded font-semibold transition">
                    ${gettext("Send")}
                </button>
            </div>
        </div>`;

        document.getElementById('cancel-reply').addEventListener('click', loadMessages);

        document.getElementById('send-reply').addEventListener(action_listener_touch_click, async (e) => {
            let btn = e.target;
            let body = document.getElementById('reply-body').value.trim();

            if (!body) {
                showToast(gettext("Message cannot be empty"), false);
                return;
            }
            let payload = {
                recipient: data.sender,
                recipient_type: "player",
                subject: document.getElementById('reply-subject').value,
                body,
                senderId: current_player_id,
            };
            setLoadingState(btn, true);

            try {
                await sendPrivateMessage(payload);
            } catch {
                showToast(gettext("Send failed ✗"), false);
            } finally {
                setLoadingState(btn, false);
                displayMpList();
            }
        });
    });
}

// === SEARCH ===
searchInput.addEventListener('input', async e => {
    let q = e.target.value.trim();
    if (!q) return loadMessages();
    let res = await fetch(`/messages/search/?q=${encodeURIComponent(q)}`);
    mailList.innerHTML = await res.text();
    bindMailEvents();
});

// === DISPLAY MESSAGE LIST ===
function displayMpList(){
    tabSent.classList.remove('border-2', 'border-emerald-400');
    newMsgBtn.classList.remove('border-2', 'border-emerald-400');
    tabInbox.classList.add('border-2', 'border-emerald-400');
    loadMessages();
}

// === TABS ===
tabInbox.addEventListener('click', () => {
    currentTab = 'received';
    tabSent.classList.remove('border-2', 'border-emerald-400');
    newMsgBtn.classList.remove('border-2', 'border-emerald-400');
    tabInbox.classList.add('border-2', 'border-emerald-400');
    loadMessages();
});

tabSent.addEventListener('click', () => {
    currentTab = 'sent';
    tabInbox.classList.remove('border-2', 'border-emerald-400');
    newMsgBtn.classList.remove('border-2', 'border-emerald-400');
    tabSent.classList.add('border-2', 'border-emerald-400');
    loadMessages();
});

// === NEW MESSAGE ===
newMsgBtn.addEventListener('click', () => {
    tabSent.classList.remove('border-2', 'border-emerald-400');
    tabInbox.classList.remove('border-2', 'border-emerald-400');
    newMsgBtn.classList.add('border-2', 'border-emerald-400');

    mailList.innerHTML = `
        <div id="compose-container" class="p-3 space-y-3 animate-fade-in">
            <div class="flex gap-2 mt-3">
                <select id="recipient-type"
                    class="bg-zinc-800 border border-emerald-400 text-justify rounded px-2 py-2 text-emerald-300 text-xs">
                    <option value="player" selected>${gettext("Player")}</option>
                    <option value="faction">${gettext("Faction")}</option>
                    <option value="group" class="maybe-disabled">${gettext("Group")}</option>
                    <option value="clan" class="maybe-disabled">${gettext("Clan")}</option>
                </select>

                <div class="relative flex-1">
                    <input id="recipient" type="text" autocomplete="off"
                        placeholder="${gettext("Recipient name...")}"
                        class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2 text-emerald-300 text-xs">
                
                    <div id="recipient-autocomplete"
                        class="absolute left-0 right-0 mt-1 bg-zinc-900/90 border border-emerald-500/20 rounded shadow-lg hidden z-50 max-h-44 overflow-y-auto text-xs"></div>
                </div>

                <input id="recipient-player-id" type="hidden">
            </div>

            <div id="recipient-error" class="text-sm text-red-400/90 hidden"></div>

            <input id="subject" type="text"
                placeholder="${gettext("Subject...")}"
                class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2 text-emerald-300 text-xs">

            <textarea id="body" 
                placeholder="${gettext("Write your message...")}"
                class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2 text-emerald-300 text-sm min-h-[120px]"></textarea>

            <div class="flex justify-end gap-3 mt-4">
                <button id="cancel-new" class="border border-red-400 text-red-400 px-4 py-2 rounded">${gettext("Cancel")}</button>
                <button id="send-new" class="send-btn bg-emerald-500 hover:bg-emerald-400 text-zinc-900 px-4 py-2 rounded font-semibold">${gettext("Send")}</button>
            </div>
        </div>`;

    bindComposeEvents();
    
    document.getElementById('cancel-new').addEventListener('click', loadMessages);

    document.getElementById('send-new').addEventListener(action_listener_touch_click, async (e) => {
        let btn = e.target;
        let recipient_type = document.getElementById('recipient-type').value;
        let recipient = document.getElementById('recipient').value.trim();
        let subject = document.getElementById('subject').value.trim();
        let body = document.getElementById('body').value.trim();

        if (!recipient || !subject || !body) {
            showToast(gettext("Please fill all fields"), false);
            return;
        }

        let payload = {
            recipient: recipient,
            subject: subject,
            body: body,
            recipient_type: recipient_type,
            senderId: currentPlayer.user.player
        };
            
        setLoadingState(btn, true);

        try {
            await sendPrivateMessage(payload);
        } catch {
            showToast(gettext("Failed to send ✗"), false);
        } finally {
            setLoadingState(btn, false);
            displayMpList();
        }
    });
});

function showToast(message, success = true, element_id = "toast-container") {
    let container = document.getElementById(element_id);
    if (!container) return;

    let toast = document.createElement("div");
    toast.className = `toast-cyber flex items-center gap-3 px-4 py-2 rounded-md font-semibold ${
        success ? 'success' : 'error'
    }`;

    toast.innerHTML = `
        <i class="fa-solid ${success ? 'fa-paper-plane' : 'fa-triangle-exclamation'} toast-icon"></i>
        <span>${message}</span>
        <div class="comet"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("cyber-exit");
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

function setLoadingState(button, state) {
    if (state) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }
}

function bindComposeEvents() {
    let recipientInput = document.getElementById('recipient');
    let recipientType = document.getElementById('recipient-type');
    let recipientAutocomplete = document.getElementById('recipient-autocomplete');
    let recipientPlayerId = document.getElementById('recipient-player-id');
    let recipientError = document.getElementById('recipient-error');
    let sendBtn = document.getElementById('send-new');

    function clearAutocomplete() {
        recipientAutocomplete.innerHTML = '';
        recipientAutocomplete.classList.add('hidden');
    }

    function showError(msg) {
        recipientError.textContent = msg;
        recipientError.classList.remove('hidden');
        recipientInput.classList.add('shake-error');
    }

    function debounce(fn, delay=250) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }
    }

    recipientType.addEventListener('change', () => {
        let mode = recipientType.value;
        recipientError.classList.add('hidden');
        recipientInput.classList.remove('shake-error');

        if(mode === "player"){
            recipientInput.disabled = false;
            recipientInput.value = "";
        } else {
            recipientInput.disabled = true;
            recipientInput.value = mode === "faction" ? currentPlayer.faction.name : mode;
            clearAutocomplete();
        }
    });

    let searchPlayers = debounce(async () => {
        let q = recipientInput.value.trim();
        if(q.length < 2) return clearAutocomplete();
        let res = await fetch(`/messages/search_players/?q=${encodeURIComponent(q)}`)
        let {results} = await res.json();

        if(!results.length) return clearAutocomplete();

        recipientAutocomplete.innerHTML = "";
        results.forEach(p => {
            let div = document.createElement('div');
            div.className = "px-3 py-1 text-xs hover:bg-emerald-500/10 cursor-pointer";
            div.textContent = `${p.name} — ${p.faction}`;
            div.addEventListener('click', () => {
                recipientInput.value = p.name;
                recipientPlayerId.value = p.id;
                clearAutocomplete();
            });
            recipientAutocomplete.appendChild(div);
        });

        recipientAutocomplete.classList.remove('hidden');
    });

    if(recipientInput)
        recipientInput.addEventListener('input', searchPlayers);

    if(sendBtn)
        sendBtn.addEventListener('click', async () => {
            let mode = recipientType.value;
            if(mode === "player" && !recipientPlayerId.value) return showError(gettext("Recipient not found"));
        });

    document.addEventListener('click', (e) => {
        if (!recipientAutocomplete.contains(e.target) && e.target !== recipientInput)
            clearAutocomplete();
    });
}

// === NOTIFICATION DEPUIS WEBSOCKET ===
function showPrivateMessageNotification(note) {
    // Recharger le compteur quand un nouveau message arrive
    loadUnreadCount();
    
    // Optionnel : afficher un toast
    showToast(note || gettext("You have received a private message"));
}

/**
 * Ajoute une notification à la file.
 */
function enqueueMpNotification(note) {
    window.mpNotificationQueue.push(note);
    processMpNotificationQueue();
}

/**
 * Traite les notifications une par une (séquentiel).
 */
async function processMpNotificationQueue() {
    if (window.mpNotificationIsShowing) return;
    if (window.mpNotificationQueue.length === 0) return;

    window.mpNotificationIsShowing = true;

    const nextNote = window.mpNotificationQueue.shift();
    await showMpNotificationSciFi(nextNote);

    window.mpNotificationIsShowing = false;

    // Traiter la suivante
    processMpNotificationQueue();
}

/**
 * Affiche une notification sci-fi (Promise pour gestion séquentielle)
 */
function showMpNotificationSciFi(note) {
    return new Promise(resolve => {
        const container = document.getElementById("mp-notification-container");
        if (!container) return resolve();

        const notif = document.createElement("div");

        notif.className = `
            relative
            bg-amber-500/90
            border border-amber-400
            text-white font-semibold
            rounded-lg px-4 py-3
            flex items-center gap-3
            w-[90vw] sm:w-[320px]
            shadow-[0_0_30px_rgba(255,230,140,0.55)]
            backdrop-blur-md select-none cursor-pointer
            animate-[mp-holo-border_2s_ease-in-out_infinite]
            animate-[mp-pop_0.35s_ease-out]
            overflow-hidden
        `;

        notif.innerHTML = `
            <i class="fa-solid fa-envelope text-white text-lg drop-shadow-[0_0_6px_#fff]"></i>
            <div class="flex flex-col leading-tight">
                <span class="text-white font-bold">${note}</span>
            </div>

            <div class="mp-scanline"></div>
            <div class="mp-radar-pulse"></div>
        `;

        container.appendChild(notif);

        const removeDelay = 5500;
        const timer = setTimeout(() => remove(), removeDelay);

        notif.addEventListener("click", () => {
            clearTimeout(timer);
            remove();
            if (typeof openModal === "function") {
                openModal();
            }
        });

        function remove() {
            notif.style.animation = "mp-fade-out 0.4s forwards";
            setTimeout(() => {
                notif.remove();
                resolve();
            }, 400);
        }
    });
}

// NOTIFICATION DEPUIS WEBSOCKET
function showPrivateMessageNotification(note) {
    const finalNote = note || (window.gettext
        ? gettext("You have received a private message")
        : "You have received a private message");

    enqueueMpNotification(finalNote);
}

async function sendPrivateMessage(payload) {
    try {
        const ws = window.canvasEngine?.ws;

        if (!ws) {
            console.error("[MP] WebSocket CanvasEngine non initialisé");
            throw new Error("No WebSocket");
        }

        // STRINGIFY OBLIGATOIRE : le serveur fait json.loads(message)
        ws.send({
            type: "async_send_mp",
            message: JSON.stringify(payload),
        });

    } catch (err) {
        console.error("[MP] Erreur envoi MP:", err);
        throw err; // << ton UI gérera le toast
    }
}


// ✅ === RAFRAÎCHISSEMENT AUTOMATIQUE ===
// Recharger le compteur toutes les 30 secondes
setInterval(loadUnreadCount, 30000);
// === Exposer fonctions pour handlers WebSocket ===
window.loadMessages = loadMessages; 
window.showPrivateMessageNotification = showPrivateMessageNotification;
window.openMailModal = openModal;
window.loadUnreadCount = loadUnreadCount;
window.sendPrivateMessage = sendPrivateMessage;