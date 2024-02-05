    let element = document.querySelector('#foreground-menu-1');
    let tiles = "";
    let size_x = "";
    let size_y = "";
    let animation_tile_len = "";
    let temporary_class_set = new Set();
    let dict = new Object();

    Set.prototype.getByIndex = function(index) { return [...this][index]; }

    function append_foreground_menu(element){
        if(document.querySelectorAll('.foreground-menu-item').length){
            len_element = document.querySelectorAll('.foreground-menu-item').length;
            let clone = element.cloneNode(true);
            clone.id = "foreground-menu-" + parseInt(len_element + 1);
            clone.querySelector('input[type=radio]').id = "coord-radio-button-" + parseInt(len_element + 1);
            clone.querySelector('.size-x > input').id = "size-x-" + parseInt(len_element + 1);
            clone.querySelector('.size-y > input').id = "size-y-" + parseInt(len_element + 1);
            clone.querySelector('.coord-x > input').id = "coord-x-" + parseInt(len_element + 1);
            clone.querySelector('.coord-y > input').id = "coord-y-" + parseInt(len_element + 1);
            let last_element = Array.from(document.querySelectorAll('.foreground-menu-item')).pop();
            last_element.after(clone);
        }else{
            document.querySelector('#foreground-menu').appendChild(element)
        }

        let size_x_input = document.querySelectorAll(".size-x");
        let size_y_input = document.querySelectorAll(".size-y");
        let animation_selection = document.querySelectorAll(".animation-selection");

        for(let i = 0; i < size_x_input.length; i++){
            size_x_input[i].querySelector('input[type=number]').addEventListener('change', display_animation_parameter)
            size_y_input[i].querySelector('input[type=number]').addEventListener('change', display_animation_parameter)
        }

        for(let i = 0; i < animation_selection.length; i++){
            animation_selection[i].addEventListener('change', display_animation_preview);
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
                    document.querySelector('#foreground-menu-'+id+' > div.coord_size > section.coord > div.coord-x > input').value = parseInt(value[0]);
                    document.querySelector('#foreground-menu-'+id+' > div.coord_size > section.coord > div.coord-y > input').value = parseInt(value[1]);
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
        let element = this.parentNode.parentNode.parentNode.parentNode;
        let id_i = e.target.id.split('-')[1];
        let animation_value = e.target.value;
        element.querySelector("#preview-"+id_i).innerHTML = "";

        if(animation_value !== "none"){
            let animation_i = 0;
            let tr = "";
            let td = "";
            let table = "";

            for(let row_i = 0; row_i < size_y; row_i++){

                table = element.querySelector('#preview-'+id_i)
                tr = document.createElement('tr');
                tr.classList.add('rows');

                for(let col_i = 0; col_i < size_x; col_i++){
                    let bg_url = '/static/img/atlas/foreground/' + animation_value + '/' + animation_i + '.png';
                    td = document.createElement('td');
                    div = document.createElement('div');

                    td.classList.add("w-[32px]", "h-[32px]", "m-0", "p-0", "z-5");
                    td.style.backgroundImage = "url('" + bg_url + "')";

                    tr.appendChild(td)
                    table.appendChild(tr);
                    animation_i++;
                }

            }
            element.querySelector('#preview-animation-'+id_i).style.display = "block";
        }else{
            element.querySelector('#preview-animation-'+id_i).style.display = "none";
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
                        document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').classList.add('foreground-container', 'animation-container-'+data_i);
                        temporary_class_set.add('.animation-container-'+data_i);
                        add_foreground_tiles(animation_data, cell, row, col);
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

    function add_foreground_tiles(animation_array, cell, row, col){
        for(let animation in animation_array){
            console.log("ok");
            let fg_animation = document.createElement('img');
            let fg_animation_url = '/static/img/atlas/foreground/' + animation_array[animation] + '/' + cell + '.png';
            fg_animation.src = fg_animation_url;
            fg_animation.style.display = "block";
            fg_animation.classList.add('animation', 'z-2', 'absolute', 'm-auto', 'left-0', 'right-0');
            document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').append(fg_animation);
        }
    }

    function animate_foreground_tiles(){
        for(let i = 0; i < temporary_class_set.size; i++){
            let container_element = document.querySelectorAll(temporary_class_set.getByIndex(i));
            if(container_element.length > 1){
                let container_i_length = parseInt(container_element.length);
                let children_i_length = parseInt(container_element[0].childElementCount);
                console.log("children_i_length: " + children_i_length);
                for(let children_i = 0; children_i < children_i_length; children_i++){
                    for(let container_i = 0; container_i < container_i_length ; container_i++){
                        console.log("container nb: "+ container_i + " child nb: " + children_i);
                        if(children_i > 0){
                            container_element[parseInt(container_i - 1)].children[children_i].style.display = "none";
                            container_element[container_i].children[children_i].style.display = "block";

                        }else{
                            if(container_element[(container_i_length - 1)].children[(children_i_length-1)].style.display == "block"){
                                container_element[(container_i_length - 1)].children[(children_i_length-1)].style.display = "none";
                                container_element[container_i].children[children_i].style.display = "block";
                            }else{
                                container_element[(container_i_length - 1)].children[children_i].style.display = "block";
                            }
                        }
                    }
                    console.log("===============================")
                }
            }else{
                container_element[0].children[0].style.display = "block";
            }
        }
    }

    let trash = document.querySelector('.trash-it');
    trash.addEventListener('click', function(){
        let parent = trash.parentNode.parentNode.parentNode;
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
                size_x: parseInt(fg_data[i].querySelector(':scope > div.coord_size > section.size > div.size-x > input#size-x-' + id).value),
                size_y: parseInt(fg_data[i].querySelector(':scope > div.coord_size > section.size > div.size-y > input#size-y-' + id).value),
                coord_x: parseInt(fg_data[i].querySelector(':scope > div.coord_size > section.coord > div.coord-x > input#coord-x-' + id).value) + 1,
                coord_y: parseInt(fg_data[i].querySelector(':scope > div.coord_size > section.coord > div.coord-y > input#coord-y-' + id).value) + 1,
                animations: [
                    fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-1').value,
                    fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-2').value,
                    fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-3').value,
                    fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-4').value,
                ],
                time_duration: parseInt(fg_data[i].querySelector(':scope > div.animations > section.time-section > div > input#animation-duration').value),
            }
        }
        console.log(dict);
        set_foreground(dict);
        let img_animation_index = 0;
        let img_animation_len = document.querySelectorAll('img.animation').length;
        let animation_container_len = temporary_class_set.size;
        setInterval( function(){
            animate_foreground_tiles();
        }, "500");

    })