function update_player_coord(data) {
    console.log(data)
    clear_path();

    // CORRECTION : Vérification robuste avec sync si nécessaire
    if (!currentPlayer || !currentPlayer.ship) {
        console.error('❌ currentPlayer invalide dans update_player_coord');
        
        // Créer une action en attente
        const retryAction = {
            type: 'player_move',
            data: { message: data },
            execute: () => update_player_coord(data)
        };
        
        requestDataSync(retryAction);
        return;
    }

    // Mise à jour des données AVANT traitement
    if (data.updated_current_player_data && data.updated_current_player_data[0]) {
        currentPlayer = data.updated_current_player_data[0];
    }
    
    if (data.updated_other_player_data) {
        otherPlayers = data.updated_other_player_data;
    }

    // CORRECTION : Double vérification après mise à jour
    if (!currentPlayer || !currentPlayer.ship) {
        console.error('❌ currentPlayer toujours invalide après mise à jour');
        return;
    }

    let view_range = currentPlayer.ship.view_range;
    let new_coordinates = {
        y: currentPlayer.user.coordinates.y + 1, 
        x: currentPlayer.user.coordinates.x + 1
    };

    resetCellToDefault(data.start_id_array);

    // Traitement selon le type d'utilisateur
    if (current_player_id !== data.player_id) {
        
        let otherPlayerData = otherPlayers.find(p => p.user.player === data.player_id);
        if (otherPlayerData) {
            handleOtherPlayerMove(otherPlayerData);
        }
        updatePlayerSonar(new_coordinates, currentPlayer.ship.view_range);
    } else {
        update_player_pos_display_after_move(currentPlayer, data);
    }
    
    initializeEnhancedDetectionSystem(currentPlayer, otherPlayers, view_range);
    
    function handleOtherPlayerMove(otherPlayerData) {
        add_pc(otherPlayerData);
    }
}

function resetCellToDefault(startPosArray, listener_need_to_be_recreated=false) {
    if (typeof cleanupSonar === 'function') {
        cleanupSonar();
    }
    
    const tabletopView = document.querySelector('.tabletop-view');
    
    if (!startPosArray || !Array.isArray(startPosArray)) {
        console.warn('⚠️ startPosArray invalide');
        return;
    }
    
    for(let i = 0; i < startPosArray.length; i++){
        let id_split = startPosArray[i].split('_');
        let id_split_y = parseInt(id_split[0]) + 1;
        let id_split_x = parseInt(id_split[1]) + 1;
        
        if (!tabletopView.rows[id_split_y]) continue;
        
        const element = tabletopView.rows[id_split_y].cells[id_split_x];

        if (!element) continue;
        
        let coordZone = element.querySelector('.coord-zone-div');
        let border = element.querySelector('span');
        let fieldOfView = element.querySelector('#field-of-view');
        let toolTip = element.querySelector('ul');
        let shipElements = element.querySelectorAll('.ship, .ship-reversed, .player-ship, .player-ship-reversed, #unknown-ship');
        
        // Suppression inconditionnelle — plus robuste
        shipElements.forEach(ship => ship.remove());
        
        element.setAttribute('class', "relative w-[32px] h-[32px] m-0 p-0 tile z-10");
        element.removeAttribute('size_x');
        element.removeAttribute('size_y');
        element.removeAttribute('data-has-sonar');
        
        if (coordZone) {
            coordZone.className = "relative w-[32px] h-[32px] z-10 coord-zone-div";
        }
        
        border?.remove();
        toolTip?.remove();
        
        if (fieldOfView) {
            fieldOfView.className = "absolute w-[32px] h-[32px] hidden";
        }
        
        let [coordY, coordX] = id_split;
        let newBorderZone = document.createElement('span');
        newBorderZone.className = "absolute w-[32px] h-[32px] pathfinding-zone cursor-crosshair";
        newBorderZone.setAttribute('title', `${map_informations?.sector?.name || 'Secteur'} [y: ${coordY} ; x: ${coordX}]`);

        if(listener_need_to_be_recreated == true){
            if (!is_user_is_on_mobile_device()) {
                newBorderZone.setAttribute('onmouseover', 'get_pathfinding(this)');
                newBorderZone.setAttribute('onclick', 'display_pathfinding()');
            }
        }
        
        coordZone?.appendChild(newBorderZone);

    }
}

