const MODULE_CATEGORIES = {
    WEAPONRY: {
        label: "Weaponry",
        types: ["WEAPONRY"]
    },
    EWAR: {
        label: "Electronic Warfare",
        types: ["ELECTRONIC_WARFARE"]
    },
    DEFENSIVE: {
        label: "Defensive Modules",
        types: ["DEFENSE_BALLISTIC", "DEFENSE_THERMAL", "DEFENSE_MISSILE"]
    },
    UTILITY: {
        label: "Utility Modules",
        types: ["REPAIRE", "COLONIZATION", "CRAFT", "GATHERING", "RESEARCH"]
    },
    PROBE: {
        label: "Probe Modules",
        types: ["PROBE"]
    }
};

const FOREGROUND_ACTIONS = {
    asteroid: [
        {
        key: "gather",
        label: "Récolte",
        icon: "/static/img/ux/gather_icon.svg",
        requires: [{ type: "GATHERING" }],
        ap_cost : 1
        },
        {
        key: "scan",
        label: "Scan",
        icon: "/static/img/ux/scan_resource_icon.svg",
        requires: [{ type: "PROBE", name: "drilling probe" }],
        ap_cost : 1
        }
    ],

    planet: [
        { key: "set_home", label: "New Home", icon: "/static/img/ux/new_location.svg" },
        { key: "join_faction", label: "Join Faction", icon: "/static/img/ux/join_faction.svg" },
        { key: "dock", label: "Dock", icon: "/static/img/ux/dock.svg" },
        { key: "market", label: "Market", icon: "/static/img/ux/market.svg" },
        { key: "task", label: "Task", icon: "/static/img/ux/task.svg" },
        {
        key: "invade",
        label: "Invade",
        icon: "/static/img/ux/invade.svg",
        requires: [{ type: "COLONIZATION" }]
        }
    ],

    warpzone: [
        { key: "warp_destinations" }
    ],

    satellite: [
        {
            key: "corporation",
            label: "Corporation",
            icon: "/static/img/ux/join_faction.svg",
        },
        {
            key: "new_home",
            label: "New Home",
            icon: "/static/img/ux/new_location.svg"
        },
        {
            key: "dock",
            label: "Dock",
            icon: "/static/img/ux/dock.svg",
        },
        {
            key: "market",
            label: "Market",
            icon: "/static/img/ux/market.svg"
        },
    ],

    station: [
        {
            key: "training",
            label: "Training",
            iconify: "game-icons--teacher",
        },
        {
            key: "craft",
            label: "Craft",
            iconify: "game-icons--crafting"
        },
        {
            key: "repair",
            label: "Repair",
            iconify: "game-icons--auto-repair",
            cost: 1000
        },
        {
            key: "refuel",
            label: "Refuel",
            iconify: "game-icons--fuel-tank",
            cost: 1000
        }
    ],
    black_hole: []
};

const PC_NPC_EXTRA_ACTIONS = [
    {
        key: "share_to_group",
        label: "Dévoiler au groupe",
        iconify: "game-icons--radar-cross-section",
        cost_ap: 1,
        requires_scan: true,
        requires_group: true,
        warning_no_group: "Vous devez faire partie d'un groupe pour effectuer cette action."
    },
    {
        key: "send_report",
        label: "Envoyer un rapport",
        iconClass: "fa-solid fa-envelope",
        cost_ap: 0,
        requires_scan: true
    }
];

function groupModulesByCategory(modules) {

    const grouped = {
        WEAPONRY: [],
        EWAR: [],
        DEFENSIVE: [],
        UTILITY: [],
        PROBE: []
    };

    for (const mod of modules) {
        for (const catKey in MODULE_CATEGORIES) {
            if (MODULE_CATEGORIES[catKey].types.includes(mod.type)) {
                grouped[catKey].push(mod);
                break;
            }
        }
    }

    return grouped;
}

function createFormatedLabel(module_object) {

    let module_name = module_object.name;
    let module_type = module_object.type;

    let module_tooltip_ul = document.createElement('ul');
    let module_tooltip_name = document.createElement('span');
    let module_tooltip_moduleType = document.createElement('small');

    module_tooltip_ul.className = `
        flex flex-col gap-1 font-bold text-xs font-shadow
        bg-gray-900/95 border border-emerald-700/40 rounded-md
        text-emerald-200 shadow-lg shadow-black/60 p-2 backdrop-blur-sm
    `;
    module_tooltip_name.className = "font-bold text-emerald-300 text-sm font-shadow";
    module_tooltip_name.textContent = module_name;
    module_tooltip_moduleType.className = "italic text-emerald-400/80 font-shadow mb-1";

    module_tooltip_ul.append(module_tooltip_name);
    module_tooltip_ul.append(module_tooltip_moduleType);

    let module_li, module_li_label, module_li_value;

    // === switch conservé, mais stylé ===
    switch (module_type) {

        case "DEFENSE_BALLISTIC":
        case "DEFENSE_THERMAL":
        case "DEFENSE_MISSILE":
            let parts = module_type.split('_');
            module_type = `${parts[1]} ${parts[0]}`;
            module_li = styledLine(`${module_object.effect.label}:`, `+${module_object.effect.defense}`);
            module_tooltip_ul.append(module_li);
            break;

        case "HOLD":
            module_li = styledLine(`${module_object.effect.label}:`, `+${module_object.effect.capacity}`);
            module_tooltip_ul.append(module_li);
            break;

        case "MOVEMENT":
            module_li = styledLine(
                module_object.effect.label || "Movement:",
                `+${module_object.effect.movement}`
            );
            module_tooltip_ul.append(module_li);
            break;

        case "HULL":
            module_li = styledLine(`${module_object.effect.label}:`, ` +${module_object.effect.hp}`);
            module_tooltip_ul.append(module_li);
            break;

        case "REPAIRE":
            module_li = styledLine(
                `${module_object.effect.label}:`,
                ` ${module_object.effect.repair_shield} hull points`
            );
            module_tooltip_ul.append(module_li);
            break;

        case "GATHERING":
            if ('can_scavenge' in module_object.effect) {
                module_li = styledLine(`${module_object.effect.label}`, `✔️`);
            } else if ('display_mineral_data' in module_object.effect) {
                module_li = styledLine(`${module_object.effect.label}`, `range: ${module_object.effect.range}`);
            } else {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `+${module_object.effect.gathering_amount}, range: ${module_object.effect.range}`
                );
            }
            module_tooltip_ul.append(module_li);
            break;

        case "RESEARCH":
            module_li = styledLine(
                `${module_object.effect.label}:`,
                `-${module_object.effect.research_time_discrease}%`
            );
            module_tooltip_ul.append(module_li);
            break;

        case "CRAFT":
            module_li = styledLine(
                `${module_object.effect.label}:`,
                `${module_object.effect.crafting_tier_allowed}`
            );
            module_tooltip_ul.append(module_li);
            break;

        case "ELECTRONIC_WARFARE":
            if ("aiming_discrease" in module_object.effect) {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `-${module_object.effect.aiming_discrease}% — range ${module_object.effect.range}`
                );
            } else if ("movement_discrease" in module_object.effect) {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `-${module_object.effect.movement_discrease}% — range ${module_object.effect.range}`
                );
            } else if ("display_ship_data" in module_object.effect) {
                module_li = styledLine(`${module_object.effect.label}`, `range ${module_object.effect.range}`);
            }
            module_tooltip_ul.append(module_li);
            break;

        case "WEAPONRY":
            if ("aiming_increase" in module_object.effect) {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `+${module_object.effect.aiming_increase}% — range ${module_object.effect.range || "?"}`
                );
            } else {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `damages: ${module_object.effect.min_damage} - ${module_object.effect.max_damage} — range ${module_object.effect.range}`
                );
            }
            module_tooltip_ul.append(module_li);
            break;

        case "COLONIZATION":
            module_li = styledLine(`${module_object.effect.label}`, `🌍`);
            module_tooltip_ul.append(module_li);
            break;
    }

    module_tooltip_moduleType.textContent = module_type;
    return module_tooltip_ul.outerHTML;
}

