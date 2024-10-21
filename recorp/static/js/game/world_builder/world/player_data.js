let character_main = document.querySelector('#player-info-item-container');
let character_main_container = document.createElement('div');
let character_basic_information_fieldset = document.createElement('fieldset');
let character_basic_information_fieldset_legend = document.createElement('legend');
let character_defensive_modules_fieldset = document.createElement('fieldset');
let character_defensive_modules_fieldset_legend_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
let character_defensive_modules_fieldset_legend_svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
let character_defensive_modules_fieldset_legend = document.createElement('legend');
let character_offensive_modules_fieldset = document.createElement('fieldset');
let character_offensive_modules_fieldset_legend = document.createElement('legend');
let character_offensive_modules_fieldset_legend_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
let character_offensive_modules_fieldset_legend_svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
let character_electronicWarfare_modules_fieldset = document.createElement('fieldset');
let character_electronicWarfare_modules_fieldset_legend = document.createElement('legend');
let character_electronicWarfare_modules_fieldset_legend_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
let character_electronicWarfare_modules_fieldset_legend_svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
let character_other_modules_fieldset = document.createElement('fieldset');
let character_other_modules_fieldset_legend = document.createElement('legend');
let character_other_modules_fieldset_legend_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
let character_other_modules_fieldset_legend_svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
let character_basic_information_img = document.createElement('img');
let character_basic_information_ul = document.createElement('ul');
let character_basic_information_li_name = document.createElement('li');
let character_basic_information_li_name_b = document.createElement('b');
let character_basic_information_li_name_span = document.createElement('span');
let character_basic_information_li_archetype = document.createElement('li')
let character_basic_information_li_archetype_b = document.createElement('b');
let character_basic_information_li_archetype_span = document.createElement('span');
let character_basic_information_li_faction = document.createElement('li');
let character_basic_information_li_faction_b = document.createElement('b');
let character_basic_information_li_faction_span = document.createElement('span');
let character_status_container = document.createElement('div');
let character_statistics_progressbar_fieldset = document.createElement('fieldset');
let character_statistics_progressbar_fieldset_legend = document.createElement('legend');
let character_statistics_progressbar_hp_div = document.createElement('div');
let character_statistics_progressbar_hp_label = document.createElement('label');
let character_statistics_progressbar_hp_content = document.createElement('div');
let character_statistics_progressbar_hp_text = document.createElement('span');
let character_statistics_progressbar_move_div = document.createElement('div');
let character_statistics_progressbar_move_label = document.createElement('label');
let character_statistics_progressbar_move_content = document.createElement('div');
let character_statistics_progressbar_move_text = document.createElement('span');
let character_statistics_progressbar_ap_div = document.createElement('div');
let character_statistics_progressbar_ap_label = document.createElement('label');
let character_statistics_progressbar_ap_content = document.createElement('div');
let character_statistics_progressbar_ap_text = document.createElement('span');
let character_module_progressbar_container = document.createElement('div');

character_main_container.classList.add(
    'w-[full]',
    'flex',
    'flex-wrap',
    'items-center',
    'justify-center',
    'flex-col',
);

character_basic_information_fieldset.classList.add(
    'px-2',
    'flex',
    '2xl:w-[80%]',
    'xl:w-[90%]',
    'lg:w-[80%]',
    'items-center',
    'justify-center',
    'gap-2',
    'flex-row',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md'
);
character_basic_information_fieldset_legend.classList.add(
    "text-md",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-gray-900",
    "dark:text-white",
    "p-1"
);

character_basic_information_fieldset_legend.textContent = "Your informations";
character_basic_information_fieldset.append(character_basic_information_fieldset_legend)

character_basic_information_img.id = "user-avatar";
character_basic_information_img.classList.add(
    'w-24',
    'box-content',
    'mb-1',
);

character_basic_information_li_name.classList.add(
    'text-justify',
    'text-center'
);

