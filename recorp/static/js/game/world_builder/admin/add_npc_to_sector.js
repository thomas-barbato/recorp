const csrf_token = document.getElementById('csrf_token').value;
const npc_template = JSON.parse(document.getElementById('script_npc_template').textContent);
let atlas = {
    "col": 40,
    "row": 40,
    "tilesize": 32,
    "map_width_size": 40 * 32,
    "map_height_size": 40 * 32,
}


function clean_entire_map() {
    let tiles = document.querySelectorAll('.tile');
    let foreground_container = document.querySelectorAll('.foreground-container');
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].style.backgroundImage = "";
    }
    for (let i = 0; i < foreground_container.length; i++) {
        let img = foreground_container[i].querySelector('div')
        if (img) {
            img.remove();
        }
    }
}

function add_background(folder_name) {
    let tile_map = document.querySelectorAll('.tile');
    let index_row = 1;
    let index_col = 1;
    let bg_url = '/static/img/atlas/background/' + folder_name + '/' + '0.gif';
    for (let row_i = 0; row_i < atlas.map_height_size; row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < atlas.map_width_size; col_i += atlas.tilesize) {
            let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
            entry_point.style.backgroundImage = "url('" + bg_url + "')";
            entry_point.style.backgroundPositionX = `-${col_i}px`;
            entry_point.style.backgroundPositionY = `-${row_i}px`;
            index_col++;
        }
        index_row++;
        index_col = 1;
    }

    for (let i = 0; i < tile_map.length; i++) {
        tile_map[i].addEventListener('click', function() {
            get_spaceship_data(tile_map[i].id);
        })
    }
}

function add_foreground(obj) {
    for (let obj_i in obj) {
        let index_row = parseInt(obj[obj_i].data.coord_y);
        let index_col = parseInt(obj[obj_i].data.coord_x);
        let bg_url = '/static/img/atlas/foreground/' + obj[obj_i].item_data[1].type + '/' + obj[obj_i].item_data[1].animation + '/' + '0.gif';
        for (let row_i = 0; row_i < (atlas.tilesize * obj[obj_i].item_data[2].size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * obj[obj_i].item_data[2].size_x); col_i += atlas.tilesize) {

                let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                let entry_point_div = entry_point.querySelector('div');

                entry_point_div.classList.add(
                    'foreground-container',
                );

                let img_div = document.createElement('div');
                img_div.classList.add(
                    'm-auto',
                    'w-[32px]',
                    'h-[32px]',
                    'hover:w-[30px]',
                    'hover:h-[30px]',
                );
                img_div.style.borderStyle = "dashed solid blue";
                img_div.style.backgroundImage = "url('" + bg_url + "')";
                img_div.style.backgroundPositionX = `-${col_i}px`;
                img_div.style.backgroundPositionY = `-${row_i}px`;
                entry_point_div.append(img_div);
                index_col++;
            }
            index_row++;
            index_col = parseInt(obj[obj_i].data.coord_x);
        }
    }
}


function load_map_data(obj) {
    let sector_bg_image = obj.sector.image;
    add_background(sector_bg_image);
    add_foreground(obj.sector_element);


}

