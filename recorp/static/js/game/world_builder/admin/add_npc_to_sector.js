const csrf_token = document.getElementById('csrf_token').value;
const npc_template = JSON.parse(document.getElementById('script_npc_template').textContent);
let atlas = {
    "col": 40,
    "row": 40,
    "tilesize": 32,
    "map_width_size": 40 * 32,
    "map_height_size": 40 * 32,
}

let spaceship_collection = [];
let added_spaceship_count = 0;


function clean_entire_map() {

    let tiles = document.querySelectorAll('.tile');
    let npc_container = document.querySelector('#npc-container-content');
    npc_container.innerHTML = "";
    spaceship_collection = [];

    for (let i = 0; i < tiles.length; i++) {
        tiles[i].style.backgroundImage = "";
        tiles[i].innerHTML = "";
        new_div = document.createElement('div')
        new_div.classList = "relative w-[32px] h-[32px] hover:border hover:border-amber-400 border-dashed block hover:bg-slate-300/10";
        tiles[i].append(new_div)
    }
}

function add_background(folder_name) {
    let tile_map = document.querySelectorAll('.tile');
    let index_row = 1;
    let index_col = 1;
    let bg_url = '/static/img/background/' + folder_name + '/' + '0.gif';
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
        let index_row = parseInt(obj[obj_i].coordinates.y);
        let index_col = parseInt(obj[obj_i].coordinates.x);
        let item_type = obj[obj_i].type == "warpzone" ? "warpzone" : obj[obj_i].type;
        let item_animation = obj[obj_i].item_name;
        let size_x = obj[obj_i].size.x;
        let size_y = obj[obj_i].size.y;
        
        let bg_url = `/static/img/foreground/${item_type}/${item_animation}/0.gif`;
        for (let row_i = 0; row_i < (atlas.tilesize * size_y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * size_x); col_i += atlas.tilesize) {
            
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
            index_col = parseInt(obj[obj_i].coordinates.x);
        }
    }
}


function load_map_data(obj) {
    let sector_bg_image = obj.sector.image;
    add_background(sector_bg_image);
    add_foreground(obj.sector_element);
    load_npc_on_map(obj.npc);
    load_npc_menu();
}

