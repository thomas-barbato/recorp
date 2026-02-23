// === WEBSOCKET ACTION REGISTRY ===

import ActionRegistry from "./action_registry.js";
import { handleIncomingChatMessage } from "../handlers/chat_handlers.js";
import { handlePlayerMove, handleUpdateMovementGeneric } from "../handlers/move_handlers.js";
import { handleIncomingPrivateMessage, handlePrivateMessageSent } from "../handlers/message_handlers.js";
import { addNpc, removeNpc } from "../handlers/npc_handlers.js";
import { invalidateTimerEffect } from "../handlers/timers_handlers.js"
import { getEventsLog } from "../handlers/events_handlers.js";
import { handleCombatEvents, handleCombatDeath, handleWreckCreated, handleWreckExpired } from "../handlers/combat_handlers.js";
import { 
    handlerWarpFailed, 
    handlerRemovePlayer, 
    handlerShipRemoved, 
    handlerUserJoin, 
    handlerShipAdded, 
    handlerWarpComplete 
} from "../handlers/warp_handlers.js";
import {
    getScanResult,
    sendScanResultToGroup,
    handleScanVisibilityUpdate,
    handleScanStateSync,
} from "../handlers/modal_action_handlers.js";
import { applyEntityStatePatch } from "../handlers/entity_state_patcher.js";



function notifyCombatSceneEntityUpdate(msg) {
    const asm = window.ActionSceneManager;
    if (!asm?.isActive?.("combat")) return;
    asm._handleEntityUpdate?.(msg);
}

function entity_state_update_router(msg) {
    applyEntityStatePatch(msg);
    notifyCombatSceneEntityUpdate(msg);
}

// ===============================
// ACTIONS MOTEUR CANVAS
// ===============================
ActionRegistry.register("player_move", handlePlayerMove);
ActionRegistry.register("update_mp", handleUpdateMovementGeneric);

// ===============================
// CHAT
// ===============================
ActionRegistry.register("async_receive_chat_message", handleIncomingChatMessage);

// ===============================
// MESSAGES PRIVÉS
// ===============================

// Le joueur AUTEUR reçoit une confirmation d’envoi
ActionRegistry.register("async_sent_mp", handlePrivateMessageSent);
// Le destinataire reçoit une notification + note
ActionRegistry.register("async_receive_mp", handleIncomingPrivateMessage);
ActionRegistry.register("async_recieve_mp", handleIncomingPrivateMessage); // alias legacy typo

// ===============================
// WARP
// ===============================
ActionRegistry.register("async_warp_complete", handlerWarpComplete);
ActionRegistry.register("async_warp_failed", handlerWarpFailed);
ActionRegistry.register("async_remove_ship", handlerRemovePlayer);
ActionRegistry.register("ship_removed", handlerShipRemoved);
ActionRegistry.register("async_user_join", handlerUserJoin);
ActionRegistry.register("ship_added", handlerShipAdded);

// ===============================
// NPC ADD / REMOVE
// ===============================
ActionRegistry.register("npc_added", addNpc);
ActionRegistry.register("npc_removed", removeNpc);


// ===============================
// MODAL ACTIONS
// ===============================
ActionRegistry.register("scan_result", getScanResult);
ActionRegistry.register("scan_share_to_group", sendScanResultToGroup);
ActionRegistry.register("scan_visibility_update", handleScanVisibilityUpdate)
ActionRegistry.register("scan_state_sync", handleScanStateSync);

// ===============================
// MODAL UPDATE
// ===============================
ActionRegistry.register("entity_state_update", entity_state_update_router);

// ===============================
// TIMERS
// ===============================
ActionRegistry.register("effects_invalidated", invalidateTimerEffect);

// ===============================
// EVENTS
// ===============================
ActionRegistry.register("event_log", getEventsLog);

// ===============================
// COMBAT
// ===============================
ActionRegistry.register("combat_events", handleCombatEvents);
ActionRegistry.register("combat_death", handleCombatDeath);
ActionRegistry.register("wreck_created", handleWreckCreated);
ActionRegistry.register("wreck_expired", handleWreckExpired);

