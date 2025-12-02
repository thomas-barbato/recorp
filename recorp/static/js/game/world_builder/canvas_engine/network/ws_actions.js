// === WEBSOCKET ACTION REGISTRY ===

import ActionRegistry from "./action_registry.js";
import { handlePlayerMove, handleUpdateMovementGeneric } from "../handlers/move_handlers.js";
import { handleIncomingChatMessage } from "../handlers/chat_handlers.js";
import { handleIncomingPrivateMessage, handlePrivateMessageSent } from "../handlers/message_handlers.js";

// ===============================
// ACTIONS MOTEUR CANVAS
// ===============================
ActionRegistry.register("player_move", handlePlayerMove);
ActionRegistry.register("update_mp", handleUpdateMovementGeneric);

// ===============================
// CHAT (depuis consumers.py)
// ===============================
ActionRegistry.register("async_receive_chat_message", handleIncomingChatMessage);

// ===============================
// MESSAGES PRIVÉS (depuis consumers.py)
// ===============================

// → Le joueur AUTEUR reçoit une confirmation d’envoi
ActionRegistry.register("async_sent_mp", handlePrivateMessageSent);
// → Le destinataire reçoit une notification + note
ActionRegistry.register("async_recieve_mp", handleIncomingPrivateMessage);
