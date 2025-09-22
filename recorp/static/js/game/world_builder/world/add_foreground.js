function add_foreground(data) {
    data.forEach(sectorData => {
        const elementInfo = extractElementInfo(sectorData);
        renderForegroundElement(elementInfo, sectorData);
    });
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
/*
function createModalData(elementInfo, sectorData) {
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
*/

function renderForegroundElement(elementInfo, sectorData) {
    const bgUrl = `/static/img/foreground/${elementInfo.type}/${elementInfo.animationName}/0.gif`;
    const { x: coordX, y: coordY } = elementInfo.coordinates;
    const { x: sizeX, y: sizeY } = elementInfo.size;
    
    let rowIndex = coordY;
    let colIndex = coordX;
    let full_size_y = atlas.tilesize * sizeY;
    let full_size_x = atlas.tilesize * sizeX;
    
    for (let rowOffset = 0; rowOffset < full_size_y; rowOffset += atlas.tilesize) {
        for (let colOffset = 0; colOffset < full_size_x; colOffset += atlas.tilesize) {
            const cell = getTableCell(rowIndex, colIndex);
            const cellDiv = cell.querySelector('div');
            const border = cellDiv.querySelector('span');

            setupForegroundCell(cell, border, elementInfo, coordX, coordY, sizeX, sizeY);
            const imageDiv = createImageDiv(elementInfo, bgUrl, colOffset, rowOffset, colIndex, rowIndex);

            cellDiv.append(imageDiv);
            colIndex++;
        }
        rowIndex++;
        colIndex = coordX;
    }
}

function getTableCell(rowIndex, colIndex) {
    return document.querySelector('.tabletop-view').rows[rowIndex].cells[colIndex];
}

function setupForegroundCell(cell, border, elementInfo, coordX, coordY, sizeX, sizeY) {
    // Configure cell
    cell.classList.add('uncrossable');
    cell.setAttribute('size_x', sizeX);
    cell.setAttribute('size_y', sizeY);
    cell.setAttribute('data-type', elementInfo.type);
    cell.setAttribute('type', 'foreground');

    let pathfindingSpan = cell.querySelector('.pathfinding-zone');
    pathfindingSpan.title =  `${elementInfo.name} [y: ${coordY - 1}, x: ${coordX - 1}]`;
    
    // Configure border
    border.className = "absolute z-10 w-[32px] h-[32px] pathfinding-zone cursor-pointer border-amber-500 foreground-element";
    border.setAttribute('data-modal-target', `modal-${elementInfo.name}`);
    
    border.setAttribute(attribute_touch_click, `open_close_modal('modal-${elementInfo.name}')`);
    
    // Événements optimisés avec les valeurs pré-calculées
    const mouseoverHandler = () => generate_border(sizeY, sizeX, coordY, coordX, 'border-amber-500');
    const mouseoutHandler = () => remove_border(sizeY, sizeX, coordY, coordX, 'border-amber-500');

    // Add event listeners
    border.addEventListener("mouseover", mouseoverHandler);
    border.addEventListener("mouseout", mouseoutHandler);
}

function createImageDiv(elementInfo, bgUrl, colOffset, rowOffset, colIndex, rowIndex) {
    const imageDiv = document.createElement('div');
    
    imageDiv.classList.add(
        'relative',
        'left-0',
        'right-0',
        'm-0',
        'p-0',
        'w-[32px]',
        'h-[32px]',
        'z-1'
    );
    
    imageDiv.style.backgroundImage = `url('${bgUrl}')`;
    imageDiv.style.backgroundPositionX = `-${colOffset}px`;
    imageDiv.style.backgroundPositionY = `-${rowOffset}px`;
    
    return imageDiv;
}