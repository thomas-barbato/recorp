const csrf_token = document.getElementById('csrf_token').value;
const ship_select = document.querySelector('#ship-select');
const ship_img = document.querySelector('#spaceship-img');
let resources_values = document.querySelectorAll('.resources');
let module_select = document.querySelectorAll('.module-multi-select');
let spaceship_description_element = document.querySelectorAll('.description-spaceship')
let dict = [];

// CHANGE CHARACTER IMG ZONE
ship_select.addEventListener('change', function() {
    let selected_element = ship_select.options[ship_select.selectedIndex];
    let select_ship_description_id = selected_element.dataset.shipid;
    let select_ship_description = document.querySelector('#description-ship-' + select_ship_description_id);
    ship_img.src = "";

    if (selected_element.value != "none") {
        let img_name = `${selected_element.dataset.imagename}.png`;
        ship_img.src = `/static/js/game/assets/ships/${img_name}`;
        ship_img.classList.remove('hidden')
        for (let i = 0; i < spaceship_description_element.length; i++) {
            let element_id = spaceship_description_element[i].id.split('-')[2];
            if (element_id == select_ship_description_id) {
                spaceship_description_element[i].classList.remove('hidden')
            } else {
                spaceship_description_element[i].classList.add('hidden')
            }
        }
    } else {
        for (let i = 0; i < spaceship_description_element.length; i++) {
            spaceship_description_element[i].classList.add('hidden')
        }
    }
});

for (let i = 0; i < resources_values.length; i++) {
    resources_values[i].addEventListener('change', function() {
        if (this.value > 300) {
            this.value = 300;
        } else if (this.value < 0) {
            this.value = 0;
        }
    })
}

let npc_submit_button = document.querySelector('#npc-creation-input-button');

npc_submit_button.addEventListener('click', function() {
    let template_select = document.querySelector('#template-select');
    let template_selected_name = template_select.options[template_select.selectedIndex].value;
    let template_name = document.querySelector('#template-name-input').value;
    let selected_ship = ship_select.options[ship_select.selectedIndex];
    let ship_id = selected_ship.value;
    let ship_name = selected_ship.textContent;
    let ship_image = document.querySelector('#spaceship-img').src;
    let difficulty_input = document.querySelector('#difficulty-select');
    let difficulty = difficulty_input.value;
    let skill_select = document.querySelectorAll('.skill-input');
    let skill_info_array = [];
    let module_select = document.querySelectorAll('.module-select')
    let module_info_array = [];


    for (let i = 0; i < skill_select.length; i++) {
        if (skill_select[i].checked) {
            skill_info_array.push({ "name": skill_select[i].value, "level": parseInt(difficulty) })
        } else {
            skill_info_array.push({ "name": skill_select[i].value, "level": 0 })
        }
    }

    for (let i = 0; i < module_select.length; i++) {
        var selected = Array.from(module_select[i].options).filter(function(option) {
            return option.selected;
        });

        for (let y = 0; y < selected.length; y++) {
            if (selected[y].id != "module-li-none") {
                module_info_array.push({
                    "id": selected[y].id.split("-")[2],
                    "name": selected[y].textContent,
                    "effects": selected[y].dataset.moduleeffect
                })
            }
        }
    }

    console.log(module_info_array)
})


let submit_button = document.querySelector('#npc-create-btn');
submit_button.addEventListener('click', function() {
    save_or_update_npc_template();
})

function save_or_update_npc_template() {
    let template_select = document.querySelector('#template-select');
    let template_selectedElement = template_select.options[template_select.selectedIndex];
    let template_name = document.querySelector('#template-name-input');
    let difficulty_input = document.querySelector('#difficulty-select');
    let difficulty = difficulty_input.value;
    let ship_select = document.querySelector('#ship-select');
    let ship_selectedElement = ship_select.options[ship_select.selectedIndex];
    let skill_select = document.querySelectorAll('.skill-input');
    let resource_select = document.querySelectorAll('.resources');
    let skill_array = []
    let resource_array = []

    for (let i = 0; i < skill_select.length; i++) {
        skill_array.push({ "id": skill_select[i].id.split('-')[2], "checked": skill_select[i].checked })
    }

    for (let i = 0; i < resource_select.length; i++) {
        resource_array.push({ "id": resource_select[i].id.split('-')[2], "quantity": resource_select[i].value })
    }

    let edit_template = false;
    if (template_selectedElement.value != "none") {
        edit_template = true;
    }
    if (ship_selectedElement.value != "none" && ship_selectedElement.value && template_name.value) {
        let template_data = {
            "template_name": template_name.value,
            "template_difficulty": difficulty,
            "template_ship": ship_selectedElement.value,
            "template_skills": skill_array,
            "template_resource": resource_array
        }

        const headers = new Headers({
            'Content-Type': 'x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf_token
        });
        let url = 'npc_template_add'
        fetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
                'data': template_data,
            })
        }).then(() => {
            window.location.reload();
        });
    }

}
