function add_foreground(data) {
    data.forEach(sectorData => {
        const elementInfo = extractElementInfo(sectorData);
        renderForegroundElement(elementInfo);
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

function getTableCell(rowIndex, colIndex) {
    return document.querySelector('.tabletop-view').rows[rowIndex].cells[colIndex];
}

function setupForegroundCell(cell, border, elementInfo, coordX, coordY, sizeX, sizeY, is_visible) {
    // Configure cell
    cell.classList.add('uncrossable');
    cell.setAttribute('size_x', sizeX);
    cell.setAttribute('size_y', sizeY);
    cell.setAttribute('data-type', elementInfo.type);
    cell.setAttribute('type', 'foreground');

    let pathfindingSpan = cell.querySelector('.pathfinding-zone');
    pathfindingSpan.title =  `${elementInfo.name} [y: ${coordY - 1}, x: ${coordX - 1}]`;

    let borderColor = "";
    let backgroundColor = "";
    let isForegroundTooFar = false;
    let cursorType = "";

    if(is_visible){
        borderColor = 'border-amber-500';
        border.setAttribute('data-modal-target', `modal-${elementInfo.name}`);
        border.setAttribute(attribute_touch_click, `open_close_modal('modal-${elementInfo.name}')`);
        cursorType = "cursor-pointer";
    }else{
        borderColor = 'border-red-600';
        backgroundColor = 'bg-red-600/30';
        isForegroundTooFar = true;
        cursorType = "cursor-not-allowed";
    }
    
    // Configure border
    border.className = `absolute z-10 w-[32px] h-[32px] pathfinding-zone ${cursorType} ${borderColor} foreground-element`;
    
    // Événements optimisés avec les valeurs pré-calculées
    const mouseoverHandler = () => generate_border(sizeY, sizeX, coordY, coordX, borderColor, isForegroundTooFar);
    const mouseoutHandler = () => remove_border(sizeY, sizeX, coordY, coordX, borderColor, isForegroundTooFar);

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

function renderForegroundElement(elementInfo) {
    const bgUrl = `/static/img/foreground/${elementInfo.type}/${elementInfo.animationName}/0.gif`;
    const { x: coordX, y: coordY } = elementInfo.coordinates;
    const { x: sizeX, y: sizeY } = elementInfo.size;
    
    let rowIndex = coordY;
    let colIndex = coordX;
    let full_size_y = atlas.tilesize * sizeY;
    let full_size_x = atlas.tilesize * sizeX;

    let is_visible = checkIfCoordinateIsVisible(elementInfo, is_npc=false, is_foreground=true)
    
    for (let rowOffset = 0; rowOffset < full_size_y; rowOffset += atlas.tilesize) {
        for (let colOffset = 0; colOffset < full_size_x; colOffset += atlas.tilesize) {
            const cell = getTableCell(rowIndex, colIndex);
            const cellDiv = cell.querySelector('div');
            const border = cellDiv.querySelector('span');

            setupForegroundCell(cell, border, elementInfo, coordX, coordY, sizeX, sizeY, is_visible);
            const imageDiv = createImageDiv(elementInfo, bgUrl, colOffset, rowOffset, colIndex, rowIndex);

            cellDiv.append(imageDiv);
            colIndex++;
        }
        rowIndex++;
        colIndex = coordX;
    }
}

function update_foreground_border_display(foregroundElement){

    foregroundElement.forEach(fg => {

        let is_visible, borderColor, backgroundColor, isForegroundTooFar, cursorType;
        const { x: coordX, y: coordY } = fg.data.coordinates;
        const { x: sizeX, y: sizeY } = fg.size;
    
        let rowIndex = coordY;
        let colIndex = coordX;
        let full_size_y = atlas.tilesize * sizeY;
        let full_size_x = atlas.tilesize * sizeX;

        let data = {
            coordinates: fg.data.coordinates,
            size : fg.size
        }
        
        is_visible = checkIfCoordinateIsVisible(data, is_npc=false, is_foreground=true)
        isForegroundTooFar = !is_visible;

        for (let rowOffset = 0; rowOffset < full_size_y; rowOffset += atlas.tilesize) {
            for (let colOffset = 0; colOffset < full_size_x; colOffset += atlas.tilesize) {
                const cell = getTableCell(rowIndex, colIndex);
                const cellDiv = cell.querySelector('div');
                const border = cellDiv.querySelector('span');


                if (!border) continue;

                // Supprime proprement les anciens events (évite les doublons mémoire)
                const newBorder = border.cloneNode(true);
                border.replaceWith(newBorder);

                newBorder.removeAttribute('data-modal-target', `modal-${fg.data.name}`);
                newBorder.removeAttribute(attribute_touch_click, `open_close_modal('modal-${fg.data.name}')`);

                if (is_visible) {
                    newBorder.setAttribute('data-modal-target', `modal-${fg.data.name}`);
                    newBorder.setAttribute(attribute_touch_click, `open_close_modal('modal-${fg.data.name}')`);
                    cursorType = "cursor-pointer";
                    borderColor = 'border-amber-500';
                }else{
                    borderColor = 'border-red-600';
                    backgroundColor = 'bg-red-600/30';
                    isForegroundTooFar = true;
                    cursorType = "cursor-not-allowed";
                }

                // Événements optimisés avec les valeurs pré-calculées
                const mouseoverHandler = () => generate_border(sizeY, sizeX, coordY, coordX, borderColor, isForegroundTooFar);
                const mouseoutHandler = () => remove_border(sizeY, sizeX, coordY, coordX, borderColor, isForegroundTooFar);

                // Add event listeners
                newBorder.addEventListener("mouseover", mouseoverHandler);
                newBorder.addEventListener("mouseout", mouseoutHandler);
                
                border.className = `absolute z-10 w-[32px] h-[32px] pathfinding-zone ${cursorType} ${borderColor} foreground-element`;

                colIndex++;
            }
            rowIndex++;
            colIndex = coordX;
        }

    });
}