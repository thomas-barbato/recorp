
let character_main_mobile = document.querySelector('#mobile-info-player-container');
let character_main_container_mobile = document.createElement('div');
let character_statistics_progressbar_fieldset_mobile = document.createElement('fieldset');
let character_statistics_progressbar_fieldset_legend_mobile = document.createElement('legend');
let character_statistics_progressbar_hp_div_mobile = document.createElement('div');
let character_statistics_progressbar_hp_label_mobile = document.createElement('label');
let character_statistics_progressbar_hp_content_mobile = document.createElement('div');
let character_statistics_progressbar_hp_text_mobile = document.createElement('span');
let character_statistics_progressbar_move_div_mobile = document.createElement('div');
let character_statistics_progressbar_move_label_mobile = document.createElement('label');
let character_statistics_progressbar_move_content_mobile = document.createElement('div');
let character_statistics_progressbar_move_text_mobile = document.createElement('span');
let character_statistics_progressbar_ap_div_mobile = document.createElement('div');
let character_statistics_progressbar_ap_label_mobile = document.createElement('label');
let character_statistics_progressbar_ap_content_mobile = document.createElement('div');
let character_statistics_progressbar_ap_text_mobile = document.createElement('span');
let character_statistic_fulldisplay_button_i_mobile = document.createElement('i');

character_main_container_mobile.classList.add(
    'w-[full]',
    'flex',
    'flex-wrap',
    'items-center',
    'justify-center',
    'flex-col',
    'lg:hidden'
);

character_statistics_progressbar_fieldset_mobile.classList.add(
    'flex',
    'w-full',
    'p-1',
    'items-start',
    'justify-center',
    'gap-1',
    'flex-col',
    'bg-gray-600/40',
    'border',
    'border-slate-600',
    'rounded-md'
);
character_statistics_progressbar_fieldset_legend_mobile.classList.add(
    "text-xs",
    "md:text-start",
    "text-center",
    "font-shadow",
    "font-bold",
    "text-white",
)
character_statistics_progressbar_fieldset_mobile.append(character_statistics_progressbar_fieldset_legend_mobile);

