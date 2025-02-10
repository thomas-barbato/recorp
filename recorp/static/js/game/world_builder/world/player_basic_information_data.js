let character_main = document.querySelector('#player-info-item-container');
let info_container = document.querySelector('#current-effects-mobile')
let character_main_container = document.createElement('div');
let character_currentEffects_fieldset = document.createElement('fieldset'); 
let character_currentEffects_fieldset_legend = document.createElement('legend');
let character_module_fieldset = document.createElement('fieldset');
let character_module_fieldset_legend = document.createElement('legend');
let character_defensive_modules_fieldset = document.createElement('fieldset');
let character_defensive_modules_fieldset_legend = document.createElement('legend');
let character_offensive_modules_fieldset = document.createElement('fieldset');
let character_offensive_modules_fieldset_legend = document.createElement('legend');
let character_electronicWarfare_modules_fieldset = document.createElement('fieldset');
let character_electronicWarfare_modules_fieldset_legend = document.createElement('legend');
let character_other_modules_fieldset = document.createElement('fieldset');
let character_other_modules_fieldset_legend = document.createElement('legend');
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
    'w-full',
    'flex',
    'flex-wrap',
    'items-center',
    'justify-center',
    'flex-col',
    'md:block',
);

character_statistics_progressbar_fieldset.classList.add(
    'flex',
    'text-xs',
    'items-start',
    'justify-center',
    'mx-auto',
    'gap-1',
    'p-2',
    'w-auto',
    'text-start',
    'flex-col',
    'border',
    'border-slate-600',
    'rounded',
    'bg-gray-600/40',
);

character_statistics_progressbar_fieldset_legend.classList.add(
    "text-xs",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-white",
    "truncate"
)

character_statistics_progressbar_fieldset_legend.textContent = "Statistics";
character_statistics_progressbar_fieldset.append(character_statistics_progressbar_fieldset_legend);

character_currentEffects_fieldset.classList.add(
    'flex',
    'text-xs',
    'items-start',
    'justify-center',
    'mx-auto',
    'gap-1',
    'h-[25px]',
    'p-2',
    'w-full',
    'text-start',
    'flex-col',
    'border',
    'border-slate-600',
    'rounded',
    'bg-gray-600/40',
);

character_currentEffects_fieldset_legend.classList.add(
    "text-xs",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-white",
    "truncate",
)

character_currentEffects_fieldset.id = "current-effects";
character_currentEffects_fieldset_legend.textContent = "Current effects";
character_currentEffects_fieldset.append(character_currentEffects_fieldset_legend)


character_statistics_progressbar_hp_div.classList.add(
    'w-full',
    'bg-red-600',
    'relative',
    'h-[15px]',
    'text-start'
);
character_statistics_progressbar_hp_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-xs',
);
character_statistics_progressbar_hp_label.textContent = "Hull Points"
character_statistics_progressbar_hp_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[15px]',
    'absolute'
);
character_statistics_progressbar_hp_text.classList.add(
    'w-full',
    'absolute',
    'z-10',
    'text-center',
    'text-xs',
    'font-bold',
    'font-shadow',
    'text-blue-100',
    'text-center',
);

character_statistics_progressbar_move_div.classList.add(
    'w-full',
    'bg-red-600',
    'relative',
    'h-[15px]',
    'text-start'
);

character_statistics_progressbar_move_div.id = "remaining-movement-div";

character_statistics_progressbar_move_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-xs',
)
character_statistics_progressbar_move_label.textContent = "Movement Points"
character_statistics_progressbar_move_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[15px]',
    'absolute',
    'font-shadow',
    'text-xs'
);
character_statistics_progressbar_move_text.classList.add(
    'w-full',
    'absolute',
    'z-100',
    'text-xs',
    'font-bold',
    'font-shadow',
    'text-blue-100',
    'text-center',
);

character_statistics_progressbar_ap_div.classList.add(
    'w-full',
    'bg-red-600',
    'relative',
    'h-[15px]',
    'text-start'
);
character_statistics_progressbar_ap_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-xs',
);
character_statistics_progressbar_ap_label.textContent = "Action Points";
character_statistics_progressbar_ap_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[15px]',
    'absolute',
    'font-shadow',
    'text-xs',
);
character_statistics_progressbar_ap_text.classList.add(
    'w-full',
    'absolute',
    'z-100',
    'text-center',
    'text-xs',
    'font-bold',
    'font-shadow',
    'text-blue-100',
    'text-center',
);

