    function append_foreground_menu(){
        let len_element = parseInt(document.querySelectorAll('.foreground-menu-item').length) + 1
        let element = document.querySelector('#foreground-menu-1');
        let clone = element.cloneNode(true)
        clone.id = "foreground-menu-" + len_element;
        let last_element = Array.from(document.querySelectorAll('.foreground-menu-item')).pop();
        last_element.after(clone);
    }

    let button_add_foreground = document.querySelector('#add-foreground-item')
    button_add_foreground.addEventListener('click', function(){
        append_foreground_menu()
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
        let cell = 0;
        for(let data in dict){
            if(dict[data]['item_select'] !== "none"){
                for(let row = dict[data]['coord_y']; row < dict[data]['coord_y'] + dict[data]['size_y']; row++){
                    for(let col = dict[data]['coord_x']; col < dict[data]['coord_x'] + dict[data]['size_x']; col++){
                        let fg_image = document.createElement('img')
                        let fg_url = '/static/img/atlas/foreground/' + dict[data]['item_select'] + '/' + cell + '.png';
                        fg_image.classList.add('planete', 'z-2', 'absolute', 'block', 'm-auto', 'left-0', 'right-0');
                        fg_image.src = fg_url;
                        document.querySelector('.tabletop-view').rows[row].cells[col].querySelector('div').append(fg_image);
                        cell++;
                    }
                }
            }
            cell = 0;
        }
    }

    
    let preview = document.querySelector("#preview");
    
    preview.addEventListener('click', function() {
        let fg_data = document.querySelectorAll('.foreground-menu-item');
        let bg_folder = document.getElementById("background").value;
        let dict = new Object();
        add_background(bg_folder);
        for(let i = 0; i < fg_data.length ; i++){
            dict[i] = {
                item_select: fg_data[i].querySelector(':scope > select#foreground').value,
                size_x: parseInt(fg_data[i].querySelector(':scope > div > section.size > div.size_x > input').value),
                size_y: parseInt(fg_data[i].querySelector(':scope > div > section.size > div.size_y > input').value),
                coord_x: parseInt(fg_data[i].querySelector(':scope > div > section.coord > div.coord_x > input').value) + 1,
                coord_y: parseInt(fg_data[i].querySelector(':scope > div > section.coord > div.coord_y > input').value) + 1
            }
        }
        add_foreground(dict);
    })
    
