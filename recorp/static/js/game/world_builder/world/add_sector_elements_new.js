// Configuration et constantes
const TILE_SIZE = 32;
const BORDER_CLASSES = {
    GREEN: 'border-green-300',
    CYAN: 'border-cyan-400',
    RED: 'border-red-600',
    AMBER: 'border-amber-500'
};

const SHIP_POSITIONS = {
    '1x1': { condition: (row, col) => col === 0 },
    '1x2': { condition: (row, col) => col === 0 },
    '1x3': { condition: (row, col) => col === 32 },
    '3x3': { condition: (row, col) => row === 32 && col === 32 }
};

// Utilitaires
const GameMapUtils = {
    getTableCell(row, col) {
        return document.querySelector('.tabletop-view').rows[row].cells[col];
    },

    createImageDiv(bgUrl, colOffset, rowOffset) {
        const div = document.createElement('div');
        div.classList.add('relative', 'left-0', 'right-0', 'm-0', 'p-0', 'w-[32px]', 'h-[32px]', 'z-1');
        div.style.backgroundImage = `url('${bgUrl}')`;
        div.style.backgroundPositionX = `-${colOffset}px`;
        div.style.backgroundPositionY = `-${rowOffset}px`;
        return div;
    },

    setupBorderEventListeners(element, sizeY, sizeX, coordY, coordX, borderColor) {
        element.addEventListener("mouseover", () => {
            generate_border(sizeY, sizeX, coordY, coordX);
        });
        element.addEventListener("mouseout", () => {
            remove_border(sizeY, sizeX, coordY, coordX, borderColor);
        });
    },

    isShipStartPosition(sizeY, sizeX, row, col) {
        const sizeKey = `${sizeY}x${sizeX}`;
        return SHIP_POSITIONS[sizeKey]?.condition(row, col) || false;
    }
};

// Gestionnaire d'arrière-plan
function add_background(data) {
    const bgUrl = `/static/img/background/${data}/0.gif`;
    let indexRow = 1, indexCol = 1;

    for (let rowI = 0; rowI < atlas.map_height_size; rowI += atlas.tilesize) {
        for (let colI = 0; colI < atlas.map_width_size; colI += atlas.tilesize) {
            const entryPoint = GameMapUtils.getTableCell(indexRow, indexCol);
            const entryPointBorder = entryPoint.querySelector('div>span');

            // Configuration de l'arrière-plan
            Object.assign(entryPoint.style, {
                backgroundImage: `url('${bgUrl}')`,
                backgroundPositionX: `-${colI}px`,
                backgroundPositionY: `-${rowI}px`
            });

            entryPointBorder.classList.add('pathfinding-zone', 'cursor-pointer');
            entryPointBorder.setAttribute('title', 
                `${map_informations.sector.name} [y = ${indexRow - 1}; x = ${indexCol - 1}]`);
            
            entryPoint.addEventListener(attribute_touch_mouseover, () => {
                update_target_coord_display(entryPoint);
            });

            indexCol++;
        }
        indexRow++;
        indexCol = 1;
    }

    // Gestion du joueur actuel
    const currentPlayer = map_informations.pc.find(player => 
        player.user.user === current_user_id
    );
    
    if (currentPlayer) {
        hide_sector_overflow(currentPlayer.user.coordinates.x, currentPlayer.user.coordinates.y);
        if (!is_user_is_on_mobile_device()) {
            set_pathfinding_event();
        }
        document.querySelector('#player-container').classList.remove('hidden');
    }
}

