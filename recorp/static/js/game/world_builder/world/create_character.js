let user_is_on_mobile_bool = is_user_is_on_mobile_device()

let action_listener_touch_click = user_is_on_mobile_bool === true ? 'touchstart' : 'click';
let faction_element = document.querySelectorAll('.faction');
let faction_selected = ""

let previous_button = document.querySelector("#previous-btn");
let next_button = document.querySelector("#next-btn");

let faction_window = document.querySelector("#character-faction");
let stats_window = document.querySelector('#character-stats');



previous_button.addEventListener(action_listener_touch_click, function(){
    stats_window.classList.add('hidden');
    faction_window.classList.remove('hidden');
})

next_button.addEventListener(action_listener_touch_click, function(){
    faction_window.classList.add('hidden');
    stats_window.classList.remove('hidden');
})


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

