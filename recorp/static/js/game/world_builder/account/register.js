const submit_button = document.querySelector('#create-account-submit-button');

// Configuration des événements tactiles/souris
const user_is_on_mobile_bool = is_user_is_on_mobile_device();
const attribute_touch_mouseover = user_is_on_mobile_bool ? 'touchstart' : 'mouseover';
const attribute_touch_click = user_is_on_mobile_bool ? 'touchstart' : 'onclick';
const action_listener_touch_click = user_is_on_mobile_bool ? 'touchstart' : 'click';

    
let faction_element = document.querySelectorAll('.faction');
let faction_selected = "";

let previous_button = document.querySelector("#previous-btn");
let next_button = document.querySelector("#next-btn");

let archetype_id = undefined;
let archetype_selector = document.querySelectorAll('.archetype-selector');

let faction_window = document.querySelector("#character-faction");
let stats_window = document.querySelector('#character-stats');

const reader = new FileReader();
const img_user = document.querySelector('#user-avatar');
const img_input = document.querySelector('#id_image');

let quill_content = undefined;

// Configuration Quill
const quill = new Quill('#editor', {
    modules: {
        toolbar: toolbarOptions
    },
    theme: 'snow'
});

quill.getHTML = () => {
    return quill.root.innerHTML;
};

quill.on('text-change', () => {
    quill_content = quill.getHTML();
});

// Style de l'éditeur Quill
let toolbar = document.querySelector('.ql-editor');
if (toolbar) {
    toolbar.classList.add('text-justify', 'min-h-[150px]', 'text-base', 'text-emerald-300');
}

// Gestion du changement d'archétype
document.getElementById("id_archetype").addEventListener("change", function() {
    archetype_id = this.options[this.selectedIndex].getAttribute("value");
    
    archetype_selector.forEach(selector => {
        const selector_id = selector.id.split('-')[1];
        if(archetype_id != selector_id){
            selector.classList.add('hidden');
        } else {
            selector.classList.remove('hidden');
        }
    });
    
    checkFormValidity();
});

// Vérification de la validité du formulaire
function checkFormValidity() {
    const nameInput = document.querySelector('#id_name');
    const archetypeSelect = document.querySelector('#id_archetype');
    const submitBtn = document.querySelector('#create-character-submit-button');
    
    const isNameValid = nameInput && nameInput.value.trim().length > 0;
    const isArchetypeValid = archetypeSelect && archetypeSelect.value !== "---" && archetype_id;
    
    if (isNameValid && isArchetypeValid) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// Écouter les changements du nom
document.getElementById('id_name').addEventListener('input', checkFormValidity);

// Navigation
previous_button.addEventListener(action_listener_touch_click, function(){
    stats_window.classList.add('hidden');
    stats_window.classList.remove('flex');
    faction_window.classList.remove('hidden');
    faction_window.classList.add('flex');
});


next_button.addEventListener(action_listener_touch_click, function(e){
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.disabled) {
        faction_window.classList.add('hidden');
        faction_window.classList.remove('flex');
        stats_window.classList.remove('hidden');
        stats_window.classList.add('flex');
    }
});

// Sélection de faction
faction_element.forEach(faction => {
    faction.addEventListener(action_listener_touch_click, function(){
        // Désélectionner toutes les autres factions
        faction_element.forEach(f => {
            f.classList.remove('faction-selected');
        });
        
        // Sélectionner cette faction
        this.classList.add('faction-selected');
        faction_selected = this.id.split('-')[1];
        
        // Activer le bouton suivant
        next_button.disabled = false;
    });
});

// Gestion de l'image
reader.onload = e => {
    img_user.src = e.target.result;
};

img_input.addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) {
        reader.readAsDataURL(f);
        img_user.classList.add('border-emerald-500');
    }
});

// Soumission du formulaire
let submit_btn = document.querySelector('#create-character-submit-button');

submit_btn.addEventListener(action_listener_touch_click, function(){
    if (this.disabled) return;
    
    this.disabled = true;
    
    let archetype = document.querySelector('#id_archetype').value;
    let character_name = document.querySelector('#id_name').value;
    let description = quill_content || "";
    
    if (faction_selected && archetype && character_name) {
        let data = new FormData();
        const file = img_input.files[0];
        if (file) data.append('image', file);
        data.append('name', character_name);
        data.append('archetype', archetype);
        data.append('faction', faction_selected);
        data.append('description', description);

        const url = "create_character";
        const headers = new Headers({
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": csrf_token,
        });

        fetch(url, {
            method: "POST",
            headers,
            credentials: "include",
            body: data,
        })
        .then(async response => {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            } else {
                window.location.replace("/");
                return;
            }
        })
        .then(data => {
            if (!data) return;
            if (data.errors) {
                console.error(data.errors);
                submit_btn.disabled = false;
            }
        })
        .catch(error => {
            console.error("Erreur JS:", error);
            submit_btn.disabled = false;
        });
    }
});

/*
submit_button.addEventListener(action_listener_touch_click, function() {
    submit_button.disabled = true;

    let data = {
        first_name: document.querySelector("#id_first_name").value || "None",
        last_name: document.querySelector("#id_last_name").value || "None",
        username: document.querySelector("#id_username").value,
        password: document.querySelector("#id_password").value,
        password2: document.querySelector("#id_password2").value,
        email: document.querySelector("#id_email").value,
    };

    fetch("create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": csrf_token,
        },
        credentials: "include",
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        submit_button.disabled = false;
        if (data.errors && data.errors.length > 0) {
            // Affiche les messages d'erreur pour chaque champ
            let container_array = [];
            for (let i in data.errors) {
                let help_text_container = document.querySelector(`#${data.errors[i]}_help_text`);
                if(help_text_container){
                    help_text_container.classList.remove('hidden');
                    container_array.push(help_text_container);
                }
            }
            setTimeout(() => {
                container_array.forEach(c => c.classList.add('hidden'));
            }, 5000);
        } else if (data.redirect_url) {
            // Redirection vers index
            window.location.replace(data.redirect_url);
        }
    })
    .catch(error => {
        submit_button.disabled = false;
        console.error(error);
    });
});
*/