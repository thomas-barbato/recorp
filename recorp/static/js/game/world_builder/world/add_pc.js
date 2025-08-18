function add_pc(data) {
    const coordinatesArrayToDisableButton = [];

    if(data.length > 1){
        data.forEach(playerData => {
            const playerInfo = extractPlayerInfo(playerData);
            const modalData = createPlayerModalData(playerData);
            const coordinates = {y : playerInfo.coordinates.y, x : playerInfo.coordinates.x } 
            const id = `${coordinates.y}_${coordinates.x}`;
            if (!playerInfo.isCurrentUser) {
                if(observable_zone_id.includes(id) == true){
                    createAndAppendPlayerModal(modalData, playerInfo);
                }else{
                    createAndAppendUnknownPcModal(modalData, playerInfo, playerInfo.user.id);
                }
                renderOtherPlayerShip(playerData, playerInfo);
            }else{
                renderPlayerShip(playerData, playerInfo);
                createAndAppendPlayerModal(modalData, playerInfo)
            }
        });
    }else{

        const playerInfo = extractPlayerInfo(data);
        const modalData = createPlayerModalData(data);
        const coordinates = {y : playerInfo.coordinates.y, x : playerInfo.coordinates.x } 
        const id = `${coordinates.y}_${coordinates.x}`;

        if (!playerInfo.isCurrentUser) {

            if(observable_zone_id.includes(id) == true){
                createAndAppendPlayerModal(modalData, playerInfo);
            }else{
                createAndAppendUnknownPcModal(modalData, playerInfo, playerInfo.user.id);
            }
            renderOtherPlayerShip(data, playerInfo);

        }else{

            renderPlayerShip(data, playerInfo);
            createAndAppendPlayerModal(modalData, playerInfo);
            
        }
    }
    
    
    
    handleMobileButtonDisabling(coordinatesArrayToDisableButton);
}

function extractPlayerInfo(playerData) {

    const baseCoordX = parseInt(playerData.user.coordinates.x);
    const baseCoordY = parseInt(playerData.user.coordinates.y);
    const isCurrentUser = playerData.user.player === current_player_id;
    
    return {
        coordinates: {
            x: baseCoordX + 1,
            y: baseCoordY + 1,
            baseX: baseCoordX,
            baseY: baseCoordY
        },
        ship: {
            sizeX: playerData.ship.size.x,
            sizeY: playerData.ship.size.y,
            image: playerData.ship.image,
            isReversed: playerData.ship.is_reversed,
            currentMovement: playerData.ship.current_movement,
            viewRange: playerData.ship.view_range
        },
        user: {
            id: playerData.user.player,
            name: playerData.user.name
        },
        isCurrentUser,
        borderColor: isCurrentUser ? "border-orange-400" : "border-cyan-400",
    };
}

function checkIfModalExists(id_with_prefix){
    let element = document.getElementById(id_with_prefix)
    if (typeof(element) !== 'undefined' && element !== null){
        return true;
    }else{
        return false;
    }
}

function createAndAppendPlayerModal(modalData, playerInfo) {

    const modalIdWithPrefix = `modal-pc_${playerInfo.user.id}`;
    const modalId = `pc_${playerInfo.user.id}`;

    if(!checkIfModalExists(modalIdWithPrefix)){
        const coordString = `${playerInfo.coordinates.y}_${playerInfo.coordinates.x}`;
        const modal = create_pc_npc_modal(
            modalId,
            modalData,
            coordString,
            playerInfo.ship.sizeY,
            playerInfo.ship.sizeX,
            false
        );
        
        document.querySelector('#modal-container').append(modal);
    }
    
    return;
}

