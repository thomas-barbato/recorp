// Gestion des actions reçues via WebSocket pour le moteur canvas
// (déplacements, mise à jour des points de mouvement, etc.)

import ActionRegistry from "./action_registry.js";
import { handlePlayerMove, handleUpdateMovementGeneric } from "../handlers/move_handlers.js";
import { updatePlayerCoords } from "../engine/update_coordinate_display.js";
//import { handleIncomingPrivateMessage } from "../handlers/message_handlers.js";
import { handleIncomingChatMessage } from "../handlers/chat_handlers.js";


// -----------------------------------------------------------
// Enregistrement dans ActionRegistry
// -----------------------------------------------------------

// Déplacement complet (avec path, endX, endY, move, max_move…)
ActionRegistry.register("player_move", handlePlayerMove);

// Mise à jour simple des PM (sans forcément de déplacement)
ActionRegistry.register("update_mp", handleUpdateMovementGeneric);

ActionRegistry.register("async_receive_chat_message", handleIncomingChatMessage);