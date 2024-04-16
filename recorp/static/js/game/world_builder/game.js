const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_user_id = JSON.parse(document.getElementById('script_user_id').textContent);

let animation_container_set = new Set();
let atlas = {
    "col": 20,
    "row": 15,
    "tilesize": 32,
    "map_width_size": 20 * 32,
    "map_height_size": 15 * 32,
}

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

function add_sector_background(background_name) {
    let index_row = 1;
    let index_col = 1;
    let game_rows = document.querySelectorAll('.rows');
    let bg_url = '/static/img/atlas/background/' + background_name + '/' + '0.png';
    for (let row_i = 0; row_i < atlas.map_height_size; row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < atlas.map_width_size; col_i += atlas.tilesize) {
            let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
            let entry_point_border = entry_point.querySelector('div>span');


            entry_point.style.backgroundImage = "url('" + bg_url + "')";
            entry_point.style.backgroundPositionX = `-${col_i}px`;
            entry_point.style.backgroundPositionY = `-${row_i}px`;

            entry_point_border.classList.add('hover:bg-slate-300/20', 'pathfinding-zone');
            entry_point_border.setAttribute('title', `${map_informations["sector"]["name"]} [x = ${parseInt(index_col)-1}; y = ${parseInt(index_row)-1}]`);

            index_col++;
        }
        index_row++;
        index_col = 1;
    }
}

function add_sector_foreground(sector_element) {
    let element_data = "";
    let element_type = "";
    let modal = "";
    let animation_container_i = 1;
    let element_type_translated = "";
    for (let sector_i = 0; sector_i < sector_element.length; sector_i++) {
        let animation_dir_data = [];
        animation_dir_data.push(sector_element[sector_i]["animations"]);
        element_type = sector_element[sector_i]["type"];
        element_type_translated = sector_element[sector_i]["type_translated"];
        element_data = sector_element[sector_i]["data"];
        let animation_i = 0;
        modal = create_modal(
            element_data["name"],
            element_type_translated
        );
        document.querySelector('#modal-container').append(modal);
        for (let anim_index in animation_dir_data[0]) {
            let index_row = sector_element[sector_i]['data']['coord_y'];
            let index_col = sector_element[sector_i]['data']['coord_x'];
            let size_x = sector_element[sector_i]['size']["size_x"]
            let size_y = sector_element[sector_i]['size']["size_y"]
            let bg_url = '/static/img/atlas/foreground/' + element_type + '/' + animation_dir_data[0][anim_index] + '/' + '0.png';
            for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
                for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
                    let entry_point = document.querySelector('.tabletop-view').rows[parseInt(index_row) + 1].cells[parseInt(index_col) + 1];
                    let entry_point_div = entry_point.querySelector('div');
                    let entry_point_border = entry_point.querySelector('span');
                    let img_div = document.createElement('div');

                    entry_point.classList.add('uncrossable');

                    entry_point_border.style.borderColor = "orange";
                    entry_point_border.style.borderStyle = "dashed";
                    entry_point_border.style.cursor = "pointer";
                    entry_point_border.setAttribute('title', `${element_data["name"]} [x: ${parseInt(index_col)}; y: ${parseInt(index_row)}]`);
                    entry_point_border.setAttribute('data-modal-target', "modal-" + element_data["name"]);
                    entry_point_border.setAttribute('data-modal-toggle', "modal-" + element_data["name"]);
                    entry_point_border.classList.remove('hover:bg-slate-300/20');
                    entry_point_border.setAttribute('onclick', "open_close_modal('" + "modal-" + element_data["name"] + "')");

                    img_div.classList.add(
                        'relative',
                        'left-0',
                        'right-0',
                        'm-0',
                        'p-0',
                        'w-[32px]',
                        'h-[32px]',
                        'z-1'
                    );
                    img_div.setAttribute('title', `${element_data["name"]} [x: ${parseInt(index_col)}; y: ${parseInt(index_row)}]`);
                    img_div.style.backgroundImage = "url('" + bg_url + "')";
                    img_div.style.backgroundPositionX = `-${col_i}px`;
                    img_div.style.backgroundPositionY = `-${row_i}px`;
                    entry_point_div.append(img_div);
                    if (size_x > 1 && size_y > 1) {
                        img_div.classList.add('animation-' + animation_i);
                        animation_container_set.add('.animation-' + animation_i);
                    }
                    index_col++;
                }
                index_row++;
                index_col = sector_element[sector_i]['data']['coord_x'];
            }
            animation_container_i++;
            animation_i++;
        }
    }
}