function createAndAppendUnknownPcModal(modalData, playerInfo) {

    const modalIdWithPrefix = `modal-unknown-pc_${playerInfo.user.id}`;
    const modalId = `pc_${playerInfo.user.id}`;

    if(!checkIfModalExists(modalIdWithPrefix)){
        const coordString = `${playerInfo.coordinates.y}_${playerInfo.coordinates.x}`;
        const modal = createUnknownModal(
            modalId, 
            modalData, 
            coordString, 
            playerInfo.ship.sizeY, 
            playerInfo.ship.sizeX, 
            true
        );
        
        document.querySelector('#modal-container').append(modal);
    }
    
    return;
    
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

function renderOtherPlayerShip(playerData, playerInfo) {
    let coordX = playerInfo.coordinates.x;
    let coordY = playerInfo.coordinates.y;
    let sizeX  = playerInfo.ship.sizeX;
    let sizeY = playerInfo.ship.sizeY;
    let full_size_y = atlas.tilesize * sizeY;
    let full_size_x = atlas.tilesize * sizeX;

    let is_visible = ship_is_visible(coordY, coordX, sizeY, sizeX);

    for (let rowOffset = 0; rowOffset < full_size_y; rowOffset += atlas.tilesize) {
        for (let colOffset = 0; colOffset < full_size_x; colOffset += atlas.tilesize) {
            const cell = getTableCell(coordY, coordX);
            const border = cell.querySelector('span');

            if(is_visible){
                setupPlayerCell(cell, playerData, playerInfo, rowOffset, colOffset);
            }else{
                spaceShip = createUnknownElement();
                setupUnknownPcCell(cell, border, playerInfo, spaceShip);
            }
            
            coordX++;
        }
        coordY++;
        coordX = playerInfo.coordinates.x;
    }
}

function renderPlayerShip(playerData, playerInfo) {
    let coordX = playerInfo.coordinates.x;
    let coordY = playerInfo.coordinates.y;
    
    for (let rowOffset = 0; rowOffset < (atlas.tilesize * playerInfo.ship.sizeY); rowOffset += atlas.tilesize) {
        for (let colOffset = 0; colOffset < (atlas.tilesize * playerInfo.ship.sizeX); colOffset += atlas.tilesize) {
            const cell = getTableCell(coordY, coordX);
            const border = cell.querySelector('span');
            handleTooltipCreation(cell, playerInfo, rowOffset, colOffset);
            setupPlayerCell(cell, playerData, playerInfo, rowOffset, colOffset);
            
            coordX++;
        }
        coordY++;
        coordX = playerInfo.coordinates.x;
    }
}

function getTableCell(rowIndex, colIndex) {
    return document.querySelector('.tabletop-view').rows[rowIndex].cells[colIndex];
}

function handleTooltipCreation(cell, playerInfo, rowOffset, colOffset) {
    const isLastRowFirstCol = rowOffset === ((atlas.tilesize * playerInfo.ship.sizeY) - atlas.tilesize) && colOffset === 0;
    
    if (isLastRowFirstCol) {
        createTooltipContainer(cell, playerInfo.user.id);
    }
}

function createTooltipContainer(cell, playerId) {
    const tooltipContainer = document.createElement('ul');
    tooltipContainer.id = `tooltip-pc_${playerId}`;
    tooltipContainer.classList.add(
        'absolute', 'z-10', 'px-1', 'py-1', 'text-xs', 'inline-block',
        'font-bold', 'text-white', 'rounded-sm', 'shadow-sm', 'text-center',
        'list-none', 'text-justify', 'm-w-[100%]', 'tooltip'
    );
    
    // Remove existing tooltips if there are too many
    const existingTooltips = cell.querySelectorAll('ul');
    if (existingTooltips.length >= 3) {
        existingTooltips[0].remove();
    }
    
    cell.append(tooltipContainer);
}

function setupPlayerCell(cell, playerData, playerInfo, rowOffset, colOffset) {
    const border = cell.querySelector('span');
    const cellDiv = cell.querySelector('div');
    
    // Configure cell
    cell.classList.add("uncrossable");
    cell.setAttribute('size_x', playerInfo.ship.sizeX);
    cell.setAttribute('size_y', playerInfo.ship.sizeY);
    
    // Setup ship elements
    const { spaceShip, spaceShipReversed } = createShipElements(playerInfo.ship.image, colOffset, rowOffset);
    handleShipDisplay(spaceShip, spaceShipReversed, playerInfo.ship.isReversed);
    
    // Configure border and interactions
    setupBorderAndInteractions(border, playerData, playerInfo);
    
    // Handle current user specific setup
    if (playerInfo.isCurrentUser) {
        setupCurrentUserCell(cell, cellDiv, border, playerData, playerInfo, spaceShip, spaceShipReversed, rowOffset, colOffset);
        renderPlayerSonar(playerInfo.coordinates, playerInfo.ship.viewRange);
    } else {
        setupOtherPlayerCell(cell, playerInfo.borderColor);
    }
    
    cellDiv.append(spaceShip);
    cellDiv.append(spaceShipReversed);
}

function setupUnknownPcCell(cell, border, playerInfo, spaceship) {
    // Configure cell
    cell.classList.add("uncrossable");
    cell.setAttribute('size_x', playerInfo.ship.sizeX);
    cell.setAttribute('size_y', playerInfo.ship.sizeY);
    
    // Configure border
    border.setAttribute('data-title', 
        `${"Unknown"} [x : ${playerInfo.coordinates.baseY}, y: ${playerInfo.coordinates.baseX}]`
    );
    border.setAttribute('data-modal-target', `modal-unknown-pc_${playerInfo.user.id}`);
    border.removeAttribute('onmouseover', 'get_pathfinding(this)');
    
    // Set click behavior for non-mobile devices
    if (!is_user_is_on_mobile_device()) {
        const clickAction = playerInfo.isCurrentUser 
            ? "reverse_player_ship_display()" 
            : `open_close_modal('modal-unknown-pc_${playerInfo.user.id}')`;
        border.setAttribute(attribute_touch_click, clickAction);
    }

        
    // Événements optimisés avec les valeurs pré-calculées
    const mouseoverHandler = () => generate_border(playerInfo.ship.sizeY, playerInfo.ship.sizeX, playerInfo.coordinates.baseY + 1, playerInfo.coordinates.baseX + 1);
    const mouseoutHandler = () => remove_border(playerInfo.ship.sizeY, playerInfo.ship.sizeX, playerInfo.coordinates.baseY + 1, playerInfo.coordinates.baseX + 1);

    // Add event listeners
    border.addEventListener("mouseover", mouseoverHandler);
    border.addEventListener("mouseout", mouseoutHandler);
    
    cell.append(spaceship);
}

function createShipElements(shipImage, colOffset, rowOffset) {
    const bgUrl = `/static/img/foreground/SHIPS/${shipImage}.png`;
    const bgUrlReversed = `/static/img/foreground/SHIPS/${shipImage}-reversed.png`;
    
    const spaceShip = createShipElement(bgUrl, colOffset, rowOffset, 'ship');
    const spaceShipReversed = createShipElement(bgUrlReversed, colOffset, rowOffset, 'ship-reversed');
    
    return { spaceShip, spaceShipReversed };
}

function createOutOfBoundShipElement(bgUrl, colOffset, rowOffset, className){
    const element = document.createElement('div');
    element.style.backgroundImage = `url('${bgUrl}')`;
    element.classList.add(className, 'w-[32px]', 'h-[32px]', 'cursor-pointer', 'pc');
    element.style.backgroundPositionX = `-${colOffset}px`;
    element.style.backgroundPositionY = `-${rowOffset}px`;
    return element;
    
}

function createShipElement(bgUrl, colOffset, rowOffset, className) {
    const element = document.createElement('div');
    element.style.backgroundImage = `url('${bgUrl}')`;
    element.classList.add(className, 'absolute', 'w-[32px]', 'h-[32px]', 'cursor-pointer', 'pc', 'z-1');
    element.style.backgroundPositionX = `-${colOffset}px`;
    element.style.backgroundPositionY = `-${rowOffset}px`;
    return element;
}

function createUnknownElement(){
    const spaceShip = document.createElement('div');
    
    spaceShip.classList.add(
        'ship', 'absolute', 'inline-block', 'w-[8px]', 'h-[8px]', 'rounded-full',
        'animate-ping', 'bg-yellow-300', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2',
        '-translate-y-1/2', 'z-1'
    );
    spaceShip.id = "unknown-ship";
    
    return spaceShip;

}

function handleShipDisplay(spaceShip, spaceShipReversed, isReversed) {
    if (isReversed) {
        spaceShip.classList.add('hidden');
        spaceShipReversed.classList.remove('hidden');
    } else {
        spaceShip.classList.remove('hidden');
        spaceShipReversed.classList.add('hidden');
    }
}

function setupBorderAndInteractions(border, playerData, playerInfo) {
    border.className = "absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer";
    border.setAttribute('data-title', 
        `${playerInfo.user.name} [x : ${playerInfo.coordinates.baseY}, y: ${playerInfo.coordinates.baseX}]`
    );
    if(currentPlayer.user.player != playerInfo.user.id){
        border.setAttribute('data-modal-target', `modal-pc_${playerInfo.user.id}`);
    }
    border.id = "ship-data-title";
    border.classList.add(playerInfo.borderColor);
    
    // Set click behavior for non-mobile devices
    if (!is_user_is_on_mobile_device()) {
        const clickAction = playerInfo.isCurrentUser 
            ? "reverse_player_ship_display()" 
            : `open_close_modal('modal-pc_${playerInfo.user.id}')`;
        border.setAttribute(attribute_touch_click, clickAction);
    }
    
    if (!is_user_is_on_mobile_device()) {
        if(playerInfo.isCurrentUser){
            border.setAttribute(attribute_touch_click, "reverse_player_ship_display()");
        }
    }
    
        
    // Événements optimisés avec les valeurs pré-calculées
    const mouseoverHandler = () => generate_border(playerInfo.ship.sizeY, playerInfo.ship.sizeX, playerInfo.coordinates.baseY + 1, playerInfo.coordinates.baseX + 1);
    const mouseoutHandler = () => remove_border(playerInfo.ship.sizeY, playerInfo.ship.sizeX, playerInfo.coordinates.baseY + 1, playerInfo.coordinates.baseX + 1);

    // Add event listeners
    border.addEventListener("mouseover", mouseoverHandler);
    border.addEventListener("mouseout", mouseoutHandler);
}

function setupCurrentUserCell(cell, cellDiv, border, playerData, playerInfo, spaceShip, spaceShipReversed, rowOffset, colOffset) {
    update_user_coord_display(playerInfo.coordinates.baseX, playerInfo.coordinates.baseY);
    
    cell.classList.add("ship-pos");
    cellDiv.classList.add("bg-orange-400/30");
    border.classList.add(playerInfo.borderColor);
    
    handleCurrentUserShipPositioning(cell, playerInfo.ship.sizeY, playerInfo.ship.sizeX, rowOffset, colOffset);
    
    spaceShip.classList.add("player-ship");
    spaceShipReversed.classList.add("player-ship-reversed");

    if(playerData.ship.is_reversed == true){
        spaceShip.classList.add('hidden');
        spaceShipReversed.classList.remove('hidden');
    }else{
        spaceShip.classList.remove('hidden');
        spaceShipReversed.classList.add('hidden');
    }
    
    handleCurrentUserMovement(playerInfo.ship.currentMovement);
    current_player.set_remaining_move_points(playerInfo.ship.currentMovement);
}

function setupOtherPlayerCell(cell, borderColor) {
    cell.classList.add("pc", borderColor);
}

function handleCurrentUserShipPositioning(cell, sizeY, sizeX, rowOffset, colOffset) {
    const shipStartPositions = [
        { condition: (sizeY === 1 && sizeX === 1) || (sizeY === 1 && sizeX === 2), check: colOffset === 0 },
        { condition: sizeY === 1 && sizeX === 3, check: colOffset === 32 },
        { condition: sizeY === 3 && sizeX === 3, check: rowOffset === 32 && colOffset === 32 }
    ];
    
    const shouldAddStartPos = shipStartPositions.some(pos => pos.condition && pos.check);
    
    if (shouldAddStartPos) {
        cell.classList.add("player-ship-start-pos", "border-dashed");
    }
}

function handleCurrentUserMovement(currentMovement) {
    if (is_user_is_on_mobile_device() && currentMovement <= 0) {
        disable_button(["top", "bottom", "right", "left", "center"]);
    }
}

function handleMobileButtonDisabling(coordinatesArray) {
    if (is_user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinatesArray));
    }
}