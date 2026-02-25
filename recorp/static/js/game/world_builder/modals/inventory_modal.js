const INVENTORY_MODAL_ID = "inventory-modal";
const INVENTORY_TOOLTIP_ID = "inventory-module-tooltip";

let inventoryTooltipEl = null;
let inventoryStatusIntervalId = null;
let inventoryFeedbackTimeoutId = null;
let inventoryModalMutationObserver = null;
let moduleReconfigSweepPingTs = 0;

function t(text) {
    if (typeof gettext === "function") return gettext(text);
    return text;
}

function normalizeModuleTypeKey(moduleType) {
    return String(moduleType || "").toUpperCase();
}

function getModuleLimitBucket(moduleType) {
    const normalized = normalizeModuleTypeKey(moduleType);
    if (normalized.startsWith("DEFENSE_")) return "DEFENSE";
    return normalized;
}

function getCurrentPlayerData() {
    return window.GameState?.player?.currentPlayer ?? window.currentPlayer ?? null;
}

function getCurrentShipData() {
    return getCurrentPlayerData()?.ship ?? null;
}

function getInventoryModalRoot() {
    return document.getElementById(INVENTORY_MODAL_ID);
}

function isDesktopPointerMode() {
    return Boolean(window.matchMedia?.("(pointer: fine)")?.matches && window.innerWidth >= 1024);
}

function ensureTooltipElement() {
    if (inventoryTooltipEl && document.body?.contains(inventoryTooltipEl)) return inventoryTooltipEl;

    const existing = document.getElementById(INVENTORY_TOOLTIP_ID);
    if (existing) {
        inventoryTooltipEl = existing;
        return inventoryTooltipEl;
    }

    if (!document.body) return null;

    const tooltip = document.createElement("div");
    tooltip.id = INVENTORY_TOOLTIP_ID;
    tooltip.className = "module-tooltip";
    document.body.appendChild(tooltip);
    inventoryTooltipEl = tooltip;
    return inventoryTooltipEl;
}

function formatModuleTypeLabel(moduleType) {
    const normalized = normalizeModuleTypeKey(moduleType);
    if (!normalized) return t("Unknown");
    return t(normalized.replace(/_/g, " "));
}

function findModuleTypeContainer(moduleType) {
    const root = getInventoryModalRoot();
    if (!root) return null;

    const normalized = normalizeModuleTypeKey(moduleType);
    if (!normalized) return null;
    return root.querySelector(`#module-type-${normalized}`);
}

function findModuleCategoryFieldset(moduleType) {
    const root = getInventoryModalRoot();
    if (!root) return null;

    const normalized = normalizeModuleTypeKey(moduleType);
    if (!normalized) return null;

    return root.querySelector(`.equipped-module-group[data-module-category="${normalized}"]`);
}

function clearEquipTargetHighlights() {
    const root = getInventoryModalRoot();
    if (!root) return;
    root.querySelectorAll(".equipped-module-group.equip-target-highlight").forEach((el) => {
        el.classList.remove("equip-target-highlight");
    });
}

function highlightEquipTargetCategory(moduleType) {
    clearEquipTargetHighlights();
    const fieldset = findModuleCategoryFieldset(moduleType);
    if (fieldset) fieldset.classList.add("equip-target-highlight");
}

function buildEquippedModuleCounters(modules = []) {
    const counts = {};
    modules.forEach((module) => {
        const bucket = getModuleLimitBucket(module?.type);
        if (!bucket) return;
        counts[bucket] = (counts[bucket] || 0) + 1;
    });
    return counts;
}

function buildNormalizedModuleLimits(rawLimits = {}) {
    const normalized = {};
    Object.entries(rawLimits || {}).forEach(([typeKey, limitValue]) => {
        const bucket = getModuleLimitBucket(typeKey);
        if (!bucket) return;
        if (typeof limitValue !== "number" && limitValue !== null) return;
        if (!Object.prototype.hasOwnProperty.call(normalized, bucket) || normalized[bucket] == null) {
            normalized[bucket] = limitValue;
            return;
        }
        if (typeof limitValue === "number" && typeof normalized[bucket] === "number") {
            normalized[bucket] = Math.max(normalized[bucket], limitValue);
        }
    });
    return normalized;
}

