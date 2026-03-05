// globals.js
// Initialise et expose les variables globales (compatibilité avec les anciens scripts).
// Appeller initGlobals() avant d'initialiser le moteur canvas.

export let map_informations = null;
export let current_player_id = null;
export let current_player_data = null
export let current_player_status = null;

export let currentPlayer = null;
export let otherPlayers = [];
export let foregroundElement = [];
export let npcs = [];
export let observable_zone = [];
export let observable_zone_id = [];
export let mobile_radar_sweep_bool = true;
export let pendingAction = null;

function createGameStateContainer() {
    return {
        refs: {
            canvasEngine: null,
        },
        player: {
            currentPlayerId: null,
            currentPlayer: null,
            currentPlayerStatus: null,
        },
        world: {
            mapInformations: null,
        },
        effects: {
            active: {
                scan: new Map(),
                share_scan: new Map(),
                buff: new Map(),
                debuff: new Map(),
                craft: new Map(),
                gather: new Map(),
                research: new Map(),
            },
        },
        patchEntityState(msg) {
            if (!msg?.entity_key || !msg?.change_type || !msg?.changes) return;
            const { entity_key, change_type, changes } = msg;
            this.entities ??= new Map();
            const prev = this.entities.get(entity_key) || { runtime: { shields: {} } };
            const next = {
                ...prev,
                runtime: {
                    ...(prev.runtime || {}),
                    shields: { ...(prev.runtime?.shields || {}) },
                },
            };

            if (change_type === "ap_update") {
                if (changes.ap?.current != null) next.runtime.current_ap = changes.ap.current;
                if (changes.ap?.max != null) next.runtime.max_ap = changes.ap.max;
            } else if (change_type === "mp_update") {
                if (changes.movement?.current != null) next.runtime.current_movement = changes.movement.current;
                if (changes.movement?.max != null) next.runtime.max_movement = changes.movement.max;
                if (changes.position?.x != null) next.runtime.x = changes.position.x;
                if (changes.position?.y != null) next.runtime.y = changes.position.y;
            } else if (change_type === "hp_update") {
                if (changes.hp?.current != null) next.runtime.current_hp = changes.hp.current;
                if (changes.hp?.max != null) next.runtime.max_hp = changes.hp.max;
                if (changes.shields) {
                    next.runtime.shields = { ...next.runtime.shields, ...changes.shields };
                }
                if (changes.shield?.damage_type && changes.shield?.current != null) {
                    next.runtime.shields[changes.shield.damage_type] = changes.shield.current;
                }
            }

            this.entities.set(entity_key, next);
        },
        findPlayerMapEntry(playerId) {
            const pcList = Array.isArray(this.mapInformations?.pc) ? this.mapInformations.pc : [];
            const idx = pcList.findIndex(p => String(p.user?.player) === String(playerId));
            if (idx === -1) return null;
            return { pcList, idx, entry: pcList[idx] };
        },
        updatePlayerMovement(playerId, { current = null, max = null } = {}) {
            const found = this.findPlayerMapEntry(playerId);
            if (found) {
                const ship = found.entry.ship || {};
                if (typeof current === "number") ship.current_movement = current;
                if (typeof max === "number") ship.max_movement = max;
                found.pcList[found.idx].ship = ship;
            }

            const actor = this.canvasEngine?.map?.findPlayerById?.(playerId);
            if (actor?.data?.ship) {
                if (typeof current === "number") actor.data.ship.current_movement = current;
                if (typeof max === "number") actor.data.ship.max_movement = max;
            }

            if (String(playerId) === String(this.currentPlayerId) && this.currentPlayer?.ship) {
                if (typeof current === "number") this.currentPlayer.ship.current_movement = current;
                if (typeof max === "number") this.currentPlayer.ship.max_movement = max;
            }
        },
        updatePlayerAp(playerId, currentAp) {
            if (typeof currentAp !== "number") return;
            if (String(playerId) !== String(this.currentPlayerId)) return;
            if (this.currentPlayer?.user) {
                this.currentPlayer.user.current_ap = currentAp;
            }
        },
        updateCurrentPlayerCoords({ x = null, y = null } = {}) {
            if (!this.currentPlayer?.user?.coordinates) return;
            if (typeof x === "number") this.currentPlayer.user.coordinates.x = x;
            if (typeof y === "number") this.currentPlayer.user.coordinates.y = y;
        },
        get canvasEngine() {
            return this.refs.canvasEngine ?? window.canvasEngine ?? null;
        },
        get currentPlayer() {
            return this.player.currentPlayer ?? window.currentPlayer ?? null;
        },
        get currentPlayerId() {
            return this.player.currentPlayerId ?? window.current_player_id ?? null;
        },
        get mapInformations() {
            return this.world.mapInformations ?? window.map_informations ?? null;
        },
    };
}

