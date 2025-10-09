function add_npc(data) {
    if (!Array.isArray(data) || data.length === 0) return;

    const coordinatesArrayToDisableButton = [];
    const fragment = document.createDocumentFragment();

    for (const npc of data) {
        const npcInfo = extractNpcInfo(npc);
        renderNpcShip(npc, npcInfo, fragment);
    }

    document.querySelector('.tabletop-view').appendChild(fragment);
    handleMobileButtonDisabling(coordinatesArrayToDisableButton);
}

function extractNpcInfo({ npc, ship }) {
    const baseX = parseInt(npc.coordinates.x, 10);
    const baseY = parseInt(npc.coordinates.y, 10);

    return {
        coordinates: { x: baseX + 1, y: baseY + 1, baseX, baseY },
        ship: { sizeX: ship.size.x, sizeY: ship.size.y, image: ship.image },
        npc: { id: npc.id, name: npc.name, displayed_name: npc.displayed_name }
    };
}


function createAndAppendNpcModal(npcId, modalData, npcInfo) {
    const modalIdWithPrefix = `modal-npc_${npcId}`;
    const modalId = `npc_${npcId}`;

    if (!checkIfModalExists(modalIdWithPrefix)) {
        const modal = create_pc_npc_modal(modalId, modalData, true);
        document.querySelector('#modal-container').append(modal);
    }
}

function renderNpcShip(npcData, npcInfo, fragment, modalData = "") {
    const { ship, coordinates } = npcInfo;
    const bgUrl = `/static/img/foreground/SHIPS/${ship.image}.png`;
    const { sizeX, sizeY } = ship;

    let coordX = coordinates.x;
    let coordY = coordinates.y;
    const isVisible = ship_is_visible(coordY, coordX, sizeY, sizeX);

    for (let row = 0; row < sizeY; row++) {
        for (let col = 0; col < sizeX; col++) {
            const cell = getTableCell(coordY + row, coordX + col);
            if (!cell) continue;

            const border = cell.querySelector('span');
            const cellDiv = cell.querySelector('div');
            if (!border || !cellDiv) continue;

            border.classList.add('cursor-crosshair', 'border-dashed');
            setupNpcCell(cell, border, npcInfo, isVisible);

            const spaceShip = isVisible
                ? createSpaceShipElement(bgUrl, col * atlas.tilesize, row * atlas.tilesize)
                : createUnknownElement();

            border.setAttribute(
                attribute_touch_click,
                `open_close_modal('${isVisible ? `modal-npc_${npcData.npc.id}` : `modal-unknown-npc_${npcData.npc.id}`}')`
            );

            handleShipPositioning(cell, sizeY, sizeX, row * atlas.tilesize, col * atlas.tilesize);
            cellDiv.appendChild(spaceShip);
        }
    }
}

function setupNpcCell(cell, border, npcInfo, isVisible = true) {
    const { ship, coordinates, npc } = npcInfo;

    cell.classList.add("uncrossable");
    cell.dataset.size_x = ship.sizeX;
    cell.dataset.size_y = ship.sizeY;

    const pathFindingSpan = cell.querySelector('.pathfinding-zone');
    if (pathFindingSpan)
        pathFindingSpan.title = `${npc.displayed_name} [x: ${coordinates.baseY}, y: ${coordinates.baseX}]`;

    const fullId = `modal-${isVisible ? "npc" : "unknown-npc"}_${npc.id}`;
    border.dataset.modalTarget = fullId;
    border.removeAttribute('onmouseover');

    // Event handlers (réutilisables si besoin)
    cell.onmouseover = () => generate_border(ship.sizeY, ship.sizeX, coordinates.baseY + 1, coordinates.baseX + 1);
    cell.onmouseout = () => remove_border(ship.sizeY, ship.sizeX, coordinates.baseY + 1, coordinates.baseX + 1);
}

function createSpaceShipElement(bgUrl, colOffset, rowOffset) {
    const div = document.createElement('div');
    div.className = 'ship absolute w-[32px] h-[32px] cursor-pointer z-10';
    div.style.backgroundImage = `url('${bgUrl}')`;
    div.style.backgroundPosition = `-${colOffset}px -${rowOffset}px`;
    return div;
}

function createUnknownElement() {
    const div = document.createElement('div');
    div.id = "unknown-ship";
    div.className = 'ship absolute w-[8px] h-[8px] rounded-full animate-ping bg-yellow-300 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10';
    return div;
}

function handleShipPositioning(cell, sizeY, sizeX, rowOffset, colOffset) {
    const shouldAddStartPos = (
        ((sizeY === 1 && [1, 2].includes(sizeX)) && colOffset === 0) ||
        (sizeY === 1 && sizeX === 3 && colOffset === 32) ||
        (sizeY === 3 && sizeX === 3 && rowOffset === 32 && colOffset === 32)
    );
    if (shouldAddStartPos) cell.classList.add("ship-start-pos", "border-dashed");
}

function handleMobileButtonDisabling(coordinatesArray) {
    if (is_user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinatesArray));
    }
}

function getTableCell(row, col) {
    const table = document.querySelector('.tabletop-view');
    return table?.rows[row]?.cells[col] || null;
}
