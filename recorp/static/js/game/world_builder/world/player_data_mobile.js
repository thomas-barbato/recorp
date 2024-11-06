if(is_user_is_on_mobile_device() == true){
    let character_main = document.querySelector('#mobile-info-player-container');
    let character_main_container = document.createElement('div');
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

    character_main_container.classList.add(
        'w-[full]',
        'flex',
        'flex-wrap',
        'items-center',
        'justify-center',
        'flex-col',
    );

    character_statistics_progressbar_fieldset.classList.add(
        'flex',
        'w-[100%]',
        'p-2',
        'items-start',
        'justify-center',
        'gap-1',
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
        "text-white",
    )
    character_statistics_progressbar_fieldset.append(character_statistics_progressbar_fieldset_legend);

    character_statistics_progressbar_hp_div.classList.add(
        'w-full',
        'bg-red-500',
        'relative',
        'h-[15px]'
    );
    character_statistics_progressbar_hp_label.classList.add(
        'font-bold',
        'font-shadow',
        'text-white',
        'text-xs',
    );
    character_statistics_progressbar_hp_label.textContent = "HULL POINTS:"
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
        'bg-red-500',
        'relative',
        'h-[15px]'
    );
    character_statistics_progressbar_move_div.id = "remaining-movement-div";

    character_statistics_progressbar_move_label.classList.add(
        'font-bold',
        'font-shadow',
        'text-white',
        'text-xs',
    )
    character_statistics_progressbar_move_label.textContent = "MOVEMENT POINTS:"
    character_statistics_progressbar_move_content.classList.add(
        'bg-blue-600',
        'leading-none',
        'h-[15px]',
        'absolute'
    );
    character_statistics_progressbar_move_text.classList.add(
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

    character_statistics_progressbar_ap_div.classList.add(
        'w-full',
        'bg-red-500',
        'relative',
        'h-[15px]',
        'mb-1'
    );
    character_statistics_progressbar_ap_label.classList.add(
        'font-bold',
        'font-shadow',
        'text-white',
        'text-xs',
    );
    character_statistics_progressbar_ap_label.textContent = "ACTION POINTS:"
    character_statistics_progressbar_ap_content.classList.add(
        'bg-blue-600',
        'leading-none',
        'h-[15px]',
        'absolute'
    );
    character_statistics_progressbar_ap_text.classList.add(
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
            character_main.append(character_main_container)
        }
    }
    
}