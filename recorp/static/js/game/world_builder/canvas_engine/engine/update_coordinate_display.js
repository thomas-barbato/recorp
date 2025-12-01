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
        if (obj.type === "player"){
            if(inSonar){
                name = obj.data.user.name;
            }else{
                name = "Unknown";
            }
        }
        else if (obj.type === "npc"){
            if(inSonar){
                name = obj.data.npc.name;
            }else{
                name = "Unknown";
            }
        }
        else if (obj.type === "foreground") name = obj.data.data.name;
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

    // ---------------------------
    // Determine display name
    // ---------------------------
    let name = sectorName;

    if (obj) {
        if (!sonarVisible) {
            name = "Unknown";
        } else {
            if (obj.type === "player") name = obj.data.user.name;
            else if (obj.type === "npc") name = obj.data.npc.name;
            else if (obj.type === "foreground") name = obj.data.data.name;
        }
    }else{
        hideHoverTooltip();
        return;
    }

    // ---------------------------
    // Distance from player
    // ---------------------------
    let dist = null;
    const player = window.canvasEngine?.map?.findPlayerById(window.current_player_id);

    if (player) {
        const map = window.canvasEngine?.map;
        dist = computeTooltipDistance(map, player, tx, ty);
    }

    tooltip.innerHTML = `
        <div class="font-bold text-emerald-300">${name}</div>
        <div class="text-emerald-500 font-bold">Y:<span class="text-emerald-300 font-bold">${ty.toString().padStart(2,"0")}</span> / X:<span class="text-emerald-300 font-bold">${tx.toString().padStart(2,"0")}</span></div>
        ${
            dist !== null
                ? `<div class="text-emerald-500 font-bold">Distance: <span class="text-emerald-300">${dist}</span></div>`
                : ""
        }
    `;

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

function computeTooltipDistance(map, player, tx, ty) {
    if (!map || !player) return null;

    const pf = map.pathfinder;
    const controller = pf?.controller;

    // ✓ Si destination = dernière destination pathfinding => vraie distance A*
    if (
        controller &&
        controller.lastDest &&
        controller.lastDest.x === tx &&
        controller.lastDest.y === ty &&
        Array.isArray(controller.lastPath)
    ) {
        return controller.lastPath.length; // ✓ vraie distance A*
    }

    // ✓ Survol simple = distance pré-calculée de ton moteur = Manhattan
    const dx = Math.abs(tx - player.x);
    const dy = Math.abs(ty - player.y);
    return dx + dy;
}