let add_npc_select_choice_btn = document.querySelector('#add-a-npc-container-select');
add_npc_select_choice_btn.addEventListener('click', function() {
    let npc_container_content = document.querySelector('#npc-container-content');
    let npc_container_len = document.querySelectorAll(".npc-container-content-item").length;

    let npc_container_content_item = document.createElement('div');
    let npc_container_content_item_h4 = document.createElement('h4');
    let npc_container_content_item_select_div_container = document.createElement('div');
    let npc_container_content_item_select_div_subcontainer = document.createElement('div');
    let npc_container_content_item_select_div_subcontainer_label = document.createElement('label');
    let npc_container_content_item_select_div_subcontainer_select = document.createElement('select');
    let npc_container_content_item_input_div_container = document.createElement('div');
    let npc_container_content_item_input_div_subcontainer = document.createElement('div');

    let npc_container_content_item_input_div_subcontainer_radio = document.createElement('div');
    let npc_container_content_item_input_div_subcontainer_radio_input = document.createElement('input');
    let npc_container_content_item_input_div_subcontainer_radio_label = document.createElement('label');
    let npc_container_content_item_input_div_subcontainer_btn = document.createElement('div');
    let npc_container_content_item_input_div_subcontainer_btn_i_delete = document.createElement('i');


    npc_container_content_item.id = `npc-container-item-${npc_container_len}`;
    npc_container_content_item.classList.add(
        "w-full",
        "gap-1",
        "flex",
        "flex-col",
        "bg-gray-600",
        "border",
        "border-white",
        "mb-1",
        "p-2",
        "npc-container-content-item"
    );

    npc_container_content_item_h4.classList.add('text-center', 'font-bold');


    npc_container_content_item_select_div_container.classList.add('flex', 'flex-row');

    npc_container_content_item_select_div_subcontainer.classList.add('npc-container-content-div', 'flex', 'flex-col', 'gap-2', 'w-full', 'mx-auto');

    npc_container_content_item_select_div_subcontainer_label.for = "npc-container-select";
    npc_container_content_item_select_div_subcontainer_label.classList.add("font-bold");
    npc_container_content_item_select_div_subcontainer_label.textContent = "Select a NPC template";

    npc_container_content_item_select_div_subcontainer_select.classList.add('npc-select');
    npc_container_content_item_select_div_subcontainer_select.name = "npc-select";

    for (let i = 0; i < npc_template.length; i++) {
        let npc_container_content_item_select_div_subcontainer_select_options = document.createElement('option');
        npc_container_content_item_select_div_subcontainer_select_options.id = `template-${npc_template[i].pk}`;
        npc_container_content_item_select_div_subcontainer_select_options.value = npc_template[i].pk;
        npc_container_content_item_select_div_subcontainer_select_options.textContent = npc_template[i].fields.name;
        npc_container_content_item_select_div_subcontainer_select.append(npc_container_content_item_select_div_subcontainer_select_options);
    }

    npc_container_content_item_select_div_subcontainer.append(npc_container_content_item_select_div_subcontainer_label);
    npc_container_content_item_select_div_subcontainer.append(npc_container_content_item_select_div_subcontainer_select);
    npc_container_content_item_select_div_container.append(npc_container_content_item_select_div_subcontainer);

    npc_container_content_item_input_div_container.classList.add("flex", "flex-col", "items-center");
    npc_container_content_item_input_div_subcontainer.classList.add("npc-container-content-div-input", "flex", "flex-col", "gap-1", "mx-auto");


    npc_container_content_item_input_div_subcontainer_radio.classList.add("flex", "flex-row", "gap-2");
    npc_container_content_item_input_div_subcontainer_radio_label.classList.add("font-bold", "text-center");
    npc_container_content_item_input_div_subcontainer_radio_label.textContent = "Activate this template";
    npc_container_content_item_input_div_subcontainer_radio_label.for = `activate-${npc_container_len}`;
    npc_container_content_item_input_div_subcontainer_radio_input.type = "radio";
    npc_container_content_item_input_div_subcontainer_radio_input.id = `activate-${npc_container_len}`;
    npc_container_content_item_input_div_subcontainer_radio_input.name = "template-activate";

    npc_container_content_item_input_div_subcontainer_radio.append(npc_container_content_item_input_div_subcontainer_radio_label);
    npc_container_content_item_input_div_subcontainer_radio.append(npc_container_content_item_input_div_subcontainer_radio_input);



    npc_container_content_item_input_div_subcontainer_btn_i_delete.classList.add('fa-solid', 'fa-trash', 'fa-2x', 'cursor-pointer', 'text-red-600', 'delete-this-select', 'mt-2', 'mx-auto');
    npc_container_content_item_input_div_subcontainer_btn_i_delete.id = `delete-${npc_container_len}`;
    npc_container_content_item_input_div_subcontainer_btn_i_delete.addEventListener('click', function() {
        let this_id = this.id.split('-')[1];
        document.querySelector(`#npc-container-item-${this_id}`).remove();
    })

    npc_container_content_item_input_div_subcontainer.append(npc_container_content_item_input_div_subcontainer_radio);
    npc_container_content_item_input_div_subcontainer.append(npc_container_content_item_input_div_subcontainer_btn_i_delete);

    npc_container_content_item_input_div_subcontainer_btn.append(npc_container_content_item_input_div_subcontainer_btn_i_delete);

    npc_container_content_item_input_div_container.append(npc_container_content_item_input_div_subcontainer);
    npc_container_content_item_input_div_container.append(npc_container_content_item_input_div_subcontainer_btn);

    npc_container_content_item.append(npc_container_content_item_h4);
    npc_container_content_item.append(npc_container_content_item_select_div_container);
    npc_container_content_item.append(npc_container_content_item_input_div_container);

    npc_container_content.append(npc_container_content_item);
})

