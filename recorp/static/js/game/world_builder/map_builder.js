    let element = document.querySelector('#foreground-menu-container-1');
    const size = JSON.parse(document.getElementById('script_size').textContent);
    const planet_url = JSON.parse(document.getElementById('script_planet_url').textContent);
    const station_url = JSON.parse(document.getElementById('script_station_url').textContent);
    const asteroid_url = JSON.parse(document.getElementById('script_asteroid_url').textContent);
    const animations_json = JSON.parse(document.getElementById('script_animation_data').textContent);
    let animation_container_set = new Set();
    let animation_set = new Set();
    let dict = [];

    Set.prototype.getByIndex = function(index) { return [...this][index]; }

    function append_foreground_menu(element){
        if(document.querySelectorAll('.foreground-menu-container').length > 0){
            let fg_menu = document.querySelectorAll('.foreground-menu-container')
            let next_id_value = parseInt(fg_menu[fg_menu.length-1].id.split('-')[3])+1;
            let clone = element.cloneNode(true);
            clone.id = "foreground-menu-container-" + next_id_value;

            let clone_foreground_menu = clone.querySelector('.foreground-menu-item')
            clone_foreground_menu.id = "foreground-menu-item-" + next_id_value;

            let clone_radio = clone.querySelector('input[type=radio]')
            clone_radio.id = "coord-radio-button-" + next_id_value;

            let clone_coord_x = clone.querySelector('.coord-x > input');
            clone_coord_x.id = "coord-x-" + next_id_value;
            clone_coord_x.value = 0;

            let clone_coord_y = clone.querySelector('.coord-y > input')
            clone_coord_y.id = "coord-y-" + next_id_value;
            clone_coord_y.value = 0;

            let fg_item_selector = clone.querySelector(".fg-item-selector");
            fg_item_selector.id = "fg-item-selector-" + next_id_value;
            fg_item_selector.addEventListener("change", function(){
                let text = this.options[this.selectedIndex].text;
                let value = this.options[this.selectedIndex].value;
                let id_value =  fg_item_selector.id.split('-')[3];
                display_select_animation_preview(text, value, fg_item_selector.id);
            })

            clone.querySelector(".animations").style.display = "none";
            clone.querySelector(".trash-it").id = "trash-" + next_id_value;

            let preview_selector = clone.querySelector("#preview-animation");
            preview_selector.innerHTML = "";

            let last_element = Array.from(document.querySelectorAll('.foreground-menu-container')).pop();
            last_element.after(clone);

            document.querySelector('i#trash-'+ next_id_value).addEventListener('click', function(){
                document.querySelector('#foreground-menu-container-'+parseInt(next_id_value)).remove();
                remove_animation(next_id_value);
            });

        }else{
            dict = [];
            element.querySelector('#coord-x-1').value = 0;
            element.querySelector('#coord-y-1').value = 0;
            element.querySelector(".animations").style.display = "none";
            element.querySelector("#preview-animation").innerHTML = "";
            document.querySelector('#foreground-menu').appendChild(element)
        }
    }

    let fg_item_selector = element.querySelector(".fg-item-selector");
    fg_item_selector.addEventListener("change", function(){
        let text = this.options[this.selectedIndex].text;
        let value = this.options[this.selectedIndex].value;
        let id_value =  fg_item_selector.id.split('-')[3];
        display_select_animation_preview(text, value, fg_item_selector.id);
    });

    let tile = document.querySelectorAll('.tile');
    for(let i = 0; i < tile.length; i++){
        tile[i].addEventListener('click', function(){
            let value = tile[i].id.split('_');
            let radio_btn = document.querySelectorAll(".coord-radio-button");
            let id = "";
            for(let i = 0 ; i < radio_btn.length ; i++){
                if (radio_btn[i].checked) {
                    id = parseInt(radio_btn[i].id.split('-')[3]);
                    let foreground_menu = document.querySelector('#foreground-menu-container-'+id);
                    foreground_menu.querySelector('div.coord-x > input').value = parseInt(value[0]);
                    foreground_menu.querySelector('div.coord-y > input').value = parseInt(value[1]);
                    break;
                }
            }
        })
    }

    let button_set_foreground = document.querySelector('#set-foreground-item')
    button_set_foreground.addEventListener('click', function(){
        append_foreground_menu(element);
    })

    let trash_1 = document.querySelector('#trash-1');
    trash_1.addEventListener('click', function(){
        let parent = trash_1.id.split('-')[1]
        document.querySelector('#foreground-menu-container-'+parent).remove();
        remove_animation(parent);
    })

    function display_select_animation_preview(select_text, select_value, element_id){
        for (var [index_key, value] in animations_json[select_value]){
            let col = animations_json[select_value][index_key]['fields']['size']['size_x'];
            let row = animations_json[select_value][index_key]['fields']['size']['size_y'];
            let id = element_id.split('-')[3];
            create_table(col, row, id);
            display_animation_preview(col, row, id, select_value, select_text);
            break;
        }
    }

    function create_table(col, row, id){
        let foreground_menu = document.querySelector('#foreground-menu-container-' + id);
        foreground_menu.querySelector(".animations").style.display = "block";
        foreground_menu.querySelector('#preview-animation').innerHTML = "";
        let table = "";
        for(let row_i = 0 ; row_i < row ; row_i++){
            table = foreground_menu.querySelector("#preview-animation")
            let tr = document.createElement('tr');
            tr.classList.add('rows');

            for(let col_i = 0; col_i < col; col_i++){
                let td = document.createElement('td');
                td.classList.add("w-[32px]", "h-[32px]", "m-0", "p-0", "z-5", "no-borders");

                let div = document.createElement('div');
                div.classList.add(
                    'relative',
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

    function display_animation_preview(col, row, id, category, directory){
        let foreground_menu = document.querySelector('#foreground-menu-container-' + id);
        let preview_animation_container = foreground_menu.querySelectorAll('.preview-animation-container');
        dir_category = category.split('_')[0]
        let animation_array = []
        for(let i = 0; i < animations_json[category].length; i++){
            if(animations_json[category][i]['fields']['name'] == directory){
                animation_array = Object.entries(Object.values(animations_json[category][i]['fields']['data']))
            }
        }
        for(animation_i in animation_array){
            if(animation_array[animation_i][1] !== "none"){
                let picture_i = 0;
                for(let row_i = 0; row_i < row ; row_i++){
                    for(let col_i = 0; col_i < col; col_i++){
                        let img = document.createElement('img');
                        let img_url = '/static/img/atlas/foreground/' + dir_category + '/' + animation_array[animation_i][1] + '/' + picture_i + '.png';
                        img.src = img_url;
                        img.classList.add(
                            'preview-animation',
                            'z-2',
                            'absolute',
                            'm-auto',
                            'left-0',
                            'right-0',
                            'no-borders',
                            'preview-animation-'+animation_i
                        );
                        foreground_menu.querySelector('#preview-animation').rows[row_i].cells[col_i].querySelector('div').append(img);
                        picture_i++;
                    }
                }
            }
        }
    }

    function add_background(folder_name){
        let cell = 0;
        let game_rows = document.querySelectorAll('.rows');
        for(let i = 0; i < game_rows.length ; i++){
            let cols = game_rows[i].querySelectorAll('.tile');
            for(let y = 0; y < cols.length ; y++){
                let bg_url = '/static/img/atlas/background/' + folder_name + '/' + cell + '.png';
                cols[y].style.backgroundImage = "url('" + bg_url + "')";
                cell++;
            }
        }
    }

    function set_foreground(dict){
        data = [];
        let animation_dir_data = [];
        let animation_type = "";
        let data_i = 1;


        for(var [index_key, value] in dict){
            animation_dir_data.push(Object.values(dict[index_key]["animations"][0]));
            animation_type = dict[index_key]["animation_dirname"].split('_')[0];
            let cell = 0;
            for(let row = dict[index_key]["coord_y"]; row < dict[index_key]["coord_y"] + dict[index_key]["size_y"]; row++){
                for(let col = dict[index_key]['coord_x']; col < dict[index_key]['coord_x'] + dict[index_key]["size_x"]; col++){
                    let entry_point = document.querySelector('.tabletop-view').rows[row].cells[col];
                    let div = entry_point.querySelector('div');
                    div.classList.add(
                        'foreground-container',
                        'animation-container-'+parseInt(data_i)
                    );
                    animation_container_set.add('.animation-container-'+parseInt(data_i));
                    add_foreground_tiles(animation_type, animation_dir_data, cell, row, col, dict[index_key]['size_x'], dict[index_key]['size_y']);
                    cell++;
                }
            }
            animation_dir_data = [];
            cell = 0;
            data_i++;
        }
    }

    function clear_foreground(){
        let tile = document.querySelectorAll('.animation');
        if(tile.length > 0){
            for(let i = 0; i < tile.length; i++){
                tile[i].remove();
            }
        }
    }

    function remove_animation(id){
        let element = document.querySelectorAll('.animation-container-'+id)
        for(let i = 0; i < element.length; i++){
            element[i].innerHTML = "";
        }
        dict = dict.slice(parseInt(id-1))
    }

    function add_foreground_tiles(animation_type, animation_array, cell, row, col, size_x, size_y){
        let array = [];
        let filtered_animation_data = {};
        for(var [array_key, array_value] in animation_array){
            for(let i = 0; i < animation_array[array_key].length; i++){
                if(animation_array[array_key][i] != "none"){
                    array.push(animation_array[array_key][i]);
                }
            }
            filtered_animation_data['item-'+array_key] = array;
            array = [];
        }

        for(const property in filtered_animation_data){
            let animation_i = 0;
            for(const data in filtered_animation_data[property]){
                let fg_animation = document.createElement('img');
                let fg_animation_url = '/static/img/atlas/foreground/' + animation_type + '/' + filtered_animation_data[property][data] + '/' + cell + '.png';
                fg_animation.src = fg_animation_url;
                fg_animation.classList.add('animation', 'z-2', 'absolute', 'm-auto', 'left-0', 'right-0', 'no-borders');
                if(size_y > 1 && size_y > 1){
                    fg_animation.style.display = "none";
                    fg_animation.classList.add('animation-'+animation_i);
                }else{
                    fg_animation.style.display = "block";
                }
                animation_set.add('.animation-'+animation_i);
                document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').append(fg_animation);
                animation_i++;
            }
            animation_i=0;
        }
    }

    function display_animation(timer="500"){
        let animation_set_len = animation_set.size;
        let current_elements = "";
        let previous_elements = "";
        let index = 0;
        console.log(animation_set_len)
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

    function set_animation_data(){
        let fg_data = document.querySelectorAll('.foreground-menu-container')
        for(let i = 0; i < fg_data.length; i++){
            let selector = fg_data[i].querySelector('.fg-item-selector');
            if(selector.options[selector.selectedIndex].value !== "none"){
                let s_x = "";
                let s_y = "";
                let animation_data = "";
                let id = fg_data[i].id.split('-')[3];
                let animation_name = selector.options[selector.selectedIndex].text;
                let animation_data_dirname = selector.options[selector.selectedIndex].value;
                coord_x = parseInt(fg_data[i].querySelector('input#coord-x-' + id).value) + 1;
                coord_y = parseInt(fg_data[i].querySelector('input#coord-y-' + id).value) + 1;
                for (var [index_key, value] in animations_json[animation_data_dirname]){
                    let filtered_animation_data = Object.assign({}, ...
                        Object.entries(animations_json[animation_data_dirname][index_key]['fields']['data']).filter(([k,v]) => v != "none").map(([k,v]) => ({[k]:v}))
                    );
                    animation_data = filtered_animation_data;
                    s_x = animations_json[animation_data_dirname][index_key]['fields']['size']['size_x'];
                    s_y = animations_json[animation_data_dirname][index_key]['fields']['size']['size_y'];
                }
                dict[i] = {
                    coord_x: coord_x,
                    coord_y: coord_y,
                    size_x: s_x,
                    size_y: s_y,
                    animation_dirname: animation_data_dirname,
                    animations: [
                        animation_data,
                    ],
                }
            }
        }
    }

    let preview = document.querySelector("#preview");

    preview.addEventListener('click', function() {
        clear_foreground();
        let fg_data = document.querySelectorAll('.foreground-menu-container');
        let bg_folder = document.getElementById("background").value;
        set_animation_data()
        add_background(bg_folder);
        set_foreground(dict);
        display_animation("250");
    })