function updateEquippedModuleCountBadges(modules = [], rawLimits = {}) {
    const root = getInventoryModalRoot();
    if (!root) return;

    const counts = buildEquippedModuleCounters(modules);
    const normalizedLimits = buildNormalizedModuleLimits(rawLimits);

    root.querySelectorAll("[data-module-count-for]").forEach((badge) => {
        const rawCategory = badge.dataset.moduleCountFor;
        const bucket = getModuleLimitBucket(rawCategory);
        const equippedCount = counts[bucket] || 0;
        const maxCount = Object.prototype.hasOwnProperty.call(normalizedLimits, bucket)
            ? normalizedLimits[bucket]
            : null;

        const maxText = typeof maxCount === "number" ? String(maxCount) : "-";
        badge.textContent = `${equippedCount} / ${maxText}`;

        badge.classList.remove("is-ok", "is-full", "is-over", "is-unknown");
        if (typeof maxCount !== "number") {
            badge.classList.add("is-unknown");
        } else if (equippedCount > maxCount) {
            badge.classList.add("is-over");
        } else if (equippedCount === maxCount && maxCount > 0) {
            badge.classList.add("is-full");
        } else {
            badge.classList.add("is-ok");
        }
    });
}

function updateEquippedModulesTotalBadge(ship) {
    const root = getInventoryModalRoot();
    if (!root) return;

    const badge = root.querySelector("#equipped-modules-total-count");
    if (!badge) return;

    const modules = Array.isArray(ship?.modules) ? ship.modules : [];
    const equippedCount = modules.length;
    const maxCountRaw = ship?.module_slot_available ?? ship?.module_slot_already_in_use ?? null;
    const maxCount = (typeof maxCountRaw === "number" || typeof maxCountRaw === "string")
        ? Number(maxCountRaw)
        : null;

    const maxText = Number.isFinite(maxCount) ? String(maxCount) : "-";
    badge.textContent = `${equippedCount} / ${maxText}`;

    badge.classList.remove("is-ok", "is-full", "is-over", "is-unknown");
    if (!Number.isFinite(maxCount)) {
        badge.classList.add("is-unknown");
    } else if (equippedCount > maxCount) {
        badge.classList.add("is-over");
    } else if (equippedCount === maxCount && maxCount > 0) {
        badge.classList.add("is-full");
    } else {
        badge.classList.add("is-ok");
    }
}

function createEmptySlotNode() {
    const empty = document.createElement("div");
    empty.className = "text-gray-500 text-[10px] italic pl-1 empty-slot equipped-empty-slot";
    empty.textContent = t("Empty slot");
    return empty;
}

function resetEquippedModuleLists() {
    const root = getInventoryModalRoot();
    if (!root) return;

    root.querySelectorAll(".equipped-module-list").forEach((list) => {
        list.innerHTML = "";
        list.appendChild(createEmptySlotNode());
    });
}

function removeEmptySlotPlaceholder(container) {
    container?.querySelector(".empty-slot")?.remove();
}

function getModuleActionWs() {
    return window.canvasEngine?.ws || window.ws || null;
}

function sendShipModuleReconfiguration(payload) {
    const ws = getModuleActionWs();
    if (!ws || typeof ws.send !== "function") {
        window.InventoryModalController?.showActionMessage?.(t("WebSocket unavailable."), "error");
        return false;
    }

    ws.send({
        type: "action_ship_module_reconfigure",
        payload,
    });
    return true;
}

function getRemainingSecondsFromIso(isoDateString) {
    if (!isoDateString) return null;
    const targetMs = Date.parse(isoDateString);
    if (!Number.isFinite(targetMs)) return null;
    return Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
}

function getEquipmentLockRemainingSeconds(ship) {
    if (!ship?.equipment_blocked_until) return 0;
    return getRemainingSecondsFromIso(ship.equipment_blocked_until) ?? 0;
}

function isUiEquipmentActionBlocked(ship) {
    if (!ship) return false;
    if (ship.module_reconfiguration) return true;
    return getEquipmentLockRemainingSeconds(ship) > 0;
}

function getUiEquipmentBlockMessage(ship) {
    if (ship?.module_reconfiguration) {
        return t("A module reconfiguration is already in progress.");
    }
    const remaining = getEquipmentLockRemainingSeconds(ship);
    if (remaining > 0) {
        return `${t("Equipment locked after combat")}: ${remaining}s`;
    }
    return null;
}

function clearInventoryStatusInterval() {
    if (inventoryStatusIntervalId) {
        clearInterval(inventoryStatusIntervalId);
        inventoryStatusIntervalId = null;
    }
}

