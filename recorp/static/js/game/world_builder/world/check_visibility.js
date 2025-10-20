function checkIfCoordinateIsVisible(data, is_npc = false, is_foreground = false) {
    let sizeX, sizeY, startCoordX, startCoordY;

    if (is_npc) {
        sizeX = parseInt(data.ship.size.x);
        sizeY = parseInt(data.ship.size.y);
        startCoordX = parseInt(data.npc.coordinates.x) - 1;
        startCoordY = parseInt(data.npc.coordinates.y) - 1;
    } else if (is_foreground) {
        sizeX = parseInt(data.size.x);
        sizeY = parseInt(data.size.y);
        startCoordX = parseInt(data.coordinates.x) - 1;
        startCoordY = parseInt(data.coordinates.y) - 1;
    } else {
        sizeX = parseInt(data.ship.sizeX);
        sizeY = parseInt(data.ship.sizeY);
        startCoordX = parseInt(data.coordinates.x) - 1;
        startCoordY = parseInt(data.coordinates.y) - 1;
    }

    const endCoordX = startCoordX + sizeX;
    const endCoordY = startCoordY + sizeY;

    for (let row = startCoordY; row < endCoordY; row++) {
        for (let col = startCoordX; col < endCoordX; col++) {
            if (observable_zone_id.includes(`${row}_${col}`)) {
                return true;
            }
        }
    }

    return false;
}