// Atlas : taille de la map et tilesize
export const atlas = {
    col: 40,
    row: 40,
    tilesize: 32,
    map_width_size: 40 * 32,
    map_height_size: 40 * 32,
};

// Initialise les globals depuis les json_script injectés par Django.
// Expose aussi les variables sur window pour compatibilité ascendante.
export function initGlobals() {
    try {
        const mapScript = document.getElementById('script_map_informations');
        const playerScript = document.getElementById('script_current_player_id');
        const currentPlayerData = document.getElementById('script_current_player_state');
        const currentPlayerStatusData = document.getElementById('script_current_player_status');

        map_informations = mapScript ? JSON.parse(mapScript.textContent) : null;
        current_player_id = playerScript ? JSON.parse(playerScript.textContent) : null;
        currentPlayer = currentPlayerData ? JSON.parse(currentPlayerData.textContent) : null;
        current_player_status = currentPlayerStatusData ? JSON.parse(currentPlayerStatusData.textContent) : null;
        
        foregroundElement = map_informations?.sector_element || [];
        npcs = map_informations?.npc || [];

        window.GameState ??= createGameStateContainer();
        window.GameState.world.mapInformations = map_informations;
        window.GameState.player.currentPlayerId = current_player_id;
        window.GameState.player.currentPlayer = currentPlayer;
        window.GameState.player.currentPlayerStatus = current_player_status;

        // Expose legacy globals on window for older scripts (chat, modals...)
        window.map_informations = map_informations;
        window.current_player_id = current_player_id;
        window.current_player_status = current_player_status;
        window.currentPlayer = currentPlayer;
        window.otherPlayers = otherPlayers;
        window.foregroundElement = foregroundElement;
        window.npcs = npcs;
        window.observable_zone = observable_zone;
        window.observable_zone_id = observable_zone_id;
        window.mobile_radar_sweep_bool = mobile_radar_sweep_bool;
        window.pendingAction = pendingAction;
        window.atlas = atlas;
        window.scannedTargets = new Set();
        window.sharedTargets  = new Set();
        window.scannedTargetData = {};
        window.scannedMeta = {};
        window.scannedModalData = {};
        window.scanExpiredLocal = new Set();
        window.groupStateSnapshot = { in_group: false, members: [] };
        window.groupStateSnapshotReady = false;
        window.groupMembersByKey = {};
        window.groupMemberActorKeys = new Set();
        window.groupLeaderActorKeys = new Set();

        window.applyGroupStateSnapshot = function (state) {
            const snapshot = (state && typeof state === "object") ? state : {};
            const inGroup = Boolean(snapshot.in_group);
            const members = Array.isArray(snapshot.members) ? snapshot.members : [];
            const currentPlayerId = String(window.current_player_id ?? "");

            const membersByKey = {};
            const memberKeys = new Set();
            const leaderKeys = new Set();

            if (inGroup) {
                members.forEach((member) => {
                    const playerId = Number(member?.player_id);
                    if (!Number.isFinite(playerId)) return;

                    const actorKey = `pc_${playerId}`;
                    const isSelf = String(playerId) === currentPlayerId;
                    const isLeader = Boolean(member?.is_leader);
                    const sectorId = Number(member?.sector_id);

                    membersByKey[actorKey] = {
                        player_id: playerId,
                        name: String(member?.name || ""),
                        is_leader: isLeader,
                        sector_id: Number.isFinite(sectorId) ? sectorId : null,
                        sector_name: member?.sector_name || null,
                    };

                    if (!isSelf) {
                        memberKeys.add(actorKey);
                        if (isLeader) {
                            leaderKeys.add(actorKey);
                        }
                    }
                });
            }

            window.groupStateSnapshot = snapshot;
            window.groupStateSnapshotReady = true;
            window.groupMembersByKey = membersByKey;
            window.groupMemberActorKeys = memberKeys;
            window.groupLeaderActorKeys = leaderKeys;

            const snapshotGroupId = Number(snapshot?.group?.id ?? snapshot?.group_id ?? 0);
            const normalizedGroupId = Number.isFinite(snapshotGroupId) && snapshotGroupId > 0
                ? snapshotGroupId
                : null;
            if (window.currentPlayer && typeof window.currentPlayer === "object") {
                window.currentPlayer.group_id = normalizedGroupId;
                if (window.currentPlayer.user && typeof window.currentPlayer.user === "object") {
                    window.currentPlayer.user.group_id = normalizedGroupId;
                }
                if (window.currentPlayer.player && typeof window.currentPlayer.player === "object") {
                    window.currentPlayer.player.group_id = normalizedGroupId;
                }
            }
            if (window.GameState?.player?.currentPlayer && typeof window.GameState.player.currentPlayer === "object") {
                window.GameState.player.currentPlayer.group_id = normalizedGroupId;
                if (
                    window.GameState.player.currentPlayer.user &&
                    typeof window.GameState.player.currentPlayer.user === "object"
                ) {
                    window.GameState.player.currentPlayer.user.group_id = normalizedGroupId;
                }
                if (
                    window.GameState.player.currentPlayer.player &&
                    typeof window.GameState.player.currentPlayer.player === "object"
                ) {
                    window.GameState.player.currentPlayer.player.group_id = normalizedGroupId;
                }
            }

            window.canvasEngine?.renderer?.requestRedraw?.();
        };

        window.isGroupMemberTarget = function (targetKey) {
            if (!targetKey) return false;
            return window.groupMemberActorKeys?.has?.(String(targetKey)) === true;
        };

        window.isGroupLeaderTarget = function (targetKey) {
            if (!targetKey) return false;
            return window.groupLeaderActorKeys?.has?.(String(targetKey)) === true;
        };

        window.getGroupMemberInfo = function (targetKey) {
            if (!targetKey) return null;
            return window.groupMembersByKey?.[String(targetKey)] || null;
        };

        window.isPermanentGroupScan = function (targetKey) {
            return window.isGroupMemberTarget?.(targetKey) === true;
        };

        if (window.__pendingGroupStateSnapshot) {
            window.applyGroupStateSnapshot(window.__pendingGroupStateSnapshot);
            delete window.__pendingGroupStateSnapshot;
        }
        // ===============================
        // Timed effects (foundation)
        // ===============================
        window.startCountdownTimer = startCountdownTimer;
        window.activeEffects = window.GameState.effects.active;

        window.registerEffect = function (effectType, key, payload) {
            if (!window.activeEffects?.[effectType]) return;
            window.activeEffects[effectType].set(key, payload);
        };

        window.unregisterEffect = function (effectType, key) {
            
            if (!effectType || !key) return;

            if (!window.activeEffects?.[effectType]) return;
            window.activeEffects[effectType].delete(key);
            
            // 🔥 RECYCLAGE MODAL ICI
            window.refreshModalIfOpen?.(key);
        };

        window.hasEffect = function (effectType, key) {
            return window.activeEffects?.[effectType]?.has(key) === true;
        };

        window.getEffect = function (effectType, key) {
            return window.activeEffects?.[effectType]?.get(key) || null;
        };

        window.isScanned = function (targetKey) {
            if (window.isPermanentGroupScan?.(targetKey) === true) { return true; }
            if (window.scanExpiredLocal?.has(targetKey)) { return false; }
            return (
                window.activeEffects?.scan?.has(targetKey) === true ||
                window.activeEffects?.share_scan?.has(targetKey) === true ||
                window.sharedTargets?.has(targetKey) === true   // legacy
            );
        };

        window.isTargetInSonarRange = function (targetKey) {
            try {
                const engine = window.canvasEngine;
                if (!engine?.map || !engine?.renderer) return false;

                const actor = engine.map.findActorByKey?.(targetKey);
                if (!actor) return false;

                // sonar moderne
                if (engine.renderer.sonar?.isVisible) {
                    return engine.renderer.sonar.isVisible(actor);
                }

                // fallback : visible_zone backend (comme main_engine.js)
                const me = engine.map.findPlayerById?.(window.current_player_id);
                if (!me) return false;

                const key = `${actor.x}_${actor.y}`;
                return (me.data?.ship?.visible_zone || []).includes(key);

            } catch (e) {
                return false;
            }
        };

        window.hasDirectScan = function (targetKey) {
            return window.activeEffects?.scan?.has(targetKey) === true;
        };

        window.hasSharedScan = function (targetKey) {
            return window.activeEffects?.share_scan?.has(targetKey) === true;
        };

        /**
         * Retourne les métadonnées de scan (priorité à activeEffects)
         * { expires_at, data? } | null
         */
        window.getScanMeta = function (targetKey) {
            if (window.activeEffects?.scan?.has(targetKey)) {
                return window.activeEffects.scan.get(targetKey);
            }
            // fallback legacy
            if (window.scannedMeta?.[targetKey]) {
                return window.scannedMeta[targetKey];
            }
            return null;
        };

        /**
         * Helper de purge scan (appelé UNIQUEMENT depuis WS effects_invalidated)
         */
        window.clearScan = function (targetKey) {
            
            // canonique
            window.activeEffects?.scan?.delete(targetKey);
            window.activeEffects?.share_scan?.delete(targetKey);

            // legacy (temporaire)
            window.scannedTargets?.delete(targetKey);
            window.sharedTargets?.delete(targetKey);

            delete window.scannedMeta?.[targetKey];
            delete window.scannedModalData?.[targetKey];
        };

        window.effectVisualTimers ??= new Map();
        window.scheduleEffectVisualExpire = function (effect, targetKey, expiresAt) {
            const key = `${effect}:${targetKey}`;
            const expiresAtMs = new Date(expiresAt).getTime();
            if (!Number.isFinite(expiresAtMs)) {
                return;
            }

            // Nettoyer un ancien timer si présent
            if (window.effectVisualTimers.has(key)) {
                clearTimeout(window.effectVisualTimers.get(key));
            }

            const delay = Math.max(0, expiresAtMs - Date.now());

            const timeoutId = setTimeout(() => {
                if (effect === "scan" || effect === "share_scan") {

                    // supprimer l'effet actif (important)
                    window.clearScan?.(targetKey);
                    window.activeEffects?.scan?.delete(targetKey);
                    window.activeEffects?.share_scan?.delete(targetKey);

                    // Marquer expiré localement
                    window.scanExpiredLocal.add(targetKey);

                    window.canvasEngine?.renderer?.requestRedraw();
                    window.renderTextAboveTarget(targetKey, "- scan", "rgba(231, 0, 11, 0.95)", "scan");

                    // Refresh modal si ouvert (normal ou unknown)
                    window.refreshModalAfterScan?.(targetKey);

                    window.dispatchEvent(new CustomEvent("scan:expired", {
                        detail: { targetKey }
                    }));
                }

                window.effectVisualTimers.delete(key);
            }, delay);

            window.effectVisualTimers.set(key, timeoutId);
        };

        window.renderTextAboveTarget = function(targetKey, text, color = "rgba(0,255,180,0.95)", icon = null, options = {}) {
            const engine = window.canvasEngine;
            if (!engine || !engine.map || !engine.renderer) return;

            const actor = engine.map.findActorByKey(targetKey);
            if (!actor) return;

            const sizeX = actor.sizeX || actor.data?.ship?.sizeX || 1;
            const sizeY = actor.sizeY || actor.data?.ship?.sizeY || 1;

            const worldX = (actor.renderX ?? actor.x) + sizeX / 2;
            const worldY = (actor.renderY ?? actor.y) + sizeY / 2;

            engine.renderer.addFloatingMessage({
                text,
                icon: icon,
                worldX,
                worldY,
                sizeX,
                sizeY,
                duration: 2000,
                color: color,
                placement: options?.placement || "side",
                offsetYPx: options?.offsetYPx || 0
            });
        }

        window.refreshModalIfOpen = function (targetKey) {

            if (!targetKey) return;
            // Pendant une ActionScene, on bloque les refresh auto (sinon conflits/overlay)
            if (window.ActionSceneManager?.isActive?.()) return;

            // modal normal
            const modal = document.getElementById(`modal-${targetKey}`);
            if (!modal) return;

            // Si la cible a disparu de la map (ex: destruction -> wreck), on ne tente pas
            // de refetch l'ancien modal pc_/npc_ (sinon HTTP 400).
            if ((String(targetKey).startsWith("pc_") || String(targetKey).startsWith("npc_"))) {
                const actorStillExists = window.canvasEngine?.map?.findActorByKey?.(targetKey);
                if (!actorStillExists) return;
            }

            // Empêche toute boucle
            if (modal.dataset._refreshing === "1") return;
            modal.dataset._refreshing = "1";

            // Ferme puis rouvre au prochain tick
            setTimeout(() => {
                try {
                    const modalId = `modal-${targetKey}`;
                    window.open_close_modal?.(modalId);
                    window.open_close_modal?.(modalId);
                } finally {
                    // Nettoyage sécurité
                    setTimeout(() => {
                        const m = document.getElementById(`modal-${targetKey}`);
                        if (m) delete m.dataset._refreshing;
                    }, 0);
                }
            }, 0);
        };

        return true;
    } catch (e) {
        console.error('initGlobals failed', e);
        return false;
    }
}

/**
 * Démarre un timer de compte à rebours dans un élément DOM.
 **/
export function startCountdownTimer(container, options = {}) {
    if (!container?.dataset?.expiresAt) return;

    const {
        onExpire = null,
        showExpired = true
    } = options;

    const label = container.querySelector(".countdown-label");
    if (!label) return;

    const expiresAt = new Date(container.dataset.expiresAt).getTime();
    if (Number.isNaN(expiresAt)) return;

    let timer = null

    function update() {
        const now = Date.now();
        const diff = Math.max(0, expiresAt - now);
        // if timer goes to 0.
        if (diff <= 0) {
            // Affichage UI uniquement
            label.textContent = "00:00:00";

            // Empêcher tout re-trigger
            clearInterval(timer);

            // Signal purement visuel (optionnel)
            if (typeof onExpire === "function") {
                onExpire();
            }
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        label.textContent =
            `${String(h).padStart(2, "0")}:` +
            `${String(m).padStart(2, "0")}:` +
            `${String(s).padStart(2, "0")}`;
    }

    update();
    timer = setInterval(update, 1000);

    // sécurité : cleanup si le node disparaît
    const observer = new MutationObserver(() => {
        if (!document.body.contains(container)) {
            clearInterval(timer);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

