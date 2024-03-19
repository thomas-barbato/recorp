const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
let animation_container_set = new Set();
let animation_set = new Set();

function ship_stationary_animation() {
  let ship = document.querySelectorAll(".ship");
  for (let i = 0; i < ship.length; i++) {
    if (ship[i].style.top === "2px") {
      ship[i].style.top = "0px";
    } else {
      ship[i].style.top = "2px";
    }
  }
}

setInterval(ship_stationary_animation, "1000");

function add_sector_background(background_name){
        let cell = 0;
        let game_rows = document.querySelectorAll('.rows');
        for(let i = 0; i < game_rows.length ; i++){
            let cols = game_rows[i].querySelectorAll('.tile');
            for(let y = 0; y < cols.length ; y++){
                let bg_url = '/static/img/atlas/background/' + background_name + '/' + cell + '.png';
                cols[y].style.backgroundImage = "url('" + bg_url + "')";
                cell++;
            }
        }
}

console.log(map_informations.sector_element);

function add_sector_foreground(sector_element){
    data = [];
    let animation_dir_data = [];
    let animation_type = "";
    let data_i = 1;
    for(var [key, value] in sector_element){
        animation_dir_data.push(sector_element[key]["animations"]);
        animation_type = sector_element[key]["type"];
        let cell = 0;
        let coord_x = parseInt(sector_element[key]["data"]["coord_x"]);
        let coord_y = parseInt(sector_element[key]["data"]["coord_y"]);
        let size_x = parseInt(sector_element[key]["size"]["size_x"]);
        let size_y = parseInt(sector_element[key]["size"]["size_y"]);
        for(let row = sector_element[key]["data"]["coord_y"]; row < coord_y + size_y; row++){
            for(let col = sector_element[key]["data"]['coord_x']; col < coord_x + size_x; col++){
                let entry_point = document.querySelector('.tabletop-view').rows[row].cells[col];
                let div = entry_point.querySelector('div');
                div.classList.add(
                    'foreground-container',
                    'animation-container-'+parseInt(data_i)
                );
                animation_container_set.add('.animation-container-'+parseInt(data_i));
                add_foreground_tiles(
                    animation_type,
                    animation_dir_data,
                    cell,
                    row,
                    col,
                    sector_element[key]["size"]['size_x'],
                    sector_element[key]["size"]['size_y']
                );
                cell++;
            }
        }
        animation_dir_data = [];
        cell = 0;
        data_i++;
    }
}

function display_animation(timer="500"){
    let animation_set_len = animation_set.size;
    let current_elements = "";
    let previous_elements = "";
    let index = 0;
    setInterval( function(){
        const previousIndex = index === 0 ? animation_set_len - 1 : index - 1
        current_elements = document.querySelectorAll('.animation-'+ index);
        previous_elements = document.querySelectorAll('.animation-'+ previousIndex);
        for(let i = 0; i < current_elements.length; i++){
            previous_elements[i].style.display = "none";
            current_elements[i].style.display = "block";
        }
        index++;
        if(index >= animation_set.size){
            index = 0;
        }
    }, timer);
}

function add_foreground_tiles(anim_type, anim_array, cell, row, col, size_x, size_y){
    let temporary_array = [];
    for(let i = 0; i < anim_array.length; i++){
        let animation_i = 0;
        for(let [k, v] in anim_array[i]){
            let fg_animation = document.createElement('img');
            let fg_animation_url = '/static/img/atlas/foreground/' + anim_type + '/' + anim_array[i][k] + '/' + cell + '.png';
            fg_animation.src = fg_animation_url;
            fg_animation.classList.add('animation', 'z-2', 'absolute', 'm-auto', 'left-0', 'right-0', 'no-borders');
            if(size_y > 1 && size_y > 1){
                fg_animation.style.display = "none";
                fg_animation.classList.add('animation-'+animation_i);
            }else{
                fg_animation.style.display = "block";
            }
            animation_set.add('.animation-'+animation_i);
            let entry_point = document.querySelector('.tabletop-view').rows[row].cells[col];
            entry_point.querySelector('div').append(fg_animation);
            animation_i++;
        }
        animation_i=0;
    }
}

window.addEventListener('load', function(event) {
    add_sector_background(map_informations.sector.image);
    add_sector_foreground(map_informations.sector_element);
    display_animation(timer="1000");
});