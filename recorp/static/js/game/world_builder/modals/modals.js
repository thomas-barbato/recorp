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
        flex flex-col gap-1 font-bold text-xs
        bg-gray-900/95 border border-emerald-700/40 rounded-md
        text-emerald-200 shadow-lg shadow-black/60 p-2 backdrop-blur-sm
    `;
    module_tooltip_name.className = "font-bold text-emerald-300 text-sm";
    module_tooltip_name.textContent = module_name;
    module_tooltip_moduleType.className = "italic text-emerald-400/80 mb-1";

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
        "mb-1","cursor-pointer"
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
    bodyDiv.classList.add("hidden","pl-2","pb-2","flex","flex-col","gap-3");
    bodyDiv.id = accordionId;

    // Chaque module formaté via createFormatedLabel
    for (const moduleObj of modules) {

        const htmlString = createFormatedLabel(moduleObj);

        const temp = document.createElement("div");  
        temp.innerHTML = htmlString.trim();

        const formattedModule = temp.firstChild;  // ⭐ vrai élément DOM !

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
        "gap-2"
    );

    const categories = groupModulesByCategory(currentPlayer.ship.modules);

    for (const catKey of Object.keys(MODULE_CATEGORIES)) {
        const accordion = createModuleCategoryAccordion(catKey, categories[catKey], modalId);
        if (accordion) section.append(accordion);
    }

    return section;
}

function buildPcNpcImage(data, is_npc) {
    console.log(data)
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

    const {
        border = "border-slate-600",
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
        "backdrop-blur-md","animate-modal-fade"
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
        "flex","rounded-lg","shadow","w-full","lg:w-1/4","rounded-t",
        "justify-center","mx-auto","flex-col","border-2",
        border,"bg-gradient-to-b", gradientFrom, gradientTo
    );

    //
    // === HEADER CONTAINER ===
    //
    const headerContainer = document.createElement("div");
    headerContainer.id = `${modalId}-header`;
    headerContainer.classList.add("md:p-5","p-1","flex","flex-row","items-center");

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
        "md:p-5",
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
    footerContainer.classList.add("md:p-5","p-1","flex","flex-row","w-full","justify-end");

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
                "cursor-pointer","hover:animate-pulse"
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
        let element = map_informations.sector_element.filter(el => el.data.name === data.elementName);
        return {
            found: element.length > 0,
            type: element[0]?.data?.type,
            data: element[0],
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
        player: {
            name: npcData.npc.displayed_name,
            faction_name: npcData.faction.name,
            id: npcData.npc.id,
        },
        ship: {
            name: npcData.ship.name,
            category: npcData.ship.category_name,
            description: npcData.ship.category_description,
            max_hp: npcData.ship.max_hp,
            current_hp: npcData.ship.current_hp,
            current_thermal_defense: npcData.ship.current_thermal_defense,
            current_missile_defense: npcData.ship.current_missile_defense,
            current_ballistic_defense: npcData.ship.current_ballistic_defense,
            max_movement: npcData.ship.max_movement,
            current_movement: npcData.ship.current_movement,
            status: npcData.ship.status,
            modules: npcData.ship.modules,
            modules_range: npcData.ship.modules_range,
            image: npcData.ship.image,
            size: npcData.ship.size
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
        player: {
            name: playerData.user.name,
            is_npc: playerData.user.is_npc,
            image: playerData.user.image,
            faction_name: playerData.faction.name,
            id: playerData.user.player,
        },
        ship: {
            name: playerData.ship.name,
            category: playerData.ship.category_name,
            description: playerData.ship.category_description,
            max_hp: playerData.ship.max_hp,
            current_hp: playerData.ship.current_hp,
            current_thermal_defense: playerData.ship.current_thermal_defense,
            current_missile_defense: playerData.ship.current_missile_defense,
            current_ballistic_defense: playerData.ship.current_ballistic_defense,
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

function extractForegroundModalData(foregroundData) {
    let sizeData = foregroundData.data.data.size || { x: 1, y: 1 };
    return {
        type: foregroundData.data.data.type,
        translatedType: foregroundData.data.type_translated || null,
        animationName: foregroundData.data.animations,
        name: foregroundData.data.data.name,
        description: foregroundData.data.data.description,
        coordinates: {
            x: foregroundData.data.data.coordinates.x,
            y: foregroundData.data.data.coordinates.y
        },
        size: {
            x: sizeData.x || 1,
            y: sizeData.y || 1
        }
    };
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
        animation: {
            dir: elementInfo.type,
            img: elementInfo.animationName,
        },
        name: elementInfo.name,
        description: elementInfo.description,
        coord: elementInfo.coordinates,
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

function open_close_modal(id) {
    
    let extractDataFromId = define_modal_type(id);
    let extractedDataForModal = extract_data_for_modal(extractDataFromId);

    document.querySelector('#modal-unknown-' + id)?.delete();
    
    let modal = document.querySelector('#' + id);

    if (modal) {

        modal.classList.add('hidden');
        // delete content from modal-container.
        document.querySelector('#modal-container').textContent = "";

    }else{
        create_modal(id, extractDataFromId, extractedDataForModal);
        document.querySelector('#' + id).classList.remove('hidden');

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
                modalData = createPlayerModalData(extractedDataForModal.data)
                modal = create_pc_npc_modal(modalId, modalData, false);
            }
            break;
        case "npc":
            if(extractDataFromId.isUnknown == true){
                modalData = createNpcModalData(extractedDataForModal.data)
                modal = createUnknownNpcModal(modalId, modalData);
            }else{
                modalData = createNpcModalData(extractedDataForModal.data)
                modal = create_pc_npc_modal(modalId, modalData, true);
            }
            break;
        default:
            let foregroundData = extractForegroundModalData(extractedDataForModal)
            modalData = createForegroundModalData(foregroundData, extractedDataForModal.data)
            modal = create_foreground_modal(modalId, modalData)
            break;
    }
    
    if(modal){
        document.querySelector("#modal-container").append(modal);
    }

}

function create_foreground_modal(modalId, data) {
    
    const {
        root: e,
        container: container_div,
        content: content_div,
        headerContainer: header_container_div,
        bodyContainer: body_container_div,
        footerContainer: footer_container_div
    } = createStandardModalShell(modalId, {
        contentClasses: [
            'flex',
            'rounded-lg',
            'shadow',
            'w-full',
            'lg:w-1/4',
            'rounded-t',
            'justify-center',
            'mx-auto',
            'flex-col',
            'border-2',
            'border-slate-600',
            'bg-gradient-to-b',
            'from-amber-600/70',
            'to-black/70'
        ],
        footerClasses: [
            'md:p-5',
            'p-1',
            'flex',
            'flex-row',
            'w-[100%]',
            'justify-end',
            'align-center'
        ]
    });

    let header_div = document.createElement('h3');
    header_div.classList.add('lg:text-xl', 'text-md', 'text-center', 'font-shadow', 'font-bold', 'flex-wrap', 'text-justify', 'justify-center', 'text-white', 'p-1', 'flex', 'w-[95%]');
    header_div.textContent = `${data.name.toUpperCase()}`;

    let close_button_url = '/static/img/ux/close.svg';

    let header_close_button = document.createElement("img");
    header_close_button.src = close_button_url;
    header_close_button.title = `${data.actions.close}`;
    header_close_button.classList.add('inline-block', 'w-[5%]', 'h-[5%]', 'flex', 'justify-end', 'align-top', 'cursor-pointer', 'hover:animate-pulse');

    let footer_close_button = document.createElement("div");
    footer_close_button.textContent = `${data.actions.close}`;
    footer_close_button.classList.add('inline-block', 'cursor-pointer', 'hover:animate-pulse', 'p-2', 'text-white', 'text-xs', 'font-bold', 'font-shadow');
    
    header_close_button.setAttribute('onclick', "open_close_modal('" + e.id + "')");
    footer_close_button.setAttribute('onclick', "open_close_modal('" + e.id + "')");

    body_container_div.classList.add('items-center', 'md:p-5', 'p-2');

    let item_img = document.createElement('img');
    item_img.src = `/static/img/foreground/${data.animation.dir}/${data.animation.img}/0.gif`;
    item_img.style.width = "30%";
    item_img.style.height = "30%";
    item_img.style.margin = "0 auto";

    let item_content_div = document.createElement('div');
    item_content_div.classList.add('flex', 'flex-col');

    let item_description_p = document.createElement('p');

    let item_action_container = document.createElement("div");
    item_action_container.classList.add('mt-2');
    item_action_container.id = "item-action-container";

    let item_action_container_label = document.createElement("label");
    item_action_container_label.htmlFor = "item-action-container";
    item_action_container_label.textContent = `${data.actions.action_label}: `;
    item_action_container_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-justify', 'text-base');

    let item_action_container_div = document.createElement('figure');
    item_action_container_div.classList.add('inline-flex', 'items-center', 'justify-center', 'flex-wrap', 'gap-3');
    item_action_container_div.setAttribute('role', 'group');

    body_container_div.append(item_img);

    if (data.type !== "planet" && data.type !== "warpzone") {
        let item_resource_label = document.createElement('label');
        item_resource_label.htmlFor = "resources";
        item_resource_label.textContent = `${data.resources.translated_text_resource} :`
        item_resource_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-justify', 'text-xs', 'mt-2', 'p-2', 'lg:p-1')

        let item_resource_content = document.createElement('div');
        item_resource_content.classList.add('flex', 'flex-col');
        item_resource_content.id = "ressource-content";

        let item_resource_content_span = document.createElement('span');
        item_resource_content_span.classList.add('flex', 'flex-row');

        let item_resource_content_p_resource = document.createElement('p');
        item_resource_content_p_resource.classList.add('text-white', 'font-shadow', 'text-justify', 'text-xs', 'p-2', 'lg:p-1');
        item_resource_content_p_resource.id = "resource-name";
        item_resource_content_p_resource.textContent = `${data.resources.name}`;
        item_resource_content_p_resource.classList.add('hidden');


        let item_resource_content_p_quantity = document.createElement('p');
        item_resource_content_p_quantity.classList.add('font-bold', 'font-shadow', 'text-justify', 'text-xs', 'p-2', 'lg:p-1');
        if (data.resources.quantity == "empty") {
            item_resource_content_p_quantity.classList.add('text-red-600', 'animate-pulse', 'font-shadow');
        } else {
            item_resource_content_p_quantity.classList.add('text-white', 'font-shadow');
        }
        item_resource_content_p_quantity.id = "resource-quantity";
        item_resource_content_p_quantity.textContent = `${data.resources.translated_quantity_str.toUpperCase()}`
        item_resource_content_p_quantity.classList.add('hidden');

        item_description_p.classList.add('text-white', 'font-shadow', 'text-center', 'italic', 'my-1', 'py-1', 'text-xs');
        item_description_p.textContent = data.description;

        let item_resource_content_p_scan_msg = document.createElement('p');
        item_resource_content_p_scan_msg.classList.add('font-bold', 'font-shadow', 'text-white', 'text-justify', 'text-base');
        item_resource_content_p_scan_msg.id = "resource-scan-msg";
        item_resource_content_p_scan_msg.textContent = `${data.resources.translated_scan_msg_str}`;

        let item_action_container_img_scan_container = document.createElement('div');
        item_action_container_img_scan_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]');

        let item_action_container_img_gather_container = document.createElement('div');
        item_action_container_img_gather_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]');

        let item_action_container_img_scan = document.createElement('img');
        item_action_container_img_scan.src = '/static/img/ux/scan_resource_icon.svg';
        item_action_container_img_scan.classList.add('cursor-pointer', 'flex', 'justify-center');

        let item_action_container_img_scan_figcaption = document.createElement('figcaption');
        item_action_container_img_scan_figcaption.textContent = "Scan";
        item_action_container_img_scan_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'font-shadow', 'text-xs');

        let item_action_container_img_scan_figcaption_ap = document.createElement('figcaption');
        item_action_container_img_scan_figcaption_ap.textContent = "0 AP";
        item_action_container_img_scan_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'font-shadow', 'text-xs');

        let item_action_container_img_gather = document.createElement('img');
        item_action_container_img_gather.src = '/static/img/ux/gather_icon.svg';
        item_action_container_img_gather.classList.add('cursor-pointer', 'flex', 'justify-center', 'hover:animate-pulse');

        let item_action_container_img_gather_figcaption = document.createElement('figcaption');
        item_action_container_img_gather_figcaption.textContent = "Gather";
        item_action_container_img_gather_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'font-shadow');

        let item_action_container_img_gather_figcaption_ap = document.createElement('figcaption');
        item_action_container_img_gather_figcaption_ap.textContent = "1 AP";
        item_action_container_img_gather_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'font-shadow');

        item_resource_content_span.append(item_resource_content_p_resource);
        item_resource_content_span.append(item_resource_content_p_quantity);
        item_resource_content_span.append(item_resource_content_p_scan_msg);
        item_resource_content.append(item_resource_content_span);

        item_action_container_img_scan_container.append(item_action_container_img_scan);
        item_action_container_img_scan_container.append(item_action_container_img_scan_figcaption);
        item_action_container_img_scan_container.append(item_action_container_img_scan_figcaption_ap);

        item_action_container_img_gather_container.append(item_action_container_img_gather);
        item_action_container_img_gather_container.append(item_action_container_img_gather_figcaption);
        item_action_container_img_gather_container.append(item_action_container_img_gather_figcaption_ap);

        item_action_container_div.append(item_action_container_img_scan_container);
        item_action_container_div.append(item_action_container_img_gather_container);

        item_content_div.append(item_resource_label);
        item_content_div.append(item_resource_content);

        item_action_container.append(item_action_container_div);
        
    } else if(data.type == "warpzone"){

        let modal_name = e.id; 
        item_description_p.classList.add('text-white', 'font-shadow', 'text-center', 'italic', 'text-xs', 'my-1', 'py-1');
        item_description_p.innerHTML = `${data.description}`;

        let item_action_container_warpzone_container = document.createElement('div');
        item_action_container_warpzone_container.classList.add('flex', 'mt-2');

        let item_action_container_warpzone_ul = document.createElement('ul');
        item_action_container_warpzone_ul.className ='flex w-full gap-3 text-white flex-col text-xs';

        for(let i = 0; i < data.destinations.length; i++){
            let item_action_container_warpzone_ul_item = document.createElement('li');
            item_action_container_warpzone_ul_item.classList.add('hover:font-bold')
            item_action_container_warpzone_ul_item.textContent = `Travel to ${data.destinations[i].destination_name.replaceAll('-',' ').replaceAll('_', ' ')} (0 AP)`;
            item_action_container_warpzone_ul_item.addEventListener(action_listener_touch_click, function(){
                if (typeof handleWarpTravel === 'function' && typeof currentPlayer !== 'undefined') {
                    open_close_modal(e.id);
                    handleWarpTravel(data.destinations[i].warp_link_id);
                }
            }, { passive: true });
            item_action_container_warpzone_ul.append(item_action_container_warpzone_ul_item)
        }

        item_action_container_warpzone_container.classList.add('cursor-pointer', 'flex', 'justify-center');

        item_action_container_warpzone_container.append(item_action_container_warpzone_ul);

        item_action_container_div.append(item_action_container_warpzone_container);

        item_action_container.append(item_action_container_div);

    } else {
        if (data.faction.starter) {
            let item_faction_p = document.createElement('p');
            item_faction_p.htmlFor = "faction";
            item_faction_p.textContent = `${data.faction.translated_str} ${data.faction.name}`;
            item_faction_p.classList.add('text-white', 'font-shadow', 'text-justify', 'italic', 'text-xs', 'my-1', 'py-1')

            let item_faction_content = document.createElement('div');
            item_faction_content.classList.add('flex', 'flex-row');

            item_content_div.append(item_faction_p);
            item_content_div.append(item_faction_content);
        }

        let item_action_container_img_setNewStartLoc_container = document.createElement('div');
        item_action_container_img_setNewStartLoc_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

        let item_action_container_img_joinFaction_container = document.createElement('div');
        item_action_container_img_joinFaction_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

        let item_action_container_img_opendock_container = document.createElement('div');
        item_action_container_img_opendock_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

        let item_action_container_img_openmarket_container = document.createElement('div');
        item_action_container_img_openmarket_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

        let item_action_container_img_gettask_container = document.createElement('div');
        item_action_container_img_gettask_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

        let item_action_container_img_invade_container = document.createElement('div');
        item_action_container_img_invade_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

        let item_action_container_setNewStartLoc_img = document.createElement('img');
        item_action_container_setNewStartLoc_img.src = '/static/img/ux/new_location.svg';
        item_action_container_setNewStartLoc_img.classList.add('cursor-pointer', 'flex', 'justify-center');

        let item_action_container_img_setNewStartLoc_figcaption = document.createElement('figcaption');
        item_action_container_img_setNewStartLoc_figcaption.textContent = "New Home";
        item_action_container_img_setNewStartLoc_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

        let item_action_container_joinFaction_img = document.createElement('img');
        item_action_container_joinFaction_img.src = '/static/img/ux/join_faction.svg';
        item_action_container_joinFaction_img.classList.add('cursor-pointer', 'flex', 'justify-center');

        let item_action_container_img_joinFaction_figcaption = document.createElement('figcaption');
        item_action_container_img_joinFaction_figcaption.textContent = `Join ${data.faction.name}`;
        item_action_container_img_joinFaction_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

        let item_action_container_opendock_img = document.createElement('img');
        item_action_container_opendock_img.src = '/static/img/ux/dock.svg';
        item_action_container_opendock_img.classList.add('cursor-pointer', 'flex', 'justify-center');

        let item_action_container_img_opendock_figcaption = document.createElement('figcaption');
        item_action_container_img_opendock_figcaption.textContent = "dock";
        item_action_container_img_opendock_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

        let item_action_container_openmarket_img = document.createElement('img');
        item_action_container_openmarket_img.src = '/static/img/ux/market.svg';
        item_action_container_openmarket_img.classList.add('cursor-pointer', 'flex', 'justify-center');

        let item_action_container_img_openmarket_figcaption = document.createElement('figcaption');
        item_action_container_img_openmarket_figcaption.textContent = "market";
        item_action_container_img_openmarket_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

        let item_action_container_gettask_img = document.createElement('img');
        item_action_container_gettask_img.src = '/static/img/ux/task.svg';
        item_action_container_gettask_img.classList.add('cursor-pointer', 'flex', 'justify-center');

        let item_action_container_img_gettask_figcaption = document.createElement('figcaption');
        item_action_container_img_gettask_figcaption.textContent = "task";
        item_action_container_img_gettask_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

        let item_action_container_invade_img = document.createElement('img');
        item_action_container_invade_img.src = '/static/img/ux/invade.svg';
        item_action_container_invade_img.classList.add('cursor-pointer', 'flex', 'justify-center');

        let item_action_container_img_invade_figcaption = document.createElement('figcaption');
        item_action_container_img_invade_figcaption.textContent = "invade";
        item_action_container_img_invade_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');
        if (data.actions.player_in_same_faction == true) {
            item_action_container_img_setNewStartLoc_container.append(item_action_container_setNewStartLoc_img);
            item_action_container_img_setNewStartLoc_container.append(item_action_container_img_setNewStartLoc_figcaption);
            item_action_container_div.append(item_action_container_img_setNewStartLoc_container);
        } else {
            item_action_container_img_joinFaction_container.append(item_action_container_joinFaction_img);
            item_action_container_img_joinFaction_container.append(item_action_container_img_joinFaction_figcaption);
            item_action_container_img_invade_container.append(item_action_container_invade_img);
            item_action_container_img_invade_container.append(item_action_container_img_invade_figcaption);
            item_action_container_div.append(item_action_container_img_joinFaction_container);
            item_action_container_div.append(item_action_container_img_invade_container);
        }
        item_action_container_img_opendock_container.append(item_action_container_opendock_img);
        item_action_container_img_opendock_container.append(item_action_container_img_opendock_figcaption);
        item_action_container_img_openmarket_container.append(item_action_container_openmarket_img);
        item_action_container_img_openmarket_container.append(item_action_container_img_openmarket_figcaption);
        item_action_container_img_gettask_container.append(item_action_container_gettask_img);
        item_action_container_img_gettask_container.append(item_action_container_img_gettask_figcaption);

        item_action_container_div.append(item_action_container_img_opendock_container);
        item_action_container_div.append(item_action_container_img_openmarket_container);
        item_action_container_div.append(item_action_container_img_gettask_container);

        item_action_container.append(item_action_container_div);
    }

    footer_container_div.append(footer_close_button);

    body_container_div.append(item_content_div);
    body_container_div.append(item_description_p);

    body_container_div.append(item_action_container_label);
    body_container_div.append(item_action_container);

    header_container_div.append(header_div);
    header_container_div.append(header_close_button);
    content_div.append(header_container_div);
    content_div.append(body_container_div);
    content_div.append(footer_container_div);
    container_div.append(content_div);
    e.append(container_div);

    return e;
}

function createActionButton(iconElement, label, onClick) {
    const btn = document.createElement("div");
    btn.classList.add("action-button-sf");

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

function buildActionsSection(modalId, data, is_npc) {

    const modules = currentPlayer.ship.modules;

    // Conteneur global
    const grid = document.createElement("div");
    grid.classList.add("action-grid-sf");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr))";
    grid.style.gap = "0.75rem";

    // ZONE CONTEXTUELLE
    const contextZone = document.getElementById(modalId + "-action-context");

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
                    "border-emerald-400/40"
                );

                // description
                const left = document.createElement("div");
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
                rightBtn.classList.add("action-button-sf");
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

    grid.append(attackButton);

    // ---------------------------
    // ACTION : SCAN
    // ---------------------------
    const scanIcon = document.createElement("img");
    scanIcon.src = "/static/img/ux/scan_resource_icon.svg";

    const scanButton = createActionButton(
        scanIcon,
        "Scan",
        () => {
            if (!hasProbe) return showMissingModuleError();

            contextZone.innerHTML = "Scan disponible (à implémenter)";
            contextZone.classList.remove("hidden");
        }
    );

    grid.append(scanButton);

    // ---------------------------
    // ACTION : E-WAR
    // ---------------------------
    const ewarIcon = document.createElement("span");
    ewarIcon.classList.add("iconify", "game-icons--computing");

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
    tradeIcon.classList.add("iconify", "game-icons--trade");

    const tradeButton = createActionButton(
        tradeIcon,
        "Commerce",
        () => {
            contextZone.innerHTML = "Commerce (à implémenter)";
            contextZone.classList.remove("hidden");
        }
    );

    grid.append(tradeButton);

    return grid;
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
    header_container_div.classList.add('md:p-5','p-1','flex','flex-row');

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
    body_container_div.classList.add('items-center','md:p-5','p-1');

    // Placeholder generic image
    let unknown_img = document.createElement('img');
    unknown_img.src = "/static/img/ux/unknown_target_icon.svg";
    unknown_img.alt = "unknown-target";
    unknown_img.classList.add('mx-auto','object-center','h-[80px]','w-[80px]','pt-1','rounded-full');
    body_container_div.append(unknown_img);

    // Scan required message
    let msg = document.createElement('p');
    msg.classList.add('text-white','font-shadow','text-center','italic','my-1','py-1','text-xs');
    msg.textContent = "Scan required to identify this target";
    body_container_div.append(msg);

    // ACTIONS SECTION
    let action_label = document.createElement("label");
    action_label.classList.add('font-bold','text-white','font-shadow','text-justify','text-base','mt-5');
    action_label.textContent = `${data.actions.action_label.toUpperCase()}: `;
    body_container_div.append(action_label);

    let actions_div = document.createElement('figure');
    actions_div.classList.add('flex','items-center','justify-center','flex-wrap','gap-8');
    actions_div.setAttribute('role','group');

    // Attack button
    let attack_cont = document.createElement('div');
    attack_cont.classList.add('inline-block','items-center','justify-center','w-[15%]','h-[15%]','hover:animate-pulse');

    let attack_img = document.createElement('img');
    attack_img.src = '/static/img/ux/target_icon.svg';
    attack_img.classList.add('cursor-pointer','flex','justify-center');
    let attack_cap = document.createElement('figcaption');
    attack_cap.textContent = "Attack";
    attack_cap.classList.add('text-white','font-shadow','font-bold','text-xs');

    let attack_ap = document.createElement('figcaption');
    attack_ap.textContent = "1 AP";
    attack_ap.classList.add('text-white','font-shadow','font-bold','text-xs');

    attack_cont.append(attack_img, attack_cap, attack_ap);
    actions_div.append(attack_cont);

    // Scan button
    let scan_cont = document.createElement('div');
    scan_cont.classList.add('inline-block','items-center','justify-center','w-[15%]','h-[15%]','hover:animate-pulse');

    let scan_img = document.createElement('img');
    scan_img.src = '/static/img/ux/scan_resource_icon.svg';
    scan_img.classList.add('cursor-pointer','flex','justify-center');

    let scan_cap = document.createElement('figcaption');
    scan_cap.textContent = "Scan";
    scan_cap.classList.add('text-white','font-shadow','font-bold','text-xs');

    let scan_ap = document.createElement('figcaption');
    scan_ap.textContent = "0 AP";
    scan_ap.classList.add('text-white','font-shadow','font-bold','text-xs');

    scan_cont.append(scan_img, scan_cap, scan_ap);
    actions_div.append(scan_cont);

    body_container_div.append(actions_div);

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

    // Populate modules from currentPlayer.ship.modules
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
    footer_div.classList.add('md:p-5','p-1','flex','flex-row','w-[100%]','justify-end','align-center');

    let footer_close = document.createElement("img");
    footer_close.src = "/static/img/ux/close.svg";
    footer_close.classList.add('inline-block','w-[5%]','h-[5%]','cursor-pointer','hover:animate-pulse');
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
    modal.header.setTitle(data.player?.name?.toUpperCase() || data.name?.toUpperCase());
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
    modal.body.addSection(statsSection.ship_statistics_container_label);
    modal.body.addSection(statsSection.ship_statistics_warning_msg_container_p);
    modal.body.addSection(statsSection.ship_detailed_statistics_container_div);

    //
    // 3 — MODULES LABEL
    //
    const modulesLabel = document.createElement("label");
    modulesLabel.textContent = "MODULES:";
    modulesLabel.classList.add("w-full", "font-bold", "font-shadow", "text-white", "text-base", "mt-4");
    modal.body.addSection(modulesLabel);

    //
    // 4 — MODULES SECTION (weaponry / ewar / defensive / utility / probe)
    //
    const modulesSection = buildModulesSection(modalId, data);
    modal.body.addSection(modulesSection);

    //
    // 5 — ACTIONS LABEL
    //
    const actionsLabel = document.createElement("label");
    actionsLabel.textContent = data.actions.action_label.toUpperCase() + ":";
    actionsLabel.classList.add("w-full", "font-bold", "font-shadow", "text-white", "text-base", "mt-4");
    modal.body.addSection(actionsLabel);

    //
    // 7 — ACTIONS SECTION
    //

    // zone d’erreur
    const errorZone = document.createElement("div");
    errorZone.classList.add("action-error-msg", "hidden");
    errorZone.id = modalId + "-action-error-zone";
    modal.body.addSection(errorZone);

    const actionsSection = buildActionsSection(modalId, data, is_npc);
    modal.body.addSection(actionsSection);

    //
    // 8 — ACTION CONTEXT ZONE (hidden)
    //
    const contextZone = document.createElement("div");
    contextZone.id = modalId + "-action-context";
    contextZone.classList.add("hidden", "w-full", "mt-3");
    modal.body.addSection(contextZone);

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
        'w-full',
        'font-bold',
        'font-shadow',
        'text-white',
        'text-justify',
        'text-base',
        'mt-2',
    );

    // --- START DETAILED STATS (inchangé) ---
    let ship_detailed_statistics_container_div = document.createElement('div');
    ship_detailed_statistics_container_div.id = "ship-statistics-detailed";
    ship_detailed_statistics_container_div.classList.add('w-full', 'p-2')

    // HP barre détaillée
    let hp_progress_bar_container_div = document.createElement('div');
    let hp_progress_bar_container_content = document.createElement('div');
    let hp_progress_bar_container_text = document.createElement('span');
    let hp_progress_bar_container_label = document.createElement('label');
    let hp_percent = `${Math.round((data.ship.current_hp * 100) / (data.ship.max_hp))}%`;

    hp_progress_bar_container_div.classList.add('bg-red-600', 'relative', 'mx-auto', 'border-emerald-400');
    hp_progress_bar_container_label.textContent = "Hull points:";
    hp_progress_bar_container_label.classList.add(
        'font-bold',
        'font-shadow',
        'text-white',
        'items-center', 
        'justify-between', 
        'w-full'
    );
    hp_progress_bar_container_content.classList.add('bg-blue-600', 'border-emerald-400', 'border-1', 'leading-none', 'h-[15px]');
    hp_progress_bar_container_text.classList.add(
        'w-full',
        'absolute',
        'z-10',
        'text-center',
        'text-xs',
        'font-bold',
        'font-shadow',
        'text-blue-100',
        'text-center'
    );
    hp_progress_bar_container_text.textContent = `${data.ship.current_hp} / ${data.ship.max_hp}`;
    hp_progress_bar_container_content.style.width =
        parseInt(hp_percent.split('%')) > 100 ? "100%" : hp_percent;

    hp_progress_bar_container_div.append(hp_progress_bar_container_text);
    hp_progress_bar_container_div.append(hp_progress_bar_container_content);

    // Movement barre détaillée
    let movement_progress_bar_container_div = document.createElement('div');
    let movement_progress_bar_container_content = document.createElement('div');
    let movement_progress_bar_container_text = document.createElement('span');
    let movement_progress_bar_container_label = document.createElement('label');
    let move_percent = `${Math.round((data.ship.current_movement * 100) / (data.ship.max_movement))}%`;

    movement_progress_bar_container_div.classList.add('w-full', 'bg-red-600', 'relative');
    movement_progress_bar_container_div.id = "movement-container-detailed";
    movement_progress_bar_container_label.textContent = "Movement left:";
    movement_progress_bar_container_label.classList.add(
        'font-bold',
        'font-shadow',
        'text-white',
        'items-center', 
        'justify-between', 
        'w-full'
    );
    movement_progress_bar_container_content.classList.add('bg-blue-600', 'leading-none', 'h-[15px]');
    movement_progress_bar_container_text.classList.add(
        'w-full',
        'absolute',
        'z-10',
        'text-center',
        'text-xs',
        'font-bold',
        'text-blue-100',
        'font-shadow',
        'text-center'
    );
    movement_progress_bar_container_text.textContent =
        `${data.ship.current_movement} / ${data.ship.max_movement}`;
    movement_progress_bar_container_text.id = "movement-container-detailed-progress-bar-text";
    movement_progress_bar_container_content.id = "movement-container-detailed-progress-bar-content";
    movement_progress_bar_container_content.style.width =
        parseInt(move_percent.split('%')) > 100 ? "100%" : move_percent;

    movement_progress_bar_container_div.append(movement_progress_bar_container_text);
    movement_progress_bar_container_div.append(movement_progress_bar_container_content);

    ship_detailed_statistics_container_div.append(hp_progress_bar_container_label);
    ship_detailed_statistics_container_div.append(hp_progress_bar_container_div);
    ship_detailed_statistics_container_div.append(movement_progress_bar_container_label);
    ship_detailed_statistics_container_div.append(movement_progress_bar_container_div);
    // --- END DETAILED STATS ---

    // WARNING MSG (inchangé)
    let ship_statistics_warning_msg_container_p = document.createElement('p');
    ship_statistics_warning_msg_container_p.classList.add(
        'text-justify',
        'font-shadow',
        'text-xs',
        'lg:p-1',
        'text-red-600',
        'animate-pulse',
        'font-bold',
        'font-shadow'
    );
    ship_statistics_warning_msg_container_p.id = "statistics-warning-msg";
    ship_statistics_warning_msg_container_p.textContent = `${data.actions.translated_statistics_str} `;

    return {
        ship_statistics_container_label,
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
            )
            module_list[i].classList.add(
                'border-gray-800',
                'bg-slate-300',
                'text-gray-800',
                'divide-gray-800',
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
    footer_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row', 'w-[100%]',  'justify-end', 'align-center');

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

