const csrf_token = document.getElementById('csrf_token').value;
const ship_select = document.querySelector('#ship-select');
const ship_img = document.querySelector('#spaceship-img');
let resources_values = document.querySelectorAll('.resources');
let module_select = document.querySelectorAll('.module-multi-select');
let spaceship_description_element = document.querySelectorAll('.description-spaceship')
let selected_spaceship_name = "";
let dict = [];
let skill_dict = [];
let module_info_array = [];
let submit_button = document.querySelector('#npc-create-btn');
let cancel_button = document.querySelector('#npc-cancel-btn');
let delete_button = document.querySelector('#modal-delete-confirmation-btn');

function parseModuleEffects(rawValue) {
    if (!rawValue) return [];
    let parsed = [];
    try {
        parsed = JSON.parse(rawValue);
    } catch (e1) {
        try {
            parsed = JSON.parse(String(rawValue).replace(/'/g, '"'));
        } catch (e2) {
            parsed = [];
        }
    }
    if (Array.isArray(parsed)) return parsed.filter((entry) => entry && typeof entry === "object");
    if (parsed && typeof parsed === "object") return [parsed];
    return [];
}

function mergeModuleEffects(effects) {
    if (!Array.isArray(effects)) return {};
    return effects.reduce((acc, effect) => {
        if (!effect || typeof effect !== "object") return acc;
        Object.entries(effect).forEach(([key, value]) => {
            if (value == null || key === "label") return;
            if (typeof value === "number") {
                acc[key] = (typeof acc[key] === "number" ? acc[key] : 0) + value;
            } else if (!(key in acc)) {
                acc[key] = value;
            }
        });
        return acc;
    }, {});
}

// CHANGE CHARACTER IMG ZONE
ship_select.addEventListener('change', function() {
    let selected_element = ship_select.options[ship_select.selectedIndex];
    let select_ship_description_id = selected_element.dataset.shipid;
    ship_img.src = "";

    if (selected_element.value != "none") {
        let img_name = `${selected_element.dataset.imagename}.png`;
        ship_img.src = `/static/img/foreground/SHIPS/${img_name}`;
        ship_img.classList.remove('hidden')
        for (let i = 0; i < spaceship_description_element.length; i++) {
            let element_id = spaceship_description_element[i].id.split('-')[2];
            if (element_id == select_ship_description_id) {
                spaceship_description_element[i].classList.remove('hidden');
                spaceship_description_element[i].classList.add('selected-spaceShip');
            } else {
                spaceship_description_element[i].classList.add('hidden');
                spaceship_description_element[i].classList.remove('selected-spaceShip');
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
    const displayedNameInput =document.querySelector('#template-displayed-name-input');
    let template_displayed_name = displayedNameInput ? displayedNameInput.value.trim() : "";
    let selected_ship = ship_select.options[ship_select.selectedIndex];
    let ship_id = selected_ship.value;
    selected_spaceship_name = selected_ship.textContent;
    let ship_image = document.querySelector('#spaceship-img').src.split('/')
    let ship_image_name = ship_image[ship_image.length - 1];
    let difficulty_input = document.querySelector('#difficulty-select');
    let difficulty = difficulty_input.value;
    let respawn_delay_input = document.querySelector('#respawn-delay-select');
    let respawn_delay_seconds = respawn_delay_input ? parseInt(respawn_delay_input.value || "120") : 120;
    let skill_select = document.querySelectorAll('.skill-input');
    let skill_info_array = [];
    let module_select = document.querySelectorAll('.module-select')
    module_info_array = [];
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
                const parsedEffects = parseModuleEffects(selected[y].dataset.moduleeffects);
                module_info_array.push({
                    "id": selected[y].id.split("-")[2],
                    "name": selected[y].dataset.modulename || selected[y].textContent,
                    "effects": parsedEffects,
                    "type": selected[y].dataset.moduletype
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
    if (ship_image && template_name && ship_image[ship_image.length - 1] != "") {
        submit_button.disabled = false;
    } else {
        submit_button.disabled = true;
    }

    if (template_selected_name == "none") {
        modal_template_title.textContent = "Create new template";
    } else {
        modal_template_title.textContent = `Update ${template_select.textContent}`;
    }
    if (ship_image_name) {
        let modal_spaceship = document.getElementById('npc-template-modal-spaceship');
        modal_spaceship.src = `/static/img/foreground/SHIPS/${ship_image_name}`;
        modal_spaceship.classList.remove('hidden');
        modal_spaceship_warning = document.getElementById('npc-template-modal-spaceship-warning').classList.add('hidden');
    } else {
        let modal_spaceship = document.getElementById('npc-template-modal-spaceship');
        modal_spaceship.src = "";
        modal_spaceship.classList.add('hidden');
        modal_spaceship_warning = document.getElementById('npc-template-modal-spaceship-warning').classList.remove('hidden');
    }
    if (template_name) {
        let template_name_element = document.getElementById('npc-template-modal-name')
        template_name_element.textContent = template_name;
        template_name_element.classList.add('bg-gray-600', 'border', 'border-gray-800');
        document.querySelector('#npc-template-modal-name-warning').classList.add('hidden');
    } else {
        document.querySelector('#npc-template-modal-name-warning').classList.remove('hidden');
    }
    if (template_displayed_name) {
        let template_displayed_name_element = document.getElementById('npc-template-modal-displayed-name')
        template_displayed_name_element.textContent = template_displayed_name;
        template_displayed_name_element.classList.add('bg-gray-600', 'border', 'border-gray-800');
        document.querySelector('#npc-template-modal-displayed-name-warning').classList.add('hidden');
    } 

    for (let skill in skill_info_array) {
        let skill_element_li = document.createElement('li');
        skill_element_li.textContent = `${skill_info_array[skill].name}: ${skill_info_array[skill].level}`;
        skill_element_li.classList.add('list-none', 'bg-gray-600', 'border', 'border-gray-800', 'delete-after-cancel', 'text-shadow');
        document.querySelector('#npc-template-modal-skills-ul').append(skill_element_li)
        skill_dict[skill_info_array[skill].name] = skill_info_array[skill].level;
    }


    let module_slot_avaiable_on_ship_element = document.getElementById(`${selected_spaceship_name}-module-slot-available`)
    let module_slot_available_on_ship = "";
    let module_element_span_moduleCount = document.querySelector('#npc-template-modal-module-moduleCount');
    let module_element_span_moduleCount_warningMsg = document.querySelector('#npc-template-modal-module-moduleCount-warning');
    let module_element_span_moduleCount_warningMsgValue = document.querySelector('#npc-template-modal-module-moduleCount-warning-value');
    let module_element_span_spaceship_warningMsg = document.querySelector('#npc-template-modal-module-spaceship-warning');

    let module_data = []

    let selectedSpaceShip_element = document.querySelector('.selected-spaceShip');

    let template_hp_statistics = 0;
    let template_hp_skill_bonus = skill_dict["repaire"];
    let template_hp_module_bonus = 0;
    let template_move_statistics = 0;
    let template_move_skill_bonus = skill_dict["Light"];
    let template_move_module_bonus = 0;
    let template_hold_statistics = 0;

    if (selectedSpaceShip_element) {
        let space_ship_id = selectedSpaceShip_element.id.split('-')[2];
        template_hp_statistics = parseInt(document.querySelector(`#ship-${space_ship_id}-default-hp>span`).textContent);
        template_move_statistics = parseInt(document.querySelector(`#ship-${space_ship_id}-default-move>span`).textContent);
        template_ship_category = skill_dict[document.querySelector(`#ship-${space_ship_id}-default-category>span`).textContent];
    }

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
            module_element_li_span_name.textContent = `${module_info_array[module].name}`;
            module_element_li_span_effects.classList.add('text-center', 'text-shadow');
            module_element_li_span_effects.textContent = `${JSON.stringify(module_info_array[module].effects)}`;
            const mergedEffects = mergeModuleEffects(module_info_array[module].effects);
            
            if (module_info_array[module].type == "HULL" || module_info_array[module].type == "MOVEMENT" || module_info_array[module].type == "HOLD") {
                if (module_info_array[module].type == "HULL") {
                    template_hp_module_bonus = mergedEffects.hp || 0;
                } else if (module_info_array[module].type == "MOVEMENT") {
                    template_move_module_bonus = mergedEffects.movement || 0;
                } else if (module_info_array[module].type == "HOLD") {
                    template_hold_statistics = mergedEffects.capacity || 0;
                }
            }

            module_element_li.classList.add('flex', 'flex-col', 'gap-1', 'text-justify', 'text-shadow');
            module_element_li.append(module_element_li_span_id);
            module_element_li.append(module_element_li_span_name);
            module_element_li.append(module_element_li_span_effects);

            module_element_li.classList.add('list-none', 'bg-gray-600', 'border', 'border-gray-800', 'delete-after-cancel');
            document.querySelector('#npc-template-modal-module-ul').append(module_element_li);
        }
        module_slot_available_on_ship = module_slot_avaiable_on_ship_element ? parseInt(document.getElementById(`${selected_spaceship_name}-module-slot-available`).textContent) : -1;
        if (module_slot_avaiable_on_ship_element != -1) {
            module_element_span_spaceship_warningMsg.classList.add('hidden');
        } else {
            module_element_span_spaceship_warningMsg.classList.remove('hidden');

        }
        module_element_span_moduleCount.textContent = `(${module_info_array.length} / ${module_slot_available_on_ship != -1 ? module_slot_available_on_ship : 0} selected)`;
        if (module_info_array.length <= module_slot_available_on_ship) {
            module_element_span_moduleCount.classList.add('text-lime-400', 'text-shadow');
            module_element_span_moduleCount.classList.remove('text-red-600', 'text-shadow');
            module_element_span_moduleCount_warningMsg.classList.add('hidden');
        } else {
            module_element_span_moduleCount.classList.remove('text-lime-400', 'text-shadow');
            module_element_span_moduleCount.classList.add('text-red-600', 'text-shadow');
            module_element_span_moduleCount_warningMsgValue.textContent = module_slot_available_on_ship > -1 ? module_slot_available_on_ship : 0;
            if (module_slot_available_on_ship == -1) {
                module_element_span_moduleCount_warningMsg.classList.add('hidden');
                module_element_span_spaceship_warningMsg.classList.remove('hidden');
            } else {
                module_element_span_moduleCount_warningMsg.classList.remove('hidden');
                module_element_span_spaceship_warningMsg.classList.add('hidden');
            }
        }
    } else {
        module_element_span_moduleCount.classList.remove('text-lime-400', 'text-shadow');
        module_element_span_moduleCount.classList.add('text-red-600', 'text-shadow');
        if (module_slot_available_on_ship == -1) {
            module_element_span_moduleCount_warningMsg.classList.add('hidden');
            module_element_span_spaceship_warningMsg.classList.remove('hidden');

        }
    }

    let hp_value = document.querySelector('#npc-template-modal-resource-statistics-hp-li-value');
    let move_value = document.querySelector('#npc-template-modal-resource-statistics-movement-li-value');
    let hold_capacity_value = document.querySelector('#npc-template-modal-resource-statistics-holdCapacity-li-value');

    hp_value.textContent = `${parseInt((template_hp_statistics + template_hp_module_bonus) + (50 * (template_hp_skill_bonus / 100)))}`;
    move_value.textContent = `${parseInt((template_move_statistics + template_move_module_bonus) + (25 * (template_move_skill_bonus / 100)))}`;
    hold_capacity_value.textContent = `${template_hold_statistics}`;
    if (template_hold_statistics > 0) {
        hold_capacity_value.classList.add('text-green-400');
        hold_capacity_value.classList.remove('text-red-600');
    } else {
        hold_capacity_value.classList.add('text-red-600');
        hold_capacity_value.classList.remove('text-green-400');
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
})


let template_select = document.querySelector('#template-select');
template_select.addEventListener('change', (e) => {
    let id = template_select.value;
    let delete_preview_btn = document.querySelector('#delete-confirmation-preview-btn');
    if (id != "none") {
        delete_preview_btn.classList.remove('hidden');
        const headers = new Headers({
            'Content-Type': 'x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf_token
        });

        let url = 'npc_template_select'
        fetch(url, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    'data': id,
                })
            }).then(response => response.json())
            .then(data => {
                unload_template_data();
                load_data_from_selected_template(JSON.parse(data));
            })
    } else {
        delete_preview_btn.classList.add('hidden');
        unload_template_data();
    }
})


submit_button.addEventListener('click', function() {
    save_or_update_npc_template();
})

cancel_button.addEventListener('click', function() {
    document.querySelectorAll('.delete-after-cancel').forEach(el => el.remove());
})

delete_button.addEventListener('click', function() {
    delete_this_template();
})

function save_or_update_npc_template() {
    let template_select = document.querySelector('#template-select');
    let template_selectedElement = template_select.options[template_select.selectedIndex];
    let template_name = document.querySelector('#template-name-input');
    let template_displayed_name =  document.querySelector('#template-displayed-name-input');
    let difficulty_input = document.querySelector('#difficulty-select');
    let difficulty = difficulty_input.value;
    let ship_select = document.querySelector('#ship-select');
    let ship_selectedElement = ship_select.options[ship_select.selectedIndex];
    let skill_select = document.querySelectorAll('.skill-input');
    let behavior_select = document.querySelector('#behavior-select');
    let behavior = behavior_select.value;
    let resource_select = document.querySelectorAll('.resources');
    let skill_array = [];
    let resource_array = [];
    let module_array = [];

    for (let i = 0; i < skill_select.length; i++) {
        skill_array.push({ "id": skill_select[i].id.split('-')[2], "name": skill_select[i].value, "checked": skill_select[i].checked });
    }

    for (let i = 0; i < resource_select.length; i++) {
        let id = resource_select[i].id.split('-')[2];
        let can_ben_randomized = document.querySelector('#resource-input-randomized-' + id).checked;
        resource_array.push({ "id": id, "quantity": resource_select[i].value, "can_be_randomized": can_ben_randomized });
    }

    for (let i = 0; i < module_info_array.length; i++) {
        module_array.push({
            'id': parseInt(module_info_array[i]['id']),
            'type': module_info_array[i]['type'],
            'name': module_info_array[i]['name'],
            'effects': module_info_array[i]['effects']
        })
    }

    let edit_template = false;
    if (template_selectedElement.value != "none") {
        edit_template = true;
    }
    if (ship_selectedElement.value != "none" && ship_selectedElement.value && template_name.value) {
        let template_data = {
            "name": template_name.value,
            "displayed_name": template_displayed_name.value,
            "template_id": template_selectedElement.value,
            "difficulty": difficulty,
            "respawn_delay_seconds": Math.max(0, isNaN(respawn_delay_seconds) ? 120 : respawn_delay_seconds),
            "behavior": behavior,
            "ship": ship_selectedElement.value,
            "skills": skill_array,
            "resource": resource_array,
            "modules": module_array
        }

        const headers = new Headers({
            'Content-Type': 'x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf_token
        });
        
        let url = 'npc_template_add';
        if (edit_template == true) {
            url = 'npc_template_update';
        }
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

function load_data_from_selected_template(response_data) {
    document.querySelector('#template-name-input').value = response_data.template[0].name;
    document.querySelector('#template-displayed-name-input').value = response_data.template[0].displayed_name;
    let spaceship_selected = document.querySelector(`#spaceship-option-${response_data.template[0].ship_id}`);
    spaceship_selected.selected = true;
    spaceship_selected.classList.add('selected-spaceShip');
    let spaceship_img = document.querySelector('#spaceship-img')
    spaceship_img.src = `/static/img/foreground/SHIPS/${response_data.template[0].ship_id__image}.png`;
    spaceship_img.classList.remove('hidden');
    document.querySelector(`#description-spaceship-${response_data.template[0].ship_id}`).classList.remove('hidden');
    document.querySelector('#difficulty-select').value = response_data.template[0].difficulty;
    if (document.querySelector('#respawn-delay-select')) {
        document.querySelector('#respawn-delay-select').value = response_data.template[0].respawn_delay_seconds ?? 120;
    }
    document.querySelector('#behavior-select').value = response_data.template[0].behavior;

    for (let i = 0; i < response_data.skills.length; i++) {
        if (response_data.skills[i].level != 0) {
            document.querySelector(`#skill-input-${response_data.skills[i].skill_id}`).checked = true;
        }
    }

    for (let i = 0; i < response_data.template[0].module_id_list.length; i++) {
        document.querySelector(`#module-li-${response_data.template[0].module_id_list[i]}`).selected = true;
    }

    for (let i = 0; i < response_data.resources.length; i++) {
        document.querySelector(`#resource-input-${response_data.resources[i].resource_id}`).value = response_data.resources[i].quantity;
        document.querySelector(`#resource-input-randomized-${response_data.resources[i].resource_id}`).checked = response_data.resources[i].can_be_randomized;
    }
}

function unload_template_data() {
    document.querySelector('#template-name-input').value = "";
    document.querySelector('#template-displayed-name-input').value = "";
    document.querySelector('#ship-select').value = "none";
    document.querySelector('#behavior-select').value = "passive";

    let delete_selected_class = document.querySelector('.spaceship_selected')
    if (delete_selected_class) {
        delete_selected_class.classList.remove('spaceship_selected');
    }

    let spaceship_selection = document.querySelectorAll('.description-spaceship')
    for (let i = 0; i < spaceship_selection.length; i++) {
        if (!spaceship_selection[i].classList.contains('hidden')) {
            spaceship_selection[i].classList.add('hidden');
        }
    }

    let spaceship_img = document.querySelector('#spaceship-img');
    spaceship_img.src = "";
    spaceship_img.classList.add('hidden');

    document.querySelector('#difficulty-select').value = 1;
    const respawnDelayEl = document.querySelector('#respawn-delay-select');
    if (respawnDelayEl) {
        respawnDelayEl.value = 120;
    }

    let skill_checkbox = document.querySelectorAll('.skill-input');
    for (let i = 0; i < skill_checkbox.length; i++) {
        skill_checkbox[i].checked = false;
    }

    let resource = document.querySelectorAll('.resources');
    for (let i = 0; i < resource.length; i++) {
        resource[i].value = 0;
    }

    let resource_checkbox = document.querySelectorAll('.resources-checkbox');
    for (let i = 0; i < resource_checkbox.length; i++) {
        resource_checkbox[i].checked = false;
    }

    let module_select = document.querySelectorAll('.module-select');
    for (let i = 0; i < module_select.length; i++) {
        module_select[i].value = "None";
    }
}

function delete_this_template() {
    let template_select = document.querySelector('#template-select');
    let template_selectedElement = template_select.options[template_select.selectedIndex];

    if (template_selectedElement.value != "none") {

        let template_id = template_selectedElement.value;

        const headers = new Headers({
            'Content-Type': 'x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf_token
        });
        let url = 'npc_template_delete';
        fetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
                'data': template_id,
            })
        }).then(() => {
            window.location.reload();
        });
    }
}
