const fg_item_selector = document.querySelector("#fg-item-selector");
const element_section = document.querySelector('#element-section');
const csrf_token = document.getElementById('csrf_token').value;
const map_elements = [];

fg_item_selector.addEventListener('change', function(){
    if(this.value != "none"){
        element_section.classList.remove('hidden');
        console.log(this.value)
        mapManager.createNewMenu(this.value);
    }else{
        element_section.classList.add('hidden')
        mapManager.cleanOldMenu();
    }
    
});

class MapElementsManager{

    constructor(){
        this.element_type = "";
        this.menu = "";
        this.data = "";
    }

    async createNewMenu(element_type){
        if(this.menu){ this.cleanOldMenu(); }
        
        // Définir element_type avant d'appeler getSelectedData
        this.element_type = element_type;
        
        try {
            // Attendre les données du fetch
            this.data = await this.getSelectedData();
            console.log('Données récupérées:', this.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            this.data = null;
        }
        
        this.menu = document.querySelector('#foreground-element-container');
        let section = document.createElement('section');
        let element_selector = document.createElement('select');
        element_selector.add(new Option('-- none --', 'none'));
        // Optionnel: ajouter les données récupérées comme options
        if (this.data) {
            JSON.parse(this.data).forEach(item => {
                console.log(item)
                element_selector.add(new Option(item.name, `${this.element_type}-${item.id}`));
            });
        }
        
        section.append(element_selector);
        this.menu.append(section);
    }

    cleanOldMenu(){
        this.menu.innerHTML = "";
    }

    async getSelectedData(){
        let url = 'get_selected_data';
        const headers = new Headers({
            'Content-Type': 'application/json', // Corrigé: était 'x-www-form-urlencoded'
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf_token
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ 'element_type': this.element_type })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur dans getSelectedData:', error);
            throw error; // Re-lancer l'erreur pour qu'elle soit gérée dans createNewMenu
        }
    }
}

const mapManager = new MapElementsManager();