character_statistics_progressbar_hp_div_mobile.classList.add(
    'w-full',
    'bg-red-600',
    'relative',
    'h-[15px]'
);
character_statistics_progressbar_hp_label_mobile.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-xs',
);
character_statistics_progressbar_hp_label_mobile.textContent = "Hull points"
character_statistics_progressbar_hp_content_mobile.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[15px]',
    'absolute'
);
character_statistics_progressbar_hp_text_mobile.classList.add(
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

character_statistics_progressbar_move_div_mobile.classList.add(
    'w-full',
    'bg-red-600',
    'relative',
    'h-[15px]'
);
character_statistics_progressbar_move_div_mobile.id = "remaining-movement-div";

character_statistics_progressbar_move_label_mobile.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-xs',
)
character_statistics_progressbar_move_label_mobile.textContent = "Movement points"
character_statistics_progressbar_move_content_mobile.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[15px]',
    'absolute'
);
character_statistics_progressbar_move_text_mobile.classList.add(
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

character_statistics_progressbar_ap_div_mobile.classList.add(
    'w-full',
    'bg-red-600',
    'relative',
    'h-[15px]',
    'mb-1'
);
character_statistics_progressbar_ap_label_mobile.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-xs',
);
character_statistics_progressbar_ap_label_mobile.textContent = "Action points"
character_statistics_progressbar_ap_content_mobile.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[15px]',
    'absolute'
);
character_statistics_progressbar_ap_text_mobile.classList.add(
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

character_statistic_fulldisplay_button_i_mobile.classList.add(
    "fa-solid", 
    "fa-id-badge",
    "fa-2x",
    "mx-auto",
    "text-emerald-400"
);
character_statistic_fulldisplay_button_i_mobile.id = "character-full-info-btn";

for (let i = 0; i < map_informations['pc'].length; i++) {
    if (map_informations['pc'][i].user.user == current_user_id) {
        let hp_percent = `${Math.round((map_informations['pc'][i].ship.current_hp * 100) / (map_informations['pc'][i].ship.max_hp))}%`;
        let move_percent = `${Math.round((map_informations['pc'][i].ship.current_movement * 100) / (map_informations['pc'][i].ship.max_movement))}%`;
        let ap_percent = `${Math.round((map_informations['pc'][i].user.current_ap * 100) / (map_informations['pc'][i].user.max_ap))}%`;
        character_statistic_fulldisplay_button_i_mobile.addEventListener(action_listener_touch_click, function(){
            open_close_modal("player-modal");
        })
        
        let character_modal = document.querySelector('#modal-container');
        let player_modal = document.createElement('div');
        let player_modal_container = document.createElement('div');
        let player_modal_container_content_div = document.createElement('div');

        let player_modal_container_header_div = document.createElement('div');
        let player_modal_container_header_close_button = document.createElement("img");
        let player_modal_container_header_img = document.createElement('img');
        let player_modal_container_header_ul = document.createElement('ul');
        let player_modal_container_header_li_name = document.createElement('li');
        let player_modal_container_header_li_name_b = document.createElement('b');
        let player_modal_container_header_li_name_span = document.createElement('span');
        let player_modal_container_header_li_archetype = document.createElement('li')
        let player_modal_container_header_li_archetype_b = document.createElement('b');
        let player_modal_container_header_li_archetype_span = document.createElement('span');
        let player_modal_container_header_li_faction = document.createElement('li');
        let player_modal_container_header_li_faction_b = document.createElement('b');
        let player_modal_container_header_li_faction_span = document.createElement('span');
        
        let player_modal_container_body_div = document.createElement('div');
        let player_modal_container_body_fieldset = document.createElement('fieldset');
        let player_modal_container_body_fieldset_legend = document.createElement('legend');
        let player_modal_container_body_hp_div = document.createElement('div');
        let player_modal_container_body_hp_label = document.createElement('label');
        let player_modal_container_body_hp_content = document.createElement('div');
        let player_modal_container_body_hp_text = document.createElement('span');
        let player_modal_container_body_move_div = document.createElement('div');
        let player_modal_container_body_move_label = document.createElement('label');
        let player_modal_container_body_move_content = document.createElement('div');
        let player_modal_container_body_move_text = document.createElement('span');
        let player_modal_container_body_ap_div = document.createElement('div');
        let player_modal_container_body_ap_label = document.createElement('label');
        let player_modal_container_body_ap_content = document.createElement('div');
        let player_modal_container_body_ap_text = document.createElement('span');

        let player_modal_container_body_defensive_module_fieldset = document.createElement('fieldset');
        let player_modal_container_body_defensive_module_fieldset_legend = document.createElement('legend');
        
        let player_modal_container_body_offensive_module_fieldset = document.createElement('fieldset');
        let player_modal_container_body_offensive_module_fieldset_legend = document.createElement('legend');

        let player_modal_container_body_electronicWarfare_module_fieldset = document.createElement('fieldset');
        let player_modal_container_body_electronicWarfare_module_fieldset_legend = document.createElement('legend');

        let player_modal_container_body_otherModule_module_fieldset = document.createElement('fieldset');
        let player_modal_container_body_otherModule_module_fieldset_legend = document.createElement('legend');

        player_modal_container.classList.add(
            'w-[80vw]',
            'h-[100vh]',
            'overflow-hidden'
        )

        character_statistics_progressbar_hp_content_mobile.style.width = hp_percent;
        character_statistics_progressbar_hp_text_mobile.textContent = `${map_informations['pc'][i].ship.current_hp} / ${map_informations['pc'][i].ship.max_hp}`;
        character_statistics_progressbar_move_content_mobile.style.width = move_percent;
        character_statistics_progressbar_move_text_mobile.textContent = `${map_informations['pc'][i].ship.current_movement} / ${map_informations['pc'][i].ship.max_movement}`;
        character_statistics_progressbar_ap_content_mobile.style.width = ap_percent;
        character_statistics_progressbar_ap_text_mobile.textContent = `${map_informations['pc'][i].user.current_ap} / ${map_informations['pc'][i].user.max_ap}`;

        character_statistics_progressbar_hp_div_mobile.append(character_statistics_progressbar_hp_content_mobile);
        character_statistics_progressbar_hp_div_mobile.append(character_statistics_progressbar_hp_text_mobile);

        character_statistics_progressbar_move_div_mobile.append(character_statistics_progressbar_move_content_mobile);
        character_statistics_progressbar_move_div_mobile.append(character_statistics_progressbar_move_text_mobile);

        character_statistics_progressbar_ap_div_mobile.append(character_statistics_progressbar_ap_content_mobile);
        character_statistics_progressbar_ap_div_mobile.append(character_statistics_progressbar_ap_text_mobile);

        character_statistics_progressbar_fieldset_mobile.append(character_statistics_progressbar_hp_label_mobile);
        character_statistics_progressbar_fieldset_mobile.append(character_statistics_progressbar_hp_div_mobile);
        character_statistics_progressbar_fieldset_mobile.append(character_statistics_progressbar_move_label_mobile);
        character_statistics_progressbar_fieldset_mobile.append(character_statistics_progressbar_move_div_mobile);
        character_statistics_progressbar_fieldset_mobile.append(character_statistics_progressbar_ap_label_mobile);
        character_statistics_progressbar_fieldset_mobile.append(character_statistics_progressbar_ap_div_mobile);
        character_statistics_progressbar_fieldset_mobile.append(character_statistic_fulldisplay_button_i_mobile);
        
        character_main_container_mobile.append(character_statistics_progressbar_fieldset_mobile);
        character_main_mobile.append(character_main_container_mobile)

        let container_height = document.querySelector('#mobile-info-player-container').offsetHeight;

        let character_info_container = document.querySelector('#info-sector-container');
        character_info_container.classList.add(
            `h-[${container_height}px]`,
            'lg:bg-gray-600/0',
            'lg:border-slate-600/0',
            'lg:items-center',
            'lg:justify-center',
            'bg-gray-600/40',
            'border',
            'border-slate-600',
            'rounded-md',
        )
        
        player_modal.id = "player-modal";
        player_modal.setAttribute('aria-hidden', true);
        player_modal.setAttribute('tabindex', -1);
        player_modal.classList.add(
            'hidden',
            'overflow-y-auto',
            'overflow-x-hidden',
            'fixed',
            'top-0',
            'right-0',
            'left-0',
            'z-50',
            'justify-center',
            'items-center',
            'w-full',
            'h-full',
            'md:inset-0',
            'backdrop-blur-sm',
            'bg-black/20',
            'border-1',
            'text-xs',
        );

        player_modal_container.classList.add(
            "fixed", 
            "md:p-3", 
            "top-0", 
            "right-0", 
            "left-0", 
            "z-50", 
            "w-full", 
            "md:inset-0", 
            "h-[calc(100%-1rem)]", 
            "bg-black/70",
            'flex',
            'flex-wrap',
            'flex-col',
        );
        player_modal_container_content_div.classList.add(
            'relative', 
            'shadow', 
            'w-full', 
            'flex', 
            'justify-center', 
            'mx-auto', 
            'flex-col', 
        );

        player_modal_container_header_div.classList.add(
            'px-2',
            'flex',
            'w-full',
            'gap-2',
            'flex-row',
            'bg-gray-600/40',
            'p-2',
            'mx-auto'
        );

        let close_button_url = '/static/js/game/assets/ux/close.svg';
        player_modal_container_header_close_button.src = close_button_url;
        player_modal_container_header_close_button.title = `close`;
        player_modal_container_header_close_button.classList.add('inline-block', 'w-[20px]', 'h-[15px]', 'absolute', 'top-10', 'right-0', 'mt-2', 'pr-2');
        player_modal_container_header_close_button.addEventListener(action_listener_touch_click, function(){
            open_close_modal('player-modal');
        });
        player_modal_container_header_img.id = "user-avatar";
        player_modal_container_header_img.classList.add(
            'w-24',
            'box-content',
            'py-1',
            
        );
        
        player_modal_container_header_ul.classList.add('text-white', 'flex', 'flex-col', 'gap-1', 'justify-center');

        player_modal_container_header_li_name.classList.add(
            'text-justify',
            'text-center',
        );
    
        player_modal_container_header_li_name_b.id = "player-name-label";
        player_modal_container_header_li_name_span.id = "player-name-span";
        player_modal_container_header_li_archetype.classList.add(
            'text-justify',
            'text-center'
        );
    
        player_modal_container_header_li_archetype_b.id = "player-archetype-label";
        player_modal_container_header_li_archetype_span.id = "player-archetype-span";
        player_modal_container_header_li_faction.classList.add(
            'text-justify',
            'text-center'
        );
    
        player_modal_container_header_li_faction_b.id = "player-faction-label";
        player_modal_container_header_li_faction_span.id = "player-faction-span";
        player_modal_container_header_li_faction_span.classList.add(
            'text-justify',
            'text-center',
        );
        
        player_modal_container_body_div.classList.add(
            'px-2',
            'flex',
            'w-full',
            'gap-2',
            'flex-col',
            'bg-gray-600/40',
            'p-2',
            'mx-auto'
        );

        player_modal_container_body_fieldset.classList.add(
            'px-2',
            'flex',
            'items-center',
            'justify-center',
            'gap-2',
            'flex-row',
            'bg-gray-600/40',
        );
        player_modal_container_body_fieldset_legend.classList.add(
            "text-xs",
            "text-start",
            "font-shadow",
            "font-bold",
            "text-white",
            "p-1"
        );

        player_modal_container_body_fieldset.classList.add(
            'flex',
            'w-full',
            'px-2',
            'items-start',
            'justify-center',
            'gap-2',
            'flex-col',
            'bg-gray-600/40',
        );
        player_modal_container_body_fieldset_legend.classList.add(
            "text-xs",
            "text-center",
            "font-shadow",
            "font-bold",
            "text-white",
        )
        player_modal_container_body_fieldset_legend.textContent = "Statistics";
        player_modal_container_body_fieldset.append(player_modal_container_body_fieldset_legend);

        player_modal_container_body_hp_div.classList.add(
            'w-full',
            'bg-red-600',
            'relative',
            'h-[15px]'
        );
        player_modal_container_body_hp_label.classList.add(
            'font-bold',
            'font-shadow',
            'text-white',
            'text-xs',
        );
        player_modal_container_body_hp_label.textContent = "HULL POINTS"
        player_modal_container_body_hp_content.classList.add(
            'bg-blue-600',
            'leading-none',
            'h-[15px]',
            'absolute'
        );

        player_modal_container_body_hp_text.classList.add(
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

        player_modal_container_body_move_div.classList.add(
            'w-full',
            'bg-red-600',
            'relative',
            'h-[15px]'
        );
        player_modal_container_body_move_div.id = "remaining-movement-div";

        player_modal_container_body_move_label.classList.add(
            'font-bold',
            'font-shadow',
            'text-white',
            'text-xs',
        )
        player_modal_container_body_move_label.textContent = "MOVEMENT POINTS";
        player_modal_container_body_move_content.classList.add(
            'bg-blue-600',
            'leading-none',
            'h-[15px]',
            'absolute'
        );
        player_modal_container_body_move_text.classList.add(
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

        player_modal_container_body_ap_div.classList.add(
            'w-full',
            'bg-red-600',
            'relative',
            'h-[15px]',
            'mb-1'
        );
        player_modal_container_body_ap_label.classList.add(
            'font-bold',
            'font-shadow',
            'text-white',
            'text-xs',
        );
        player_modal_container_body_ap_label.textContent = "ACTION POINTS"
        player_modal_container_body_ap_content.classList.add(
            'bg-blue-600',
            'leading-none',
            'h-[15px]',
            'absolute'
        );
        player_modal_container_body_ap_text.classList.add(
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

        player_modal_container_body_defensive_module_fieldset.classList.add(
            'px-2',
            'mt-1',
            'flex',
            'gap-2',
            'flex-col',
            'bg-gray-600/40',
            'border',
            'border-slate-600',
            'rounded-md'
        );
        player_modal_container_body_defensive_module_fieldset_legend.classList.add(
            "text-xs",
            "text-start",
            "font-shadow",
            "font-bold",
            "text-white",
            "flex",
            "flex-row",
            "p-1"
        );

        player_modal_container_body_offensive_module_fieldset.classList.add(
            'px-2',
            'mt-1',
            'flex',
            'gap-2',
            'flex-col',
            'items-start',
            'bg-gray-600/40',
            'border',
            'border-slate-600',
            'rounded-md'
        );
        
        player_modal_container_body_offensive_module_fieldset_legend.classList.add(
            "text-xs",
            "text-start",
            "font-shadow",
            "font-bold",
            "text-white",
            "flex",
            "flex-row",
            "p-1"
        );

        player_modal_container_body_electronicWarfare_module_fieldset.classList.add(
            'px-2',
            'mt-1',
            'flex',
            'gap-2',
            'flex-col',
            'bg-gray-600/40',
            'border',
            'border-slate-600',
            'rounded-md'
        );

        player_modal_container_body_electronicWarfare_module_fieldset_legend.classList.add(
            "text-xs",
            "text-center",
            "font-shadow",
            "font-bold",
            "text-white",
            "p-1"
        );
        
        player_modal_container_body_otherModule_module_fieldset.classList.add(
            'px-2',
            'mt-1',
            'mb-1',
            'flex',
            'gap-2',
            'flex-col',
            'bg-gray-600/40',
            'border',
            'border-slate-600',
            'rounded-md'
        );

        player_modal_container_body_otherModule_module_fieldset_legend.classList.add(
            "text-xs",
            "text-center",
            "font-shadow",
            "font-bold",
            "text-white",
            "p-1"
        );


        let player_modal_container_body_defensive_module_fieldset_legend_span = document.createElement('span');
        player_modal_container_body_defensive_module_fieldset_legend_span.textContent = "Shield";
        player_modal_container_body_defensive_module_fieldset_legend_span.classList.add('flex', 'flex-row');

        player_modal_container_body_defensive_module_fieldset_legend.append(player_modal_container_body_defensive_module_fieldset_legend_span);
        player_modal_container_body_defensive_module_fieldset.append(player_modal_container_body_defensive_module_fieldset_legend)

        let player_modal_container_body_offensive_module_fieldset_legend_span = document.createElement('span');
        player_modal_container_body_offensive_module_fieldset_legend_span.textContent = "Weaponry";
        player_modal_container_body_offensive_module_fieldset_legend_span.classList.add('flex', 'flex-row');

        player_modal_container_body_offensive_module_fieldset_legend.append(player_modal_container_body_offensive_module_fieldset_legend_span)
        player_modal_container_body_offensive_module_fieldset.append(player_modal_container_body_offensive_module_fieldset_legend)

        let player_modal_container_body_electronicWarfare_module_fieldset_legend_span = document.createElement('span');
        player_modal_container_body_electronicWarfare_module_fieldset_legend_span.textContent = "Electronic warfare";
        player_modal_container_body_electronicWarfare_module_fieldset_legend.classList.add('flex', 'flex-row');

        player_modal_container_body_electronicWarfare_module_fieldset_legend.append(player_modal_container_body_electronicWarfare_module_fieldset_legend_span);
        player_modal_container_body_electronicWarfare_module_fieldset.append(player_modal_container_body_electronicWarfare_module_fieldset_legend);

        let player_modal_container_body_otherModule_module_fieldset_legend_span = document.createElement('span');
        player_modal_container_body_otherModule_module_fieldset_legend_span.textContent = "Utility";
        player_modal_container_body_otherModule_module_fieldset_legend.classList.add('flex', 'flex-row', 'text-white');
        
        player_modal_container_body_otherModule_module_fieldset_legend.append(player_modal_container_body_otherModule_module_fieldset_legend_span);
        player_modal_container_body_otherModule_module_fieldset.append(player_modal_container_body_otherModule_module_fieldset_legend);

        let img_src = map_informations['pc'][i].user.image == "img.png" ? `/static/js/game/assets/ux/default-user.svg` : `/static/js/game/assets/users/${map_informations['pc'][i].user.player}/0.jpg`

        player_modal_container_header_img.src = img_src;
        player_modal_container_header_li_name_b.textContent = "Name: ";
        player_modal_container_header_li_name_span.textContent = map_informations['pc'][i].user.name;
        player_modal_container_header_li_archetype_b.textContent = "Archetype: ";
        player_modal_container_header_li_archetype_span.textContent = map_informations['pc'][i].user.archetype_name;
        player_modal_container_header_li_faction_b.textContent = "Faction: ";
        player_modal_container_header_li_faction_span.textContent = map_informations['pc'][i].faction.name;

        player_modal_container_header_li_name.append(player_modal_container_header_li_name_b);
        player_modal_container_header_li_name.append(player_modal_container_header_li_name_span);
        player_modal_container_header_li_archetype.append(player_modal_container_header_li_archetype_b);
        player_modal_container_header_li_archetype.append(player_modal_container_header_li_archetype_span);
        player_modal_container_header_li_faction.append(player_modal_container_header_li_faction_b);
        player_modal_container_header_li_faction.append(player_modal_container_header_li_faction_span);

        player_modal_container_header_ul.append(player_modal_container_header_li_name);
        player_modal_container_header_ul.append(player_modal_container_header_li_archetype);
        player_modal_container_header_ul.append(player_modal_container_header_li_faction);

        player_modal_container_header_div.append(player_modal_container_header_img);
        player_modal_container_header_div.append(player_modal_container_header_ul);
        player_modal_container_header_div.append(player_modal_container_header_close_button);

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
                    'module-container'
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
                    'z-10',
                    'text-center',
                    'text-xs',
                    'font-bold',
                    'font-shadow',
                    'text-blue-100',
                    'text-center',
                    'module-container'
                );

                defensive_module_text.textContent = `${map_informations['pc'][i].ship["current_"+defense_name+"_defense"]} / ${map_informations['pc'][i].ship.modules[module_i].effect.defense}`;
                defensive_module_content.style.width = defense_value;

                defensive_module_div.append(defensive_module_content);
                defensive_module_div.append(defensive_module_text);

                player_modal_container_body_defensive_module_fieldset.append(defensive_module_label);
                player_modal_container_body_defensive_module_fieldset.append(defensive_module_div);
                player_modal_container_body_div.append(player_modal_container_body_defensive_module_fieldset);

            } else if (map_informations['pc'][i].ship.modules[module_i]["type"] == "WEAPONRY") {

                let offensive_module_container = document.createElement('div');
                let offensive_module_name_label = document.createElement('label');

                offensive_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                offensive_module_container.classList.add('module-container', 'mb-1');
                offensive_module_name_label.textContent = map_informations['pc'][i].ship.modules[module_i].name;
                offensive_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs');

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

                    weapon_damage_type_small.classList.add('font-shadow', 'text-white', 'text-xs');
                    weapon_damage_small.classList.add('font-shadow', 'text-white', 'text-xs');
                    weapon_range_small.classList.add('font-shadow', 'text-white', 'text-xs');

                    weapon_damage_type_small.textContent = "Damage type: ";
                    weapon_damage_type_small_value.textContent = map_informations['pc'][i].ship.modules[module_i].effect.damage_type;
                    weapon_damage_type_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-xs', 'font-bold');
                    weapon_damage_type_span.append(weapon_damage_type_small);
                    weapon_damage_type_span.append(weapon_damage_type_small_value);

                    weapon_damage_small.textContent = "Damages: ";
                    weapon_damage_small_value.textContent = ` ${map_informations['pc'][i].ship.modules[module_i].effect.min_damage}-${map_informations['pc'][i].ship.modules[module_i].effect.max_damage}`;
                    weapon_damage_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-xs', 'font-bold');
                    weapon_damage_span.append(weapon_damage_small);
                    weapon_damage_span.append(weapon_damage_small_value);

                    weapon_range_small.textContent = "Range: ";
                    weapon_range_small_value.textContent = ` ${map_informations['pc'][i].ship.modules[module_i].effect.range}`;
                    weapon_range_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-xs', 'font-bold');
                    weapon_range_span.append(weapon_range_small);
                    weapon_range_span.append(weapon_range_small_value);

                    offensive_module_container.append(offensive_module_name_label);
                    offensive_module_container.append(weapon_damage_type_span);
                    offensive_module_container.append(weapon_damage_span);
                    offensive_module_container.append(weapon_range_span);

                    player_modal_container_body_offensive_module_fieldset.append(offensive_module_container);
                } else {

                    let offensive_module_span = document.createElement('span');

                    for (const [key, value] of Object.entries(map_informations['pc'][i].ship.modules[module_i].effect)) {

                        let offensive_module_type_small = document.createElement('small');
                        let offensive_module_type_small_value = document.createElement('small');
                        let offensive_module_type_small_container = document.createElement('div');

                        offensive_module_type_small_container.classList.add('flex', 'flex-row', 'pl-2', 'py-1', 'gap-1');

                        offensive_module_type_small.classList.add('font-shadow', 'text-white', 'text-xs');
                        offensive_module_type_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-xs', 'font-bold');

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

                        player_modal_container_body_offensive_module_fieldset.append(offensive_module_container);
                    }

                }
            } else if (map_informations['pc'][i].ship.modules[module_i]["type"] == "ELECTRONIC_WARFARE") {

                let electronicWarfare_module_container = document.createElement('div');
                let electronicWarfare_module_name_label = document.createElement('label');
                let electronicWarfare_module_span = document.createElement('span');

                electronicWarfare_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                electronicWarfare_module_container.classList.add('module-container', 'mb-1');
                electronicWarfare_module_name_label.textContent = map_informations['pc'][i].ship.modules[module_i].name;
                electronicWarfare_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs');

                for (const [key, value] of Object.entries(map_informations['pc'][i].ship.modules[module_i].effect)) {


                    let electronicWarfare_module_type_small = document.createElement('small');
                    let electronicWarfare_module_type_small_value = document.createElement('small');
                    let electronicWarfare_module_type_small_container = document.createElement('div');

                    electronicWarfare_module_type_small_container.classList.add('flex', 'flex-row', 'pl-2', 'gap-1');

                    electronicWarfare_module_type_small.classList.add('font-shadow', 'text-white', 'text-xs');
                    electronicWarfare_module_type_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-xs', 'font-bold');

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

                    player_modal_container_body_electronicWarfare_module_fieldset.append(electronicWarfare_module_container);

                }
            } else {

                let other_module_container = document.createElement('div');
                let other_module_name_label = document.createElement('label');
                let other_module_span = document.createElement('span');

                other_module_container.id = `module-${map_informations['pc'][i].ship.modules[module_i]["id"]}`;
                other_module_container.classList.add('module-container', 'mb-1');
                other_module_name_label.textContent = map_informations['pc'][i].ship.modules[module_i].name;
                other_module_name_label.classList.add('font-bold', 'font-shadow', 'text-white', 'text-xs');

                for (const [key, value] of Object.entries(map_informations['pc'][i].ship.modules[module_i].effect)) {

                    let other_module_type_small = document.createElement('small');
                    let other_module_type_small_value = document.createElement('small');
                    let other_module_type_small_container = document.createElement('div');

                    other_module_type_small_container.classList.add('flex', 'flex-row', 'pl-2', 'gap-1');

                    other_module_type_small.classList.add('font-shadow', 'text-white', 'text-xs');
                    other_module_type_small_value.classList.add('font-shadow', 'text-emerald-400', 'text-xs', 'font-bold', 'text-justify');

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

                    player_modal_container_body_otherModule_module_fieldset.append(other_module_container);

                }
            }
        }

        player_modal_container_body_div.append(player_modal_container_body_defensive_module_fieldset)
        player_modal_container_body_div.append(player_modal_container_body_offensive_module_fieldset)
        player_modal_container_body_div.append(player_modal_container_body_electronicWarfare_module_fieldset)
        player_modal_container_body_div.append(player_modal_container_body_otherModule_module_fieldset)
        
        player_modal_container_content_div.append(player_modal_container_header_div)
        player_modal_container_content_div.append(player_modal_container_body_div);
        
        player_modal_container.append(player_modal_container_content_div)
        player_modal.append(player_modal_container);
        character_modal.append(player_modal);
    }
}