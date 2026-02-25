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

    function updateModalHp(modalEl, { hp, max_hp, shield, damage_type, shields, shield_max }) {
        // 🔹 HULL (current + max)
        const hullTextEl = modalEl.querySelector("[data-hull-current]");
        const hullBarEl = modalEl.querySelector('[data-stat="hp-bar"]');
        if (hullTextEl && hullBarEl && (hp != null || max_hp != null)) {
            const currentText = hullTextEl.textContent || "";
            const parts = currentText.split("/");

            let current = hp;
            let max = max_hp;

            if (parts.length === 2) {
                if (current == null) {
                    const parsedCurrent = parseInt(parts[0].trim(), 10);
                    if (!Number.isNaN(parsedCurrent)) current = parsedCurrent;
                }
                if (max == null) {
                    const parsedMax = parseInt(parts[1].trim(), 10);
                    if (!Number.isNaN(parsedMax)) max = parsedMax;
                }
            }

            if (current != null && max != null) {
                hullTextEl.textContent = `${current} / ${max}`;
                const percent = Number(max) > 0 ? (Number(current) / Number(max)) * 100 : 0;
                hullBarEl.style.width = `${percent}%`;
            }
        }

        // 🔹 SHIELDS (nouveau format complet)
        if (shields && typeof shields === "object") {
            Object.entries(shields).forEach(([dtype, value]) => {
                if (value == null) return;
                updateModalHp(modalEl, {
                    shield: value,
                    damage_type: dtype,
                    shield_max: (shield_max && typeof shield_max === "object")
                        ? { [dtype]: shield_max[dtype] }
                        : undefined
                });
            });
        }

        // 🔹 SHIELD MAX only (si current ne change pas)
        if (shield_max && typeof shield_max === "object" && (!shields || typeof shields !== "object")) {
            Object.entries(shield_max).forEach(([dtype, value]) => {
                if (value == null) return;
                updateShieldLine(modalEl, {
                    damage_type: dtype,
                    shield: null,
                    max_shield: value,
                });
            });
        }

        // 🔹 SHIELD (format partiel legacy ou issu du format complet)
        if (shield != null && damage_type) {
            updateShieldLine(modalEl, {
                damage_type,
                shield,
                max_shield: shield_max?.[damage_type],
            });
        } else if (damage_type && shield_max?.[damage_type] != null) {
            updateShieldLine(modalEl, {
                damage_type,
                shield: null,
                max_shield: shield_max[damage_type],
            });
        }
    }

    function updateShieldLine(modalEl, { damage_type, shield, max_shield }) {
        if (!damage_type) return;

        const shieldTextEl = modalEl.querySelector(
            `[data-shield-type="${damage_type}"]`
        );

        const shieldBarEl = modalEl.querySelector(
            `[data-stat="DEFENSE_${damage_type}-bar"]`
        );

        if (!shieldTextEl || !shieldBarEl) return;

        const currentText = shieldTextEl.textContent || "";
        const parts = currentText.split("/");
        if (parts.length !== 2) return;

        let current = shield != null ? Number(shield) : parseInt(parts[0].trim(), 10);
        let max = max_shield != null ? Number(max_shield) : parseInt(parts[1].trim(), 10);

        if (!Number.isFinite(current) || !Number.isFinite(max)) return;

        shieldTextEl.textContent = `${current} / ${max}`;
        const percent = max > 0 ? (current / max) * 100 : 0;
        shieldBarEl.style.width = `${percent}%`;
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
