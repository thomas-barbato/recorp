function showPrivateMessageNotification(note) {
    const container = document.getElementById("mp-notification-container");
    if (!container) return;

    const notif = document.createElement("div");
    notif.className = "mp-notification relative mp-radar bg-amber-500/90 border border-amber-300 text-white shadow-[0_0_15px_rgba(254,230,133,0.4)] font-semibold rounded-lg px-4 py-3 flex items-center gap-3 w-[90vw] sm:w-[320px] cursor-pointer backdrop-blur-md pointer-events-auto select-none";
    notif.innerHTML = `
        <i class="fa-solid fa-envelope text-amber-100  drop-shadow-[0_0_5px_#fee685] text-lg"></i>
        <div class="flex flex-col">
            <span class="text-white font-bold">${gettext(note)}</span>
        </div>
    `;

    container.appendChild(notif);

    // Suppression auto après 5 secondes
    const timer = setTimeout(() => fadeOutNotif(notif), 5000);

    // Fermeture manuelle au clic
    notif.addEventListener("click", () => {
        clearTimeout(timer);
        fadeOutNotif(notif);
        openMailModal();
    });

    function fadeOutNotif(el) {
        el.classList.add("fade-out");
        setTimeout(() => el.remove(), 400);
    }
    const mailList = document.querySelector('#mail-list');
    if (mailList && !mailList.classList.contains('hidden')) {
        loadMessages();
    }
}

function openMailModal() {
    const modal = document.getElementById('message-modal');
    const content = document.getElementById('mail-modal-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        content.classList.remove('scale-90', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 50);

    if (typeof loadMessages === "function") {
        loadMessages();
    }
}