function add_pc_npc(data) {
    let border_color = "";
    for (let i = 0; i < data.length; i++) {
        let coord_x = (data[i]["coordinates"]["coord_x"]) + 1;
        let coord_y = (data[i]["coordinates"]["coord_y"]) + 1;
        let entry_point = document.querySelector('.tabletop-view').rows[coord_y].cells[coord_x];
        let entry_point_border = entry_point.querySelector('span');
        let div = entry_point.querySelector('div');

        entry_point.classList.add('uncrossable');

        entry_point_border.style.borderStyle = "double dashed";
        entry_point_border.style.cursor = "pointer";
        entry_point_border.setAttribute('title', `${data[i]["name"]} [x: ${data[i]["coordinates"]["coord_y"]}; y: ${data[i]["coordinates"]["coord_x"]}]`);
        entry_point_border.classList.remove('hover:bg-slate-300/20');

        if (data[i]["user_id"] == current_user_id) {
            update_user_coord_display(data[i]["coordinates"]["coord_x"], data[i]["coordinates"]["coord_y"]);
            border_color = "lime";
            entry_point.classList.add('player-start-pos');
        }

        let pc_or_npc_class = data[i]["is_npc"] == true ? "npc" : "pc"
        if (data[i]["user_id"] != current_user_id && data[i]["is_npc"]) {
            border_color = "red";
        } else if (data[i]["user_id"] != current_user_id && !data[i]["is_npc"]) {
            border_color = "cyan";
        }

        entry_point_border.style.borderColor = border_color;

        space_ship = document.createElement('img');
        space_ship.src = "/static/js/game/assets/ships/ship01-32px.png";
        space_ship.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer', 'clickable', 'uncrossable', pc_or_npc_class);
        div.append(space_ship);
    }
}

function create_modal(id, elem_type, title = undefined, description = undefined, img = undefined) {
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

function open_close_modal(id) {
    let e = document.querySelector('#' + id)
    e.classList.contains("hidden") == true ? e.classList.remove('hidden') : e.classList.add('hidden');
}

function display_animation(timer = "500") {
    let animation_container_set_len = animation_container_set.size;
    let current_elements = "";
    let previous_elements = "";
    let index = 0;
    setInterval(function() {
        const previousIndex = index === 0 ? animation_container_set_len - 1 : index - 1
        current_elements = document.querySelectorAll('.animation-' + index);
        previous_elements = document.querySelectorAll('.animation-' + previousIndex);
        for (let i = 0; i < current_elements.length; i++) {
            previous_elements[i].style.display = "none";
            current_elements[i].style.display = "block";
        }
        index++;
        if (index >= animation_container_set.size) {
            index = 0;
        }
    }, timer);
}

function update_user_coord_display(x, y) {
    document.querySelector('#player-coord-x').textContent = `x = ${x}`;
    document.querySelector('#player-coord-y').textContent = `y = ${y}`;
}

function update_target_coord_display() {
    let selected_tile = document.querySelectorAll('.tile')
    for (let i = 0; i < selected_tile.length; i++) {
        selected_tile[i].addEventListener('mouseover', function() {
            let target_name = this.querySelector('span').title.split(' ')[0];
            let x = this.cellIndex - 1;
            let y = this.parentNode.rowIndex - 1;
            let coord_name = document.querySelector('#target-coord-name');
            let coord_x = document.querySelector('#target-coord-x');
            let coord_y = document.querySelector('#target-coord-y');
            coord_name.textContent = target_name;
            coord_x.textContent = `x = ${x}`;
            coord_y.textContent = `y = ${y}`;
        })
    }
}

function set_pathfinding_event() {
    let pf = document.querySelectorAll('.pathfinding-zone');
    for (let i = 0; i < pf.length; i++) {
        pf[i].setAttribute('onmouseover', 'get_pathfinding(this)');
    }
}


window.addEventListener('load', () => {
    let room = map_informations.sector.id;
    let ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var gameSocket = new WebSocket(
        ws_scheme +
        '://' +
        window.location.host +
        "/ws/play_" +
        room +
        "/"
    );

    gameSocket.onopen = function(e) {
        console.log("socket opened")
    };

    gameSocket.onclose = function(e) {
        console.log("WebSocket connection closed unexpectedly. Trying to reconnect in 1s...");
        setTimeout(function() {
            console.log("Reconnecting...");
            var chatSocket = new WebSocket(
                ws_scheme +
                '://' +
                window.location.host +
                "/ws/play_" +
                room +
                "/"
            );
        }, 1000);
    };

    add_sector_background(map_informations.sector.image);
    add_sector_foreground(map_informations.sector_element);
    add_pc_npc(map_informations.pc_npc);
    display_animation(timer = "500");
    set_pathfinding_event();
});


window.addEventListener('DOMContentLoaded', () => {
    update_target_coord_display();

})