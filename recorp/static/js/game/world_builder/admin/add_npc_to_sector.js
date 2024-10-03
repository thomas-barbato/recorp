const csrf_token = document.getElementById('csrf_token').value;
let atlas = {
    "col": 40,
    "row": 40,
    "tilesize": 32,
    "map_width_size": 40 * 32,
    "map_height_size": 40 * 32,
}


function clean_entire_map() {
    let tiles = document.querySelectorAll('.tile');
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].style.backgroundImage = "";
    }
}

function add_background(folder_name) {
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
}

function add_foreground(obj) {
    for (let obj_i in obj) {
        console.log(obj[obj_i].item_data)
        let fg_item_type = obj[obj_i].type
        console.log(fg_item_type)
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

function load_map_data(object) {
    let sector_bg_image = object.sector.image;
    add_background(sector_bg_image);
    add_foreground(object.sector_element);
}

let sector_selection = document.querySelector('#sector-select');
sector_selection.addEventListener('change', function() {
    console.log("dedans")
    let map_id = this.value;
    let map_name = this.options[this.selectedIndex].text;
    let modal_item_title = document.querySelector('#delete-item-title');
    modal_item_title.textContent = map_name + " (" + map_id + ") ";
    if (map_id !== "none") {
        let url = 'npc'
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
                console.log(JSON.parse(data))
                load_map_data(JSON.parse(data));
            })
            .catch(error => console.error(error));
    } else {
        clean_entire_map()
    }
})