function createModuleCategoryAccordion(categoryKey, modules, uniqueModalId) {

    if (!modules.length) return null;

    const categoryInfo = MODULE_CATEGORIES[categoryKey];
    const accordionId = `${uniqueModalId}-accordion-${categoryKey}`;

    // WRAPPER
    const wrapper = document.createElement("div");
    wrapper.classList.add("w-full");
    wrapper.dataset.accordionId = accordionId;

    // HEADER BUTTON
    const headerBtn = document.createElement("button");
    headerBtn.type = "button";
    headerBtn.classList.add(
        "flex","items-center","justify-between",
        "w-full","p-2","font-bold","text-white",
        "mb-1","cursor-pointer", "font-shadow"
    );
    headerBtn.dataset.accordionToggle = accordionId;

    const textSpan = document.createElement("span");
    textSpan.textContent = categoryInfo.label;

    // ARROW ICON
    const arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrowSvg.classList.add("w-3","h-3","transition-transform","duration-200");
    arrowSvg.setAttribute("fill","none");
    arrowSvg.setAttribute("viewBox","0 0 10 6");

    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg","path");
    arrowPath.setAttribute("stroke","currentColor");
    arrowPath.setAttribute("stroke-width","2");
    arrowPath.setAttribute("d","M9 5 5 1 1 5");

    arrowSvg.append(arrowPath);
    headerBtn.append(textSpan, arrowSvg);

    // BODY (initialement caché)
    const bodyDiv = document.createElement("div");
    bodyDiv.classList.add("hidden","pl-2","flex","flex-col");
    bodyDiv.id = accordionId;

    // Chaque module formaté via createFormatedLabel
    for (const moduleObj of modules) {

        const htmlString = createFormatedLabel(moduleObj);

        const temp = document.createElement("div");  
        temp.innerHTML = htmlString.trim();

        const formattedModule = temp.firstChild;

        formattedModule.classList.add(
            "rounded-md","p-2","border","border-slate-500",
            "bg-black/40","hover:bg-black/60","transition"
        );

        bodyDiv.append(formattedModule);
    }

    wrapper.append(headerBtn, bodyDiv);
    return wrapper;
}

function activateExclusiveAccordions(modalRoot) {

    const toggles = modalRoot.querySelectorAll("[data-accordion-toggle]");

    toggles.forEach(toggle => {
        toggle.addEventListener("click", () => {

            const targetId = toggle.dataset.accordionToggle;
            const targetBody = modalRoot.querySelector(`#${targetId}`);

            const isOpening = targetBody.classList.contains("hidden");

            // Fermer tous les accordéons
            modalRoot.querySelectorAll("[data-accordion-toggle]").forEach(btn => {
                const otherId = btn.dataset.accordionToggle;
                const otherBody = modalRoot.querySelector(`#${otherId}`);
                const otherSvg = btn.querySelector("svg");

                otherBody.classList.add("hidden");
                otherSvg.classList.remove("rotate-180");
            });

            // Ouvrir celui cliqué (si on demande à ouvrir)
            if (isOpening) {
                targetBody.classList.remove("hidden");
                toggle.querySelector("svg").classList.add("rotate-180");
            }
        });
    });
}

function buildModulesSection(modalId, data) {

    const section = document.createElement("div");
    section.classList.add(
        "w-full",
        "max-h-[35vh]",
        "pr-1",
        "custom-scroll",
        "flex",
        "flex-col",
        "gap-1"
    );

    const targetModules = data?.ship?.modules || [];

    const categories = groupModulesByCategory(targetModules);

    for (const catKey of Object.keys(MODULE_CATEGORIES)) {
        const accordion = createModuleCategoryAccordion(
            catKey,
            categories[catKey],
            modalId
        );
        if (accordion) section.append(accordion);
    }

    return section;
}

function buildPcNpcImage(data, is_npc) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("flex", "justify-center", "w-full");

    const img = document.createElement("img");

    //
    // IMAGE SOURCE
    //
    if (!is_npc) {
        // PC
        img.src = `/static/img/users/${data.player.id}/0.gif` || `/static/img/ux/default-user.svg`;
        img.classList.add('object-cover', 'w-[72px]', 'h-[72px]', 'rounded-md')
    } else {
        // NPC
        const sizeX = data.ship.size.x;
        const sizeY = data.ship.size.y;

        img.src = `/static/img/foreground/ships/${data.ship.image}.png`;
        img.style.width = (32 * sizeX) + "px";
        img.style.height = (32 * sizeY) + "px";
        img.style.maxWidth = "none";
        img.style.objectFit = "contain";
        // Si ton format NPC diffère, dis-le moi, je l’adapte.
    }

    //
    // STYLE EXACT DE TON ANCIEN MODAL
    //
    img.classList.add(
        "mx-auto",
        "object-center",
    );

    wrapper.append(img);
    return wrapper;
}

