function add_npc(data) {
    const coordinatesArrayToDisableButton = [];
    
    data.forEach(npcData => {
        const npcInfo = extractNpcInfo(npcData);
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
        },
        npc: {
            id: npcData.npc.id,
            name: npcData.npc.name,
            displayed_name: npcData.npc.displayed_name,
        },
    };
}

function checkIfModalExists(id_with_prefix){
    let element = document.getElementById(id_with_prefix)
    return (typeof(element) !== 'undefined' && element !== null) ?  true : false;
}

function createAndAppendNpcModal(npcId, modalData, npcInfo) {

    const modalIdWithPrefix = `modal-npc_${npcId}`;
    const modalId = `npc_${npcId}`;

    if(!checkIfModalExists(modalIdWithPrefix)){

        const modal = create_pc_npc_modal(
            modalId, 
            modalData, 
            true
        );
        
        document.querySelector('#modal-container').append(modal);
    }
    
    return;
    
}

function renderNpcShip(npcData, npcInfo, modalData="") {
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

            setupNpcCell(cell, border, npcInfo, is_visible);
            spaceShip = is_visible == true ? createSpaceShipElement(bgUrl, colOffset, rowOffset) : createUnknownElement();
            
            const clickAction = is_visible === true ? `open_close_modal('modal-npc_${npcData.npc.id}')`: `open_close_modal('modal-unknown-npc_${npcData.npc.id}')`;
            border.setAttribute(attribute_touch_click, clickAction);
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

function setupNpcCell(cell, border, npcInfo, is_visible = true) {
    // Configure cell
    cell.classList.add("uncrossable");
    cell.setAttribute('size_x', npcInfo.ship.sizeX);
    cell.setAttribute('size_y', npcInfo.ship.sizeY);

    let pathFindingSpan = cell.querySelector('.pathfinding-zone');
    pathFindingSpan.title = `${npcInfo.npc.displayed_name} [x : ${npcInfo.coordinates.baseY}, y: ${npcInfo.coordinates.baseX}]`;
    
    // Configure border
    let full_id = is_visible == true ? `modal-npc_${npcInfo.npc.id}`: `modal-unknown-npc_${npcInfo.npc.id}`;
    border.setAttribute('data-modal-target', full_id);
    border.removeAttribute('onmouseover', 'get_pathfinding(this)');
        
    // Événements optimisés avec les valeurs pré-calculées
    const mouseoverHandler = () => generate_border(npcInfo.ship.sizeY, npcInfo.ship.sizeX, npcInfo.coordinates.baseY + 1, npcInfo.coordinates.baseX + 1);
    const mouseoutHandler = () => remove_border(npcInfo.ship.sizeY, npcInfo.ship.sizeX, npcInfo.coordinates.baseY + 1, npcInfo.coordinates.baseX + 1);

    // Add event listeners
    cell.addEventListener("mouseover", mouseoverHandler);
    cell.addEventListener("mouseout", mouseoutHandler);
}


function createSpaceShipElement(bgUrl, colOffset, rowOffset) {

    const spaceShip = document.createElement('div');
    
    spaceShip.style.backgroundImage = `url('${bgUrl}')`;
    spaceShip.classList.add('ship', 'absolute', 'w-[32px]', 'h-[32px]', 'cursor-pointer', 'z-10');
    spaceShip.style.backgroundPositionX = `-${colOffset}px`;
    spaceShip.style.backgroundPositionY = `-${rowOffset}px`;
    
    return spaceShip;
}

function createUnknownElement(){
    
    const spaceShip = document.createElement('div');
    
    spaceShip.classList.add(
        'ship', 'absolute', 'w-[8px]', 'h-[8px]', 'rounded-full',
        'animate-ping', 'bg-yellow-300', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2',
        '-translate-y-1/2', 'z-10'
    );
    spaceShip.id = "unknown-ship";
    
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