function refreshReconfigurationStatusBanner() {
    const ship = getCurrentShipData();
    const statusEl = document.getElementById("inventory-reconfig-status");
    if (!statusEl) {
        clearInventoryStatusInterval();
        return;
    }

    statusEl.classList.remove("hidden", "is-pending", "is-lock");

    const reconfig = ship?.module_reconfiguration || null;
    if (reconfig) {
        const remainingFromExecuteAt = getRemainingSecondsFromIso(reconfig.execute_at);
        const fallbackRemaining = Number.isFinite(Number(reconfig.remaining_seconds))
            ? Math.max(0, Number(reconfig.remaining_seconds))
            : 0;
        const remaining = remainingFromExecuteAt ?? fallbackRemaining;
        const actionVerb = reconfig.action_type === "UNEQUIP" ? t("Unequip in progress") : t("Equip in progress");
        const moduleName = reconfig.module_name ? `: ${reconfig.module_name}` : "";
        statusEl.textContent = `${actionVerb}${moduleName} (${remaining}s)`;
        statusEl.classList.add("is-pending");
        return;
    }

    const combatLockRemaining = getEquipmentLockRemainingSeconds(ship);
    if (combatLockRemaining > 0) {
        statusEl.textContent = `${t("Equipment locked after combat")}: ${combatLockRemaining}s`;
        statusEl.classList.add("is-lock");
        return;
    }

    statusEl.classList.add("hidden");
}

function maybePingForModuleReconfigCompletion(ship) {
    const reconfig = ship?.module_reconfiguration;
    if (!reconfig) return;

    const remaining = getRemainingSecondsFromIso(reconfig.execute_at);
    // Pinge seulement à l'approche de l'échéance (ou si la date est invalide)
    if (remaining != null && remaining > 1) return;

    const now = Date.now();
    if (now - moduleReconfigSweepPingTs < 900) return;

    const ws = getModuleActionWs();
    if (!ws || typeof ws.send !== "function") return;

    moduleReconfigSweepPingTs = now;
    ws.send({
        type: "ping",
        payload: {
            source: "inventory_module_reconfig",
            ts: now,
        },
    });
}

function startInventoryStatusTickerIfNeeded() {
    clearInventoryStatusInterval();
    refreshReconfigurationStatusBanner();

    const ship = getCurrentShipData();
    if (!ship) return;

    const needsTicker = Boolean(ship.module_reconfiguration) || getEquipmentLockRemainingSeconds(ship) > 0;
    if (!needsTicker) return;

    maybePingForModuleReconfigCompletion(ship);

    inventoryStatusIntervalId = window.setInterval(() => {
        refreshReconfigurationStatusBanner();
        const currentShip = getCurrentShipData();
        maybePingForModuleReconfigCompletion(currentShip);
        if (!currentShip?.module_reconfiguration && getEquipmentLockRemainingSeconds(currentShip) <= 0) {
            clearInventoryStatusInterval();
        }
    }, 1000);
}

function updateInventoryCapacityUi(ship) {
    const capacityTextEl = document.getElementById("inventory-capacity-text");
    const overCapacityEl = document.getElementById("inventory-overcapacity-warning");
    if (!capacityTextEl || !overCapacityEl) return;

    const load = Number(ship?.cargo_load_current ?? 0);
    const capacity = Number(ship?.cargo_capacity ?? ship?.current_cargo_size ?? 0);
    const isOver = Boolean(ship?.cargo_over_capacity) || (Number.isFinite(load) && Number.isFinite(capacity) && load > capacity);

    capacityTextEl.textContent = `${load} / ${capacity}`;
    capacityTextEl.classList.toggle("is-over", isOver);

    if (isOver) {
        overCapacityEl.textContent = t("Over capacity: movement and warp are disabled until cargo is reduced.");
        overCapacityEl.classList.remove("hidden");
    } else {
        overCapacityEl.classList.add("hidden");
        overCapacityEl.textContent = "";
    }
}

