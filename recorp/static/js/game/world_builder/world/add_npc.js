function add_npc(data) {
    const coordinatesArrayToDisableButton = [];
    
    data.forEach(npcData => {
        const npcInfo = extractNpcInfo(npcData);
        const modalData = createNpcModalData(npcData);
        createAndAppendNpcModal(npcData.npc.id, modalData, npcInfo);
        renderNpcShip(npcData, npcInfo);
    });
    
    handleMobileButtonDisabling(coordinatesArrayToDisableButton);
}

function extractNpcInfo(npcData) {
    const baseCoordX = parseInt(npcData.npc.coordinates.x);
    const baseCoordY = parseInt(npcData.npc.coordinates.y);
    return {
        coordinates: {
            x: baseCoordX + 1,
            y: baseCoordY + 1,
            baseX: baseCoordX,
            baseY: baseCoordY
        },
        ship: {
            sizeX: npcData.ship.size.x,
            sizeY: npcData.ship.size.y,
            image: npcData.ship.image,
            //borderColor: npcData.ship.is_visible ? "border-red-600" : "border-yellow-300"
        },
        npc: {
            id: npcData.npc.id,
            name: npcData.npc.name,
            displayed_name: npcData.npc.displayed_name,
        }
    };
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

function createAndAppendNpcModal(npcId, modalData, npcInfo) {
    const modalId = `npc_${npcId}`;
    const coordString = `${npcInfo.coordinates.y - 1}_${npcInfo.coordinates.x - 1}`;
    
    const modal = create_pc_npc_modal(
        modalId, 
        modalData, 
        coordString, 
        npcInfo.ship.sizeY, 
        npcInfo.ship.sizeX, 
        true
    );
    
    document.querySelector('#modal-container').append(modal);
}

function renderNpcShip(npcData, npcInfo) {
    const bgUrl = `/static/img/foreground/SHIPS/${npcInfo.ship.image}.png`;
    let coordX = npcInfo.coordinates.x;
    let coordY = npcInfo.coordinates.y;
    let sizeX  = npcInfo.ship.sizeX;
    let sizeY = npcInfo.ship.sizeY;

    let is_visible = ship_is_visible(coordY, coordX, sizeY, sizeX);
    
    for (let rowOffset = 0; rowOffset < (atlas.tilesize * sizeY); rowOffset += atlas.tilesize) {
        for (let colOffset = 0; colOffset < (atlas.tilesize * sizeX); colOffset += atlas.tilesize) {
            const cell = getTableCell(coordY, coordX);
            const border = cell.querySelector('span');
            const cellDiv = cell.querySelector('div');
            let spaceShip = undefined;
            border.classList.add('cursor-crosshair','border-dashed');
            if(is_visible){
                setupNpcCell(cell, border, npcInfo);
                spaceShip = createSpaceShipElement(bgUrl, colOffset, rowOffset);
            }else{
                setupUnkownNpcCell(cell, border, npcInfo);
                spaceShip = createUnknownElement();
            }
            
            handleShipPositioning(cell, npcInfo.ship.sizeY, npcInfo.ship.sizeX, rowOffset, colOffset);
            
            cellDiv.append(spaceShip);
            coordX++;
        }
        coordY++;
        coordX = npcInfo.coordinates.x;
    }
}

function getTableCell(rowIndex, colIndex) {
    return document.querySelector('.tabletop-view').rows[rowIndex].cells[colIndex];
}

function setupNpcCell(cell, border, npcInfo) {
    // Configure cell
    cell.classList.add("uncrossable");
    cell.setAttribute('size_x', npcInfo.ship.sizeX);
    cell.setAttribute('size_y', npcInfo.ship.sizeY);
    
    // Configure border
    border.setAttribute('data-title', 
        `${npcInfo.npc.displayed_name} [x : ${npcInfo.coordinates.baseY}, y: ${npcInfo.coordinates.baseX}]`
    );
    border.setAttribute('data-modal-target', `modal-npc_${npcInfo.npc.id}`);
    border.classList.add('border-red-600');
    border.removeAttribute('onmouseover', 'get_pathfinding(this)');
    
    // Add event listeners
    border.addEventListener("mouseover", () => {
        generate_border(
            npcInfo.ship.sizeY, 
            npcInfo.ship.sizeX, 
            npcInfo.coordinates.baseY + 1, 
            npcInfo.coordinates.baseX + 1
        );
    });
    
    border.addEventListener("mouseout", () => {
        remove_border(
            npcInfo.ship.sizeY, 
            npcInfo.ship.sizeX, 
            npcInfo.coordinates.baseY + 1, 
            npcInfo.coordinates.baseX + 1, 
            'border-red-600'
        );
    });
}

function setupUnkownNpcCell(cell, border, npcInfo) {
    // Configure cell
    cell.classList.add("uncrossable");
    cell.setAttribute('size_x', npcInfo.ship.sizeX);
    cell.setAttribute('size_y', npcInfo.ship.sizeY);
    
    // Configure border
    border.setAttribute('data-title', 
        `${"Unknown"} [x : ${npcInfo.coordinates.baseY}, y: ${npcInfo.coordinates.baseX}]`
    )

    border.setAttribute('data-modal-target', `modal-unknown_npc_${npcInfo.npc.id}`);
    border.removeAttribute('onmouseover', 'get_pathfinding(this)');
    border.classList.add('hover:border-yellow-600');
    // Add event listeners
    border.addEventListener("mouseover", () => {
        generate_border(
            npcInfo.ship.sizeY, 
            npcInfo.ship.sizeX, 
            npcInfo.coordinates.baseY + 1, 
            npcInfo.coordinates.baseX + 1
        );
    });
    
    border.addEventListener("mouseout", () => {
        remove_border(
            npcInfo.ship.sizeY, 
            npcInfo.ship.sizeX, 
            npcInfo.coordinates.baseY + 1, 
            npcInfo.coordinates.baseX + 1, 
            'border-yellow-300'
        );
    });
}


function createSpaceShipElement(bgUrl, colOffset, rowOffset) {
    const spaceShip = document.createElement('div');
    
    spaceShip.style.backgroundImage = `url('${bgUrl}')`;
    spaceShip.classList.add('ship', 'absolute', 'w-[32px]', 'h-[32px]', 'cursor-pointer', 'z-1');
    spaceShip.style.backgroundPositionX = `-${colOffset}px`;
    spaceShip.style.backgroundPositionY = `-${rowOffset}px`;
    
    return spaceShip;
}

function createUnknownElement(){
    const spaceShip = document.createElement('div');
    
    spaceShip.classList.add(
        'ship', 'absolute', 'inline-block', 'w-[8px]', 'h-[8px]', 'rounded-full',
        'animate-ping', 'bg-yellow-300', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2',
        '-translate-y-1/2', 'z-1'
    );
    
    return spaceShip;

}

function handleShipPositioning(cell, sizeY, sizeX, rowOffset, colOffset) {
    const shipStartPositions = [
        { condition: (sizeY === 1 && sizeX === 1) || (sizeY === 1 && sizeX === 2), check: colOffset === 0 },
        { condition: sizeY === 1 && sizeX === 3, check: colOffset === 32 },
        { condition: sizeY === 3 && sizeX === 3, check: rowOffset === 32 && colOffset === 32 }
    ];
    
    const shouldAddStartPos = shipStartPositions.some(pos => pos.condition && pos.check);
    
    if (shouldAddStartPos) {
        cell.classList.add("ship-start-pos", "border-dashed");
    }
}

function handleMobileButtonDisabling(coordinatesArray) {
    if (is_user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinatesArray));
    }
}