(function () {

    window.onModalLiveUpdate = function ({ targetKey, updateType, payload }) {
        // Supporte modal normal ET modal unknown
        let modalId = `modal-${targetKey}`;
        let modalEl = document.getElementById(modalId);

        if (!modalEl) {
            modalId = `modal-unknown-${targetKey}`;
            modalEl = document.getElementById(modalId);
        }

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

            case "range_maybe_changed":
                if (typeof window.refreshModalActionRanges === "function") {
                    window.refreshModalActionRanges(modalId);
                }
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

    function updateModalHp(modalEl, { hp, shield, damage_type }) {

        // 🔹 HULL
        if (hp != null) {

            const hullTextEl = modalEl.querySelector("[data-hull-current]");
            const hullBarEl = modalEl.querySelector('[data-stat="hp-bar"]');

            if (hullTextEl && hullBarEl) {

                const currentText = hullTextEl.textContent; // "34 / 50"
                const parts = currentText.split("/");

                if (parts.length === 2) {
                    const max = parseInt(parts[1].trim(), 10);

                    // Update texte
                    hullTextEl.textContent = `${hp} / ${max}`;

                    // Update largeur
                    const percent = max > 0 ? (hp / max) * 100 : 0;
                    hullBarEl.style.width = `${percent}%`;
                }
            }
        }

        // 🔹 SHIELD
        if (shield != null && damage_type) {

            const shieldTextEl = modalEl.querySelector(
                `[data-shield-type="${damage_type}"]`
            );

            const shieldBarEl = modalEl.querySelector(
                `[data-stat="DEFENSE_${damage_type}-bar"]`
            );

            if (shieldTextEl && shieldBarEl) {

                const currentText = shieldTextEl.textContent;
                const parts = currentText.split("/");

                if (parts.length === 2) {
                    const max = parseInt(parts[1].trim(), 10);

                    // Update texte
                    shieldTextEl.textContent = `${shield} / ${max}`;

                    // Update largeur
                    const percent = max > 0 ? (shield / max) * 100 : 0;
                    shieldBarEl.style.width = `${percent}%`;
                }
            }
        }
    }


    function updateModalAp(modalEl, { ap, max_ap }) {
        console.log("Updating AP in modal:",modalEl.id, { ap, max_ap });
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
