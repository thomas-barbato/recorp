// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {

    // ===================================================
    // FORMATAGE D’UN MODULE (tooltip HTML)
    // ===================================================
    function createFormatedLabel(module_object) {

        let module_name = module_object.name;
        let module_type = module_object.type;

        let module_tooltip_ul = document.createElement('ul');
        let module_tooltip_name = document.createElement('span');
        let module_tooltip_moduleType = document.createElement('small');

        module_tooltip_ul.className = `
            flex flex-col gap-1 font-bold text-xs font-shadow
            bg-gray-900/95 border border-emerald-700/40 rounded-md
            text-emerald-200 shadow-lg shadow-black/60 p-2 backdrop-blur-sm
        `;
        module_tooltip_name.className = "font-bold text-emerald-300 text-sm font-shadow";
        module_tooltip_name.textContent = module_name;

        module_tooltip_ul.append(module_tooltip_name);

        let module_li;

        switch (module_type) {

            case "DEFENSE_BALLISTIC":
            case "DEFENSE_THERMAL":
            case "DEFENSE_MISSILE": {
                let parts = module_type.split('_');
                module_type = `${parts[1]} ${parts[0]}`;
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `+${module_object.effect.defense}`
                );
                module_tooltip_ul.append(module_li);
                break;
            }

            case "HOLD":
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `+${module_object.effect.capacity}`
                );
                module_tooltip_ul.append(module_li);
                break;

            case "MOVEMENT":
                module_li = styledLine(
                    module_object.effect.label || "Movement:",
                    `+${module_object.effect.movement}`
                );
                module_tooltip_ul.append(module_li);
                break;

            case "HULL":
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `+${module_object.effect.hp}`
                );
                module_tooltip_ul.append(module_li);
                break;

            case "REPAIRE":
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `${module_object.effect.repair_shield} hull points`
                );
                module_tooltip_ul.append(module_li);
                break;

            case "GATHERING":
                if ('can_scavenge' in module_object.effect) {
                    module_li = styledLine(module_object.effect.label, `✔️`);
                } else if ('display_mineral_data' in module_object.effect) {
                    module_li = styledLine(
                        module_object.effect.label,
                        `range: ${module_object.effect.range}`
                    );
                } else {
                    module_li = styledLine(
                        `${module_object.effect.label}:`,
                        `+${module_object.effect.gathering_amount}, range: ${module_object.effect.range}`
                    );
                }
                module_tooltip_ul.append(module_li);
                break;

            case "RESEARCH":
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `-${module_object.effect.research_time_discrease}%`
                );
                module_tooltip_ul.append(module_li);
                break;

            case "CRAFT":
                module_li = styledLine(
                    `${module_object.effect.label}:`,
                    `${module_object.effect.crafting_tier_allowed}`
                );
                module_tooltip_ul.append(module_li);
                break;

            case "ELECTRONIC_WARFARE":
                if ("aiming_discrease" in module_object.effect) {
                    module_li = styledLine(
                        `${module_object.effect.label}:`,
                        `-${module_object.effect.aiming_discrease}% — range ${module_object.effect.range}`
                    );
                } else if ("movement_discrease" in module_object.effect) {
                    module_li = styledLine(
                        `${module_object.effect.label}:`,
                        `-${module_object.effect.movement_discrease}% — range ${module_object.effect.range}`
                    );
                } else if ("display_ship_data" in module_object.effect) {
                    module_li = styledLine(
                        module_object.effect.label,
                        `range ${module_object.effect.range}`
                    );
                }
                module_tooltip_ul.append(module_li);
                break;

            case "WEAPONRY":
                if ("aiming_increase" in module_object.effect) {
                    module_li = styledLine(
                        `${module_object.effect.label}:`,
                        `+${module_object.effect.aiming_increase}% — range ${module_object.effect.range || "?"}`
                    );
                } else {
                    module_li = styledLine(
                        `${module_object.effect.label}:`,
                        `damages: ${module_object.effect.min_damage} - ${module_object.effect.max_damage} — range ${module_object.effect.range}`
                    );
                }
                module_tooltip_ul.append(module_li);
                break;

            case "COLONIZATION":
                module_li = styledLine(module_object.effect.label, `🌍`);
                module_tooltip_ul.append(module_li);
                break;
        }

        module_tooltip_moduleType.textContent = module_type;
        return module_tooltip_ul.outerHTML;
    }

    // ===================================================
    // ACCORDÉON DE CATÉGORIE
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
            "flex","items-center","justify-between",
            "w-full","p-2","font-bold","text-white",
            "mb-1","cursor-pointer","font-shadow"
        );
        headerBtn.dataset.accordionToggle = accordionId;

        const textSpan = document.createElement("span");
        textSpan.textContent = categoryInfo.label;

        const arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        arrowSvg.classList.add("w-3","h-3","transition-transform","duration-200");
        arrowSvg.setAttribute("fill","none");
        arrowSvg.setAttribute("viewBox","0 0 10 6");

        const arrowPath = document.createElementNS("http://www.w3.org/2000/svg","path");
        arrowPath.setAttribute("stroke","currentColor");
        arrowPath.setAttribute("stroke-width","2");
        arrowPath.setAttribute("d","M9 5 5 1 1 5");

        arrowSvg.append(arrowPath);
        headerBtn.append(textSpan, arrowSvg);

        const bodyDiv = document.createElement("div");
        bodyDiv.classList.add("hidden","pl-2","flex","flex-col");
        bodyDiv.id = accordionId;

        for (const moduleObj of modules) {
            const htmlString = createFormatedLabel(moduleObj);
            const temp = document.createElement("div");
            temp.innerHTML = htmlString.trim();
            const formattedModule = temp.firstChild;

            formattedModule.classList.add(
                "rounded-md","p-2","border","border-slate-500",
                "bg-black/40","hover:bg-black/60","transition"
            );

            bodyDiv.append(formattedModule);
        }

        wrapper.append(headerBtn, bodyDiv);
        return wrapper;
    }

    // ===================================================
    // COMPORTEMENT ACCORDÉONS (exclusifs)
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
    // SECTION MODULES (appelée par PC / NPC)
    // ===================================================
    function buildModulesSection(modalId, data) {

        const section = document.createElement("div");
        section.classList.add(
            "flex","flex-col","gap-1","w-full",
            "max-h-[35vh]","pr-1",
            "custom-scroll","sf-scroll","sf-scroll-emerald"
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

    // Legacy (aucune ligne existante à changer)
    window.createFormatedLabel = createFormatedLabel;
    window.createModuleCategoryAccordion = createModuleCategoryAccordion;
    window.activateExclusiveAccordions = activateExclusiveAccordions;
    window.buildModulesSection = buildModulesSection;

})();
