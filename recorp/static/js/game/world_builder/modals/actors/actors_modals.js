
function create_modal(modalId, extractDataFromId, extractedDataForModal){
    let element_type = extractDataFromId.type;
    let modal = "";
    let modalData = "";

    switch(element_type){
        case "pc":
            if(extractDataFromId.isUnknown == true){
                modalData = createPlayerModalData(extractedDataForModal.data)
                modal = createUnknownPcModal(modalId, modalData);   
            }else{
                modalData = createPlayerModalData(extractedDataForModal.data);
                const targetKey = `${extractDataFromId.type}_${extractDataFromId.id}`;
                const isScanned = window.isScanned(targetKey);
                modalData._ui = modalData._ui || {};
                modalData._ui.scanned = isScanned;
                modal = create_pc_npc_modal(modalId, modalData, false);
            }
            break;
        case "npc":
            if(extractDataFromId.isUnknown == true){
                modalData = createNpcModalData(extractedDataForModal.data)
                modal = createUnknownNpcModal(modalId, modalData);
            }else{
                modalData = createNpcModalData(extractedDataForModal.data)
                const targetKey = `${extractDataFromId.type}_${extractDataFromId.id}`;
                const isScanned = window.isScanned(targetKey);
                modalData._ui = modalData._ui || {};
                modalData._ui.scanned = isScanned;
                // RESTAURER L'ÉTAT SCANNÉ SI BESOIN
                if (extractedDataForModal?.__fromScan === true || extractedDataForModal?.__ui?.scanned === true) {
                    modalData._ui.scanned = true;
                } 
                modal = create_pc_npc_modal(modalId, modalData, true);
            }
            break;
        default:
            if (!extractedDataForModal) {
                console.error("Foreground element not found", data);
                return;
            }
            let foregroundData = extractForegroundModalData(extractedDataForModal)
            modalData = createForegroundModalData(foregroundData, extractedDataForModal.data)
            modal = create_foreground_modal(modalId, modalData)
            break;
    }
    
    if(modal){
        document.querySelector("#modal-container").append(modal);
    }

}

function buildAsteroidResourcesSection(modalId, data) {
    const container = document.createElement("div");
    container.id = `${modalId}-resources`;
    container.classList.add("w-full", "mt-3");

    const isScanned = data._ui?.scanned === true;

    if (!isScanned) {
        const msg = document.createElement("p");
        msg.textContent = data.resources?.translated_scan_msg_str || "Un scan est requis pour identifier les ressources.";
        msg.classList.add("text-sm","text-red-500","font-bold","animate-pulse", "font-shadow");
        container.append(msg);
        return container;
    }

    const res = data.resources;
    const qty = Number(res?.quantity ?? 0);

    if (!res || qty <= 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = "Les ressources sont épuisées.";
        emptyMsg.classList.add("text-sm","text-red-500","font-bold","animate-pulse", "font-shadow");
        container.append(emptyMsg);
        return container;
    }

    const p = document.createElement("p");
    const name = res.translated_text_resource || res.name || "Ressource";
    const max = res.max_quantity ?? res.max ?? "?";
    p.textContent = `${name} : ${qty}${max !== "?" ? " / " + max : ""}`;
    p.classList.add("text-sm","text-white", "font-shadow");
    container.append(p);

    return container;
}