character_basic_information_li_name_b.id = "player-name-label";
character_basic_information_li_name_span.id = "player-name-span";
character_basic_information_li_archetype.classList.add(
    'text-justify',
    'text-center'
);

character_basic_information_li_archetype_b.id = "player-archetype-label";
character_basic_information_li_archetype_span.id = "player-archetype-span";
character_basic_information_li_faction.classList.add(
    'text-justify',
    'text-center'
);

character_basic_information_li_faction_b.id = "player-faction-label";
character_basic_information_li_faction_span.id = "player-faction-span";
character_basic_information_li_faction_span.classList.add(
    'text-justify',
    'text-center'
);

character_statistics_progressbar_fieldset.classList.add(
    'flex',
    '2xl:w-[80%]',
    'xl:w-[90%]',
    'lg:w-[80%]',
    'w-[100%]',
    'px-2',
    'items-start',
    'justify-center',
    'gap-2',
    'flex-col',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md'
);
character_statistics_progressbar_fieldset_legend.classList.add(
    "text-md",
    "md:text-start",
    "text-center",
    "font-shadow",
    "font-bold",
    "text-gray-900",
    "dark:text-white",
)
character_statistics_progressbar_fieldset_legend.textContent = "Statistics";
character_statistics_progressbar_fieldset.append(character_statistics_progressbar_fieldset_legend);

character_statistics_progressbar_hp_div.classList.add(
    'w-full',
    'bg-red-500',
    'relative',
    'h-[20px]'
);
character_statistics_progressbar_hp_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-sm',
);
character_statistics_progressbar_hp_label.textContent = "HULL POINTS:"
character_statistics_progressbar_hp_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[20px]',
    'absolute'
);
character_statistics_progressbar_hp_text.classList.add(
    'w-full',
    'absolute',
    'z-10',
    'text-center',
    'text-sm',
    'font-bold',
    'font-shadow',
    'text-blue-100',
    'text-center',
);

character_statistics_progressbar_move_div.classList.add(
    'w-full',
    'bg-red-500',
    'relative',
    'h-[20px]'
);
character_statistics_progressbar_move_div.id = "remaining-movement-div";

character_statistics_progressbar_move_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-sm',
)
character_statistics_progressbar_move_label.textContent = "MOVEMENT POINTS:"
character_statistics_progressbar_move_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[20px]',
    'absolute'
);
character_statistics_progressbar_move_text.classList.add(
    'w-full',
    'absolute',
    'z-10',
    'text-center',
    'text-sm',
    'font-bold',
    'font-shadow',
    'text-blue-100',
    'text-center',
);

character_statistics_progressbar_ap_div.classList.add(
    'w-full',
    'bg-red-500',
    'relative',
    'h-[20px]',
    'mb-1'
);
character_statistics_progressbar_ap_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-sm',
);
character_statistics_progressbar_ap_label.textContent = "ACTION POINTS:"
character_statistics_progressbar_ap_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[20px]',
    'absolute'
);
character_statistics_progressbar_ap_text.classList.add(
    'w-full',
    'absolute',
    'z-10',
    'text-center',
    'text-sm',
    'font-bold',
    'font-shadow',
    'text-blue-100',
    'text-center',
);

