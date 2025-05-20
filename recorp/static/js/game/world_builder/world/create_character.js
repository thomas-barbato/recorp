let user_is_on_mobile_bool = is_user_is_on_mobile_device()

let action_listener_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'click';
let faction_element = document.querySelectorAll('.faction');
let faction_selected = ""

let previous_button = document.querySelector("#previous-btn");
let next_button = document.querySelector("#next-btn");

let faction_window = document.querySelector("#character-faction");
let stats_window = document.querySelector('#character-stats');

const reader = new FileReader();
const img_user = document.querySelector('#user-avatar');
const img_input = document.querySelector('.hidden-input-file');

let atlas = {
    "col": 40,
    "row": 40,
    "tilesize": 32,
    "map_width_size": 40 * 32,
    "map_height_size": 40 * 32,
}

previous_button.addEventListener(action_listener_touch_click, function(){
    stats_window.classList.add('hidden');
    faction_window.classList.remove('hidden');
})

next_button.addEventListener(action_listener_touch_click, function(){
    faction_window.classList.add('hidden');
    stats_window.classList.remove('hidden');
})

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
        element.querySelector('#preview-animation').style.display = "block";
    } else {
        element.querySelector('#preview-animation').style.display = "none";
    }
}


for(let i = 0 ; i < faction_element.length ; i++){
    faction_element[i].addEventListener(action_listener_touch_click, function(){
        if(faction_element[i].classList.contains('bg-gray-600/40')){
            faction_element[i].classList.remove('bg-gray-600/40', 'hover:bg-[#B1F1CB]/30');
            faction_element[i].classList.add('bg-[#B1F1CB]/30', 'border', 'border-1', 'border-white', 'box-border');
        }else{
            faction_element[i].classList.remove('bg-[#B1F1CB]/30', 'border', 'border-1', 'border-white', 'box-border');
            faction_element[i].classList.add('bg-gray-600/40', 'hover:bg-[#B1F1CB]/30');
        }

        this_element = this;
        faction_selected = this.id.split('-')[1];

        if(faction_selected){
            document.querySelector('#next-btn').classList.remove('invisible');
        }
        for(let y = 0; y < faction_element.length; y++){
            if(this_element != faction_element[y]){
                faction_element[y].classList.remove('bg-[#B1F1CB]/30', 'hover:bg-gray-600/40', 'border', 'border-1', 'border-white', 'box-border');
                faction_element[y].classList.add('bg-gray-600/40', 'hover:bg-[#B1F1CB]/30');
            }
        }

        this_element = undefined;
    })
}

reader.onload = e => {
    img_user.src = e.target.result;
}

img_user.addEventListener('click',function(){
    img_input.click();
})

img_input.addEventListener('change', e => {
    const f = e.target.files[0];
    reader.readAsDataURL(f);
    img_user.classList.add('border-1')
})