function create_foreground_modal(modalId, data) {
    const modal = createStandardModalShell(modalId);
    // === HEADER (UNIFIÉ, STYLE CHAT / PC / NPC) ===
    const coords = `[Y:${data.coordinates.y}, X:${data.coordinates.x}]`;

    // Nettoyage complet
    modal.header.el.innerHTML = "";

    // Classes header (emerald = secteur)
    modal.header.el.classList.add(
        "flex",
        "w-full",
        "justify-between",
        "items-start",
        "px-5",
        "py-4",
        "border-b",
        "border-emerald-700",
        "bg-gradient-to-r",
        "from-emerald-700/60",
        "to-zinc-900/60",
        "shadow-inner",
        "rounded-t-xl"
    );

    // Wrapper vertical
    const headerWrapper = document.createElement("div");
    headerWrapper.classList.add("flex", "flex-col", "w-full");

    // ── Ligne 1 : nom + coords ──
    const topRow = document.createElement("div");
    topRow.classList.add(
        "flex",
        "flex-row",
        "items-center",
        "justify-between",
        "w-full"
    );

    const left = document.createElement("div");
    left.classList.add(
        "flex",
        "flex-row",
        "items-center",
        "gap-1",
        "w-full",
        "justify-start"
    );

    const nameEl = document.createElement("span");
    nameEl.textContent = data.name.toUpperCase();
    nameEl.classList.add(
        "lg:text-xl",
        "text-md",
        "font-bold",
        "text-white",
        "font-orbitron"
    );

    const coordEl = document.createElement("span");
    coordEl.dataset.role = "coordinates";
    coordEl.textContent = coords;
    coordEl.classList.add(
        "text-md",
        "text-white"
    );

    left.append(nameEl, coordEl);
    topRow.append(left);

    // Assemblage
    headerWrapper.append(topRow);
    modal.header.el.append(headerWrapper);

    // Close button (inchangé)
    modal.header.setCloseButton(modalId);
    if (!data._ui) {
        data._ui = {
            scanned: false,
            shared: false
        };
    }

    // IMAGE
    const imgWrap = document.createElement("div");
    imgWrap.classList.add("flex", "justify-center", "w-full");

    const foregroundType = data.animation.dir;
    const foregroundName = data.animation.img;

    if (foregroundType && foregroundName) {
        const img = document.createElement("img");
        img.src = `/static/img/foreground/${foregroundType}/${foregroundName}/0.gif`;
        img.style.width = (data.size.x * 32) + "px";
        img.style.height = (data.size.y * 32) + "px";
        img.style.objectFit = "contain";
        imgWrap.append(img);
        modal.body.addSection(imgWrap);
    } else {
        console.warn("Foreground image missing:", data.animation);
    }

    modal.body.addSection(imgWrap);

    // INFOS
    if (data.description) {
        const desc = document.createElement("p");
        desc.textContent = data.description;
        desc.classList.add("text-sm", "text-white", "opacity-80", "font-shadow");
        modal.body.addSection(desc);
    }
    // RESSOURCES, si asteroid / étoile.
    if (data.type === "asteroid" || data.type === "star") {
        const resourcesLabel = document.createElement("label");
        resourcesLabel.textContent = "RESSOURCES :";
        resourcesLabel.classList.add("font-bold", "text-white", "mt-2", "font-shadow", "w-full","font-orbitron");

        modal.body.addSection(resourcesLabel);
        modal.body.addSection(
            buildAsteroidResourcesSection(modalId, data)
        );
    }

    // ACTIONS
    const actionsLabel = document.createElement("label");
    actionsLabel.textContent = "ACTIONS:";
    actionsLabel.classList.add("w-full", "font-bold", "text-white", "mt-2", "text-start", "font-shadow","font-orbitron");
    modal.body.addSection(actionsLabel);

    const actionsSection = buildForegroundActionsSection(modalId, data);
    modal.body.addSection(actionsSection);

    modal.footer.setCloseButton(modalId);
    return modal.root;
}


