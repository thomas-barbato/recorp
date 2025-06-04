// Configuration et constantes
const CONFIG = {
    PATHS: {
        BACKGROUND: '/static/img/background/',
        FOREGROUND: '/static/img/foreground/',
        SHIPS: '/static/img/foreground/SHIPS/'
    },
    TILE_CLASSES: {
        BASE: "relative w-[32px] h-[32px] hover:border hover:border-amber-400 border-dashed block hover:bg-slate-300/10",
        FOREGROUND: 'foreground-container',
        CURSOR_POINTER: 'cursor-pointer',
        IMG_BASE: 'm-auto w-[32px] h-[32px] hover:w-[30px] hover:h-[30px]'
    },
    SELECTORS: {
        TILES: '.tile',
        NPC_CONTAINER: '#npc-container-content',
        TABLETOP: '.tabletop-view',
        SECTOR_SELECT: '#sector-select',
        VALIDATE_BTN: '#validate-btn'
    }
};

// Variables globales
const csrf_token = document.getElementById('csrf_token').value;
const npc_template = JSON.parse(document.getElementById('script_npc_template').textContent);

let atlas = {
    "col": 40,
    "row": 40,
    "tilesize": 32,
    "map_width_size": 40 * 32,
    "map_height_size": 40 * 32,
};

let spaceship_collection = [];
let added_spaceship_count = 0;

// Utilitaires
const DOMUtils = {
    createElement(tag, classes = [], attributes = {}) {
        const element = document.createElement(tag);
        if (classes.length) element.classList.add(...classes);
        Object.entries(attributes).forEach(([key, value]) => {
            element[key] = value;
        });
        return element;
    },

    getTableCell(row, col) {
        return document.querySelector(CONFIG.SELECTORS.TABLETOP).rows[row].cells[col];
    },

    applyBackgroundStyles(element, url, x, y) {
        element.style.backgroundImage = `url('${url}')`;
        element.style.backgroundPositionX = `-${x}px`;
        element.style.backgroundPositionY = `-${y}px`;
    }
};

const APIUtils = {
    createHeaders() {
        return new Headers({
            'Content-Type': 'x-www-form-urlencoded',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf_token
        });
    },

    async fetchData(url, body) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.createHeaders(),
                credentials: 'include',
                body: JSON.stringify(body)
            });
            return await response.json();
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }
};

// Fonctions principales refactorisées
function clean_entire_map() {
    const tiles = document.querySelectorAll(CONFIG.SELECTORS.TILES);
    const npc_container = document.querySelector(CONFIG.SELECTORS.NPC_CONTAINER);
    
    npc_container.innerHTML = "";
    spaceship_collection = [];

    tiles.forEach(tile => {
        tile.style.backgroundImage = "";
        tile.innerHTML = "";
        
        const new_div = DOMUtils.createElement('div', CONFIG.TILE_CLASSES.BASE.split(' '));
        tile.append(new_div);
    });
}

function add_background(folder_name) {
    const tile_map = document.querySelectorAll(CONFIG.SELECTORS.TILES);
    const bg_url = `${CONFIG.PATHS.BACKGROUND}${folder_name}/0.gif`;
    
    let index_row = 1;
    let index_col = 1;

    for (let row_i = 0; row_i < atlas.map_height_size; row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < atlas.map_width_size; col_i += atlas.tilesize) {
            const entry_point = DOMUtils.getTableCell(index_row, index_col);
            DOMUtils.applyBackgroundStyles(entry_point, bg_url, col_i, row_i);
            index_col++;
        }
        index_row++;
        index_col = 1;
    }

    tile_map.forEach(tile => {
        tile.addEventListener('click', () => get_spaceship_data(tile.id));
    });
}