character_defensive_modules_fieldset.classList.add(
    'flex',
    '2xl:w-[80%]',
    'xl:w-[90%]',
    'lg:w-[80%]',
    'w-[100%]',
    'px-2',
    'items-start',
    'justify-center',
    'gap-2',
    'flex-col',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md'
);
character_defensive_modules_fieldset_legend.classList.add(
    "text-md",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-gray-900",
    "dark:text-white",
    "cursor-pointer",
    "p-1"
);
character_defensive_modules_fieldset_legend_svg.id = "defensive-module-menu";
character_defensive_modules_fieldset_legend.addEventListener('click', function() {
    hide_display_modules(this);
})
character_defensive_modules_fieldset_legend_svg.classList.add('w-3', 'h-3', 'rotate-180', 'shrink-0', 'm-1.5', 'legend-svg');
character_defensive_modules_fieldset_legend_svg.setAttribute("fill", "none");
character_defensive_modules_fieldset_legend_svg.setAttribute("viewBox", "0 0 10 6");
character_defensive_modules_fieldset_legend_svg_path.setAttribute("stroke", "currentColor");
character_defensive_modules_fieldset_legend_svg_path.setAttribute("stroke-linecap", "round");
character_defensive_modules_fieldset_legend_svg_path.setAttribute("stroke-linejoin", "round");
character_defensive_modules_fieldset_legend_svg_path.setAttribute("stroke-width", "2");
character_defensive_modules_fieldset_legend_svg_path.setAttribute("d", "M9 5 5 1 1 5");
character_defensive_modules_fieldset_legend_svg.append(character_defensive_modules_fieldset_legend_svg_path);

let character_defensive_modules_fieldset_legend_span = document.createElement('span');
character_defensive_modules_fieldset_legend_span.textContent = "Shield";

character_defensive_modules_fieldset_legend.classList.add('flex', 'flex-row');

character_defensive_modules_fieldset_legend.append(character_defensive_modules_fieldset_legend_span);
character_defensive_modules_fieldset_legend.append(character_defensive_modules_fieldset_legend_svg);
character_defensive_modules_fieldset.append(character_defensive_modules_fieldset_legend);

character_offensive_modules_fieldset.classList.add(
    'px-2',
    'mt-1',
    'flex',
    '2xl:w-[80%]',
    'xl:w-[90%]',
    'lg:w-[80%]',
    'w-[100%]',
    'gap-2',
    'flex-col',
    'items-start',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md'
);
character_offensive_modules_fieldset_legend.classList.add(
    "text-md",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-gray-900",
    "dark:text-white",
    "cursor-pointer",
    "p-1"
);

character_offensive_modules_fieldset_legend_svg.id = "offensive-module-menu";
character_offensive_modules_fieldset_legend.addEventListener('click', function() {
    hide_display_modules(this);
})
character_offensive_modules_fieldset_legend_svg.classList.add('w-3', 'h-3', 'rotate-180', 'shrink-0', 'm-1.5', 'legend-svg');
character_offensive_modules_fieldset_legend_svg.setAttribute("fill", "none");
character_offensive_modules_fieldset_legend_svg.setAttribute("viewBox", "0 0 10 6");
character_offensive_modules_fieldset_legend_svg_path.setAttribute("stroke", "currentColor");
character_offensive_modules_fieldset_legend_svg_path.setAttribute("stroke-linecap", "round");
character_offensive_modules_fieldset_legend_svg_path.setAttribute("stroke-linejoin", "round");
character_offensive_modules_fieldset_legend_svg_path.setAttribute("stroke-width", "2");
character_offensive_modules_fieldset_legend_svg_path.setAttribute("d", "M9 5 5 1 1 5");
character_offensive_modules_fieldset_legend_svg.append(character_offensive_modules_fieldset_legend_svg_path);

let character_offensive_modules_fieldset_legend_span = document.createElement('span');
character_offensive_modules_fieldset_legend_span.textContent = "Weaponry";

character_offensive_modules_fieldset_legend.classList.add('flex', 'flex-row')

character_offensive_modules_fieldset_legend.append(character_offensive_modules_fieldset_legend_span)
character_offensive_modules_fieldset_legend.append(character_offensive_modules_fieldset_legend_svg)

character_offensive_modules_fieldset.append(character_offensive_modules_fieldset_legend);

character_electronicWarfare_modules_fieldset.classList.add(
    'px-2',
    'mt-1',
    'flex',
    '2xl:w-[80%]',
    'xl:w-[90%]',
    'lg:w-[80%]',
    'w-[100%]',
    'gap-2',
    'lg:flex-col',
    'flex-col',
    'flex-col',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md'
);
character_electronicWarfare_modules_fieldset_legend.classList.add(
    "text-md",
    "md:text-start",
    "text-center",
    "font-shadow",
    "font-bold",
    "text-gray-900",
    "dark:text-white",
    "cursor-pointer",
    "p-1"
);


