(function () {

    window.onModalLiveUpdate = function ({ targetKey, updateType, payload }) {
        const modalId = `modal-${targetKey}`;
        const modalEl = document.getElementById(modalId);
        if (!modalEl) return;

        switch (updateType) {
                
            case "mp_update":
                updateModalCoordinates(modalEl, payload);
                updateModalMp(modalEl, payload);
                break;

            case "hp_update":
                updateModalHp(modalEl, payload);
                break;

            case "ap_update":
                updateModalAp(modalEl, payload);
                break;

            default:
                break;
        }
    };

    // ----------------------------
    // PATCHERS DOM
    // ----------------------------

    function updateModalCoordinates(modalEl, { x, y }) {
        if (x == null || y == null) return;

        const coordSpan = modalEl.querySelector("[data-role='coordinates']");
        if (!coordSpan) return;

        coordSpan.textContent = `[Y:${y}, X:${x}]`;
    }

    function updateModalMp(modalEl, { mp, max_mp }) {
        if (mp == null) return;

        const mpText = modalEl.querySelector(
            "#ship-statistics-detailed span[data-stat='movement-text']"
        );
        const mpBar = modalEl.querySelector(
            "#ship-statistics-detailed div[data-stat='movement-bar']"
        );

        let max = max_mp;

        // lire le max depuis le DOM
        if (max == null && mpText) {
            const parts = mpText.textContent.split("/");
            if (parts.length === 2) {
                const parsed = parseInt(parts[1], 10);
                if (!Number.isNaN(parsed)) {
                    max = parsed;
                }
            }
        }

        if (max == null) return;

        mpText.textContent = `${mp} / ${max}`;

        const pct = Math.max(0, Math.min(100, (mp / max) * 100));
        mpBar.style.width = `${pct}%`;
    }

    function updateModalHp(modalEl, { hp, max_hp }) {
        if (hp == null || max_hp == null) return;

        const text = modalEl.querySelector("[data-stat='hp-text']");
        const bar  = modalEl.querySelector("[data-stat='hp-bar']");

        if (text) {
            text.textContent = `${hp} / ${max_hp}`;
        }

        if (bar) {
            const pct = Math.max(0, Math.min(100, (hp / max_hp) * 100));
            bar.style.width = `${pct}%`;
        }
    }

    function updateModalAp(modalEl, { ap, max_ap }) {
        if (ap == null || max_ap == null) return;

        const text = modalEl.querySelector("[data-stat='ap-text']");
        const bar  = modalEl.querySelector("[data-stat='ap-bar']");

        if (text) {
            text.textContent = `${ap} / ${max_ap}`;
        }

        if (bar) {
            const pct = Math.max(0, Math.min(100, (ap / max_ap) * 100));
            bar.style.width = `${pct}%`;
        }
    }
})();
