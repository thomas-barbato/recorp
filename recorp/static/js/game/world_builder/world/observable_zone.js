function getObservableZone(data = []){
    observable_zone = [];
    let ids = data.length > 0 ? data : map_informations.sector.visible_zone;
    if(data.length > 0){
        ids = data;
    }else{
        for(let i = 0; i < map_informations.pc.length; i++){
            if(map_informations.pc[i].user.user == current_user_id){
                ids = JSON.parse(map_informations.pc[i].ship.visible_zone);
            }
        }
    }

    for (let i = 0; i < ids.length; i++) {
        const element = document.getElementById(ids[i]);
        if(!element.classList.contains('ship-pos')){
            const zone = element.querySelector('#background-out-of-fow');
            if (zone) {
                observable_zone.push(zone);
            }
        }
    }
    return observable_zone;
}

function displayObservableZone(){
    for(let i = 0; i < observable_zone.length; i++){
        observable_zone[i].classList.remove('hidden');
    }
}

function HideObservableZone(){
    for(let i = 0; i < observable_zone.length; i++){
        observable_zone[i].classList.add('hidden');
    }
}