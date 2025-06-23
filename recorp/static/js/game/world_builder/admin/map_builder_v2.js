// Configuration et constantes
const CONFIG = {
    FOREGROUND_PATH: "/static/img/foreground/",
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
        GAP_2: "gap-2"
    },
    ATLAS : {
        col : 40,
        row : 40,
        tilesize : 32,
        map_width_size : 40 * 32,
        map_height_size : 40 * 32,
    },
    LAST_ELEMENT_SELECTED : null,
    SAVED_ELEMENT_ON_MAP: []
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
        this.reset();
    }

    reset() {
        this.elementType = "";
        this.menu = null;
        this.data = null;
        this.selectedData = null;
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
            return;
        }

        const [elementType, elementId] = value.split('_');
        const selectedItem = this.data.find(item => item.id == elementId);
        
        if (selectedItem) {
            this.selectedData = selectedItem;
            CONFIG.LAST_ELEMENT_SELECTED = this.selectedData;
            this.updateImage(elementType, selectedItem, imageElement);
            this.attachMapListener();
            
        }
    }
    
    attachMapListener(){
        let mapElement = document.querySelectorAll('.tile');
        if(mapElement[0].getAttribute('listener') === 'true'){
            return;
        }
        // Create a new instance to be able to work 
        // in eventListener...
        mapManager = new MapElementsManager()
        mapElement.forEach(element => {
            element.addEventListener('click', function(){
                mapManager.drawElementOnMap(element.id)
            })
        })
    }

    drawElementOnMap(id){

        const elementType = document.querySelector('#fg-item-selector').value;
        const imagePath = elementType === CONFIG.ELEMENT_TYPES.NPC
            ? `${CONFIG.FOREGROUND_PATH}ships/${CONFIG.LAST_ELEMENT_SELECTED.ship_id__image}.png`
            : `${CONFIG.FOREGROUND_PATH}${elementType}/${CONFIG.LAST_ELEMENT_SELECTED.name}/0.gif`
        const tile_id = id.split('_');
        const coord = {
            x : tile_id[1],
            y : tile_id[0]
        };
        
        const elementData = {
            url: imagePath,
            size: CONFIG.LAST_ELEMENT_SELECTED.size,
            pos: coord
        };

        this.storeElement(elementData);
    }

    defineSavedElementOnMap(elementData){
        CONFIG.SAVED_ELEMENT_ON_MAP.push(elementData);
        console.log(CONFIG.SAVED_ELEMENT_ON_MAP);
    }

    resetSavedElementOnMap(){
        CONFIG.SAVED_ELEMENT_ON_MAP = [];
    }

    updateImage(elementType, selectedItem, imageElement) {
        const imagePath = elementType === CONFIG.ELEMENT_TYPES.NPC
            ? `${CONFIG.FOREGROUND_PATH}ships/${selectedItem.ship_id__image}.png`
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
        this.csrfToken = DOMUtils.querySelector(CONFIG.SELECTORS.CSRF_TOKEN).value;
    }

    initializeServices() {
        this.apiService = new ApiService(this.csrfToken);
        this.mapManager = new MapElementsManager(this.apiService);
    }

    attachEventListeners() {
        this.fgItemSelector.addEventListener('change', (event) => {
            this.handleFgItemChange(event.target.value);
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