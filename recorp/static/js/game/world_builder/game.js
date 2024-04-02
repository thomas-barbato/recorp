const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_user_id = JSON.parse(document.getElementById('script_user_id').textContent);
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

function add_sector_foreground(sector_element){
    data = [];
    let animation_dir_data = [];
    let animation_type = "";
    let data_i = 1;
    for(var [key, value] in sector_element){
        console.log(sector_element)
        animation_dir_data.push(sector_element[key]["animations"]);
        animation_type = sector_element[key]["type"];
        animation_type_translated = sector_element[key]["type_translated"];
        let cell = 0;
        let coord_x = parseInt(sector_element[key]["data"]["coord_x"]) ;
        let coord_y = parseInt(sector_element[key]["data"]["coord_y"]);
        let size_x = parseInt(sector_element[key]["size"]["size_x"]);
        let size_y = parseInt(sector_element[key]["size"]["size_y"]);
        let element_data = sector_element[key]["data"];
        let modal = create_modal(
            element_data["name"],
            animation_type_translated
        );
        document.querySelector('#modal-container').append(modal);
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
                    sector_element[key]["size"]['size_y'],
                    element_data
                );
                cell++;
            }
        }
        animation_dir_data = [];
        cell = 0;
        data_i++;
    }
}

function add_foreground_tiles(anim_type, anim_array, cell, row, col, size_x, size_y, element_data){
    let temporary_array = [];
    for(let i = 0; i < anim_array.length; i++){
        let animation_i = 0;
        for(let [k, v] in anim_array[i]){
            let fg_animation = document.createElement('img');
            let fg_animation_url = '/static/img/atlas/foreground/' + anim_type + '/' + anim_array[i][k] + '/' + cell + '.png';
            fg_animation.setAttribute('data-modal-target', "modal-" + element_data["name"]);
            fg_animation.setAttribute('data-modal-toggle', "modal-" + element_data["name"]);
            fg_animation.setAttribute('onclick', "open_close_modal('" + "modal-" + element_data["name"] + "')")
            fg_animation.src = fg_animation_url;
            fg_animation.classList.add('animation', 'z-2', 'absolute', 'm-auto', 'left-0', 'right-0', 'cursor-pointer', 'clickable', 'no-cross', "element");
            if(size_y > 1 && size_y > 1){
                fg_animation.style.display = "none";
                fg_animation.classList.add('animation-'+animation_i,"clickable");
            }else{
                fg_animation.style.display = "block";
            }
            animation_set.add('.animation-'+animation_i);
            let entry_point = document.querySelector('.tabletop-view').rows[row].cells[col];
            entry_point.querySelector('div').style.borderColor = "orange";
            entry_point.querySelector('div').append(fg_animation);
            animation_i++;
        }
        animation_i=0;
    }
}

function add_pc_npc(data){
    let border_color = "";
    for(let i = 0; i < data.length; i++){
        let coord_x = (data[i]["coordinates"]["coord_x"]) + 1;
        let coord_y = (data[i]["coordinates"]["coord_y"]) + 1;
        let entry_point = document.querySelector('.tabletop-view').rows[coord_y].cells[coord_x];
        let div = entry_point.querySelector('div');
        let pc_or_npc_class = data[i]["is_npc"] == true ? "npc" : "pc"
        border_color = "lime";
        if(data[i]["user_id"] != current_user_id && data[i]["is_npc"]){
            border_color = "red";
        }else if(data[i]["user_id"] != current_user_id && !data[i]["is_npc"]){
            border_color = "cyan";
        }

        div.style.borderColor = border_color;

        space_ship = document.createElement('img');
        space_ship.src = "/static/js/game/assets/ships/ship01-32px.png";
        space_ship.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer', 'clickable', 'no-cross', pc_or_npc_class);
        div.append(space_ship);
    }
}

function create_modal(id, elem_type, title=undefined, description=undefined, img=undefined) {
    let e = document.createElement('div');
    e.id = "modal-" + id;
    e.setAttribute('aria-hidden', true);
    e.setAttribute('tabindex', -1);
    e.classList.add(
        'hidden',
        'overflow-y-auto',
        'overflow-x-hidden',
        'fixed',
        'top-0',
        'right-0',
        'left-0',
        'z-50',
        'justify-center',
        'items-center',
        'w-full',
        'h-full',
        'md:inset-0',
        'backdrop-blur-sm',
        'bg-black/20',
        'border-1'
    );
    let container_div = document.createElement('div');
    container_div.classList.add("fixed", "md:p-3", "top-0", "right-0", "left-0", "z-50", "w-full", "md:inset-0", "h-[calc(100%-1rem)]", "max-h-full");
    let content_div = document.createElement('div');
    content_div.classList.add('relative', 'rounded-lg', 'shadow', 'w-full', 'lg:w-1/4', 'w-full', 'rounded-t', 'bg-black/60', 'flex', 'justify-center', 'mx-auto', 'flex-col');
    let header_container_div = document.createElement('div');
    header_container_div.classList.add('items-center', 'md:p-5', 'p-1');
    let header_div = document.createElement('h3');
    header_div.classList.add('lg:text-xl', 'text-md', 'text-center', 'font-shadow', 'font-bold', 'text-emerald-400');
    header_div.textContent = elem_type.toUpperCase();
    let body_container_div = document.createElement('div');
    body_container_div.classList.add('items-center', 'md:p-5', 'p-1');
    body_container_div.textContent = "blibliblibli"


    header_container_div.append(header_div);
    content_div.append(header_container_div);
    content_div.append(body_container_div);
    container_div.append(content_div);
    e.append(container_div);

    return e;
}

function open_close_modal(id){
    let e = document.querySelector('#'+id)
    e.classList.contains("hidden") == true ? e.classList.remove('hidden') : e.classList.add('hidden');
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


window.addEventListener('load', () => {
    let room = map_informations.sector.id;
    let ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var gameSocket = new WebSocket(
        ws_scheme
        + '://'
        + window.location.host
        + "/ws/play_"
        +room
        + "/"
    );

    gameSocket.onopen = function(e){
        console.log("socket opened")
    };

    gameSocket.onclose = function(e) {
        console.log("WebSocket connection closed unexpectedly. Trying to reconnect in 1s...");
        setTimeout(function() {
            console.log("Reconnecting...");
            var chatSocket = new WebSocket(
                ws_scheme
                + '://'
                + window.location.host
                + "/ws/play_"
                +room
                + "/"
            );
        }, 1000);
    };

    add_sector_background(map_informations.sector.image);
    add_sector_foreground(map_informations.sector_element);
    add_pc_npc(map_informations.pc_npc);
    display_animation(timer="500");
});