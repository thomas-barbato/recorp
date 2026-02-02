// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"

(function () {

    function createActionCostBadge(cost = {}) {
        const apCost = cost?.ap_cost ?? null;
        const crCost = cost?.cost ?? null;

        if ((!apCost || apCost <= 0) && (!crCost || crCost <= 0)) return null;

        const wrapper = document.createElement("div");
        wrapper.classList.add(
            "flex",
            "flex-col",
            "items-center",
            "gap-1",
            "mt-1",
            "text-xs",
            "font-bold",
            "font-shadow"
        );

        if (typeof apCost === "number" && apCost > 0) {
            const apLine = document.createElement("div");
            apLine.textContent = `${apCost} AP`;
            apLine.classList.add(
                "px-2","py-[1px]","rounded-md",
                "bg-emerald-700/70",
                "text-emerald-200",
                "border",
                "border-emerald-400/40",
                "whitespace-nowrap"
            );
            wrapper.append(apLine);
        }

        if (typeof crCost === "number" && crCost > 0) {
            const crLine = document.createElement("div");
            crLine.textContent = `${crCost} CR`;
            crLine.classList.add(
                "px-2","py-[1px]","rounded-md",
                "bg-yellow-700/70",
                "border","border-yellow-400/50",
                "whitespace-nowrap"
            );
            crLine.style.color = "#fde047";
            wrapper.append(crLine);
        }

        return wrapper;
    }

    function createActionRangeBadge(range) {
        if (typeof range !== "number" || range <= 0) return null;

        const badge = document.createElement("div");
        badge.classList.add(
            "px-2",
            "py-[1px]",
            "rounded-md",
            "text-xs",
            "font-bold",
            "font-shadow",
            "border",
            "whitespace-nowrap",
            "bg-sky-800/70",
            "border-sky-400/40",
            "text-sky-200",
            "flex",
            "items-center",
            "gap-1"
        );

        const icon = document.createElement("span");
        icon.textContent = "🛰";

        const label = document.createElement("span");
        label.textContent = range;

        badge.append(icon, label);
        return badge;
    }

    function createActionButton(iconElement, label, onClick, cost = {}) {
        const btn = document.createElement("div");
        btn.classList.add(
            "action-button-sf",
            "cursor-pointer",
            "font-shadow",
            "flex",
            "flex-col",
            "items-center",
            "justify-center",
            "gap-1",
            "text-center",
            "min-h-[90px]",
            "px-2",
            "py-2"
        );

        // --- ICÔNE ---
        const iconWrapper = document.createElement("div");
        iconWrapper.classList.add("flex", "justify-center");
        iconElement.classList.add("action-button-sf-icon");
        iconWrapper.append(iconElement);

        // --- LABEL ---
        const lbl = document.createElement("div");
        lbl.classList.add(
            "action-button-sf-label",
            "text-sm",
            "font-bold"
        );
        lbl.textContent = label;

        btn.append(iconWrapper, lbl);

        // --- COÛT (AP / CR) ---
        const badge = createActionCostBadge(cost);
        if (badge) {
            badge.classList.remove("ml-auto"); // sécurité
            badge.classList.add(
                "mt-1",
                "text-xs"
            );
            btn.append(badge);
        }
        console.log(cost)
        if (cost?.range !== undefined) {
            const rangeBadge = createActionRangeBadge(cost.range);
            if (rangeBadge) {
                rangeBadge.classList.add("mt-1");
                btn.append(rangeBadge);
            }
        }

        btn.addEventListener("click", onClick);
        return btn;
    }
    
    function playerHasModule(a, b) {
        // Mode 1 : playerHasModule(modulesArray, ["TYPE1","TYPE2"])
        if (Array.isArray(a)) {
            const modules = a;
            const types = Array.isArray(b) ? b : [];
            return modules.some(m => types.includes(m.type));
        }

        // Mode 2 : playerHasModule("TYPE", "required name")
        const type = a;
        const requiredName = b;

        const modules = window.currentPlayer?.ship?.modules || [];
        const req = (requiredName ?? "").toString().toLowerCase();

        return modules.some(m =>
            m.type === type &&
            (req === "" || (typeof m.name === "string" && m.name.toLowerCase() === req))
        );
    }

    function showActionError(modalId, message) {
        const zone = document.getElementById(modalId + "-action-error-zone");
        if (!zone) return;

        zone.textContent = message;
        zone.classList.remove("hidden");

        setTimeout(() => {
            zone.classList.add("hidden");
            zone.textContent = "";
        }, 5000);
    }

    function applyActionCostState(action, btn) {
        const currentAP = currentPlayer?.player?.current_ap ?? null;
        const currentCR = currentPlayer?.player?.credits ?? null;

        const apCost = action?.ap_cost ?? null;
        const crCost = action?.cost ?? null;

        if (typeof apCost === "number" && apCost > 0 && typeof currentAP === "number") {
            if (currentAP < apCost) {
                btn.classList.add("opacity-40", "pointer-events-none");
                return;
            }
        }

        if (typeof crCost === "number" && crCost > 0 && typeof currentCR === "number") {
            if (currentCR < crCost) {
                btn.classList.add("opacity-40", "pointer-events-none");
                return;
            }
        }
    }

    function applyScanState(data, scanButton) {
        if (data?._ui?.scanned === true) {
            scanButton.classList.add("opacity-40", "pointer-events-none", "cursor-not-allowed");
            scanButton.title = "Cible déjà scannée";
            return false;
        }
        return true;
    }

    
function buildActionsSection(modalId, data, is_npc, contextZone) {
    
    const ws = window.canvasEngine?.ws;
    const map = window.canvasEngine?.map;
    const modules = currentPlayer.ship.modules;
    const isUnknown = modalId.startsWith("modal-unknown");
    const currentAP = currentPlayer?.player?.current_ap ?? null;

    const formatRangeTooltip = r => {
        if (typeof r?.distance === "number" && typeof r?.maxRange === "number") {
            return `Hors de portée (${r.distance.toFixed(1)} / ${r.maxRange.toFixed(1)})`;
        }
        return "Action indisponible (portée non définie)";
    };

    const transmitterActor = map.getCurrentPlayer();
    if (!transmitterActor) return;

    let receiverActor = null;
    const parsed = define_modal_type(modalId);

    if (parsed && map) {
        // pc / npc → clé standard
        if (parsed.type === "pc" || parsed.type === "npc") {
            receiverActor = map.findActorByKey(`${parsed.type}_${parsed.id}`);
        }
        // foreground
        else if (parsed.isForegroundElement) {
            receiverActor = map.findActorByKey(parsed.elementName);
        }
    }

    if (!receiverActor) {
        // la cible n'existe réellement plus (destroy, warp, autre secteur)
        return;
    }

    // Conteneur global
    const wrapper = document.createElement("div");
    wrapper.classList.add("action-wrapper-sf");
    const grid = document.createElement("div");
    grid.classList.add(
        "action-grid-sf", 
        "safe-grid",
        "mx-auto"
    );

    // Vérif modules
    const hasWeaponry = playerHasModule(modules, ["WEAPONRY"]);
    const hasProbe = playerHasModule(modules, ["PROBE"]);
    const hasEwar = playerHasModule(modules, ["ELECTRONIC_WARFARE"]);
    const hasRepaire = playerHasModule(modules, ["REPAIRE"]);

    // Message d’erreur
    const showMissingModuleError = () => {
        showActionError(
            modalId,
            "Vous ne pouvez pas effectuer cette action tant que vous n'aurez pas installé de module de ce type."
        );
    };

    // ---------------------------
    // ACTION : ATTACK
    // ---------------------------
    const attackIcon = document.createElement("img");
    attackIcon.src = "/static/img/ux/target_icon.svg";

    const attackButton = createActionButton(
        attackIcon,
        "Attaquer",
        () => {
            if (!hasWeaponry) return showMissingModuleError();

            // ouvrir weaponry dans contextZone
            contextZone.innerHTML = "";
            contextZone.classList.contains('hidden') == true ? contextZone.classList.remove("hidden") : contextZone.classList.add("hidden");

            const list = document.createElement("div");
            list.classList.add("flex", "flex-col", "gap-2", "mt-2");

            // modules weaponry
            modules.forEach(m => {
                if (m.type !== "WEAPONRY") return;

                const range = m.effect?.range === "number"

                const rangeResult = window.computeModuleRange({
                    module: m,
                    transmitterActor: transmitterActor,
                    receiverActor: receiverActor
                });

                const wrapper = document.createElement("div");
                wrapper.classList.add(
                    "flex", "flex-row", "justify-between",
                    "items-center", "p-2", "rounded-lg",
                    "border", "gap-4", "border-emerald-900"
                );
                // description module
                const left = document.createElement("div");
                left.classList.add("w-full");
                left.innerHTML = createFormatedLabel(m);

                // bouton attaque réel
                const btnIcon = document.createElement("img");
                btnIcon.src = "/static/img/ux/target_icon.svg";
                btnIcon.classList.add("action-button-sf-icon");

                const btn = document.createElement("div");
                btn.classList.add("action-button-sf");

                if (!rangeResult.allowed) {
                    btn.classList.add("cursor-not-allowed");
                }

                btn.append(btnIcon);

                btn.addEventListener("click", () => {
                    if (!rangeResult.allowed) return;

                    ws.send({
                        type: "action_attack",
                        payload: {
                            subtype: `attack-${m.id}`,
                            module_id: m.id,
                            target_key: targetKey
                        }
                    });
                });

                const apBadge = createActionCostBadge({ ap_cost: 1 });
                if (apBadge) {
                    btn.append(apBadge);
                }
                const rangeBadge = createActionRangeBadge(m.effect?.range);

                if (rangeBadge) {
                    rangeBadge.dataset.role = "range-badge";
                    rangeBadge.dataset.moduleId = String(m.id);
                    btn.append(rangeBadge);
                }

                wrapper.dataset.actionKey = "attack";
                wrapper.dataset.moduleId = m.id;
                wrapper.dataset.moduleType = "WEAPONRY";
                btn.dataset.moduleId = String(m.id);
                
                
                if (!rangeResult.allowed) {
                    btn.classList.remove("border-emerald-900", "border");
                    btn.classList.add("opacity-40", "pointer-events-none", "bg-red-600");
                }else{
                    btn.classList.add("border-emerald-900");
                }

                wrapper.append(left, btn);
                list.append(wrapper);
            });

            contextZone.append(list);
        },
        { ap_cost:1 }
    );
    wrapper.append(grid);
    

    // ---------------------------
    // ACTION : SCAN
    // ---------------------------
    const scanIcon = document.createElement("img");
    scanIcon.src = "/static/img/ux/gameIcons-radar-cross-section.svg";
    scanIcon.classList.add('text-white')

    let ap_cost = 1;

    const spaceShipProb = modules.find(
        m => m.type === "PROBE" && m.name === "spaceship probe" &&  m.effect?.range 
    );
        
    const scanButton = createActionButton(
        scanIcon,
        "Scan",
        () => {
            if (scanButton.classList.contains("pointer-events-none")) return;
            const info = define_modal_type(modalId);
            
            ws.send({
                type: "action_scan_pc_npc",
                payload: {
                    target_type: info.type,
                    target_id: info.id
                }
            });
        },
        { 
            ap_cost:ap_cost  ,
            range: spaceShipProb?.effect?.range  
        }
        
        
    );

    scanButton.dataset.actionKey = "scan";
    const probeModule = modules.find(m => m.type === "PROBE" && m.name === "spaceship probe");
    if (probeModule) {
        scanButton.dataset.moduleId = String(probeModule.id);   // clé pour refresh
    } else {
        // optionnel : garder moduleName si tu veux fallback
        scanButton.dataset.moduleName = "spaceship probe";
    }
    scanButton.dataset.modalId = modalId;

    applyScanState(data, scanButton);
    // BLOQUER SI AP INSUFFISANTS
    applyActionCostState({ ap_cost: ap_cost , cost: 0 , key : "scan" }, scanButton);
    
    grid.innerHTML = "";
    // Limiter l'utilisation du scan.
    if (data._ui?.scanned === true || !playerHasModule("PROBE", "spaceship probe") || ap_cost > window.currentPlayer.user.current_ap) {
        scanButton.classList.add("opacity-40", "pointer-events-none");
    }

    // ============================
    // RANGE CHECK — SCAN (PC / NPC)
    // ============================
    if (
        !scanButton.classList.contains("pointer-events-none") &&
        typeof window.computeModuleRange === "function"
    ) {
        const probeModule = modules.find(
            m => m.type === "PROBE" && m.name === "spaceship probe"
        );

        if (probeModule) {
            const rangeResult = window.computeModuleRange({
                module: probeModule,
                transmitterActor,
                receiverActor
            });

            if (!rangeResult.allowed) {
                scanButton.classList.add("opacity-40", "pointer-events-none");

                if (typeof rangeResult.distance === "number") {
                    scanButton.title =
                        `Hors de portée (${rangeResult.distance.toFixed(1)} / ${rangeResult.maxRange.toFixed(1)})`;
                }
            }
        }
    }

    // ============================
    // DéSACTIVER SCAN SI PAS DE MODULE
    // ============================
    attackButton.dataset.actionKey = "attack-menu";
    grid.append(attackButton);
    grid.append(scanButton);

    // Actions post-scan : “à la suite” dans la grille
    if (data._ui?.scanned === true) {
        PC_NPC_EXTRA_ACTIONS.forEach(extra => {

            // --- icon ---
            let iconEl;

            if (extra.iconify) {
                iconEl = document.createElement("span");
                iconEl.classList.add("flex", "justify-center", "iconify", "game-icons--radar-cross-section", "w-5", "h-5");
            } else if (extra.iconClass) {
                iconEl = document.createElement("i");
                extra.iconClass.split(" ").forEach(c => iconEl.classList.add(c));
            } else {
                iconEl = document.createElement("img");
                iconEl.src = "/static/img/ux/scan_ship.svg"
            }

            // --- click handler ---
            const btn = createActionButton(iconEl, extra.label, () => 
            {
                if (extra.requires_group && !currentPlayer?.group_id) {
                    showActionError(modalId, extra.warning_no_group);
                    return;
                }

                const ws = window.canvasEngine?.ws;
                if (!ws?.send) return;

                const info = define_modal_type(modalId);
                // ACTION : SEND REPORT
                if (extra.key === "send_report") {
                    openSendReportModal({
                        targetKey: `${info.type}_${info.id}`,
                        targetType: info.type,
                        targetId: info.id,
                        modalData: data,
                        modalId: modalId,
                    });
                    return;
                }

                // ACTION : SHARE SCAN (WS)
                if (extra.key === "share_to_group") {
                    if (extra.requires_group && !currentPlayer?.group_id) {
                        showActionError(modalId, extra.warning_no_group);
                        return;
                    }

                    const ws = window.canvasEngine?.ws;
                    if (!ws?.send) return;

                    ws.send({
                        type: "action_share_scan",
                        payload: {
                            target_type: info.type,
                            target_id: info.id
                        }
                    });
                    return;
                }
        },{ ap_cost: extra.ap_cost });
        // BLOQUER SI AP INSUFFISANTS
        applyActionCostState({ ap_cost: extra.ap_cost, cost: 0 }, btn);

        if(extra.requires_group && !currentPlayer?.group_id){
            btn.classList.add("opacity-40", "pointer-events-none");
        }

        const cell = document.createElement("div");
        cell.classList.add("flex","flex-col","items-center");
        cell.append(btn);

        grid.append(cell);
    });
}

    // ---------------------------
    // ACTION : E-WAR
    // ---------------------------
    const ewarIcon = document.createElement("span");
    ewarIcon.classList.add("flex", "justify-center", "iconify", "game-icons--computing");

    const ewarButton = createActionButton(
        ewarIcon,
        "E-War",
        () => {
            if (!hasEwar) return showMissingModuleError();

            // ouvrir weaponry dans contextZone
            contextZone.innerHTML = "";
            contextZone.classList.contains('hidden') == true ? contextZone.classList.remove("hidden") : contextZone.classList.add("hidden");

            const list = document.createElement("div");
            list.classList.add("flex", "flex-col", "gap-2", "mt-2");

            // modules weaponry
            modules.forEach(m => {
                if (m.type !== "ELECTRONIC_WARFARE") return;

                const rangeResult = window.computeModuleRange({
                    module: m,
                    transmitterActor: transmitterActor,
                    receiverActor: receiverActor
                });

                const wrapper = document.createElement("div");
                wrapper.classList.add(
                    "flex", "flex-row", "justify-between",
                    "items-center", "p-2", "rounded-lg",
                    "border", "gap-4", "border-emerald-900"
                );
                
                if (!rangeResult.allowed) {
                    wrapper.classList.remove("border-emerald-900", "border");
                    wrapper.classList.add("opacity-40", "pointer-events-none", "bg-red-600");
                    
                    if (rangeResult.distance !== null) {
                        wrapper.title =
                            `Hors de portée (${rangeResult.distance.toFixed(1)} / ${rangeResult.maxRange.toFixed(1)})`;
                    }
                }else{
                    wrapper.classList.add("border-emerald-900");
                }

                // description module
                const left = document.createElement("div");
                left.classList.add("w-full");
                left.innerHTML = createFormatedLabel(m);

                // bouton attaque réel
                const btnIcon = document.createElement("img");
                btnIcon.src = "/static/img/ux/target_icon.svg";
                btnIcon.classList.add("action-button-sf-icon");

                const btn = document.createElement("div");
                btn.classList.add("action-button-sf");

                if (!rangeResult.allowed) {
                    btn.classList.add("cursor-not-allowed");
                }

                btn.append(btnIcon);

                btn.addEventListener("click", () => {
                    if (!rangeResult.allowed) return;

                    ws.send({
                        type: "action_electronic_warfare",
                        payload: {
                            subtype: `electronic_warfare-${m.id}`,
                            module_id: m.id,
                            target_key: targetKey
                        }
                    });
                });

                wrapper.dataset.actionKey = "electronic_warfare";
                wrapper.dataset.moduleId = m.id;
                wrapper.dataset.moduleType = "ELECTRONIC_WARFARE";
                wrapper.append(left, btn);
                list.append(wrapper);
            });

            contextZone.append(list);
        },
        {ap_cost: ap_cost}
    );
    
    ewarButton.dataset.actionKey = "electronic-warfare-menu";
    grid.append(ewarButton);

    // ---------------------------
    // ACTION : REPAIRE
    // ---------------------------
    const repIcon = document.createElement("img");
    repIcon.src = "/static/img/ux/repaire_icon.svg";

    const repairModule = modules.find(
        m => m.type === "REPAIRE" && m.effect?.range
    );

    const repButton = createActionButton(
        repIcon,
        "Repaire",
        () => {
            if (!hasRepaire) return showMissingModuleError();

            contextZone.innerHTML = "Réparation (à implémenter)";
            contextZone.classList.remove("hidden");
        },
        {
            ap_cost: ap_cost,
            range: repairModule?.effect?.range
        }
    );
    

    // BLOQUER SI AP INSUFFISANTS
    applyActionCostState({ ap_cost: 1, cost: 0 }, repButton);
    grid.append(repButton);

    // ---------------------------
    // ACTION : COMMERCE
    // ---------------------------
    const tradeIcon = document.createElement("span");
    tradeIcon.classList.add("flex", "justify-center", "iconify", "game-icons--trade");

    const tradeButton = createActionButton(
        tradeIcon,
        "Commerce",
        () => {
            contextZone.innerHTML = "Commerce (à implémenter)";
            contextZone.classList.remove("hidden");
        },
        {ap : 0}
    );

    grid.append(tradeButton);

    // --- FILTRAGE UNKNOWN ---
    if (isUnknown && data._ui?.scanned !== true) {
        
        attackButton.dataset.actionKey = "attack-menu";
        grid.innerHTML = "";
        grid.append(attackButton);
        if (data._ui?.scanned === true) {
            scanButton.classList.add("opacity-40", "pointer-events-none");
        }
        grid.append(scanButton);    
    }

    // Après avoir ajouté les boutons (et après le filtrage unknown)
    const count = grid.children.length;

    // on force le nombre de colonnes à "min(count, maxCols)" en restant responsive
    // maxCols vient du CSS via --cols (media queries), donc on lit la valeur calculée
    const computedCols = parseInt(getComputedStyle(grid).getPropertyValue("--cols")) || 5;
    grid.style.setProperty("--cols", String(Math.min(count, computedCols)));

    return wrapper;
}

    function buildForegroundActionsSection(modalId, data) {
        const wrapper = document.createElement("div");
        wrapper.classList.add(
            "flex",
            "flex-col",
            "w-full",
            "gap-2",
            "action-wrapper-sf",
            "justify-center",
            "sf-scroll",
            "sf-scroll-emerald",
            "p-2",
            "bg-zinc-950/95", 
        );

        const type = data.type;
        const alreadyScanned = data._ui?.scanned === true;

        const errorZone = document.createElement("div");
        errorZone.id = modalId + "-action-error-zone";
        errorZone.classList.add(
            "action-error-msg",
            "hidden",
            "w-full",
            "text-center",
            "text-red-500",
            "font-shadow",
            "font-bold",
            "animate-pulse"
        );

        if (type === "warpzone") {
            const ul = document.createElement("ul");
            ul.classList.add(
                "flex",
                "flex-col",
                "list-none",
                "w-full",
                "text-start",
                "p-2",
                "gap-2",
                "font-shadow"
            );

            data.destinations.forEach(dest => {
                const li = document.createElement("li");
                li.textContent = `Travel to ${dest.destination_name}`;
                li.classList.add(
                    "cursor-pointer",
                    "text-white",
                    "font-bold",
                    "hover:animate-pulse",
                    "font-shadow"
                );
                li.onclick = () => handleWarpTravel(dest.warp_link_id);
                ul.append(li);
            });

            wrapper.append(ul);
            return wrapper;
        }

        const grid = document.createElement("div");
        grid.classList.add(
            "action-grid-sf",
            "safe-grid",
            "mx-auto"
        );

        wrapper.append(errorZone);
        wrapper.append(grid);

        const actions = FOREGROUND_ACTIONS[type] || [];

        actions.forEach(action => {

            const itemWrapper = document.createElement("div");
            itemWrapper.classList.add(
                "flex",
                "flex-col",
                "items-center"
            );

            const btn = document.createElement("div");
            btn.classList.add(
                "action-button-sf",
                "cursor-pointer",
                "font-shadow",
                "flex",
                "flex-col",
                "items-center",
                "justify-center",
                "gap-1",
                "text-center",
                "min-h-[90px]",
                "px-2",
                "py-2"
            );

            let iconEl;
            if (action.icon) {
                iconEl = document.createElement("img");
                iconEl.src = action.icon;
                iconEl.classList.add("action-button-sf-icon");
            } else if (action.iconify) {
                iconEl = document.createElement("span");
                iconEl.classList.add("iconify", action.iconify, "action-button-sf-icon");
            }

            const label = document.createElement("div");
            label.textContent = action.label || "";
            label.classList.add(
                "action-button-sf-label",
                "font-shadow",
                "text-sm",
                "font-bold"
            );

            if (iconEl) btn.append(iconEl);
            btn.append(label);

            const badge = createActionCostBadge({
                ap_cost: action.ap_cost ?? null,
                cost: typeof action.cost === "number" ? action.cost : null
            });

            if (badge) btn.append(badge);

            if (action.key === "invade" && !playerHasModule("COLONIZATION", "colonization module")) {
                btn.classList.add("opacity-40", "pointer-events-none");
            }

            applyActionCostState(
                { ap_cost: action.ap_cost ?? null, cost: action.cost ?? null },
                btn
            );

            if (action.key === "scan") {
                btn.dataset.actionKey = "scan";
                btn.dataset.modalId = modalId;

                const probeModule = (window.currentPlayer?.ship?.modules || []).find(
                    m => m.type === "PROBE" && m.name === "drilling probe"
                );
                if (probeModule) {
                    btn.dataset.moduleId = String(probeModule.id);
                } else {
                    btn.dataset.moduleName = "drilling probe";
                }
            }

            if (action.key === "scan" && !playerHasModule("PROBE", "drilling probe")) {
                btn.classList.add("opacity-40", "pointer-events-none");
            }

            if (action.key === "scan" && (alreadyScanned || !playerHasModule("PROBE", "drilling probe") || action.ap_cost > window.currentPlayer.user.current_ap)) 
            {
                btn.classList.add("opacity-40", "pointer-events-none");
            }


            if (action.key === "scan" && !btn.classList.contains("pointer-events-none") && typeof window.computeModuleRange === "function" ) {
                const map = window.canvasEngine?.map;
                const transmitterActor = map?.getCurrentPlayer?.() || null;

                const parsed = define_modal_type(modalId);
                const receiverActor = map?.findActorByKey?.(parsed?.elementName) || null;

                const probeModule = (window.currentPlayer?.ship?.modules || []).find(
                    m => m.type === "PROBE" && m.name === "drilling probe"
                );

                if (transmitterActor && receiverActor && probeModule) {
                    const rangeResult = window.computeModuleRange({
                        module: probeModule,
                        transmitterActor,
                        receiverActor
                    });

                    if (!rangeResult.allowed) {
                        btn.classList.add("opacity-40", "pointer-events-none");

                        if (typeof rangeResult.distance === "number") {
                            btn.title =
                                `Hors de portée (${rangeResult.distance.toFixed(1)} / ${rangeResult.maxRange.toFixed(1)})`;
                        }
                    }
                }
            }

            itemWrapper.append(btn);

            btn.onclick = () => {

                if (action.key === "scan" && data._ui?.scanned === true) return;

                if (action.requires) {
                    const ok = action.requires.every(req =>
                        currentPlayer.ship.modules.some(m =>
                            m.type === req.type &&
                            (!req.name || m.name === req.name)
                        )
                    );

                    if (!ok) {
                        errorZone.textContent =
                            "Vous ne pouvez pas effectuer cette action sans le module requis.";
                        errorZone.classList.remove("hidden");
                        setTimeout(() => errorZone.classList.add("hidden"), 5000);
                        return;
                    }
                }

                if (action.key === "scan") {
                    const info = define_modal_type(modalId);
                    const targetKey = `${info.type}_${info.id}`;

                    window.scannedTargets = window.scannedTargets || new Set();
                    window.scannedTargets.add(targetKey);

                    window.scannedMeta = window.scannedMeta || {};
                    window.scannedMeta[targetKey] = { expires_at: null };

                    refreshModalAfterScan(targetKey);
                }

                if (action.key === "send_report") {
                    openSendReportModal({
                        targetKey,
                        targetType,
                        targetId,
                        modalData: data
                    });
                    return;
                }
            };

            grid.append(itemWrapper);
        });

        const count = grid.children.length;
        grid.style.setProperty("--cols", Math.min(count, 5));

        return wrapper;
    }

    // ===== Bridge global (comme les autres étapes) =====
    window.createActionCostBadge = createActionCostBadge;
    window.createActionRangeBadge = createActionRangeBadge;
    window.createActionButton = createActionButton;
    window.playerHasModule = playerHasModule;
    window.showActionError = showActionError;
    window.applyActionCostState = applyActionCostState;
    window.applyScanState = applyScanState;
    window.buildActionsSection = buildActionsSection;
    window.buildForegroundActionsSection = buildForegroundActionsSection;

    window.refreshModalActionRanges = function (modalId) {
        if (!modalId || typeof window.computeModuleRange !== "function") return;

        const map = window.canvasEngine?.map;
        if (!map) return;

        const parsed = define_modal_type(modalId);
        if (!parsed) return;

        const transmitterActor = map.getCurrentPlayer?.();
        if (!transmitterActor) return;

        let receiverActor = null;

        if (parsed.type === "pc" || parsed.type === "npc") {
            receiverActor = map.findActorByKey(`${parsed.type}_${parsed.id}`);
        }
        if (!receiverActor && parsed.originalType) {
            receiverActor = map.findActorByKey(`${parsed.originalType}_${parsed.id}`);
        }
        if (!receiverActor && parsed.isForegroundElement) {
            receiverActor = map.findActorByKey(parsed.elementName);
        }
        if (!receiverActor) return;

        const modules = window.currentPlayer?.ship?.modules || [];

        // 🔁 TOUS les boutons liés à un module
        const modalEl = document.getElementById(modalId);
        if (!modalEl) return;

        modalEl.querySelectorAll("[data-module-id]").forEach(btn => {
            const moduleId = parseInt(btn.dataset.moduleId, 10);
            if (!moduleId) return;

            const module = modules.find(m => m.id === moduleId);
            if (!module || !module.effect?.range) return;

            const rr = window.computeModuleRange({
                module,
                transmitterActor,
                receiverActor
            });

            if (!rr.allowed) {
                btn.classList.add("opacity-40", "pointer-events-none");
                btn.title = `Hors de portée (${rr.distance.toFixed(1)} / ${rr.maxRange})`;
            } else {
                btn.classList.remove("opacity-40", "pointer-events-none");
                btn.title = "";
            }
        });
    };

})();

