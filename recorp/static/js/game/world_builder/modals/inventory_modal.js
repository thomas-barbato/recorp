
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gettext === 'undefined') {
        console.error("Django i18n not loaded. Make sure {% url 'javascript-catalog' %} is included before this script.");
        return;
    }

    let isDesktop = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 1024;
    
    currentPlayer.ship.modules.forEach(module => {

        let module_type = module.type;
        let translated_module_type = gettext(module_type.replace('_', ' '));
        let module_main_container = document.querySelector(`#module-type-${module_type}`);
        if (!module_main_container) return;

        // === STRUCTURE ===
        let module_container = document.createElement('div');
        let module_item = document.createElement('div');
        let module_span = document.createElement('span');
        let module_button = document.createElement('button');
        let module_button_i = document.createElement('i');
        let tooltip = document.createElement('div');

        module_container.className = "flex flex-col w-full";

        // === Style module line ===
        module_item.className = `
            module-item flex justify-between items-center
            bg-gradient-to-r from-gray-900/70 to-emerald-950/40
            border border-emerald-700/30 rounded-md px-2 py-[3px]
            shadow-inner shadow-emerald-900/30
            hover:bg-emerald-900/20 hover:border-emerald-400/50
            cursor-pointer select-none transition-all duration-200
        `;
        module_item.dataset.moduleName = module.name;
        module_item.dataset.moduleType = translated_module_type;
        module_item.dataset.moduleEffects = JSON.stringify(module.effect);
        module_item.dataset.moduleCapacity = module.capacity || "—";

        module_span.className = "text-emerald-300 font-semibold text-sm truncate tracking-wide";
        module_span.textContent = module.name;

        module_button.className = `
            text-red-500 hover:text-red-400 transition-transform duration-150
            hover:scale-110 ml-1
        `;
        module_button.type = "button";
        module_button_i.className = "fa-solid fa-xmark text-[12px]";
        module_button.append(module_button_i);
        module_button.addEventListener('click', (e) => unequipModule(e, module.name));

        tooltip.className = 'module-tooltip';
        document.body.appendChild(tooltip);

        if (isDesktop) {
            module_item.addEventListener('mouseenter', e => {
                tooltip.innerHTML = createFormatedLabel(module);
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
                let expanded = module_item.nextElementSibling;
                if (expanded && expanded.classList.contains('module-expanded')) expanded.remove();
                else {
                    let div = document.createElement('div');
                    div.className = `
                        module-expanded mt-1 bg-emerald-900/30 border border-emerald-700/30
                        text-emerald-200 text-xs rounded p-2 shadow-inner
                    `;
                    div.innerHTML = createFormatedLabel(module);
                    module_item.insertAdjacentElement('afterend', div);
                }
            });
        }

        module_item.append(module_span, module_button);
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

// === Ton switch inchangé (avec ton if/else complet) ===
function createFormatedLabel(module_object) {

    let module_name = module_object.name;
    let module_type = module_object.type;

    let module_tooltip_ul = document.createElement('ul');
    let module_tooltip_name = document.createElement('span');
    let module_tooltip_moduleType = document.createElement('small');

    module_tooltip_ul.className = `
        flex flex-col gap-1 font-bold text-xs
        bg-gray-900/95 border border-emerald-700/40 rounded-md
        text-emerald-200 shadow-lg shadow-black/60 p-2 backdrop-blur-sm
    `;
    module_tooltip_name.className = "font-bold text-emerald-300 text-sm";
    module_tooltip_name.textContent = module_name;
    module_tooltip_moduleType.className = "italic text-emerald-400/80 mb-1";

    module_tooltip_ul.append(module_tooltip_name);
    module_tooltip_ul.append(module_tooltip_moduleType);

    let module_li, module_li_label, module_li_value;

    // === switch conservé, mais stylé ===
    switch (module_type) {

        case "DEFENSE_BALLISTIC":
        case "DEFENSE_THERMAL":
        case "DEFENSE_MISSILE":
            let parts = module_type.split('_');
            module_type = `${parts[1]} ${parts[0]}`;
            module_li = styledLine(`${module_object.effect.label}:`, `+${module_object.effect.defense}`);
            module_tooltip_ul.append(module_li);
            break;

        case "HOLD":
            module_li = styledLine(`${module_object.effect.label}:`, `+${module_object.effect.capacity}`);
            module_tooltip_ul.append(module_li);
            break;

        case "MOVEMENT":
            module_li = styledLine(
                module_object.effect.label || "Movement:",
                `+${module_object.effect.movement}`
            );
            module_tooltip_ul.append(module_li);
            break;

        case "HULL":
            module_li = styledLine(`${module_object.effect.label}:`, ` +${module_object.effect.hp}`);
            module_tooltip_ul.append(module_li);
            break;

        case "REPAIRE":
            module_li = styledLine(
                `${module_object.effect.label}:`,
                ` ${module_object.effect.repair_shield} hull points`
            );
            module_tooltip_ul.append(module_li);
            break;

        case "GATHERING":
            if ('can_scavenge' in module_object.effect) {
                module_li = styledLine(`${module_object.effect.label}`, `✔️`);
            } else if ('display_mineral_data' in module_object.effect) {
                module_li = styledLine(`${module_object.effect.label}`, `range: ${module_object.effect.range}`);
            } else {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `+${module_object.effect.gathering_amount}, range: ${module_object.effect.range}`
                );
            }
            module_tooltip_ul.append(module_li);
            break;

        case "RESEARCH":
            module_li = styledLine(
                `${module_object.effect.label}:`,
                `-${module_object.effect.research_time_discrease}%`
            );
            module_tooltip_ul.append(module_li);
            break;

        case "CRAFT":
            module_li = styledLine(
                `${module_object.effect.label}:`,
                `${module_object.effect.crafting_tier_allowed}`
            );
            module_tooltip_ul.append(module_li);
            break;

        case "ELECTRONIC_WARFARE":
            if ("aiming_discrease" in module_object.effect) {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `-${module_object.effect.aiming_discrease}% — range ${module_object.effect.range}`
                );
            } else if ("movement_discrease" in module_object.effect) {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `-${module_object.effect.movement_discrease}% — range ${module_object.effect.range}`
                );
            } else if ("display_ship_data" in module_object.effect) {
                module_li = styledLine(`${module_object.effect.label}`, `range ${module_object.effect.range}`);
            }
            module_tooltip_ul.append(module_li);
            break;

        case "WEAPONRY":
            if ("aiming_increase" in module_object.effect) {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `+${module_object.effect.aiming_increase}% — range ${module_object.effect.range || "?"}`
                );
            } else {
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `damages: ${module_object.effect.min_damage} - ${module_object.effect.max_damage} — range ${module_object.effect.range}`
                );
            }
            module_tooltip_ul.append(module_li);
            break;

        case "COLONIZATION":
            module_li = styledLine(`${module_object.effect.label}`, `🌍`);
            module_tooltip_ul.append(module_li);
            break;
    }

    module_tooltip_moduleType.textContent = module_type;
    return module_tooltip_ul.outerHTML;
}

// Ligne stylisée pour tooltip
function styledLine(label, value) {
    let li = document.createElement('li');
    li.className = "flex justify-between border-b border-emerald-800/20 py-[1px] gap-2";
    let l = document.createElement('span');
    let v = document.createElement('span');
    l.className = "font-bold text-emerald-300";
    v.className = "text-emerald-100";
    l.textContent = label;
    v.textContent = value;
    li.append(l, v);
    return li;
}