character_module_fieldset.classList.add(
    'relative',
    'flex-col',
    'text-xs',
    'px-2',
    'mx-auto',
    'w-auto',
    'text-start',
    'border',
    'border-slate-600',
    'rounded',
    'bg-gray-600/40',
    'h-[30vh]',
    'overflow-y-scroll',
    'thin-semi-transparent-scrollbar',
    'thin-semi-transparent-scrollbar:hover'
)
character_module_fieldset_legend.classList.add(
    "text-xs",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-white",
    "truncate"  
);

character_defensive_modules_fieldset.classList.add(
    'flex',
    'p-2',
    'gap-1',
    'w-full',
    'flex-col',
    'items-start',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md',
    'mx-auto',
    "truncate"
);
character_defensive_modules_fieldset_legend.classList.add(
    "text-xs",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-white",
    "truncate"
);

character_module_fieldset_legend.textContent = "Modules";
character_module_fieldset.append(character_module_fieldset_legend);

let character_defensive_modules_fieldset_legend_span = document.createElement('span');
character_defensive_modules_fieldset_legend_span.textContent = "Shield";

character_defensive_modules_fieldset_legend.classList.add('flex', 'flex-row', 'text-white');
character_defensive_modules_fieldset_legend.append(character_defensive_modules_fieldset_legend_span);
character_defensive_modules_fieldset.append(character_defensive_modules_fieldset_legend);

character_offensive_modules_fieldset.classList.add(
    'flex',
    'px-2',
    'flex',
    'gap-1',
    'w-full',
    'flex-col',
    'items-start',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md',
    'mx-auto'
);
character_offensive_modules_fieldset_legend.classList.add(
    "text-xs",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-white",
    "cursor-pointer",
    "flex",
    "flex-row",
    "p-1",
    "truncate"
);

let character_offensive_modules_fieldset_legend_span = document.createElement('span');
character_offensive_modules_fieldset_legend_span.textContent = "Weaponry";
character_offensive_modules_fieldset_legend_span.classList.add('flex', 'flex-row', 'text-white');
character_offensive_modules_fieldset_legend.append(character_offensive_modules_fieldset_legend_span)
character_offensive_modules_fieldset.append(character_offensive_modules_fieldset_legend);

character_electronicWarfare_modules_fieldset.classList.add(
    'flex',
    'px-2',
    'mt-1',
    'flex',
    'gap-2',
    'w-full',
    'flex-col',
    'items-start',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md',
    'mx-auto'
);

character_electronicWarfare_modules_fieldset_legend.classList.add(
    "text-xs",
    "text-start",
    "font-shadow",
    "font-bold",
    "text-white",
    "cursor-pointer",
    "p-1",
);

let character_electronicWarfare_modules_fieldset_legend_span = document.createElement('span');
character_electronicWarfare_modules_fieldset_legend_span.textContent = "Electronic";

character_electronicWarfare_modules_fieldset_legend.classList.add('flex', 'flex-row');
character_electronicWarfare_modules_fieldset_legend_span.classList.add('truncate');

character_electronicWarfare_modules_fieldset_legend.append(character_electronicWarfare_modules_fieldset_legend_span);
character_electronicWarfare_modules_fieldset.append(character_electronicWarfare_modules_fieldset_legend);

character_other_modules_fieldset.classList.add(
    'flex',
    'px-2',
    'mt-1',
    'flex',
    'gap-2',
    'w-full',
    'flex-col',
    'items-start',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md',
    'mx-auto'
);

character_other_modules_fieldset_legend.classList.add(
    "text-xs",
    "md:text-start",
    "text-center",
    "font-shadow",
    "font-bold",
    "text-white",
    "cursor-pointer",
    "p-1",
    "truncate"
);

let character_other_modules_fieldset_legend_span = document.createElement('span');
character_other_modules_fieldset_legend_span.textContent = "Utility";

character_other_modules_fieldset_legend.classList.add('flex', 'flex-row', 'text-white', 'truncate');

character_other_modules_fieldset_legend.append(character_other_modules_fieldset_legend_span);
character_other_modules_fieldset.append(character_other_modules_fieldset_legend);