function reverse_ship(data) {
    let player_id = data["player_id"];
    let id_list = data["id_array"];
    let is_reversed = data["is_reversed"];
    let is_visible = id_list.some(element => observable_zone_id.includes(element));
    update_reverse_ship_in_cache_array(player_id, is_reversed);
    if(is_visible){
        for (let i = 0; i < id_list.length; i++) {
            let element = document.getElementById(id_list[i]);
            let element_ship = element.querySelector('.ship');
            let element_ship_reversed = element.querySelector('.ship-reversed');
            if (data["is_reversed"] == true) {
                element_ship.classList.add('hidden');
                element_ship_reversed.classList.remove('hidden');
            } else {
                element_ship.classList.remove('hidden');
                element_ship_reversed.classList.add('hidden');
            }
        }
        
    }
    
}

function update_reverse_ship_in_cache_array(player_id, status) {
    if(player_id == currentPlayer.user.player){
        currentPlayer.user.is_reversed = status;
    }else{
        otherPlayerData = otherPlayers.find(p => p.user.player === player_id);
        otherPlayerData.user.is_reversed = status;
    }
}

function update_player_pos_display_after_move(data, recieved_data) {

    // Cache des éléments DOM fréquemment utilisés
    const movementPercent = document.querySelector('#movement-percent');
    const movementContainerValueMax = document.querySelector('#movement-container-value-max');
    const movementContainerValueCurrentElements = document.querySelectorAll(
        '#movement-container-value-current, #movement-container-value-min'
    );
    // Extraction des données principales
    const { coordinates } = currentPlayer.user;
    const { current_movement, max_movement, visible_zone } = currentPlayer.ship;
    const isMobile = is_user_is_on_mobile_device();
    
    // Variables globales
    let current_player_ship_tooltip = null;
    const coordinates_array_to_disable_button = [];
    
    // 1. Nettoyage des anciennes positions (optimisé)
    cleanupOldPlayerPositions();
    
    // 2. Configuration du sonar et de la zone observable
    setupObservableZone();
    
    // 3. Placement du vaisseau aux nouvelles coordonnées (optimisé)
    add_pc(currentPlayer);

    // 4. Masquage du débordement de secteur
    hide_sector_overflow(coordinates.x, coordinates.y);
    
    // 5. Configuration des événements de pathfinding
    if (!isMobile) {
        set_pathfinding_event();
    }
    
    // 6. Mise à jour de l'interface utilisateur
    updateMovementUI();
    
    // 7. Affichage de l'événement de mouvement
    occured_event_display_on_map("movement", false, currentPlayer.user.player, recieved_data.move_cost);
    update_player_range_in_modal(data.modules_range);

    // 8. Met à jour les affichages des bordures des elements statiques.
    update_foreground_border_display(foregroundElement);
    
    // 9. Désactivation des boutons pour mobile
    if (isMobile) {
        handleMobileButtonDisabling();
    }
    
    function cleanupOldPlayerPositions() {
        // NOUVEAU : Nettoyer le sonar AVANT de supprimer les cellules
        if (typeof cleanupSonar === 'function') {
            cleanupSonar();
        }
        
        const currentPlayerShips = document.querySelectorAll('.ship-pos');
        
        currentPlayerShips.forEach(shipElement => {
            // Nettoyage des attributs et événements
            const attributesToRemove = ['mouseenter', 'mouseleave','onclick', 'size_x', 'size_y', 'type', 'data-has-sonar'];
            attributesToRemove.forEach(attr => shipElement.removeAttribute(attr));
            
            // SUPPRIMÉ : sonar.removeEventListeners(); (maintenant géré par cleanupSonar)

            // Nettoyage des classes
            const classesToRemove = ['uncrossable', 'ship-pos', 'player-ship-start-pos', 'border-dashed'];
            shipElement.classList.remove(...classesToRemove);
            
            // Sauvegarde du tooltip avant suppression
            const tooltipElement = shipElement.querySelector('ul');
            if (tooltipElement && !current_player_ship_tooltip) {
                current_player_ship_tooltip = tooltipElement.cloneNode(true);
            }
            
            // Nettoyage du DOM
            cleanupShipElementDOM(shipElement);
        });
    }

    
    function cleanupShipElementDOM(shipElement) {
        // Suppression des éléments enfants spécifiques
        const elementsToRemove = ['.player-ship', '.player-ship-reversed', 'span', 'ul'];
        elementsToRemove.forEach(selector => {
            const element = shipElement.querySelector(selector);
            if (element) element.remove();
        });
        
        // Réinitialisation du div conteneur
        const backgroundDiv = shipElement.querySelector('div');
        if (backgroundDiv) {
            backgroundDiv.className = "relative w-[32px] h-[32px] coord-zone-div";
        }
        
        // Recréation du span de zone de pathfinding
        createPathfindingSpan(shipElement, backgroundDiv);
        
        // Réinitialisation de la classe principale
        shipElement.className = "relative w-[32px] h-[32px] m-0 p-0 tile";
    }
    
    function createPathfindingSpan(shipElement, containerDiv) {
        const span = document.createElement('span');

        span.className = "absolute hover:box-border block z-10 w-[32px] h-[32px] pathfinding-zone cursor-crosshair z-1 foreground-element";
        span.setAttribute('title', `${currentPlayer.user.sector_name} [y: ${currentPlayer.user.coordinates.y} ; x: ${currentPlayer.user.coordinates.x}]`);
        containerDiv.appendChild(span);
    }
    
    function setupObservableZone() {
        const [observableZone, observableZoneId] = getObservableZone(visible_zone);
        
        // Variables globales mises à jour
        observable_zone = observableZone;
        observable_zone_id = observableZoneId;
    }
    
    function updateMovementUI() {
        // Mise à jour de la barre de progression
        const movementPercentage = Math.round((current_movement * 100) / max_movement);
        movementPercent.style.width = `${movementPercentage}%`;
        
        // Mise à jour des valeurs textuelles
        movementContainerValueMax.textContent = max_movement.toString();
        movementContainerValueCurrentElements.forEach(element => {
            element.textContent = current_movement.toString();
        });
        
        // Mise à jour des points de mouvement du joueur
        current_player.set_remaining_move_points(current_movement);
    }
    
    function handleMobileButtonDisabling() {
        if (current_movement <= 0) {
            disable_button(["top", "bottom", "right", "left", "center"]);
        }
        disable_button(get_direction_to_disable_button(coordinates_array_to_disable_button));
    }
}


