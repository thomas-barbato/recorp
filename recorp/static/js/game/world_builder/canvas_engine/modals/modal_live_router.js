(function () {

    window.onModalLiveUpdate = function ({ targetKey, updateType, payload }) {
        const modalId = `modal-${targetKey}`;
        const modalEl = document.getElementById(modalId);
        if (!modalEl) return;

        switch (updateType) {

            case "scan_start":
            case "scan_shared":
                applyScanState(modalEl, payload);
                break;

            case "scan_expired":
                applyScanExpiredState(modalEl);
                break;
                
            case "movement":
                updateModalCoordinates(modalEl, payload);
                updateModalMp(modalEl, payload);
                break;

            case "mp_update":
                updateModalMp(modalEl, payload);
                break;

            case "hp_update":
                updateModalHp(modalEl, payload);
                break;

            case "ap_update":
                updateModalAp(modalEl, payload);
                updateModalActionAvailability(modalEl, payload);
                break;

            default:
                // futur
                break;
        }
    };

    // ----------------------------
    // PATCHERS DOM
    // ----------------------------

    function updateModalActionAvailability(modalEl, { ap }) {
        if (ap == null) return;

        const buttons = modalEl.querySelectorAll(".action-button-sf");

        buttons.forEach(btn => {
            const costEl = btn.querySelector("[data-ap-cost]");
            if (!costEl) return;

            const cost = parseInt(costEl.dataset.apCost, 10);
            if (Number.isNaN(cost)) return;

            if (ap < cost) {
                btn.classList.add("opacity-40", "pointer-events-none");
            } else {
                btn.classList.remove("opacity-40", "pointer-events-none");
            }
        });
    }

    function updateModalCoordinates(modalEl, { x, y }) {
        if (x == null || y == null) return;

        const header = modalEl.querySelector("h3");
        if (!header) return;

        // Remplace uniquement le [Y:?, X:?]
        header.textContent = header.textContent.replace(
            /\[Y:\d+,\s*X:\d+\]/,
            `[Y:${y}, X:${x}]`
        );
    }

    function updateModalMp(modalEl, { mp, max_mp }) {
        if (mp == null || max_mp == null) return;

        // Texte MP
        const mpText = modalEl.querySelector(
            "#ship-statistics-detailed span[data-stat='movement-text']"
        );
        if (mpText) {
            mpText.textContent = `${mp} / ${max_mp}`;
        }

        // Barre MP
        const mpBar = modalEl.querySelector(
            "#ship-statistics-detailed div[data-stat='movement-bar']"
        );
        if (mpBar) {
            const pct = Math.max(0, Math.min(100, (mp / max_mp) * 100));
            mpBar.style.width = `${pct}%`;
        }
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
