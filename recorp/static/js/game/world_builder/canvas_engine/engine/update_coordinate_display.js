let hoverRequestId = 0;

export function isDesktop() {
    return window.innerWidth >= 1024;   // breakpoint PC/tablette large
}

export function updatePlayerCoords(playerObj) {
    if (!isDesktop()) return;
    if (!playerObj) return;

    const px = document.getElementById("player-coord-x");
    const py = document.getElementById("player-coord-y");

    if (!px || !py) return;

    px.textContent = String(playerObj.x).padStart(2, "0");
    py.textContent = String(playerObj.y).padStart(2, "0");
}

export function updateTargetCoords(obj, tx, ty, sectorName) {
    if (!isDesktop()) return;

    const nameEl = document.getElementById("target-coord-name");
    const xEl = document.getElementById("target-coord-x");
    const yEl = document.getElementById("target-coord-y");

    if (!nameEl || !xEl || !yEl) return;

    // NOM
    let name = sectorName; // défaut : nom du secteur
    
    let inSonar = true;
    if (window.canvasEngine?.renderer?.sonar && obj) {
        inSonar = window.canvasEngine.renderer.sonar.isVisible(obj);
    }
    if (obj) {
        if (obj.type === "player") {
            const key = `pc_${obj.data.user.player}`;
            if (inSonar || window.isScanned(key)) {
                name = obj.data.user.name;
            } else {
                name = "Unknown";
            }
        }
        else if (obj.type === "npc") {
            const key = `npc_${obj.data.npc.id}`;
            if (inSonar || window.isScanned(key)) {
                name = obj.data.npc.displayed_name;
            } else {
                name = "Unknown";
            }
        }
        else if (obj.type === "foreground") name = obj.data.data.name;
        else if (obj.type === "wreck") name = "Epave";
    }

    nameEl.textContent = name;

    // COORDS
    xEl.textContent = String(tx).padStart(2, "0");
    yEl.textContent = String(ty).padStart(2, "0");

    // rendre les champs visibles
    xEl.classList.remove("invisible");
    yEl.classList.remove("invisible");
}

export function clearTargetCoords(sectorName) {
    if (!isDesktop()) return;

    const nameEl = document.getElementById("target-coord-name");
    const xEl = document.getElementById("target-coord-x");
    const yEl = document.getElementById("target-coord-y");

    if (!nameEl || !xEl || !yEl) return;

    nameEl.textContent = sectorName ?? "Nothing selected";

    xEl.textContent = "";
    yEl.textContent = "";

    xEl.classList.add("invisible");
    yEl.classList.add("invisible");
}

export function updateHoverTooltip(obj, tx, ty, sectorName, evt, sonarVisible) {
    if (!isDesktop()) return;

    const tooltip = document.getElementById("tooltip-hover");
    if (!tooltip) return;

    const worker = window.canvasEngine?.gameWorker;

    // ---------------------------
    // Determine display name
    // ---------------------------
    let name = sectorName;

    if (obj) {
        if (!sonarVisible) {
            if (obj.type === "player") {
                const key = `pc_${obj.data.user.player}`;
                if (!window.isScanned(key)) {
                    name = "Unknown";
                }else{
                    name = obj.data.user.name;
                }
            } else if (obj.type === "npc") {
                const key = `npc_${obj.data.npc.id}`;
                if (!window.isScanned(key)) {
                    name = "Unknown";
                }else{
                    name = obj.data.npc.displayed_name;
                }
            }
        }else{
            if (obj.type === "player") {
                name = obj.data.user.name;
            } else if (obj.type === "npc") {
                name = obj.data.npc.displayed_name;
            }
        }
        
        if (obj.type === "foreground") name = obj.data.data.name;
        if (obj.type === "wreck") name = "Epave";
    }else{
        hideHoverTooltip();
        return;
    }

    // ---------------------------
    // Distance from player
    // ---------------------------
    let dist = null;
    
    const player = window.canvasEngine?.map?.findPlayerById(window.current_player_id);

    if (worker && player && obj) {

        const requestId = ++hoverRequestId;

        // SNAPSHOT IMMUTABLE
        const snapshot = {
            tooltip,
            name,
            tx,
            ty,
            isSelf: obj === player,
        };

        worker.call("compute_distance", {
            from: {
                x: player.x,
                y: player.y,
                sizeX: player.sizeX,
                sizeY: player.sizeY
            },
            to: {
                x: obj.x,
                y: obj.y,
                sizeX: obj.sizeX,
                sizeY: obj.sizeY
            }
        }).then(dist => {

            // réponse obsolète
            if (requestId !== hoverRequestId) return;

            renderTooltip({
                ...snapshot,
                dist
            });
        });
    }

    if (!evt) return;

    // Position dynamique
    const x = evt.clientX + 14;
    const y = evt.clientY + 14;

    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

    tooltip.classList.remove("hidden");
    tooltip.classList.add("visible");
}

export function hideHoverTooltip() {
    if (!isDesktop()) return;

    const tooltip = document.getElementById("tooltip-hover");
    if (!tooltip) return;

    tooltip.classList.remove("visible");
    tooltip.classList.add("hidden");
}

function renderTooltip({ tooltip, name, tx, ty, dist, isSelf }) {
    tooltip.innerHTML = `
        <div class="font-bold text-emerald-300">
            ${isSelf ? "You" : name}
        </div>
        <div class="text-emerald-500 font-bold">
            Y:<span class="text-emerald-300">${ty.toString().padStart(2,"0")}</span>
            /
            X:<span class="text-emerald-300">${tx.toString().padStart(2,"0")}</span>
        </div>
        ${
            !isSelf
                ? `<div class="text-emerald-500 font-bold">
                    Distance: <span class="text-emerald-300">${dist}</span>
                  </div>`
                : ""
        }
    `;
}
