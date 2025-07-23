function ship_is_visible(coordY, coordX, sizeY, sizeX){
    if(sizeY == 1 && sizeX == 1){
        return observable_zone_id.includes(`${coordY}_${coordX}`);
    }else{
        let temp_coordX = coordX;
        let temp_coordY = coordY;
        for (let rowOffset = 0; rowOffset < (atlas.tilesize * sizeY); rowOffset += atlas.tilesize) {
            for (let colOffset = 0; colOffset < (atlas.tilesize * sizeX); colOffset += atlas.tilesize) {
                if(observable_zone_id.includes(`${temp_coordX}_${temp_coordX}`)){
                    return true;
                }
                temp_coordX++;
            }
            temp_coordY++;
            temp_coordX = coordX;
        }

        return false;
    }
}