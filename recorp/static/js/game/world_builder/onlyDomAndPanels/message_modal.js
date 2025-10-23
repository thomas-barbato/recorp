document.addEventListener('DOMContentLoaded', () => {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    const modal = document.getElementById('private-mail-modal');
    const composeBtn = document.getElementById('pm-compose-btn');
    const composeArea = document.getElementById('pm-compose-area');
    const cancelCompose = document.getElementById('pm-cancel-compose');
    const sendBtn = document.getElementById('pm-send');
    const opened = document.getElementById('pm-opened');
    const empty = document.getElementById('pm-empty');
    const listContainer = document.getElementById('pm-list');

    function smoothToggle(showElem, hideElems = []) {
        hideElems.forEach(el => {
        el.classList.add('opacity-0', 'translate-y-3');
        setTimeout(() => el.classList.add('hidden'), 150);
        });
        showElem.classList.remove('hidden');
        setTimeout(() => {
        showElem.classList.remove('opacity-0', 'translate-y-3');
        showElem.classList.add('opacity-100', 'translate-y-0');
        }, 50);
    }

    // SEARCH
    document.getElementById('pm-search').addEventListener('input', e => {
        const q = e.target.value.trim();
        fetch(`/messages/search/?q=${encodeURIComponent(q)}`)
        .then(r => r.text())
        .then(html => { listContainer.innerHTML = html; })
        .catch(err => console.error(err));
    });

    // OPEN MAIL
    listContainer.addEventListener('click', e => {
        const item = e.target.closest('[data-id]');
        if (!item) return;
        const id = item.dataset.id;
        fetch(`/messages/get/${id}/`)
        .then(r => r.json())
        .then(data => {
            document.getElementById('pm-open-subject').textContent = data.subject;
            document.getElementById('pm-open-author').textContent = data.sender;
            document.getElementById('pm-open-body').textContent = data.body;
            document.getElementById('pm-open-time').textContent = data.timestamp;
            document.getElementById('pm-reply-btn').classList.remove('hidden');
            document.getElementById('pm-delete-btn').classList.remove('hidden');
            smoothToggle(opened, [empty, composeArea]);
        });
    });

    // DELETE
    document.getElementById('pm-delete-btn').addEventListener('click', () => {
        const subject = document.getElementById('pm-open-subject').textContent;
        if (!confirm(gettext(`Delete message "${subject}" ?`))) return;
        fetch(`/messages/delete/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: JSON.stringify({ subject }),
        }).then(() => window.location.reload());
    });

    // COMPOSE
    composeBtn.addEventListener('click', () => smoothToggle(composeArea, [opened, empty]));
    cancelCompose.addEventListener('click', () => smoothToggle(empty, [composeArea, opened]));

    sendBtn.addEventListener('click', () => {
        const to = document.getElementById('pm-to').value.trim();
        const subject = document.getElementById('pm-subject').value.trim();
        const body = document.getElementById('pm-body').value.trim();
        if (!to || !subject || !body) return alert(gettext("All fields are required"));
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<i class="fas fa-paper-plane animate-pulse mr-2"></i>${gettext("Sending...")}`;
        fetch('/messages/send/', {
        method: 'POST',
        headers: { "X-CSRFToken": csrfToken },
        body: JSON.stringify({ to, subject, body })
        })
        .then(r => r.json())
        .then(() => {
            alert(gettext("Message sent successfully!"));
            sendBtn.disabled = false;
            sendBtn.innerHTML = `<i class="fas fa-paper-plane"></i> ${gettext("Send")}`;
            smoothToggle(empty, [composeArea]);
        })
        .catch(err => console.error(err));
    });
});