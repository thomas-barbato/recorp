    let element = document.querySelector('#foreground-menu-1');
    let tiles = "";
    let size_x = "";
    let size_y = "";
    let animation_tile_len = "";
    let animation_container_set = new Set();
    let animation_set = new Set();
    let dict = [];

    Set.prototype.getByIndex = function(index) { return [...this][index]; }

    function append_foreground_menu(element){
        if(document.querySelectorAll('.foreground-menu-item').length > 0){
            let fg_menu = document.querySelectorAll('.foreground-menu-item')
            let next_id_value = parseInt(fg_menu[fg_menu.length-1].id.split('-')[2])+1;
            let clone = element.cloneNode(true);
            clone.id = "foreground-menu-" + next_id_value;

            let clone_radio = clone.querySelector('input[type=radio]')
            clone_radio.id = "coord-radio-button-" + next_id_value;

            let clone_size_x = clone.querySelector('.size-x > input');
            clone_size_x.id = "size-x-" + next_id_value;
            clone_size_x.value = 0;

            let clone_size_y = clone.querySelector('.size-y > input');
            clone_size_y.id = "size-y-" + next_id_value;
            clone_size_y.value = 0;

            let clone_coord_x = clone.querySelector('.coord-x > input');
            clone_coord_x.id = "coord-x-" + next_id_value;
            clone_coord_x.value = 0;

            let clone_coord_y = clone.querySelector('.coord-y > input')
            clone_coord_y.id = "coord-y-" + next_id_value;
            clone_coord_y.value = 0;

            clone.querySelector("#size-help-text").style.display = "block";
            clone.querySelector(".animations").style.display = "none";
            clone.querySelector(".trash-it").id = "trash-" + next_id_value;

            for(let i = 1; i <= 4 ; i++){
                let animation_selector = clone.querySelector("#animation-" + i + "-1");
                animation_selector.id = "animation-" + i + "-" + next_id_value;
                animation_selector.value = "none";

                let preview_selector = clone.querySelector("#preview-" + i + "-1");
                preview_selector.id = "preview-" + i + "-" + next_id_value;
                preview_selector.innerHTML = "";

                let preview_animation_selector = clone.querySelector("#preview-animation-" + i + "-1")
                preview_animation_selector.id = "preview-animation-" + i + "-" + next_id_value;
            }
            let last_element = Array.from(document.querySelectorAll('.foreground-menu-item')).pop();
            last_element.after(clone);

            document.querySelector('#size-x-' + next_id_value).addEventListener('change', display_animation_parameter);
            document.querySelector('#size-y-' + next_id_value).addEventListener('change', display_animation_parameter);
            document.querySelector('i#trash-'+ next_id_value).addEventListener('click', function(){
                let parent = this.parentNode.parentNode.parentNode;
                remove_animation(next_id_value);
                parent.remove();
            });

            let animation_selection = document.querySelectorAll('.animation-selection');

            for(let i = 0; i < animation_selection.length; i++){
                animation_selection[i].addEventListener('change', display_animation_preview);
            }
        }else{
            dict = [];
            element.querySelector('#size-x-1').value = 0;
            element.querySelector('#size-y-1').value = 0;
            element.querySelector('#coord-x-1').value = 0;
            element.querySelector('#coord-y-1').value = 0;
            element.querySelector("#size-help-text").style.display = "block";
            element.querySelector(".animations").style.display = "none";
            for(let i = 1; i <= 4 ; i++){
                element.querySelector("#preview-"+ i +"-1").innerHTML = "";
                element.querySelector("#animation-" + i + "-1").value = "none";
            }
            document.querySelector('#foreground-menu').appendChild(element)
        }
    }

    let tile = document.querySelectorAll('.tile');
    for(let i = 0; i < tile.length; i++){
        tile[i].addEventListener('click', function(){
            let value = tile[i].id.split('_');
            let radio_btn = document.querySelectorAll(".coord-radio-button");
            let id = "";
            for(let i = 0 ; i < radio_btn.length ; i++){
                if (radio_btn[i].checked) {
                    id = parseInt(radio_btn[i].id.split('-')[3]);
                    let foreground_menu = document.querySelector('#foreground-menu-'+id);
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
        let trash = document.querySelectorAll('.trash-it');

        for(let i = 0; i < trash.length ; i++){
            trash[i].addEventListener('click', function(){
                let parent = trash[i].parentNode.parentNode.parentNode;
                remove_animation(parent.id.split('-')[2]);
                parent.remove();
            })
        }
    })

    let display_animation_parameter = function(){
        let id = this.id.split('-')[2];
        let foreground_menu = document.querySelector('#foreground-menu-' + id)
        size_x = document.querySelector("#size-x-" + id).value;
        size_y = document.querySelector("#size-y-" + id).value;
        if(size_x > 0 && size_y > 0){
            foreground_menu.querySelector(".animations").style.display = "block";
            foreground_menu.querySelector("#size-help-text").style.display = "none";
        }else{
            foreground_menu.querySelector(".animations").style.display = "none";
            foreground_menu.querySelector("#size-help-text").style.display = "block";
        }
    }

    let display_animation_preview = function(e){
        let element = this.parentNode.parentNode.parentNode;
        let id_i = e.target.id.split('-')[2];
        let animation_number = e.target.id.split('-')[1];
        let row = document.querySelector("#size-y-" + id_i).value;
        let col = document.querySelector("#size-x-" + id_i).value;
        let directory = e.target.value;
        document.querySelector('#preview-'+animation_number+'-'+id_i).innerHTML = "";

        if(directory !== "none"){
            let animation_i = 0;
            let tr = "";
            let td = "";
            let table = "";

            for(let row_i = 0; row_i < row; row_i++){

                table = element.querySelector('#preview-'+animation_number+'-'+id_i)
                tr = document.createElement('tr');
                tr.classList.add('rows');

                for(let col_i = 0; col_i < col; col_i++){
                    let bg_url = '/static/img/atlas/foreground/' + directory + '/' + animation_i + '.png';
                    td = document.createElement('td');

                    td.classList.add("w-[32px]", "h-[32px]", "m-0", "p-0", "z-5", "no-borders");
                    td.style.backgroundImage = "url('" + bg_url + "')";

                    tr.appendChild(td)
                    table.appendChild(tr);
                    animation_i++;
                }

            }
            element.querySelector('#preview-animation-'+animation_number+'-'+id_i).style.display = "block";
        }else{
            element.querySelector('#preview-animation-'+animation_number+'-'+id_i).style.display = "none";
        }
    }


    let animation_selection = document.querySelectorAll('.animation-selection')
    for(let i = 0; i < animation_selection.length; i++){
        animation_selection[i].addEventListener('change', display_animation_preview);
    }
    document.querySelector("#size-x-1").addEventListener('change', display_animation_parameter);
    document.querySelector("#size-y-1").addEventListener('change', display_animation_parameter);

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
        for(let data_i in dict){
            let animation_data = [];
            // get animations
            for(let anim in dict[data_i]["animations"]){
                if(dict[data_i]["animations"][anim] !== "none"){
                    animation_data.push(dict[data_i]["animations"][anim]);
                }
            }
            // if there is at least one animation...
            if(animation_data.length > 0){
                let cell = 0;
                for(let row = dict[data_i]['coord_y']; row < dict[data_i]['coord_y'] + dict[data_i]['size_y']; row++){
                    for(let col = dict[data_i]['coord_x']; col < dict[data_i]['coord_x'] + dict[data_i]['size_x']; col++){
                        document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').classList.add('foreground-container', 'animation-container-'+(parseInt(data_i)+1));
                        animation_container_set.add('.animation-container-'+(parseInt(data_i)+1));
                        add_foreground_tiles(animation_data, cell, row, col, dict[data_i]['size_x'], dict[data_i]['size_y']);
                        cell++;
                    }
                }
                cell = 0;
            }
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

    function add_foreground_tiles(animation_array, cell, row, col, size_x, size_y){
        for(let animation_i = 0; animation_i < animation_array.length; animation_i++){
            let fg_animation = document.createElement('img');
            let fg_animation_url = '/static/img/atlas/foreground/' + animation_array[animation_i] + '/' + cell + '.png';
            fg_animation.src = fg_animation_url;
            fg_animation.classList.add('animation', 'z-2', 'absolute', 'm-auto', 'left-0', 'right-0', 'no-borders');
            if(size_y > 1 && size_y > 1){
                fg_animation.style.display = "none";
                fg_animation.classList.add('animation-'+animation_i);
            }else{
                fg_animation.style.display = "block";
            }
            animation_set.add('.animation-'+animation_i)
            document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').append(fg_animation);
        }
    }

    function display_animation(timer="500"){
        let temporary_class_len = animation_set.size;
        let current_elements = "";
        let previous_elements = "";
        let index = 0;
        setInterval( function(){
            current_elements = document.querySelectorAll('.animation-'+index);
            previous_elements = document.querySelectorAll('.animation-'+parseInt(index-1));
            if(index === 0){
                current_elements = document.querySelectorAll('.animation-'+index);
                previous_elements = document.querySelectorAll('.animation-'+parseInt(temporary_class_len-1));
            }

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

    let trash = document.querySelectorAll('.trash-it');
    trash[0].addEventListener('click', function(){
        let parent = this.parentNode.parentNode.parentNode;
        remove_animation(parent.id.split('-')[2]);
        parent.remove();
    })


    let preview = document.querySelector("#preview");

    preview.addEventListener('click', function() {
        clear_foreground();
        let fg_data = document.querySelectorAll('.foreground-menu-item');
        let bg_folder = document.getElementById("background").value;
        add_background(bg_folder);
        for(let i = 0; i < fg_data.length ; i++){
            let id = fg_data[i].id.split('-')[2];
            dict[i] = {
                size_x: parseInt(fg_data[i].querySelector('input#size-x-' + id).value),
                size_y: parseInt(fg_data[i].querySelector('input#size-y-' + id).value),
                coord_x: parseInt(fg_data[i].querySelector('input#coord-x-' + id).value) + 1,
                coord_y: parseInt(fg_data[i].querySelector('input#coord-y-' + id).value) + 1,
                animations: [
                    fg_data[i].querySelector('select#animation-1-'+ id).value,
                    fg_data[i].querySelector('select#animation-2-'+ id).value,
                    fg_data[i].querySelector('select#animation-3-'+ id).value,
                    fg_data[i].querySelector('select#animation-4-'+ id).value,
                ],
            }
        }
        set_foreground(dict);
        display_animation("250");

    })