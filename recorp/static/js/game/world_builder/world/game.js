let gameSocket = "";
const map_informations = JSON.parse(document.getElementById('script_map_informations').textContent);
const current_user_id = JSON.parse(document.getElementById('script_user_id').textContent);
let user_ship_max_speed = {};


let animation_container_set = new Set();
let atlas = {
    "col": 20,
    "row": 15,
    "tilesize": 32,
    "map_width_size": 20 * 32,
    "map_height_size": 15 * 32,
}

function add_sector_background(background_name) {
    let index_row = 1;
    let index_col = 1;
    let bg_url = '/static/img/atlas/background/' + background_name + '/' + '0.png';
    for (let row_i = 0; row_i < atlas.map_height_size; row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < atlas.map_width_size; col_i += atlas.tilesize) {
            let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
            let entry_point_border = entry_point.querySelector('div>span');


            entry_point.style.backgroundImage = "url('" + bg_url + "')";
            entry_point.style.backgroundPositionX = `-${col_i}px`;
            entry_point.style.backgroundPositionY = `-${row_i}px`;

            entry_point_border.classList.add('pathfinding-zone', 'cursor-pointer');
            entry_point_border.setAttribute('title', `${map_informations["sector"]["name"]} [x = ${parseInt(index_col - 1)}; y = ${parseInt(index_row - 1)}]`);

            index_col++;
        }
        index_row++;
        index_col = 1;
    }
}

function add_sector_foreground(sector_element) {
    for (let sector_i = 0; sector_i < sector_element.length; sector_i++) {
        element_type = sector_element[sector_i]["animations"][0];
        element_type_translated = sector_element[sector_i]["type_translated"];
        element_data = sector_element[sector_i]["data"];
        folder_name = sector_element[sector_i]["animations"][1];
        modal_data = {
            "type": sector_element[sector_i].data.type,
            "translated_type": sector_element[sector_i].data.type_translated,
            "animation": {
                "dir": sector_element[sector_i]["animations"][0],
                "img": sector_element[sector_i]["animations"][1],
            },
            "name": sector_element[sector_i].data.name,
            "description": sector_element[sector_i].data.description,
            "resources": {
                "id": sector_element[sector_i].resource.id,
                "name": sector_element[sector_i].resource.name,
                "quantity_str": sector_element[sector_i].resource.quantity_str,
                "quantity": sector_element[sector_i].resource.quantity,
                "translated_text_resource": sector_element[sector_i].resource.translated_text_resource,
                "translated_quantity_str": sector_element[sector_i].resource.translated_quantity_str,
            },
            "faction": {
                "starter": map_informations.sector.faction.is_faction_level_starter,
                "name": map_informations.sector.faction.name,
                "translated_str": map_informations.sector.faction.translated_text_faction_level_starter,
            },
            "coord": {
                "x": sector_element[sector_i].data.coord_x,
                "y": sector_element[sector_i].data.coord_y
            }
        }
        let modal = create_foreground_modal(
            element_data["name"],
            modal_data
        );

        document.querySelector('#modal-container').append(modal);
        let index_row = sector_element[sector_i]['data']['coord_y'];
        let index_col = sector_element[sector_i]['data']['coord_x'];
        let size_x = sector_element[sector_i]['size']["size_x"];
        let size_y = sector_element[sector_i]['size']["size_y"];
        let bg_url = '/static/img/atlas/foreground/' + element_type + '/' + folder_name + '/' + '0.gif';

        for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
                let entry_point = document.querySelector('.tabletop-view').rows[parseInt(index_row)].cells[parseInt(index_col)];
                let entry_point_div = entry_point.querySelector('div');
                let entry_point_border = entry_point.querySelector('span');
                let img_div = document.createElement('div');

                entry_point.classList.add('uncrossable');

                entry_point_border.style.borderColor = "orange";
                entry_point_border.style.borderStyle = "dashed";
                entry_point_border.style.cursor = "pointer";
                entry_point_border.setAttribute('title', `${element_data["name"]} [x: ${parseInt(index_col) - 1}; y: ${parseInt(index_row) - 1}]`);
                entry_point_border.setAttribute('data-modal-target', "modal-" + element_data["name"]);
                entry_point_border.setAttribute('data-modal-toggle', "modal-" + element_data["name"]);
                entry_point_border.setAttribute('onclick', "open_modal('" + "modal-" + element_data["name"] + "')");

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
                img_div.setAttribute('title', `${element_data["name"]} [x: ${parseInt(index_col) - 1}; y: ${parseInt(index_row) - 1}]`);
                img_div.style.backgroundImage = "url('" + bg_url + "')";
                img_div.style.backgroundPositionX = `-${col_i}px`;
                img_div.style.backgroundPositionY = `-${row_i}px`;
                entry_point_div.append(img_div);
                index_col++;
            }
            index_row++;
            index_col = sector_element[sector_i]['data']['coord_x'];
        }
    }
}