function showInventoryActionMessage(text, kind = "info") {
    const feedbackEl = document.getElementById("inventory-action-feedback");
    if (!feedbackEl) return;

    if (inventoryFeedbackTimeoutId) {
        clearTimeout(inventoryFeedbackTimeoutId);
        inventoryFeedbackTimeoutId = null;
    }

    const trimmed = String(text || "").trim();
    if (!trimmed) {
        feedbackEl.classList.add("hidden");
        feedbackEl.textContent = "";
        feedbackEl.classList.remove("is-error", "is-success", "is-info");
        return;
    }

    feedbackEl.textContent = trimmed;
    feedbackEl.classList.remove("hidden", "is-error", "is-success", "is-info");
    feedbackEl.classList.add(
        kind === "error" ? "is-error" : kind === "success" ? "is-success" : "is-info"
    );

    const timeout = kind === "error" ? 8000 : 5000;
    inventoryFeedbackTimeoutId = window.setTimeout(() => {
        feedbackEl.classList.add("hidden");
    }, timeout);
}

function positionTooltip(tooltip, event) {
    if (!tooltip || !event) return;
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
}

function hideTooltip() {
    const tooltip = ensureTooltipElement();
    if (!tooltip) return;
    tooltip.classList.remove("visible");
}

function attachModuleTooltipAndMobileExpand(moduleItem, module, options = {}) {
    const {
        desktopEnabled = true,
        mobileExpand = true,
        onHoverEnter = null,
        onHoverLeave = null,
    } = options;

    const desktopMode = isDesktopPointerMode();
    const tooltip = desktopMode && desktopEnabled ? ensureTooltipElement() : null;

    if (desktopMode) {
        moduleItem.addEventListener("mouseenter", (event) => {
            onHoverEnter?.();
            if (!tooltip) return;
            tooltip.innerHTML = createFormatedLabel(module);
            positionTooltip(tooltip, event);
            tooltip.classList.add("visible");
        });
        moduleItem.addEventListener("mousemove", (event) => {
            positionTooltip(tooltip, event);
        });
        moduleItem.addEventListener("mouseleave", () => {
            hideTooltip();
            onHoverLeave?.();
        });
        return;
    }

    if (!mobileExpand) return;

    moduleItem.addEventListener("click", () => {
        onHoverEnter?.();

        const existing = moduleItem.nextElementSibling;
        if (existing && existing.classList.contains("module-expanded")) {
            existing.remove();
            onHoverLeave?.();
            return;
        }

        const expanded = document.createElement("div");
        expanded.className = [
            "module-expanded",
            "mt-1",
            "bg-emerald-900/30",
            "border",
            "border-emerald-700/30",
            "text-emerald-200",
            "text-xs",
            "rounded",
            "p-2",
            "shadow-inner",
        ].join(" ");
        expanded.innerHTML = createFormatedLabel(module);
        moduleItem.insertAdjacentElement("afterend", expanded);
    });
}

function createBaseModuleItemElement(module) {
    const moduleItem = document.createElement("div");
    moduleItem.className = [
        "module-item",
        "flex",
        "justify-between",
        "items-center",
        "bg-gradient-to-r",
        "from-gray-900/70",
        "to-emerald-950/40",
        "border",
        "border-emerald-700/30",
        "rounded-md",
        "px-2",
        "py-[3px]",
        "shadow-inner",
        "shadow-emerald-900/30",
        "hover:bg-emerald-900/20",
        "hover:border-emerald-400/50",
        "cursor-pointer",
        "select-none",
        "transition-all",
        "duration-200",
        "gap-2",
    ].join(" ");
    moduleItem.dataset.moduleName = module?.name || "";
    moduleItem.dataset.moduleType = formatModuleTypeLabel(module?.type);
    moduleItem.dataset.moduleEffects = JSON.stringify(module?.effect || {});
    return moduleItem;
}

function createActionButton(iconClass, title, variant = "neutral") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `inventory-action-btn ${variant}`;
    button.title = title;
    button.setAttribute("aria-label", title);

    const icon = document.createElement("i");
    icon.className = iconClass;
    button.appendChild(icon);
    return button;
}

function requestUnequipModule(event, module) {
    event?.stopPropagation?.();

    const ship = getCurrentShipData();
    if (isUiEquipmentActionBlocked(ship)) {
        showInventoryActionMessage(getUiEquipmentBlockMessage(ship) || t("Action unavailable."), "error");
        return;
    }

    const equippedEntryId = module?.equipped_id;
    if (!equippedEntryId) {
        showInventoryActionMessage(t("This equipped module cannot be unequipped right now."), "error");
        return;
    }

    const confirmed = window.confirm(`${t("Are you sure you want to unequip")} ${module.name}?`);
    if (!confirmed) return;

    if (sendShipModuleReconfiguration({ operation: "UNEQUIP", equipped_entry_id: equippedEntryId })) {
        showInventoryActionMessage(t("Unequip request sent."), "info");
    }
}