function add_foreground(obj) {
    Object.values(obj).forEach(item => {
        const { coordinates, type, item_name, size } = item;
        const item_type = type === "warpzone" ? "warpzone" : type;
        const bg_url = `${CONFIG.PATHS.FOREGROUND}${item_type}/${item_name}/0.gif`;
        
        let index_row = parseInt(coordinates.y);
        let index_col = parseInt(coordinates.x);

        for (let row_i = 0; row_i < (atlas.tilesize * size.y); row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < (atlas.tilesize * size.x); col_i += atlas.tilesize) {
                const entry_point = DOMUtils.getTableCell(index_row, index_col);
                const entry_point_div = entry_point.querySelector('div');

                entry_point_div.classList.add(CONFIG.TILE_CLASSES.FOREGROUND);

                const img_div = DOMUtils.createElement('div', CONFIG.TILE_CLASSES.IMG_BASE.split(' '));
                img_div.style.borderStyle = "dashed solid blue";
                DOMUtils.applyBackgroundStyles(img_div, bg_url, col_i, row_i);
                
                entry_point_div.append(img_div);
                index_col++;
            }
            index_row++;
            index_col = parseInt(coordinates.x);
        }
    });
}

function load_map_data(obj) {
    const { sector, sector_element, npc } = obj;
    add_background(sector.image);
    add_foreground(sector_element);
    load_npc_on_map(npc);
    load_npc_menu();
}

function load_npc_menu() {
    const npc_container_content = document.querySelector(CONFIG.SELECTORS.NPC_CONTAINER);
    const container = createNPCContainer();
    
    npc_container_content.append(container);
}

function createNPCContainer() {
    // Container principal
    const main_container = DOMUtils.createElement('div', [
        "w-full", "gap-1", "flex", "flex-col", "bg-gray-600", 
        "mb-1", "p-2", "npc-container-content-item"
    ], { id: 'npc-container' });

    // Titre
    const title = DOMUtils.createElement('h4', ['text-center', 'font-bold']);

    // Section de sélection
    const select_container = createSelectSection();
    
    // Section de données
    const data_container = createDataSection();

    main_container.append(title, select_container, data_container);
    return main_container;
}

function createSelectSection() {
    const container = DOMUtils.createElement('div', ['flex', 'flex-row']);
    const subcontainer = DOMUtils.createElement('div', [
        'npc-container-content-div', 'flex', 'flex-col', 'gap-2', 'w-full', 'mx-auto'
    ]);

    const label = DOMUtils.createElement('label', ['font-bold'], {
        for: "npc-container-select",
        textContent: "Select a NPC template"
    });

    const select = DOMUtils.createElement('select', ['npc-select'], {
        name: "npc-select"
    });

    select.addEventListener('change', handleTemplateSelection);
    populateSelectOptions(select);

    subcontainer.append(label, select);
    container.append(subcontainer);
    return container;
}

function createDataSection() {
    const container = DOMUtils.createElement('div', ["flex", "flex-col", "items-center"]);
    const spaceship_data_container = DOMUtils.createElement('div', [
        "npc-container-content-div-input", "flex", "flex-col", "gap-1", "mx-auto"
    ]);

    populateSpaceshipData(spaceship_data_container);
    container.append(spaceship_data_container);
    return container;
}

function handleTemplateSelection() {
    const selected_template_id = this.options[this.selectedIndex].value;
    const selection_displays = document.querySelectorAll('.template-selection');
    
    selection_displays.forEach(display => {
        const shouldShow = display.id === `spaceship-data-${selected_template_id}`;
        display.classList.toggle('hidden', !shouldShow);
    });
}

function populateSelectOptions(select) {
    npc_template.forEach(template => {
        const option = DOMUtils.createElement('option', [], {
            id: `template-${template.id}`,
            value: template.id,
            textContent: template.name
        });
        select.append(option);
    });
}

function populateSpaceshipData(container) {
    npc_template.forEach((template, index) => {
        const data_item = createSpaceshipDataItem(template, index);
        container.append(data_item);
    });
}