function set_range_finding(data) {
    return data['is_in_range'];
}

function update_player_range_in_modal(data){
    let modal = "";
    for(const node_type in data){
        for(const node in data[node_type]){
            if(node_type == "pc" || node_type == "npc"){
                modal = document.getElementById(`modal-${node_type}_${data[node_type][node].target_id}`);
            }else{
                modal = document.getElementById(`modal-${data[node_type][node].name}`);
            }
            if(modal){
                let module_element = modal.querySelector(`#module-${data[node_type][node].module_id}`);
                if(module_element){
                    if(module_element.querySelector('#range-finder-warning-msg')){
                        if(data[node_type][node].is_in_range){
                            module_element.querySelector('#range-finder-warning-msg').classList.add('hidden');
                        }else{
                            module_element.querySelector('#range-finder-warning-msg').classList.remove('hidden');
                        }
                    }
                }
            }
        }
    }
}

function handleWarpComplete(data) {
    
    // Lance le la loading screen.
    loadingScreen.show();
    
    const { new_sector_id, new_sector_data } = data;
    
    // Bloquer les actions pendant la transition
    window._syncInProgress = true;
    
    // Fermer l'ancienne connexion WebSocket proprement
    if (wsManager) {
        wsManager.shouldReconnect = false; // Empêcher la reconnexion auto
        wsManager.close();
    }
    
    // Nettoyer l'ancien secteur
    cleanupSector();
    
    // Mettre à jour les données globales
    map_informations.sector = new_sector_data.sector;
    map_informations.sector_element = new_sector_data.sector_element || [];
    map_informations.npc = new_sector_data.npc || [];
    map_informations.pc = new_sector_data.pc || [];
    
    // Trouver le joueur actuel dans les nouvelles données
    currentPlayer = map_informations.pc.find(p => p.user.player === current_player_id);
    otherPlayers = map_informations.pc.filter(p => p.user.player !== current_player_id);
    npcs = map_informations.npc || [];

    // Créer une nouvelle connexion WebSocket
    setTimeout(() => {
        wsManager = new WebSocketManager(new_sector_id);
        
        // Attendre que la connexion soit établie
        const checkConnection = setInterval(() => {
            if (wsManager.isConnected) {
                clearInterval(checkConnection);
                
                // Régénérer le secteur
                init_sector_generation();
                
                // Débloquer les actions
                window._syncInProgress = false;
                
                console.log('✅ Transition de secteur terminée');
            }
        }, 100);
    }, 500); // délai pour la transition
    // cache le la loading screen.
    loadingScreen.hide();
}

function cleanupSector() {
    // Nettoyer le DOM
    const gameCanvas = document.querySelectorAll('.tile');
    for(let i = 0; i < gameCanvas.length; i++){
        gameCanvas[i].innerHTML = "";
    }
    
    // Nettoyer le sonar
    if (typeof cleanupSonar === 'function') {
        cleanupSonar();
    }
    
    // Nettoyer les event listeners
    document.querySelectorAll('.tile').forEach(tile => {
        tile.replaceWith(tile.cloneNode(true));
    });
    
    // Réinitialiser les variables
    observable_zone = [];
    observable_zone_id = [];
}

function remove_ship_display(data){
    resetCellToDefault(data.start_id_array, true);
}