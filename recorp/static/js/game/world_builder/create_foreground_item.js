const size = JSON.parse(document.getElementById('script_size').textContent);
const planet_dir = JSON.parse(document.getElementById('script_planet').textContent);
const station_dir = JSON.parse(document.getElementById('script_station').textContent);
const asteroid_dir = JSON.parse(document.getElementById('script_asteroid').textContent);
let fg_item_choice = document.querySelectorAll('input[name=item-type-choice-section]');
let animation_selection = document.querySelectorAll('.animation-selection');
let animation_array = []
let fg_item = "";
let col = 0;
let row = 0;

let display_animation_file_choice = function(){
    fg_item = this.value;
    switch(fg_item){
        case "planet":
            col = row = size[0]["planet"]["size_x"];
            append_select_field(planet_dir);
            break;
        case "station":
            col = row = size[1]["station"]["size_x"];
            append_select_field(station_dir);
            break;
        case "asteroid":
            col = row = size[2]["asteroid"]["size_x"];
            append_select_field(asteroid_dir);
            break;
        default:
            break;
    }
    document.querySelector(".animations").style.display = "block";
    document.querySelector('#preview').innerHTML = "";
    create_table();
}

let display_animation_preview = function(e){
    let element = this.parentNode.parentNode.parentNode;
    let animation_number = e.target.id.split('-')[1];
    console.log(animation_number)
    let directory = e.target.value;
    document.querySelector('#preview-'+animation_number).innerHTML = "";

    if(directory !== "none"){
        let animation_i = 0;
        let tr = "";
        let td = "";
        let table = "";

        for(let row_i = 0; row_i < row; row_i++){

            table = element.querySelector('#preview-'+animation_number)
            tr = document.createElement('tr');
            tr.classList.add('rows', "no-borders");

            for(let col_i = 0; col_i < col; col_i++){
                let bg_url = '/static/img/atlas/foreground/' + fg_item + '/' + directory + '/' + animation_i + '.png';
                td = document.createElement('td');

                td.classList.add("w-[32px]", "h-[32px]", "m-0", "p-0", "z-5", "no-borders");
                td.style.backgroundImage = "url('" + bg_url + "')";

                tr.appendChild(td)
                table.appendChild(tr);
                animation_i++;
            }

        }
        element.querySelector('#preview-animation-'+animation_number).style.display = "block";
    }else{
        element.querySelector('#preview-animation-'+animation_number).style.display = "none";
    }
}

function append_select_field(array){
    array.unshift("none");
    for(let a = 0; a < animation_selection.length; a++){
        if(animation_selection[a].length > 0){
            animation_selection[a].innerHTML = "";
        }
        for(let i = 0; i < array.length; i++){
            let opt = document.createElement('option');
            opt.value = array[i];
            opt.innerHTML = array[i];
            animation_selection[a].appendChild(opt);
        }
        animation_selection[a].addEventListener('change', display_animation_preview);
    }
}

for(let i = 0; i < fg_item_choice.length; i++){
    fg_item_choice[i].addEventListener('click', display_animation_file_choice);
}
function create_table(){
    for(let row_i = 0 ; row_i < row ; row_i++){
        let table = document.querySelector('#preview')
        let tr = document.createElement('tr');
        tr.classList.add('rows');

        for(let col_i = 0; col_i < col; col_i++){
            let td = document.createElement('td');
            td.classList.add("w-[32px]", "h-[32px]", "m-0", "p-0", "z-5", "no-borders");

            let div = document.createElement('div');
            div.classList.add('relative', 'w-[32px]', 'h-[32px]', 'hover:border', 'hover:border-amber-400', 'border-dashed', 'block', 'hover:bg-slate-300/10');
            td.appendChild(div)

            tr.appendChild(td)
            table.appendChild(tr);
        }
    }
}

function add_image_to_preview(){
    for(let i = 0; i < animation_selection.length; i++){
        if(animation_selection[i].value !== "none"){
            animation_array.push(animation_selection[i].value)
        }
    }
    for(animation in animation_array){
        let animation_i = 0;
        for(let row_i = 0; row_i < row ; row_i++){
            for(let col_i = 0; col_i < col; col_i++){
                let img = document.createElement('img');
                let img_url = '/static/img/atlas/foreground/' + fg_item + '/' + animation_array[animation] + '/' + animation_i + '.png';
                img.src = img_url;
                img.classList.add('animation', 'z-2', 'absolute', 'm-auto', 'left-0', 'right-0', 'no-borders', 'animation-'+animation);
                document.querySelector('.tabletop-view').rows[row_i].cells[col_i].querySelector('div').append(img);
                animation_i++;
            }
        }
        animation_i = 0;

    }
}

function display_animation(timer="500"){
        let animation_array_len = animation_array.length;
        let current_elements = "";
        let previous_elements = "";
        let index = 0;
        setInterval( function(){
            const previousIndex = index === 0 ? animation_array_len - 1 : index - 1
            current_elements = document.querySelectorAll('.animation-'+ index);
            previous_elements = document.querySelectorAll('.animation-'+ previousIndex);
            for(let i = 0; i < current_elements.length; i++){
                previous_elements[i].style.display = "none";
                current_elements[i].style.display = "block";
            }
            index++;
            if(index >= animation_array_len){
                index = 0;
            }
        }, timer);

}

let preview_btn = document.querySelector('#preview-btn');
preview_btn.addEventListener('click', function() {
    add_image_to_preview();
    display_animation("250");
})