function createUnknownModal(modalId, data, is_npc) {

    // 👉 On réutilise EXACTEMENT le shell NPC
    const modal = createStandardModalShell(modalId);

    // === HEADER (identique NPC) ===
    const coords = data.player?.coordinates || data.coordinates;
    const coordStr = coords ? `[Y:${coords.y}, X:${coords.x}]` : "";

    modal.header.el.innerHTML = "";
    modal.header.el.classList.add(
        "flex",
        "w-full",
        "justify-between",
        "items-center",
        "px-5",
        "py-4",
        "border-b",
        "border-red-800",
        "bg-gradient-to-r",
        "from-red-700/60",
        "to-zinc-900/60",
        "shadow-inner",
        "rounded-t-xl"
    );

    const headerWrapper = document.createElement("div");
    headerWrapper.classList.add("flex", "flex-col", "w-full");

    const topRow = document.createElement("div");
    topRow.classList.add("flex", "items-center", "justify-between", "w-full");

    const left = document.createElement("div");
    left.classList.add("flex", "items-center", "gap-1");

    const nameEl = document.createElement("span");
    nameEl.textContent = "UNKNOWN";
    nameEl.classList.add(
        "lg:text-xl",
        "text-md",
        "font-bold",
        "text-white",
        "font-orbitron"
    );

    const coordEl = document.createElement("span");
    coordEl.textContent = coordStr;
    coordEl.dataset.role = "coordinates";
    coordEl.classList.add("text-md", "text-white");

    left.append(nameEl, coordEl);
    topRow.append(left);

    headerWrapper.append(topRow);
    modal.header.el.append(headerWrapper);

    modal.header.setCloseButton(modalId);

    // Image UNKNOWN
    const unknownImg = document.createElement("img");
    unknownImg.src = "/static/img/ux/unknown-spaceship.png";
    unknownImg.classList.add(
        "mx-auto",
        "object-center",
        "h-[100px]",
        "w-[100px]",
    );
    modal.body.addSection(unknownImg);

    // ACTIONS
    const actionsLabel = document.createElement("label");
    actionsLabel.textContent = data.actions.action_label.toUpperCase() + ":";
    actionsLabel.classList.add(
        "w-full",
        "font-bold",
        "font-shadow",
        "text-white",
        "text-base",
        "mt-2",
        "font-orbitron"
    );
    modal.body.addSection(actionsLabel);

    // MODULES LABEL
    const modulesLabel = document.createElement("label");
    modulesLabel.textContent = "MODULES:";
    modulesLabel.classList.add(
        "w-full",
        "font-bold",
        "font-shadow",
        "text-white",
        "text-base",
        "mt-2",
        "font-orbitron"
    );
    modal.body.addSection(modulesLabel);

    const modulesWarning = document.createElement("p");
    modulesWarning.textContent = "Scan requis pour afficher les modules.";
    modulesWarning.classList.add(
        "text-red-500",
        "font-bold",
        "text-xs",
        "text-center",
        "font-shadow",
        "animate-pulse"
    );
    modal.body.addSection(modulesWarning);


    const contextZone = document.createElement("div");
    contextZone.id = modalId + "-action-context";
    contextZone.classList.add("hidden", "w-full", "mt-3");
    modal.body.addSection(contextZone);

    const errorZone = document.createElement("div");
    errorZone.id = modalId + "-action-error-zone";
    errorZone.classList.add("action-error-msg", "hidden");
    modal.body.addSection(errorZone);

    const actionsSection = buildActionsSection(modalId, data, is_npc, contextZone);
    modal.body.addSection(actionsSection);

    // FOOTER
    modal.footer.setCloseButton(modalId);

    return modal.root;
}