function createSpaceshipDataItem(template, index) {
    const item = DOMUtils.createElement('li', [
        'list-none', 
        index === 0 ? 'template-selection' : 'hidden', 
        'template-selection'
    ], { id: `spaceship-data-${template.id}` });

    const image_container = DOMUtils.createElement('ul');
    const image = DOMUtils.createElement('img', [], {
        src: `${CONFIG.PATHS.SHIPS}${template.ship_id__image}.png`
    });

    const stats = [
        `HP: ${template.max_hp}`,
        `MOVEMENT: ${template.max_movement}`,
        `DIFFICULTY: ${template.difficulty}`,
        `MISSILE DEF: ${template.max_missile_defense}`,
        `THERMAL DEF: ${template.max_thermal_defense}`,
        `BALLISTIC DEF: ${template.max_ballistic_defense}`,
        `BEHAVIOR: ${template.behavior}`
    ];

    image_container.append(image);
    item.append(image_container);

    stats.forEach(stat => {
        const stat_element = DOMUtils.createElement('ul', [], { textContent: stat });
        item.append(stat_element);
    });

    return item;
}

function tile_already_used(obj) {
    const { pos, data } = obj;
    let row = parseInt(pos.y) + 1;
    let col = parseInt(pos.x) + 1;

    for (let row_i = 0; row_i < (atlas.tilesize * data.ship_id__ship_category_id__size.y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * data.ship_id__ship_category_id__size.x); col_i += atlas.tilesize) {
            const entry_point = DOMUtils.getTableCell(row, col);
            const entry_point_border = entry_point.querySelector('div');
            const entry_point_div = entry_point_border.querySelector('div');
            
            if (entry_point_div) return true;
            col++;
        }
        row++;
        col = parseInt(pos.x) + 1;
    }
    return false;
}

function delete_this_ship_or_pass(tile_id) {
    const entry_point = document.getElementById(tile_id);
    const entry_point_div = entry_point.querySelector('div');

    if (!entry_point_div.classList.contains(CONFIG.TILE_CLASSES.FOREGROUND)) return;

    const spaceship_class = entry_point_div.className
        .split(" ")
        .find(c => c.startsWith("spaceship-"));

    if (spaceship_class) {
        document.querySelectorAll(`.${spaceship_class}`).forEach(e => e.remove());
        
        const ship_index = spaceship_collection.findIndex(
            ship => ship.ship_id_on_map === spaceship_class
        );
        
        if (ship_index !== -1) {
            spaceship_collection.splice(ship_index, 1);
        }
    }
}

function load_npc_on_map(obj) {
    Object.values(obj).forEach(npc => {
        const spaceship_obj = createSpaceshipObject(npc);
        renderSpaceshipOnMap(spaceship_obj);
        spaceship_collection.push(spaceship_obj);
    });
}

function createSpaceshipObject(npc) {
    return {
        data: {
            id: npc.id,
            image: npc.image,
            name: npc.name,
            size: npc.size,
            template_pk: npc.template_pk,
            spaceship_uuid: crypto.randomUUID()
        },
        pos: npc.coordinates,
    };
}

function renderSpaceshipOnMap(spaceship_obj) {
    const { data, pos } = spaceship_obj;
    const bg_url = `${CONFIG.PATHS.SHIPS.toLowerCase()}${data.image}.png`;
    const spaceship_class = `spaceship-${data.spaceship_uuid}`;
    
    let index_row = parseInt(pos.y) + 1;
    let index_col = parseInt(pos.x) + 1;

    for (let row_i = 0; row_i < (atlas.tilesize * data.size.y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * data.size.x); col_i += atlas.tilesize) {
            const entry_point = DOMUtils.getTableCell(index_row, index_col);
            const entry_point_div = entry_point.querySelector('div');
            
            entry_point_div.classList.add(
                CONFIG.TILE_CLASSES.FOREGROUND,
                CONFIG.TILE_CLASSES.CURSOR_POINTER,
                spaceship_class
            );

            const img_div = getOrCreateImageDiv(entry_point_div);
            setupImageDiv(img_div, bg_url, col_i, row_i);
            
            index_col++;
        }
        index_row++;
        index_col = parseInt(pos.x) + 1;
    }

    spaceship_obj.ship_id_on_map = spaceship_class;
}

function getOrCreateImageDiv(parent) {
    const existing = parent.querySelector('div');
    if (existing) return existing;

    const img_div = DOMUtils.createElement('div', CONFIG.TILE_CLASSES.IMG_BASE.split(' '));
    parent.append(img_div);
    return img_div;
}