function load_npc_menu() {
    let npc_container_content = document.querySelector('#npc-container-content');

    let npc_container_content_item = document.createElement('div');
    let npc_container_content_item_h4 = document.createElement('h4');
    let npc_container_content_item_select_div_container = document.createElement('div');
    let npc_container_content_item_select_div_subcontainer = document.createElement('div');
    let npc_container_content_item_select_div_subcontainer_label = document.createElement('label');
    let npc_container_content_item_select_div_subcontainer_select = document.createElement('select');
    let npc_container_content_item_data_div_container = document.createElement('div');
    let spaceship_data_container = document.createElement('div');


    npc_container_content_item.id = 'npc-container';
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
    npc_container_content_item_select_div_subcontainer_select.addEventListener('change', function() {
        let template_selection = this;
        let selected_template_id = template_selection.options[template_selection.selectedIndex].value;
        let selection_display = document.querySelectorAll('.template-selection');
        for (let i = 0; i < selection_display.length; i++) {
            if (selection_display[i].id != `spaceship-data-${selected_template_id}`) {
                selection_display[i].classList.add('hidden');
            } else {
                selection_display[i].classList.remove('hidden');
            }
        }
    })

    for (let i = 0; i < npc_template.length; i++) {
        let npc_container_content_item_select_div_subcontainer_select_options = document.createElement('option');
        npc_container_content_item_select_div_subcontainer_select_options.id = `template-${npc_template[i].id}`;
        npc_container_content_item_select_div_subcontainer_select_options.value = npc_template[i].id;
        npc_container_content_item_select_div_subcontainer_select_options.textContent = npc_template[i].name;
        npc_container_content_item_select_div_subcontainer_select.append(npc_container_content_item_select_div_subcontainer_select_options);

        let spaceship_data_container_li = document.createElement('li');
        let spaceship_data_container_li_ul_hp = document.createElement('ul');
        let spaceship_data_container_li_ul_img = document.createElement('ul')
        let spaceship_data_container_li_ul_img_file = document.createElement('img')
        let spaceship_data_container_li_ul_movement = document.createElement('ul');
        let spaceship_data_container_li_ul_difficulty = document.createElement('ul');
        let spaceship_data_container_li_ul_missileDefense = document.createElement('ul');
        let spaceship_data_container_li_ul_thermalDefense = document.createElement('ul');
        let spaceship_data_container_li_ul_ballisticDefense = document.createElement('ul');
        let spaceship_data_container_li_ul_behavior = document.createElement('ul');

        spaceship_data_container_li.id = `spaceship-data-${npc_template[i].id}`;

        if (i == 0) {
            spaceship_data_container_li.classList.add('list-none', 'template-selection');
        } else {
            spaceship_data_container_li.classList.add('list-none', 'hidden', 'template-selection');
        }

        spaceship_data_container_li_ul_img_file.src = '/static/img/foreground/SHIPS/' + npc_template[i].ship_id__image + '.png';
        spaceship_data_container_li_ul_hp.textContent = `HP: ${npc_template[i].max_hp}`;
        spaceship_data_container_li_ul_movement.textContent = `MOVEMENT: ${npc_template[i].max_movement}`;
        spaceship_data_container_li_ul_difficulty.textContent = `DIFFICULTY: ${npc_template[i].difficulty}`;
        spaceship_data_container_li_ul_missileDefense.textContent = `MISSILE DEF: ${npc_template[i].max_missile_defense}`;
        spaceship_data_container_li_ul_thermalDefense.textContent = `THERMAL DEF: ${npc_template[i].max_thermal_defense}`;
        spaceship_data_container_li_ul_ballisticDefense.textContent = `BALLISTIC DEF: ${npc_template[i].max_ballistic_defense}`;
        spaceship_data_container_li_ul_behavior.textContent = `BEHAVIOR: ${npc_template[i].behavior}`;

        spaceship_data_container_li_ul_img.append(spaceship_data_container_li_ul_img_file);

        spaceship_data_container_li.append(spaceship_data_container_li_ul_img);
        spaceship_data_container_li.append(spaceship_data_container_li_ul_hp);
        spaceship_data_container_li.append(spaceship_data_container_li_ul_movement);
        spaceship_data_container_li.append(spaceship_data_container_li_ul_difficulty);
        spaceship_data_container_li.append(spaceship_data_container_li_ul_missileDefense);
        spaceship_data_container_li.append(spaceship_data_container_li_ul_thermalDefense);
        spaceship_data_container_li.append(spaceship_data_container_li_ul_ballisticDefense);
        spaceship_data_container_li.append(spaceship_data_container_li_ul_behavior);

        spaceship_data_container.append(spaceship_data_container_li);

    }

    npc_container_content_item_select_div_subcontainer.append(npc_container_content_item_select_div_subcontainer_label);
    npc_container_content_item_select_div_subcontainer.append(npc_container_content_item_select_div_subcontainer_select);
    npc_container_content_item_select_div_container.append(npc_container_content_item_select_div_subcontainer);

    npc_container_content_item_data_div_container.classList.add("flex", "flex-col", "items-center");
    spaceship_data_container.classList.add("npc-container-content-div-input", "flex", "flex-col", "gap-1", "mx-auto");

    npc_container_content_item_data_div_container.append(spaceship_data_container);

    npc_container_content_item.append(npc_container_content_item_h4);
    npc_container_content_item.append(npc_container_content_item_select_div_container);
    npc_container_content_item.append(npc_container_content_item_data_div_container);

    npc_container_content.append(npc_container_content_item);
}

function tile_already_used(obj) {
    let row = parseInt(obj.pos.y) + 1;
    let col = parseInt(obj.pos.x) + 1;

    let response = false;
    for (let row_i = 0; row_i < (atlas.tilesize * obj.data.ship_id__ship_category_id__size.y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * obj.data.ship_id__ship_category_id__size.x); col_i += atlas.tilesize) {
            let entry_point = document.querySelector('.tabletop-view').rows[row].cells[col];
            let entry_point_border = entry_point.querySelector('div');
            let entry_point_div = entry_point_border.querySelector('div')
            if (entry_point_div) {
                response = true;
            }
            col++;
        }
        row++;
        col = parseInt(obj.pos.x) + 1;
    }

    return response;
}

function delete_this_ship_or_pass(tile_id) {

    let entry_point = document.getElementById(tile_id);
    let entry_point_div = entry_point.querySelector('div');
    let spaceship_tile_class = undefined;

    if (entry_point_div.classList.contains('foreground-container')) {
        if (/spaceship-/.test(entry_point_div.className)) {

            spaceship_tile_class = entry_point_div.className.split(" ").filter(c => c.startsWith("spaceship-"))[0];
            document.querySelectorAll(`.${spaceship_tile_class}`).forEach(e => e.remove());
            
            for (let ship in spaceship_collection) {
                if (spaceship_collection[ship].ship_id_on_map == spaceship_tile_class) {
                    spaceship_collection.splice(ship, 1);
                    break;
                }
            }
        }
    }
}

