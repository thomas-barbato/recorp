class ContextualMenu {

    constructor(target_data, target_type){
        this.target_data = target_data;
        this.target_type = target_type;
        this.contextMenu = null;
        this.cellSize = 32;
        this.gridSize = {
            x : getLimitX(),
            y : getLimitY()
        };
        this.init();
    }

    init(){
        console.log(this.target_type)
    }

    showContextMenu(event) {
        
        // Supprimer le menu existant
        this.hideContextMenu();
        
        // Créer le nouveau menu
        this.contextMenu = this.createContextMenu();
        document.body.appendChild(this.contextMenu);
        
        // Obtenir la position du joueur dans la grille
        const playerElement = document.getElementById('15_4');
        const playerRect = playerElement.getBoundingClientRect();
        const menuRect = this.contextMenu.getBoundingClientRect();
        const gridContainer = document.getElementById('tabletop-view');
        const gridRect = gridContainer.getBoundingClientRect();
        
        let x = playerRect.right + 8; // À droite du joueur par défaut
        let y = playerRect.top;
        
        // Vérifier les bords de la grille ET de l'écran
        const spaceRight = Math.min(window.innerWidth - playerRect.right, gridRect.right - playerRect.right);
        const spaceLeft = Math.min(playerRect.left, playerRect.left - gridRect.left);
        
        if (spaceRight < menuRect.width + 16 && spaceLeft > menuRect.width + 16) {
            x = playerRect.left - menuRect.width - 8; // À gauche si pas de place à droite
        }
        
        if (y + menuRect.height > window.innerHeight) {
            y = window.innerHeight - menuRect.height - 8; // Ajuster verticalement
        }
        
        // Ajuster si le menu dépasse en haut
        if (y < 8) {
            y = 8;
        }
        
        // S'assurer que le menu reste dans l'écran horizontalement
        if (x < 8) {
            x = 8;
        } else if (x + menuRect.width > window.innerWidth - 8) {
            x = window.innerWidth - menuRect.width - 8;
        }
        
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        
        console.log(`Menu positionné à (${x}, ${y}) pour joueur à (${this.playerPosition.x}, ${this.playerPosition.y})`);
    }

    createContextMenu() {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        const menuItems = [
            {
                text: '⚔️ Combat',
                submenu: [
                    { text: 'Attaque normale', action: () => this.handleAction('Attaque normale') },
                    { text: 'Attaque spéciale', action: () => this.handleAction('Attaque spéciale') },
                    { text: 'Défense', action: () => this.handleAction('Défense') }
                ]
            },
            {
                text: '🎒 Inventaire',
                submenu: [
                    { text: 'Objets', action: () => this.handleAction('Objets') },
                    { text: 'Équipement', action: () => this.handleAction('Équipement') },
                    { text: 'Consommables', action: () => this.handleAction('Consommables') }
                ]
            },
            {
                text: '🏃 Déplacement',
                submenu: [
                    { text: 'Marcher', action: () => this.handleAction('Marcher') },
                    { text: 'Courir', action: () => this.handleAction('Courir') },
                    { text: 'Se téléporter', action: () => this.handleAction('Se téléporter') }
                ]
            },
            {
                text: '🛠️ Compétences',
                submenu: [
                    { text: 'Magie', action: () => this.handleAction('Magie') },
                    { text: 'Artisanat', action: () => this.handleAction('Artisanat') },
                    { text: 'Réparation', action: () => this.handleAction('Réparation') }
                ]
            },
            {
                text: '📊 Statistiques',
                action: () => this.handleAction('Statistiques')
            },
            {
                text: '⚙️ Options',
                action: () => this.handleAction('Options')
            }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = item.submenu ? 'menu-item has-submenu' : 'menu-item';
            menuItem.textContent = item.text;
            
            if (item.submenu) {
                const submenu = document.createElement('div');
                submenu.className = 'submenu';
                
                item.submenu.forEach(subItem => {
                    const submenuItem = document.createElement('div');
                    submenuItem.className = 'submenu-item';
                    submenuItem.textContent = subItem.text;
                    submenuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        subItem.action();
                        this.hideContextMenu();
                    });
                    submenu.appendChild(submenuItem);
                });
                
                menuItem.appendChild(submenu);
            } else if (item.action) {
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.action();
                    this.hideContextMenu();
                });
            }
            
            menu.appendChild(menuItem);
        });
        
        return menu;
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }
            
    handleAction(action) {
        alert(`Action sélectionnée: ${action}`);
        console.log(`Action exécutée: ${action}`);
    }

    closeOtherContextMenu(){
        document.addEventListener(action_listener_touch_click, (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });
    }



}