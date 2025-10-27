document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('message-modal');
    const content = document.getElementById('mail-modal-content');
    const openBtn = document.getElementById('message-modal-button');
    const openBtnMobile = document.getElementById('message-modal-button-mobile');
    const closeBtn = document.getElementById('close-mail-modal');
    const mailList = document.getElementById('mail-list');
    const searchInput = document.getElementById('search-message');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const tabInbox = document.getElementById('tab-inbox');
    const tabSent = document.getElementById('tab-sent');
    const newMsgBtn = document.getElementById('new-message-btn');

    let currentPage = 1;
    let currentTab = 'received';
    
    function closeModal() {
        modal.classList.add('hidden');
        
        content.classList.add('scale-90', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    // === OPEN / CLOSE MODAL ===
    function openModal() {
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

    // === FETCH MESSAGES ===
    async function loadMessages() {
        const url = `/messages/?page=${currentPage}&tab=${currentTab}`;
        const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        mailList.innerHTML = await response.text();
        bindMailEvents();
    }

    // === BIND EVENTS ===
    function bindMailEvents() {
        document.querySelectorAll('.mail-item').forEach(item => {
        item.addEventListener('click', async () => {
            const id = item.dataset.id;
            const res = await fetch(`/messages/get/${id}/`);
            const data = await res.json();
            showMessage(data);
        });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            const item = e.target.closest('.mail-item');
            const subject = item.querySelector('p').textContent;
            if (confirm(gettext("Delete this message?"))) {
            await fetch("/messages/delete/", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRFToken": csrf_token },
                body: JSON.stringify({ subject }),
            });
            loadMessages();
            }
        });
        });
    }

    // === SHOW SINGLE MESSAGE ===
    function showMessage(data) {
        mailList.innerHTML = `
        <div class="p-4 text-emerald-300 space-y-4 animate-fade-in">
            <h3 class="text-emerald-400 font-bold text-lg md:text-xl">${data.subject}</h3>
            <p class="text-sm">${gettext("From")}: <span class="text-emerald-200">${data.sender}</span></p>
            <p class="text-xs text-emerald-400/70">${data.timestamp}</p>
            <hr class="border-emerald-500/30">
            <p class="text-emerald-200 text-sm leading-relaxed">${data.body}</p>

            <div class="flex justify-end gap-2 mt-4">
                <button id="reply" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 rounded font-semibold transition">${gettext("Reply")}</button>
                <button id="back" class="px-4 py-2 border border-emerald-400 text-emerald-400 rounded hover:bg-emerald-400 hover:text-zinc-900 transition">${gettext("Back")}</button>
            </div>
        </div>`;

        // Retour à la liste
        document.getElementById('back').addEventListener('click', loadMessages);

        // Répondre
        document.getElementById('reply').addEventListener('click', () => {
            mailList.innerHTML = `
            <div class="p-4 text-emerald-300 space-y-4 animate-fade-in">
                <h3 class="text-emerald-400 font-bold text-lg md:text-xl">${data.subject}</h3>
                <p class="text-sm">${gettext("From")}: <span class="text-emerald-200">${data.sender}</span></p>
                <p class="text-xs text-emerald-400/70">${data.timestamp}</p>
                <hr class="border-emerald-500/30">
                <p class="text-emerald-200 text-sm leading-relaxed">${data.body}</p>
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

            // Cancel
            document.getElementById('cancel-reply')
                .addEventListener('click', loadMessages);

            // Send
            document.getElementById('send-reply').addEventListener(action_listener_touch_click, async (e) => {
                const btn = e.target;
                const body = document.getElementById('reply-body').value.trim();

                if (!body) {
                    showToast(gettext("Message cannot be empty"), false);
                    return;
                }

                const payload = JSON.stringify({
                    recipient: data.sender,
                    subject: document.getElementById('reply-subject').value,
                    body,
                    senderId: currentPlayer.user.player
                });

                setLoadingState(btn, true);

                try {
                    await async_send_mp(payload);
                    showToast(gettext("Message sent ✔"));
                    loadMessages();
                } catch {
                    showToast(gettext("Send failed ❌"), false);
                } finally {
                    setLoadingState(btn, false);
                }
            });
        });
    }


    // === PAGINATION ===
    prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadMessages(); } });
    nextBtn.addEventListener('click', () => { currentPage++; loadMessages(); });

    // === SEARCH ===
    searchInput.addEventListener('input', async e => {
        const q = e.target.value.trim();
        if (!q) return loadMessages();
        const res = await fetch(`/messages/search/?q=${encodeURIComponent(q)}`);
        mailList.innerHTML = await res.text();
        bindMailEvents();
    });

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
        <div class="p-4 space-y-4 text-sm md:text-base text-emerald-300 animate-fade-in">
            <input id="recipient" type="text" placeholder="${gettext("Recipient...")}" class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2">
            <input id="subject" type="text" placeholder="${gettext("Subject...")}" class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2">
            <textarea id="body" placeholder="${gettext("Write your message...")}" class="w-full bg-zinc-800/50 border border-emerald-500/30 rounded px-3 py-2 min-h-[120px]"></textarea>
            <div class="flex justify-end gap-3">
            <button id="cancel-new" class="border border-red-400 text-red-400 px-4 py-2 rounded hover:bg-red-400 hover:text-zinc-900 transition">${gettext("Cancel")}</button>
            <button id="send-new" class="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 px-4 py-2 rounded font-semibold transition">${gettext("Send")}</button>
            </div>
        </div>`;

        document.getElementById('cancel-new').addEventListener('click', loadMessages);

        document.getElementById('send-new').addEventListener(action_listener_touch_click, async (e) => {
            const btn = e.target;
            const recipient = document.getElementById('recipient').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const body = document.getElementById('body').value.trim();

            if (!recipient || !subject || !body) {
                showToast(gettext("Please fill all fields"), false);
                return;
            }

            const payload = JSON.stringify({
                    recipient: recipient,
                    subject: subject,
                    body: body,
                    senderId: currentPlayer.user.player
                });
                
            setLoadingState(btn, true);

            try {
                await async_send_mp(payload);
                showToast(gettext("Message sent ✔"));
                loadMessages();
            } catch {
                showToast(gettext("Failed to send ❌"), false);
            } finally {
                setLoadingState(btn, false);
            }
        });

    });

    function showToast(message, success = true) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast-cyber flex items-center gap-3 px-4 py-2 rounded-md font-semibold ${
            success ? 'success' : 'error'
        }`;

        toast.innerHTML = `
            <i class="fa-solid ${success ? 'fa-paper-plane' : 'fa-triangle-exclamation'} toast-icon"></i>
            <span>${message}</span>
            <div class="comet"></div>
        `;

        container.appendChild(toast);

        // Animation sortante
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
});

