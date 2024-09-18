const csrf_token = document.getElementById('csrf_token').value;
const ship_select = document.querySelector('#ship-select');
const ship_img = document.querySelector('#spaceship-img');
let resources_values = document.querySelectorAll('.resources');
let module_select = document.querySelectorAll('.module-multi-select');
let spaceship_description_element = document.querySelectorAll('.description-spaceship')
let selected_spaceship_name = "";
let dict = [];


let submit_button = document.querySelector('#npc-create-btn');
let cancel_button = document.querySelector('#npc-cancel-btn');

// CHANGE CHARACTER IMG ZONE
ship_select.addEventListener('change', function() {
    let selected_element = ship_select.options[ship_select.selectedIndex];
    let select_ship_description_id = selected_element.dataset.shipid;
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
    selected_spaceship_name = selected_ship.textContent;
    let ship_image = document.querySelector('#spaceship-img').src.split('/')
    let ship_image_name = ship_image[ship_image.length - 1];
    let difficulty_input = document.querySelector('#difficulty-select');
    let difficulty = difficulty_input.value;
    let skill_select = document.querySelectorAll('.skill-input');
    let skill_info_array = [];
    let module_select = document.querySelectorAll('.module-select')
    let module_info_array = [];
    let resource_info_array = [];
    let resource_select = document.querySelectorAll('.resources')

    let modal_template_title = document.getElementById('npc-template-modal-title');



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

    for (let i = 0; i < resource_select.length; i++) {
        if (resource_select[i].value > 0) {
            let id = resource_select[i].id.split("-")[2]
            let randomizer_is_checked = document.getElementById('resource-input-randomized-' + id).checked
            let name = document.getElementById('resource-input-label-' + id).textContent;
            resource_info_array.push({
                'id': id,
                'name': name,
                'quantity': resource_select[i].value,
                'can_be_randomized': randomizer_is_checked
            })
        }
    }
    if (template_selected_name == "none") {
        modal_template_title.textContent = "Create new template";
    } else {
        modal_template_title.textContent = `Update ${template_select.textContent}`;
    }
    if (ship_image_name) {
        let modal_spaceship = document.getElementById('npc-template-modal-spaceship');
        modal_spaceship.src = `/static/js/game/assets/ships/${ship_image_name}`;
        modal_spaceship.classList.remove('hidden');
        modal_spaceship_warning = document.getElementById('npc-template-modal-spaceship-warning').classList.add('hidden');
        submit_button.disabled = false;
    } else {
        let modal_spaceship = document.getElementById('npc-template-modal-spaceship');
        modal_spaceship.src = "";
        modal_spaceship.classList.add('hidden');
        modal_spaceship_warning = document.getElementById('npc-template-modal-spaceship-warning').classList.remove('hidden');
        submit_button.disabled = true;
    }
    if (template_name) {
        let template_name_element = document.getElementById('npc-template-modal-name')
        template_name_element.textContent = template_name;
        template_name_element.classList.add('bg-gray-600', 'border', 'border-gray-800');
    }

    for (let skill in skill_info_array) {
        let skill_element_li = document.createElement('li');
        skill_element_li.textContent = `${skill_info_array[skill].name}: ${skill_info_array[skill].level}`;
        skill_element_li.classList.add('list-none', 'bg-gray-600', 'border', 'border-gray-800', 'delete-after-cancel', 'text-shadow');
        document.querySelector('#npc-template-modal-skills-ul').append(skill_element_li)
    }

    let module_slot_avaiable_on_ship_element = document.getElementById(`${selected_spaceship_name}-module-slot-available`)
    let module_slot_available_on_ship = "";
    let module_element_span_moduleCount = document.querySelector('#npc-template-modal-module-moduleCount');
    let module_element_span_moduleCount_warningMsg = document.querySelector('#npc-template-modal-module-moduleCount-warning');
    let module_element_span_moduleCount_warningMsgValue = document.querySelector('#npc-template-modal-module-moduleCount-warning-value');
    let module_element_span_spaceship_warningMsg = document.querySelector('#npc-template-modal-module-spaceship-warning');

    if (module_info_array.length > 0) {
        document.querySelector('#npc-template-modal-module-warning-li').classList.add('hidden');
        for (let module in module_info_array) {
            let module_element_li = document.createElement('li');
            let module_element_li_span_name = document.createElement('span');
            let module_element_li_span_id = document.createElement('span');
            let module_element_li_span_effects = document.createElement('span');

            module_element_li_span_id.classList.add('text-center', 'font-bold', 'text-shadow');
            module_element_li_span_id.textContent = `id: ${module_info_array[module].id}`;
            module_element_li_span_name.classList.add('text-center', 'text-shadow');
            module_element_li_span_name.textContent = `${module_info_array[module].name.split(' -')[0]}`;
            module_element_li_span_effects.classList.add('text-center', 'text-shadow');
            module_element_li_span_effects.textContent = `${module_info_array[module].effects}`;

            module_element_li.classList.add('flex', 'flex-col', 'gap-1', 'text-justify', 'text-shadow');
            module_element_li.append(module_element_li_span_id);
            module_element_li.append(module_element_li_span_name);
            module_element_li.append(module_element_li_span_effects);

            module_element_li.classList.add('list-none', 'bg-gray-600', 'border', 'border-gray-800', 'delete-after-cancel');
            document.querySelector('#npc-template-modal-module-ul').append(module_element_li)
        }
        module_slot_available_on_ship = module_slot_avaiable_on_ship_element ? parseInt(document.getElementById(`${selected_spaceship_name}-module-slot-available`).textContent) : -1;
        if (module_slot_avaiable_on_ship_element != -1) {
            module_element_span_spaceship_warningMsg.classList.add('hidden');
        } else {
            module_element_span_spaceship_warningMsg.classList.remove('hidden');

        }
        module_element_span_moduleCount.textContent = `(${module_info_array.length} selected)`;
        if (module_info_array.length <= module_slot_available_on_ship) {
            module_element_span_moduleCount.classList.add('text-lime-400', 'text-shadow');
            module_element_span_moduleCount.classList.remove('text-red-600', 'text-shadow');
            module_element_span_moduleCount_warningMsg.classList.add('hidden');
            submit_button.disabled = false;
        } else {
            module_element_span_moduleCount.classList.remove('text-lime-400', 'text-shadow');
            module_element_span_moduleCount.classList.add('text-red-600', 'text-shadow');
            module_element_span_moduleCount_warningMsgValue.textContent = module_slot_available_on_ship;
            module_element_span_moduleCount_warningMsg.classList.remove('hidden');
            submit_button.disabled = true;
        }
    } else {
        module_element_span_moduleCount.classList.remove('text-lime-400', 'text-shadow');
        module_element_span_moduleCount.classList.add('text-red-600', 'text-shadow');
        if (module_slot_available_on_ship == -1) {
            module_element_span_moduleCount_warningMsg.classList.add('hidden');
            module_element_span_spaceship_warningMsg.classList.remove('hidden');

        }
        submit_button.disabled = true;
    }


    if (resource_info_array.length > 0) {
        document.querySelector('#npc-template-modal-resource-warning-li').classList.add('hidden');
        for (let resource in resource_info_array) {
            let resource_element_li = document.createElement('li');
            let resource_element_li_span_id = document.createElement('span');
            let resource_element_li_span_name = document.createElement('span');
            let resource_element_li_span_canBeRandomized = document.createElement('span');

            resource_element_li.classList.add();
            resource_element_li_span_id.classList.add('text-center', 'font-bold', 'text-shadow');
            resource_element_li_span_id.textContent = `id: ${resource_info_array[resource].id}`;
            resource_element_li_span_name.classList.add('text-center', 'text-shadow');
            resource_element_li_span_name.textContent = `${resource_info_array[resource].name} - quantity : ${resource_info_array[resource].quantity}`;
            resource_element_li_span_canBeRandomized.textContent = `Can be randomized: ${resource_info_array[resource].can_be_randomized}`;
            resource_element_li_span_canBeRandomized.classList.add('text-center', 'text-shadow');


            resource_element_li.classList.add('flex', 'flex-col', 'gap-1', 'text-justify', 'list-none', 'bg-gray-600', 'border', 'border-gray-800', 'delete-after-cancel');
            resource_element_li.append(resource_element_li_span_id);
            resource_element_li.append(resource_element_li_span_name);
            resource_element_li.append(resource_element_li_span_canBeRandomized);

            document.querySelector('#npc-template-modal-resource-ul').append(resource_element_li)
        }
    } else {
        document.querySelector('#npc-template-modal-resource-warning-li').classList.remove('hidden');
    }


    submit_button.addEventListener('click', function() {
        save_or_update_npc_template();
    })

    cancel_button.addEventListener('click', function() {
        document.querySelectorAll('.delete-after-cancel').forEach(el => el.remove());
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
        let skill_array = [];
        let resource_array = [];

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
})