function create_pc_npc_modal(modalId, data, is_npc) {

    // === MODAL SHELL ===
    const modal = createStandardModalShell(modalId);

    // === HEADER ===
    const coords = data.player?.coordinates || data.coordinates;
    const coordStr = coords ? `[Y:${coords.y}, X:${coords.x}]` : "";

    // Nettoyage du header
    modal.header.el.innerHTML = "";

    let header_gradientFrom = is_npc ? "from-red-700/60" : "from-cyan-600/60";
    let header_gradientTo = "to-zinc-900/60";
    let header_border =  is_npc ? "border-red-800" : "border-cyan-600";
    
    modal.header.el.classList.add(
        "flex", 
        "w-full",
        "justify-between", 
        "items-center", 
        "px-5", 
        "py-4", 
        "border-b", 
        header_border, 
        header_gradientFrom, 
        "bg-gradient-to-r", 
        header_gradientTo, 
        "shadow-inner",
        "rounded-t-xl",
        "items-start"
    );

    // Wrapper vertical
    const headerWrapper = document.createElement("div");
    headerWrapper.classList.add("flex", "flex-col", "w-full");

    // ── Ligne 1 : nom + coords + close ──
    const topRow = document.createElement("div");
    topRow.classList.add(
        "flex",
        "flex-row",
        "items-center",
        "justify-between",
        "w-full"
    );

    const left = document.createElement("div");
    left.classList.add("flex", "flex-row", "items-center", "gap-1", "w-full", "justify-start");

    const nameEl = document.createElement("span");
    nameEl.textContent = (data.player?.name || "UNKNOWN").toUpperCase();
    nameEl.classList.add("lg:text-xl","text-md","text-center",
                        "font-bold","flex",
                        "text-white","justify-center", "font-orbitron");

    const coordEl = document.createElement("span");
    coordEl.dataset.role = "coordinates";
    coordEl.textContent = coordStr;
    coordEl.classList.add("text-md","text-center","flex",
                        "text-white","justify-center" );

    left.append(nameEl, coordEl);


    topRow.append(left);

    // ── Ligne 2 : countdown (VIDE, volontairement) ──
    const bottomRow = document.createElement("div");
    bottomRow.classList.add(
        "scan-timer-container",
        "flex",
        "justify-center",
        "mt-1",
        "text-xl"
    );

    // Assemblage
    headerWrapper.append(topRow, bottomRow);
    modal.header.el.append(headerWrapper);

    const targetKey = (is_npc ? "npc_" : "pc_") + data.player.id;

    if (data._ui?.scanned === true && window.scannedMeta?.[targetKey]) {

        // --- Texte du titre ---
        const titleText = document.createElement("div");
        nameEl.textContent = (data.player?.name || "UNKNOWN").toUpperCase();
        coordEl.textContent = coordStr;
        // --- Scan timer ---
        const scanInfo = document.createElement("div");
        scanInfo.classList.add(
            "scan-timer",
            "flex",
            "items-center",
            "justify-center",
            "gap-2",
            "text-xl",
            "text-emerald-300",
            "font-shadow",
            "font-bold"
        );

        const meta = window.getScanMeta(targetKey);
        if (meta?.expires_at) scanInfo.dataset.expiresAt = meta.expires_at;

        const icon = document.createElement("img");
        icon.src = "/static/img/ux/scan_ship.svg";
        icon.classList.add("w-5", "h-5", "opacity-90");

        const label = document.createElement("span");
        label.classList.add("countdown-label");
        label.textContent = "--:--:--";

        scanInfo.append(icon, label);
        
        bottomRow.append(titleText, scanInfo);

        // après avoir injecté le HTML du timer
        const root = modal?.root || modal;
        const timerContainer = root?.querySelector?.(".scan-timer");

        if (timerContainer && window.startCountdownTimer) {
            window.startCountdownTimer(timerContainer, {
                expires_at: meta.expires_at,
                onExpire: () => {
                    // Marque l’expiration locale
                    window.scanExpiredLocal.add(targetKey);
                    // Redraw carte (vaisseau / npc / foreground)
                    window.canvasEngine?.renderer?.requestRedraw();
                    
                }
            });
        }
    }

    // 3️⃣ Croix de fermeture (inchangée)
    modal.header.setCloseButton(modalId);

    // === BODY ===

    // IMAGE
    const shipImage = buildPcNpcImage(data, is_npc);
    modal.body.addSection(shipImage);

    // STATS
    const statsSection = buildShipStatsSection(data);
    if (data._ui?.scanned === true) {
        statsSection.ship_statistics_warning_msg_container_p.classList.add("hidden");
        statsSection.ship_detailed_statistics_container_div.classList.remove("hidden");
    }
    modal.body.addSection(statsSection.ship_statistics_container_label);
    modal.body.addSection(statsSection.ship_statistics_warning_msg_container_p);
    modal.body.addSection(statsSection.ship_detailed_statistics_container_div);

    // MODULES LABEL
    const modulesLabel = document.createElement("label");
    modulesLabel.textContent = "MODULES:";
    modulesLabel.classList.add(
        "w-full",
        "font-bold",
        "font-shadow",
        "text-white",
        "text-base",
        "mt-2",
        "font-orbitron"
    );
    modal.body.addSection(modulesLabel);

    // MODULES
    if (data._ui?.scanned === true) {
        modal.body.addSection(buildModulesSection(modalId, data));
    } else {
        const warning = document.createElement("p");
        warning.classList.add(
            "text-red-500",
            "font-bold",
            "text-xs",
            "text-center",
            "font-shadow",
            "animate-pulse"
        );
        warning.textContent = "Scan requis pour afficher les modules.";
        modal.body.addSection(warning);
    }

    // ACTIONS LABEL
    const actionsLabel = document.createElement("label");
    actionsLabel.textContent = data.actions.action_label.toUpperCase() + ":";
    actionsLabel.classList.add(
        "w-full",
        "font-bold",
        "font-shadow",
        "text-white",
        "text-base",
        "mt-2",
        "font-orbitron"
    );
    modal.body.addSection(actionsLabel);

    // ACTION CONTEXT
    const contextZone = document.createElement("div");
    contextZone.id = modalId + "-action-context";
    contextZone.classList.add("hidden", "w-full", "mt-3");
    modal.body.addSection(contextZone);

    const errorZone = document.createElement("div");
    errorZone.classList.add("action-error-msg", "hidden");
    errorZone.id = modalId + "-action-error-zone";
    modal.body.addSection(errorZone);

    const actionsSection = buildActionsSection(modalId, data, is_npc, contextZone);
    modal.body.addSection(actionsSection);

    // FOOTER
    modal.footer.setCloseButton(modalId);

    // Accordions
    setTimeout(() => activateExclusiveAccordions(modal.root), 50);

    return modal.root;
}

