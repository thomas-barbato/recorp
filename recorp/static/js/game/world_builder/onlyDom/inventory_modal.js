document.addEventListener('DOMContentLoaded', () => {

    // Vérifie que gettext est chargé
    if (typeof gettext === 'undefined') {
        console.error("Django i18n not loaded. Make sure {% url 'javascript-catalog' %} is included before this script.");
        return;
    }

    const isDesktop = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 1024;

    currentPlayer.ship.modules.forEach(module => {

        const module_type = module.type;
        const module_effect = Object.entries(module.effect);
        const translated_module_type = gettext(module_type.replace('_', ' '));
        const effect_text = "";

        const module_main_container = document.querySelector(`#module-type-${module_type}`);
        if (!module_main_container) return; // sécurité

        // === Création des éléments ===
        const module_container = document.createElement('div')
        const module_item = document.createElement('div');
        const module_span = document.createElement('span');
        const module_button = document.createElement('button');
        const module_button_i = document.createElement('i');
        const tooltip = document.createElement('div');

        module_container.className = "flex flex-col";

        module_item.className = "module-item flex justify-between items-center bg-gray-800/60 hover:bg-gray-700/50 border border-emerald-800/30 rounded p-1 cursor-pointer select-none";
        module_item.dataset.moduleName = module.name;
        module_item.dataset.moduleType = translated_module_type;
        module_item.dataset.moduleEffects = module.effect;
        module_item.dataset.moduleCapacity = module.capacity || "—";

        module_span.className = "text-emerald-200 font-bold text-md truncate";
        module_span.textContent = module.name;

        module_button.className = "text-red-500 hover:text-red-400 ml-1";
        module_button.type = "button";
        module_button_i.className = "fa-solid fa-xmark text-md";
        module_button.append(module_button_i);
        module_button.addEventListener('click', (e) => unequipModule(e, module.name));

        // === Tooltip ===
        tooltip.className = 'module-tooltip';
        let html = `
            <strong>${module.name}</strong><br>
            <span class="text-emerald-200 font-itallic">${translated_module_type}</span><br>
            <ul class="font-bold">${gettext("Effects")}:</ul> 
        `;

        module_effect.forEach(effect => {
            if(effect[0] != "label"){
                html += `<li class="list-none"><b>${gettext(effect[0])}</b> : +${effect[1]}`;
            }
        })

        html += `</ul>`;
        
        document.body.appendChild(tooltip);

        if (isDesktop) {
            module_item.addEventListener('mouseenter', e => {
                tooltip.innerHTML = html;
                tooltip.style.left = `${e.clientX + 15}px`;
                tooltip.style.top = `${e.clientY + 15}px`;
                tooltip.classList.add('visible');
            });
            module_item.addEventListener('mousemove', e => {
                tooltip.style.left = `${e.clientX + 15}px`;
                tooltip.style.top = `${e.clientY + 15}px`;
            });
            module_item.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
        } else {
            module_item.addEventListener('click', () => {
                const expanded = module_item.nextElementSibling;
                if (expanded && expanded.classList.contains('module-expanded')) expanded.remove();
                else {
                    const div = document.createElement('div');
                    div.className = 'module-expanded';
                    div.innerHTML = html;
                    module_item.insertAdjacentElement('afterend', div);
                }
            });
        }

        module_item.append(module_span);
        module_item.append(module_button);

        module_container.append(module_item);

        module_main_container.append(module_container);
        module_main_container.querySelector('.empty-slot')?.remove();
    });
});

function unequipModule(e, name) {
    e.stopPropagation();
    if (confirm(`${gettext("Are you sure you want to unequip")} ${name}?`)) {
        alert(`${name} ${gettext("unequipped")}.`);
    }
}

function deleteItem(e, name) {
    e.stopPropagation();
    if (confirm(`${gettext("Are you sure you want to delete")} ${name}?`)) {
        alert(`${name} ${gettext("deleted")}.`);
    }
}