function requestEquipModule(event, module) {
    event?.stopPropagation?.();

    const ship = getCurrentShipData();
    if (isUiEquipmentActionBlocked(ship)) {
        showInventoryActionMessage(getUiEquipmentBlockMessage(ship) || t("Action unavailable."), "error");
        return;
    }

    const inventoryModuleId = module?.inventory_module_id;
    if (!inventoryModuleId) {
        showInventoryActionMessage(t("This inventory module cannot be equipped right now."), "error");
        return;
    }

    const confirmed = window.confirm(`${t("Are you sure you want to equip")} ${module.name}?`);
    if (!confirmed) return;

    if (sendShipModuleReconfiguration({ operation: "EQUIP", inventory_module_id: inventoryModuleId })) {
        showInventoryActionMessage(t("Equip request sent."), "info");
    }
}

function renderEquippedModules(ship) {
    const modules = Array.isArray(ship?.modules) ? ship.modules : [];
    const moduleTypeLimits = ship?.module_type_limits || {};
    const actionsDisabled = isUiEquipmentActionBlocked(ship);

    resetEquippedModuleLists();

    modules.forEach((module) => {
        const targetContainer = findModuleTypeContainer(module?.type);
        if (!targetContainer) return;

        const wrapper = document.createElement("div");
        wrapper.className = "flex flex-col w-full";

        const moduleItem = createBaseModuleItemElement(module);

        const moduleSpan = document.createElement("span");
        moduleSpan.className = "text-emerald-300 font-semibold text-sm truncate tracking-wide";
        moduleSpan.textContent = module?.name || t("Unknown module");

        const button = createActionButton("fa-solid fa-xmark text-[12px]", t("Unequip module"), "danger");
        button.disabled = actionsDisabled;
        button.addEventListener("click", (event) => requestUnequipModule(event, module));

        moduleItem.append(moduleSpan, button);
        attachModuleTooltipAndMobileExpand(moduleItem, module, { desktopEnabled: true, mobileExpand: true });

        wrapper.appendChild(moduleItem);
        targetContainer.appendChild(wrapper);
        removeEmptySlotPlaceholder(targetContainer);
    });

    updateEquippedModuleCountBadges(modules, moduleTypeLimits);
    updateEquippedModulesTotalBadge(ship);
}

function createInventoryModuleRow(module, actionsDisabled) {
    const row = document.createElement("div");
    row.className = [
        "inventory-item",
        "inventory-module-row",
        "col-span-2",
        "sm:col-span-2",
        "lg:col-span-1",
        "flex",
        "justify-between",
        "items-center",
        "gap-2",
        "border",
        "border-emerald-800/30",
        "rounded-md",
        "px-2",
        "py-2",
        "bg-gray-900/55",
        "hover:bg-gray-900/75",
        "transition-all",
    ].join(" ");

    const left = document.createElement("div");
    left.className = "min-w-0 flex-1";

    const title = document.createElement("div");
    title.className = "flex items-center gap-2 min-w-0";

    const nameEl = document.createElement("span");
    nameEl.className = "text-emerald-300 font-bold text-xs truncate";
    nameEl.textContent = module?.name || t("Unknown module");

    const typeBadge = document.createElement("span");
    typeBadge.className = "inventory-module-type-badge";
    typeBadge.textContent = formatModuleTypeLabel(module?.type);

    title.append(nameEl, typeBadge);

    if (module?.tier != null) {
        const meta = document.createElement("div");
        meta.className = "text-[10px] text-emerald-100/70 mt-[2px] tracking-wide";
        meta.textContent = `${t("Tier")} ${module.tier}`;
        left.append(title, meta);
    } else {
        left.appendChild(title);
    }

    const right = document.createElement("div");
    right.className = "flex items-center gap-2 shrink-0";

    const qty = document.createElement("span");
    qty.className = "text-emerald-200 text-xs font-semibold";
    qty.textContent = "x1";

    const equipBtn = createActionButton("fa-solid fa-plus text-[12px]", t("Equip module"), "success");
    equipBtn.disabled = actionsDisabled;
    equipBtn.addEventListener("click", (event) => requestEquipModule(event, module));

    right.append(qty, equipBtn);
    row.append(left, right);

    attachModuleTooltipAndMobileExpand(row, module, {
        desktopEnabled: true,
        mobileExpand: true,
        onHoverEnter: () => highlightEquipTargetCategory(module?.type),
        onHoverLeave: () => clearEquipTargetHighlights(),
    });

    row.addEventListener("focusin", () => highlightEquipTargetCategory(module?.type));
    row.addEventListener("focusout", () => clearEquipTargetHighlights());

    return row;
}