// Créateur de données modales
const ModalDataFactory = {
    createWarpzoneData(item) {
        return {
            type: item.data.type,
            translated_type: item.data.type_translated,
            animation: { dir: item.data.type, img: item.animations },
            name: item.data.name,
            description: item.data.description,
            home_sector: item.data.warp_home_id,
            destination: {
                id: item.data.destination_id,
                name: item.data.destination_name.replaceAll('-', ' ').replaceAll('_', ' ')
            },
            coord: { x: item.data.coordinates.x, y: item.data.coordinates.y },
            actions: {
                close: map_informations.actions.translated_close_msg,
                action_label: map_informations.actions.translated_action_label_msg
            }
        };
    },

    createAsteroidData(item) {
        return {
            type: item.data.type,
            translated_type: item.data.type_translated,
            animation: { dir: item.data.type, img: item.animations },
            name: item.data.name,
            description: item.data.description,
            resources: item.resource ? {
                id: item.resource.id,
                name: item.resource.name,
                quantity_str: item.resource.quantity_str,
                quantity: item.resource.quantity,
                translated_text_resource: item.resource.translated_text_resource,
                translated_quantity_str: item.resource.translated_quantity_str,
                translated_scan_msg_str: item.resource.translated_scan_msg_str
            } : null,
            actions: {
                action_label: map_informations.actions.translated_action_label_msg,
                close: map_informations.actions.translated_close_msg,
                player_in_same_faction: map_informations.actions.player_is_same_faction
            },
            coord: { x: item.data.coordinates.x, y: item.data.coordinates.y }
        };
    },

    createPlanetStationData(item) {
        return {
            type: item.data.type,
            translated_type: item.data.type_translated,
            animation: { dir: item.data.type, img: item.animations },
            name: item.data.name,
            description: item.data.description,
            faction: {
                starter: map_informations.sector.faction.is_faction_level_starter,
                name: map_informations.sector.faction.name,
                translated_str: map_informations.sector.faction.translated_text_faction_level_starter
            },
            actions: {
                action_label: map_informations.actions.translated_action_label_msg,
                close: map_informations.actions.translated_close_msg,
                player_in_same_faction: map_informations.actions.player_is_same_faction
            },
            coord: { x: item.data.coordinates.x, y: item.data.coordinates.y }
        };
    }
};

// Gestionnaire d'avant-plan
function add_foreground(data) {
    data.forEach(item => {
        let modalData = null;
        
        switch (item.data.type) {
            case "warpzone":
                modalData = ModalDataFactory.createWarpzoneData(item);
                break;
            case "asteroid":
                modalData = ModalDataFactory.createAsteroidData(item);
                break;
            case "planet":
            case "station":
                modalData = ModalDataFactory.createPlanetStationData(item);
                break;
        }

        if (!modalData) return;

        const modal = create_foreground_modal(item.data.name, modalData);
        document.querySelector('#modal-container').append(modal);

        renderForegroundElement(item, modalData);
    });
}

function renderForegroundElement(item, modalData) {
    const { x: coordX, y: coordY } = item.data.coordinates;
    const { x: sizeX, y: sizeY } = item.size;
    const bgUrl = `/static/img/foreground/${item.data.type}/${item.animations}/0.gif`;

    let indexRow = coordY, indexCol = coordX;

    for (let rowI = 0; rowI < (atlas.tilesize * sizeY); rowI += atlas.tilesize) {
        for (let colI = 0; colI < (atlas.tilesize * sizeX); colI += atlas.tilesize) {
            const entryPoint = GameMapUtils.getTableCell(indexRow, indexCol);
            const entryPointDiv = entryPoint.querySelector('div');
            const entryPointBorder = entryPointDiv.querySelector('span');

            // Configuration de l'élément
            entryPoint.classList.add('uncrossable');
            entryPoint.setAttribute('size_x', sizeX);
            entryPoint.setAttribute('size_y', sizeY);

            entryPointBorder.className = "absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer border-amber-500";
            entryPointBorder.setAttribute('title', `${item.data.name} [y: ${coordY - 1}, x: ${coordX - 1}]`);
            entryPointBorder.setAttribute('data-modal-target', `modal-${item.data.name}`);
            entryPointBorder.setAttribute(attribute_touch_click, `open_close_modal('modal-${item.data.name}')`);

            GameMapUtils.setupBorderEventListeners(entryPointBorder, sizeY, sizeX, coordY, coordX, BORDER_CLASSES.AMBER);

            const imgDiv = GameMapUtils.createImageDiv(bgUrl, colI, rowI);
            imgDiv.setAttribute('title', `${item.data.name} [y: ${indexRow - 1}; x: ${indexCol - 1}]`);
            entryPointDiv.append(imgDiv);

            indexCol++;
        }
        indexRow++;
        indexCol = coordX;
    }
}

