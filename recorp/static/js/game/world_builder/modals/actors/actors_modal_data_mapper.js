// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {

    // ===================================================
    // PARSE MODAL ID
    // ===================================================
    function define_modal_type(modalId) {

        let result = {
            isUnknown: false,
            type: null,
            id: null,
            elementName: null,
            isForegroundElement: false,
            isStatic: false
        };

        if (!modalId || !modalId.startsWith("modal-")) {
            return null;
        }

        let remaining = modalId.replace("modal-", "");

        if (remaining.startsWith("unknown-")) {
            result.isUnknown = true;
            remaining = remaining.replace("unknown-", "");
        }

        if (remaining.includes("pc_") || remaining.includes("npc_")) {

            let match = remaining.match(/^(pc|npc)_(\d+)$/);
            if (!match) return null;

            result.type = match[1];
            result.id = parseInt(match[2], 10);

        } else {

            result.isStatic = true;

            const fg = remaining.match(/^([a-z_]+)_(\d+)$/);
            if (!fg) {
                result.elementName = remaining;
                return result;
            }

            result.isForegroundElement = true;
            result.type = fg[1];
            result.id = parseInt(fg[2], 10);
            result.elementName = remaining;
        }

        return result;
    }

    // ===================================================
    // EXTRACTION DATA RAW (map_informations)
    // ===================================================
    function extract_data_for_modal(data) {

        if (data.error) {
            return { error: data.error };
        }

        if (data.isStatic) {
            let element = map_informations.sector_element
                .find(el => el.data.name === data.elementName);

            return {
                found: !!element,
                type: element?.data?.type || null,
                data: element || null,
                searchInfo: data
            };

        } else {

            let searchArray = map_informations[data.type] || [];
            let foundEntity = null;

            if (data.type === "pc") {
                foundEntity = searchArray.find(pc =>
                    pc.user.player === data.id
                );
            } else if (data.type === "npc") {
                foundEntity = searchArray.find(npc =>
                    npc.npc.id === data.id
                );
            }

            return {
                found: !!foundEntity,
                type: data.type,
                data: foundEntity,
                searchInfo: data
            };
        }
    }


    // ===================================================
    // RESOURCE MODAL DATA
    // ===================================================
    function extractResourceInfo(resource) {
        if (!resource) return null;
        
        return {
            id: resource.id,
            name: resource.name,
            quantity_str: resource.quantity_str,
            quantity: resource.quantity,
            translated_text_resource: resource.translated_text_resource,
            translated_quantity_str: resource.translated_quantity_str,
            translated_scan_msg_str: resource.translated_scan_msg_str
        };
    }

    
    // ===================================================
    // ELEMENT INFO MODAL DATA
    // ===================================================
    function extractElementInfo(sectorData) {
        return {
            type: sectorData.data.type,
            translatedType: sectorData.data.type_translated || null,
            animationName: sectorData.animations,
            name: sectorData.data.name,
            description: sectorData.data.description,
            coordinates: {
                x: sectorData.data.coordinates.x,
                y: sectorData.data.coordinates.y
            },
            size: {
                x: sectorData.size.x,
                y: sectorData.size.y
            }
        };
    }

    // ===================================================
    // NPC MODAL DATA
    // ===================================================
    function createNpcModalData(npcData) {

        return {
            _ui: { scanned: false },

            player: {
                name: npcData.npc.displayed_name,
                faction_name: npcData.faction.name,
                id: npcData.npc.id,
                coordinates: npcData.npc.coordinates
            },

            ship: {
                name: npcData.ship.name,
                category: npcData.ship.category_name,
                description: npcData.ship.category_description,
                max_hp: npcData.ship.max_hp,
                current_hp: npcData.ship.current_hp,
                current_thermal_defense: npcData.ship.current_thermal_defense,
                max_thermal_defense: npcData.ship.max_thermal_defense,
                current_missile_defense: npcData.ship.current_missile_defense,
                max_missile_defense: npcData.ship.max_missile_defense,
                current_ballistic_defense: npcData.ship.current_ballistic_defense,
                max_ballistic_defense: npcData.ship.max_ballistic_defense,
                max_movement: npcData.ship.max_movement,
                current_movement: npcData.ship.current_movement,
                status: npcData.ship.status,
                modules: npcData.ship.modules,
                modules_range: npcData.ship.modules_range,
                image: npcData.ship.image,
                size: npcData.ship.size
            },

            actions: {
                action_label: map_informations.actions.translated_action_label_msg,
                close: map_informations.actions.translated_close_msg,
                player_in_same_faction: map_informations.actions.player_is_same_faction,
                translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
                translated_statistics_str: map_informations.actions.translated_statistics_msg_str
            }
        };
    }

    // ===================================================
    // PLAYER MODAL DATA
    // ===================================================
    function createPlayerModalData(playerData) {

        return {
            _ui: { scanned: false },

            player: {
                name: playerData.user.name,
                is_npc: playerData.user.is_npc,
                image: playerData.user.image,
                faction_name: playerData.faction.name,
                id: playerData.user.player,
                coordinates: playerData.user.coordinates,
                current_ap: playerData.user.current_ap,
                max_ap: playerData.user.current_ap
            },

            ship: {
                name: playerData.ship.name,
                category: playerData.ship.category_name,
                description: playerData.ship.category_description,
                max_hp: playerData.ship.max_hp,
                current_hp: playerData.ship.current_hp,
                current_thermal_defense: playerData.ship.current_thermal_defense,
                max_thermal_defense: playerData.ship.max_thermal_defense,
                current_missile_defense: playerData.ship.current_missile_defense,
                max_missile_defense: playerData.ship.max_missile_defense,
                current_ballistic_defense: playerData.ship.current_ballistic_defense,
                max_ballistic_defense: playerData.ship.max_ballistic_defense,
                max_movement: playerData.ship.max_movement,
                current_movement: playerData.ship.current_movement,
                status: playerData.ship.status,
                modules: playerData.ship.modules,
                modules_range: playerData.ship.modules_range
            },

            actions: {
                action_label: map_informations.actions.translated_action_label_msg,
                close: map_informations.actions.translated_close_msg,
                player_in_same_faction: map_informations.actions.player_is_same_faction,
                translated_statistics_label: map_informations.actions.translated_statistics_msg_label,
                translated_statistics_str: map_informations.actions.translated_statistics_msg_str
            }
        };
    }

    // ===================================================
    // FOREGROUND EXTRACTION
    // ===================================================
    function extractForegroundModalData(element) {

        if (!element || !element.data) {
            console.error("Invalid foreground element:", element);
            return null;
        }

        if (element.type === "warpzone") {
            return {
                type: element.type,
                name: element.data.data.name,
                description: element.data.data.description,
                coordinates: element.data.data.coordinates,
                size: {
                    x: element.data.size?.x || 1,
                    y: element.data.size?.y || 1
                },
                animation: {
                    dir: element.type,
                    img: element.data.animations
                },
                data: element.data
            };
        }

        return {
            type: element.type,
            name: element.data.item_name,
            description: element.data.data.description,
            coordinates: element.data.data.coordinates,
            size: {
                x: element.size?.x || 1,
                y: element.size?.y || 1
            },
            animation: {
                dir: element.type,
                img: element.data.animations
            },
            data: element.data
        };
    }

    // ===================================================
    // FOREGROUND MODAL DATA
    // ===================================================
    function createForegroundModalData(elementInfo, sectorData) {

        let baseModalData = {
            type: elementInfo.type,
            translated_type: elementInfo.translatedType,
            animation: elementInfo.animation,
            name: elementInfo.name,
            description: elementInfo.description,
            coordinates: elementInfo.coordinates,
            size: elementInfo.size,
            actions: {
                action_label: map_informations.actions.translated_action_label_msg,
                close: map_informations.actions.translated_close_msg
            }
        };

        switch (elementInfo.type) {

            case "warpzone": {
                let formattedDestinations = sectorData.data.destinations.map(dest => ({
                    id: dest.id,
                    warpzone_name: dest.name,
                    destination_name: dest.destination_name
                        .replaceAll("-", " ")
                        .replaceAll("_", " "),
                    warp_link_id: dest.warp_link_id,
                    original_name: dest.name
                }));

                return {
                    ...baseModalData,
                    home_sector: sectorData.data.warp_home_id,
                    destinations: formattedDestinations
                };
            }

            case "star":
            case "asteroid":
                return {
                    ...baseModalData,
                    resources: extractResourceInfo(sectorData.resource),
                    actions: {
                        ...baseModalData.actions,
                        player_in_same_faction: map_informations.actions.player_is_same_faction
                    }
                };

            case "planet":
            case "station":
            case "satellite":
                return {
                    ...baseModalData,
                    faction: {
                        starter: map_informations.sector.faction.is_faction_level_starter,
                        name: map_informations.sector.faction.name,
                        translated_str: map_informations.sector.faction.translated_text_faction_level_starter
                    },
                    actions: {
                        ...baseModalData.actions,
                        player_in_same_faction: map_informations.actions.player_is_same_faction
                    }
                };

            default:
                return null;
        }
    }

    // ===================================================
    // EXPOSITION GLOBALE + BRIDGE LEGACY
    // ===================================================
    window.ModalDataMapper = {
        define_modal_type,
        extract_data_for_modal,
        createNpcModalData,
        createPlayerModalData,
        extractForegroundModalData,
        createForegroundModalData
    };

    // Legacy (aucune ligne existante à changer)
    window.define_modal_type = define_modal_type;
    window.extract_data_for_modal = extract_data_for_modal;
    window.extractElementInfo = extractElementInfo;
    window.createNpcModalData = createNpcModalData;
    window.createPlayerModalData = createPlayerModalData;
    window.extractForegroundModalData = extractForegroundModalData;
    window.createForegroundModalData = createForegroundModalData;
    window.extractResourceInfo = extractResourceInfo;

})();
