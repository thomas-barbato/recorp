    let element = document.querySelector('#foreground-menu-container-1');
    const animations_json = JSON.parse(document.getElementById('script_animation_data').textContent);
    const csrf_token = document.getElementById('csrf_token').value;
    let dict = [];

    let atlas = {
        "col": 40,
        "row": 40,
        "tilesize": 32,
        "map_width_size": 40 * 32,
        "map_height_size": 40 * 32,
    }

    Set.prototype.getByIndex = function(index) { return [...this][index]; }

    function display_faction_choice() {
        let faction_starter = document.querySelector('#faction-starter');
        let faction_owner = document.querySelector('#owned-by-faction');
        document.querySelector('#faction-select').style.display = "none";
        if (faction_starter.checked || faction_owner.checked) {
            document.querySelector('#faction-select').style.display = "block";
        }
    }

    let faction_starter = document.querySelector('#faction-starter');
    let owned_by_faction = document.querySelector('#owned-by-faction');
    faction_starter.addEventListener('change', display_faction_choice);
    owned_by_faction.addEventListener('change', display_faction_choice);

    function set_element_value(id, selected_value) {
        let e = document.querySelector('#' + id);
        e.value = selected_value;
    }

    function check_uncheck(name, check_value) {
        let e = document.querySelector("input[name=" + name + "]");
        check_value === true ? e.checked = true : e.checked = false;
    }

    function clean_entire_map() {
        let f_id_check = false;
        let f_starter_check = false;

        set_element_value("background", "1");
        set_element_value("sector-description", "");
        set_element_value('sector-name', "");
        set_element_value('security-level', "1");
        check_uncheck("owned-by-faction", f_id_check);
        check_uncheck("faction-starter", f_starter_check);

        document.querySelector('#faction-select').style.display = "none";


        let fg_menu = document.querySelectorAll('.foreground-menu-container');
        for (let i = 0; i < fg_menu.length; i++) {
            fg_menu[i].remove();
        }

        let tiles = document.querySelectorAll('.tile');
        for (let i = 0; i < tiles.length; i++) {
            tiles[i].style.backgroundImage = "";
        }

        let fg_container = document.querySelectorAll('.foreground-container');
        if (fg_container.length > 0) { clear_foreground() };
    }

    function load_map_data(object) {
        let f_id_check = false;
        let f_starter_check = false;
        set_element_value("background", object['sector']['image']);
        set_element_value('sector-name', object['sector']['name']);

        object['faction']['id'] !== null ? f_id_check = true : f_id_check = false;
        object['faction']['is_faction_level_starter'] === true ? f_starter_check = true : f_starter_check = false;

        check_uncheck("owned-by-faction", f_id_check);
        check_uncheck("faction-starter", f_starter_check);
        display_faction_choice();

        set_element_value('faction-choice', object['faction']['faction_id']);
        set_element_value('security-level', object['sector']['security_id']);
        set_element_value('sector-description', object['sector']['description']);

        let fg_menu = document.querySelectorAll('.foreground-menu-container');
        for (let i = 0; i < fg_menu.length; i++) {
            fg_menu[i].remove();
        }

        let fg_container = document.querySelectorAll('.foreground-container');
        if (fg_container.length > 0) { clear_foreground() };
        for (let obj_fg in object['sector_element']) {
            append_foreground_menu(element, pre_existing_data = object['sector_element'][obj_fg]);
        }

    }

    let sector_selection = document.querySelector('#sector-select');
    sector_selection.addEventListener('change', function() {
        let map_id = this.value;
        let map_name = this.options[this.selectedIndex].text;
        let modal_item_title = document.querySelector('#delete-item-title');
        modal_item_title.textContent = map_name + " (" + map_id + ") ";
        let trash_element = document.querySelector('.fa-trash');
        if (map_id !== "none") {
            trash_element.style.display = "block";
            let url = 'sector_data'
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
            clean_entire_map()
            trash_element.style.display = "none";
        }
    })

    function append_foreground_menu(element, pre_existing_data = undefined) {
        if (document.querySelectorAll('.foreground-menu-container').length > 0) {
            let fg_menu = document.querySelectorAll('.foreground-menu-container')
            let next_id_value = parseInt(fg_menu[fg_menu.length - 1].id.split('-')[3]) + 1;
            let clone = element.cloneNode(true);
            clone.id = "foreground-menu-container-" + next_id_value;
            let clone_item_nb = clone.querySelector('#item-nb');
            clone_item_nb.innerText = "ITEM #" + next_id_value.toString();

            let clone_foreground_menu = clone.querySelector('.foreground-menu-item');
            clone_foreground_menu.id = "foreground-menu-item-" + next_id_value;

            let clone_radio = clone.querySelector('input[type=radio]');
            clone_radio.id = "coord-radio-button-" + next_id_value;

            let clone_item_id = clone.querySelector('input[type=hidden]');
            clone_item_id.value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['item_id'] : 0;

            let clone_coord_x = clone.querySelector('.coord-x > input');
            clone_coord_x.id = "coord-x-" + next_id_value;
            clone_coord_x.value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['data']['coord_x'] : 0;

            let clone_coord_y = clone.querySelector('.coord-y > input');
            clone_coord_y.id = "coord-y-" + next_id_value;
            clone_coord_y.value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['data']['coord_y'] : 0;

            let clone_warp_sector = clone.querySelector('#fg-warp-sector');
            if(typeof pre_existing_data == 'undefined' || pre_existing_data["type"] != "warpzone"){
                clone_warp_sector.classList.add('hidden');
            }else{
                clone_warp_sector.value = pre_existing_data['item_id'];
            }

            let fg_item_selector = clone.querySelector(".fg-item-selector");
            fg_item_selector.id = "fg-item-selector-" + next_id_value;
            fg_item_selector.addEventListener("change", function() {
                let text = this.options[this.selectedIndex].text;
                let value = this.options[this.selectedIndex].value;
                let parent = fg_item_selector.parentNode.parentNode;
                let fg_warp_element = parent.querySelector('#fg-warp-sector');
                value == "warpzone_data" ? fg_warp_element.classList.remove('hidden') : fg_warp_element.classList.add('hidden');
                display_select_animation_preview(text, value, fg_item_selector.id);
                let item_id = clone.querySelector('input[name=item-id]')
                item_id.value = text;
            })

            let fg_item_name = clone.querySelector(".item-name");
            fg_item_name.id = "item-name-" + next_id_value;
            fg_item_name.value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['data']['name'] : "";

            let item_description = clone.querySelector('.item-description')
            item_description.id = "item-description-" + next_id_value;
            item_description.value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['data']['description'] : "";

            clone.querySelector(".trash-it").id = "trash-" + next_id_value;

            let preview_selector = clone.querySelector("#preview-animation");
            preview_selector.innerHTML = "";
            if (typeof pre_existing_data !== "undefined") {
                clone.querySelector('input[name=item-id]').value = pre_existing_data['item_id'];
            }

            let last_element = Array.from(document.querySelectorAll('.foreground-menu-container')).pop();
            last_element.after(clone);

            if (typeof pre_existing_data !== "undefined") {
                fg_item_selector.selectedIndex = [...fg_item_selector.options].findIndex(option => option.text === pre_existing_data['item_name']);
                let text = fg_item_selector.options[fg_item_selector.selectedIndex].text;
                let value = fg_item_selector.options[fg_item_selector.selectedIndex].value;
                display_select_animation_preview(text, value, fg_item_selector.id);
            }

            document.querySelector('i#trash-' + next_id_value).addEventListener('click', function() {
                document.querySelector('#foreground-menu-container-' + parseInt(next_id_value)).remove();
                remove_animation(next_id_value);
            });

        } else {
            dict = [];
            element.querySelector('#item-name-1').value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['data']['name'] : "";
            element.querySelector('#coord-x-1').value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['data']['coord_x'] : 0;
            element.querySelector('#coord-y-1').value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['data']['coord_y'] : 0;
            element.querySelector('#item-description-1').value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['data']['description'] : "";
            element.querySelector('input[type=hidden]').value = typeof pre_existing_data !== 'undefined' ? pre_existing_data['item_id'] : 0;
            let fg_item_selector = element.querySelector(".fg-item-selector");
            document.querySelector('#foreground-menu').appendChild(element)
            if (typeof pre_existing_data !== "undefined") {
                fg_item_selector.selectedIndex = [...fg_item_selector.options].findIndex(option => option.text === pre_existing_data['item_name']);
                let text = fg_item_selector.options[fg_item_selector.selectedIndex].text;
                let value = fg_item_selector.options[fg_item_selector.selectedIndex].value;
                display_select_animation_preview(text, value, fg_item_selector.id);
            } else {
                fg_item_selector.value = "none";
                element.querySelector(".animations").style.display = "none";
                element.querySelector("#preview-animation").innerHTML = "";
            }
        }
    }

    let fg_item_selector = element.querySelector(".fg-item-selector");
    fg_item_selector.addEventListener("change", function() {
        let text = this.options[this.selectedIndex].text;
        let value = this.options[this.selectedIndex].value;
        let item_id = element.querySelector('input[name=item-id]');
        let parent = fg_item_selector.parentNode.parentNode;
        item_id.value = text;
        let fg_warp_element = parent.querySelector('#fg-warp-sector');
        value == "warpzone_data" ? fg_warp_element.classList.remove('hidden') : fg_warp_element.classList.add('hidden');
        display_select_animation_preview(text, value, fg_item_selector.id);
    });

    let tile = document.querySelectorAll('.tile');
    for (let i = 0; i < tile.length; i++) {
        tile[i].addEventListener('click', function() {
            let value = tile[i].id.split('_');
            let radio_btn = document.querySelectorAll(".coord-radio-button");
            let id = "";
            for (let i = 0; i < radio_btn.length; i++) {
                if (radio_btn[i].checked) {
                    id = parseInt(radio_btn[i].id.split('-')[3]);
                    let foreground_menu = document.querySelector('#foreground-menu-container-' + id);
                    foreground_menu.querySelector('div.coord-x > input').value = parseInt(value[0]);
                    foreground_menu.querySelector('div.coord-y > input').value = parseInt(value[1]);
                    break;
                }
            }
        })
    }

    let button_set_foreground = document.querySelector('#set-foreground-item')
    button_set_foreground.addEventListener('click', function() {
        append_foreground_menu(element);
    })

    let trash_1 = document.querySelector('#trash-1');
    trash_1.addEventListener('click', function() {
        let id = trash_1.id.split('-')[1];
        document.querySelector('#foreground-menu-container-' + id).remove();
        remove_animation(parent);
    })

    function display_select_animation_preview(select_text, select_value, element_id) {
        for (var [index_key, value] in animations_json[select_value]) {
            let col = animations_json[select_value][index_key]['fields']['size']['size_x'];
            let row = animations_json[select_value][index_key]['fields']['size']['size_y'];
            let id = element_id.split('-')[3];
            create_table(col, row, id);
            display_animation_preview(col, row, id, select_value, select_text);
            break;
        }
    }

    function create_table(col, row, id) {
        let foreground_menu = document.querySelector('#foreground-menu-container-' + id);
        foreground_menu.querySelector(".animations").style.display = "block";
        foreground_menu.querySelector('#preview-animation').innerHTML = "";
        let table = "";
        for (let row_i = 0; row_i < row; row_i++) {
            table = foreground_menu.querySelector("#preview-animation")
            let tr = document.createElement('tr');
            tr.classList.add('rows');

            for (let col_i = 0; col_i < col; col_i++) {
                let td = document.createElement('td');
                td.classList.add("w-[32px]", "h-[32px]", "m-0", "p-0", "z-5", "no-borders");

                let div = document.createElement('div');
                div.classList.add(
                    'absolute',
                    'w-[32px]',
                    'h-[32px]',
                    'hover:border',
                    'hover:border-amber-400',
                    'border-dashed',
                    'block',
                    'hover:bg-slate-300/10',
                    'preview-animation-container'
                );
                td.appendChild(div)
                tr.appendChild(td)
                table.appendChild(tr);
            }
        }
    }

    function display_animation_preview(col, row, id, category, directory) {
        let fg_menu = document.querySelector('#foreground-menu-container-' + id);
        let dir_category = category.split('_')[0];
        let anim_array = [];
        let preview_width_size = 32 * col;
        let preview_height_size = 32 * row;
        let preview_tile_size = 32;
        for (let i = 0; i < animations_json[category].length; i++) {
            if (animations_json[category][i]['fields']['name'] == directory) {
                anim_array = Object.entries(Object.values(animations_json[category][i]['fields']['data']));
            }
        }
        for (animation_i in anim_array) {
            if (anim_array[animation_i][1] !== "none") {
                let index_row = 0;
                let index_col = 0;
                let img_url = '/static/img/foreground/' + dir_category + '/' + anim_array[1][1] + '/' + '0.gif';
                for (let row_i = 0; row_i < preview_height_size; row_i += preview_tile_size) {
                    for (let col_i = 0; col_i < preview_width_size; col_i += preview_tile_size) {
                        let img_div = document.createElement('div');
                        img_div.style.backgroundImage = "url('" + img_url + "')";
                        img_div.style.backgroundPositionX = `-${col_i}px`;
                        img_div.style.backgroundPositionY = `-${row_i}px`;
                        img_div.classList.add(
                            'preview-animation',
                            'z-2',
                            'absolute',
                            'm-auto',
                            'left-0',
                            'right-0',
                            'w-[32px]',
                            'h-[32px]',
                            'no-borders',
                            'preview-animation'
                        );
                        let entry_point = fg_menu.querySelector('#preview-animation').rows[index_row].cells[index_col];
                        entry_point.querySelector('div').append(img_div);
                        index_col++;
                    }
                    index_col = 0;
                    index_row++;
                }
            }
        }
    }

    function set_animation_data() {
        let fg_data = document.querySelectorAll('.foreground-menu-container');
        for (let i = 0; i < fg_data.length; i++) {
            let selector = fg_data[i].querySelector('.fg-item-selector');
            if (selector.options[selector.selectedIndex].value !== "none") {
                let s_x = "";
                let s_y = "";
                let animation_data = "";
                let id = fg_data[i].id.split('-')[3];
                let animation_name = selector.options[selector.selectedIndex].text;
                let animation_data_direname = selector.options[selector.selectedIndex].value;
                coord_x = parseInt(fg_data[i].querySelector('input#coord-x-' + id).value);
                coord_y = parseInt(fg_data[i].querySelector('input#coord-y-' + id).value);
                for (var [i_key, value] in animations_json[animation_data_direname]) {
                    s_x = animations_json[animation_data_direname][i_key]['fields']['size']['size_x'];
                    s_y = animations_json[animation_data_direname][i_key]['fields']['size']['size_y'];
                }
                dict[i] = {
                    coord_x: coord_x,
                    coord_y: coord_y,
                    size_x: s_x,
                    size_y: s_y,
                    animations: [{
                        "animation": animation_name,
                        "animation_direname": animation_data_direname,
                        "type": animation_data_direname.split('_')[0]
                    }],
                }
            }
        }
    }

    function add_background(folder_name) {
        let index_row = 1;
        let index_col = 1;
        let bg_url = `/static/img/background/${folder_name}/0.gif`;
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
    }

    function set_foreground(dict) {
        data = [];
        let animation_container_i = 1;
        for (let dict_i = 0; dict_i < dict.length; dict_i++) {
            dict_value = dict[dict_i]["animations"][0];
            let index_row = dict[dict_i]['coord_y'] + 1;
            let index_col = dict[dict_i]['coord_x'] + 1;
            let bg_url = '/static/img/foreground/' + dict_value["type"] + '/' + dict_value["animation"] + '/' + '0.gif';
            for (let row_i = 0; row_i < (atlas.tilesize * dict[dict_i]["size_y"]); row_i += atlas.tilesize) {
                for (let col_i = 0; col_i < (atlas.tilesize * dict[dict_i]["size_x"]); col_i += atlas.tilesize) {

                    let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                    let entry_point_div = entry_point.querySelector('div');

                    entry_point_div.classList.add(
                        'foreground-container',
                        'animation-container-' + parseInt(animation_container_i)
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
                index_col = dict[dict_i]['coord_x'] + 1;
            }
            animation_container_i++;
            animation_i++;
        }
    }


    function clear_foreground() {
        let fg_container = document.querySelectorAll('.foreground-container');
        if (fg_container.length > 0) {
            for (let i = 0; i < fg_container.length; i++) {
                let div = fg_container[i].closest('div');
                div.innerHTML = "";
            }
        }
    }

    function remove_animation(id) {
        let element = document.querySelectorAll('.animation-container-' + id)
        for (let i = 0; i < element.length; i++) {
            element[i].innerHTML = "";
        }
        dict = dict.slice(parseInt(id - 1))
    }

    let preview = document.querySelector("#preview");

    preview.addEventListener('click', function() {
        clear_foreground();
        let bg_folder = document.getElementById("background").value;
        set_animation_data();
        add_background(bg_folder);
        set_foreground(dict);
    });

    let save_or_update_data = function() {
        let element = document.querySelectorAll('.foreground-menu-container');
        let data_entry = {};
        let map_data = {};
        let is_faction_starter = document.querySelector('#faction-starter');
        let is_owned_by_faction = document.querySelector('#owned-by-faction');
        let faction_id = "none";
        let item_id_element = null;
        if (document.querySelector('#faction-select').style.display === "block") {
            faction_id = document.querySelector('#faction-choice').querySelector(':checked').value;
        }
        for (let i = 0; i < element.length; i++) {
            const resource_data = Array.from(element[i].querySelectorAll("select[name=resource-data] option:checked"), e => e.value);
            item_id_element = element[i].querySelector('input[name=item-id]');
            let coord_x = element[i].querySelector('input[name=coord-x]').value;
            let coord_y = element[i].querySelector('input[name=coord-y]').value;
            let item_type = element[i].querySelector('select[name=item-type]').value.split('_')[0];
            let item_id = typeof item_id_element !== 'undefined' && item_id_element !== null ? item_id_element.value : null;
            let item_img_name = element[i].querySelector('select[name=item-type]').querySelector(':checked').textContent; 
            let item_name = element[i].querySelector('input[name=item-name]').value;
            let item_description = element[i].querySelector('.item-description').value;
            if(item_type == "warpzone"){
                let item_warpzone_destination = element[i].querySelector('select[name=item-warpzone-destination]').value;
                if(item_warpzone_destination != "none"){
                    data_entry[i] = {
                        'coord_x': coord_x,
                        'coord_y': coord_y,
                        'item_type': item_type,
                        'item_id': item_id,
                        'item_img_name': item_img_name,
                        'item_name': item_name,
                        'item_description': item_description,
                        'item_warpzone_destination': item_warpzone_destination,
                        'resource_data': resource_data,
                    }
                }
            }else{
                data_entry[i] = {
                    'coord_x': coord_x,
                    'coord_y': coord_y,
                    'item_type': item_type,
                    'item_id': item_id,
                    'item_img_name': item_img_name,
                    'item_name': item_name,
                    'item_description': item_description,
                    'resource_data': resource_data,
                }
            }
        }
        let sector_selection_id = document.querySelector('#sector-select');
        let url = window.location.href;
        if (sector_selection_id.value !== "none") {
            url = "sector_update_data";
            map_data = {
                'sector_id': sector_selection_id.value,
                'sector_name': document.querySelector('input[name=sector-name]').value,
                'sector_background': document.querySelector('#background').querySelector(':checked').textContent,
                'sector_description': document.querySelector('#sector-description').value,
                'security': document.querySelector('#security-level').querySelector(':checked').value,
                'faction_id': faction_id,
                'is_faction_starter': is_faction_starter.checked,
                'is_owned_by_faction': is_owned_by_faction.checked,
            };
        } else {
            map_data = {
                'sector_name': document.querySelector('input[name=sector-name]').value,
                'sector_background': document.querySelector('#background').querySelector(':checked').textContent,
                'sector_description': document.querySelector('#sector-description').value,
                'security': document.querySelector('#security-level').querySelector(':checked').value,
                'faction_id': faction_id,
                'is_faction_starter': is_faction_starter.checked,
                'is_owned_by_faction': is_owned_by_faction.checked,
            };
        }
        
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
                'data': data_entry,
                'map_data': map_data,
            })
        }).then(response => response.json())
        .then(data => {
            let d = JSON.parse(data)
            if(d.success){
                window.location.reload();
            }else{
                let messages = document.querySelector('#message-list');
                let message_list = messages.querySelector('p');
                message_list.textContent = d.errors;
                messages.classList.remove('hidden');
            }
        });
    }

    let save_or_update_btn = document.querySelector('#save-or-update');
    save_or_update_btn.addEventListener('click', save_or_update_data);

    let delete_btn = document.querySelector('#modal-delete-confirmation-btn');
    delete_btn.addEventListener('click', function() {
        let sector_selected = document.querySelector('#sector-select');
        if (sector_selected.value !== "none") {
            data = { "pk": sector_selected.value }
            url = "sector_delete";
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
                body: JSON.stringify(data),
            }).then(() => {
                window.location.reload();
            });
        }
    })