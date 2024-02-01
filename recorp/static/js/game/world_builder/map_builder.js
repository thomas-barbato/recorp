    let element = document.querySelector('#foreground-menu-1');
    let tiles = "";
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
            let last_element = Array.from(document.querySelectorAll('.foreground-menu-item')).pop();
            last_element.after(clone);
        }else{
            document.querySelector('#foreground-menu').appendChild(element)
        }
    }

    let tile = document.querySelectorAll('.tile');
    for(let i = 0; i < tile.length; i++){
        tile[i].addEventListener('click', function(){
            let value = tile[i].id.split('_')
            let radio_btn = document.querySelectorAll(".coord-radio-button");
            let id = "";
            for(let i = 0 ; i < radio_btn.length ; i++){
                if (radio_btn[i].checked) {
                    id = parseInt(radio_btn[i].id.split('-')[3]);
                    document.querySelector('#foreground-menu-'+id+' > div.coord_size > section.coord > div.coord_x > input').value = parseInt(value[0]);
                    document.querySelector('#foreground-menu-'+id+' > div.coord_size > section.coord > div.coord_y > input').value = parseInt(value[1]);
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

    function add_foreground_tiles(animation_array, cell, row, col){
        for(let animation in animation_array){
            let fg_animation = document.createElement('img');
            let fg_animation_url = '/static/img/atlas/foreground/' + animation_array[animation] + '/' + cell + '.png';
            fg_animation.src = fg_animation_url;
            fg_animation.style.display = "none";
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
                        console.log("children_i: "+ children_i)
                        console.log("children: " + container_element[container_i].children[children_i].src)
                        if(children_i > 0){
                            container_element[container_i].children[(children_i - 1)].style.display = "none";
                            container_element[container_i].children[children_i].style.display = "block";
                            console.log("1: container_element[container_i].children[children_i].style.display = " + container_element[container_i].children[children_i].style.display)

                        }else{
                            if(container_element[container_i].children[(children_i_length-1)].style.display == "block"){
                                container_element[container_i].children[(children_i_length-1)].style.display = "none";
                                container_element[container_i].children[children_i].style.display = "block";
                                console.log("container_element[container_i].children[(children_i_length-1)].style.display = " + container_element[container_i].children[(children_i_length-1)].style.display)
                                console.log("container_element[container_i].children[children_i].style.display = " + container_element[container_i].children[children_i].style.display)
                            }else{
                                container_element[container_i].children[children_i].style.display = "block";
                                console.log("2: container_element[container_i].children[children_i].style.display = " + container_element[container_i].children[children_i].style.display)
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
        let fg_data = document.querySelectorAll('.foreground-menu-item');
        let bg_folder = document.getElementById("background").value;
        add_background(bg_folder);
        for(let i = 0; i < fg_data.length ; i++){
            dict[i] = {
                size_x: parseInt(fg_data[i].querySelector(':scope > div.coord_size > section.size > div.size_x > input').value),
                size_y: parseInt(fg_data[i].querySelector(':scope > div.coord_size > section.size > div.size_y > input').value),
                coord_x: parseInt(fg_data[i].querySelector(':scope > div.coord_size > section.coord > div.coord_x > input').value) + 1,
                coord_y: parseInt(fg_data[i].querySelector(':scope > div.coord_size > section.coord > div.coord_y > input').value) + 1,
                animations: [
                    fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-1').value,
                    fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-2').value,
                    fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-3').value,
                    fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-4').value,
                ],
                time_duration: parseInt(fg_data[i].querySelector(':scope > div.animations > section.time-section > div > input#animation-duration').value),
            }
        }

        set_foreground(dict);
        let img_animation_index = 0;
        let img_animation_len = document.querySelectorAll('img.animation').length;
        let animation_container_len = temporary_class_set.size;
        setInterval( function(){
            animate_foreground_tiles();
        }, "500");

    })