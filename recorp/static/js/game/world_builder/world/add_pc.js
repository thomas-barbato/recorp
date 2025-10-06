function add_pc(data) {

    const coordinatesArrayToDisableButton = [];

    if(data.length > 1){

        data.forEach(playerData => {
            const playerInfo = extractPlayerInfo(playerData);
            const coordinates = {y : playerInfo.coordinates.y, x : playerInfo.coordinates.x };
            const is_visible = checkIfCoordinateIsVisible(playerInfo);

            if (!playerInfo.isCurrentUser) {
                renderOtherPlayerShip(playerData, playerInfo, is_visible);
            }else{
                renderPlayerShip(playerData, playerInfo);
            }
        });
        

    }else{

        const playerInfo = extractPlayerInfo(data);
        const modalData = createPlayerModalData(data);
        const coordinates = {y : playerInfo.coordinates.y, x : playerInfo.coordinates.x } 
        const id = `${coordinates.y}_${coordinates.x}`;
        const is_visible = checkIfCoordinateIsVisible(playerInfo);

        if (!playerInfo.isCurrentUser) {
            renderOtherPlayerShip(data, playerInfo, is_visible);
        }else{
            renderPlayerShip(data, playerInfo);
            
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

function checkIfCoordinateIsVisible(playerInfo){

        const shipSizeX = parseInt(playerInfo.ship.sizeX);
        const shipSizeY = parseInt(playerInfo.ship.sizeY);
        const startCoordX = parseInt(playerInfo.coordinates.x) - 1;
        const startCoordY = parseInt(playerInfo.coordinates.y) - 1;
        const endCoordX = parseInt(startCoordX + shipSizeX);
        const endCoordY = parseInt(startCoordY + shipSizeY);

        let coordinates_array = [];

        if(shipSizeY == 1 && shipSizeX == 1){
            coordinates_array.push(`${startCoordY}_${startCoordX}`)
        }else{
            for(let row = startCoordY; row < endCoordY; row++){
                for(let col = startCoordX; col < endCoordX; col++){
                    coordinates_array.push(`${row}_${col}`);
                }
            }
        }

        return coordinates_array.some(id=> observable_zone_id.indexOf(id) !== -1);
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

    let unknowModalId = `modal-unknown-pc_${playerInfo.user.id}`;

    let unknownModal = document.getElementById(unknowModalId);
    unknownModal?.remove();

    if(!checkIfModalExists(modalIdWithPrefix)){

        const modal = create_pc_npc_modal(
            modalId,
            modalData,
            false
        );
        
        document.querySelector('#modal-container').append(modal);
    }
    
    return;
}

function renderOtherPlayerShip(playerData, playerInfo, is_visible) {
    let coordX = playerInfo.coordinates.x;
    let coordY = playerInfo.coordinates.y;
    let sizeX  = playerInfo.ship.sizeX;
    let sizeY = playerInfo.ship.sizeY;
    let full_size_y = atlas.tilesize * sizeY;
    let full_size_x = atlas.tilesize * sizeX;

    for (let rowOffset = 0; rowOffset < full_size_y; rowOffset += atlas.tilesize) {
        for (let colOffset = 0; colOffset < full_size_x; colOffset += atlas.tilesize) {

            const cell = getTableCell(coordY, coordX);
            const border = cell.querySelector('span');
            
            // SOLUTION CORRIGÉE: Nettoyer TOUS les éléments unknown-ship existants
            const existingUnknownShips = cell.querySelectorAll('#unknown-ship');
            existingUnknownShips.forEach(ship => ship.remove());

            if(is_visible){
                setupPlayerCell(cell, playerData, playerInfo, rowOffset, colOffset);
            }else{
                // Créer UN NOUVEAU élément pour CETTE cellule spécifique
                const spaceShip = createUnknownElement(coordY, coordX);
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
    
    const coordinates = {y: playerInfo.coordinates.y, x: playerInfo.coordinates.x};
    updatePlayerSonar(coordinates, playerInfo.ship.viewRange);
}

function handleTooltipCreation(cell, playerInfo, rowOffset, colOffset) {
    const isLastRowFirstCol = rowOffset === ((atlas.tilesize * playerInfo.ship.sizeY) - atlas.tilesize) && colOffset === 0;
    if (isLastRowFirstCol) {
        createTooltipContainer(cell, playerInfo.user.id);
    }
}

function setupPlayerCell(cell, playerData, playerInfo, rowOffset, colOffset) {
    const border = cell.querySelector('span');
    const cellDiv = cell.querySelector('div');

    let unknownShipDiv = cell.querySelector('#unknown-ship');
    unknownShipDiv?.remove();
    
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
    } else {
        setupOtherPlayerCell(cell, playerInfo.borderColor, playerInfo.user.name, playerInfo.coordinates);
    }
    
    cellDiv.append(spaceShip);
    cellDiv.append(spaceShipReversed);
}

function setupUnknownPcCell(cell, border, playerInfo, spaceship) {
    // Nettoyage préventif au début de la fonction
    const existingUnknown = cell.querySelectorAll('.ship.animate-ping.bg-yellow-300, .ship[id*="unknown-ship"]');
    let pathFindingSpan = cell.querySelector('.pathfinding-zone');
    existingUnknown.forEach(ship => ship.remove());
    
    // Configure cell
    cell.classList.add("uncrossable");
    cell.setAttribute('size_x', playerInfo.ship.sizeX);
    cell.setAttribute('size_y', playerInfo.ship.sizeY);

    pathFindingSpan.title = `${"Unknown"} [x : ${playerInfo.coordinates.baseY}, y: ${playerInfo.coordinates.baseX}]`;
    
    // Configure border
    border.setAttribute('data-modal-target', `modal-unknown-pc_${playerInfo.user.id}`);
    border.removeAttribute('onmouseover', 'get_pathfinding(this)');
    
    // Set click behavior for non-mobile devices
    if (!is_user_is_on_mobile_device()) {
        const clickAction = playerInfo.isCurrentUser 
            ? "reverse_player_ship_display()" 
            : `open_close_modal('modal-unknown-pc_${playerInfo.user.id}')`;
        border.setAttribute(attribute_touch_click, clickAction);
    }

    // Événements optimisés
    const mouseoverHandler = () => generate_border(playerInfo.ship.sizeY, playerInfo.ship.sizeX, playerInfo.coordinates.baseY + 1, playerInfo.coordinates.baseX + 1);
    const mouseoutHandler = () => remove_border(playerInfo.ship.sizeY, playerInfo.ship.sizeX, playerInfo.coordinates.baseY + 1, playerInfo.coordinates.baseX + 1);

    if(!is_user_is_on_mobile_device()){
        border.addEventListener("mouseover", mouseoverHandler);
        border.addEventListener("mouseout", mouseoutHandler);

    }else{

        const radarSweepButton = document.querySelector('#radar-sweep');
        if (!radarSweepButton){
            return
        }

        radarSweepButton.addEventListener('touchstart', function(){
            if(mobile_radar_sweep_bool == false){
                generate_border(playerInfo.ship.sizeY, playerInfo.ship.sizeX, playerInfo.coordinates.baseY + 1, playerInfo.coordinates.baseX + 1);
                mobile_radar_sweep_bool = true;
            }else{
                remove_border(playerInfo.ship.sizeY, playerInfo.ship.sizeX, playerInfo.coordinates.baseY + 1, playerInfo.coordinates.baseX + 1);
                mobile_radar_sweep_bool = false;
            }
        })
    }
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
    element.classList.add(className, 'absolute', 'w-[32px]', 'h-[32px]', 'cursor-pointer', 'pc');
    element.style.backgroundPositionX = `-${colOffset}px`;
    element.style.backgroundPositionY = `-${rowOffset}px`;
    return element;
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

    if(currentPlayer.user.player != playerInfo.user.id){
        border.setAttribute('data-modal-target', `modal-pc_${playerInfo.user.id}`);
    }
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

function setupOtherPlayerCell(cell, borderColor, playerName, coordinates) {
    let pathFindingSpan = cell.querySelector('.pathfinding-zone');
    cell.classList.add("pc", borderColor);
    pathFindingSpan.title = `${playerName} [x : ${coordinates.x}, y: ${coordinates.y}]`;
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

function handleUserJoin(data) {
    console.log('👤 Nouveau joueur dans le secteur:', data.user?.name);
    
    // Vérifier si c'est un autre joueur
    if (data.user?.player !== current_player_id) {
        // Ajouter aux autres joueurs
        const existingIndex = otherPlayers.findIndex(
            p => p.user.player === data.user.player
        );
        
        if (existingIndex === -1) {
            otherPlayers.push(data);
            
            // Afficher le vaisseau
            add_pc(data);
            
            // Mettre à jour la détection
            if (typeof updateDetectionForNewPlayer === 'function') {
                updateDetectionForNewPlayer(data);
            }
        }
    }
}