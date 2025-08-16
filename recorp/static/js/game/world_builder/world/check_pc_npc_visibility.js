function ship_is_visible(coordY, coordX, sizeY, sizeX){
    let temp_coordX = coordX - 1;
    let temp_coordY = coordY - 1;
    let max_size_y = atlas.tilesize * sizeY;
    let max_size_x = atlas.tilesize * sizeX;
    if(sizeY == 1 && sizeX == 1){
        return observable_zone_id.includes(`${temp_coordY}_${temp_coordX}`);
    }else{
        for (let rowOffset = 0; rowOffset < max_size_y; rowOffset += atlas.tilesize) {
            for (let colOffset = 0; colOffset < max_size_x; colOffset += atlas.tilesize) {
                if(observable_zone_id.includes(`${temp_coordY}_${temp_coordX}`)){
                    return true;
                }
                temp_coordX++;
            }
            temp_coordY++;
            temp_coordX = coordX;
        }
    }
}