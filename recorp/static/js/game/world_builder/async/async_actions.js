// ASYNC GAME LOGIC

function async_move(pos) {
    cleanCss();
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "player": pos.player,
            "end_x": pos.end_x,
            "end_y": pos.end_y,
            "is_reversed": pos.is_reversed,
            "start_id_array": pos.start_id_array,
            "move_cost": pos.move_cost,
            "destination_id_array": pos.destination_id_array,
        }),
        type: "async_move"
    }));
}

// VERSION OPTIMISÉE DE update_player_coord

function update_player_coord(data) {
    // Nettoyage initial
    clear_path();
    
    // Extraction et validation des données
    const {
        size,
        user_id: targetUserId,
        player_id: targetPlayerId,
        start_id_array: startPosArray,
        destination_id_array: endPosArray,
        movement_remaining: movementRemaining,
        max_movement: maxMovement,
        end_x,
        end_y,
        modules_range
    } = data;
    
    const parsedSize = {
        y: parseInt(size.y),
        x: parseInt(size.x)
    };
    
    // Détermination du type de traitement selon l'utilisateur
    if (current_user_id !== targetUserId) {
        handleOtherPlayerMove({
            targetPlayerId,
            startPosArray,
            endPosArray,
            movementRemaining: parseInt(movementRemaining),
            maxMovement: parseInt(maxMovement),
            endX: end_x,
            endY: end_y,
            size: parsedSize,
            modulesRange: modules_range
        });
    } else {
        update_player_pos_display_after_move(data);
    }
    
    // FONCTION POUR GÉRER LE MOUVEMENT D'UN AUTRE JOUEUR
    function handleOtherPlayerMove(params) {
        const {
            targetPlayerId,
            startPosArray,
            endPosArray,
            movementRemaining,
            maxMovement,
            endX,
            endY,
            size,
            modulesRange
        } = params;
        
        // Cache des éléments DOM pour éviter les recherches répétées
        const modalElement = document.getElementById(`modal-pc_${targetPlayerId}`);
        if (!modalElement) {
            console.warn(`Modal non trouvée pour le joueur ${targetPlayerId}`);
            return;
        }
        
        // Traitement des positions en batch pour optimiser les performances
        processPlayerPositions(startPosArray, endPosArray, targetPlayerId, size, endX, endY);
        
        // Mise à jour de l'interface utilisateur
        updatePlayerMovementUI(modalElement, movementRemaining, maxMovement);
        
        // Mise à jour des portées des modules
        update_player_range_in_modal(modulesRange);
    }
    
    // TRAITEMENT OPTIMISÉ DES POSITIONS
    function processPlayerPositions(startPosArray, endPosArray, targetPlayerId, size, endX, endY) {
        // Validation des tableaux
        if (!Array.isArray(startPosArray) || !Array.isArray(endPosArray)) {
            console.error('Les tableaux de positions sont invalides');
            return;
        }
        
        if (startPosArray.length !== endPosArray.length) {
            console.error('Les tableaux de positions ont des tailles différentes');
            return;
        }
        
        // Fragment DOM pour optimiser les manipulations
        const fragment = document.createDocumentFragment();
        
        // Traitement des positions par batch
        const positionUpdates = startPosArray.map((startId, index) => {
            const endId = endPosArray[index];
            return processPositionPair(startId, endId, targetPlayerId, size, endX, endY);
        });
        
        // Application des mises à jour en une seule fois
        positionUpdates.forEach(update => {
            if (update) {
                update();
            }
        });
    }
    
    // TRAITEMENT D'UNE PAIRE DE POSITIONS
    function processPositionPair(startId, endId, targetPlayerId, size, endX, endY) {
        const entryPoint = document.getElementById(startId);
        const endPoint = document.getElementById(endId);
        
        if (!entryPoint || !endPoint) {
            console.warn(`Éléments DOM non trouvés: ${startId} ou ${endId}`);
            return null;
        }
        
        // Cache du contenu pour éviter les accès DOM répétés
        const tempContent = endPoint.innerHTML;
        const entryContent = entryPoint.innerHTML;
        
        return () => {
            // Échange des contenus
            endPoint.innerHTML = entryContent;
            entryPoint.innerHTML = tempContent;
            
            // Mise à jour des propriétés de l'ancien point
            updateOldPosition(entryPoint, startId);
            
            // Mise à jour des propriétés du nouveau point
            updateNewPosition(endPoint, targetPlayerId, size, endX, endY);
        };
    }
    
    // MISE À JOUR DE L'ANCIENNE POSITION
    function updateOldPosition(entryPoint, startId) {
        const pathfindingZone = entryPoint.querySelector('.pathfinding-zone');
        if (pathfindingZone) {
            const coordinates = startId.split('_');
            pathfindingZone.title = `${map_informations?.sector?.name || 'Secteur'} [y: ${coordinates[0]} ; x: ${coordinates[1]}]`;
        }
        
        // Nettoyage des classes et événements
        entryPoint.classList.remove('pc', 'uncrossable');
    }
    
    // MISE À JOUR DE LA NOUVELLE POSITION
    function updateNewPosition(endPoint, targetPlayerId, size, endX, endY) {
        // Ajout des classes nécessaires
        endPoint.classList.add('pc', 'uncrossable');
        
        // Configuration de l'événement de clic
        setupClickEvent(endPoint, targetPlayerId);
        
        // Configuration des événements de survol
        setupHoverEvents(endPoint, size, endX, endY);
    }
    
    // CONFIGURATION DES ÉVÉNEMENTS DE CLIC
    function setupClickEvent(endPoint, targetPlayerId) {
        // Suppression des anciens événements pour éviter les doublons
        const newEndPoint = endPoint.cloneNode(true);
        endPoint.parentNode.replaceChild(newEndPoint, endPoint);
        
        // Ajout du nouvel événement
        newEndPoint.addEventListener(attribute_touch_click, function(event) {
            event.preventDefault();
            open_close(`modal-pc_${targetPlayerId}`);
        });
        
        return newEndPoint;
    }
    
    // CONFIGURATION DES ÉVÉNEMENTS DE SURVOL
    function setupHoverEvents(endPoint, size, endX, endY) {
        const endPointBorder = endPoint.querySelector('span');
        if (!endPointBorder) return;
        
        // Calcul des coordonnées une seule fois
        const adjustedEndY = parseInt(endY) + 1;
        const adjustedEndX = parseInt(endX) + 1;
        const sizeY = size.y;
        const sizeX = size.x;
        
        // Événements optimisés avec les valeurs pré-calculées
        const mouseoverHandler = () => generate_border(sizeY, sizeX, adjustedEndY, adjustedEndX);
        const mouseoutHandler = () => remove_border(sizeY, sizeX, adjustedEndY, adjustedEndX, 'border-cyan-400');
        
        endPointBorder.addEventListener("mouseover", mouseoverHandler);
        endPointBorder.addEventListener("mouseout", mouseoutHandler);
    }
    
    // MISE À JOUR DE L'INTERFACE UTILISATEUR DU MOUVEMENT
    function updatePlayerMovementUI(modalElement, movementRemaining, maxMovement) {
        try {
            // Mise à jour de la barre de progression détaillée
            updateDetailedMovementBar(modalElement, movementRemaining, maxMovement);
            
            // Mise à jour de l'indicateur de statut du mouvement
            updateMovementStatus(modalElement, movementRemaining, maxMovement);
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'interface utilisateur:', error);
        }
    }
    
    // MISE À JOUR DE LA BARRE DE PROGRESSION DÉTAILLÉE
    function updateDetailedMovementBar(modalElement, movementRemaining, maxMovement) {
        const detailedContainer = modalElement.querySelector('#movement-container-detailed');
        if (!detailedContainer) return;
        
        const progressBar = detailedContainer.querySelector('div');
        const progressText = detailedContainer.querySelector('span');
        
        if (progressBar && progressText) {
            const percentage = Math.round((movementRemaining * 100) / maxMovement);
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${movementRemaining} / ${maxMovement}`;
        }
    }
    
    // MISE À JOUR DU STATUT DE MOUVEMENT
    function updateMovementStatus(modalElement, movementRemaining, maxMovement) {
        const movementContainer = modalElement.querySelector('#movement-container');
        if (!movementContainer) return;
        
        const movementText = movementContainer.querySelector('p');
        if (!movementText) return;
        
        // Calcul optimisé du statut avec cache
        const movementValue = color_per_percent(movementRemaining, maxMovement);
        
        // Mise à jour en une seule opération
        movementText.className = `text-xs ${movementValue.color} font-shadow`;
        movementText.textContent = movementValue.status;
    }
}

// FONCTIONS UTILITAIRES POUR L'OPTIMISATION

/**
 * Débounce pour limiter les appels fréquents à une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Temps d'attente en ms
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Validation rapide des données d'entrée
 * @param {Object} data - Données à valider
 * @returns {boolean}
 */
function validatePlayerCoordData(data) {
    const requiredFields = [
        'size', 'user_id', 'player_id', 
        'start_id_array', 'destination_id_array',
        'movement_remaining', 'max_movement'
    ];
    
    return requiredFields.every(field => data.hasOwnProperty(field));
}

/**
 * Cache pour les éléments DOM fréquemment utilisés
 */
const DOMCache = {
    cache: new Map(),
    
    get(id) {
        if (!this.cache.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.cache.set(id, element);
            }
        }
        return this.cache.get(id);
    },
    
    clear() {
        this.cache.clear();
    },
    
    remove(id) {
        this.cache.delete(id);
    }
};

/**
 * Version optimisée avec validation et cache DOM
 * @param {Object} data - Données du joueur
 */
function update_player_coord_optimized(data) {
    // Validation préalable
    if (!validatePlayerCoordData(data)) {
        console.error('Données invalides pour update_player_coord:', data);
        return;
    }
    
    // Utilisation du cache DOM
    const targetModal = DOMCache.get(`modal-pc_${data.player_id}`);
    
    // Appel de la fonction principale
    update_player_coord(data);
}

function async_reverse_ship(data) {
    clear_path();
    gameSocket.send(JSON.stringify({
        message: JSON.stringify({
            "user": data.user,
            "id_array": data.id_array,
        }),
        type: "async_reverse_ship"
    }));
}

function reverse_ship(data) {
    let id_list = data["id_array"];
    update_reverse_ship_in_cache_array(data["player_id"], data["is_reversed"]);

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

function update_reverse_ship_in_cache_array(player_id, status) {
    for (let i = 0; i < map_informations.pc.length; i++) {
        if (map_informations.pc[i].user.player == player_id) {
            map_informations.pc[i].ship.is_reversed = status;
        }
    }
}

// VERSION OPTIMISÉE DE update_player_pos_display_after_move

function update_player_pos_display_after_move(data) {
    // Cache des éléments DOM fréquemment utilisés
    const tabletopView = document.querySelector('.tabletop-view');
    const movementPercent = document.querySelector('#movement-percent');
    const movementContainerValueMax = document.querySelector('#movement-container-value-max');
    const movementContainerValueCurrentElements = document.querySelectorAll('#movement-container-value-current');
    
    // Extraction des données principales
    const { player, sector } = data;
    const { coordinates, name: playerName } = player.user;
    const { size, is_reversed, current_movement, max_movement, image, visible_zone, view_range } = player.ship;
    
    const coord_x = coordinates.x + 1;
    const coord_y = coordinates.y + 1;
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
    
    // 3. Masquage du débordement de secteur
    hide_sector_overflow(coordinates.x, coordinates.y);
    
    // 4. Configuration des événements de pathfinding
    if (!isMobile) {
        set_pathfinding_event();
    }
    
    // 5. Placement du vaisseau aux nouvelles coordonnées (optimisé)
    placeShipAtNewPosition();
    
    // 6. Mise à jour de l'interface utilisateur
    updateMovementUI();
    
    // 7. Affichage de l'événement de mouvement
    occured_event_display_on_map("movement", false, player.user.player, data.move_cost);
    update_player_range_in_modal(data.modules_range);
    
    // 8. Désactivation des boutons pour mobile
    if (isMobile) {
        handleMobileButtonDisabling();
    }
    
    // FONCTIONS INTERNES OPTIMISÉES
    
    function cleanupOldPlayerPositions() {
        const currentPlayerShips = document.querySelectorAll('.ship-pos');
        
        currentPlayerShips.forEach(shipElement => {
            // Nettoyage des attributs et événements
            const attributesToRemove = ['mouseenter', 'mouseleave','onclick', 'size_x', 'size_y', 'type'];

            attributesToRemove.forEach(attr => shipElement.removeAttribute(attr));
            
            sonar.removeEventListeners();

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
        const oldPosIdSplit = shipElement.id.split('_');
        const span = document.createElement('span');
        
        span.className = "absolute hover:box-border block z-10 w-[32px] h-[32px] pathfinding-zone cursor-crosshair z-1 foreground-element";
        span.title = `${sector.name} [y: ${oldPosIdSplit[0]} ; x: ${oldPosIdSplit[1]}]`;
        
        containerDiv.appendChild(span);
    }
    
    function setupObservableZone() {
        const [observableZone, observableZoneId] = getObservableZone(visible_zone);
        
        // Variables globales mises à jour
        observable_zone = observableZone;
        observable_zone_id = observableZoneId;
    }
    
    function placeShipAtNewPosition() {
        const shipImageUrl = `/static/img/foreground/SHIPS/${image}.png`;
        const shipReversedImageUrl = `/static/img/foreground/SHIPS/${image}-reversed.png`;
        
        let currentCoordX = coord_x;
        let currentCoordY = coord_y;
        
        // Optimisation: calcul unique des tailles
        const tileSizeY = atlas.tilesize * ship_size_y;
        const tileSizeX = atlas.tilesize * ship_size_x;
        
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
            currentCoordX = coord_x;
        }
    }
    
    function setupShipTileElement(entryPoint, col_i, row_i, shipImageUrl, shipReversedImageUrl) {
        const entryPointBorder = entryPoint.querySelector('span');
        const entryPointDiv = entryPoint.querySelector('div');
        
        // Configuration des attributs et classes de base
        entryPoint.classList.add('uncrossable', 'bg-orange-400/30', 'ship-pos');
        entryPoint.setAttribute('size_x', ship_size_x);
        entryPoint.setAttribute('size_y', ship_size_y);
        
        // Configuration du border
        entryPointBorder.classList.add('border-dashed', 'cursor-pointer', border_color);
        entryPointBorder.setAttribute('title', playerName);
        entryPointBorder.setAttribute('data-modal-target', `modal-pc_${player.user.player}`);
        
        // Suppression des anciens événements de pathfinding
        entryPointBorder.removeAttribute(attribute_touch_mouseover);
        entryPointBorder.removeEventListener(attribute_touch_click, display_pathfinding);


        
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

// FONCTIONS UTILITAIRES SUPPLÉMENTAIRES (si nécessaires)

/**
 * Vérifie si un élément DOM existe avant de le manipuler
 * @param {string} selector - Sélecteur CSS
 * @returns {Element|null}
 */
function safeQuerySelector(selector) {
    try {
        return document.querySelector(selector);
    } catch (error) {
        console.warn(`Sélecteur invalide: ${selector}`, error);
        return null;
    }
}

/**
 * Optimisation pour les opérations DOM batch
 * @param {Function} operations - Fonction contenant les opérations DOM
 */
function batchDOMOperations(operations) {
    // Utilisation de requestAnimationFrame pour optimiser les performances
    requestAnimationFrame(() => {
        operations();
    });
}

function occured_event_display_on_map(event_type, is_using_timer, user_id, value=0){ 
    
    if(event_type == "movement"){
        
        let element = document.querySelector(`#tooltip-pc_${user_id}`);
        if(element){
            let movement_li = document.createElement('li');
            let movement_li_icon = document.createElement('img');
            let movement_li_value = document.createElement('span');

            movement_li.classList.add('flex', 'flex-row', 'gap-1');
            movement_li.id = "movement-information-display";

            movement_li_icon.src = '/static/img/ux/movement-icon.svg';
            movement_li_icon.classList.add(
                'lg:w-[2vw]',
                'lg:h-[2vh]',
                'w-[4vw]',
                'h-[4vh]'
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

function async_travel(id, user_id, warpzone_name){
    let spaceship = document.querySelector('.player-ship-start-pos');
    let coordinates = spaceship.getAttribute('id').split('_')
    let size_x = spaceship.getAttribute('size_x');
    let size_y = spaceship.getAttribute('size_y');
    let data = {
        "user": user_id,
        "source_id": id,
        "warpzone_name": warpzone_name,
        "coordinates": {
            y : coordinates[0],
            x : coordinates[1]
        },
        "size": {
            x : size_x,
            y : size_y
        }
    }

    let url = "warp"

    const headers = new Headers({
    'Content-Type': 'x-www-form-urlencoded',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRFToken': csrf_token
    });

    fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
            data
        })
    }).then(() => {
        gameSocket.send(JSON.stringify({
            message: JSON.stringify({
                data
            }),
            type: "async_warp_travel"
        }));
        window.location.reload();

    });
}

