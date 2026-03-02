// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {

    function getModuleEffectsArray(moduleObject) {
        if (Array.isArray(moduleObject?.effects)) {
            return moduleObject.effects.filter((entry) => entry && typeof entry === "object");
        }
        return [];
    }

    function createModuleTooltipLines(moduleType, effect) {
        const lines = [];
        const label = effect?.label;

        switch (moduleType) {
            case "DEFENSE_BALLISTIC":
            case "DEFENSE_THERMAL":
            case "DEFENSE_MISSILE":
                if (effect?.defense != null) lines.push(styledLine(`${label || "Defense"}:`, `+${effect.defense}`));
                break;
            case "HOLD":
                if (effect?.capacity != null) lines.push(styledLine(`${label || "Cargo"}:`, `+${effect.capacity}`));
                break;
            case "MOVEMENT":
                if (effect?.movement != null) lines.push(styledLine(`${label || "Movement"}:`, `+${effect.movement}`));
                break;
            case "HULL":
                if (effect?.hp != null) lines.push(styledLine(`${label || "Hull"}:`, `+${effect.hp}`));
                break;
            case "REPAIRE":
                if (effect?.repair_shield != null) lines.push(styledLine(`${label || "Repair"}:`, `${effect.repair_shield} hull points`));
                break;
            case "GATHERING":
                if ("can_scavenge" in effect) lines.push(styledLine(label || "Scavenge", "yes"));
                if ("display_mineral_data" in effect) lines.push(styledLine(label || "Mineral data", `range: ${effect.range ?? "?"}`));
                if (effect?.gathering_amount != null) lines.push(styledLine(`${label || "Gathering"}:`, `+${effect.gathering_amount}, range: ${effect.range ?? "?"}`));
                break;
            case "RESEARCH":
                if (effect?.research_time_discrease != null) lines.push(styledLine(`${label || "Research"}:`, `-${effect.research_time_discrease}%`));
                break;
            case "CRAFT":
                if (effect?.crafting_tier_allowed != null) lines.push(styledLine(`${label || "Craft"}:`, `${effect.crafting_tier_allowed}`));
                break;
            case "ELECTRONIC_WARFARE":
                if (effect?.aiming_discrease != null) lines.push(styledLine(`${label || "Electronic warfare"}:`, `-${effect.aiming_discrease}% - range ${effect.range ?? "?"}`));
                if (effect?.movement_discrease != null) lines.push(styledLine(`${label || "Electronic warfare"}:`, `-${effect.movement_discrease}% - range ${effect.range ?? "?"}`));
                if ("display_ship_data" in effect) lines.push(styledLine(label || "Ship data", `range ${effect.range ?? "?"}`));
                break;
            case "WEAPONRY":
                if (effect?.aiming_increase != null) lines.push(styledLine(`${label || "Aiming"}:`, `+${effect.aiming_increase}% - range ${effect.range ?? "?"}`));
                if (effect?.min_damage != null || effect?.max_damage != null) {
                    lines.push(styledLine(`${label || "Damage"}:`, `damages: ${effect.min_damage ?? 0} - ${effect.max_damage ?? 0} - range ${effect.range ?? "?"}`));
                }
                break;
            case "COLONIZATION":
                lines.push(styledLine(label || "Colonization", "ready"));
                break;
            case "PROBE":
                if (effect?.range != null) lines.push(styledLine(`${label || "Range"}:`, `${effect.range}`));
                break;
            default:
                break;
        }

        return lines;
    }

    // ===================================================
    // FORMATAGE D'UN MODULE (tooltip HTML)
    // ===================================================
    function createFormatedLabel(moduleObject) {
        const moduleType = String(moduleObject?.type || "").toUpperCase();
        const moduleTooltipUl = document.createElement("ul");
        const moduleTooltipName = document.createElement("span");
        moduleTooltipUl.className = `
            flex flex-col gap-1 font-bold text-xs font-shadow
            bg-gray-900/95 border border-emerald-700/40 rounded-md
            text-emerald-200 shadow-lg shadow-black/60 p-2 backdrop-blur-sm
        `;
        moduleTooltipName.className = "font-bold text-emerald-300 text-sm font-shadow";
        moduleTooltipName.textContent = moduleObject?.name || "Unknown module";
        moduleTooltipUl.append(moduleTooltipName);

        const effects = getModuleEffectsArray(moduleObject);
        let hasLines = false;
        effects.forEach((effect) => {
            const lines = createModuleTooltipLines(moduleType, effect || {});
            lines.forEach((line) => {
                moduleTooltipUl.append(line);
                hasLines = true;
            });
        });

        if (!hasLines) {
            moduleTooltipUl.append(styledLine(moduleType || "MODULE"));
        }

        return moduleTooltipUl.outerHTML;
    }

    // ===================================================
    // ACCORDEON DE CATEGORIE
    // ===================================================
    function createModuleCategoryAccordion(categoryKey, modules, uniqueModalId) {

        if (!modules.length) return null;

        const categoryInfo = MODULE_CATEGORIES[categoryKey];
        const accordionId = `${uniqueModalId}-accordion-${categoryKey}`;

        const wrapper = document.createElement("div");
        wrapper.classList.add("w-full");
        wrapper.dataset.accordionId = accordionId;

        const headerBtn = document.createElement("button");
        headerBtn.type = "button";
        headerBtn.classList.add(
            "flex", "items-center", "justify-between",
            "w-full", "p-2", "font-bold", "text-white",
            "mb-1", "cursor-pointer", "font-shadow"
        );
        headerBtn.dataset.accordionToggle = accordionId;

        const textSpan = document.createElement("span");
        textSpan.textContent = categoryInfo.label;

        const arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        arrowSvg.classList.add("w-3", "h-3", "transition-transform", "duration-200");
        arrowSvg.setAttribute("fill", "none");
        arrowSvg.setAttribute("viewBox", "0 0 10 6");

        const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrowPath.setAttribute("stroke", "currentColor");
        arrowPath.setAttribute("stroke-width", "2");
        arrowPath.setAttribute("d", "M9 5 5 1 1 5");

        arrowSvg.append(arrowPath);
        headerBtn.append(textSpan, arrowSvg);

        const bodyDiv = document.createElement("div");
        bodyDiv.classList.add("hidden", "pl-2", "flex", "flex-col");
        bodyDiv.id = accordionId;

        for (const moduleObj of modules) {
            const htmlString = createFormatedLabel(moduleObj);
            const temp = document.createElement("div");
            temp.innerHTML = htmlString.trim();
            const formattedModule = temp.firstChild;

            formattedModule.classList.add(
                "rounded-md", "p-2", "border", "border-slate-500",
                "bg-black/40", "hover:bg-black/60", "transition"
            );

            bodyDiv.append(formattedModule);
        }

        wrapper.append(headerBtn, bodyDiv);
        return wrapper;
    }

    // ===================================================
    // COMPORTEMENT ACCORDEONS (exclusifs)
    // ===================================================
    function activateExclusiveAccordions(modalRoot) {

        const toggles = modalRoot.querySelectorAll("[data-accordion-toggle]");

        toggles.forEach(toggle => {
            toggle.addEventListener("click", () => {

                const targetId = toggle.dataset.accordionToggle;
                const targetBody = modalRoot.querySelector(`#${targetId}`);

                const isOpening = targetBody.classList.contains("hidden");

                modalRoot.querySelectorAll("[data-accordion-toggle]").forEach(btn => {
                    const otherId = btn.dataset.accordionToggle;
                    const otherBody = modalRoot.querySelector(`#${otherId}`);
                    const otherSvg = btn.querySelector("svg");

                    otherBody.classList.add("hidden");
                    otherSvg.classList.remove("rotate-180");
                });

                if (isOpening) {
                    targetBody.classList.remove("hidden");
                    toggle.querySelector("svg").classList.add("rotate-180");
                }
            });
        });
    }

    // ===================================================
    // SECTION MODULES (appelee par PC / NPC)
    // ===================================================
    function buildModulesSection(modalId, data) {

        const section = document.createElement("div");
        section.classList.add(
            "flex", "flex-col", "gap-1", "w-full",
            "max-h-[35vh]", "pr-1",
            "custom-scroll", "sf-scroll", "sf-scroll-emerald"
        );

        const targetModules = data?.ship?.modules || [];
        const categories = groupModulesByCategory(targetModules);

        for (const catKey of Object.keys(MODULE_CATEGORIES)) {
            const accordion = createModuleCategoryAccordion(
                catKey,
                categories[catKey],
                modalId
            );
            if (accordion) section.append(accordion);
        }

        return section;
    }

    // ===================================================
    // EXPOSITION GLOBALE + BRIDGE LEGACY
    // ===================================================
    window.ModalModulesRenderer = {
        createFormatedLabel,
        createModuleCategoryAccordion,
        activateExclusiveAccordions,
        buildModulesSection
    };

    // Legacy
    window.createFormatedLabel = createFormatedLabel;
    window.createModuleCategoryAccordion = createModuleCategoryAccordion;
    window.activateExclusiveAccordions = activateExclusiveAccordions;
    window.buildModulesSection = buildModulesSection;

})();

