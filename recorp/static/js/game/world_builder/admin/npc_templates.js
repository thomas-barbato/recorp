const csrf_token = document.getElementById('csrf_token').value;
const ship_select = document.querySelector('#ship-select');
const ship_img = document.querySelector('#spaceship-img');
let resources_values = document.querySelectorAll('.resources');
let dict = [];

// CHANGE CHARACTER IMG ZONE
ship_select.addEventListener('change', function() {
    let selected_element = ship_select.options[ship_select.selectedIndex];
    ship_img.src = "";
    if (selected_element.value != "none") {
        let img_name = `${selected_element.dataset.imagename}.png`;
        ship_img.src = `/static/js/game/assets/ships/${img_name}`;
        ship_img.classList.remove('hidden')
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

let submit_button = document.querySelector('input[type=button]');
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