// Gestionnaire de NPCs
function add_npc(data) {
    const coordinatesArrayToDisableButton = [];
    
    data.forEach(npcData => {
        const coordX = parseInt(npcData.npc.coordinates.x) + 1;
        const coordY = parseInt(npcData.npc.coordinates.y) + 1;
        const { x: shipSizeX, y: shipSizeY } = npcData.ship.size;

        const modalData = createNPCModalData(npcData);
        const modal = create_pc_npc_modal(
            `npc_${npcData.npc.id}`, 
            modalData, 
            `${coordY - 1}_${coordX - 1}`, 
            shipSizeY, 
            shipSizeX, 
            true
        );
        document.querySelector('#modal-container').append(modal);

        renderNPCShip(npcData, coordX, coordY, shipSizeX, shipSizeY);
    });

    if (is_user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinatesArrayToDisableButton));
    }
}

function createNPCModalData(npcData) {
    return {
        player: {
            name: npcData.npc.name,
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
            modules_range: npcData.ship.modules_range
        },
        actions: {
            action_label: map_informations.actions.translated_action_label_msg,
            close: map_informations.actions.translated_close_msg,
            player_in_same_faction: map_informations.actions.player_is_same_faction,
            translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
            translated_statistics_str: map_informations.actions.translated_statistics_msg_str
        }
    };
}

function renderNPCShip(npcData, coordX, coordY, shipSizeX, shipSizeY) {
    const bgUrl = `/static/img/foreground/SHIPS/${npcData.ship.image}.png`;
    let currentX = coordX, currentY = coordY;

    for (let rowI = 0; rowI < (atlas.tilesize * shipSizeY); rowI += atlas.tilesize) {
        for (let colI = 0; colI < (atlas.tilesize * shipSizeX); colI += atlas.tilesize) {
            const entryPoint = GameMapUtils.getTableCell(currentY, currentX);
            const entryPointBorder = entryPoint.querySelector('span');
            const div = entryPoint.querySelector('div');

            setupNPCEntryPoint(entryPoint, entryPointBorder, npcData, shipSizeX, shipSizeY);
            
            const spaceShip = createShipElement(bgUrl, colI, rowI);
            
            if (GameMapUtils.isShipStartPosition(shipSizeY, shipSizeX, rowI, colI)) {
                entryPoint.classList.add("ship-start-pos", "border-dashed");
            }

            div.append(spaceShip);
            currentX++;
        }
        currentY++;
        currentX = coordX;
    }
}

function setupNPCEntryPoint(entryPoint, entryPointBorder, npcData, shipSizeX, shipSizeY) {
    entryPoint.classList.add("npc", "uncrossable");
    entryPoint.setAttribute('size_x', shipSizeX);
    entryPoint.setAttribute('size_y', shipSizeY);
    
    entryPointBorder.setAttribute('title', 
        `${npcData.npc.name} [x : ${parseInt(npcData.npc.coordinates.y)}, y: ${parseInt(npcData.npc.coordinates.x)}]`);
    entryPointBorder.setAttribute('data-modal-target', `modal-npc_${npcData.npc.id}`);
    entryPointBorder.setAttribute(attribute_touch_click, `open_close_modal('modal-npc_${npcData.npc.id}')`);
    
    GameMapUtils.setupBorderEventListeners(
        entryPointBorder, 
        shipSizeY, 
        shipSizeX, 
        parseInt(npcData.npc.coordinates.y) + 1, 
        parseInt(npcData.npc.coordinates.x) + 1, 
        BORDER_CLASSES.RED
    );
}