function renderInventoryModuleSection(ship) {
    const container = document.getElementById("inventory-list");
    if (!container) return;

    const inventoryModules = Array.isArray(ship?.inventory_modules) ? ship.inventory_modules : [];
    const actionsDisabled = isUiEquipmentActionBlocked(ship);

    container.innerHTML = "";

    if (inventoryModules.length === 0) {
        const empty = document.createElement("div");
        empty.className = "col-span-2 sm:col-span-2 lg:col-span-1 text-xs text-gray-400 italic border border-emerald-900/20 rounded-md p-2 bg-black/20";
        empty.textContent = t("No modules stored in cargo.");
        container.appendChild(empty);
        return;
    }

    inventoryModules.forEach((module) => {
        container.appendChild(createInventoryModuleRow(module, actionsDisabled));
    });
}

function renderInventoryModal(playerData = getCurrentPlayerData()) {
    const root = getInventoryModalRoot();
    if (!root) return;

    const ship = playerData?.ship || null;
    if (!ship) {
        resetEquippedModuleLists();
        updateEquippedModuleCountBadges([], {});
        updateEquippedModulesTotalBadge(null);
        renderInventoryModuleSection({ inventory_modules: [] });
        updateInventoryCapacityUi(null);
        clearEquipTargetHighlights();
        startInventoryStatusTickerIfNeeded();
        return;
    }

    renderEquippedModules(ship);
    renderInventoryModuleSection(ship);
    updateInventoryCapacityUi(ship);
    clearEquipTargetHighlights();
    startInventoryStatusTickerIfNeeded();
}

function applyServerState(payload = {}) {
    const data = payload?.data;
    if (data && typeof data === "object") {
        window.currentPlayer = data;
        if (window.GameState?.player) {
            window.GameState.player.currentPlayer = data;
        }
    }

    const context = String(payload?.context || "");
    if (context === "MODULE_RECONFIG_STARTED") {
        moduleReconfigSweepPingTs = 0;
        showInventoryActionMessage(t("Module reconfiguration started (10s)."), "info");
    } else if (context === "MODULE_RECONFIG_COMPLETED") {
        moduleReconfigSweepPingTs = 0;
        showInventoryActionMessage(t("Module reconfiguration completed."), "success");
    }

    renderInventoryModal(data || getCurrentPlayerData());
}

function handleInventoryModalVisibilityChanges() {
    const root = getInventoryModalRoot();
    if (!root || inventoryModalMutationObserver) return;

    inventoryModalMutationObserver = new MutationObserver(() => {
        if (!root.classList.contains("hidden")) {
            renderInventoryModal();
        }
    });

    inventoryModalMutationObserver.observe(root, {
        attributes: true,
        attributeFilter: ["class"],
    });
}