for (let i = 0; i < map_informations['pc'].length; i++) {
    if (map_informations['pc'][i].user.user == current_user_id) {

        let hp_percent = `${Math.round((map_informations['pc'][i].ship.current_hp * 100) / (map_informations['pc'][i].ship.max_hp))}%`;
        let move_percent = `${Math.round((map_informations['pc'][i].ship.current_movement * 100) / (map_informations['pc'][i].ship.max_movement))}%`;
        let ap_percent = `${Math.round((map_informations['pc'][i].user.current_ap * 100) / (map_informations['pc'][i].user.max_ap))}%`;

        character_statistics_progressbar_hp_content.style.width = hp_percent;
        character_statistics_progressbar_hp_text.textContent = `${map_informations['pc'][i].ship.current_hp} / ${map_informations['pc'][i].ship.max_hp}`;
        character_statistics_progressbar_move_content.style.width = move_percent;
        character_statistics_progressbar_move_text.textContent = `${map_informations['pc'][i].ship.current_movement} / ${map_informations['pc'][i].ship.max_movement}`;
        character_statistics_progressbar_ap_content.style.width = ap_percent;
        character_statistics_progressbar_ap_text.textContent = `${map_informations['pc'][i].user.current_ap} / ${map_informations['pc'][i].user.max_ap}`;

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
    
        character_main_container.append(character_statistics_progressbar_fieldset);
        character_main_container.append(character_currentEffects_fieldset);

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
                    'bg-red-600',
                    'relative',
                    'h-[15px]',
                    'module-container',
                    'mb-1'
                )

                defensive_module_label.classList.add(
                    'font-bold',
                    'font-shadow',
                    'text-white',
                    'text-xs',
                    'module-container',
                );
                defensive_module_label.textContent = map_informations['pc'][i].ship.modules[module_i]["name"].toLowerCase();

                defensive_module_content.classList.add(
                    'bg-blue-600',
                    'leading-none',
                    'h-[15px]',
                    'absolute',
                    'module-container'
                );

                defensive_module_text.classList.add(
                    'w-full',
                    'absolute',
                    'z-100',
                    'text-center',
                    'text-xs',
                    'font-bold',
                    'font-shadow',
                    'text-blue-100',
                    'module-container'
                );

                defensive_module_text.textContent = `${map_informations['pc'][i].ship["current_"+defense_name+"_defense"]} / ${map_informations['pc'][i].ship.modules[module_i].effect.defense}`;
                defensive_module_content.style.width = defense_value;

                defensive_module_div.append( defensive_module_label)
                defensive_module_div.append(defensive_module_content);
                defensive_module_div.append(defensive_module_text);

                character_defensive_modules_fieldset.append(defensive_module_label);
                character_defensive_modules_fieldset.append(defensive_module_div);
                character_module_fieldset.append(character_defensive_modules_fieldset);

            } else if (map_informations['pc'][i].ship.modules[module_i]["type"] == "WEAPONRY") {

                let offensive_module_container = document.createElement('div');
                let offensive_module_name_label = document.createElement('label');
                let offensive_module_container_name_label_dot = document.createElement('span')
                let offensive_module_container_name_label_value = document.createElement('span')

                offensive_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                offensive_module_container.classList.add('module-container', 'mb-1');
                offensive_module_container_name_label_dot.classList.add('flex', 'w-2', 'h-2', 'bg-emerald-400', 'rounded-full');
                offensive_module_container_name_label_value.textContent = map_informations['pc'][i].ship.modules[module_i].name.toLowerCase()
                offensive_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'flex', 'flex-row', 'gap-1', 'items-center');
                offensive_module_name_label.append(offensive_module_container_name_label_dot);
                offensive_module_name_label.append(offensive_module_container_name_label_value);

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

                    weapon_damage_type_span.classList.add('flex', 'xl:flex-row', 'flex-col', 'px-4', 'gap-1');
                    weapon_damage_span.classList.add('flex', 'xl:flex-row', 'flex-col', 'px-4', 'gap-1');
                    weapon_range_span.classList.add('flex', 'xl:flex-row', 'flex-col', 'px-4', 'gap-1');

                    weapon_damage_type_small.classList.add('font-shadow', 'text-white', 'text-xs');
                    weapon_damage_small.classList.add('font-shadow', 'text-white', 'text-xs');
                    weapon_range_small.classList.add('font-shadow', 'text-white', 'text-xs');

                    weapon_damage_type_small.textContent = "Damage type: ";
                    weapon_damage_type_small_value.textContent = map_informations['pc'][i].ship.modules[module_i].effect.damage_type;
                    weapon_damage_type_small_value.classList.add('font-shadow', 'text-emerald-400',  'text-xs', 'font-bold');
                    weapon_damage_type_span.append(weapon_damage_type_small);
                    weapon_damage_type_span.append(weapon_damage_type_small_value);

                    weapon_damage_small.textContent = "Damages: ";
                    weapon_damage_small_value.textContent = ` ${map_informations['pc'][i].ship.modules[module_i].effect.min_damage}-${map_informations['pc'][i].ship.modules[module_i].effect.max_damage}`;
                    weapon_damage_small_value.classList.add('font-shadow', 'text-emerald-400',  'text-xs', 'font-bold');
                    weapon_damage_span.append(weapon_damage_small);
                    weapon_damage_span.append(weapon_damage_small_value);

                    weapon_range_small.textContent = "Range: ";
                    weapon_range_small_value.textContent = ` ${map_informations['pc'][i].ship.modules[module_i].effect.range}`;
                    weapon_range_small_value.classList.add('font-shadow', 'text-emerald-400',  'text-xs', 'font-bold');
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

                        offensive_module_type_small_container.classList.add('flex', 'xl:flex-row', 'flex-col', 'px-4', 'gap-1');

                        offensive_module_type_small.classList.add('font-shadow', 'text-white', 'text-xs');
                        offensive_module_type_small_value.classList.add('font-shadow', 'text-emerald-400',  'text-xs', 'font-bold');

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
                let electronicWarfare_module_container_name_label_dot = document.createElement('span')
                let electronicWarfare_module_container_name_label_value = document.createElement('span')

                electronicWarfare_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                electronicWarfare_module_container.classList.add('module-container', 'mb-1');
                electronicWarfare_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs');
                electronicWarfare_module_container_name_label_dot.classList.add('flex', 'w-2', 'h-2', 'bg-emerald-400', 'rounded-full');
                electronicWarfare_module_container_name_label_value.textContent = map_informations['pc'][i].ship.modules[module_i].name.toLowerCase()
                electronicWarfare_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'flex', 'flex-row', 'gap-1', 'items-center');
                electronicWarfare_module_name_label.append(electronicWarfare_module_container_name_label_dot);
                electronicWarfare_module_name_label.append(electronicWarfare_module_container_name_label_value);

                for (const [key, value] of Object.entries(map_informations['pc'][i].ship.modules[module_i].effect)) {


                    let electronicWarfare_module_type_small = document.createElement('small');
                    let electronicWarfare_module_type_small_value = document.createElement('small');
                    let electronicWarfare_module_type_small_container = document.createElement('div');

                    electronicWarfare_module_type_small_container.classList.add('flex', 'xl:flex-row', 'flex-col', 'px-4', 'gap-1');

                    electronicWarfare_module_type_small.classList.add('font-shadow', 'text-white', 'text-xs');
                    electronicWarfare_module_type_small_value.classList.add('font-shadow', 'text-emerald-400',  'text-xs', 'font-bold');

                    electronicWarfare_module_type_small_container.append(electronicWarfare_module_type_small);
                    electronicWarfare_module_type_small_container.append(electronicWarfare_module_type_small_value);

                    let content_keys = key.replace('_', ' ');
                    let content_value = undefined;

                    if(content_keys == "range"){
                        content_value = value;
                    }else{
                        content_value = typeof value == 'boolean' ? value : value + '%';
                    }

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
                let other_module_container_name_label_dot = document.createElement('span')
                let other_module_container_name_label_value = document.createElement('span')
                

                other_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                other_module_container.classList.add('module-container', 'mb-1');
                other_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs');
                other_module_container_name_label_dot.classList.add('flex', 'w-2', 'h-2', 'bg-emerald-400', 'rounded-full');
                other_module_container_name_label_value.textContent = map_informations['pc'][i].ship.modules[module_i].name.toLowerCase();
                other_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs', 'flex', 'flex-row', 'gap-1', 'items-center');
                other_module_name_label.append(other_module_container_name_label_dot);
                other_module_name_label.append(other_module_container_name_label_value);

                for (const [key, value] of Object.entries(map_informations['pc'][i].ship.modules[module_i].effect)) {

                    let other_module_type_small = document.createElement('small');
                    let other_module_type_small_value = document.createElement('small');
                    let other_module_type_small_container = document.createElement('div');

                    other_module_type_small_container.classList.add('flex', 'xl:flex-row', 'flex-col', 'px-4', 'gap-1');

                    other_module_type_small.classList.add('font-shadow', 'text-white', 'text-xs');
                    other_module_type_small_value.classList.add('font-shadow', 'text-emerald-400',  'text-xs', 'font-bold', 'text-justify');

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
                character_module_fieldset.append(character_offensive_modules_fieldset);
                character_module_fieldset.append(character_electronicWarfare_modules_fieldset);
                character_module_fieldset.append(character_other_modules_fieldset);
                character_main_container.append(character_module_fieldset)
                character_main.append(character_main_container);

            }
        }
    }
}