// Gestionnaire de joueurs (PCs)
function add_pc(data) {
    const coordinatesArrayToDisableButton = [];
    
    data.forEach(playerData => {
        const coord = playerData.user.coordinates;
        const coordX = parseInt(coord.x) + 1;
        const coordY = parseInt(coord.y) + 1;
        const { x: shipSizeX, y: shipSizeY } = playerData.ship.size;
        const isReversed = playerData.ship.is_reversed;

        if (playerData.user.user !== current_user_id) {
            const modalData = createPCModalData(playerData);
            const modal = create_pc_npc_modal(
                `pc_${playerData.user.player}`, 
                modalData, 
                `${coordY - 1}_${coordX - 1}`, 
                shipSizeY, 
                shipSizeX, 
                false
            );
            document.querySelector('#modal-container').append(modal);
        }

        renderPCShip(playerData, coordX, coordY, shipSizeX, shipSizeY, isReversed);
    });

    if (is_user_is_on_mobile_device()) {
        disable_button(get_direction_to_disable_button(coordinatesArrayToDisableButton));
    }
}

function createPCModalData(playerData) {
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
            modules_range: playerData.ship.modules_range
        },
        actions: {
            action_label: map_informations.actions.translated_action_label_msg,
            close: map_informations.actions.translated_close_msg,
            player_in_same_faction: map_informations.actions.player_is_same_faction,
            translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
            translated_statistics_str: map_informations.actions.translated_statistics_msg_str
        }
    };
}

function renderPCShip(playerData, coordX, coordY, shipSizeX, shipSizeY, isReversed) {
    const bgUrl = `/static/img/foreground/SHIPS/${playerData.ship.image}.png`;
    const bgUrlReversed = `/static/img/foreground/SHIPS/${playerData.ship.image}-reversed.png`;
    const isCurrentUser = playerData.user.user === current_user_id;
    const borderColor = isCurrentUser ? BORDER_CLASSES.GREEN : BORDER_CLASSES.CYAN;
    
    let currentX = coordX, currentY = coordY;

    for (let rowI = 0; rowI < (atlas.tilesize * shipSizeY); rowI += atlas.tilesize) {
        for (let colI = 0; colI < (atlas.tilesize * shipSizeX); colI += atlas.tilesize) {
            const entryPoint = GameMapUtils.getTableCell(currentY, currentX);
            
            setupPCEntryPoint(entryPoint, playerData, shipSizeX, shipSizeY, isCurrentUser, borderColor);
            
            if (isLastTile(rowI, colI, shipSizeY, shipSizeX)) {
                createTooltipContainer(entryPoint, playerData.user.player);
            }

            const { spaceShip, spaceShipReversed } = createShipElements(bgUrl, bgUrlReversed, colI, rowI, isCurrentUser);
            
            if (GameMapUtils.isShipStartPosition(shipSizeY, shipSizeX, rowI, colI)) {
                const posClass = isCurrentUser ? "player-ship-start-pos" : "ship-start-pos";
                entryPoint.classList.add(posClass, "border-dashed");
            }

            toggleShipVisibility(spaceShip, spaceShipReversed, isReversed);
            
            const entryPointDiv = entryPoint.querySelector('div');
            entryPointDiv.append(spaceShip, spaceShipReversed);

            currentX++;
        }
        currentY++;
        currentX = coordX;
    }

    if (isCurrentUser) {
        handleCurrentUserShip(playerData);
    }
}

function setupPCEntryPoint(entryPoint, playerData, shipSizeX, shipSizeY, isCurrentUser, borderColor) {
    const entryPointBorder = entryPoint.querySelector('span');
    const entryPointDiv = entryPoint.querySelector('div');

    entryPoint.classList.add("uncrossable");
    entryPoint.setAttribute('size_x', shipSizeX);
    entryPoint.setAttribute('size_y', shipSizeY);

    if (isCurrentUser) {
        entryPoint.classList.add("ship-pos");
        entryPointDiv.classList.add("bg-green-300/10");
        entryPointBorder.classList.add(borderColor);
    } else {
        entryPoint.classList.add("pc", borderColor);
    }

    setupPCEventListeners(entryPointBorder, playerData, isCurrentUser, shipSizeY, shipSizeX, borderColor);
}