function remove_ship_display(data){
    let coord_x = parseInt(data.position.x);
    let coord_y = parseInt(data.position.y);
    let player_id = data.player_id;
    let size = data.size;

    if(size.x == 1 && size.y == 1){
        let element = document.getElementById(`${coord_y}_${coord_x}`);
        let element_div = element.querySelector('div');
        let element_div_span = document.createElement('span');
        
        element.removeAttribute("size_x");
        element.removeAttribute("size_y");
        element_div.replaceChildren();

        element_div_span.className = "absolute hover:box-border hover:border-2 hover:border hover:border-solid inline-block border-white w-[32px] h-[32px] pathfinding-zone cursor-pointer";
        element_div_span.setAttribute('title', `${map_informations["sector"]["name"]} [y = ${parseInt(coord_y)}; x = ${parseInt(coord_x)}]`);
        element_div_span.setAttribute(attribute_touch_mouseover, 'get_pathfinding(this)');
        element_div_span.setAttribute(attribute_touch_click, 'display_pathfinding()');
        
        element_div.append(element_div_span);
    }else{
        for(let index_row = parseInt(coord_y) ; index_row <  parseInt(coord_y) + parseInt(size.y) ; index_row++){
            for(let index_col = parseInt(coord_x) ; index_col < parseInt(coord_x) + parseInt(size.x) ; index_col++){
                let element = document.querySelector('.tabletop-view').rows[index_row].cells[index_col];
                let element_div = element.querySelector('div');
                let element_div_span = document.createElement('span');
                
                element.removeAttribute("size_x");
                element.removeAttribute("size_y");
                element_div.replaceChildren();
    
                element_div_span.className = "absolute hover:box-border hover:border-2 hover:border hover:border-solid inline-block border-white w-[32px] h-[32px] pathfinding-zone cursor-pointer";
                element_div_span.setAttribute('title', `${map_informations["sector"]["name"]} [y = ${parseInt(index_row)}; x = ${parseInt(index_col)}]`);
                element_div_span.setAttribute(attribute_touch_mouseover, 'get_pathfinding(this)');
                element_div_span.setAttribute(attribute_touch_click, 'display_pathfinding()');
                
                element_div.append(element_div_span);
            }
        }
    }

    var modal = document.querySelector('#modal-pc_' + player_id);
    if(modal){
        modal.parentNode.removeChild(modal);
    }
}