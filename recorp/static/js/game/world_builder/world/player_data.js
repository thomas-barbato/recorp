let character_main = document.querySelector('#player-info-item-container');
let character_main_container = document.createElement('div');
let character_basic_information_container = document.createElement('div');
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
let character_statistics_progressbar_container = document.createElement('div');
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
    'mt-1',
    'mb-2',
    'flex',
    'items-center',
    'lg:justify-center',
    'justify-start',
    'lg:flex-col',
    'flex-row',
);

character_basic_information_container.classList.add(
    'w-2/2',
    'mt-1',
    'flex',
    'items-center',
    'justify-center',
    'gap-2',
    'lg:flex-row',
    'flex-col'
);

character_basic_information_img.id = "user-avatar";
character_basic_information_img.classList.add(
    'w-24',
    'box-content'
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

character_statistics_progressbar_container.classList.add(
    'w-[80%]',
    'lg:p-5',
    'lg:mt-2',
    'flex',
    'items-center',
    'justify-center',
    'gap-2',
    'flex-col',
    'bg-gray-600/40'
);

character_statistics_progressbar_hp_div.classList.add(
    'w-full',
    'bg-gray-200',
    'dark:bg-gray-700',
    'relative'
);
character_statistics_progressbar_hp_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-sm',
    'mt-2',
);
character_statistics_progressbar_hp_label.textContent = "HULL POINTS:"
character_statistics_progressbar_hp_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[20px]'
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
    'p-0.5'
);

character_statistics_progressbar_move_div.classList.add(
    'w-full',
    'bg-gray-200',
    'dark:bg-gray-700',
    'relative'
);
character_statistics_progressbar_move_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-sm',
    'mt-2'
)
character_statistics_progressbar_move_label.textContent = "MOVEMENT POINTS:"
character_statistics_progressbar_move_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[20px]'
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
    'p-0.5'
);

character_statistics_progressbar_ap_div.classList.add(
    'w-full',
    'bg-gray-200',
    'dark:bg-gray-700',
    'relative'
);
character_statistics_progressbar_ap_label.classList.add(
    'font-bold',
    'font-shadow',
    'text-white',
    'text-sm',
    'mt-2'
);
character_statistics_progressbar_ap_label.textContent = "ACTION POINTS:"
character_statistics_progressbar_ap_content.classList.add(
    'bg-blue-600',
    'leading-none',
    'h-[20px]'
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
    'p-0.5'
);


for (let i = 0; i < map_informations['pc_npc'].length; i++) {
    if (map_informations['pc_npc'][i].user.user == current_user_id) {
        console.log(map_informations['pc_npc'][i])
        let img_src = map_informations['pc_npc'][i].user.image == "img.png" ? `/static/js/game/assets/ux/default-user.svg` : `/static/js/game/assets/users/${map_informations['pc_npc'][i].user.player}/0.jpg`
        character_basic_information_img.src = img_src;
        character_basic_information_li_name_b.textContent = "Name: ";
        character_basic_information_li_name_span.textContent = map_informations['pc_npc'][i].user.name;
        character_basic_information_li_archetype_b.textContent = "Archetype: ";
        character_basic_information_li_archetype_span.textContent = map_informations['pc_npc'][i].user.archetype_name;
        character_basic_information_li_faction_b.textContent = "Faction: ";
        character_basic_information_li_faction_span.textContent = map_informations['pc_npc'][i].faction.name;

        let hp_percent = `${Math.round((map_informations['pc_npc'][i].ship.current_hp * 100) / (map_informations['pc_npc'][i].ship.max_hp))}%`;
        let move_percent = `${Math.round((map_informations['pc_npc'][i].ship.current_movement * 100) / (map_informations['pc_npc'][i].ship.max_movement))}%`;
        let ap_percent = `${Math.round((map_informations['pc_npc'][i].user.current_ap * 100) / (map_informations['pc_npc'][i].user.max_ap))}%`;

        character_statistics_progressbar_hp_content.style.width = hp_percent;
        character_statistics_progressbar_hp_text.textContent = `${map_informations['pc_npc'][i].ship.current_hp} / ${map_informations['pc_npc'][i].ship.max_hp}`;
        character_statistics_progressbar_move_content.style.width = move_percent;
        character_statistics_progressbar_move_text.textContent = `${map_informations['pc_npc'][i].ship.current_movement} / ${map_informations['pc_npc'][i].ship.max_movement}`;
        character_statistics_progressbar_ap_content.style.width = ap_percent;
        character_statistics_progressbar_ap_text.textContent = `${map_informations['pc_npc'][i].user.current_ap} / ${map_informations['pc_npc'][i].user.max_ap}`;

        character_basic_information_li_name.append(character_basic_information_li_name_b);
        character_basic_information_li_name.append(character_basic_information_li_name_span);
        character_basic_information_li_archetype.append(character_basic_information_li_archetype_b);
        character_basic_information_li_archetype.append(character_basic_information_li_archetype_span);
        character_basic_information_li_faction.append(character_basic_information_li_faction_b);
        character_basic_information_li_faction.append(character_basic_information_li_faction_span);

        character_basic_information_ul.append(character_basic_information_li_name);
        character_basic_information_ul.append(character_basic_information_li_archetype);
        character_basic_information_ul.append(character_basic_information_li_faction);

        character_basic_information_container.append(character_basic_information_img);
        character_basic_information_container.append(character_basic_information_ul);

        character_statistics_progressbar_hp_div.append(character_statistics_progressbar_hp_content);
        character_statistics_progressbar_hp_div.append(character_statistics_progressbar_hp_text);

        character_statistics_progressbar_move_div.append(character_statistics_progressbar_move_content);
        character_statistics_progressbar_move_div.append(character_statistics_progressbar_move_text);

        character_statistics_progressbar_ap_div.append(character_statistics_progressbar_ap_content);
        character_statistics_progressbar_ap_div.append(character_statistics_progressbar_ap_text);

        character_statistics_progressbar_container.append(character_statistics_progressbar_hp_label);
        character_statistics_progressbar_container.append(character_statistics_progressbar_hp_div);
        character_statistics_progressbar_container.append(character_statistics_progressbar_move_label);
        character_statistics_progressbar_container.append(character_statistics_progressbar_move_div);
        character_statistics_progressbar_container.append(character_statistics_progressbar_ap_label);
        character_statistics_progressbar_container.append(character_statistics_progressbar_ap_div);

        character_main_container.append(character_basic_information_container);
        character_main_container.append(character_statistics_progressbar_container);

        character_main.append(character_main_container);

    }
}