character_electronicWarfare_modules_fieldset_legend_svg.id = "electronicWarfare-module-menu";
character_electronicWarfare_modules_fieldset_legend.addEventListener('click', function() {
    hide_display_modules(this);
})
character_electronicWarfare_modules_fieldset_legend_svg.classList.add('w-3', 'h-3', 'rotate-180', 'shrink-0', 'm-1.5', 'legend-svg');
character_electronicWarfare_modules_fieldset_legend_svg.setAttribute("fill", "none");
character_electronicWarfare_modules_fieldset_legend_svg.setAttribute("viewBox", "0 0 10 6");
character_electronicWarfare_modules_fieldset_legend_svg_path.setAttribute("stroke", "currentColor");
character_electronicWarfare_modules_fieldset_legend_svg_path.setAttribute("stroke-linecap", "round");
character_electronicWarfare_modules_fieldset_legend_svg_path.setAttribute("stroke-linejoin", "round");
character_electronicWarfare_modules_fieldset_legend_svg_path.setAttribute("stroke-width", "2");
character_electronicWarfare_modules_fieldset_legend_svg_path.setAttribute("d", "M9 5 5 1 1 5");
character_electronicWarfare_modules_fieldset_legend_svg.append(character_electronicWarfare_modules_fieldset_legend_svg_path);

let character_electronicWarfare_modules_fieldset_legend_span = document.createElement('span');
character_electronicWarfare_modules_fieldset_legend_span.textContent = "Electronic warfare";

character_electronicWarfare_modules_fieldset_legend.classList.add('flex', 'flex-row');

character_electronicWarfare_modules_fieldset_legend.append(character_electronicWarfare_modules_fieldset_legend_span);
character_electronicWarfare_modules_fieldset_legend.append(character_electronicWarfare_modules_fieldset_legend_svg);
character_electronicWarfare_modules_fieldset.append(character_electronicWarfare_modules_fieldset_legend);

character_other_modules_fieldset.classList.add(
    'px-2',
    'mt-1',
    'mb-1',
    'flex',
    '2xl:w-[80%]',
    'xl:w-[90%]',
    'lg:w-[80%]',
    'w-[100%]',
    'gap-2',
    'lg:flex-col',
    'flex-col',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md'
);
character_other_modules_fieldset_legend.classList.add(
    "text-md",
    "md:text-start",
    "text-center",
    "font-shadow",
    "font-bold",
    "text-gray-900",
    "dark:text-white",
    "cursor-pointer",
    "p-1"
);

character_other_modules_fieldset_legend_svg.id = "electronicWarfare-module-menu";
character_other_modules_fieldset_legend.addEventListener('click', function() {
    hide_display_modules(this);
})
character_other_modules_fieldset_legend_svg.classList.add('w-3', 'h-3', 'rotate-180', 'shrink-0', 'm-1.5', 'legend-svg');
character_other_modules_fieldset_legend_svg.setAttribute("fill", "none");
character_other_modules_fieldset_legend_svg.setAttribute("viewBox", "0 0 10 6");
character_other_modules_fieldset_legend_svg_path.setAttribute("stroke", "currentColor");
character_other_modules_fieldset_legend_svg_path.setAttribute("stroke-linecap", "round");
character_other_modules_fieldset_legend_svg_path.setAttribute("stroke-linejoin", "round");
character_other_modules_fieldset_legend_svg_path.setAttribute("stroke-width", "2");
character_other_modules_fieldset_legend_svg_path.setAttribute("d", "M9 5 5 1 1 5");
character_other_modules_fieldset_legend_svg.append(character_other_modules_fieldset_legend_svg_path);

let character_other_modules_fieldset_legend_span = document.createElement('span');
character_other_modules_fieldset_legend_span.textContent = "Utility";

