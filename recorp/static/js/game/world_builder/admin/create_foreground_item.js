const size = JSON.parse(document.getElementById('script_size').textContent);
const planet_url = JSON.parse(document.getElementById('script_planet_url').textContent);
const station_url = JSON.parse(document.getElementById('script_station_url').textContent);
const asteroid_url = JSON.parse(document.getElementById('script_asteroid_url').textContent);
const star_url = JSON.parse(document.getElementById('script_star_url').textContent);
const blackhole_url = JSON.parse(document.getElementById('script_blackhole_url').textContent);
const satellite_url = JSON.parse(document.getElementById('script_satellite_url').textContent);
const warpzone_url = JSON.parse(document.getElementById('script_warpzone_url').textContent);
let fg_item_choice = document.querySelectorAll('input[name=item-type-choice-section]');
let animation_selection = document.querySelectorAll('.animation-selection');
let animation_array = []
let fg_item = "";
let atlas = {
    'col': 0,
    'row': 0,
    'tile_size': 32,
    'map_height_size': 0,
    'map_width_size': 0,
};

let display_animation_file_choice = function() {
    reset_field();
    fg_item = this.value;
    switch (fg_item) {
        case "planet":
            atlas.col = atlas.row = size[0]["planet_data"].x;
            append_select_field(planet_url);
            break;
        case "station":
            atlas.col = atlas.row = size[1]["station_data"].x;
            append_select_field(station_url);
            break;
        case "asteroid":
            atlas.col = atlas.row = size[2]["asteroid_data"].x;
            append_select_field(asteroid_url);
            break;
        case "satellite":
            atlas.col = atlas.row = size[3]["satellite_data"].x;
            append_select_field(satellite_url);
            break;
        case "blackhole":
            atlas.col = size[4]["blackhole_data"].x;
            atlas.row = size[4]["blackhole_data"].y;
            append_select_field(blackhole_url);
            break;
        case "star":
            atlas.col = atlas.row = size[5]["star_data"].x;
            append_select_field(star_url);
            break;
        case "warpzone":
            atlas.col = atlas.row = size[6]["warpzone_data"].x;
            atlas.row = atlas.row = size[6]["warpzone_data"].y;
            append_select_field(warpzone_url);
            break;
        default:
            break;
    }
    atlas.map_height_size = atlas.row * atlas.tile_size;
    atlas.map_width_size = atlas.col * atlas.tile_size;
    document.querySelector(".animations").style.display = "block";
    document.querySelector('#preview').innerHTML = "";
    create_table();
}

let display_animation_preview = function(e) {
    let element = this.parentNode.parentNode.parentNode;
    let directory = e.target.value;
    document.querySelector('#preview').innerHTML = "";

    if (directory !== "none") {
        let image_name = '0.gif';
        let tr = "";
        let td = "";
        let table = "";
        let bg_url = `/static/img/foreground/${fg_item}/${directory}/${image_name}`;
        let index = 0;

        for (let row_i = 0; row_i < atlas.map_height_size; row_i += atlas.tile_size) {
            table = element.querySelector('#preview')
            tr = document.createElement('tr');
            tr.classList.add('rows', "no-borders");

            for (let col_i = 0; col_i < atlas.map_width_size; col_i += atlas.tile_size) {
                td = document.createElement('td');
                td.classList.add("w-[32px]", "h-[32px]", "m-0", "p-0", "z-5", "no-borders");
                td.id = index;
                td.style.backgroundImage = "url('" + bg_url + "')";
                td.style.backgroundPositionX = `-${col_i}px`;
                td.style.backgroundPositionY = `-${row_i}px`;
                tr.appendChild(td);
                table.appendChild(tr);
                index++;
            }
        }
    } else {
        element.querySelector('#preview-animation').classList.add('hidden');
    }
}

function append_select_field(array) {
    for (let a = 0; a < animation_selection.length; a++) {
        if (animation_selection[a].length > 0) {
            animation_selection[a].innerHTML = "";
        }

        let opt_none = document.createElement('option');
        opt_none.value = "none";
        opt_none.innerHTML = "none";
        animation_selection[a].appendChild(opt_none);

        for (let i = 0; i < array.length; i++) {
            let opt = document.createElement('option');
            opt.value = array[i];
            opt.innerHTML = array[i];
            animation_selection[a].appendChild(opt);
        }
        animation_selection[a].addEventListener('change', display_animation_preview);
    }
}

function reset_field() {
    let select = document.querySelectorAll('select');
    let table = document.querySelectorAll('tbody');
    for (let i = 0; i < select.length; i++) {
        select[i].innerHTML = "";
        table[i].innerHTML = "";
    }
}

for (let i = 0; i < fg_item_choice.length; i++) {
    fg_item_choice[i].addEventListener('click', display_animation_file_choice);
}

function create_table() {
    for (let row_i = 0; row_i < atlas.map_height_size; row_i += atlas.tile_size) {
        let table = document.querySelector('#preview')
        let tr = document.createElement('tr');
        tr.classList.add('rows');

        for (let col_i = 0; col_i < atlas.map_width_size; col_i += atlas.tile_size) {
            let td = document.createElement('td');
            td.classList.add(
                "absolute",
                "w-[32px]",
                "h-[32px]",
                "m-0",
                "p-0",
                "z-5",
                "no-borders"
            );

            let div = document.createElement('div');
            div.classList.add(
                'w-[32px]',
                'h-[32px]',
                'border-dashed',
                'block',
                "m-0",
                "p-0",
                "z-5",
                'hover:bg-slate-300/10'
            );
            td.appendChild(div)
            tr.appendChild(td)
            table.appendChild(tr);
        }
    }
}