function add_pc_npc(data) {
    let border_color = "";

    for (let i = 0; i < data.length; i++) {
        let coord_x = (data[i]["user"]["coordinates"].coord_x);
        let coord_y = (data[i]["user"]["coordinates"].coord_y);
        let ship_size_x = data[i]["ship"]['size'].size_x;
        let ship_size_y = data[i]["ship"]['size'].size_y;

        for (let row_i = 0; row_i < (atlas.tilesize * ship_size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * ship_size_x); col_i += atlas.tilesize) {

                let entry_point = document.querySelector('.tabletop-view').rows[coord_y].cells[coord_x];
                let entry_point_border = entry_point.querySelector('span');
                let div = entry_point.querySelector('div');
                let bg_url = "/static/js/game/assets/ships/" + data[i]["ship"]['image'] + '.png';
                let bg_url_reversed_img = "/static/js/game/assets/ships/" + data[i]["ship"]['image'] + '-reversed.png';
                let space_ship = document.createElement('div');
                let space_ship_reversed = document.createElement('div');

                entry_point.classList.add('uncrossable');
                entry_point_border.style.borderStyle = "double dashed";
                entry_point_border.style.cursor = "pointer";
                entry_point_border.setAttribute('title', `${data[i]["user"]["name"]}`);

                space_ship.style.backgroundImage = "url('" + bg_url + "')";
                space_ship.style.backgroundPositionX = `-${col_i}px`;
                space_ship.style.backgroundPositionY = `-${row_i}px`;

                space_ship_reversed.style.backgroundImage = "url('" + bg_url_reversed_img + "')";
                space_ship_reversed.style.backgroundPositionX = `-${col_i}px`;
                space_ship_reversed.style.backgroundPositionY = `-${row_i}px`;

                if (data[i]["user"]["user"] == current_user_id) {
                    update_user_coord_display(data[i]["user"]["coordinates"].coord_x - 1, data[i]["user"]["coordinates"].coord_y - 1);
                    border_color = "lime";
                    entry_point.classList.add('player-start-pos');
                    space_ship.classList.add('player-ship');
                    space_ship_reversed.classList.add('player-ship-reversed');
                    user_ship_max_speed = data[i]["ship"]['max_speed'];
                }

                let pc_or_npc_class = data[i]["user"]["is_npc"] == true ? "npc" : "pc"

                if (data[i]["user"]["is_npc"]) {
                    border_color = "red";
                    space_ship.classList.add('clickable');
                } else if (data[i]["user"]["user"] != current_user_id && !data[i]["user"]["is_npc"]) {
                    border_color = "cyan";
                    space_ship.classList.add('clickable');
                }

                entry_point_border.style.borderColor = border_color;
                entry_point.classList.add(pc_or_npc_class)
                space_ship.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer', );
                space_ship_reversed.classList.add('w-[32px]', 'h-[32px]', 'cursor-pointer');
                space_ship_reversed.style.display = "none";

                div.append(space_ship);
                div.append(space_ship_reversed);

                coord_x++;

            }
            coord_y++;
            coord_x = data[i]["user"]["coordinates"]["coord_x"];
        }
    }
}

