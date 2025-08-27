function update_player_coord(data) {
    // Nettoyage initial
    clear_path();

    // updated players data.
    currentPlayer = data.updated_current_player_data[0];
    otherPlayers = data.updated_other_player_data;

    let view_range = currentPlayer.ship.view_range;
    let new_coordinates = {y : currentPlayer.user.coordinates.y + 1, x: currentPlayer.user.coordinates.x + 1};
    const tabletopView = document.querySelector('.tabletop-view');

    resetCellToDefault(data.start_id_array);

    // Détermination du type de traitement selon l'utilisateur
    if (current_player_id !== data.player_id) {
        let otherPlayerData = otherPlayers.find(p => p.user.player === data.player_id);
        handleOtherPlayerMove(otherPlayerData);
        updatePlayerSonar(new_coordinates, currentPlayer.ship.view_range);
    } else {
        update_player_pos_display_after_move(currentPlayer, data);
    }
    
    initializeEnhancedDetectionSystem(currentPlayer, otherPlayers, view_range)

    // Dans la fonction update_player_coord, remplacer la section resetCellToDefault
    function resetCellToDefault(startPosArray) {
        // NOUVEAU : Nettoyer le sonar AVANT de réinitialiser les cellules
        if (typeof cleanupSonar === 'function') {
            cleanupSonar();
        }
        
        for(let i = 0; i < startPosArray.length; i++){
            let id_split = startPosArray[i].split('_');
            let id_split_y = parseInt(id_split[0]) + 1;
            let id_split_x = parseInt(id_split[1]) + 1;
            const element = tabletopView.rows[id_split_y].cells[id_split_x];
            
            if (!element) continue;

            // SUPPRIMÉ : sonar.removeEventListeners(); (maintenant géré par cleanupSonar)
            
            let coordZone = element.querySelector('.coord-zone-div');
            let border = element.querySelector('span');
            let fieldOfView = element.querySelector('#field-of-view');
            let toolTip = element.querySelector('ul');
            let shipElements = element.querySelectorAll('.ship, .ship-reversed, .player-ship, .player-ship-reversed, #unknown-ship');
            
            // Suppression des ships
            shipElements.forEach(ship => {
                if (ship.closest('.pc, .ship-pos, #unknown-ship')) {
                    ship.remove();
                }
            });
            
            // Batch des modifications DOM
            element.setAttribute('class', "relative w-[32px] h-[32px] m-0 p-0 tile");
            element.removeAttribute('size_x');
            element.removeAttribute('size_y');
            element.removeAttribute('data-has-sonar'); // NOUVEAU : supprimer l'attribut sonar
            
            if (coordZone) {
                coordZone.className = "relative w-[32px] h-[32px] z-20 coord-zone-div";
            }
            
            // Suppression en lot
            border?.remove();
            toolTip?.remove();
            
            // Field of view optimisé
            if (fieldOfView) {
                fieldOfView.className = "absolute w-[32px] h-[32px] hidden";
            }
            
            // Création et ajout du nouveau border
            let [coordY, coordX] = id_split;
            let newBorderZone = document.createElement('span');
            newBorderZone.className = "absolute inline-block w-[32px] h-[32px] pathfinding-zone cursor-crosshair";
            newBorderZone.setAttribute('data-title', `${map_informations?.sector?.name || 'Secteur'} [y: ${coordY} ; x: ${coordX}]`);
            
            coordZone?.appendChild(newBorderZone);
        }
    }
    
    // FONCTION POUR GÉRER LE MOUVEMENT D'UN AUTRE JOUEUR (modifiée)
    function handleOtherPlayerMove(otherPlayerData) {
        add_pc(otherPlayerData)
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

// VERSION OPTIMISÉE DE update_player_pos_display_after_move

function update_player_pos_display_after_move(data, recieved_data) {

    // Cache des éléments DOM fréquemment utilisés
    const tabletopView = document.querySelector('.tabletop-view');
    const movementPercent = document.querySelector('#movement-percent');
    const movementContainerValueMax = document.querySelector('#movement-container-value-max');
    const movementContainerValueCurrentElements = document.querySelectorAll(
        '#movement-container-value-current, #movement-container-value-min'
    );
    // Extraction des données principales
    const { player, sector } = data;
    const { coordinates, name: playerName } = currentPlayer.user;
    const { size, is_reversed, current_movement, max_movement, image, visible_zone, view_range } = currentPlayer.ship;
    const coord_x = coordinates.x + 1;
    const coord_y = coordinates.y + 1;
    const currentCoord = {y: coord_y, x: coord_x};
    const ship_size_x = size.x;
    const ship_size_y = size.y;
    const isMobile = is_user_is_on_mobile_device();
    
    // Variables globales
    let current_player_ship_tooltip = null;
    const coordinates_array_to_disable_button = [];
    const border_color = "border-orange-400";
    
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
    
    // 8. Désactivation des boutons pour mobile
    if (isMobile) {
        handleMobileButtonDisabling();
    }
    
    // Dans la fonction update_player_pos_display_after_move, remplacer cleanupOldPlayerPositions
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
        span.setAttribute('data-title', `${currentPlayer.user.sector_name} [y: ${currentPlayer.user.coordinates.y} ; x: ${currentPlayer.user.coordinates.x}]`);
        
        containerDiv.appendChild(span);
    }
    
    function setupObservableZone() {
        const [observableZone, observableZoneId] = getObservableZone(visible_zone);
        
        // Variables globales mises à jour
        observable_zone = observableZone;
        observable_zone_id = observableZoneId;
    }
    
    function placeShipAtNewPosition(size_x, size_y) {
        const shipImageUrl = `/static/img/foreground/SHIPS/${image}.png`;
        const shipReversedImageUrl = `/static/img/foreground/SHIPS/${image}-reversed.png`;
        
        let currentCoordX = currentPlayer.user.coordinates.x + 1;
        let currentCoordY = currentPlayer.user.coordinates.y + 1;
        let currentCoord = {y : currentCoordY, x: currentCoordX};

        // Optimisation: calcul unique des tailles
        const tileSizeY = atlas.tilesize * currentPlayer.ship.size.y;
        const tileSizeX = atlas.tilesize * currentPlayer.ship.size.x;
        
        for (let row_i = 0; row_i < tileSizeY; row_i += atlas.tilesize) {
            for (let col_i = 0; col_i < tileSizeX; col_i += atlas.tilesize) {
                const entryPoint = tabletopView.rows[currentCoordY].cells[currentCoordX];
                
                setupShipTileElement(entryPoint, col_i, row_i, shipImageUrl, shipReversedImageUrl);
                // Gestion spéciale pour le tooltip (uniquement sur la dernière case)
                if (isLastTile(row_i, col_i, tileSizeY)) {
                    attachTooltipToShip(entryPoint);
                }
                
                // Gestion des positions centrales du vaisseau
                setShipStartPosition(entryPoint, row_i, col_i);
                
                // Mobile: ajout des coordonnées pour désactivation des boutons
                if (isMobile) {
                    coordinates_array_to_disable_button.push(`${currentCoordY}_${currentCoordX}`);
                }
                
                currentCoordX++;
            }
            
            currentCoordY++;
            currentCoordX = currentPlayer.user.coordinates.x + 1;
        }
        updatePlayerSonar(currentCoord, view_range);
        onPlayerMoved(currentCoord, view_range);
        initializeDetectionSystem(currentPlayer, otherPlayers, npcs);
    }
    
    function setupShipTileElement(entryPoint, col_i, row_i, shipImageUrl, shipReversedImageUrl) {
        const entryPointBorder = entryPoint.querySelector('span');
        const entryPointDiv = entryPoint.querySelector('div');

        const coord = entryPoint.id.split('_')
        
        // Configuration des attributs et classes de base
        entryPoint.classList.add('uncrossable', 'bg-orange-400/30', 'ship-pos');
        entryPoint.setAttribute('size_x', ship_size_x);
        entryPoint.setAttribute('size_y', ship_size_y);
        
        // Configuration du border
        entryPointBorder.classList.add('border-dashed', 'cursor-pointer', border_color);
        entryPointBorder.setAttribute('data-title', `${playerName} [x : ${coord[0]}, y: ${coord[1]}]`);
        entryPointBorder.setAttribute('data-modal-target', `modal-pc_${currentPlayer.user.player}`);
        entryPointBorder.id = "ship-data-title";
        
        // Suppression des anciens événements de pathfinding
        entryPointBorder.removeAttribute(attribute_touch_mouseover);
        entryPointBorder.removeEventListener(attribute_touch_click, display_pathfinding);

        entryPointDiv.classList.add('bg-orange-400/30');
        
        // Création et configuration des éléments de vaisseau
        const [spaceShip, spaceShipReversed] = createShipElements(shipImageUrl, shipReversedImageUrl, col_i, row_i);
        
        // Ajout des éléments au DOM
        entryPointDiv.appendChild(spaceShip);
        entryPointDiv.appendChild(spaceShipReversed);
        
        // Configuration des événements selon le type d'appareil
        setupDeviceSpecificEvents(entryPoint, entryPointBorder);
        
        // Mise à jour de l'affichage des coordonnées utilisateur
        update_user_coord_display(coordinates.x, coordinates.y);
    }
    
    function createShipElements(shipImageUrl, shipReversedImageUrl, col_i, row_i) {
        const spaceShip = document.createElement('div');
        const spaceShipReversed = document.createElement('div');
        
        // Configuration commune
        const commonClasses = ['z-1', 'absolute', 'cursor-pointer', 'w-[32px]', 'h-[32px]'];
        const commonStyles = {
            backgroundPositionX: `-${col_i}px`,
            backgroundPositionY: `-${row_i}px`
        };
        
        // Configuration du vaisseau normal
        spaceShip.style.backgroundImage = `url('${shipImageUrl}')`;
        spaceShip.classList.add('ship', 'player-ship', ...commonClasses);
        Object.assign(spaceShip.style, commonStyles);
        
        // Configuration du vaisseau inversé
        spaceShipReversed.style.backgroundImage = `url('${shipReversedImageUrl}')`;
        spaceShipReversed.classList.add('ship-reversed', 'player-ship-reversed', ...commonClasses);
        Object.assign(spaceShipReversed.style, commonStyles);
        
        // Affichage conditionnel selon l'orientation
        if (is_reversed) {
            spaceShip.classList.add('hidden');
            spaceShipReversed.classList.remove('hidden');
        } else {
            spaceShip.classList.remove('hidden');
            spaceShipReversed.classList.add('hidden');
        }
        
        return [spaceShip, spaceShipReversed];
    }
    
    function setupDeviceSpecificEvents(entryPoint, entryPointBorder) {
        if (!isMobile) {
            // Desktop: événements de survol et clic
            entryPoint.setAttribute('onclick', 'reverse_player_ship_display()');
            
            entryPointBorder.addEventListener("mouseover", () => {
                generate_border(ship_size_y, ship_size_x, coordinates.y + 1, coordinates.x + 1);
            });
            
            entryPointBorder.addEventListener("mouseout", () => {
                remove_border(ship_size_y, ship_size_x, coordinates.y + 1, coordinates.x + 1, border_color);
            });
        } else {
            // Mobile: événement tactile
            entryPoint.setAttribute('ontouchstart', 'reverse_player_ship_display()');
        }
    }
    
    function attachTooltipToShip(entryPoint) {
        if (current_player_ship_tooltip) {
            // Suppression de l'ancien élément d'information de mouvement
            const movementInfo = current_player_ship_tooltip.querySelector('li#movement-information-display');
            if (movementInfo) {
                movementInfo.remove();
            }
            entryPoint.appendChild(current_player_ship_tooltip);
        }
    }
    
    function setShipStartPosition(entryPoint, row_i, col_i) {
        // Définition de la position centrale selon la taille du vaisseau
        const startPositionMap = {
            '1x1': () => col_i === 0,
            '1x2': () => col_i === 0,
            '1x3': () => col_i === 32,
            '3x3': () => row_i === 32 && col_i === 32
        };
        
        const sizeKey = `${ship_size_y}x${ship_size_x}`;
        const shouldAddStartPos = startPositionMap[sizeKey];
        
        if (shouldAddStartPos && shouldAddStartPos()) {
            entryPoint.classList.add("player-ship-start-pos");
        }
    }
    
    function isLastTile(row_i, col_i, tileSizeY) {
        return row_i === (tileSizeY - atlas.tilesize) && col_i === 0;
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


function occured_event_display_on_map(event_type, is_using_timer, user_id, value=0){ 
    if(event_type == "movement"){
        
        let element = document.querySelector(`#tooltip-pc_${user_id}`);
        if(element){
            let movement_li = document.createElement('li');
            let movement_li_icon = document.createElement('img');
            let movement_li_value = document.createElement('span');

            movement_li.classList.add('flex', 'flex-row', 'gap-1', 'text-2xl', 'font-bold');
            movement_li.id = "movement-information-display";

            movement_li_icon.src = '/static/img/ux/movement-icon.svg';
            movement_li_icon.classList.add(
                'w-[4vw]',
                'h-[4vh]',
            )
            
            movement_li_value.classList.add('text-teal-300', 'p-1', 'w-full', 'font-shadow')
            movement_li_value.textContent = `-${value}`;

            movement_li.append(movement_li_value);
            movement_li.append(movement_li_icon);

            element.append(movement_li);
            fade_effect(element.querySelector("#movement-information-display"), 100)
        }
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

function update_modals(){

}