character_other_modules_fieldset_legend.classList.add('flex', 'flex-row');

character_other_modules_fieldset_legend.append(character_other_modules_fieldset_legend_span);
character_other_modules_fieldset_legend.append(character_other_modules_fieldset_legend_svg);
character_other_modules_fieldset.append(character_other_modules_fieldset_legend);


for (let i = 0; i < map_informations['pc'].length; i++) {
    if (map_informations['pc'][i].user.user == current_user_id) {
        let img_src = map_informations['pc'][i].user.image == "img.png" ? `/static/js/game/assets/ux/default-user.svg` : `/static/js/game/assets/users/${map_informations['pc'][i].user.player}/0.jpg`
        character_basic_information_img.src = img_src;
        character_basic_information_li_name_b.textContent = "Name: ";
        character_basic_information_li_name_span.textContent = map_informations['pc'][i].user.name;
        character_basic_information_li_archetype_b.textContent = "Archetype: ";
        character_basic_information_li_archetype_span.textContent = map_informations['pc'][i].user.archetype_name;
        character_basic_information_li_faction_b.textContent = "Faction: ";
        character_basic_information_li_faction_span.textContent = map_informations['pc'][i].faction.name;

        let hp_percent = `${Math.round((map_informations['pc'][i].ship.current_hp * 100) / (map_informations['pc'][i].ship.max_hp))}%`;
        let move_percent = `${Math.round((map_informations['pc'][i].ship.current_movement * 100) / (map_informations['pc'][i].ship.max_movement))}%`;
        let ap_percent = `${Math.round((map_informations['pc'][i].user.current_ap * 100) / (map_informations['pc'][i].user.max_ap))}%`;

        character_statistics_progressbar_hp_content.style.width = hp_percent;
        character_statistics_progressbar_hp_text.textContent = `${map_informations['pc'][i].ship.current_hp} / ${map_informations['pc'][i].ship.max_hp}`;
        character_statistics_progressbar_move_content.style.width = move_percent;
        character_statistics_progressbar_move_text.textContent = `${map_informations['pc'][i].ship.current_movement} / ${map_informations['pc'][i].ship.max_movement}`;
        character_statistics_progressbar_ap_content.style.width = ap_percent;
        character_statistics_progressbar_ap_text.textContent = `${map_informations['pc'][i].user.current_ap} / ${map_informations['pc'][i].user.max_ap}`;

        character_basic_information_li_name.append(character_basic_information_li_name_b);
        character_basic_information_li_name.append(character_basic_information_li_name_span);
        character_basic_information_li_archetype.append(character_basic_information_li_archetype_b);
        character_basic_information_li_archetype.append(character_basic_information_li_archetype_span);
        character_basic_information_li_faction.append(character_basic_information_li_faction_b);
        character_basic_information_li_faction.append(character_basic_information_li_faction_span);

        character_basic_information_ul.append(character_basic_information_li_name);
        character_basic_information_ul.append(character_basic_information_li_archetype);
        character_basic_information_ul.append(character_basic_information_li_faction);

        character_basic_information_fieldset.append(character_basic_information_img);
        character_basic_information_fieldset.append(character_basic_information_ul);

        character_statistics_progressbar_hp_div.append(character_statistics_progressbar_hp_content);
        character_statistics_progressbar_hp_div.append(character_statistics_progressbar_hp_text);

        character_statistics_progressbar_move_div.append(character_statistics_progressbar_move_content);
        character_statistics_progressbar_move_div.append(character_statistics_progressbar_move_text);

        character_statistics_progressbar_ap_div.append(character_statistics_progressbar_ap_content);
        character_statistics_progressbar_ap_div.append(character_statistics_progressbar_ap_text);

        character_statistics_progressbar_fieldset.append(character_statistics_progressbar_hp_label);
        character_statistics_progressbar_fieldset.append(character_statistics_progressbar_hp_div);
        character_statistics_progressbar_fieldset.append(character_statistics_progressbar_move_label);
        character_statistics_progressbar_fieldset.append(character_statistics_progressbar_move_div);
        character_statistics_progressbar_fieldset.append(character_statistics_progressbar_ap_label);
        character_statistics_progressbar_fieldset.append(character_statistics_progressbar_ap_div);

        character_main_container.append(character_basic_information_fieldset);
        character_main_container.append(character_statistics_progressbar_fieldset);

        for (let module_i in map_informations['pc'][i].ship.modules) {

            if (map_informations['pc'][i].ship.modules[module_i]["type"].includes("DEFENSE") && !map_informations['pc'][i].ship.modules[module_i]["name"].includes('hull')) {
                let defense_name = map_informations['pc'][i].ship.modules[module_i]["name"].split(" ")[0].toLowerCase()
                let defense_value = `${Math.round((map_informations['pc'][i].ship["current_"+defense_name+"_defense"] * 100) / (map_informations['pc'][i].ship.modules[module_i].effect.defense))}%`;

                let defensive_module_div = document.createElement('div');
                let defensive_module_label = document.createElement('label');
                let defensive_module_content = document.createElement('div');
                let defensive_module_text = document.createElement('div');

                defensive_module_div.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                defensive_module_div.classList.add(
                    'w-full',
                    'bg-red-500',
                    'relative',
                    'h-[20px]',
                    'hidden',
                    'module-container',
                    'mb-1'
                )

                defensive_module_label.classList.add(
                    'font-bold',
                    'font-shadow',
                    'text-white',
                    'text-sm',
                    'hidden',
                    'module-container'
                );
                defensive_module_label.textContent = map_informations['pc'][i].ship.modules[module_i]["name"].toLowerCase();

                defensive_module_content.classList.add(
                    'bg-blue-600',
                    'leading-none',
                    'h-[20px]',
                    'absolute',
                    'hidden',
                    'module-container'
                );

                defensive_module_text.classList.add(
                    'w-full',
                    'absolute',
                    'z-10',
                    'text-center',
                    'text-sm',
                    'font-bold',
                    'font-shadow',
                    'text-blue-100',
                    'text-center',
                    'hidden',
                    'module-container'
                );

                defensive_module_text.textContent = `${map_informations['pc'][i].ship["current_"+defense_name+"_defense"]} / ${map_informations['pc'][i].ship.modules[module_i].effect.defense}`;
                defensive_module_content.style.width = defense_value;

                defensive_module_div.append(defensive_module_content);
                defensive_module_div.append(defensive_module_text);

                character_defensive_modules_fieldset.append(defensive_module_label);
                character_defensive_modules_fieldset.append(defensive_module_div);
                character_main_container.append(character_defensive_modules_fieldset);

            } else if (map_informations['pc'][i].ship.modules[module_i]["type"] == "WEAPONRY") {

                let offensive_module_container = document.createElement('div');
                let offensive_module_name_label = document.createElement('label');

                offensive_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                offensive_module_container.classList.add('hidden', 'module-container', 'mb-1');
                offensive_module_name_label.textContent = map_informations['pc'][i].ship.modules[module_i].name;
                offensive_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-sm');

                if ("damage_type" in map_informations['pc'][i].ship.modules[module_i]["effect"]) {
                    let weapon_damage_type_span = document.createElement('span');
                    let weapon_damage_type_small = document.createElement('small');
                    let weapon_damage_type_small_value = document.createElement('small');
                    let weapon_damage_span = document.createElement('span');
                    let weapon_damage_small = document.createElement('small');
                    let weapon_damage_small_value = document.createElement('small');
                    let weapon_range_span = document.createElement('span');
                    let weapon_range_small = document.createElement('small');
                    let weapon_range_small_value = document.createElement('small');

                    weapon_damage_type_span.classList.add('flex', 'flex-row', 'gap-1', 'pl-2');
                    weapon_damage_span.classList.add('flex', 'flex-row', 'gap-1', 'pl-2');
                    weapon_range_span.classList.add('flex', 'flex-row', 'gap-1', 'pl-2');

                    weapon_damage_type_small.classList.add('font-shadow', 'text-white', 'text-sm');
                    weapon_damage_small.classList.add('font-shadow', 'text-white', 'text-sm');
                    weapon_range_small.classList.add('font-shadow', 'text-white', 'text-sm');

                    weapon_damage_type_small.textContent = "Damage type: ";
                    weapon_damage_type_small_value.textContent = map_informations['pc'][i].ship.modules[module_i].effect.damage_type;
                    weapon_damage_type_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-sm', 'font-bold');
                    weapon_damage_type_span.append(weapon_damage_type_small);
                    weapon_damage_type_span.append(weapon_damage_type_small_value);

                    weapon_damage_small.textContent = "Damages: ";
                    weapon_damage_small_value.textContent = ` ${map_informations['pc'][i].ship.modules[module_i].effect.min_damage}-${map_informations['pc'][i].ship.modules[module_i].effect.max_damage}`;
                    weapon_damage_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-sm', 'font-bold');
                    weapon_damage_span.append(weapon_damage_small);
                    weapon_damage_span.append(weapon_damage_small_value);

                    weapon_range_small.textContent = "Range: ";
                    weapon_range_small_value.textContent = ` ${map_informations['pc'][i].ship.modules[module_i].effect.range}`;
                    weapon_range_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-sm', 'font-bold');
                    weapon_range_span.append(weapon_range_small);
                    weapon_range_span.append(weapon_range_small_value);

                    offensive_module_container.append(offensive_module_name_label);
                    offensive_module_container.append(weapon_damage_type_span);
                    offensive_module_container.append(weapon_damage_span);
                    offensive_module_container.append(weapon_range_span);

                    character_offensive_modules_fieldset.append(offensive_module_container);
                } else {

                    let offensive_module_span = document.createElement('span');

                    for (const [key, value] of Object.entries(map_informations['pc'][i].ship.modules[module_i].effect)) {

                        let offensive_module_type_small = document.createElement('small');
                        let offensive_module_type_small_value = document.createElement('small');
                        let offensive_module_type_small_container = document.createElement('div');

                        offensive_module_type_small_container.classList.add('flex', 'flex-row', 'pl-2', 'py-1');

                        offensive_module_type_small.classList.add('font-shadow', 'text-white', 'text-sm');
                        offensive_module_type_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-sm', 'font-bold');

                        offensive_module_type_small_container.append(offensive_module_type_small);
                        offensive_module_type_small_container.append(offensive_module_type_small_value);

                        let content_keys = key.replace('_', ' ');
                        let content_value = typeof value == 'boolean' ? value : value + '%';
                        offensive_module_type_small.textContent = `${content_keys}: `;
                        offensive_module_type_small_value.textContent = `${content_value}`;

                        offensive_module_span.append(offensive_module_name_label);
                        offensive_module_span.append(offensive_module_type_small_container);

                        offensive_module_container.append(offensive_module_name_label);
                        offensive_module_container.append(offensive_module_span);

                        character_offensive_modules_fieldset.append(offensive_module_container);
                    }

                }
            } else if (map_informations['pc'][i].ship.modules[module_i]["type"] == "ELECTRONIC_WARFARE") {

                let electronicWarfare_module_container = document.createElement('div');
                let electronicWarfare_module_name_label = document.createElement('label');
                let electronicWarfare_module_span = document.createElement('span');

                electronicWarfare_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                electronicWarfare_module_container.classList.add('hidden', 'module-container', 'mb-1');
                electronicWarfare_module_name_label.textContent = map_informations['pc'][i].ship.modules[module_i].name;
                electronicWarfare_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-sm');

                for (const [key, value] of Object.entries(map_informations['pc'][i].ship.modules[module_i].effect)) {


                    let electronicWarfare_module_type_small = document.createElement('small');
                    let electronicWarfare_module_type_small_value = document.createElement('small');
                    let electronicWarfare_module_type_small_container = document.createElement('div');

                    electronicWarfare_module_type_small_container.classList.add('flex', 'flex-row', 'pl-2');

                    electronicWarfare_module_type_small.classList.add('font-shadow', 'text-white', 'text-sm');
                    electronicWarfare_module_type_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-sm', 'font-bold');

                    electronicWarfare_module_type_small_container.append(electronicWarfare_module_type_small);
                    electronicWarfare_module_type_small_container.append(electronicWarfare_module_type_small_value);

                    let content_keys = key.replace('_', ' ');
                    let content_value = typeof value == 'boolean' ? value : value + '%';
                    electronicWarfare_module_type_small.textContent = `${content_keys}: `;
                    electronicWarfare_module_type_small_value.textContent = `${content_value}`;

                    electronicWarfare_module_span.append(electronicWarfare_module_name_label);
                    electronicWarfare_module_span.append(electronicWarfare_module_type_small_container);

                    electronicWarfare_module_container.append(electronicWarfare_module_name_label);
                    electronicWarfare_module_container.append(electronicWarfare_module_span);

                    character_electronicWarfare_modules_fieldset.append(electronicWarfare_module_container);

                }
            } else {

                let other_module_container = document.createElement('div');
                let other_module_name_label = document.createElement('label');
                let other_module_span = document.createElement('span');

                other_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                other_module_container.classList.add('hidden', 'module-container', 'mb-1');
                other_module_name_label.textContent = map_informations['pc'][i].ship.modules[module_i].name;
                other_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-sm');

                for (const [key, value] of Object.entries(map_informations['pc'][i].ship.modules[module_i].effect)) {

                    let other_module_type_small = document.createElement('small');
                    let other_module_type_small_value = document.createElement('small');
                    let other_module_type_small_container = document.createElement('div');

                    other_module_type_small_container.classList.add('flex', 'flex-row', 'pl-2', 'gap-1');

                    other_module_type_small.classList.add('font-shadow', 'text-white', 'text-sm');
                    other_module_type_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-sm', 'font-bold', 'text-justify');

                    other_module_type_small_container.append(other_module_type_small);
                    other_module_type_small_container.append(other_module_type_small_value);

                    let content_keys = key.replace('_', ' ');
                    let content_value = undefined;
                    if (typeof value == 'boolean') {
                        content_value = value;
                    } else {
                        if (map_informations['pc'][i].ship.modules[module_i]["name"].includes('hull')) {
                            content_value = `+${ value } hp`;
                        } else if (map_informations['pc'][i].ship.modules[module_i]["name"].includes('propulsion')) {
                            content_value = `+${ value } `;
                        } else {
                            content_value = value;
                        }
                    }
                    other_module_type_small.textContent = `${content_keys}: `;
                    other_module_type_small_value.textContent = `${content_value}`;

                    other_module_span.append(other_module_name_label);
                    other_module_span.append(other_module_type_small_container);

                    other_module_container.append(other_module_name_label);
                    other_module_container.append(other_module_span);

                    character_other_modules_fieldset.append(other_module_container);

                }
                character_main_container.append(character_offensive_modules_fieldset);
                character_main_container.append(character_electronicWarfare_modules_fieldset);
                character_main_container.append(character_other_modules_fieldset);
                character_main.append(character_main_container);

            }
        }
    }
}


function hide_display_modules(e) {
    let parent_element = e.parentNode;
    let element_legend_svg = parent_element.querySelector('.legend-svg');
    let element = parent_element.querySelectorAll('.module-container');
    for (let i = 0; i < element.length; i++) {
        if (element[i].classList.contains("hidden")) {
            element[i].classList.remove('hidden');
            element_legend_svg.classList.remove('rotate-180');
        } else {
            element[i].classList.add('hidden');
            element_legend_svg.classList.add('rotate-180');
        }

    }
}