function create_foreground_modal(id, data) {
    console.log(data)
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
    content_div.classList.add('relative', 'rounded-lg', 'shadow', 'w-full', 'lg:w-1/4', 'rounded-t', 'bg-black/70', 'flex', 'justify-center', 'mx-auto', 'flex-col');

    let header_container_div = document.createElement('div');
    header_container_div.classList.add('items-center', 'md:p-5', 'p-1');

    let header_div = document.createElement('h3');
    header_div.classList.add('lg:text-xl', 'text-md', 'text-center', 'font-shadow', 'font-bold', 'text-emerald-400', 'bg-gray-600', 'p-1');
    header_div.textContent = `${data.name.toUpperCase()} (${data.translated_type.toUpperCase()})`;

    let body_container_div = document.createElement('div');
    body_container_div.classList.add('items-center', 'md:p-5', 'p-1');

    let item_img = document.createElement('img');
    item_img.src = `/static/img/atlas/foreground/${data.animation.dir}/${data.animation.img}/0.gif`;
    item_img.style.width = "30%";
    item_img.style.height = "30%";
    item_img.style.margin = "0 auto";

    let item_description_p = document.createElement('p');
    item_description_p.classList.add('text-white', 'text-justify', 'italic', 'p-2', 'lg:p-1', 'md:text-base', 'text-sm');
    item_description_p.textContent = data.description;

    let item_resource_div = document.createElement('div');
    item_resource_div.classList.add('flex')
    if (data.type !== "planet") {
        let item_resource_label = document.createElement('label');
        item_resource_label.htmlFor = "resources";
        item_resource_label.textContent = `${data.resources.translated_text_resource} :`
        item_resource_label.classList.add('font-bold', 'text-white', 'text-justify', 'md:text-base', 'text-sm', 'mt-2')

        let item_resource_content = document.createElement('div');
        item_resource_content.classList.add('flex', 'flex-row');

        item_resource_div.append(item_resource_label);
        item_resource_div.append(item_resource_content);
    } else {
        if (data.faction.starter) {
            let item_faction_label = document.createElement('label');
            item_faction_label.htmlFor = "faction";
            item_faction_label.textContent = `${data.faction.translated_str} ${data.faction.name}`;
            item_faction_label.classList.add('font-bold', 'text-white', 'text-justify', 'md:text-base', 'text-sm', 'mt-2')

            let item_faction_content = document.createElement('div');
            item_faction_content.classList.add('flex', 'flex-row');

            item_resource_div.append(item_faction_label);
            item_resource_div.append(item_faction_content);
        }
    }


    body_container_div.append(item_img);
    body_container_div.append(item_description_p);
    body_container_div.append(item_resource_div);


    header_container_div.append(header_div);
    content_div.append(header_container_div);
    content_div.append(body_container_div);
    container_div.append(content_div);
    e.append(container_div);

    return e;
}

function open_modal(id) {
    let e = document.querySelector('#' + id)
    e.classList.remove('hidden');
}

function update_user_coord_display(x, y) {
    document.querySelector('#player-coord-x').textContent = `x = ${x - 1}`;
    document.querySelector('#player-coord-y').textContent = `y = ${y - 1}`;
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
        if (!pf[i].parentNode.parentNode.classList.contains('uncrossable')) {
            pf[i].setAttribute('onmouseover', 'get_pathfinding(this)');
            pf[i].setAttribute('onclick', 'display_pathfinding()');
        }
    }
}

function reverse_player_ship_display() {
    let player_ship = document.querySelectorAll('.player-start-pos>div>div.player-ship');
    let player_ship_reversed = document.querySelectorAll('.player-start-pos>div>div.player-ship-reversed');

    if (player_ship[0].style.display == "block") {
        for (let i = 0; i < player_ship.length; i++) {
            player_ship[i].style.display = "none";
            player_ship_reversed[i].style.display = "block";
        }
    } else {
        for (let i = 0; i < player_ship.length; i++) {
            player_ship[i].style.display = "block";
            player_ship_reversed[i].style.display = "none";
        }
    }
}


window.addEventListener('load', () => {
    let room = map_informations.sector.id;
    let ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    gameSocket = new WebSocket(
        ws_scheme +
        '://' +
        window.location.host +
        "/ws/play_" +
        room +
        "/"
    );

    gameSocket.onopen = function() {
        console.log("socket opened");
    };

    gameSocket.onclose = function() {
        console.log("WebSocket connection closed unexpectedly. Trying to reconnect in 1s...");
        setTimeout(function() {
            console.log("Reconnecting...");
            var gameSocket = new WebSocket(
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

    let player_start_pos = document.querySelector('.player-start-pos');
    player_start_pos.addEventListener('click', reverse_player_ship_display);
    set_pathfinding_event();

    gameSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        switch (data.type) {
            case "player_move":
                update_player_coord(data.message)
                break;
            case "send_message":
                //sendMessage(data);
                break;
            case "user_leave":
                //userLeave(data);
                break;
            default:
                break;
        }
    };

});


window.addEventListener('DOMContentLoaded', () => {
    update_target_coord_display();
})