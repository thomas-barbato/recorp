function getObservableZone(data = []){
    observable_zone = [];
    let ids = [];
    if(data.length > 0 ){
        ids = data;
    }else{
        ids = currentPlayer.ship.visible_zone;
    }
    for (let i = 0; i < ids.length; i++) {
        const element = document.getElementById(ids[i]);
        if(!element.classList.contains('ship-pos')){
            const zone = element.querySelector('#field-of-view');
            if (zone) {
                observable_zone.push(zone);
            }
        }
    }
    return [observable_zone, ids];
}