function setupPCEventListeners(entryPointBorder, playerData, isCurrentUser, shipSizeY, shipSizeX, borderColor) {
    entryPointBorder.className = "absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer";
    entryPointBorder.setAttribute('title', 
        `${playerData.user.name} [x : ${parseInt(playerData.user.coordinates.y)}, y: ${parseInt(playerData.user.coordinates.x)}]`);

    if (!is_user_is_on_mobile_device()) {
        if (!isCurrentUser) {
            entryPointBorder.setAttribute('data-modal-target', `modal-pc_${playerData.user.player}`);
            entryPointBorder.setAttribute(attribute_touch_click, `open_close_modal('modal-pc_${playerData.user.player}')`);
        } else {
            entryPointBorder.setAttribute(attribute_touch_click, "reverse_player_ship_display()");
        }
    }

    GameMapUtils.setupBorderEventListeners(
        entryPointBorder,
        shipSizeY,
        shipSizeX,
        parseInt(playerData.user.coordinates.y) + 1,
        parseInt(playerData.user.coordinates.x) + 1,
        borderColor
    );
}

function createShipElement(bgUrl, colI, rowI) {
    const ship = document.createElement('div');
    ship.style.backgroundImage = `url('${bgUrl}')`;
    ship.classList.add('ship', 'w-[32px]', 'h-[32px]', 'cursor-pointer');
    ship.style.backgroundPositionX = `-${colI}px`;
    ship.style.backgroundPositionY = `-${rowI}px`;
    return ship;
}

function createShipElements(bgUrl, bgUrlReversed, colI, rowI, isCurrentUser) {
    const spaceShip = createShipElement(bgUrl, colI, rowI);
    const spaceShipReversed = createShipElement(bgUrlReversed, colI, rowI);
    
    spaceShipReversed.classList.replace('ship', 'ship-reversed');
    
    if (isCurrentUser) {
        spaceShip.classList.add("player-ship");
        spaceShipReversed.classList.replace('ship-reversed', 'player-ship-reversed');
    }
    
    return { spaceShip, spaceShipReversed };
}

function toggleShipVisibility(spaceShip, spaceShipReversed, isReversed) {
    if (isReversed) {
        spaceShip.style.display = "none";
        spaceShipReversed.style.display = "block";
    } else {
        spaceShip.style.display = "block";
        spaceShipReversed.style.display = "none";
    }
}

function isLastTile(rowI, colI, shipSizeY, shipSizeX) {
    return rowI === ((atlas.tilesize * shipSizeY) - atlas.tilesize) && colI === 0;
}

function createTooltipContainer(entryPoint, playerId) {
    const tooltipContainer = document.createElement('ul');
    tooltipContainer.id = `tooltip-pc_${playerId}`;
    tooltipContainer.classList.add(
        'absolute', 'z-10', 'px-1', 'py-1', 'text-xs', 'inline-block',
        'font-bold', 'text-white', 'rounded-sm', 'shadow-sm', 'text-center',
        'list-none', 'text-justify', 'm-w-[100%]', 'tooltip'
    );
    
    // Limite le nombre de tooltips
    const existingTooltips = entryPoint.querySelectorAll('ul');
    if (existingTooltips.length >= 3) {
        existingTooltips[0].remove();
    }
    
    entryPoint.append(tooltipContainer);
}

function handleCurrentUserShip(playerData) {
    update_user_coord_display(playerData.user.coordinates.x, playerData.user.coordinates.y);
    
    if (is_user_is_on_mobile_device() && playerData.ship.current_movement <= 0) {
        disable_button(["top", "bottom", "right", "left", "center"]);
    }
    
    current_player.set_remaining_move_points(playerData.ship.current_movement);
}

// Fonction principale de génération
function generate_sector(background, sector, npc, pc) {
    document.querySelector('html').classList.add('hidden');
    add_background(background);
    add_foreground(sector);
    add_npc(npc);
    add_pc(pc);
    document.querySelector('html').classList.remove('hidden');
}

