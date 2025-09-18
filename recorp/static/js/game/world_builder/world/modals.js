function define_modal_type(modalId){

    const result = {
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

        const match = remaining.match(/^(pc|npc)_(\d+)$/);  
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
        const element = map_informations.sector_element.filter(el => el.data.name === data.elementName);
        return {
            found: element.length > 0,
            type: element[0]?.data?.type,
            data: element[0],
            searchInfo: data
        };
    } else {
        // Recherche PC ou NPC
        const searchArray = map_informations[data.type] || [];
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

function createNpcModalData(npcData) {
    return {
        player: {
            name: npcData.npc.displayed_name,
            image: npcData.npc.image,
            faction_name: npcData.faction.name
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
            faction_name: playerData.faction.name
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
    const sizeData = foregroundData.data.data.size || { x: 1, y: 1 };
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
    console.log(elementInfo)
    const baseModalData = {
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
            return {
                ...baseModalData,
                home_sector: sectorData.data.warp_home_id,
                destination: {
                    id: sectorData.data.destination_id,
                    name: sectorData.data.destination_name
                        .replaceAll('-', ' ')
                        .replaceAll('_', ' ')
                }
            };

        case "star":
        case "asteroid":
            console.log(sectorData)
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
    const element_type = extractDataFromId.type;
    let modal = "";
    let modalData = "";

    switch(element_type){
        case "pc":
            if(extractDataFromId.isUnknown == true){
                modalData = createPlayerModalData(extractedDataForModal.data)
                modal = createUnknownPcModal(modalId, modalData, false);
            }else{
                modalData = createPlayerModalData(extractedDataForModal.data)
                modal = create_pc_npc_modal(modalId, modalData, false);
            }
            break;
        case "npc":
            if(extractDataFromId.isUnknown == true){
                modalData = createNpcModalData(extractedDataForModal.data)
                modal = createUnknownNpcModal(modalId, modalData, true);
            }else{
                modalData = createNpcModalData(extractedDataForModal.data)
                modal = create_pc_npc_modal(modalId, modalData, true);
            }
            break;
        default:
            let foregroundData = extractForegroundModalData(extractedDataForModal)
            console.log(foregroundData)
            modalData = createForegroundModalData(foregroundData, extractedDataForModal.data)
            console.log(modalData)
            modal = create_foreground_modal(modalId, modalData)
            break;
    }

    document.querySelector("#modal-container").append(modal);

}

function create_foreground_modal(id, data) {
    console.log(data)
    let e = document.createElement('div');
    e.id = id;
    e.setAttribute('aria-hidden', true);
    e.setAttribute('tabindex', -1);
    e.classList.add(
        'hidden',
        'overflow-hidden',
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
        'backdrop-blur-sm',
        'backdrop-brightness-50',
        'border-1',
    );

    let container_div = document.createElement('div');
    container_div.classList.add("fixed", "md:p-3", "top-0", "right-0", "left-0", "z-50", "w-full", "md:inset-0", "h-[100vh]");

    let content_div = document.createElement('div');
    content_div.classList.add('relative', 'rounded-lg', 'shadow', 'w-full', 'lg:w-1/4', 'rounded-t', 'flex', 'justify-center', 'mx-auto', 'flex-col', 'border-2', 'border-slate-600', 'bg-gradient-to-b', 'from-amber-600/70', 'to-black/70');

    let header_container_div = document.createElement('div');
    header_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row');

    let footer_container_div = document.createElement('div');
    footer_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row', 'w-[100%]',  'justify-end', 'align-right');

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

    let body_container_div = document.createElement('div');
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

        item_description_p.classList.add('text-white', 'font-shadow', 'text-center', 'italic', 'text-xs', 'my-1', 'py-1');
        item_description_p.innerHTML = `${data.description} <b>${data.destination.name}</b>`;

        let item_action_container_img_warpzone_container = document.createElement('div');
        item_action_container_img_warpzone_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]');

        let item_action_container_img_warpzone = document.createElement('img');
        item_action_container_img_warpzone.src = '/static/img/ux/warpzone_icon_v2.svg';
        let modal_name = e.id; 

        /*
            item_action_container_img_warpzone.addEventListener(action_listener_touch_click, function(){
                async_travel(data.home_sector, currentPlayer.user.player, id);
            });
        */

        item_action_container_img_warpzone.addEventListener('click', function(){
            if (typeof async_travel === 'function' && typeof currentPlayer !== 'undefined') {
                async_travel(data.home_sector, currentPlayer.user.player, id);
            }
        }, { passive: true });

        item_action_container_img_warpzone.classList.add('cursor-pointer', 'flex', 'justify-center');

        let item_action_container_img_warpzone_figcaption = document.createElement('figcaption');
        item_action_container_img_warpzone_figcaption.textContent = "Travel";
        item_action_container_img_warpzone_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'font-shadow', 'text-xs');

        let item_action_container_img_warpzone_figcaption_ap = document.createElement('figcaption');
        item_action_container_img_warpzone_figcaption_ap.textContent = "0 AP";
        item_action_container_img_warpzone_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'font-shadow', 'text-xs');

        item_action_container_img_warpzone_container.append(item_action_container_img_warpzone);
        item_action_container_img_warpzone_container.append(item_action_container_img_warpzone_figcaption);
        item_action_container_img_warpzone_container.append(item_action_container_img_warpzone_figcaption_ap);

        item_action_container_div.append(item_action_container_img_warpzone_container);

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

function createUnknownModal(modalId, data, is_npc){
    let e = document.createElement('div');
    e.id = modalId;
    e.setAttribute('aria-hidden', true);
    e.setAttribute('tabindex', -1);
    e.classList.add(
        'hidden',
        'overflow-hidden',
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
        'backdrop-blur-sm',
        'bg-black/20',
        'border-1',
    );
    let player_id = modalId.split('_')[1];

    let container_div = document.createElement('div');
    container_div.classList.add("fixed", "md:p-3", "top-0", "right-0", "left-0", "z-50", "w-full", "md:inset-0", "h-[100vh]", "bg-black/70", "gap-2");

    let content_div = document.createElement('div');
    content_div.classList.add('relative', 'rounded-lg', 'shadow', 'w-full', 'lg:w-1/4'  , 'rounded-t', 'flex', 'justify-center', 'mx-auto', 'flex-col', 'border-2', 'border-slate-600', 'gap-2');

    let header_container_div = document.createElement('div');
    header_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row');

    let header_div = document.createElement('h3');
    header_div.classList.add('lg:text-xl', 'text-md', 'text-center', 'font-shadow', 'font-bold', 'rounded-t', 'p-1', 'flex', 'w-[95%]', 'justify-center', 'text-white');

    header_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row');

    let footer_container_div = document.createElement('div');
    footer_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row', 'w-[100%]',  'justify-end', 'align-right');

    let footer_close_button = document.createElement("div");
    footer_close_button.textContent = `${data.actions.close}`;
    footer_close_button.classList.add('inline-block', 'flex', 'cursor-pointer', 'hover:animate-pulse', 'p-5', 'text-white', 'text-xs', 'font-bold', 'font-shadow');
    

    let close_button_url = '/static/img/ux/close.svg';

    let header_close_button = document.createElement("img");
    header_close_button.src = close_button_url;
    header_close_button.title = ``;
    header_close_button.classList.add('inline-block', 'w-[5%]', 'h-[5%]', 'flex', 'justify-end', 'align-top', 'cursor-pointer', 'hover:animate-pulse');
    
    header_close_button.setAttribute('onclick', "open_close_modal('" + e.id + "')");
    footer_close_button.setAttribute('onclick', "open_close_modal('" + e.id + "')");

    let body_container_div = document.createElement('div');
    body_container_div.classList.add('items-center', 'md:p-5', 'p-1');

    let ship_statistics_container_label = document.createElement("label");
    ship_statistics_container_label.textContent = `${data.actions.translated_statistics_label.toUpperCase()}: `;
    ship_statistics_container_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-justify', 'text-base', 'mt-2');

    // START SIMPLE STATS
    let ship_statistics_container_div = document.createElement('div');
    ship_statistics_container_div.id = "ship-statistics";

    let hp = color_per_percent(data.ship.current_hp, data.ship.max_hp);
    let movement = color_per_percent(data.ship.current_movement, data.ship.max_movement);

    let hp_container = document.createElement('div');
    let hp_container_text = document.createElement('p');
    let hp_container_label = document.createElement('label');

    let movement_container = document.createElement('div');
    let movement_container_text = document.createElement('p');
    let movement_container_label = document.createElement('label');

    hp_container.classList.add('font-bold', 'font-shadow', 'text-xs', 'flex', 'flex-row', 'gap-1', 'p-1');
    hp_container_label.classList.add('text-xs', 'font-bold');
    hp_container_text.classList.add('text-xs');
    hp_container_label.textContent = "Hull points:";
    hp_container_text.textContent = `${hp.status}`
    hp_container_label.classList.add('text-white');
    hp_container_text.classList.add(hp.color);

    hp_container.append(hp_container_label);
    hp_container.append(hp_container_text);

    movement_container.classList.add('font-bold', 'font-shadow', 'text-xs', 'flex', 'flex-row', 'gap-1', 'p-1');
    movement_container.id = "movement-container";
    movement_container_label.classList.add('text-xs', 'font-bold');
    movement_container_text.classList.add('text-xs', movement.color, 'font-shadow');
    movement_container_label.textContent = "Movement points:";
    movement_container_text.textContent = `${movement.status}`;
    movement_container_label.classList.add('text-white');

    movement_container.append(movement_container_label);
    movement_container.append(movement_container_text);

    ship_statistics_container_div.append(hp_container);
    ship_statistics_container_div.append(movement_container);

    // END SIMPLE STATS

    // START DETAILED STATS
    let ship_detailed_statistics_container_div = document.createElement('div');
    ship_detailed_statistics_container_div.id = "ship-statistics-detailed";

    let hp_progress_bar_container_div = document.createElement('div');
    let hp_progress_bar_container_content = document.createElement('div');
    let hp_progress_bar_container_text = document.createElement('span');
    let hp_progress_bar_container_label = document.createElement('label');
    let hp_percent = `${Math.round((data.ship.current_hp * 100) / (data.ship.max_hp))}%`;
    hp_progress_bar_container_div.classList.add('w-full', 'bg-red-600', 'relative');
    hp_progress_bar_container_label.textContent = "Hull points:"
    hp_progress_bar_container_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'mt-2');
    hp_progress_bar_container_content.classList.add('bg-blue-600', 'leading-none', 'h-[15px]');
    hp_progress_bar_container_text.classList.add('w-full', 'absolute', 'z-10', 'text-center', 'text-xs', 'font-bold', 'font-shadow', 'text-blue-100', 'text-center');
    hp_progress_bar_container_text.textContent = `${data.ship.current_hp} / ${data.ship.max_hp}`;
    hp_progress_bar_container_content.style.width = hp_percent;

    hp_progress_bar_container_div.append(hp_progress_bar_container_text);
    hp_progress_bar_container_div.append(hp_progress_bar_container_content);

    let movement_progress_bar_container_div = document.createElement('div');
    let movement_progress_bar_container_content = document.createElement('div');
    let movement_progress_bar_container_text = document.createElement('span');
    let movement_progress_bar_container_label = document.createElement('label');
    let move_percent = `${Math.round((data.ship.current_movement * 100) / (data.ship.max_movement))}%`;

    movement_progress_bar_container_div.classList.add('w-full', 'bg-red-600', 'relative');
    movement_progress_bar_container_div.id = "movement-container-detailed";
    movement_progress_bar_container_label.textContent = "Movement left:"
    movement_progress_bar_container_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'mt-2');
    movement_progress_bar_container_content.classList.add('bg-blue-600', 'leading-none', 'h-[15px]');
    movement_progress_bar_container_text.classList.add('w-full', 'absolute', 'z-10', 'text-center', 'text-xs', 'font-bold', 'text-blue-100', 'font-shadow', 'text-center');
    movement_progress_bar_container_text.textContent = `${data.ship.current_movement} / ${data.ship.max_movement}`;
    movement_progress_bar_container_content.style.width = move_percent;

    movement_progress_bar_container_div.append(movement_progress_bar_container_text);
    movement_progress_bar_container_div.append(movement_progress_bar_container_content);

    ship_detailed_statistics_container_div.append(hp_progress_bar_container_label);
    ship_detailed_statistics_container_div.append(hp_progress_bar_container_div);
    ship_detailed_statistics_container_div.append(movement_progress_bar_container_label);
    ship_detailed_statistics_container_div.append(movement_progress_bar_container_div);
    // END DETAILED STATS

    let ship_statistics_warning_msg_container_p = document.createElement('p');
    ship_statistics_warning_msg_container_p.classList.add('text-justify', 'font-shadow', 'text-xs', 'lg:p-1', 'text-red-600', 'animate-pulse', 'font-bold', 'font-shadow');
    ship_statistics_warning_msg_container_p.id = "statistics-warning-msg";
    ship_statistics_warning_msg_container_p.textContent = `${data.actions.translated_statistics_str} `;

    let ship_action_container = document.createElement("div");
    ship_action_container.classList.add('mt-3');
    ship_action_container.id = "item-action-container";

    let ship_action_container_label = document.createElement("label");
    ship_action_container_label.classList.add('font-bold', 'text-white', 'font-shadow', 'text-justify', 'text-base', 'font-shadow', 'mt-5');
    ship_action_container_label.htmlFor = "item-action-container";
    ship_action_container_label.textContent = `${data.actions.action_label.toUpperCase()}: `;

    let ship_action_container_div = document.createElement('figure');
    ship_action_container_div.classList.add('flex', 'items-center', 'justify-center', 'flex-wrap', 'gap-8');
    ship_action_container_div.setAttribute('role', 'group');

    let item_action_container_img_attack_container = document.createElement('div');
    item_action_container_img_attack_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');
    item_action_container_img_attack_container.addEventListener('click', function() {
        let element = document.querySelector('#' + e.id);
        let ship_attack_modules = element.querySelector('#accordion-collapse');
        ship_attack_modules.classList.remove('hidden');
    })

    let item_action_container_img_contact_container = document.createElement('div');
    item_action_container_img_contact_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

    let item_action_container_img_repaire_container = document.createElement('div');
    item_action_container_img_repaire_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

    let item_action_container_img_attack_btn_container = document.createElement('div');
    item_action_container_img_attack_btn_container.id = "action-btn";
    item_action_container_img_attack_btn_container.classList.add('w-full', 'hidden');

    let item_action_container_img_attack = document.createElement('img');
    item_action_container_img_attack.src = '/static/img/ux/target_icon.svg';
    item_action_container_img_attack.classList.add('cursor-pointer', 'flex', 'justify-center');

    let item_action_container_img_attack_figcaption = document.createElement('figcaption');
    item_action_container_img_attack_figcaption.textContent = "Attack";
    item_action_container_img_attack_figcaption.classList.add('text-white', 'font-shadow', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_attack_figcaption_ap = document.createElement('figcaption');
    item_action_container_img_attack_figcaption_ap.textContent = "1 AP";
    item_action_container_img_attack_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_contact = document.createElement('img');
    item_action_container_img_contact.src = '/static/img/ux/contact_icon.svg';
    item_action_container_img_contact.classList.add('cursor-pointer', 'flex', 'justify-center');

    let item_action_container_img_contact_figcaption = document.createElement('figcaption');
    item_action_container_img_contact_figcaption.textContent = "Contact";
    item_action_container_img_contact_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_contact_figcaption_ap = document.createElement('figcaption');
    item_action_container_img_contact_figcaption_ap.textContent = "0 AP";
    item_action_container_img_contact_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs', 'invisible');

    let item_action_container_img_repaire = document.createElement('img');
    item_action_container_img_repaire.src = '/static/img/ux/repaire_icon.svg';
    item_action_container_img_repaire.classList.add('cursor-pointer', 'flex', 'justify-center');

    let item_action_container_img_repaire_figcaption = document.createElement('figcaption');
    item_action_container_img_repaire_figcaption.textContent = "Repaire";
    item_action_container_img_repaire_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_repaire_figcaption_ap = document.createElement('figcaption');
    item_action_container_img_repaire_figcaption_ap.textContent = "0 AP";
    item_action_container_img_repaire_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_attack_btn_img = document.createElement('img');
    item_action_container_img_attack_btn_img.src = '/static/img/ux/target_icon.svg';
    item_action_container_img_attack_btn_img.classList.add('cursor-pointer', 'flex', 'inline-block', 'mx-auto', 'object-center', 'justify-center', 'w-[15%]', 'h-[15%]');
    item_action_container_img_attack_btn_img.addEventListener('click', function() {
        check_radio_btn_and_swap_color(e.id, module_item_content.id);
    })

    item_action_container_img_attack_container.append(item_action_container_img_attack);
    item_action_container_img_attack_container.append(item_action_container_img_attack_figcaption);
    item_action_container_img_attack_container.append(item_action_container_img_attack_figcaption_ap);

    item_action_container_img_contact_container.append(item_action_container_img_contact);
    item_action_container_img_contact_container.append(item_action_container_img_contact_figcaption);
    item_action_container_img_contact_container.append(item_action_container_img_contact_figcaption_ap);

    item_action_container_img_repaire_container.append(item_action_container_img_repaire);
    item_action_container_img_repaire_container.append(item_action_container_img_repaire_figcaption);
    item_action_container_img_repaire_container.append(item_action_container_img_repaire_figcaption_ap);


    if (!is_npc) {

        let target_img = document.createElement('img');
        target_img.src = data.player.image == "img.png" ? `/static/img/ux/default-user.svg` : `/static/img/users/${player_id}/0.gif`
        target_img.style.width = "30%";
        target_img.style.height = "30%";
        target_img.style.margin = "0 auto";

        header_div.textContent = `Unknown`;
        content_div.classList.add('bg-gradient-to-b', 'from-cyan-400/70', 'to-black/70');

        body_container_div.append(target_img);
        ship_action_container_div.append(item_action_container_img_attack_container);
        ship_action_container_div.append(item_action_container_img_contact_container);
        ship_action_container_div.append(item_action_container_img_repaire_container);

    } else {

        header_div.textContent = `Unknown`;
        content_div.classList.add('bg-gradient-to-b', 'from-red-600/70', 'to-black/70');
        ship_action_container_div.append(item_action_container_img_attack_container);
    }

    for (let defense_module_i in data.ship.modules) {
        if (data.ship.modules[defense_module_i]["type"].includes('DEFENSE') && !data.ship.modules[defense_module_i]["name"].includes('hull')) {
            let defense_name = data.ship.modules[defense_module_i]["name"].split(" ")[0].toLowerCase();
            // START SIMPLE DEFENSE MODULE
            let module_status_color = color_per_percent(data.ship["current_"+defense_name+"_defense"], data.ship.modules[defense_module_i].effect.defense);
            let module_content_container = document.createElement('div')
            let module_content_label = document.createElement('label');
            let module_content_text = document.createElement('p');

            module_content_container.classList.add('font-bold', 'font-shadow', 'text-xs', 'flex', 'flex-row', 'gap-1', 'p-1');
            module_content_text.classList.add(module_status_color.color);
            module_content_label.classList.add('text-white');
            module_content_label.textContent = `${data.ship.modules[defense_module_i].effect.defense_type}:`;
            module_content_text.textContent = `${module_status_color.status}`;

            module_content_container.append(module_content_label);
            module_content_container.append(module_content_text);
            ship_statistics_container_div.append(module_content_container);
            // END SIMPLE DEFENSE MODULE
            
            // START DETAILED DEFENSE MODULE
            let defense_value_detailed = `${Math.round((data.ship["current_"+defense_name+"_defense"] * 100) / (data.ship.modules[defense_module_i].effect.defense))}%`;
            let module_element_detailed = document.createElement('div');
            let module_content_detailed_label = document.createElement("label");
            let module_content_detailed = document.createElement('div');
            let module_content_detailed_text = document.createElement('span');

            module_content_detailed_label.textContent = data.ship.modules[defense_module_i]["name"].toLowerCase();
            module_content_detailed_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'mt-2');
            module_element_detailed.classList.add('w-full', 'bg-red-600', 'relative');
            module_content_detailed.classList.add('bg-blue-600', 'leading-none', 'h-[15px]');
            module_content_detailed_text.classList.add('w-full', 'absolute', 'z-10', 'text-center', 'text-xs', 'font-bold', 'font-shadow', 'text-blue-100', 'text-center');
            module_content_detailed_text.textContent = `${data.ship["current_"+defense_name+"_defense"]} / ${data.ship.modules[defense_module_i].effect.defense}`;
            module_content_detailed.style.width = defense_value_detailed;

            module_element_detailed.append(module_content_detailed_text);
            module_element_detailed.append(module_content_detailed);
            ship_detailed_statistics_container_div.append(module_content_detailed_label);
            ship_detailed_statistics_container_div.append(module_element_detailed);
            // END DETAILED DEFENSE MODULE
        }
    }

    let ship_offensive_module_container = document.createElement('div');
    ship_offensive_module_container.classList.add('mt-5', 'hidden');
    ship_offensive_module_container.id = "accordion-collapse";

    let ship_offensive_module_container_h3_cat_1 = document.createElement('h3');
    let ship_offensive_module_container_h3_cat_2 = document.createElement('h3');
    let ship_offensive_module_container_h3_cat_1_btn = document.createElement('button');
    let ship_offensive_module_container_h3_cat_1_btn_span = document.createElement('span');
    let ship_offensive_module_container_h3_cat_1_btn_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let ship_offensive_module_container_h3_cat_1_btn_svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let ship_offensive_module_container_h3_cat_2_btn = document.createElement('button');
    let ship_offensive_module_container_h3_cat_2_btn_span = document.createElement('span');
    let ship_offensive_module_container_h3_cat_2_btn_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let ship_offensive_module_container_h3_cat_2_btn_svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let ship_offensive_module_container_cat_1_div = document.createElement('div');
    let ship_offensive_module_container_cat_2_div = document.createElement('div');

    ship_offensive_module_container_h3_cat_1.id = "offensive-module-heading-1";

    ship_offensive_module_container_h3_cat_1_btn.setAttribute('type', 'button');
    ship_offensive_module_container_h3_cat_1_btn.classList.add(
        'flex',
        'items-center',
        'justify-between',
        'w-full',
        'p-2',
        'font-bold',
        'rtl:text-right',
        'text-white',
        'mb-1',
    );

    ship_offensive_module_container_h3_cat_1_btn.addEventListener('click', function() {
        display_attack_options(e.id, 1)
    });

    ship_offensive_module_container_h3_cat_1_btn_span.textContent = "Weaponry";
    ship_offensive_module_container_h3_cat_1_btn_svg.id = "offensive-module-menu-svg-1";
    ship_offensive_module_container_h3_cat_1_btn_svg.classList.add('w-3', 'h-3', 'rotate-180', 'shrink-0');
    ship_offensive_module_container_h3_cat_1_btn_svg.setAttribute("fill", "none");
    ship_offensive_module_container_h3_cat_1_btn_svg.setAttribute("viewBox", "0 0 10 6");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("stroke", "currentColor");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("stroke-linecap", "round");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("stroke-linejoin", "round");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("stroke-width", "2");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("d", "M9 5 5 1 1 5");

    ship_offensive_module_container_cat_1_div.id = "offensive-module-body-1";
    ship_offensive_module_container_cat_1_div.classList.add('hidden');
    ship_offensive_module_container_cat_1_div.setAttribute('aria-labelledby', "offensive-module-heading-1");

    ship_offensive_module_container_h3_cat_2_btn.setAttribute('type', 'button');
    ship_offensive_module_container_h3_cat_2_btn.classList.add(
        'flex',
        'items-center',
        'justify-between',
        'w-full',
        'p-2',
        'font-bold',
        'rtl:text-right',
        'text-white',
        'mb-1',
        'font-shadow',
    );

    ship_offensive_module_container_h3_cat_2_btn.addEventListener('click', function() {
        display_attack_options(e.id, 2)
    });

    ship_offensive_module_container_h3_cat_2.id = "offensive-module-heading-2";

    ship_offensive_module_container_h3_cat_2_btn_span.textContent = "Electronic Warfare";
    ship_offensive_module_container_h3_cat_2_btn_svg.id = "offensive-module-menu-svg-2";
    ship_offensive_module_container_h3_cat_2_btn_svg.classList.add('w-3', 'h-3', 'rotate-180', 'shrink-0');
    ship_offensive_module_container_h3_cat_2_btn_svg.setAttribute("fill", "none");
    ship_offensive_module_container_h3_cat_2_btn_svg.setAttribute("viewBox", "0 0 10 6");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("stroke", "currentColor");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("stroke-linecap", "round");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("stroke-linejoin", "round");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("stroke-width", "2");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("d", "M9 5 5 1 1 5");

    ship_offensive_module_container_cat_2_div.id = "offensive-module-body-2";
    ship_offensive_module_container_cat_2_div.classList.add('hidden');
    ship_offensive_module_container_cat_2_div.setAttribute('aria-labelledby', "offensive-module-heading-2");

        if(currentPlayer.ship.ship_scanning_module_available){
            ship_statistics_container_div.classList.add('hidden');
            ship_detailed_statistics_container_div.classList.remove('hidden');
            ship_statistics_warning_msg_container_p.classList.add('hidden');
        }else{
            ship_statistics_container_div.classList.remove('hidden');
            ship_detailed_statistics_container_div.classList.add('hidden');
            ship_statistics_warning_msg_container_p.classList.remove('hidden');
        }
        for (let module_i in currentPlayer.ship.modules) {
            let module_item_content = document.createElement('div');
            let module_item_p = document.createElement('p');

            module_item_content.classList.add(
                'flex',
                'flex-col',
                'py-2',
                'px-4',
                'mb-1',
                'rounded-md',
                'border',
                'hover:border-gray-800',
                'border-slate-400',
                'hover:bg-slate-300',
                'bg-gray-800',
                'text-white',
                'hover:text-gray-800',
                'cursor-pointer',
                'divide-y',
                'divide-dashed',
                'divide-white',
                'hover:divide-gray-800',
            );
            module_item_p.classList.add('font-bold');
            module_item_p.textContent = currentPlayer.ship.modules[module_i]["name"];
            module_item_content.append(module_item_p);
            module_item_content.classList.add('module-container')
            module_item_content.id = `module-${currentPlayer.ship.modules[module_i]["id"]}`;
            module_item_content.addEventListener('click', function() {
                check_radio_btn_and_swap_color(e.id, module_item_content.id);
            })

            let radio_btn = document.createElement('input');
            radio_btn.type = "radio";
            radio_btn.name = "module_choice";
            radio_btn.value = currentPlayer.ship.modules[module_i]["id"];
            radio_btn.classList.add('hidden');

            if (currentPlayer.ship.modules[module_i]["type"] == "WEAPONRY") {

                if ("damage_type" in currentPlayer.ship.modules[module_i]["effect"]) {
                    let damage_type_span = document.createElement('span');
                    let damage_type_small = document.createElement('small');
                    let damage_type_small_value = document.createElement('small');
                    let damage_span = document.createElement('span');
                    let damage_small = document.createElement('small');
                    let damage_small_value = document.createElement('small');
                    let range_span = document.createElement('span');
                    let range_small = document.createElement('small');
                    let range_small_value = document.createElement('small');
                    let range_finder_span = document.createElement('span');
                    let chance_to_hit_span = document.createElement('span');
                    let chance_to_hit_small = document.createElement('small');
                    let chance_to_hit_small_value = document.createElement('small');
                    let damage_type_value = currentPlayer.ship.modules[module_i]["effect"]["damage_type"];
                    let range_value = currentPlayer.ship.modules[module_i]["effect"]["range"];
                    let min_damage_value = currentPlayer.ship.modules[module_i]["effect"]["min_damage"];
                    let max_damage_value = currentPlayer.ship.modules[module_i]["effect"]["max_damage"];

                    let id_splitted = e.id.split('_');
                    let target_id = id_splitted[1];
                    let target_type = id_splitted[0];

                    damage_type_small.textContent = "Damage type : ";
                    damage_type_small.classList.add('font-sans');
                    damage_type_small_value.textContent = damage_type_value;
                    damage_type_small_value.classList.add('text-blue-500', 'font-bold', 'font-sans');
                    damage_type_span.append(damage_type_small);
                    damage_type_span.append(damage_type_small_value);

                    damage_small.textContent = "Damages : ";
                    damage_small.classList.add('font-sans');
                    damage_small_value.textContent = `${min_damage_value} - ${max_damage_value}`;
                    damage_small_value.classList.add('text-blue-500', 'font-bold', 'font-sans');
                    damage_span.append(damage_small);
                    damage_span.append(damage_small_value);

                    range_small.textContent = "Range : ";
                    range_small.classList.add('font-sans');
                    range_small_value.textContent = `${range_value}`;
                    range_small_value.classList.add('text-blue-500', 'font-bold', 'font-sans');
                    range_span.append(range_small);
                    range_span.append(range_small_value);

                    chance_to_hit_small.textContent = "Chance to hit : ";
                    chance_to_hit_small.classList.add('font-sans');
                    chance_to_hit_small_value.textContent = "100%";
                    chance_to_hit_small_value.classList.add('text-blue-500', 'font-bold', 'font-sans');
                    chance_to_hit_span.append(chance_to_hit_small); 
                    chance_to_hit_span.append(chance_to_hit_small_value);

                    range_finder_span.textContent = "Your target is out of range";
                    range_finder_span.classList.add('text-red-600', 'animate-pulse');
                    range_finder_span.id = "range-finder-warning-msg";
                    if(currentPlayer.ship.modules_range.length > 0){
                        let array_module = Array.from(currentPlayer.ship.modules_range[target_type])
                        module_path = array_module.filter(function (module, index) {
                            if(module.target_id == target_id){
                                return module
                            }
                        });
                            
                        for(let module_container in module_path){
                            if(typeof(module_path[module_container]['is_in_range']) !== undefined && module_path[module_container]['is_in_range'] != null){
                                if (module_path[module_container]['is_in_range']) {
                                    range_finder_span.classList.add('hidden');
                                }else{
                                    range_finder_span.classList.remove('hidden');
                                }
                            }
                        }

                        module_item_content.append(radio_btn);
                        module_item_content.append(damage_type_span);
                        module_item_content.append(damage_span);
                        module_item_content.append(range_span);
                        module_item_content.append(chance_to_hit_span);
                        module_item_content.append(range_finder_span);
                    }

                } else {

                    let other_bonus_span = document.createElement('span');
                    let other_bonus_small = document.createElement('small');
                    let other_bonus_small_value = document.createElement('small');

                    other_bonus_small.textContent = "accuracy bonus : ";
                    other_bonus_small_value.textContent = `${currentPlayer.ship.modules[module_i]["effect"]["aiming_increase"]} %`;
                    other_bonus_small_value.classList.add('text-blue-500', 'font-bold');

                    module_item_content.append(radio_btn);
                    other_bonus_span.append(other_bonus_small);
                    other_bonus_span.append(other_bonus_small_value);

                    module_item_content.append(other_bonus_span);

                }

                ship_offensive_module_container_cat_1_div.append(module_item_content);

            } else if (currentPlayer.ship.modules[module_i]["type"] == "ELECTRONIC_WARFARE") {
                module_item_p.textContent = currentPlayer.ship.modules[module_i]["name"];
                module_item_p.classList.add('font-bold');
                module_item_p.id = `module-${currentPlayer.ship.modules[module_i]["id"]}`;
                module_item_content.append(module_item_p);

                for (const [key, value] of Object.entries(currentPlayer.ship.modules[module_i]["effect"])) {
                    let module_item_small_effect = document.createElement('span');
                    let module_item_small_effect_name = document.createElement('small');
                    let module_item_small_effect_value = document.createElement('small');
                    module_item_small_effect_name.classList.add('italic');
                    module_item_small_effect_value.classList.add('text-blue-500', 'font-bold');
                    module_item_small_effect_name.textContent = `${key.replace('_',' ')}: `;
                    module_item_small_effect_value.textContent = `${value}`;

                    module_item_content.append(radio_btn);
                    module_item_small_effect.append(module_item_small_effect_name);
                    module_item_small_effect.append(module_item_small_effect_value);
                    module_item_content.append(module_item_small_effect);
                }
                    
                let id_splitted = e.id.split('_');
                let target_id = id_splitted[1];
                let target_type = id_splitted[0];
                    
                let module_item_small_effect_range_finder_span = document.createElement('span');
                module_item_small_effect_range_finder_span.textContent = "Your target is out of range";
                module_item_small_effect_range_finder_span.classList.add('text-red-600', 'animate-pulse');
                module_item_small_effect_range_finder_span.id = "range-finder-warning-msg";

                module_range_array = currentPlayer.ship.modules_range[target_type]
                if(typeof(module_range_array) != "undefined"){
                    for(const module in module_range_array){
                        is_in_range = module_range_array[module].is_in_range;
                        if(is_in_range){
                            module_item_small_effect_range_finder_span.classList.add('hidden');
                        }else{
                            module_item_small_effect_range_finder_span.classList.remove('hidden');
                        }
                        module_item_content.append(module_item_small_effect_range_finder_span)
                        ship_offensive_module_container_cat_2_div.append(module_item_content);
                    }
                }
            }
        }
        item_action_container_img_attack_btn_container.append(item_action_container_img_attack_btn_img);

    ship_offensive_module_container_h3_cat_1_btn_svg.append(ship_offensive_module_container_h3_cat_1_btn_svg_path);
    ship_offensive_module_container_h3_cat_2_btn_svg.append(ship_offensive_module_container_h3_cat_2_btn_svg_path);

    ship_offensive_module_container_h3_cat_1_btn.append(ship_offensive_module_container_h3_cat_1_btn_span);
    ship_offensive_module_container_h3_cat_1_btn.append(ship_offensive_module_container_h3_cat_1_btn_svg);
    ship_offensive_module_container_h3_cat_2_btn.append(ship_offensive_module_container_h3_cat_2_btn_span);
    ship_offensive_module_container_h3_cat_2_btn.append(ship_offensive_module_container_h3_cat_2_btn_svg);

    ship_offensive_module_container_h3_cat_1.append(ship_offensive_module_container_h3_cat_1_btn);
    ship_offensive_module_container_h3_cat_2.append(ship_offensive_module_container_h3_cat_2_btn);

    ship_offensive_module_container.append(ship_offensive_module_container_h3_cat_1);
    ship_offensive_module_container.append(ship_offensive_module_container_cat_1_div);
    ship_offensive_module_container.append(ship_offensive_module_container_h3_cat_2);
    ship_offensive_module_container.append(ship_offensive_module_container_cat_2_div);
    ship_offensive_module_container.append(item_action_container_img_attack_btn_container);

    footer_container_div.append(footer_close_button);

    body_container_div.append(ship_statistics_container_label);
    body_container_div.append(ship_statistics_container_div);
    body_container_div.append(ship_statistics_warning_msg_container_p);
    body_container_div.append(ship_detailed_statistics_container_div);
    body_container_div.append(ship_action_container_label);
    body_container_div.append(ship_action_container_div);
    body_container_div.append(ship_offensive_module_container);
    header_container_div.append(header_div);
    header_container_div.append(header_close_button);
    content_div.append(header_container_div);
    content_div.append(body_container_div);
    content_div.append(footer_container_div);
    container_div.append(content_div);
    e.append(container_div);

    return e;
    
}

function create_pc_npc_modal(modalId, data, is_npc) {
    let e = document.createElement('div');
    e.id = modalId;
    e.setAttribute('aria-hidden', true);
    e.setAttribute('tabindex', -1);
    e.classList.add(
        'hidden',
        'overflow-hidden',
        'fixed',
        'top-0',
        'right-0',
        'left-0',
        'z-50',
        'justify-center',
        'items-center',
        'mx-auto',
        'w-full',
        'h-full',
        'md:inset-0',
        'bg-black/20',
        'border-1',
        'bg-black/70',
        'backdrop-blur-sm'
    );
    let player_id = modalId.split('_')[1];

    let container_div = document.createElement('div');
    container_div.classList.add("flex", "md:p-3", "z-50", "w-full", 'h-auto', 'max-h-full', 'justify-center', 'items-center', "md:inset-0", "gap-2");

    let content_div = document.createElement('div');
    content_div.classList.add('rounded-lg', 'shadow', 'w-[90vw]', 'lg:w-1/4'  , 'rounded-t', 'flex', 'flex-col', 'border-2', 'border-slate-600','items-center', 'gap-2');

    let header_container_div = document.createElement('div');
    header_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row');

    let header_div = document.createElement('h3');
    header_div.classList.add('flex', 'lg:text-xl', 'text-md', 'text-center', 'font-shadow', 'font-bold', 'rounded-t', 'p-1', 'w-[95%]', 'justify-center', 'text-white');

    header_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row');

    let footer_container_div = document.createElement('div');
    footer_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row', 'w-[100%]',  'justify-center', 'align-right');

    let footer_close_button = document.createElement("div");
    footer_close_button.textContent = `${data.actions.close}`;
    footer_close_button.classList.add('inline-block', 'flex', 'cursor-pointer', 'hover:animate-pulse', 'p-5', 'text-white', 'text-xs', 'font-bold', 'font-shadow');
    

    let close_button_url = '/static/img/ux/close.svg';

    let header_close_button = document.createElement("img");
    header_close_button.src = close_button_url;
    header_close_button.title = ``;
    header_close_button.classList.add('inline-block', 'w-[5%]', 'h-[5%]', 'flex', 'justify-end', 'align-top', 'cursor-pointer', 'hover:animate-pulse');
    
    header_close_button.setAttribute('onclick', "open_close_modal('" + e.id + "')");
    footer_close_button.setAttribute('onclick', "open_close_modal('" + e.id + "')");

    let body_container_div = document.createElement('div');
    body_container_div.classList.add('items-center', 'md:p-5', 'p-1');

    let ship_statistics_container_label = document.createElement("label");
    ship_statistics_container_label.textContent = `${data.actions.translated_statistics_label.toUpperCase()}: `;
    ship_statistics_container_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-justify', 'text-base', 'mt-2');

    // START SIMPLE STATS
    let ship_statistics_container_div = document.createElement('div');
    ship_statistics_container_div.id = "ship-statistics";

    let hp = color_per_percent(data.ship.current_hp, data.ship.max_hp);
    let movement = color_per_percent(data.ship.current_movement, data.ship.max_movement);

    let hp_container = document.createElement('div');
    let hp_container_text = document.createElement('p');
    let hp_container_label = document.createElement('label');

    let movement_container = document.createElement('div');
    let movement_container_text = document.createElement('p');
    let movement_container_label = document.createElement('label');

    hp_container.classList.add('font-bold', 'font-shadow', 'text-xs', 'flex', 'flex-row', 'gap-1', 'p-1');
    hp_container_label.classList.add('text-xs', 'font-bold');
    hp_container_text.classList.add('text-xs');
    hp_container_label.textContent = "Hull points:";
    hp_container_text.textContent = `${hp.status}`
    hp_container_label.classList.add('text-white');
    hp_container_text.classList.add(hp.color);

    hp_container.append(hp_container_label);
    hp_container.append(hp_container_text);

    movement_container.classList.add('font-bold', 'font-shadow', 'text-xs', 'flex', 'flex-row', 'gap-1', 'p-1');
    movement_container.id = "movement-container";
    movement_container_label.classList.add('text-xs', 'font-bold');
    movement_container_text.classList.add('text-xs', movement.color, 'font-shadow');
    movement_container_label.textContent = "Movement points:";
    movement_container_text.textContent = `${movement.status}`;
    movement_container_label.classList.add('text-white');

    movement_container.append(movement_container_label);
    movement_container.append(movement_container_text);

    ship_statistics_container_div.append(hp_container);
    ship_statistics_container_div.append(movement_container);

    // END SIMPLE STATS

    // START DETAILED STATS
    let ship_detailed_statistics_container_div = document.createElement('div');
    ship_detailed_statistics_container_div.id = "ship-statistics-detailed";

    let hp_progress_bar_container_div = document.createElement('div');
    let hp_progress_bar_container_content = document.createElement('div');
    let hp_progress_bar_container_text = document.createElement('span');
    let hp_progress_bar_container_label = document.createElement('label');
    let hp_percent = `${Math.round((data.ship.current_hp * 100) / (data.ship.max_hp))}%`;
    hp_progress_bar_container_div.classList.add('w-full', 'bg-red-600', 'relative');
    hp_progress_bar_container_label.textContent = "Hull points:"
    hp_progress_bar_container_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'mt-2');
    hp_progress_bar_container_content.classList.add('bg-blue-600', 'leading-none', 'h-[15px]');
    hp_progress_bar_container_text.classList.add('w-full', 'absolute', 'z-10', 'text-center', 'text-xs', 'font-bold', 'font-shadow', 'text-blue-100', 'text-center');
    hp_progress_bar_container_text.textContent = `${data.ship.current_hp} / ${data.ship.max_hp}`;
    hp_progress_bar_container_content.style.width = hp_percent;

    hp_progress_bar_container_div.append(hp_progress_bar_container_text);
    hp_progress_bar_container_div.append(hp_progress_bar_container_content);

    let movement_progress_bar_container_div = document.createElement('div');
    let movement_progress_bar_container_content = document.createElement('div');
    let movement_progress_bar_container_text = document.createElement('span');
    let movement_progress_bar_container_label = document.createElement('label');
    let move_percent = `${Math.round((data.ship.current_movement * 100) / (data.ship.max_movement))}%`;

    movement_progress_bar_container_div.classList.add('w-full', 'bg-red-600', 'relative');
    movement_progress_bar_container_div.id = "movement-container-detailed";
    movement_progress_bar_container_label.textContent = "Movement left:"
    movement_progress_bar_container_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'mt-2');
    movement_progress_bar_container_content.classList.add('bg-blue-600', 'leading-none', 'h-[15px]');
    movement_progress_bar_container_text.classList.add('w-full', 'absolute', 'z-10', 'text-center', 'text-xs', 'font-bold', 'text-blue-100', 'font-shadow', 'text-center');
    movement_progress_bar_container_text.textContent = `${data.ship.current_movement} / ${data.ship.max_movement}`;
    movement_progress_bar_container_content.style.width = move_percent;

    movement_progress_bar_container_div.append(movement_progress_bar_container_text);
    movement_progress_bar_container_div.append(movement_progress_bar_container_content);

    ship_detailed_statistics_container_div.append(hp_progress_bar_container_label);
    ship_detailed_statistics_container_div.append(hp_progress_bar_container_div);
    ship_detailed_statistics_container_div.append(movement_progress_bar_container_label);
    ship_detailed_statistics_container_div.append(movement_progress_bar_container_div);
    // END DETAILED STATS

    let ship_statistics_warning_msg_container_p = document.createElement('p');
    ship_statistics_warning_msg_container_p.classList.add('text-justify', 'font-shadow', 'text-xs', 'lg:p-1', 'text-red-600', 'animate-pulse', 'font-bold', 'font-shadow');
    ship_statistics_warning_msg_container_p.id = "statistics-warning-msg";
    ship_statistics_warning_msg_container_p.textContent = `${data.actions.translated_statistics_str} `;

    let ship_action_container = document.createElement("div");
    ship_action_container.classList.add('mt-3');
    ship_action_container.id = "item-action-container";

    let ship_action_container_label = document.createElement("label");
    ship_action_container_label.classList.add('font-bold', 'text-white', 'font-shadow', 'text-justify', 'text-base', 'font-shadow', 'mt-5');
    ship_action_container_label.htmlFor = "item-action-container";
    ship_action_container_label.textContent = `${data.actions.action_label.toUpperCase()}: `;

    let ship_action_container_div = document.createElement('figure');
    ship_action_container_div.classList.add('flex', 'items-center', 'justify-center', 'flex-wrap', 'gap-8');
    ship_action_container_div.setAttribute('role', 'group');

    let item_action_container_img_attack_container = document.createElement('div');
    item_action_container_img_attack_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');
    item_action_container_img_attack_container.addEventListener('click', function() {
        let element = document.querySelector('#' + e.id);
        let ship_attack_modules = element.querySelector('#accordion-collapse');
        ship_attack_modules.classList.remove('hidden');
    })

    let item_action_container_img_contact_container = document.createElement('div');
    item_action_container_img_contact_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

    let item_action_container_img_repaire_container = document.createElement('div');
    item_action_container_img_repaire_container.classList.add('inline-block', 'items-center', 'justify-center', 'w-[15%]', 'h-[15%]', 'hover:animate-pulse');

    let item_action_container_img_attack_btn_container = document.createElement('div');
    item_action_container_img_attack_btn_container.id = "action-btn";
    item_action_container_img_attack_btn_container.classList.add('w-full', 'hidden');

    let item_action_container_img_attack = document.createElement('img');
    item_action_container_img_attack.src = '/static/img/ux/target_icon.svg';
    item_action_container_img_attack.classList.add('cursor-pointer', 'flex', 'justify-center');

    let item_action_container_img_attack_figcaption = document.createElement('figcaption');
    item_action_container_img_attack_figcaption.textContent = "Attack";
    item_action_container_img_attack_figcaption.classList.add('text-white', 'font-shadow', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_attack_figcaption_ap = document.createElement('figcaption');
    item_action_container_img_attack_figcaption_ap.textContent = "1 AP";
    item_action_container_img_attack_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_contact = document.createElement('img');
    item_action_container_img_contact.src = '/static/img/ux/contact_icon.svg';
    item_action_container_img_contact.classList.add('cursor-pointer', 'flex', 'justify-center');

    let item_action_container_img_contact_figcaption = document.createElement('figcaption');
    item_action_container_img_contact_figcaption.textContent = "Contact";
    item_action_container_img_contact_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_contact_figcaption_ap = document.createElement('figcaption');
    item_action_container_img_contact_figcaption_ap.textContent = "0 AP";
    item_action_container_img_contact_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs', 'invisible');

    let item_action_container_img_repaire = document.createElement('img');
    item_action_container_img_repaire.src = '/static/img/ux/repaire_icon.svg';
    item_action_container_img_repaire.classList.add('cursor-pointer', 'flex', 'justify-center');

    let item_action_container_img_repaire_figcaption = document.createElement('figcaption');
    item_action_container_img_repaire_figcaption.textContent = "Repaire";
    item_action_container_img_repaire_figcaption.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_repaire_figcaption_ap = document.createElement('figcaption');
    item_action_container_img_repaire_figcaption_ap.textContent = "0 AP";
    item_action_container_img_repaire_figcaption_ap.classList.add('text-white', 'font-shadow', 'flex', 'justify-center', 'font-bold', 'text-xs');

    let item_action_container_img_attack_btn_img = document.createElement('img');
    item_action_container_img_attack_btn_img.src = '/static/img/ux/target_icon.svg';
    item_action_container_img_attack_btn_img.classList.add('cursor-pointer', 'flex', 'inline-block', 'mx-auto', 'object-center', 'justify-center', 'w-[15%]', 'h-[15%]');
    item_action_container_img_attack_btn_img.addEventListener('click', function() {
        check_radio_btn_and_swap_color(e.id, module_item_content.id);
    })

    item_action_container_img_attack_container.append(item_action_container_img_attack);
    item_action_container_img_attack_container.append(item_action_container_img_attack_figcaption);
    item_action_container_img_attack_container.append(item_action_container_img_attack_figcaption_ap);

    item_action_container_img_contact_container.append(item_action_container_img_contact);
    item_action_container_img_contact_container.append(item_action_container_img_contact_figcaption);
    item_action_container_img_contact_container.append(item_action_container_img_contact_figcaption_ap);

    item_action_container_img_repaire_container.append(item_action_container_img_repaire);
    item_action_container_img_repaire_container.append(item_action_container_img_repaire_figcaption);
    item_action_container_img_repaire_container.append(item_action_container_img_repaire_figcaption_ap);


    if (!is_npc) {

        let target_img = document.createElement('img');
        target_img.src = data.player.image == "img.png" ? `/static/img/ux/default-user.svg` : `/static/img/users/${player_id}/0.gif`
        target_img.style.width = "30%";
        target_img.style.height = "30%";
        target_img.style.margin = "0 auto";

        header_div.textContent = `${data.player.name.toUpperCase()} (${data.player.faction_name.toUpperCase()})`;
        content_div.classList.add('bg-gradient-to-b', 'from-cyan-400/70', 'to-black/70');

        body_container_div.append(target_img);
        ship_action_container_div.append(item_action_container_img_attack_container);
        ship_action_container_div.append(item_action_container_img_contact_container);
        ship_action_container_div.append(item_action_container_img_repaire_container);

    } else {

        header_div.textContent = `${data.player.name.toUpperCase()}`;
        content_div.classList.add('bg-gradient-to-b', 'from-red-600/70', 'to-black/70');
        ship_action_container_div.append(item_action_container_img_attack_container);
    }

    for (let defense_module_i in data.ship.modules) {
        if (data.ship.modules[defense_module_i]["type"].includes('DEFENSE') && !data.ship.modules[defense_module_i]["name"].includes('hull')) {
            let defense_name = data.ship.modules[defense_module_i]["name"].split(" ")[0].toLowerCase();
            // START SIMPLE DEFENSE MODULE
            let module_status_color = color_per_percent(data.ship["current_"+defense_name+"_defense"], data.ship.modules[defense_module_i].effect.defense);
            let module_content_container = document.createElement('div')
            let module_content_label = document.createElement('label');
            let module_content_text = document.createElement('p');

            module_content_container.classList.add('font-bold', 'font-shadow', 'text-xs', 'flex', 'flex-row', 'gap-1', 'p-1');
            module_content_text.classList.add(module_status_color.color);
            module_content_label.classList.add('text-white');
            module_content_label.textContent = `${data.ship.modules[defense_module_i].effect.defense_type}:`;
            module_content_text.textContent = `${module_status_color.status}`;

            module_content_container.append(module_content_label);
            module_content_container.append(module_content_text);
            ship_statistics_container_div.append(module_content_container);
            // END SIMPLE DEFENSE MODULE
            
            // START DETAILED DEFENSE MODULE
            let defense_value_detailed = `${Math.round((data.ship["current_"+defense_name+"_defense"] * 100) / (data.ship.modules[defense_module_i].effect.defense))}%`;
            let module_element_detailed = document.createElement('div');
            let module_content_detailed_label = document.createElement("label");
            let module_content_detailed = document.createElement('div');
            let module_content_detailed_text = document.createElement('span');

            module_content_detailed_label.textContent = data.ship.modules[defense_module_i]["name"].toLowerCase();
            module_content_detailed_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'mt-2');
            module_element_detailed.classList.add('w-full', 'bg-red-600', 'relative');
            module_content_detailed.classList.add('bg-blue-600', 'leading-none', 'h-[15px]');
            module_content_detailed_text.classList.add('w-full', 'absolute', 'z-10', 'text-center', 'text-xs', 'font-bold', 'font-shadow', 'text-blue-100', 'text-center');
            module_content_detailed_text.textContent = `${data.ship["current_"+defense_name+"_defense"]} / ${data.ship.modules[defense_module_i].effect.defense}`;
            module_content_detailed.style.width = parseInt(defense_value_detailed.split('%')) > 100 ? "100%" : defense_value_detailed;

            module_element_detailed.append(module_content_detailed_text);
            module_element_detailed.append(module_content_detailed);
            ship_detailed_statistics_container_div.append(module_content_detailed_label);
            ship_detailed_statistics_container_div.append(module_element_detailed);
            // END DETAILED DEFENSE MODULE
        }
    }

    let ship_offensive_module_container = document.createElement('div');
    ship_offensive_module_container.classList.add('mt-5', 'hidden');
    ship_offensive_module_container.id = "accordion-collapse";

    let ship_offensive_module_container_h3_cat_1 = document.createElement('h3');
    let ship_offensive_module_container_h3_cat_2 = document.createElement('h3');
    let ship_offensive_module_container_h3_cat_1_btn = document.createElement('button');
    let ship_offensive_module_container_h3_cat_1_btn_span = document.createElement('span');
    let ship_offensive_module_container_h3_cat_1_btn_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let ship_offensive_module_container_h3_cat_1_btn_svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let ship_offensive_module_container_h3_cat_2_btn = document.createElement('button');
    let ship_offensive_module_container_h3_cat_2_btn_span = document.createElement('span');
    let ship_offensive_module_container_h3_cat_2_btn_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let ship_offensive_module_container_h3_cat_2_btn_svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let ship_offensive_module_container_cat_1_div = document.createElement('div');
    let ship_offensive_module_container_cat_2_div = document.createElement('div');

    ship_offensive_module_container_h3_cat_1.id = "offensive-module-heading-1";

    ship_offensive_module_container_h3_cat_1_btn.setAttribute('type', 'button');
    ship_offensive_module_container_h3_cat_1_btn.classList.add(
        'flex',
        'items-center',
        'justify-between',
        'w-full',
        'p-2',
        'font-bold',
        'rtl:text-right',
        'text-white',
        'mb-1',
    );

    ship_offensive_module_container_h3_cat_1_btn.addEventListener('click', function() {
        display_attack_options(e.id, 1)
    });

    ship_offensive_module_container_h3_cat_1_btn_span.textContent = "Weaponry";
    ship_offensive_module_container_h3_cat_1_btn_svg.id = "offensive-module-menu-svg-1";
    ship_offensive_module_container_h3_cat_1_btn_svg.classList.add('w-3', 'h-3', 'rotate-180', 'shrink-0');
    ship_offensive_module_container_h3_cat_1_btn_svg.setAttribute("fill", "none");
    ship_offensive_module_container_h3_cat_1_btn_svg.setAttribute("viewBox", "0 0 10 6");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("stroke", "currentColor");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("stroke-linecap", "round");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("stroke-linejoin", "round");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("stroke-width", "2");
    ship_offensive_module_container_h3_cat_1_btn_svg_path.setAttribute("d", "M9 5 5 1 1 5");

    ship_offensive_module_container_cat_1_div.id = "offensive-module-body-1";
    ship_offensive_module_container_cat_1_div.classList.add('hidden');
    ship_offensive_module_container_cat_1_div.setAttribute('aria-labelledby', "offensive-module-heading-1");

    ship_offensive_module_container_h3_cat_2_btn.setAttribute('type', 'button');
    ship_offensive_module_container_h3_cat_2_btn.classList.add(
        'flex',
        'items-center',
        'justify-between',
        'w-full',
        'p-2',
        'font-bold',
        'rtl:text-right',
        'text-white',
        'mb-1',
        'font-shadow',
    );

    ship_offensive_module_container_h3_cat_2_btn.addEventListener('click', function() {
        display_attack_options(e.id, 2)
    });

    ship_offensive_module_container_h3_cat_2.id = "offensive-module-heading-2";

    ship_offensive_module_container_h3_cat_2_btn_span.textContent = "Electronic Warfare";
    ship_offensive_module_container_h3_cat_2_btn_svg.id = "offensive-module-menu-svg-2";
    ship_offensive_module_container_h3_cat_2_btn_svg.classList.add('w-3', 'h-3', 'rotate-180', 'shrink-0');
    ship_offensive_module_container_h3_cat_2_btn_svg.setAttribute("fill", "none");
    ship_offensive_module_container_h3_cat_2_btn_svg.setAttribute("viewBox", "0 0 10 6");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("stroke", "currentColor");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("stroke-linecap", "round");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("stroke-linejoin", "round");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("stroke-width", "2");
    ship_offensive_module_container_h3_cat_2_btn_svg_path.setAttribute("d", "M9 5 5 1 1 5");

    ship_offensive_module_container_cat_2_div.id = "offensive-module-body-2";
    ship_offensive_module_container_cat_2_div.classList.add('hidden');
    ship_offensive_module_container_cat_2_div.setAttribute('aria-labelledby', "offensive-module-heading-2");

        if(currentPlayer.ship.ship_scanning_module_available){
            ship_statistics_container_div.classList.add('hidden');
            ship_detailed_statistics_container_div.classList.remove('hidden');
            ship_statistics_warning_msg_container_p.classList.add('hidden');
        }else{
            ship_statistics_container_div.classList.remove('hidden');
            ship_detailed_statistics_container_div.classList.add('hidden');
            ship_statistics_warning_msg_container_p.classList.remove('hidden');
        }
        for (let module_i in currentPlayer.ship.modules) {
            let module_item_content = document.createElement('div');
            let module_item_p = document.createElement('p');

            module_item_content.classList.add(
                'flex',
                'flex-col',
                'py-2',
                'px-4',
                'mb-1',
                'rounded-md',
                'border',
                'hover:border-gray-800',
                'border-slate-400',
                'hover:bg-slate-300',
                'bg-gray-800',
                'text-white',
                'hover:text-gray-800',
                'cursor-pointer',
                'divide-y',
                'divide-dashed',
                'divide-white',
                'hover:divide-gray-800',
            );
            module_item_p.classList.add('font-bold');
            module_item_p.textContent = currentPlayer.ship.modules[module_i]["name"];
            module_item_content.append(module_item_p);
            module_item_content.classList.add('module-container')
            module_item_content.id = `module-${currentPlayer.ship.modules[module_i]["id"]}`;
            module_item_content.addEventListener('click', function() {
                check_radio_btn_and_swap_color(e.id, module_item_content.id);
            })

            let radio_btn = document.createElement('input');
            radio_btn.type = "radio";
            radio_btn.name = "module_choice";
            radio_btn.value = currentPlayer.ship.modules[module_i]["id"];
            radio_btn.classList.add('hidden');

            if (currentPlayer.ship.modules[module_i]["type"] == "WEAPONRY") {

                if ("damage_type" in currentPlayer.ship.modules[module_i]["effect"]) {
                    let damage_type_span = document.createElement('span');
                    let damage_type_small = document.createElement('small');
                    let damage_type_small_value = document.createElement('small');
                    let damage_span = document.createElement('span');
                    let damage_small = document.createElement('small');
                    let damage_small_value = document.createElement('small');
                    let range_span = document.createElement('span');
                    let range_small = document.createElement('small');
                    let range_small_value = document.createElement('small');
                    let range_finder_span = document.createElement('span');
                    let chance_to_hit_span = document.createElement('span');
                    let chance_to_hit_small = document.createElement('small');
                    let chance_to_hit_small_value = document.createElement('small');
                    let damage_type_value = currentPlayer.ship.modules[module_i]["effect"]["damage_type"];
                    let range_value = currentPlayer.ship.modules[module_i]["effect"]["range"];
                    let min_damage_value = currentPlayer.ship.modules[module_i]["effect"]["min_damage"];
                    let max_damage_value = currentPlayer.ship.modules[module_i]["effect"]["max_damage"];
                    
                    let id_splitted = e.id.split('_');
                    let target_id = id_splitted[1];
                    let target_type = id_splitted[0];

                    damage_type_small.textContent = "Damage type : ";
                    damage_type_small.classList.add('font-sans');
                    damage_type_small_value.textContent = damage_type_value;
                    damage_type_small_value.classList.add('text-blue-500', 'font-bold', 'font-sans');
                    damage_type_span.append(damage_type_small);
                    damage_type_span.append(damage_type_small_value);

                    damage_small.textContent = "Damages : ";
                    damage_small.classList.add('font-sans');
                    damage_small_value.textContent = `${min_damage_value} - ${max_damage_value}`;
                    damage_small_value.classList.add('text-blue-500', 'font-bold', 'font-sans');
                    damage_span.append(damage_small);
                    damage_span.append(damage_small_value);

                    range_small.textContent = "Range : ";
                    range_small.classList.add('font-sans');
                    range_small_value.textContent = `${range_value}`;
                    range_small_value.classList.add('text-blue-500', 'font-bold', 'font-sans');
                    range_span.append(range_small);
                    range_span.append(range_small_value);

                    chance_to_hit_small.textContent = "Chance to hit : ";
                    chance_to_hit_small.classList.add('font-sans');
                    chance_to_hit_small_value.textContent = "100%";
                    chance_to_hit_small_value.classList.add('text-blue-500', 'font-bold', 'font-sans');
                    chance_to_hit_span.append(chance_to_hit_small); 
                    chance_to_hit_span.append(chance_to_hit_small_value);

                    range_finder_span.textContent = "Your target is out of range";
                    range_finder_span.classList.add('text-red-600', 'animate-pulse');
                    range_finder_span.id = "range-finder-warning-msg";
                    if(currentPlayer.ship.modules_range.length > 0){
                        let array_module = Array.from(currentPlayer.ship.modules_range[target_type])
                        module_path = array_module.filter(function (module, index) {
                            if(module.target_id == target_id){
                                return module
                            }
                        });
                            
                        for(let module_container in module_path){
                            if(typeof(module_path[module_container]['is_in_range']) !== undefined && module_path[module_container]['is_in_range'] != null){
                                if (module_path[module_container]['is_in_range']) {
                                    range_finder_span.classList.add('hidden');
                                }else{
                                    range_finder_span.classList.remove('hidden');
                                }
                            }
                        }

                        module_item_content.append(radio_btn);
                        module_item_content.append(damage_type_span);
                        module_item_content.append(damage_span);
                        module_item_content.append(range_span);
                        module_item_content.append(chance_to_hit_span);
                        module_item_content.append(range_finder_span);
                    }

                } else {

                    let other_bonus_span = document.createElement('span');
                    let other_bonus_small = document.createElement('small');
                    let other_bonus_small_value = document.createElement('small');

                    other_bonus_small.textContent = "accuracy bonus : ";
                    other_bonus_small_value.textContent = `${currentPlayer.ship.modules[module_i]["effect"]["aiming_increase"]} %`;
                    other_bonus_small_value.classList.add('text-blue-500', 'font-bold');

                    module_item_content.append(radio_btn);
                    other_bonus_span.append(other_bonus_small);
                    other_bonus_span.append(other_bonus_small_value);

                    module_item_content.append(other_bonus_span);

                }

                ship_offensive_module_container_cat_1_div.append(module_item_content);

            } else if (currentPlayer.ship.modules[module_i]["type"] == "ELECTRONIC_WARFARE") {
                module_item_p.textContent = currentPlayer.ship.modules[module_i]["name"];
                module_item_p.classList.add('font-bold');
                module_item_p.id = `module-${currentPlayer.ship.modules[module_i]["id"]}`;
                module_item_content.append(module_item_p);

                for (const [key, value] of Object.entries(currentPlayer.ship.modules[module_i]["effect"])) {
                    let module_item_small_effect = document.createElement('span');
                    let module_item_small_effect_name = document.createElement('small');
                    let module_item_small_effect_value = document.createElement('small');
                    module_item_small_effect_name.classList.add('italic');
                    module_item_small_effect_value.classList.add('text-blue-500', 'font-bold');
                    module_item_small_effect_name.textContent = `${key.replace('_',' ')}: `;
                    module_item_small_effect_value.textContent = `${value}`;

                    module_item_content.append(radio_btn);
                    module_item_small_effect.append(module_item_small_effect_name);
                    module_item_small_effect.append(module_item_small_effect_value);
                    module_item_content.append(module_item_small_effect);
                }
                let id_splitted = e.id.split('_');
                console.log(data)
                let target_id = id_splitted[1];
                let target_type = id_splitted[0];
                    
                let module_item_small_effect_range_finder_span = document.createElement('span');
                module_item_small_effect_range_finder_span.textContent = "Your target is out of range";
                module_item_small_effect_range_finder_span.classList.add('text-red-600', 'animate-pulse');
                module_item_small_effect_range_finder_span.id = "range-finder-warning-msg";

                module_range_array = currentPlayer.ship.modules_range[target_type]
                if(typeof(module_range_array) != "undefined"){
                    for(const module in module_range_array){
                        is_in_range = module_range_array[module].is_in_range;
                        if(is_in_range){
                            module_item_small_effect_range_finder_span.classList.add('hidden');
                        }else{
                            module_item_small_effect_range_finder_span.classList.remove('hidden');
                        }
                        module_item_content.append(module_item_small_effect_range_finder_span)
                        ship_offensive_module_container_cat_2_div.append(module_item_content);
                    }
                }
            }
        }
        item_action_container_img_attack_btn_container.append(item_action_container_img_attack_btn_img);

    ship_offensive_module_container_h3_cat_1_btn_svg.append(ship_offensive_module_container_h3_cat_1_btn_svg_path);
    ship_offensive_module_container_h3_cat_2_btn_svg.append(ship_offensive_module_container_h3_cat_2_btn_svg_path);

    ship_offensive_module_container_h3_cat_1_btn.append(ship_offensive_module_container_h3_cat_1_btn_span);
    ship_offensive_module_container_h3_cat_1_btn.append(ship_offensive_module_container_h3_cat_1_btn_svg);
    ship_offensive_module_container_h3_cat_2_btn.append(ship_offensive_module_container_h3_cat_2_btn_span);
    ship_offensive_module_container_h3_cat_2_btn.append(ship_offensive_module_container_h3_cat_2_btn_svg);

    ship_offensive_module_container_h3_cat_1.append(ship_offensive_module_container_h3_cat_1_btn);
    ship_offensive_module_container_h3_cat_2.append(ship_offensive_module_container_h3_cat_2_btn);

    ship_offensive_module_container.append(ship_offensive_module_container_h3_cat_1);
    ship_offensive_module_container.append(ship_offensive_module_container_cat_1_div);
    ship_offensive_module_container.append(ship_offensive_module_container_h3_cat_2);
    ship_offensive_module_container.append(ship_offensive_module_container_cat_2_div);
    ship_offensive_module_container.append(item_action_container_img_attack_btn_container);

    footer_container_div.append(footer_close_button);

    body_container_div.append(ship_statistics_container_label);
    body_container_div.append(ship_statistics_container_div);
    body_container_div.append(ship_statistics_warning_msg_container_p);
    body_container_div.append(ship_detailed_statistics_container_div);
    body_container_div.append(ship_action_container_label);
    body_container_div.append(ship_action_container_div);
    body_container_div.append(ship_offensive_module_container);
    header_container_div.append(header_div);
    header_container_div.append(header_close_button);
    content_div.append(header_container_div);
    content_div.append(body_container_div);
    content_div.append(footer_container_div);
    container_div.append(content_div);
    e.append(container_div);

    return e;

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
        'backdrop-blur-sm',
        'bg-black/20',
        'border-1',
    );
    
    let container_div = document.createElement('div');
    container_div.classList.add("fixed", "md:p-3", "top-0", "right-0", "left-0", "z-50", "w-full", "md:inset-0", "h-[100vh]");

    let header_container_div = document.createElement('div');
    header_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row');
    header_container_div.textContent = "ok test chat"

    let content_div = document.createElement('div');
    content_div.classList.add('relative', 'rounded-lg', 'shadow', 'w-full', 'lg:w-1/4', 'rounded-t', 'flex', 'justify-center', 'mx-auto', 'flex-col', 'border-2', 'border-slate-600', 'bg-gradient-to-b', 'from-amber-600/70', 'to-black/70');

    let footer_container_div = document.createElement('div');
    footer_container_div.classList.add('md:p-5', 'p-1', 'flex', 'flex-row', 'w-[100%]',  'justify-end', 'align-right');

    container_div.append(header_container_div);
    container_div.append(content_div);
    container_div.append(footer_container_div);

    e.append(container_div);

    modal_container.append(e)
}

function createUnknownPcModal(modalId, modalData, playerInfo) {
    const modalIdWithPrefix = modalId;

    let visiblePlayerModal = document.getElementById(modalId);
    visiblePlayerModal?.remove();

    if(!checkIfModalExists(modalIdWithPrefix)){
        
        const modal = createUnknownModal(
            modalIdWithPrefix, 
            modalData, 
            true
        );
        
        document.querySelector('#modal-container').append(modal);
    }
    
    return;
    
}


function createUnknownNpcModal(modalData, npcInfo) {

    const modalIdWithPrefix = `modal-unknown-pc_${modalData.npc.id}`;
    const modalId = `npc_${modalData.npc.id}`;

    if(!checkIfModalExists(modalIdWithPrefix)){
        
        const modal = createUnknownModal(
            modalId, 
            modalData, 
            true
        );
        
        document.querySelector('#modal-container').append(modal);
    }
    return;
}