function buildShipStatsSection(data) {
    // LABEL GENERAL
    let ship_statistics_container_label = document.createElement("label");
    ship_statistics_container_label.textContent = `${data.actions.translated_statistics_label.toUpperCase()}: `;
    ship_statistics_container_label.classList.add(
        "font-bold",
        "font-shadow",
        "text-white",
        "text-justify",
        "text-base",
        "w-full",
        "font-orbitron"    
    );

    // --- CONTENEUR "SIMPLE STATS" (laissé vide pour compat) ---
    let ship_statistics_container_div = document.createElement("div");
    ship_statistics_container_div.id = "ship-statistics";

    // --- CONTENEUR STATS DÉTAILLÉES ---
    let ship_detailed_statistics_container_div = document.createElement("div");
    ship_detailed_statistics_container_div.id = "ship-statistics-detailed";
    ship_detailed_statistics_container_div.classList.add("w-full", "p-2", "hidden"); // ⬅ caché par défaut

    // Helper pour une barre de progression
    function createProgressBar(current, max, labelText, type) {
        let wrapper = document.createElement("div");

        let label = document.createElement("label");
        let label_icon = document.createElement('span');
        let label_text = document.createElement('span');
        
        let label_icon_className = "";

        if(type == "hp"){ label_icon_className ="iconify game-icons--shieldcomb w-[20px] h-[20px]";}
        if(type == "ap"){ label_icon_className = "iconify game-icons--targeting w-[20px] h-[20px]"; }
        if(type == "movement"){ label_icon_className = "iconify game-icons--interceptor-ship w-[20px] h-[20px]"; }
        if(type == "DEFENSE_BALLISTIC"){ label_icon_className = "iconify game-icons--shield-reflect w-[20px] h-[20px]"; }
        if(type == "DEFENSE_THERMAL"){ label_icon_className = "iconify game-icons--laser-warning w-[20px] h-[20px]"; }
        if(type == "DEFENSE_MISSILE"){ label_icon_className = "iconify game-icons--dragon-shield w-[20px] h-[20px]"; }

        label_icon.className = label_icon_className;
        label_text.textContent = labelText;
        label.append(label_icon, label_text)
        label.classList.add("font-shadow", "text-white", "gap-2", "flex", "items-center", "font-orbitron");

        let container = document.createElement("div");
        container.classList.add("w-full", "bg-red-600", "relative", "h-[15px]", "overflow-hidden");

        let content = document.createElement("div");
        content.classList.add("bg-blue-600", "leading-none", "h-[15px]");

        let text = document.createElement("span");
        text.classList.add(
            "w-full",
            "absolute",
            "z-10",
            "text-center",
            "text-xs",
            "font-bold",
            "text-blue-100",
            "font-shadow"
        );
        text.textContent = `${current} / ${max}`;

        let percent = max > 0 ? Math.round((current * 100) / max) : 0;
        content.style.width = (percent > 100 ? 100 : percent) + "%";

        if (type === "movement") {
            text.dataset.stat = "movement-text";
            content.dataset.stat = "movement-bar";
        }

        if (type === "hp") {
            text.dataset.stat = "hp-text";
            text.dataset.hullCurrent = current;
            content.dataset.stat = "hp-bar";
        }
        if (type === "ap") {
            text.dataset.stat = "ap-text";
            content.dataset.stat = "ap-bar";
        }
        
        if(type == "DEFENSE_BALLISTIC"){ 
            text.dataset.shieldType = "BALLISTIC";
            content.dataset.stat = "DEFENSE_BALLISTIC-bar"; 
        }
        if(type == "DEFENSE_THERMAL"){ 
            text.dataset.shieldType = "THERMAL"; 
            content.dataset.stat = "DEFENSE_THERMAL-bar"; 
        }
        if(type == "DEFENSE_MISSILE"){ 
            text.dataset.shieldType = "MISSILE"; 
            content.dataset.stat = "DEFENSE_MISSILE-bar"; 
        }

        container.append(text, content);
        wrapper.append(label, container);
        return wrapper;
    }

    // --- HP ---
    ship_detailed_statistics_container_div.append(
        createProgressBar(
            data.ship.current_hp,
            data.ship.max_hp,
            "Hull points:",
            "hp"
        )
    );
    // --- AP ---
    if(data.player.max_ap){
        ship_detailed_statistics_container_div.append(
            createProgressBar(
                data.player.current_ap,
                data.player.max_ap,
                "Action points:",
                "ap"
            )
        );
    }
    
        // --- Movement ---
    ship_detailed_statistics_container_div.append(
        createProgressBar(
            data.ship.current_movement,
            data.ship.max_movement,
            "Movement left:",
            "movement"
        )
    );

    // --- DEFENSES (ballistic / thermal / missile) ---
    const DEF_CONFIG = [
        {
            type: "DEFENSE_BALLISTIC",
            currentKey: "current_ballistic_defense",
            maxKey: "max_ballistic_defense",
            label: "Ballistic defense:"
        },
        {
            type: "DEFENSE_THERMAL",
            currentKey: "current_thermal_defense",
            maxKey: "max_thermal_defense",
            label: "Thermal defense:"
        },
        {
            type: "DEFENSE_MISSILE",
            currentKey: "current_missile_defense",
            maxKey: "max_missile_defense",
            label: "Missile defense:"
        }
    ];

    if (Array.isArray(data.ship.modules)) {
        DEF_CONFIG.forEach(defConf => {
            const mod = data.ship.modules.find(m => m.type === defConf.type && m.effect && typeof m.effect.defense !== "undefined");
            let currentVal;
            let maxVal;
            if (!mod){
                currentVal = data.ship[defConf.currentKey] ?? 0;
                maxVal = data.ship[defConf.maxKey] ?? 0;

            }else{
                currentVal = data.ship[defConf.currentKey] ?? 0;
                maxVal = mod.effect.defense ?? 0;
            }

            ship_detailed_statistics_container_div.append(
                createProgressBar(currentVal, maxVal, defConf.label, defConf.type)
            );
        });
    }

    // --- WARNING MSG ---
    let ship_statistics_warning_msg_container_p = document.createElement("p");
    ship_statistics_warning_msg_container_p.classList.add(
        "text-justify",
        "font-shadow",
        "text-xs",
        "lg:p-2",
        "text-red-500",
        "animate-pulse",
        "font-bold",
        "font-shadow"
    );
    ship_statistics_warning_msg_container_p.id = "statistics-warning-msg";
    ship_statistics_warning_msg_container_p.textContent = `${data.actions.translated_statistics_str} `;

    // Par défaut : ON montre le warning, ON cache les stats détaillées
    // (le bouton Scan s'occupera de faire l'inverse)
    ship_detailed_statistics_container_div.classList.add("hidden");

    return {
        ship_statistics_container_label,
        ship_statistics_container_div,
        ship_detailed_statistics_container_div,
        ship_statistics_warning_msg_container_p
    };
}