function setupImageDiv(img_div, bg_url, x, y) {
    img_div.style.borderStyle = "dashed solid blue";
    DOMUtils.applyBackgroundStyles(img_div, bg_url, x, y);
}

function add_spaceship_on_map(obj) {
    const { data } = obj;
    const id_uuid = crypto.randomUUID();
    const bg_url = `${CONFIG.PATHS.SHIPS}${data.ship_id__image}.png`;
    const spaceship_class = `spaceship-${id_uuid}`;
    
    let index_row = parseInt(obj.pos.y) + 1;
    let index_col = parseInt(obj.pos.x) + 1;

    for (let row_i = 0; row_i < (atlas.tilesize * data.ship_id__ship_category_id__size.y); row_i += atlas.tilesize) {
        for (let col_i = 0; col_i < (atlas.tilesize * data.ship_id__ship_category_id__size.x); col_i += atlas.tilesize) {
            const entry_point = DOMUtils.getTableCell(index_row, index_col);
            const entry_point_div = entry_point.querySelector('div');

            entry_point_div.classList.add(
                CONFIG.TILE_CLASSES.FOREGROUND,
                CONFIG.TILE_CLASSES.CURSOR_POINTER,
                spaceship_class
            );

            const img_div = getOrCreateImageDiv(entry_point_div);
            setupImageDiv(img_div, bg_url, col_i, row_i);
            
            index_col++;
        }
        index_row++;
        index_col = parseInt(obj.pos.x) + 1;
    }

    obj.ship_id_on_map = spaceship_class;
    
    if (!spaceship_collection.includes(obj)) {
        spaceship_collection.push(obj);
    } 
}

async function get_spaceship_data(tile_id) {
    const tile_id_split = tile_id.split('_');
    const sector_selection = document.querySelector(CONFIG.SELECTORS.SECTOR_SELECT);
    const selected_sector_id = sector_selection.options[sector_selection.selectedIndex].value;

    if (selected_sector_id === "none") return;

    const main_container = document.querySelector('#npc-container');
    const template_select = main_container.querySelector('select');
    const selected_template_id = template_select.options[template_select.selectedIndex].value;

    try {
        const data = await APIUtils.fetchData('get_ship_data', { 'template_id': selected_template_id });
        
        const spaceship_data = {
            data: JSON.parse(data),
            pos: {
                y: tile_id_split[1],
                x: tile_id_split[0]
            }
        };

        if (!tile_already_used(spaceship_data)) {
            add_spaceship_on_map(spaceship_data);
        } else {
            delete_this_ship_or_pass(tile_id);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données du vaisseau:', error);
    }
}

// Event Listeners
function initializeEventListeners() {
    const sector_selection = document.querySelector(CONFIG.SELECTORS.SECTOR_SELECT);
    const validate_btn = document.querySelector(CONFIG.SELECTORS.VALIDATE_BTN);

    sector_selection.addEventListener('change', handleSectorChange);
    validate_btn.addEventListener('click', handleValidation);
}

async function handleSectorChange() {
    clean_entire_map();
    const map_id = this.value;
    spaceship_collection = [];
    added_spaceship_count = 0;

    if (map_id === "none") {
        window.location.reload();
        return;
    }

    document.querySelector(CONFIG.SELECTORS.VALIDATE_BTN).classList.remove('hidden');

    try {
        const data = await APIUtils.fetchData('npc', { 'map_id': map_id });
        load_map_data(JSON.parse(data));
    } catch (error) {
        console.error('Erreur lors du chargement de la carte:', error);
    }
}

async function handleValidation() {
    const sector_selection = document.querySelector(CONFIG.SELECTORS.SECTOR_SELECT);
    const selected_sector_id = sector_selection.options[sector_selection.selectedIndex].value;

    if (selected_sector_id === "none") return;

    try {
        await APIUtils.fetchData('npc_assign_update', {
            'map_id': selected_sector_id,
            'data': spaceship_collection,
        });
    } catch (error) {
        console.error('Erreur lors de la validation:', error);
    }
}

// Initialisation
initializeEventListeners();