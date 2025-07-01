// Configuration et constantes
const CONFIG = {
    FOREGROUND_PATH: "/static/img/foreground/",
    BACKGROUND_PATH: "/static/img/background/",
    SELECTORS: {
        FG_ITEM_SELECTOR: "#fg-item-selector",
        ELEMENT_SECTION: "#element-section",
        CSRF_TOKEN: "#csrf_token",
        FOREGROUND_CONTAINER: "#foreground-element-container"
    },
    ELEMENT_TYPES: {
        NPC: "npc"
    },
    CSS_CLASSES: {
        HIDDEN: "hidden",
        FLEX: "flex",
        FLEX_COL: "flex-col",
        W_FULL: "w-full",
        JUSTIFY_CENTER: "justify-center",
        ITEMS_CENTER: "items-center",
        P_2: "p-2",
        GAP_2: "gap-2",
        TRASH : "fa-solid fa-trash"
    },
    ATLAS : {
        col : 40,
        row : 40,
        tilesize : 32,
        map_width_size : 40 * 32,
        map_height_size : 40 * 32,
    },
    LAST_ELEMENT_SELECTED : null,
    SAVED_ELEMENT_ON_MAP: {
        sector: {
            'sector_id': null,
            'name': null,
            'description': null,
            'image': null,
            'is_faction_starter': false,
            'faction': 1,
            'security_level': 1,
        },
        map : {
            'npc': {},
            'planet': {},
            'asteroid': {},
            'station': {},
            'warpzone': {},
            'satellite': {},
            'star': {},
        }
        
    }
};
// Utilitaires DOM
class DOMUtils {
    static querySelector(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }
        return element;
    }

    static createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.id) element.id = options.id;
        if (options.classes) element.classList.add(...options.classes);
        if (options.textContent) element.textContent = options.textContent;
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        return element;
    }
}