function createStandardModalShell(modalId, options = {}) {

    let borderColor = "";

    if(!modalId.includes('npc') && !modalId.includes('pc')){
        borderColor = "border-emerald-400";
    }else{
        let is_npc = modalId.includes('npc') == true ? true : false;
        borderColor = is_npc == true ? "border-red-800" : "border-teal-600";
    }

    const {
        border = borderColor,
        gradientFrom = "from-emerald-700/90",
        gradientTo = "to-black/70"
    } = options;

    //
    // === ROOT ===
    //
    const root = document.createElement("div");
    root.id = modalId;
    root.setAttribute("aria-hidden", true);
    root.setAttribute("tabindex", -1);
    root.classList.add(
        "hidden","overflow-hidden","fixed","top-0","right-0","left-0",
        "z-50","justify-center","items-center","w-full","h-full",
        "md:inset-0","backdrop-brightness-50","bg-black/40",
        "backdrop-blur-md","animate-modal-fade", "border-2", "border-emerald-400/20"
    );

    //
    // === CONTAINER ===
    //
    const container = document.createElement("div");
    container.classList.add(
        "fixed","md:p-3","top-50","right-0","left-0","z-50",
        "w-full","md:inset-0","h-screen"
    );

    //
    // === CONTENT ===
    //
    const content = document.createElement("div");

    content.classList.add(
        "flex","rounded-lg","shadow","w-full","lg:w-1/4","rounded-t", "font-shadow",
        "justify-center","mx-auto","flex-col", "border", "border-2", border,
        "bg-gradient-to-b", gradientFrom, gradientTo,
    );

    //
    // === HEADER CONTAINER ===
    //
    const headerContainer = document.createElement("div");
    headerContainer.id = `${modalId}-header`;
    headerContainer.classList.add("p-1","flex","flex-row","items-center");

    //
    // ==== HEADER API ====
    //
    const header = {
        el: headerContainer,
        titleEl: null,

        setTitle(text) {
            if (!this.titleEl) {
                this.titleEl = document.createElement("h3");
                this.titleEl.classList.add(
                    "lg:text-xl","text-md","text-center","font-shadow",
                    "font-bold","flex","w-[95%]","text-white","p-1",
                    "justify-center"
                );
                this.el.append(this.titleEl);
            }
            this.titleEl.textContent = text;
        },

        setCloseButton(modalId) {
            const closeBtn = document.createElement("img");
            closeBtn.src = "/static/img/ux/close.svg";
            closeBtn.classList.add(
                "inline-block","w-[5%]","h-[5%]",
                "cursor-pointer","hover:animate-pulse"
            );
            closeBtn.onclick = () => open_close_modal(modalId);
            this.el.append(closeBtn);
        }
    };

    //
    // === BODY CONTAINER ===
    //
    const bodyContainer = document.createElement("div");
    bodyContainer.id = `${modalId}-body`;
    bodyContainer.classList.add(
        "items-center",
        "p-2",
        "flex",
        "flex-col",
        "gap-3",
        "overflow-y-auto",
        "md:max-h-[70vh]",
        "max-h-[80vh]"
    );

    //
    // ==== BODY API ====
    //
    const body = {
        el: bodyContainer,
        addSection(section) {
            this.el.append(section);
        }
    };

    //
    // === FOOTER CONTAINER ===
    //
    const footerContainer = document.createElement("div");
    footerContainer.classList.add("p-2","flex","flex-row","w-full","mx-auto");

    //
    // ==== FOOTER API ====
    //
    const footer = {
        el: footerContainer,

        setCloseButton(modalId) {
            const closeBtn = document.createElement("img");
            closeBtn.src = "/static/img/ux/close.svg";
            closeBtn.classList.add(
                "inline-block","w-[5%]","h-[5%]",
                "cursor-pointer","hover:animate-pulse", "mx-auto"
            );
            closeBtn.onclick = () => open_close_modal(modalId);
            this.el.append(closeBtn);
        }
    };

    //
    // === ASSEMBLAGE ===
    //
    content.append(headerContainer, bodyContainer, footerContainer);
    container.append(content);
    root.append(container);

    //
    // === RETURN API ===
    //
    return {
        root,
        container,
        content,
        header,
        body,
        footer
    };
}

function define_modal_type(modalId){

    let result = {
        isUnknown: false,
        type: null,
        id: null,
        elementName: null,
        isForegroundElement: false
    };

    if (!modalId || !modalId.startsWith('modal-')){
        return;
    }

    let remaining = modalId.replace('modal-', '');

    if(remaining.startsWith('unknown')){
        result.isUnknown = true;
        remaining = remaining.replace('unknown-', '');
    }

    if (remaining.includes('pc_') || remaining.includes('npc_')) {

        let match = remaining.match(/^(pc|npc)_(\d+)$/);  
        if (match) {
            result.type = match[1];
            result.id = parseInt(match[2]);
        }else {
            return;
        }
        
    } else {
        result.isStatic = true;
        // Foreground/sector_element au format: {element_type}_{id}
        // ex: asteroid_33, planet_2, warpzone_10
        const fg = remaining.match(/^([a-z_]+)_(\d+)$/);
        if (!fg) {
            result.isStatic = true;
            result.elementName = remaining;
            return result;
        }

        result.isForegroundElement = true;
        result.type = fg[1]; // "asteroid", "planet", ...
        result.id = parseInt(fg[2], 10);
        result.elementName = remaining;
    }

    return result;
}

function extract_data_for_modal(data){
    if(data.error){
        return { error: data.error };
    }
    if (data.isStatic) {
        // Recherche dans sector_element
        let element = map_informations.sector_element.find(el => el.data.name === data.elementName);
        return {
            found: !!element,
            type: element?.data?.type || null,
            data: element || null,
            searchInfo: data
        };
    } else {
        // Recherche PC ou NPC
        let searchArray = map_informations[data.type] || [];
        let foundEntity = null;

        if (data.type === 'pc') {
            foundEntity = searchArray.find(pc => 
                pc.user.player === data.id
            );
        } else if (data.type === 'npc') {
            foundEntity = searchArray.find(npc => 
                npc.npc.id === data.id
            );
        }

        return {
            found: !!foundEntity,
            type: data.type,
            data: foundEntity,
            searchInfo: data
        };
    }
}

function checkIfModalExists(modalId) {
    return document.getElementById(modalId) !== null;
}

function h(tag, options = {}, children = []) {
    const el = document.createElement(tag);

    const {
        classList,
        className,
        attrs,
        text
    } = options;

    if (className) {
        el.className = className;
    }

    if (classList) {
        const classes = Array.isArray(classList) ? classList : String(classList).split(/\s+/);
        classes.forEach(c => {
            if (c) el.classList.add(c);
        });
    }

    if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'dataset' && value && typeof value === 'object') {
                Object.entries(value).forEach(([dk, dv]) => {
                    el.dataset[dk] = dv;
                });
            } else {
                el.setAttribute(key, String(value));
            }
        });
    }

    if (text !== undefined && text !== null) {
        el.textContent = text;
    }

    if (!Array.isArray(children)) {
        children = [children];
    }

    children.forEach(child => {
        if (child === null || child === undefined) return;
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else {
            el.appendChild(child);
        }
    });

    return el;
}

function createNpcModalData(npcData) {
    return {
        _ui: {
            scanned: false
        },
        player: {
            name: npcData.npc.displayed_name,
            faction_name: npcData.faction.name,
            id: npcData.npc.id,
            coordinates : npcData.npc.coordinates,
        },
        ship: {
            name: npcData.ship.name,
            category: npcData.ship.category_name,
            description: npcData.ship.category_description,
            max_hp: npcData.ship.max_hp,
            current_hp: npcData.ship.current_hp,
            current_thermal_defense: npcData.ship.current_thermal_defense,
            max_thermal_defense: npcData.ship.max_thermal_defense,
            current_missile_defense: npcData.ship.current_missile_defense,
            max_missile_defense: npcData.ship.max_missile_defense,
            current_ballistic_defense: npcData.ship.current_ballistic_defense,
            max_ballistic_defense: npcData.ship.max_ballistic_defense,
            max_movement: npcData.ship.max_movement,
            current_movement: npcData.ship.current_movement,
            status: npcData.ship.status,
            modules: npcData.ship.modules,
            modules_range: npcData.ship.modules_range,
            image: npcData.ship.image,
            size: npcData.ship.size,
        },
        actions: {
            action_label: map_informations.actions.translated_action_label_msg,
            close: map_informations.actions.translated_close_msg,
            player_in_same_faction: map_informations.actions.player_is_same_faction,
            translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
            translated_statistics_str: map_informations.actions.translated_statistics_msg_str,
        }
    };
}

