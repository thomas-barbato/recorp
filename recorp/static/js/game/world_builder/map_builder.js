    let element = document.querySelector('#foreground-menu-0');
    let dict = new Object();

    function append_foreground_menu(element){
        if(document.querySelectorAll('.foreground-menu-item').length){
            len_element = parseInt(document.querySelectorAll('#foreground-menu').length)
            let clone = element.cloneNode(true)
            clone.id = "foreground-menu-" + len_element;
            let last_element = Array.from(document.querySelectorAll('.foreground-menu-item')).pop();
            last_element.after(clone);
        }else{
            document.querySelector('#foreground-menu').appendChild(element)
        }
    }

    let tile = document.querySelectorAll('.tile')
    for(let i = 0; i < tile.length; i++){
        tile[i].addEventListener('click', function(){
            let value = tile[i].id.split('_')
            console.log(value)
            let radio_btn = document.querySelectorAll(".coord-radio-button");
            radio_btn[radio_btn.length-1].id = "coord-radio-button-" + radio_btn.length;
            console.log(radio_btn.id);
            let id = "";
            for(let i = 0 ; i < radio_btn.length ; i++){
                if (radio_btn[i].checked) {
                    id = parseInt(radio_btn[i].id.split('-')[3]) - 1;
                    console.log(id)
                    console.log(value[0] + " " + value[1]);
                    document.querySelector('#foreground-menu-'+id+' > div.coord_size > section.coord > div.coord_x > input').value = parseInt(value[0]);
                    document.querySelector('#foreground-menu-'+id+' > div.coord_size > section.coord > div.coord_y > input').value = parseInt(value[1]);
                    break;
                }
            }
        })
    }

    let button_add_foreground = document.querySelector('#add-foreground-item')
    button_add_foreground.addEventListener('click', function(){
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

    function add_foreground(dict){
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
                        let fg_url = '/static/img/atlas/foreground/' + dict[data]['item_select'] + '/' + cell + '.png';
                        fg_image.src = fg_url;
                        fg_image.classList.add('planete', 'z-2', 'absolute', 'block', 'm-auto', 'left-0', 'right-0');
                        document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').classList.add('foreground-container')
                        document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').append(fg_image);

                        add_animation(animation_data, cell, row, col);
                        cell++;
                    }
                }
            }
            cell = 0;
        }
    }

    function add_animation(animation_array, cell, row, col){
        for(animation in animation_array){
            if(animation_array[animation] !== "none"){
                let fg_animation = document.createElement('img');
                let fg_animation_url = '/static/img/atlas/foreground/' + animation_array[animation] + '/' + cell + '.png';
                fg_animation.src = fg_animation_url;
                fg_animation.style.display = "none";
                fg_animation.classList.add('planete', 'animation', 'z-2', 'absolute', 'm-auto', 'left-0', 'right-0');
                document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').append(fg_animation);
            }
        }
    }

    function animate_foreground() {
      let tiles = document.querySelectorAll('.foreground-container');
      let image_max_range = tiles[0].querySelectorAll('img.animation').length;
      let counter = 0;
      for(let i = 0; i < image_max_range; i++){
        for(let t = 0; t < tiles.length; t++){
            let current_tile = tiles[t].querySelectorAll('img.animation');
            console.log(current_tile);
            if(i == counter){
                current_tile[i].style.display= "block";
            }else{
                current_tile[i].style.display= "none";
            }
        }
        counter++;
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
                item_select: fg_data[i].querySelector(':scope > select#foreground').value,
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
        console.log(dict)
        add_foreground(dict);
        setInterval( animate_foreground, "1000");
    })

