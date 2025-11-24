export function initMobilePathfinding(engine) {
    const cross = document.getElementById("mobile-cross");
    if (!cross) {
        console.warn("[MOBILE PF] #mobile-cross introuvable, skip mobile pathfinding.");
        return;
    }

    const { map, renderer, pathfinding } = engine || {};
    if (!map || !renderer || !pathfinding) {
        console.warn("[MOBILE PF] engine incomplet, skip mobile pathfinding.");
        return;
    }

    const btnTop = document.getElementById("move-top");
    const btnBottom = document.getElementById("move-bottom");
    const btnLeft = document.getElementById("move-left");
    const btnRight = document.getElementById("move-right");
    const btnCenter = document.getElementById("center");
    const btnReset = document.getElementById("top-left");

    if (!btnTop || !btnBottom || !btnLeft || !btnRight || !btnCenter || !btnReset) {
        console.warn("[MOBILE PF] Boutons de la croix incomplets, skip.");
        return;
    }

    const clickEvt = window.action_listener_touch_click || "click";

    const state = {
        destX: null,
        destY: null
    };

    function getPlayer() {
        if (!window.current_player_id) return null;
        return map.findPlayerById(window.current_player_id);
    }

    function isAreaFree(destX, destY, me) {
        const sizeX = me.sizeX || 1;
        const sizeY = me.sizeY || 1;

        for (let dy = 0; dy < sizeY; dy++) {
            for (let dx = 0; dx < sizeX; dx++) {
                const tx = destX + dx;
                const ty = destY + dy;

                if (tx < 0 || ty < 0 || tx >= map.mapWidth || ty >= map.mapHeight) {
                    return false;
                }
                if (map.isBlockedTile(tx, ty)) {
                    return false;
                }
            }
        }
        return true;
    }

    function setCenterDisabled(disabled) {
        const center = btnCenter;
        const centerIcon = center.querySelector("i");

        if (disabled) {
            center.disabled = true;
            center.classList.add("text-red-600", "border-red-600", "disabled-arrow");
            center.classList.remove("text-emerald-400", "active:bg-[#25482D]");
            if (centerIcon) {
                centerIcon.classList.add("text-red-600");
                centerIcon.classList.remove("text-emerald-400", "active:text-white");
            }
        } else {
            center.disabled = false;
            center.classList.remove("text-red-600", "border-red-600", "disabled-arrow");
            center.classList.add("text-emerald-400", "active:bg-[#25482D]");
            if (centerIcon) {
                centerIcon.classList.remove("text-red-600");
                centerIcon.classList.add("text-emerald-400", "active:text-white");
            }
        }
    }

    function setDirectionButtonState(btn, enabled) {
        const icon = btn.querySelector("i");

        if (enabled) {
            btn.disabled = false;
            btn.classList.remove("disabled-arrow", "border-red-600");
            btn.classList.add("bg-gray-900/40", "border-[#B1F1CB]/40", "active:bg-[#25482D]");
            if (icon) {
                icon.classList.remove("text-red-600");
                icon.classList.add("text-emerald-400");
            }
        } else {
            btn.disabled = true;
            btn.classList.add("disabled-arrow", "border-red-600");
            btn.classList.remove("bg-gray-900/40", "border-[#B1F1CB]/40", "active:bg-[#25482D]");
            if (icon) {
                icon.classList.add("text-red-600");
                icon.classList.remove("text-emerald-400");
            }
        }
    }

    function disableAllDirectionsRed() {
        [btnTop, btnBottom, btnLeft, btnRight].forEach(btn => setDirectionButtonState(btn, false));
        setCenterDisabled(true);
    }

    function computeInitialDest(direction, me) {
        const sx = me.x;
        const sy = me.y;
        const w = me.sizeX;
        const h = me.sizeY;

        switch (direction) {
            case "top":
                return { x: sx + Math.floor(w / 2), y: sy - 1 };
            case "bottom":
                return { x: sx + Math.floor(w / 2), y: sy + h };
            case "left":
                return { x: sx - 1, y: sy + Math.floor(h / 2) };
            case "right":
                return { x: sx + w, y: sy + Math.floor(h / 2) };
            default:
                return null;
        }
    }

    function computeCandidateDest(direction, me) {
        const dx = (direction === "right") - (direction === "left");
        const dy = (direction === "bottom") - (direction === "top");

        if (state.destX == null || state.destY == null) {
            return computeInitialDest(direction, me);
        }

        return {
            x: state.destX + dx,
            y: state.destY + dy
        };
    }

    function refreshButtons() {
        const me = getPlayer();
        if (!me || !me.data || !me.data.ship) {
            disableAllDirectionsRed();
            return;
        }

        const pm = me.data.ship.current_movement || 0;
        if (pm <= 0) {
            // plus de PM -> tout rouge
            disableAllDirectionsRed();
            return;
        }

        // Directions autorisées (bord de map + obstacles)
        const directions = [
            { dir: "top",    btn: btnTop },
            { dir: "bottom", btn: btnBottom },
            { dir: "left",   btn: btnLeft },
            { dir: "right",  btn: btnRight }
        ];

        directions.forEach(({ dir, btn }) => {
            const cand = computeCandidateDest(dir, me);
            if (!cand) {
                setDirectionButtonState(btn, false);
                return;
            }

            const { x, y } = cand;
            if (x < 0 || y < 0 || x >= map.mapWidth || y >= map.mapHeight) {
                setDirectionButtonState(btn, false);
                return;
            }

            const free = isAreaFree(x, y, me);
            setDirectionButtonState(btn, free);
        });

        // center en fonction du pathfinding courant
        if (pathfinding.current && !pathfinding.invalidPreview) {
            setCenterDisabled(false);
        } else {
            setCenterDisabled(true);
        }
    }

    function resetPreview() {
        state.destX = null;
        state.destY = null;
        if (pathfinding && typeof pathfinding.clear === "function") {
            pathfinding.clear();
        }
        refreshButtons();
    }

    function handleArrow(direction) {
        const me = getPlayer();
        if (!me || !me.data || !me.data.ship) return;

        const pm = me.data.ship.current_movement || 0;
        if (pm <= 0) {
            disableAllDirectionsRed();
            return;
        }

        const cand = computeCandidateDest(direction, me);
        if (!cand) return;

        const { x, y } = cand;

        // bord de map → on bloque la direction
        if (x < 0 || y < 0 || x >= map.mapWidth || y >= map.mapHeight) {
            refreshButtons();
            return;
        }

        // on laisse CanvasPathfinding gérer PM + obstacles :
        // - si ok -> current + path verts
        // - si impossible / PM insuffisants -> invalidPreview rouge
        if (typeof pathfinding._compute === "function") {
            pathfinding._compute(x, y);
        } else {
            console.warn("[MOBILE PF] pathfinding._compute indisponible");
            return;
        }

        // si on a un chemin valide, on mémorise la destination
        if (pathfinding.current && !pathfinding.invalidPreview) {
            state.destX = x;
            state.destY = y;
        } else {
            // zone rouge : on garde quand même le curseur là,
            // mais le center sera désactivé.
            state.destX = x;
            state.destY = y;
        }

        if (renderer && renderer.requestRedraw) {
            renderer.requestRedraw();
        }

        refreshButtons();
    }

    function handleCenter() {
        if (!pathfinding || !pathfinding.current || pathfinding.invalidPreview) {
            return;
        }

        if (typeof pathfinding._sendMoveToServer === "function") {
            pathfinding._sendMoveToServer();
        } else {
            console.warn("[MOBILE PF] pathfinding._sendMoveToServer indisponible");
            return;
        }

        // après envoi du mouvement, on nettoie la preview
        resetPreview();
    }

    // listeners
    btnTop.addEventListener(clickEvt, () => handleArrow("top"));
    btnBottom.addEventListener(clickEvt, () => handleArrow("bottom"));
    btnLeft.addEventListener(clickEvt, () => handleArrow("left"));
    btnRight.addEventListener(clickEvt, () => handleArrow("right"));
    btnCenter.addEventListener(clickEvt, () => handleCenter());
    btnReset.addEventListener(clickEvt, () => resetPreview());

    // init
    refreshButtons();

    console.log("[MOBILE PF] Mobile pathfinding initialisé.");
}
