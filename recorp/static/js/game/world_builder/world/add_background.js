function add_background(data) {
    const bgUrl = `/static/img/background/${data}/0.gif`;
    
    setupBackgroundTiles(bgUrl);
    setupCurrentPlayer();
}

function setupBackgroundTiles(bgUrl) {
    let rowIndex = 1;
    let colIndex = 1;
    
    for (let rowOffset = 0; rowOffset < atlas.map_height_size; rowOffset += atlas.tilesize) {
        for (let colOffset = 0; colOffset < atlas.map_width_size; colOffset += atlas.tilesize) {
            const cell = getTableCell(rowIndex, colIndex);
            const border = cell.querySelector('div>span');
            
            applyBackgroundStyle(cell, bgUrl, colOffset, rowOffset);
            setupCellInteraction(border, cell, rowIndex, colIndex);
            
            colIndex++;
        }
        rowIndex++;
        colIndex = 1;
    }
}

function getTableCell(rowIndex, colIndex) {
    return document.querySelector('.tabletop-view').rows[rowIndex].cells[colIndex];
}

function applyBackgroundStyle(cell, bgUrl, xOffset, yOffset) {
    cell.style.backgroundImage = `url('${bgUrl}')`;
    cell.style.backgroundPositionX = `-${xOffset}px`;
    cell.style.backgroundPositionY = `-${yOffset}px`;
}

function setupCellInteraction(border, cell, rowIndex, colIndex) {
    border.classList.add('pathfinding-zone', 'cursor-crosshair');
    border.setAttribute('title', 
        `${map_informations["sector"]["name"]} [y = ${rowIndex - 1}; x = ${colIndex - 1}]`
    );
    
    cell.addEventListener(attribute_touch_mouseover, function() {
        update_target_coord_display(cell);
    });
}

function setupCurrentPlayer() {
    const currentPlayer = findCurrentPlayer();
    
    if (currentPlayer) {
        const { x, y } = currentPlayer.user.coordinates;
        hide_sector_overflow(x, y);
        
        if (!is_user_is_on_mobile_device()) {
            set_pathfinding_event();
        }
        
        document.querySelector('#player-container').classList.remove('hidden');
    }
}

function findCurrentPlayer() {
    return map_informations.pc.find(player => 
        player.user.user === current_user_id
    );
}