let display_attack_options = function(e_id, element) {
    let parent_el = document.querySelector('#' + e_id);
    let id_nb = element;
    let other_element_id = id_nb == "1" ? "2" : "1";
    let option = parent_el.querySelector('#offensive-module-body-' + id_nb);
    let other_option = parent_el.querySelector('#offensive-module-body-' + other_element_id);
    let option_svg = parent_el.querySelector('#offensive-module-menu-svg-' + id_nb);
    let other_option_svg = parent_el.querySelector('#offensive-module-menu-svg-' + other_element_id);

    if (option.classList.contains("hidden")) {
        option.classList.remove("hidden");
        other_option.classList.add("hidden");
    } else {
        option.classList.add("hidden");
    }
    if (option_svg.classList.contains('rotate-180') === true) {
        option_svg.classList.remove("rotate-180");
        other_option_svg.classList.add('rotate-180') === false ? other_option_svg.classList.remove('rotate-180') : other_option_svg.classList.add('rotate-180');
    } else {
        option_svg.classList.add("rotate-180");
        other_option_svg.classList.contains('rotate-180') === true ? other_option_svg.classList.add('rotate-180') : other_option_svg.classList.remove('rotate-180');
    }
}

function check_radio_btn_and_swap_color(id, module_id) {
    let element = document.querySelector('#' + id);
    let module_list = element.querySelectorAll('.module-container');
    let action_btn = element.querySelector('#action-btn');
    action_btn.classList.remove('hidden');

    for (let i = 0; i < module_list.length; i++) {
        let radio_btn = module_list[i].querySelector('input[type=radio]');
        if (module_list[i].id == module_id) {
            radio_btn.checked = true;
            module_list[i].classList.remove(
                'hover:border-gray-800',
                'border-slate-400',
                'hover:bg-slate-300',
                'bg-gray-800',
                'text-white',
                'hover:text-gray-800',
                'divide-white',
                'hover:divide-gray-800',
                "font-shadow",
            )
            module_list[i].classList.add(
                'border-gray-800',
                'bg-slate-300',
                'text-gray-800',
                'divide-gray-800',
                "font-shadow",
            )
        } else {
            radio_btn.checked = false;
            module_list[i].classList.remove(
                'border-gray-800',
                'hover:border-slate-400',
                'bg-slate-300',
                'hover:bg-gray-800',
                'text-gray-800',
                'hover:text-white',
                'divide-gray-800',
                "font-shadow",
            )
            module_list[i].classList.add(
                'hover:border-gray-800',
                'border-slate-400',
                'hover:bg-slate-300',
                'bg-gray-800',
                'text-white',
                'hover:text-gray-800',
                'divide-white',
                'hover:divide-gray-800',
                "font-shadow",
            )

        }
    }
}