// Service API
class ApiService {
    constructor(csrfToken) {
        this.csrfToken = csrfToken;
        this.baseHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': this.csrfToken
        };
    }

    async fetchSelectedData(elementType) {
        try {
            const response = await fetch('get_selected_data', {
                method: 'POST',
                headers: this.baseHeaders,
                credentials: 'include',
                body: JSON.stringify({ element_type: elementType })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur dans fetchSelectedData:', error);
            throw error;
        }
    }

    async fetchSelectedSector(sectorId) {

        try {
            const response = await fetch('get_sector_data', {
                method: 'POST',
                headers: this.baseHeaders,
                credentials: 'include',
                body: JSON.stringify({sector_id: sectorId})
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur dans fetchSelectedSector:', error);
            throw error;
        }
    }
}

// Générateur d'éléments UI
class UIElementFactory {
    static createSelect(options = []) {
        const select = DOMUtils.createElement('select');
        select.id = "select-element"
        select.add(new Option('-- none --', 'none'));
        
        options.forEach(option => {
            select.add(new Option(option.label, option.value));
        });
        
        return select;
    }

    static createLabel(text, forAttribute) {
        return DOMUtils.createElement('label', {
            textContent: text,
            attributes: { for: forAttribute }
        });
    }

    static createInput(id, type = 'text') {
        return DOMUtils.createElement('input', {
            id,
            attributes: { type }
        });
    }

    static createTextarea(id) {
        return DOMUtils.createElement('textarea', { id });
    }

    static createImageContainer() {
        const container = DOMUtils.createElement('div', {
            classes: [CONFIG.CSS_CLASSES.FLEX, CONFIG.CSS_CLASSES.W_FULL, 
                CONFIG.CSS_CLASSES.JUSTIFY_CENTER, CONFIG.CSS_CLASSES.ITEMS_CENTER]
        });
        
        const img = DOMUtils.createElement('img');
        container.appendChild(img);
        
        return { container, img };
    }
}

// Gestionnaire des éléments de carte
class MapElementsManager {
    constructor(apiService) {
        this.apiService = apiService;
        this.functionality = new UIElementFunctionality();
        this.reset();
    }

    reset() {
        
        this.elementType = "";
        this.menu = null;
        this.data = null;
        this.selectedData = null;
        this.sector = null;
        this.sectorData = null;
    }

    async createNewMenu(elementType) {
        if (this.menu) {
            this.cleanOldMenu();
        }

        this.elementType = elementType;
        
        try {
            this.data = JSON.parse(await this.apiService.fetchSelectedData(elementType));
            this.menu = DOMUtils.querySelector(CONFIG.SELECTORS.FOREGROUND_CONTAINER);
            
            const menuSection = this.buildMenuSection();
            this.menu.appendChild(menuSection);
            
        } catch (error) {
            console.error('Erreur lors de la création du menu:', error);
            this.data = null;
        }
    }

    async loadSectorData(sectorId){
        if (sectorId == "none"){
            return ; 
        }

        this.sector = sectorId;

        try{
            this.sectorData = JSON.parse(await this.apiService.fetchSelectedSector(sectorId));
            this.handleLoadSavedElementOnMap(this.sectorData);
            this.handleSectorNameLoad(this.sectorData.sector.name);
            this.handleSectorBackgroundLoad(this.sectorData.sector.image);
            this.handleSectorFactionStarterLoad(this.sectorData.sector.is_faction_starter);
            this.handleFactionChoiceLoad(this.sectorData.sector.faction_id);
            this.handleSectorDescriptionLoad(this.sectorData.sector.description);
            this.handleSecurityLevelLoad(this.sectorData.sector.security_id);
            this.handleSectorLoadDraw();

        } catch (error) {
            console.error('Erreur lors du chargement des données du secteur:', error);
            this.data = null;
        }
    }

    buildMenuSection() {
        const section = DOMUtils.createElement('section', {
            classes: [CONFIG.CSS_CLASSES.FLEX, CONFIG.CSS_CLASSES.FLEX_COL]
        });

        const elementSelector = this.createElementSelector();
        const { container: imageContainer, img: imageElement } = UIElementFactory.createImageContainer();
        const informationSection = this.createInformationSection();

        // Ajout de l'écouteur d'événement pour le sélecteur
        this.attachSelectorListener(elementSelector, imageElement);
        section.appendChild(elementSelector);
        section.appendChild(imageContainer);
        section.appendChild(informationSection);

        return section;
    }

    createElementSelector() {
        if (!this.data) {
            return UIElementFactory.createSelect();
        }

        const options = this.data.map(item => ({
            label: this.elementType === CONFIG.ELEMENT_TYPES.NPC ? item.ship_id__name : item.name,
            value: `${this.elementType}_${item.id}`
        }));

        return UIElementFactory.createSelect(options);
    }

    createInformationSection() {
        const section = DOMUtils.createElement('section', {
            classes: [CONFIG.CSS_CLASSES.FLEX, CONFIG.CSS_CLASSES.W_FULL, 
                CONFIG.CSS_CLASSES.JUSTIFY_CENTER, CONFIG.CSS_CLASSES.ITEMS_CENTER,
                CONFIG.CSS_CLASSES.P_2, CONFIG.CSS_CLASSES.GAP_2, CONFIG.CSS_CLASSES.FLEX_COL
            ]
        });

        const nameLabel = UIElementFactory.createLabel("Element name", "name-input");
        const nameInput = UIElementFactory.createInput("name-input");
        const descriptionLabel = UIElementFactory.createLabel("Description", "description-input");
        const descriptionTextarea = UIElementFactory.createTextarea("description-input");

        section.appendChild(nameLabel);
        section.appendChild(nameInput);
        section.appendChild(descriptionLabel);
        section.appendChild(descriptionTextarea);

        return section;
    }

    attachSelectorListener(selector, imageElement) {
        if (selector.getAttribute('listener') === 'true') {
            return;
        }
        selector.setAttribute('listener', 'true');
        selector.addEventListener('change', (event) => {
            this.handleSelectorChange(event.target.value, imageElement);
        });
    }

    handleSelectorChange(value, imageElement) {

        if (value === 'none') {
            this.selectedData = null;
            imageElement.src = '';
            CONFIG.LAST_ELEMENT_SELECTED = {};
            return;
        }

        const [elementType, elementId] = value.split('_');
        let selectedItem = this.data.find(item => item.id == elementId);
        if(elementType == "npc"){
            selectedItem = {
                id: selectedItem.ship_id,
                image: selectedItem.ship_id__image,
                name: selectedItem.ship_id__name,
                size : selectedItem.ship_id__ship_category_id__size,
                temp_uuid : selectedItem.temp_uuid,
                type: elementType
            }
        }
        Object.assign(selectedItem, {type: elementType, id: elementId, temp_uuid: crypto.randomUUID()});
        
        if (selectedItem) {
            CONFIG.LAST_ELEMENT_SELECTED = selectedItem;
            this.updateImage(elementType, selectedItem, imageElement);
        }
    }

    handleSectorBackgroundLoad(value){
        if(value == "none"){
            CONFIG.SAVED_ELEMENT_ON_MAP.sector.image = null;
            document.querySelectorAll('.tile').forEach(element => {
                element.style.backgroundImage = "";
            })
            return;
        }

        let index_row = 1;
        let index_col = 1;
        let bg_url = `${CONFIG.BACKGROUND_PATH}${value}/0.gif`;
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.image = value;

        document.querySelector("#background").value = value;

        for (let row_i = 0; row_i < CONFIG.ATLAS.map_height_size; row_i += CONFIG.ATLAS.tilesize) {
            for (let col_i = 0; col_i < CONFIG.ATLAS.map_width_size; col_i += CONFIG.ATLAS.tilesize) {
                let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                entry_point.style.backgroundImage = "url('" + bg_url + "')";
                entry_point.style.backgroundPositionX = `-${col_i}px`;
                entry_point.style.backgroundPositionY = `-${row_i}px`;
                index_col++;
            }
            index_row++;
            index_col = 1;
        }
    }


    handleLoadSavedElementOnMap(value){
        for(let type in value){
            if(type != "sector"){
                for(let i in value[type]){

                    let data = {};
                    let this_element = value[type][i];
                    const imagePath = type === CONFIG.ELEMENT_TYPES.NPC
                        ? `${CONFIG.FOREGROUND_PATH}ships/${this_element.npc_template_id__ship_id__image}.png`
                        : `${CONFIG.FOREGROUND_PATH}${type}/${this_element.source_id__data__animation}/0.gif`;
                    if(type != "npc"){
                        data = {
                            data__animation: imagePath,
                            id: this_element.id,
                            name: this_element.data.name,
                            size: this_element.source_id__size,
                            coordinates: this_element.coordinates,
                            temp_uuid: crypto.randomUUID(),
                            type: type,
                        }
                    }else{
                        data = {
                            data__animation: imagePath,
                            id: this_element.id,
                            name: this_element.npc_template_id__name,
                            size: this_element.npc_template_id__ship_id__ship_category_id__size,
                            coordinates: this_element.coordinates,
                            temp_uuid: crypto.randomUUID(),
                            type: type,
                        }
                    }

                    let nextIndex = this.functionality.getNextIndex(CONFIG.SAVED_ELEMENT_ON_MAP.map[type]);
                    CONFIG.SAVED_ELEMENT_ON_MAP.map[type][nextIndex] = data;
                    
                    CONFIG.LAST_ELEMENT_SELECTED = data
                    this.functionality.appendDataMenu()
                    
                }
            }
        }
    }

    handleSectorNameLoad(value){

        CONFIG.SAVED_ELEMENT_ON_MAP.sector.name = value !== "" ? value : null;
        document.querySelector('#sector-name').value = CONFIG.SAVED_ELEMENT_ON_MAP.sector.name;
    }

    handleFactionChoiceLoad(value){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.faction = value !== "" ? value : 1;
        document.querySelector('#faction-choice').value = CONFIG.SAVED_ELEMENT_ON_MAP.sector.faction;
    }

    handleSecurityLevelLoad(value){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.security_level = value !== "" ? value : 1;
        document.querySelector('#security-level').value = CONFIG.SAVED_ELEMENT_ON_MAP.sector.security_level;
    }

    handleSectorFactionStarterLoad(value){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.is_faction_starter = value;
        document.querySelector('#faction-starter').checked = CONFIG.SAVED_ELEMENT_ON_MAP.sector.is_faction_starter;
    }

    handleSectorDescriptionLoad(value){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.description = value !== "" ? value : null;
        document.querySelector('#sector-description').value = CONFIG.SAVED_ELEMENT_ON_MAP.sector.description; 
    }

    handleSectorLoadDraw(){
        
        for(const category in CONFIG.SAVED_ELEMENT_ON_MAP.map){
            for(const index in CONFIG.SAVED_ELEMENT_ON_MAP.map[category]){
                let data = CONFIG.SAVED_ELEMENT_ON_MAP.map[category][index]
                const imagePath = data.data__animation;
                const sizeX = data.size.x;
                const sizeY = data.size.y;
                const tileSize = CONFIG.ATLAS.tilesize;
                const totalTileSizeX = sizeX * tileSize;
                const totalTileSizeY = sizeY * tileSize;
                const temp_uuid = data.temp_uuid;

                let indexCol = parseInt(data.coordinates.x) + 1;
                let indexRow = parseInt(data.coordinates.y) + 1;

                sizeX == 1 && sizeY == 1 ? this.drawSingleSizedElement(indexRow, indexCol, imagePath, temp_uuid) : this.drawBigSizedElement(totalTileSizeX, totalTileSizeY, tileSize, indexRow, indexCol, imagePath, temp_uuid);
            }
            
        }
        

    }
    
    drawSingleSizedElement(indexRow, indexCol, imagePath, temp_uuid){
        
            let entry_point = document.querySelector('.tabletop-view').rows[indexRow].cells[indexCol];
            let entry_point_div = entry_point.querySelector('div');
            entry_point_div.classList.add(
                'foreground-container',
                `uuid-${temp_uuid}`
            );

            let img_div = document.createElement('div');
            img_div.classList.add(
                'm-auto',
                'w-[32px]',
                'h-[32px]',
            );
            img_div.style.backgroundImage = "url('" + imagePath + "')";
            entry_point_div.append(img_div);

    }

    drawBigSizedElement(totalTileSizeX, totalTileSizeY, tileSize, indexRow, indexCol, imagePath, temp_uuid){
        let index_row = indexRow;
        let index_col = indexCol;
        for (let row_i = 0; row_i < totalTileSizeY; row_i += tileSize) {
            for (let col_i = 0; col_i < totalTileSizeX; col_i += tileSize) {
                let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                let entry_point_div = entry_point.querySelector('div');
                entry_point_div.classList.add(
                    'foreground-container',
                    `uuid-${temp_uuid}`
                );

                let img_div = document.createElement('div');
                img_div.classList.add(
                    'm-auto',
                    'w-[32px]',
                    'h-[32px]',
                );
                img_div.style.backgroundImage = "url('" + imagePath + "')";
                img_div.style.backgroundPositionX = `-${col_i}px`;
                img_div.style.backgroundPositionY = `-${row_i}px`;
                entry_point_div.append(img_div);
                index_col++;
                
            }
            index_row++;
            index_col = parseInt(indexCol);
        }
    }
    
    updateImage(elementType, selectedItem, imageElement) {
        const imagePath = elementType === CONFIG.ELEMENT_TYPES.NPC
            ? `${CONFIG.FOREGROUND_PATH}ships/${selectedItem.image}.png`
            : `${CONFIG.FOREGROUND_PATH}${elementType}/${selectedItem.name}/0.gif`;
        
        imageElement.src = imagePath;
    }

    cleanOldMenu() {
        if (this.menu) {
            this.menu.innerHTML = "";
        }
    }
}

class UIElementFunctionality {
    constructor(){
    }
    attachMapListener(){
        mapManager = new UIElementFunctionality();
        let tile_container = document.querySelectorAll('.tile')
        tile_container.forEach(tile => {
            // Create a new instance to be able to work 
            // in eventListener...
            tile.addEventListener('click', function(){
                const coord = {y : "", x : ""};
                [coord.x, coord.y] = tile.id.split('_');
                mapManager.defineElementOnMap({coordinates : coord});
                mapManager.drawElementOnMap();
            })
        })
    }

    defineElementOnMap(coord){
        Object.assign(CONFIG.LAST_ELEMENT_SELECTED, coord);
        this.defineSavedElementOnMap();
    }

    getNextIndex(obj) {
        const indices = Object.keys(obj).map(key => parseInt(key)).filter(num => !isNaN(num));
        return indices.length === 0 ? 0 : Math.max(...indices) + 1;
    }

    defineSavedElementOnMap(){

        let nextIndex = this.getNextIndex(CONFIG.SAVED_ELEMENT_ON_MAP.map[CONFIG.LAST_ELEMENT_SELECTED.type]);
        CONFIG.SAVED_ELEMENT_ON_MAP.map[CONFIG.LAST_ELEMENT_SELECTED.type][nextIndex] = CONFIG.LAST_ELEMENT_SELECTED;
    }

    resetSavedElementOnMap(){
        CONFIG.SAVED_ELEMENT_ON_MAP.map = [];
    }

    drawElementOnMap(){
        const imagePath = CONFIG.LAST_ELEMENT_SELECTED.type === CONFIG.ELEMENT_TYPES.NPC
            ? `${CONFIG.FOREGROUND_PATH}ships/${CONFIG.LAST_ELEMENT_SELECTED.image}.png`
            : `${CONFIG.FOREGROUND_PATH}${CONFIG.LAST_ELEMENT_SELECTED.type}/${CONFIG.LAST_ELEMENT_SELECTED.name}/0.gif`;
        
        const sizeX = CONFIG.LAST_ELEMENT_SELECTED.size.x;
        const sizeY = CONFIG.LAST_ELEMENT_SELECTED.size.y;
        const tileSize = CONFIG.ATLAS.tilesize;
        const totalTileSizeX = sizeX * tileSize;
        const totalTileSizeY = sizeY * tileSize;
        const temp_uuid = crypto.randomUUID();

        CONFIG.LAST_ELEMENT_SELECTED.temp_uuid = temp_uuid;

        let indexCol = parseInt(CONFIG.LAST_ELEMENT_SELECTED.coordinates.x) + 1;
        let indexRow = parseInt(CONFIG.LAST_ELEMENT_SELECTED.coordinates.y) + 1;

        sizeX == 1 && sizeY == 1 ? this.drawSingleSizedElement(indexRow, indexCol, imagePath, temp_uuid) : this.drawBigSizedElement(totalTileSizeX, totalTileSizeY, tileSize, indexRow, indexCol, imagePath, temp_uuid);
        this.appendDataMenu();
    }

    drawSingleSizedElement(indexRow, indexCol, imagePath, temp_uuid){
        
            let entry_point = document.querySelector('.tabletop-view').rows[indexRow].cells[indexCol];
            let entry_point_div = entry_point.querySelector('div');
            entry_point_div.classList.add(
                'foreground-container',
                `uuid-${temp_uuid}`
            );

            let img_div = document.createElement('div');
            img_div.classList.add(
                'm-auto',
                'w-[32px]',
                'h-[32px]',
            );
            img_div.style.backgroundImage = "url('" + imagePath + "')";
            entry_point_div.append(img_div);

    }

    drawBigSizedElement(totalTileSizeX, totalTileSizeY, tileSize, indexRow, indexCol, imagePath, temp_uuid){
        for (let row_i = 0; row_i < totalTileSizeY; row_i += tileSize) {
            for (let col_i = 0; col_i < totalTileSizeX; col_i += tileSize) {
                let entry_point = document.querySelector('.tabletop-view').rows[indexRow].cells[indexCol];
                let entry_point_div = entry_point.querySelector('div');
                entry_point_div.classList.add(
                    'foreground-container',
                    `uuid-${temp_uuid}`
                );

                let img_div = document.createElement('div');
                img_div.classList.add(
                    'm-auto',
                    'w-[32px]',
                    'h-[32px]',
                );
                img_div.style.backgroundImage = "url('" + imagePath + "')";
                img_div.style.backgroundPositionX = `-${col_i}px`;
                img_div.style.backgroundPositionY = `-${row_i}px`;
                entry_point_div.append(img_div);
                indexCol++;
                
            }
            indexRow++;
            indexCol = parseInt(CONFIG.LAST_ELEMENT_SELECTED.coordinates.x) + 1;
        }
    }

    drawMapBackground(value){
        if(value == "none"){
            CONFIG.SAVED_ELEMENT_ON_MAP.sector.image = null;
            document.querySelectorAll('.tile').forEach(element => {
                element.style.backgroundImage = "";
            })
            return;
        }

        let index_row = 1;
        let index_col = 1;
        let bg_url = `${CONFIG.BACKGROUND_PATH}${value}/0.gif`;
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.image = value;

        for (let row_i = 0; row_i < CONFIG.ATLAS.map_height_size; row_i += CONFIG.ATLAS.tilesize) {
            for (let col_i = 0; col_i < CONFIG.ATLAS.map_width_size; col_i += CONFIG.ATLAS.tilesize) {
                let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                entry_point.style.backgroundImage = "url('" + bg_url + "')";
                entry_point.style.backgroundPositionX = `-${col_i}px`;
                entry_point.style.backgroundPositionY = `-${row_i}px`;
                index_col++;
            }
            index_row++;
            index_col = 1;
        }

    }

    appendDataMenu(){
        document.querySelector('#data-on-map').append(this.createDataMenuContainer());
    }

    createDataMenuContainerDivP(){
        const displayed_name = CONFIG.LAST_ELEMENT_SELECTED?.displayed_name;
        const name = CONFIG.LAST_ELEMENT_SELECTED?.name; 
        const type = CONFIG.LAST_ELEMENT_SELECTED.type;
        const coordinates = CONFIG.LAST_ELEMENT_SELECTED.coordinates;
        const size = CONFIG.LAST_ELEMENT_SELECTED.size;

        let container_div_p = document.createElement('p');
        container_div_p.textContent = `displayed name : ${displayed_name}, item name: ${name}, type: ${type}, coord(x = ${coordinates.x}, y = ${coordinates.y}) size(${size.y}x${size.x})`;
        container_div_p.className = "flex font-bold";
        return container_div_p;
    }
    
    createDataMenuContainerDivI(){
        let container_div_i = document.createElement('i');
        container_div_i.className = `${CONFIG.CSS_CLASSES.TRASH}`;
        container_div_i.id = CONFIG.LAST_ELEMENT_SELECTED.temp_uuid;
        container_div_i.addEventListener('click', this.deleteElementOnMap)
        return container_div_i;
    }

    createDataMenuContainerDiv(data = {}){
        let container_div = document.createElement('div');
        container_div.className = "flex w-full flex-row justify-between items-center gap-2";
        container_div.append(this.createDataMenuContainerDivP());
        container_div.append(this.createDataMenuContainerDivI());
        return container_div;
    }

    createDataMenuContainer(){
        let container = document.createElement('container');
        container.className = "flex w-full bg-gray-600 border-emerald-300 p-2";
        container.id = `container-${CONFIG.LAST_ELEMENT_SELECTED?.temp_uuid}`;
        container.setAttribute('data-type', CONFIG.LAST_ELEMENT_SELECTED?.type)
        container.append(this.createDataMenuContainerDiv());
        return container;
    }

    deleteElementOnMap(){

        let id = this.id;
        let element_to_delete = document.querySelectorAll(`.uuid-${id}`);
        let element_type = document.getElementById(`container-${id}`).getAttribute('data-type');

        element_to_delete.forEach(element => {
            element.className = "relative w-[32px] h-[32px] hover:border hover:border-amber-400 border-dashed block hover:bg-slate-300/10";
            element.innerHTML = "";
        })

        for(let obj in CONFIG.SAVED_ELEMENT_ON_MAP.map[element_type]){
            if(!CONFIG.SAVED_ELEMENT_ON_MAP.map[element_type][obj].temp_uuid == this.id){
                delete CONFIG.SAVED_ELEMENT_ON_MAP.map[element_type][obj];
            }
        }

        document.querySelector(`#container-${id}`).remove();
        
    }

}

// Gestionnaire principal de l'application
class AppManager {
    constructor() {
        this.initializeElements();
        this.initializeServices();
        this.attachEventListeners();
    }

    initializeElements() {
        this.fgItemSelector = DOMUtils.querySelector(CONFIG.SELECTORS.FG_ITEM_SELECTOR);
        this.elementSection = DOMUtils.querySelector(CONFIG.SELECTORS.ELEMENT_SECTION);
        this.sector_selection = DOMUtils.querySelector('#sector-select');
        this.background_selector = DOMUtils.querySelector('#background');
        this.sector_name = document.querySelector('#sector-name');
        this.security_level = DOMUtils.querySelector('#security-level');
        this.faction_choice = DOMUtils.querySelector('#faction-choice');
        this.faction_starter = DOMUtils.querySelector('#faction-starter');
        this.sector_description = DOMUtils.querySelector('#sector-description');
        this.csrfToken = DOMUtils.querySelector(CONFIG.SELECTORS.CSRF_TOKEN).value;
    }

    initializeServices() {
        this.apiService = new ApiService(this.csrfToken);
        this.mapManager = new MapElementsManager(this.apiService);
        this.UIElementFunctionality = new UIElementFunctionality();
    }

    attachEventListeners() {
        this.sector_selection.addEventListener('change', (event) => {
            this.handleSectorSelectionChange(event.target.value);
        });
        this.fgItemSelector.addEventListener('change', (event) => {
            this.handleFgItemChange(event.target.value);
        });
        this.background_selector.addEventListener('change', (event) => {
            this.handleSectorBackgroundLoad(event.target.value);
        });
        this.sector_name.addEventListener('change', (event) => {
            this.handleSectorNameChange(event.target.value);
        });
        this.security_level.addEventListener('change', (event) => {
            this.handleSecurityLevelChange(event.target.value);
        });
        this.faction_choice.addEventListener('change', (event) => {
            this.handleFactionChoiceChange(event.target.value);
        });
        this.sector_description.addEventListener('change', (event) => {
            this.handleSectorDescriptionChange(event.target.value);
        });
        this.faction_starter.addEventListener('change', (event) => {
            this.handleFactionStarterChange(event.target.checked);
        });
        document.querySelectorAll('.tile').forEach(tile => {
            this.handleTileLoader(tile);
        });
    }

    async handleFgItemChange(value) {
        if (value !== "none") {
            this.elementSection.classList.remove(CONFIG.CSS_CLASSES.HIDDEN);
            await this.mapManager.createNewMenu(value);
        } else {
            this.elementSection.classList.add(CONFIG.CSS_CLASSES.HIDDEN);
            this.mapManager.cleanOldMenu();
        }
    }

    async handleSectorSelectionChange(value){
        this.resetUX();
        if(value == "none"){
            return;
        }
        await this.mapManager.loadSectorData(value);
    }

    handleSectorNameChange(value){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.name = value !== "" ? value : null;
    }
    
    handleSecurityLevelChange(value){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.security_level = value;
    }
    
    handleSectorDescriptionChange(value){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.description = value;
    }
    
    handleFactionStarterChange(value){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.is_faction_starter = value;
    }

    handleSectorBackgroundLoad(value){
        if(value == "none"){
            CONFIG.SAVED_ELEMENT_ON_MAP.sector.image = null;
            document.querySelectorAll('.tile').forEach(element => {
                element.style.backgroundImage = "";
            })
            return;
        }

        let index_row = 1;
        let index_col = 1;
        let bg_url = `${CONFIG.BACKGROUND_PATH}${value}/0.gif`;
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.image = value;

        for (let row_i = 0; row_i < CONFIG.ATLAS.map_height_size; row_i += CONFIG.ATLAS.tilesize) {
            for (let col_i = 0; col_i < CONFIG.ATLAS.map_width_size; col_i += CONFIG.ATLAS.tilesize) {
                let entry_point = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                entry_point.style.backgroundImage = "url('" + bg_url + "')";
                entry_point.style.backgroundPositionX = `-${col_i}px`;
                entry_point.style.backgroundPositionY = `-${row_i}px`;
                index_col++;
            }
            index_row++;
            index_col = 1;
        }

    }

    handleTileLoader(tile){
        // Create a new instance to be able to work 
        // in eventListener...
        tile.addEventListener('click', function(){
        this.UIElementFunctionality = new UIElementFunctionality(); 
            const coord = {y : "", x : ""};
            [coord.x, coord.y] = tile.id.split('_');
            this.UIElementFunctionality.defineElementOnMap({coordinates : coord});
            this.UIElementFunctionality.drawElementOnMap();
        })
    }

    resetMap(){
        CONFIG.SAVED_ELEMENT_ON_MAP.sector.image = null;
        document.querySelectorAll('.tile').forEach(element => {
            element.style.backgroundImage = "";
            let div = element.querySelector('div');
            div.className = "relative w-[32px] h-[32px] hover:border hover:border-amber-400 border-dashed block hover:bg-slate-300/10";
            div.innerHTML = "";
        })
    }

    resetDataOnMap(){
        document.querySelector('#data-on-map').innerHTML = "";
    }

    resetUX(){
        
        CONFIG.LAST_ELEMENT_SELECTED = null,
        CONFIG.SAVED_ELEMENT_ON_MAP = {
            sector: {
                'name': null,
                'description': null,
                'image': null,
                'is_faction_starter': false,
                'faction': 1,
                'security_level': 1,
            },
            map : {
                'npc': {},
                'planet': {},
                'asteroid': {},
                'station': {},
                'warpzone': {},
                'satellite': {},
                'star': {},
            }
            
        }

        this.background_selector.value = "none";
        this.sector_name.value = "";
        this.security_level.value = "1";
        this.faction_choice.value = "1";
        this.faction_starter.checked = false;
        this.sector_description.value = "";

        this.fgItemSelector.value = "none";
        this.elementSection.classList.add(CONFIG.CSS_CLASSES.HIDDEN);
        this.resetMap();
        this.resetDataOnMap();

    }
}

// Variables globales (pour compatibilité)
const map_elements = [];
let mapManager = null;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new AppManager();
        // Exposition globale pour compatibilité avec le code existant
        mapManager = app.mapManager;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
    }
});