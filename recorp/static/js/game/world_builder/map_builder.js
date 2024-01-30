    let element = document.querySelector('#foreground-menu-1');
    let tiles = "";
    let animation_tile_len = "";
    let dict = new Object();

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
        for(let data in dict){
            let animation_data = [
                dict[data]["animation_1"],
                dict[data]["animation_2"],
                dict[data]["animation_3"],
                dict[data]["animation_4"],
            ]
            let cell = 0;
            if(dict[data]['item_select'] !== "none"){
                for(let row = dict[data]['coord_y']; row < dict[data]['coord_y'] + dict[data]['size_y']; row++){
                    for(let col = dict[data]['coord_x']; col < dict[data]['coord_x'] + dict[data]['size_x']; col++){
                        let fg_image = document.createElement('img');
                        document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').classList.add('foreground-container')

                        add_foreground_tiles(animation_data, cell, row, col);
                        cell++;
                    }
                }
            }
            cell = 0;
        }
    }

    function add_foreground_tiles(animation_array, cell, row, col){
        for(animation in animation_array){
            if(animation_array[animation] !== "none"){
                let fg_animation = document.createElement('img');
                let fg_animation_url = '/static/img/atlas/foreground/' + animation_array[animation] + '/' + cell + '.png';
                fg_animation.src = fg_animation_url;
                fg_animation.style.display = "none";
                fg_animation.classList.add('animation', 'z-2', 'absolute', 'm-auto', 'left-0', 'right-0');
                document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').append(fg_animation);
            }
        }
    }

    function animate_foreground_tiles(animation_tile_index){
        /* reflexion :
            je pourrais faire un dictionnaire qui contient ...
            dict["animation_1"] = { "case_1": [id_1, id_2, i_d3.... ] , "case_2": ["id_4", id_5...], ... "case_15" : [ ... ] }
            dict["animation_2"] = {"case_1":[...] ..}
            mais là, je vais avoir besoin des conseils du roux doudou
            parce que , ca me semble extremement lourd....
            mais bon, je préfère demander à mon sensei de JS 😄 que de sortir une solution de mon cul qui risque de pas être folle
        */
        console.log(animation_tile_index)
        tiles = document.querySelectorAll('.foreground-container');
        for(let i = 0; i < tiles.length; i++){
            let animation_tile_len = tiles[i].querySelectorAll('img.animation').length;
            for(let y = 0; y < animation_tile_len; y++){
                if(y == 0){
                    tiles[i].querySelectorAll('img.animation')[y].style.display = "block";
                }else{
                    tiles[i].querySelectorAll('img.animation')[y-1].style.display = "none";
                    tiles[i].querySelectorAll('img.animation')[y].style.display = "block";
                }
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
                animation_1: fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-1').value,
                animation_2: fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-2').value,
                animation_3: fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-3').value,
                animation_4: fg_data[i].querySelector(':scope > div.animations > section.animations-section > div.animation-items > select#animation-4').value,
                time_duration: parseInt(fg_data[i].querySelector(':scope > div.animations > section.time-section > div > input#animation-duration').value),
            }
        }
        set_foreground(dict);
        let img_animation_index = 0;
        let img_animation_len = document.querySelectorAll('img.animation').length;
        console.log(document.querySelectorAll('img.animation'));
        setInterval( function(){
            if(img_animation_index <= document.querySelectorAll('img.animation').length){
                img_animation_index++;
            }else{
                img_animation_index = 0;
            }
            animate_foreground_tiles(img_animation_index);
        }, "500");

    })