// Gestionnaire de caméra
function hide_sector_overflow(coordX, coordY) {
    const position = { x: parseInt(coordX), y: parseInt(coordY) };
    const limits = calculateViewportLimits();
    const cameraLimits = { x: limits.x / 2, y: limits.y / 2 };
    
    const displayBounds = calculateDisplayBounds(position, cameraLimits, limits);
    
    applyVisibilityToMap(displayBounds);
}

function calculateViewportLimits() {
    if (user_is_on_mobile_bool) {
        return {
            x: map_informations.screen_sized_map.col,
            y: map_informations.screen_sized_map.row
        };
    }
    
    const { innerWidth: width, innerHeight: height } = window;
    
    const xLimit = width >= 1920 ? 40 : width >= 1680 ? 32 : width >= 1280 ? 28 : width >= 768 ? 20 : 10;
    const yLimit = height >= 965 ? 24 : height >= 840 ? 20 : height >= 680 ? 16 : 10;
    
    return { x: xLimit, y: yLimit };
}

function calculateDisplayBounds(position, cameraLimits, limits) {
    let startX = Math.max(0, position.x - cameraLimits.x);
    let startY = Math.max(0, position.y - cameraLimits.y);
    let endX = Math.min(atlas.col, position.x + cameraLimits.x);
    let endY = Math.min(atlas.row, position.y + cameraLimits.y);

    // Ajustements pour les bords
    if (startX === 0) endX = limits.x + 1;
    else if (endX === atlas.col) startX = atlas.col - (limits.x + 1);
    
    if (startY === 0) endY = limits.y + 1;
    else if (endY === atlas.row) startY = atlas.row - (limits.y + 1);

    return { startX, startY, endX, endY };
}

function applyVisibilityToMap(bounds) {
    for (let y = 0; y <= atlas.row; y++) {
        for (let x = 0; x <= atlas.col; x++) {
            const entryPoint = GameMapUtils.getTableCell(y, x);
            const shouldShow = (
                (y >= bounds.startY && y <= bounds.endY) || y === 0
            ) && (
                (x >= bounds.startX && x <= bounds.endX) || x === 0
            );
            
            entryPoint.classList.toggle("hidden", !shouldShow);
        }
    }
}

// Fonctions d'affichage des coordonnées
function update_user_coord_display(x, y) {
    document.querySelector('#player-coord-x').textContent = x;
    document.querySelector('#player-coord-y').textContent = y;
}

function update_target_coord_display(element) {
    const targetName = element.querySelector('span').title.split(' ')[0];
    const coordName = document.querySelector('#target-coord-name');
    const coordX = document.querySelector('#target-coord-x');
    const coordY = document.querySelector('#target-coord-y');
    
    coordX.classList.remove('invisible');
    coordY.classList.remove('invisible');
    coordName.textContent = targetName;
    coordX.textContent = `${element.cellIndex - 1}`;
    coordY.textContent = `${element.parentNode.rowIndex - 1}`;
    
    if (is_user_is_on_mobile_device()) {
        const spanElement = element.querySelector('span');
        if (element.classList.contains('ship-pos')) {
            reverse_player_ship_display();
        } else if (element.classList.contains('uncrossable')) {
            open_close_modal(spanElement.dataset.modalTarget);
        }
    }
}

