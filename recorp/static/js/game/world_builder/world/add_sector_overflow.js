function hide_sector_overflow(coord_x, coord_y) {
    const position = {
        x: parseInt(coord_x) + 1,
        y: parseInt(coord_y) + 1
    };

    const limits = getLimits();
    const visibleBounds = calculateVisibleBounds(position, limits);
    updateCellVisibility(visibleBounds);
}

function getLimits() {
    if (user_is_on_mobile_bool) {
        return {
            x: map_informations.screen_sized_map["col"],
            y: map_informations.screen_sized_map["row"]
        };
    }
    
    return {
        x: getLimitX(),
        y: getLimitY()
    };
}

function getLimitX() {
    const width = window.innerWidth;
    
    if (width >= 1680) return 40;
    if (width >= 1560) return 32;
    if (width >= 1280) return 28;
    if (width >= 640) return 20;
    return 10;
}

function getLimitY() {
    const height = window.innerHeight;
    
    if (height >= 1080) return 26;
    if (height >= 963) return 23;
    if (height >= 840) return 22;
    if (height >= 680 ) return 16;
    return 10;
}

function calculateVisibleBounds(position, limits) {
    const halfX = Math.floor(limits.x / 2);
    const halfY = Math.floor(limits.y / 2);

    // ✅ Correction : décale d'une cellule vers la gauche/haut
    // pour recentrer le joueur quand la taille visible est impaire.
    let startX = Math.max(0, position.x - halfX - 1);
    let startY = Math.max(0, position.y - halfY - 1);
    let endX = Math.min(atlas.col, position.x + halfX);
    let endY = Math.min(atlas.row, position.y + halfY);

    // Ajustement des bords
    if (startX === 0) {
        endX = limits.x + 1;
    } else if (endX === atlas.col) {
        startX = atlas.col - (limits.x + 1);
    }

    if (startY === 0) {
        endY = limits.y + 1;
    } else if (endY === atlas.row) {
        startY = atlas.row - (limits.y + 1);
    }

    return { startX, startY, endX, endY };
}

function updateCellVisibility({ startX, startY, endX, endY }) {
    const tableRows = document.querySelector('.tabletop-view').rows;
    
    for (let y = 0; y <= atlas.row; y++) {
        for (let x = 0; x <= atlas.col; x++) {
            const cell = tableRows[y].cells[x];
            const isVisible = (
                ((y >= startY && y <= endY) || y === 0) && 
                ((x >= startX && x <= endX) || x === 0)
            );
            
            cell.classList.toggle("hidden", !isVisible);
        }
    }
}