function createPlayerModalData(playerData) {
    return {
        _ui: {
            scanned: false
        },
        player: {
            name: playerData.user.name,
            is_npc: playerData.user.is_npc,
            image: playerData.user.image,
            faction_name: playerData.faction.name,
            id: playerData.user.player,
            coordinates : playerData.user.coordinates,
            current_ap : playerData.user.current_ap,
            max_ap : playerData.user.current_ap
        },
        ship: {
            name: playerData.ship.name,
            category: playerData.ship.category_name,
            description: playerData.ship.category_description,
            max_hp: playerData.ship.max_hp,
            current_hp: playerData.ship.current_hp,
            current_thermal_defense: playerData.ship.current_thermal_defense,
            max_thermal_defense: playerData.ship.max_thermal_defense,
            current_missile_defense: playerData.ship.current_missile_defense,
            max_missile_defense: playerData.ship.max_missile_defense,
            current_ballistic_defense: playerData.ship.current_ballistic_defense,
            max_ballistic_defense: playerData.ship.max_ballistic_defense,
            max_movement: playerData.ship.max_movement,
            current_movement: playerData.ship.current_movement,
            status: playerData.ship.status,
            modules: playerData.ship.modules,
            modules_range: playerData.ship.modules_range,
        },
        actions: {
            action_label: map_informations.actions.translated_action_label_msg,
            close: map_informations.actions.translated_close_msg,
            player_in_same_faction: map_informations.actions.player_is_same_faction,
            translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
            translated_statistics_str: map_informations.actions.translated_statistics_msg_str,
        }
    };
}

function extractForegroundModalData(element) {
    if (!element || !element.data) {
        console.error("Invalid foreground element:", element);
        return null;
    }
    let extractedDataByType;
    if(element.type == "warpzone"){
        extractedDataByType = {
            type: element.type,
            name: element.data.data.name,
            description: element.data.data.description,
            coordinates: element.data.data.coordinates,
            size: {
                x: element.data.size?.x || 1,
                y: element.data.size?.y || 1
            },
            animation: {
                dir: element.type,
                img: element.data.animations
            },
            data: element.data
        }
    }else{
        extractedDataByType = {
            type: element.type,
            name: element.data.item_name,
            description: element.data.data.description,
            coordinates: element.data.data.coordinates,
            size: {
                x: element.size?.x || 1,
                y: element.size?.y || 1
            },
            animation: {
                dir: element.type,
                img: element.data.animations
            },
            data: element.data
        }

    }
    
    return extractedDataByType;
}

function extractResourceInfo(resource) {
    if (!resource) return null;
    
    return {
        id: resource.id,
        name: resource.name,
        quantity_str: resource.quantity_str,
        quantity: resource.quantity,
        translated_text_resource: resource.translated_text_resource,
        translated_quantity_str: resource.translated_quantity_str,
        translated_scan_msg_str: resource.translated_scan_msg_str
    };
}

function extractElementInfo(sectorData) {
    return {
        type: sectorData.data.type,
        translatedType: sectorData.data.type_translated || null,
        animationName: sectorData.animations,
        name: sectorData.data.name,
        description: sectorData.data.description,
        coordinates: {
            x: sectorData.data.coordinates.x,
            y: sectorData.data.coordinates.y
        },
        size: {
            x: sectorData.size.x,
            y: sectorData.size.y
        }
    };
}

function createForegroundModalData(elementInfo, sectorData) {
    let baseModalData = {
        type: elementInfo.type,
        translated_type: elementInfo.translatedType,
        animation: elementInfo.animation,
        name: elementInfo.name,
        description: elementInfo.description,
        coordinates: elementInfo.coordinates,
        size: elementInfo.size,
        actions: {
            action_label: map_informations.actions.translated_action_label_msg,
            close: map_informations.actions.translated_close_msg,
        }
    };
    switch (elementInfo.type) {
        case "warpzone":
            
            let formattedDestinations =  sectorData.data.destinations.map(dest => ({
                id: dest.id,
                warpzone_name : dest.name,
                destination_name: dest.destination_name
                    .replaceAll('-', ' ')
                    .replaceAll('_', ' '),
                warp_link_id: dest.warp_link_id,
                original_name: dest.name // Conservation du nom original si besoin
            }));
            return {
                ...baseModalData,
                home_sector: sectorData.data.warp_home_id,
                destinations: formattedDestinations
            };

        case "star":
        case "asteroid":
            return {
                ...baseModalData,
                resources: extractResourceInfo(sectorData.resource),
                actions: {
                    ...baseModalData.actions,
                    player_in_same_faction: map_informations.actions.player_is_same_faction
                }
            };
        case "planet":
        case "station":
        case "satellite":
            return {
                ...baseModalData,
                faction: {
                    starter: map_informations.sector.faction.is_faction_level_starter,
                    name: map_informations.sector.faction.name,
                    translated_str: map_informations.sector.faction.translated_text_faction_level_starter
                },
                actions: {
                    ...baseModalData.actions,
                    player_in_same_faction: map_informations.actions.player_is_same_faction
                }
            };

        default:
            return null;
    }
}