function create_chat_modal(data){
    let modal_container = document.querySelector("#modal-container");
    let modal_open_button = document.querySelector('#chat-btn');
    modal_open_button.addEventListener('touchstart', function(){
        open_close_modal('modal-chat')
    })
    let e = document.createElement('div');
    e.id = "modal-chat";
    e.setAttribute('aria-hidden', true);
    e.setAttribute('tabindex', -1);
    e.classList.add(
        'hidden',
        'overflow-y-auto',
        'overflow-x-hidden',
        'fixed',
        'top-0',
        'right-0',
        'left-0',
        'z-50',
        'justify-center',
        'items-center',
        'w-full',
        'h-full',
        'md:inset-0',
        'border-1',
        'bg-black/40',
        'backdrop-blur-md',
        'animate-modal-fade'
    );
    
    let container_div = document.createElement('div');
    container_div.classList.add("fixed", "md:p-3", "top-0", "right-0", "left-0", "z-50", "w-full", "md:inset-0", "h-screen");

    let header_container_div = document.createElement('div');
    header_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row');
    header_container_div.textContent = "ok test chat"

    let content_div = document.createElement('div');
    content_div.classList.add('relative', 'rounded-lg', 'shadow', 'w-full', 'lg:w-1/4', 'rounded-t', 'flex', 'justify-center', 'mx-auto', 'flex-col', 'border-2', 'border-slate-600', 'bg-gradient-to-b', 'from-amber-600/70', 'to-black/70');

    let footer_container_div = document.createElement('div');
    footer_container_div.classList.add('p-2', 'flex', 'flex-row', 'w-[100%]',  'justify-end', 'align-center');

    container_div.append(header_container_div);
    container_div.append(content_div);
    container_div.append(footer_container_div);

    e.append(container_div);

    modal_container.append(e)
}

function createUnknownPcModal(modalId, modalData, playerInfo) {
    let modalIdWithPrefix = modalId;

    let visiblePlayerModal = document.getElementById(modalId);
    visiblePlayerModal?.remove();

    if(!checkIfModalExists(modalIdWithPrefix)){
        
        let modal = createUnknownModal(
            modalIdWithPrefix, 
            modalData, 
            true
        );
        
        document.querySelector('#modal-container').append(modal);
    }
    
    return;
    
}

function createUnknownNpcModal(modalId, modalData) {
    
    let modalIdWithPrefix = `modal-unknown-pc_${modalData.player.id}`;

    if(!checkIfModalExists(modalIdWithPrefix)){
        
        let modal = createUnknownModal(
            modalId, 
            modalData, 
            true
        );
        
        document.querySelector('#modal-container').append(modal);
    }
    return;
}

function refreshModalAfterScan(targetKey) {

    const modalNormal = `modal-${targetKey}`;
    const modalUnknown = `modal-unknown-${targetKey}`;

    const normalOpen = document.getElementById(modalNormal);
    const unknownOpen = document.getElementById(modalUnknown);

    // modal unknown ouvert → switch vers modal normal
    if (unknownOpen) {
        open_close_modal(modalUnknown); // close
        open_close_modal(modalNormal);  // open avec nouvelles données
        return;
    }

    // modal normal déjà ouvert → refresh
    if (normalOpen) {
        open_close_modal(modalNormal);
        open_close_modal(modalNormal);
    }
}