function add_spaceship_on_map(obj) {
    let data = obj.data;
    console.log(data)
    let index_row = parseInt(obj.pos.y) + 1;
    let index_col = parseInt(obj.pos.x) + 1;
    let bg_url = '/static/js/game/assets/ships/' + data.image + '.png';

    for (let row_i = 0; row_i < (atlas.tilesize * data.ship_category_id__ship_size.size_y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * data.ship_category_id__ship_size.size_x); col_i += atlas.tilesize) {

            let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
            let entry_point_div = entry_point.querySelector('div');

            entry_point_div.classList.add(
                'foreground-container',
            );

            let img_div = document.createElement('div');
            img_div.classList.add(
                'm-auto',
                'w-[32px]',
                'h-[32px]',
                'hover:w-[30px]',
                'hover:h-[30px]',
            );
            img_div.style.borderStyle = "dashed solid blue";
            img_div.style.backgroundImage = "url('" + bg_url + "')";
            img_div.style.backgroundPositionX = `-${col_i}px`;
            img_div.style.backgroundPositionY = `-${row_i}px`;
            entry_point_div.append(img_div);
            index_col++;
        }
        index_row++;
        index_col = parseInt(obj.pos.x) + 1;
    }
}

function get_spaceship_data(tile_id) {

    let tile_id_split = tile_id.split('_')
    let sector_selection = document.querySelector('#sector-select');
    let selected_sector_id = sector_selection.options[sector_selection.selectedIndex].value;

    if (selected_sector_id != "none") {

        let radio_selected = document.getElementsByName('template-activate');
        let id = undefined;
        for (let i = 0; i < radio_selected.length; i++) {
            if (radio_selected[i].checked) {
                id = radio_selected[i].id.split('-')[1]
            }
        }
        let main_container = document.querySelector(`#npc-container-item-${id}`);
        let ship_select = main_container.querySelector('select');
        let selected_ship_id = ship_select.options[ship_select.selectedIndex].value;

        let url = 'get_ship_data';
        const headers = new Headers({
            'Content-Type': 'x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf_token
        });
        fetch(url, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ 'template_id': selected_ship_id })
            }).then(response => response.json())
            .then(data => {
                let spaceship_data = {
                    data: JSON.parse(data),
                    pos: {
                        x: tile_id_split[0],
                        y: tile_id_split[1]
                    }
                }
                add_spaceship_on_map(spaceship_data);
            })
            .catch(error => console.error(error));
    }
}


let sector_selection = document.querySelector('#sector-select');
sector_selection.addEventListener('change', function() {
    let map_id = this.value;
    let map_name = this.options[this.selectedIndex].text;
    let modal_item_title = document.querySelector('#delete-item-title');
    modal_item_title.textContent = map_name + " (" + map_id + ") ";
    if (map_id !== "none") {
        let url = 'npc';
        const headers = new Headers({
            'Content-Type': 'x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf_token
        });
        fetch(url, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ 'map_id': map_id })
            }).then(response => response.json())
            .then(data => {
                clean_entire_map()
                load_map_data(JSON.parse(data));
            })
            .catch(error => console.error(error));
    } else {
        clean_entire_map()
    }
})