function generate_border_className(size_y, size_x) {
    // Configuration des bordures par dimensions
    const BORDER_CONFIGS = {
        '1x1': {
            0: ["border-2", "border-dashed"]
        },
        '1x2': {
            0: ["border-l-2", "border-t-2", "border-b-2", "border-dashed"], 
            1: ["border-r-2", "border-t-2", "border-b-2", "border-dashed"]
        },
        '1x3': {
            0: ["border-l-2", "border-t-2", "border-b-2", "border-dashed"], 
            1: ["border-t-2", "border-b-2", "border-dashed"],
            2: ["border-r-2", "border-t-2", "border-b-2", "border-dashed"]
        },
        '2x2': {
            0: ["border-l-2", "border-t-2", "border-dashed"], 
            1: ["border-r-2", "border-t-2", "border-dashed"],
            2: ["border-l-2", "border-b-2", "border-dashed"],
            3: ["border-r-2", "border-b-2", "border-dashed"]
        },
        '3x2': {
            0: ["border-l-2", "border-t-2", "border-dashed"], 
            1: ["border-r-2", "border-t-2", "border-dashed"],
            2: ["border-l-2", "border-dashed"],
            3: ["border-r-2", "border-dashed"],
            4: ["border-l-2", "border-b-2", "border-dashed"],
            5: ["border-r-2", "border-b-2", "border-dashed"]
        },
        '3x3': {
            0: ["border-l-2", "border-t-2", "border-dashed"],
            1: ["border-t-2", "border-dashed"], 
            2: ["border-r-2", "border-t-2", "border-dashed"],
            3: ["border-l-2", "border-dashed"],
            4: ["none"],
            5: ["border-r-2", "border-dashed"],
            6: ["border-l-2", "border-b-2", "border-dashed"],
            7: ["border-b-2", "border-dashed"],
            8: ["border-r-2", "border-b-2", "border-dashed"]
        },
        '4x4': {
            0: ["border-l-2", "border-t-2", "border-dashed"],
            1: ["border-t-2", "border-dashed"], 
            2: ["border-t-2", "border-dashed"], 
            3: ["border-r-2", "border-t-2", "border-dashed"],
            4: ["border-l-2", "border-dashed"],
            5: ["none"],
            6: ["none"],
            7: ["border-r-2", "border-dashed"],
            8: ["border-l-2", "border-dashed"],
            9: ["none"],
            10: ["none"],
            11: ["border-r-2", "border-dashed"],
            12: ["border-l-2", "border-b-2", "border-dashed"],
            13: ["border-b-2", "border-dashed"],
            14: ["border-b-2", "border-dashed"],
            15: ["border-r-2", "border-b-2", "border-dashed"]
        }
    };

    const configKey = `${size_y}x${size_x}`;
    return BORDER_CONFIGS[configKey] || null;
}

function remove_border(size_y, size_x, coord_y, coord_x, color_class) {
    const BASE_CLASSES = `absolute block z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer ${color_class}`;
    
    iterateGridCells(size_y, size_x, coord_y, coord_x, (cell) => {
        const spanElement = cell.querySelector('span');
        if (spanElement) {
            spanElement.className = BASE_CLASSES;
        }
    });
}

function generate_border(size_y, size_x, coord_y, coord_x) {
    const borderClassList = generate_border_className(size_y, size_x);
    
    if (!borderClassList) {
        console.warn(`Configuration de bordure non trouvée pour les dimensions ${size_y}x${size_x}`);
        return;
    }

    const elements = collectGridElements(size_y, size_x, coord_y, coord_x);
    applyBorderClasses(elements, borderClassList);
}

// Fonctions utilitaires pour la logique partagée
function iterateGridCells(size_y, size_x, coord_y, coord_x, callback) {
    let current_y = coord_y;
    let current_x = coord_x;

    for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
            const cell = getTableCell(current_y, current_x);
            if (cell) {
                callback(cell);
            }
            current_x++;
        }
        current_y++;
        current_x = coord_x;
    }
}

function collectGridElements(size_y, size_x, coord_y, coord_x) {
    const elements = [];
    
    iterateGridCells(size_y, size_x, coord_y, coord_x, (cell) => {
        elements.push(cell);
    });
    
    return elements;
}

function applyBorderClasses(elements, borderClassList) {
    elements.forEach((element, index) => {
        const spanElement = element.querySelector('span');
        const borderClasses = borderClassList[index];
        
        if (spanElement && borderClasses) {
            borderClasses.forEach(borderClass => {
                if (borderClass !== "none") {
                    spanElement.classList.add(borderClass);
                }
            });
        }
    });
}

function getTableCell(row, col) {
    const table = document.querySelector('.tabletop-view');
    return table?.rows[row]?.cells[col] || null;
}