async function open_close_modal(modalId) {
    if (!modalId || typeof modalId !== "string") return;

    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    // --------------------------------------------------
    // 1) Toggle close si même modal déjà ouvert
    // --------------------------------------------------
    const existing = document.getElementById(modalId);
    if (existing) {
        existing.remove();
        return;
    }

    // Un seul modal à la fois
    modalContainer.innerHTML = "";

    // --------------------------------------------------
    // 2) Création du conteneur modal (VIDE)
    // --------------------------------------------------
    const modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "absolute inset-0 pointer-events-auto z-50";

    modalContainer.appendChild(modal);

    // --------------------------------------------------
    // 3) Affichage loader GLOBAL (dans modal-container)
    // --------------------------------------------------
    const loader = document.createElement("div");
    loader.id = "modal-loader";
    loader.className = `
        absolute inset-0 flex items-center justify-center
        bg-black/60 backdrop-blur-sm z-40
        text-emerald-400 font-semibold
    `;
    loader.innerText = "Transmission en cours…";

    modalContainer.appendChild(loader);

    // --------------------------------------------------
    // 4) Parse modalId
    // --------------------------------------------------
    const raw = modalId.replace("modal-", "");
    const isUnknown = raw.startsWith("unknown-");
    const clean = isUnknown ? raw.replace("unknown-", "") : raw;

    const [elementType, elementIdStr] = clean.split("_");
    const elementId = parseInt(elementIdStr, 10);

    if (!elementType || Number.isNaN(elementId)) {
        loader.remove();
        console.warn("Invalid modalId:", modalId);
        return;
    }

    // --------------------------------------------------
    // 5) Fetch backend
    // --------------------------------------------------
    let responseData;
    const targetKey = `${elementType}_${elementId}`;

    try {
        if (window.scannedModalData?.[targetKey]) {

            responseData = {
                target: window.scannedModalData[targetKey],
                current_player: window.currentPlayerState,
                __fromScan: true
            };

        } else {

            const res = await fetch(`/play/modal-data/${elementType}/${elementId}/`, {
                headers: { "X-Requested-With": "XMLHttpRequest" }
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            responseData = await res.json();
        }

    } catch (err) {
        console.error("Modal fetch failed:", err);
        loader.innerText = "Erreur de transmission";
        return;
    }

    // --------------------------------------------------
    // 6) Contexte UI (UNKNOWN = front only)
    // --------------------------------------------------
    responseData.__ui = { 
        isUnknown,
        scanned: Boolean(window.scannedTargets?.has(targetKey))
    };

    // --------------------------------------------------
    // 7) Construction réelle du modal
    // --------------------------------------------------
    
    try {
        const parsed = define_modal_type(modalId);
        if (!parsed) {
            console.error("define_modal_type failed (parse)");
            loader.remove();
            return;
        }

        // On injecte les données fetchées à la place de map_informations
        const extractedDataForModal = {
            found: true,
            type: parsed.type,
            data: responseData.target,
            current_player: responseData.current_player,
            __fromScan: responseData.__fromScan === true
        };

        create_modal(modalId, parsed, extractedDataForModal);
        modal.remove(); // 🔥 enlève le calque fantôme
        const built = document.getElementById(modalId);
        if (built) built.classList.remove("hidden");
        loader.remove();

    } catch (e) {
        console.error("define_modal_type failed:", e);
        loader.innerText = "Erreur de décodage";
        return;
    }
}

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
                // RESTAURER L'ÉTAT SCANNÉ SI BESOIN
                if (extractedDataForModal?.__fromScan === true) {
                    modalData._ui.scanned = true;
                }
                modal = create_pc_npc_modal(modalId, modalData, false);
            }
            break;
        case "npc":
            if(extractDataFromId.isUnknown == true){
                modalData = createNpcModalData(extractedDataForModal.data)
                modal = createUnknownNpcModal(modalId, modalData);
            }else{
                modalData = createNpcModalData(extractedDataForModal.data)
                // RESTAURER L'ÉTAT SCANNÉ SI BESOIN
                if (extractedDataForModal?.__fromScan === true) {
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
    const max = res.max_quantity ?? res.max ?? "?"; // si tu l’ajoutes plus tard
    p.textContent = `${name} : ${qty}${max !== "?" ? " / " + max : ""}`;
    p.classList.add("text-sm","text-white", "font-shadow");
    container.append(p);

    return container;
}


function buildForegroundActionsSection(modalId, data) {
    const wrapper = document.createElement("div");
    wrapper.classList.add(
        "action-wrapper-sf",
        "flex",
        "flex-col",
        "justify-center",
        "w-full",
        "gap-2"
    );

    const type = data.type;

    // =========================
    // ZONE MESSAGE ERREUR
    // =========================
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

    // =========================
    // WARPZONE : LISTE
    // =========================
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

    // =========================
    // AUTRES FOREGROUND
    // =========================
    const grid = document.createElement("div");
    grid.classList.add(
        "action-grid-sf",
        "mx-auto"
    );

    wrapper.append(errorZone);
    wrapper.append(grid);

    const actions = FOREGROUND_ACTIONS[type] || [];

    actions.forEach(action => {

        // === WRAPPER PAR ACTION (clé du fix mobile) ===
        const itemWrapper = document.createElement("div");
        itemWrapper.classList.add(
            "flex",
            "flex-col",
            "items-center"
        );

        // === BOUTON ===
        const btn = document.createElement("div");
        btn.classList.add("action-button-sf", "cursor-pointer", "font-shadow");

        // === ICÔNE ===
        let iconEl;
        if (action.icon) {
            iconEl = document.createElement("img");
            iconEl.src = action.icon;
            iconEl.classList.add("action-button-sf-icon");
        } else if (action.iconify) {
            iconEl = document.createElement("span");
            iconEl.classList.add(
                "iconify",
                action.iconify,
                "action-button-sf-icon"
            );
        }

        // === LABEL ===
        const label = document.createElement("div");
        label.textContent = action.label || "";
        label.classList.add("action-button-sf-label", "font-shadow");

        btn.append(iconEl, label);
        itemWrapper.append(btn);

        // === COÛT (SEULEMENT SI DÉFINI) ===
        if (typeof action.cost === "number") {
            const costEl = document.createElement("div");
            costEl.textContent = `${action.cost} cr`;
            costEl.classList.add(
                "text-xs",
                "text-yellow-400",
                "font-bold",
                "mt-1",
                "font-shadow"
            );
            itemWrapper.append(costEl);
        }

        // === COÛT (SEULEMENT SI DÉFINI) ===
        if (typeof action.cost === "number") {
            const costEl = document.createElement("div");
            costEl.textContent = `${action.cost} cr`;
            costEl.classList.add(
                "text-xs",
                "text-yellow-400",
                "font-bold",
                "mt-1",
                "font-shadow"
            );
            itemWrapper.append(costEl);
        }

        // === CLICK HANDLER ===
        btn.onclick = () => {

            // Vérification des modules requis
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

            // === LOGIQUE SPÉCIFIQUE ===
            if (action.key === "scan") {
                data._ui.scanned = true;
                const resContainer = document.getElementById(`${modalId}-resources`);
                if (resContainer) {
                    resContainer.replaceWith(
                        buildAsteroidResourcesSection(modalId, data)
                    );
                }
            }

            // autres actions → handlers plus tard
        };

        grid.append(itemWrapper);
    });

    // Ajuste le nombre de colonnes max (≤ 5)
    const count = grid.children.length;
    grid.style.setProperty("--cols", Math.min(count, 5));

    return wrapper;
}


function create_foreground_modal(modalId, data) {
    const modal = createStandardModalShell(modalId);
    const coords = `[X:${data.coordinates.x} Y:${data.coordinates.y}]`;
    modal.header.setTitle(`${data.name.toUpperCase()} ${coords}`);
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
        resourcesLabel.classList.add("font-bold", "text-white", "mt-2", "font-shadow", "w-full");

        modal.body.addSection(resourcesLabel);
        modal.body.addSection(
            buildAsteroidResourcesSection(modalId, data)
        );
    }

    // ACTIONS
    const actionsLabel = document.createElement("label");
    actionsLabel.textContent = "ACTIONS:";
    actionsLabel.classList.add("w-full", "font-bold", "text-white", "mt-2", "text-start", "font-shadow");
    modal.body.addSection(actionsLabel);

    const actionsSection = buildForegroundActionsSection(modalId, data);
    modal.body.addSection(actionsSection);

    modal.footer.setCloseButton(modalId);
    return modal.root;
}

function createActionButton(iconElement, label, onClick) {
    const btn = document.createElement("div");
    btn.classList.add("action-button-sf", "cursor-pointer");

    const iconWrapper = document.createElement("div");
    iconWrapper.append(iconElement);
    iconElement.classList.add("action-button-sf-icon");

    const lbl = document.createElement("span");
    lbl.classList.add("action-button-sf-label");
    lbl.textContent = label;

    btn.append(iconWrapper, lbl);
    btn.addEventListener("click", onClick);

    return btn;
}

function playerHasModule(modules, types = []) {
    return modules.some(m => types.includes(m.type));
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

function buildActionsSection(modalId, data, is_npc, contextZone) {

    const ws = window.canvasEngine?.ws;

    const modules = currentPlayer.ship.modules;
    const isUnknown = modalId.startsWith("modal-unknown");

    // Conteneur global
    const wrapper = document.createElement("div");
    wrapper.classList.add("action-wrapper-sf");
    const grid = document.createElement("div");
    grid.classList.add(
        "action-grid-sf", 
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
            contextZone.classList.remove("hidden");

            const list = document.createElement("div");
            list.classList.add("flex", "flex-col", "gap-2", "mt-2");

            // modules weaponry
            modules.forEach(m => {
                if (m.type !== "WEAPONRY") return;

                const wrapper = document.createElement("div");
                wrapper.classList.add(
                    "flex",
                    "flex-row",
                    "justify-between",
                    "items-center",
                    "p-2",
                    "rounded-lg",
                    "bg-black/40",
                    "border",
                    "border-emerald-400/40",
                    "gap-4"
                );

                // description
                const left = document.createElement("div");
                left.classList.add('w-full');
                left.innerHTML = createFormatedLabel(m); // convert string → element
                const temp = document.createElement("div");
                temp.innerHTML = left.innerHTML.trim();
                left.innerHTML = "";
                left.append(temp.firstChild);

                // bouton attaque
                const rightIcon = document.createElement("img");
                rightIcon.src = "/static/img/ux/target_icon.svg";
                rightIcon.classList.add("action-button-sf-icon");

                const rightBtn = document.createElement("div");
                rightBtn.classList.add("action-button-sf", "cursor-pointer");
                rightBtn.append(rightIcon);

                rightBtn.addEventListener("click", () => {
                    // TODO: attaquer via websocket avec module m.id
                    console.log("Attaque avec module :", m.id);
                });

                wrapper.append(left, rightBtn);
                list.append(wrapper);
            });

            contextZone.append(list);
        }
    );
    wrapper.append(grid);
    

    // ---------------------------
    // ACTION : SCAN
    // ---------------------------
    const scanIcon = document.createElement("img");
    scanIcon.src = "/static/img/ux/scan_resource_icon.svg";
    
    const scanButton = createActionButton(
        scanIcon,
        "Scan",
        () => {
            const info = define_modal_type(modalId);
            ws.send({
                type: "action_scan_pc_npc",
                payload: {
                    target_type: info.type,
                    target_id: info.id
                }
            });
            
        }
        
    );
    grid.innerHTML = "";
    // Limiter l'utilisation du scan.
    if (data._ui?.scanned === true || !playerHasModule("PROBE", "spaceship-probe")) {
        scanButton.classList.add("opacity-40", "pointer-events-none");
        // optionnel : petit texte
        scanButton.title = "Déjà scanné";
    }

    // 1) Toujours visibles
    grid.append(attackButton);
    grid.append(scanButton);

    // 2) Actions post-scan : “à la suite” dans la grille
    if (data._ui?.scanned === true) {
        PC_NPC_EXTRA_ACTIONS.forEach(extra => {

            // --- icon ---
            let iconEl;

            if (extra.iconify) {
                iconEl = document.createElement("span");
                iconEl.classList.add("iconify", "w-5", "h-5");
                iconEl.setAttribute("data-icon", "game-icons:radar-cross-section");
                // Iconify attend data-icon, pas une classe “game-icons--…”
            } else if (extra.iconClass) {
                iconEl = document.createElement("i");
                extra.iconClass.split(" ").forEach(c => iconEl.classList.add(c));
            } else {
                iconEl = document.createElement("span");
            }

            // --- click handler ---
            const btn = createActionButton(iconEl, extra.label, () => {
            if (extra.requires_group && !currentPlayer?.group_id) {
                showActionError(modalId, extra.warning_no_group);
                return;
            }

            const ws = window.canvasEngine?.ws;
            if (!ws?.send) return;

            const info = define_modal_type(modalId);
            ws.send({
                type: extra.key === "share_to_group" ? "action_share_scan" : "action_send_report",
                payload: { target_type: info.type, target_id: info.id }
            });
        });

        // --- cost under button (same style as your other costs) ---
        const cost = document.createElement("div");
        cost.textContent = `Coût : ${extra.cost_ap} AP`;
        cost.classList.add("text-xs","text-emerald-300","font-bold","mt-1","font-shadow","text-center");

        const cell = document.createElement("div");
        cell.classList.add("flex","flex-col","items-center");
        cell.append(btn, cost);

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

            contextZone.innerHTML = "E-War disponible (à implémenter)";
            contextZone.classList.remove("hidden");
        }
    );

    grid.append(ewarButton);

    // ---------------------------
    // ACTION : REPAIRE
    // ---------------------------
    const repIcon = document.createElement("img");
    repIcon.src = "/static/img/ux/repaire_icon.svg";

    const repButton = createActionButton(
        repIcon,
        "Repaire",
        () => {
            if (!hasRepaire) return showMissingModuleError();

            contextZone.innerHTML = "Réparation (à implémenter)";
            contextZone.classList.remove("hidden");
        }
    );

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
        }
    );

    grid.append(tradeButton);

    // --- FILTRAGE UNKNOWN ---
    if (isUnknown && data._ui?.scanned !== true) {
        grid.innerHTML = "";
        grid.append(attackButton);
        if (data._ui?.scanned === true) {
            scanButton.classList.add("opacity-40", "pointer-events-none");
            // optionnel : petit texte
            scanButton.title = "Déjà scanné";
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

function createUnknownModal(modalId, data, is_npc) {

    let e = document.createElement('div');
    e.id = modalId;
    e.setAttribute('aria-hidden', true);
    e.setAttribute('tabindex', -1);
    e.classList.add(
        'hidden', 'overflow-hidden', 'fixed', 'top-0', 'right-0', 'left-0',
        'z-50', 'justify-center', 'items-center', 'w-full', 'h-full', 'md:inset-0',
        'backdrop-brightness-50', 'bg-black/40', 'backdrop-blur-md', 'animate-modal-fade'
    );

    let container_div = document.createElement('div');
    container_div.classList.add("fixed","md:p-3","top-50","right-0","left-0","z-50","w-full","md:inset-0","h-screen");

    // 🔥 Always RED background for UNKNOWN
    let content_div = document.createElement('div');
    content_div.classList.add(
        'flex','rounded-lg','shadow','w-full','lg:w-1/4','rounded-t',
        'justify-center','mx-auto','flex-col','border-2','border-red-800',
        'bg-gradient-to-b','from-red-600/70','to-black/70','items-center','gap-2'
    );

    // --- HEADER ---
    let header_container_div = document.createElement('div');
    header_container_div.classList.add('p-1','flex','flex-row');

    let header_div = document.createElement('h3');
    header_div.id = `${modalId}-header`;
    header_div.classList.add(
        'lg:text-xl','text-md','text-center','font-shadow','font-bold',
        'flex-wrap','text-justify','justify-center','text-white','p-1','flex','w-[95%]'
    );
    header_div.textContent = "Unknown";

    let header_close = document.createElement("img");
    header_close.src = '/static/img/ux/close.svg';
    header_close.classList.add('inline-block','w-[5%]','h-[5%]','cursor-pointer','hover:animate-pulse');
    header_close.setAttribute('onclick', `open_close_modal('${e.id}')`);

    header_container_div.append(header_div, header_close);

    // --- BODY ---
    let body_container_div = document.createElement('div');
    body_container_div.classList.add(
        'items-center',
        'p-2',
        'w-full',
        'flex',
        'flex-col',
        'overflow-y-auto',
        'md:max-h-[70vh]',
        'max-h-[80vh]'
    );

    // Placeholder generic image
    let unknown_img = document.createElement('img');
    unknown_img.src = "/static/img/ux/unknown_target_icon.svg";
    unknown_img.alt = "unknown-target";
    unknown_img.classList.add('mx-auto','object-center','h-[80px]','w-[80px]','pt-1','rounded-full');
    body_container_div.append(unknown_img);

    const statsSection = buildShipStatsSection(data);
    // si déjà scanné (via scan_result → __fromScan), afficher les stats détaillées
    if (data._ui?.scanned === true) {
        statsSection.ship_statistics_warning_msg_container_p.classList.add("hidden");
        statsSection.ship_detailed_statistics_container_div.classList.remove("hidden");
    }
    body_container_div.append(
        statsSection.ship_statistics_container_label,
        statsSection.ship_statistics_container_div,
        statsSection.ship_statistics_warning_msg_container_p,
        statsSection.ship_detailed_statistics_container_div
    );

    // === MODULES LABEL (UNKNOWN) ===
    const modulesLabel = document.createElement("label");
    modulesLabel.textContent = "MODULES:";
    modulesLabel.classList.add(
        "w-full",
        "font-bold",
        "font-shadow",
        "text-white",
        "text-base",
        "mt-2"
    );

    body_container_div.append(modulesLabel);

    // === MESSAGE PAR DÉFAUT (scan requis) ===
    const modulesWarning = document.createElement("p");
    modulesWarning.id = "statistics-warning-msg";
    modulesWarning.classList.add(
        "text-red-500",
        "font-bold",
        "text-xs",
        "text-center",
        "font-shadow",
        "animate-pulse"
    );
    modulesWarning.textContent = "Scan requis pour afficher les modules.";

    body_container_div.append(modulesWarning);

    // ACTIONS SECTION
    // === ACTIONS LABEL (même style que normal) ===
    const actionsLabel = document.createElement("label");
    actionsLabel.textContent = data.actions.action_label.toUpperCase() + ":";
    actionsLabel.classList.add("w-full", "font-bold", "font-shadow", "text-white", "text-base");
    body_container_div.append(actionsLabel);

    // === CONTEXT ZONE (obligatoire pour éviter null) ===
    const contextZone = document.createElement("div");
    contextZone.id = modalId + "-action-context";
    contextZone.classList.add("hidden", "w-full", "mt-3");
    body_container_div.append(contextZone);

    // === ERROR ZONE (pour le message rouge 5s) ===
    const errorZone = document.createElement("div");
    errorZone.id = modalId + "-action-error-zone";
    errorZone.classList.add("action-error-msg", "hidden");
    body_container_div.append(errorZone);

    // === ACTIONS GRID (utilise buildActionsSection) ===
    const actionsSection = buildActionsSection(modalId, data, is_npc, contextZone);
    body_container_div.append(actionsSection);

    // Now the part with WEAPON MODULES (from currentPlayer)
    // ACCORDION
    let weapon_container = document.createElement('div');
    weapon_container.id = "accordion-collapse";
    weapon_container.classList.add('mt-5','hidden');

    // Category 1
    let h3_cat1 = document.createElement('h3');
    let btn_cat1 = document.createElement('button');
    btn_cat1.type = "button";
    btn_cat1.classList.add('flex','items-center','justify-between','w-full','p-2','font-bold','text-white','mb-1');

    let btn_cat1_span = document.createElement('span');
    btn_cat1_span.textContent = "Weaponry";

    let btn_cat1_svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    btn_cat1_svg.setAttribute("fill","none");
    btn_cat1_svg.setAttribute("viewBox","0 0 10 6");
    btn_cat1_svg.classList.add('w-3','h-3','rotate-180','shrink-0');

    let btn_cat1_path = document.createElementNS('http://www.w3.org/2000/svg','path');
    btn_cat1_path.setAttribute("stroke","currentColor");
    btn_cat1_path.setAttribute("stroke-linecap","round");
    btn_cat1_path.setAttribute("stroke-linejoin","round");
    btn_cat1_path.setAttribute("stroke-width","2");
    btn_cat1_path.setAttribute("d","M9 5 5 1 1 5");
    btn_cat1_svg.append(btn_cat1_path);

    btn_cat1.append(btn_cat1_span, btn_cat1_svg);
    h3_cat1.append(btn_cat1);

    let body_cat1 = document.createElement('div');
    body_cat1.id = "offensive-module-body-1";
    body_cat1.classList.add('hidden');
    btn_cat1.addEventListener('click', ()=> display_attack_options(e.id, 1));

    // Populate modules from currentPlayer..ship.modules
    for (let mod of currentPlayer.ship.modules) {
        if (mod.type !== "WEAPONRY") continue;

        let mod_div = document.createElement('div');
        mod_div.classList.add(
            'flex','flex-col','py-2','px-4','mb-1','rounded-md','border',
            'hover:border-gray-800','border-slate-400','hover:bg-slate-300',
            'bg-gray-800','text-white','hover:text-gray-800','cursor-pointer',
            'divide-y','divide-dashed','divide-white','hover:divide-gray-800'
        );

        let mod_name = document.createElement('p');
        mod_name.classList.add('font-bold');
        mod_name.textContent = mod.name;
        mod_div.append(mod_name);

        // Damages, range, etc (UNCHANGED)
        if (mod.effect.damage_type) {
            let dmg_span = document.createElement('span');
            dmg_span.innerHTML = `<small>Damage type: </small><small class="text-blue-500 font-bold">${mod.effect.damage_type}</small>`;
            let dmg_val = document.createElement('span');
            dmg_val.innerHTML = `<small>Damages: </small><small class="text-blue-500 font-bold">${mod.effect.min_damage} - ${mod.effect.max_damage}</small>`;
            let range = document.createElement('span');
            range.innerHTML = `<small>Range: </small><small class="text-blue-500 font-bold">${mod.effect.range}</small>`;
            let cth = document.createElement('span');
            cth.innerHTML = `<small>Chance to hit: </small><small class="text-blue-500 font-bold">100%</small>`;

            mod_div.append(dmg_span, dmg_val, range, cth);
        }

        body_cat1.append(mod_div);
    }

    weapon_container.append(
        h3_cat1,
        body_cat1
    );

    body_container_div.append(weapon_container);

    // --- FOOTER ---
    let footer_div = document.createElement('div');
    footer_div.classList.add('p-2','flex','flex-row','w-[100%]','justify-end','align-center');

    let footer_close = document.createElement("img");
    footer_close.src = "/static/img/ux/close.svg";
    footer_close.classList.add('inline-block','w-[5%]','h-[5%]','cursor-pointer','hover:animate-pulse', 'mx-auto');
    footer_close.setAttribute('onclick', `open_close_modal('${e.id}')`);
    footer_div.append(footer_close);

    // Final assembly
    content_div.append(header_container_div);
    content_div.append(body_container_div);
    content_div.append(footer_div);
    container_div.append(content_div);
    e.append(container_div);

    return e;
}

function create_pc_npc_modal(modalId, data, is_npc) {

    // === MODAL SHELL ===
    const modal = createStandardModalShell(modalId, {
        border: is_npc ? "border-red-800" : "border-cyan-600",
        gradientFrom: is_npc ? "from-red-700/70" : "from-cyan-600/70",
        gradientTo: "to-black/70"
    });

    // === HEADER ===
    const coords = data.player?.coordinates || data.coordinates;
    const coordStr = coords ? ` [Y:${coords.y}, X:${coords.x}]` : "";

    modal.header.setTitle(
        (data.player?.name || "UNKNOWN").toUpperCase() + coordStr
    );

    modal.header.setCloseButton(modalId);

    // === BODY ===

    //
    // 1 — IMAGE
    //
    const shipImage = buildPcNpcImage(data, is_npc);
    modal.body.addSection(shipImage);

    //
    // 2 — STATS SECTION
    //
    const statsSection = buildShipStatsSection(data);
    if (data._ui?.scanned === true) {
        statsSection.ship_statistics_warning_msg_container_p.classList.add("hidden");
        statsSection.ship_detailed_statistics_container_div.classList.remove("hidden");
    }
    modal.body.addSection(statsSection.ship_statistics_container_label);
    modal.body.addSection(statsSection.ship_statistics_warning_msg_container_p);
    modal.body.addSection(statsSection.ship_detailed_statistics_container_div);

    //
    // 3 — MODULES LABEL
    //
    const modulesLabel = document.createElement("label");
    modulesLabel.textContent = "MODULES:";
    modulesLabel.classList.add("w-full", "font-bold", "font-shadow", "text-white", "text-base", "mt-2");
    modal.body.addSection(modulesLabel);

    //
    // 4 — MODULES SECTION (weaponry / ewar / defensive / utility / probe)
    //
    if (data._ui?.scanned === true) {
        modal.body.addSection(buildModulesSection(modalId, data));
    } else {
        const warning = document.createElement("p");
        warning.id = "statistics-warning-msg";
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
    //
    // 5 — ACTIONS LABEL
    //
    const actionsLabel = document.createElement("label");
    actionsLabel.textContent = data.actions.action_label.toUpperCase() + ":";
    actionsLabel.classList.add("w-full", "font-bold", "font-shadow", "text-white", "text-base", "mt-2");
    modal.body.addSection(actionsLabel);

    //
    // 7 — ACTIONS SECTION
    //
    const contextZone = document.createElement("div");
    contextZone.id = modalId + "-action-context";
    contextZone.classList.add("hidden", "w-full", "mt-3");
    modal.body.addSection(contextZone);

    // zone d’erreur
    const errorZone = document.createElement("div");
    errorZone.classList.add("action-error-msg", "hidden");
    errorZone.id = modalId + "-action-error-zone";
    modal.body.addSection(errorZone);

    // 8 — ACTION CONTEXT ZONE (hidden)
    const actionsSection = buildActionsSection(modalId, data, is_npc, contextZone);
    modal.body.addSection(actionsSection);

    //
    // === FOOTER ===
    //
    modal.footer.setCloseButton(modalId);

    //
    // === POST INIT LOGIC ===
    //
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
        "w-full"
    );

    // --- CONTENEUR "SIMPLE STATS" (laissé vide pour compat) ---
    let ship_statistics_container_div = document.createElement("div");
    ship_statistics_container_div.id = "ship-statistics";

    // --- CONTENEUR STATS DÉTAILLÉES ---
    let ship_detailed_statistics_container_div = document.createElement("div");
    ship_detailed_statistics_container_div.id = "ship-statistics-detailed";
    ship_detailed_statistics_container_div.classList.add("w-full", "p-2", "hidden"); // ⬅ caché par défaut

    // Helper pour une barre de progression
    function createProgressBar(current, max, labelText) {
        let wrapper = document.createElement("div");

        let label = document.createElement("label");
        label.textContent = labelText;
        label.classList.add("font-shadow", "text-white");

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

        container.append(text, content);
        wrapper.append(label, container);
        return wrapper;
    }

    // --- HP ---
    console.log(data)
    ship_detailed_statistics_container_div.append(
        createProgressBar(
            data.ship.current_hp,
            data.ship.max_hp,
            "Hull points:"
        )
    );
    // --- AP ---
    if(data.player.max_ap){
        ship_detailed_statistics_container_div.append(
            createProgressBar(
                data.player.current_ap,
                data.player.max_ap,
                "Action points:"
            )
        );
    }
    
        // --- Movement ---
    ship_detailed_statistics_container_div.append(
        createProgressBar(
            data.ship.current_movement,
            data.ship.max_movement,
            "Movement left:"
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
                createProgressBar(currentVal, maxVal, defConf.label)
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

function refreshModalIfOpen(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return false; // pas ouvert

    // on remplace le contenu en réappelant open_close_modal (close puis open)
    // close
    open_close_modal(modalId);
    // open
    open_close_modal(modalId);
    return true;
}

function refreshModalAfterScan(targetKey) {

    const modalNormal = `modal-${targetKey}`;
    const modalUnknown = `modal-unknown-${targetKey}`;

    const normalOpen = document.getElementById(modalNormal);
    const unknownOpen = document.getElementById(modalUnknown);

    // Cas 1 : modal unknown ouvert → switch vers modal normal
    if (unknownOpen) {
        open_close_modal(modalUnknown); // close
        open_close_modal(modalNormal);  // open avec nouvelles données
        return;
    }

    // Cas 2 : modal normal déjà ouvert → refresh
    if (normalOpen) {
        open_close_modal(modalNormal);
        open_close_modal(modalNormal);
    }
}

function playerHasModule(type, requiredName) {
    const modules = window.currentPlayer?.ship?.modules || [];

    return modules.some(m =>
        m.type === type &&
        typeof m.name === "string" &&
        m.name.toLowerCase() === requiredName.toLowerCase()
    );
}