function load_npc_on_map(obj) {
    for (let obj_i in obj) {
        let spaceship_obj = {
            data: {
                id: obj[obj_i].id,
                image: obj[obj_i].image,
                name: obj[obj_i].name,
                size: obj[obj_i].size,
                template_pk: obj[obj_i].template_pk,
                spaceship_uuid: crypto.randomUUID()
            },
            pos: obj[obj_i].coordinates,
        }
        let index_row = parseInt(spaceship_obj.pos.y) + 1;
        let index_col = parseInt(spaceship_obj.pos.x) + 1;
        let bg_url = '/static/img/foreground/ships/' + spaceship_obj.data.image + '.png';

        for (let row_i = 0; row_i < (atlas.tilesize * spaceship_obj.data.size.y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * spaceship_obj.data.size.x); col_i += atlas.tilesize) {

                let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                let entry_point_div = entry_point.querySelector('div');
                spaceship_class = `spaceship-${spaceship_obj.data.spaceship_uuid}`;

                entry_point_div.classList.add(
                    'foreground-container',
                    'cursor-pointer',
                    spaceship_class
                );
                
                if(entry_point_div.querySelector('div')){

                    let img_div = entry_point_div.querySelector('div')
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

                }else{

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
                }
                index_col++;
            }

            index_row++;
            index_col = parseInt(spaceship_obj.pos.x) + 1;
        }

        spaceship_obj.ship_id_on_map = spaceship_class;
        spaceship_collection.push(spaceship_obj);
    }
}

function add_spaceship_on_map(obj) {
    let index_row = parseInt(obj.pos.y) + 1;
    let index_col = parseInt(obj.pos.x) + 1;
    let bg_url = '/static/img/foreground/SHIPS/' + obj.data.ship_id__image + '.png';
    let spaceship_class = undefined;
    let id_uuid = crypto.randomUUID();

    for (let row_i = 0; row_i < (atlas.tilesize * obj.data.ship_id__ship_category_id__size.y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * obj.data.ship_id__ship_category_id__size.x); col_i += atlas.tilesize) {

            let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
            let entry_point_div = entry_point.querySelector('div');
            spaceship_class = `spaceship-${id_uuid}`;

            entry_point_div.classList.add(
                'foreground-container',
                'cursor-pointer',
                spaceship_class
            );

            if(entry_point_div.querySelector('div')){

                let img_div = entry_point_div.querySelector('div')
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

            }else{

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
            }

            index_col++;
        }

        index_row++;
        index_col = parseInt(obj.pos.x) + 1;
    }

    obj.ship_id_on_map = spaceship_class;
    if(!spaceship_collection.includes(obj)){
        spaceship_collection.push(obj);
    }else{
        console.log("already_inside")
    }

}

function get_spaceship_data(tile_id) {
    let tile_id_split = tile_id.split('_')
    let sector_selection = document.querySelector('#sector-select');
    let selected_sector_id = sector_selection.options[sector_selection.selectedIndex].value;

    if (selected_sector_id != "none") {

        let main_container = document.querySelector('#npc-container');
        let template_select = main_container.querySelector('select');
        let selected_template_id = template_select.options[template_select.selectedIndex].value;

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
                body: JSON.stringify({ 'template_id': selected_template_id })
            }).then(response => response.json())
            .then(data => {
                let spaceship_data = {
                    data: JSON.parse(data),
                    pos: {
                        y: tile_id_split[1],
                        x: tile_id_split[0]
                    }
                }
                if (!tile_already_used(spaceship_data)) {
                    add_spaceship_on_map(spaceship_data);
                } else {
                    delete_this_ship_or_pass(tile_id)
                }

            })
            .catch(error => console.error(error));
    }
}

let sector_selection = document.querySelector('#sector-select');
sector_selection.addEventListener('change', function() {
    clean_entire_map();
    let map_id = this.value;
    spaceship_collection = [];
    added_spaceship_count = 0;
    if (map_id !== "none") {
        document.querySelector('#validate-btn').classList.remove('hidden');
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
                load_map_data(JSON.parse(data));
            })
            .catch(error => console.error(error));
    } else {
        window.location.reload();
    }
})

let validate_btn = document.querySelector("#validate-btn");
validate_btn.addEventListener('click', function() {
    let sector_selection = document.querySelector('#sector-select');
    let selected_sector_id = sector_selection.options[sector_selection.selectedIndex].value;
    if (selected_sector_id != "none") {
        let url = 'npc_assign_update';
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
            body: JSON.stringify({
                'map_id': selected_sector_id,
                'data': spaceship_collection,
            })
        })
    }
})