function initInventoryModalController() {
    window.InventoryModalController = {
        render: renderInventoryModal,
        applyServerState,
        showActionMessage: showInventoryActionMessage,
    };

    handleInventoryModalVisibilityChanges();
    renderInventoryModal();

    window.addEventListener("resize", () => {
        hideTooltip();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initInventoryModalController();
});

function createFormatedLabel(moduleObject) {
    const moduleName = moduleObject?.name || t("Unknown module");
    let moduleType = normalizeModuleTypeKey(moduleObject?.type);

    const moduleTooltipUl = document.createElement("ul");
    const moduleTooltipName = document.createElement("span");

    moduleTooltipUl.className = [
        "flex",
        "flex-col",
        "gap-1",
        "font-bold",
        "text-xs",
        "bg-gray-900/95",
        "border",
        "border-emerald-700/40",
        "rounded-md",
        "text-emerald-200",
        "shadow-lg",
        "shadow-black/60",
        "p-2",
        "backdrop-blur-sm",
    ].join(" ");
    moduleTooltipName.className = "font-bold text-emerald-300 text-sm";
    moduleTooltipName.textContent = moduleName;
    moduleTooltipUl.append(moduleTooltipName);

    const effect = moduleObject?.effect || {};
    let moduleLi;

    switch (moduleType) {
        case "PROBE":
            if (effect.range != null) {
                moduleLi = styledLine(`${effect.label || "Range"}:`, `${effect.range}`);
            } else {
                moduleLi = styledLine(effect.label || "Probe module");
            }
            moduleTooltipUl.append(moduleLi);
            break;

        case "DEFENSE_BALLISTIC":
        case "DEFENSE_THERMAL":
        case "DEFENSE_MISSILE":
            moduleLi = styledLine(`${effect.label || "Defense"}:`, `+${effect.defense ?? 0}`);
            moduleTooltipUl.append(moduleLi);
            break;

        case "HOLD":
            moduleLi = styledLine(`${effect.label || "Cargo"}:`, `+${effect.capacity ?? 0}`);
            moduleTooltipUl.append(moduleLi);
            break;

        case "MOVEMENT":
            moduleLi = styledLine(`${effect.label || "Movement"}:`, `+${effect.movement ?? 0}`);
            moduleTooltipUl.append(moduleLi);
            break;

        case "HULL":
            moduleLi = styledLine(`${effect.label || "Hull"}:`, `+${effect.hp ?? 0}`);
            moduleTooltipUl.append(moduleLi);
            break;

        case "REPAIRE":
            moduleLi = styledLine(`${effect.label || "Repair"}:`, `${effect.repair_shield ?? 0} hull points`);
            moduleTooltipUl.append(moduleLi);
            break;

        case "GATHERING":
            if ("can_scavenge" in effect) {
                moduleLi = styledLine(`${effect.label || "Scavenge"}`, "yes");
            } else if ("display_mineral_data" in effect) {
                moduleLi = styledLine(`${effect.label || "Mineral data"}`);
            } else {
                moduleLi = styledLine(`${effect.label || "Gathering"}:`, `+${effect.gathering_amount ?? 0}`);
            }
            moduleTooltipUl.append(moduleLi);
            break;

        case "RESEARCH":
            moduleLi = styledLine(`${effect.label || "Research"}:`, `-${effect.research_time_discrease ?? 0}%`);
            moduleTooltipUl.append(moduleLi);
            break;

        case "CRAFT":
            moduleLi = styledLine(`${effect.label || "Craft"}:`, `${effect.crafting_tier_allowed ?? "-"}`);
            moduleTooltipUl.append(moduleLi);
            break;

        case "ELECTRONIC_WARFARE":
            if ("aiming_discrease" in effect) {
                moduleLi = styledLine(`${effect.label || "Electronic warfare"}:`, `-${effect.aiming_discrease}%`);
            } else if ("movement_discrease" in effect) {
                moduleLi = styledLine(`${effect.label || "Electronic warfare"}:`, `-${effect.movement_discrease}%`);
            } else if ("display_ship_data" in effect) {
                moduleLi = styledLine(`${effect.label || "Ship data display"}`);
            }
            if (moduleLi) moduleTooltipUl.append(moduleLi);
            break;

        case "WEAPONRY":
            if ("aiming_increase" in effect) {
                moduleLi = styledLine(`${effect.label || "Aiming"}:`, `+${effect.aiming_increase}%`);
            } else {
                moduleLi = styledLine(
                    `${effect.label || "Damage"}:`,
                    `${effect.min_damage ?? 0} - ${effect.max_damage ?? 0}`
                );
            }
            moduleTooltipUl.append(moduleLi);
            break;

        case "COLONIZATION":
            moduleLi = styledLine(`${effect.label || "Colonization"}`);
            moduleTooltipUl.append(moduleLi);
            break;

        default:
            moduleLi = styledLine(formatModuleTypeLabel(moduleType || "UNKNOWN"));
            moduleTooltipUl.append(moduleLi);
            break;
    }

    return moduleTooltipUl.outerHTML;
}

function styledLine(label, value) {
    const li = document.createElement("li");
    li.className = "flex justify-start items-center border-b border-emerald-800/20 py-[1px] gap-2";

    const labelSpan = document.createElement("span");
    labelSpan.className = "font-bold text-emerald-300";
    labelSpan.textContent = String(label ?? "");
    li.appendChild(labelSpan);

    if (value != null && String(value) !== "") {
        const valueSpan = document.createElement("span");
        valueSpan.className = "text-emerald-100";
        valueSpan.textContent = String(value);
        li.appendChild(valueSpan);
    }

    return li;
}
