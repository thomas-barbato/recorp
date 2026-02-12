// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {

    function h(tag, options = {}, children = []) {
        const el = document.createElement(tag);

        const {
            classList,
            className,
            attrs,
            text
        } = options;

        if (className) {
            el.className = className;
        }

        if (classList) {
            const classes = Array.isArray(classList) ? classList : String(classList).split(/\s+/);
            classes.forEach(c => {
                if (c) el.classList.add(c);
            });
        }

        if (attrs) {
            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'dataset' && value && typeof value === 'object') {
                    Object.entries(value).forEach(([dk, dv]) => {
                        el.dataset[dk] = dv;
                    });
                } else {
                    el.setAttribute(key, String(value));
                }
            });
        }

        if (text !== undefined && text !== null) {
            el.textContent = text;
        }

        if (!Array.isArray(children)) {
            children = [children];
        }

        children.forEach(child => {
            if (child === null || child === undefined) return;
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else {
                el.appendChild(child);
            }
        });

        return el;
    }

    // ===================================================
    // IMAGE PC / NPC
    // ===================================================
    function buildPcNpcImage(data, is_npc) {

        const wrapper = document.createElement("div");
        wrapper.classList.add("flex", "justify-center", "w-full");

        const img = document.createElement("img");

        if (!is_npc) {
            // PC
            img.src = `/static/img/users/${data.player.id}/0.gif` || `/static/img/ux/default-user.svg`;
            img.classList.add(
                "object-cover",
                "w-[72px]",
                "h-[72px]",
                "rounded-md"
            );
        } else {
            // NPC
            img.src = `/static/img/foreground/ships/illustration/${data.ship.image}.png`;
            img.style.width = "96px";
            img.style.height = "96px";
            img.style.maxWidth = "none";
            img.style.objectFit = "contain";
        }

        img.classList.add("mx-auto", "object-center");
        wrapper.append(img);

        return wrapper;
    }

    // ===================================================
    // SHELL STANDARD DU MODAL
    // ===================================================
    function createStandardModalShell(modalId) {

        let borderColor = "";

        // ✅ priorité au prefix UNKNOWN
        const isUnknown = modalId.includes("modal-unknown-");

        if (isUnknown) {
            // UNKNOWN doit avoir un visuel indépendant du vrai type (PC/NPC)
            borderColor = "red-border-with-glow"; // ou une classe neutre si tu préfères
        } else if (!modalId.includes("npc") && !modalId.includes("pc")) {
            borderColor = "emerald-border-with-glow";
        } else {
            const is_npc = modalId.includes("npc");
            borderColor = is_npc ? "red-border-with-glow" : "cyan-border-with-glow";
        }

        // === ROOT ===
        const root = document.createElement("div");
        root.id = modalId;
        root.setAttribute("aria-hidden", true);
        root.setAttribute("tabindex", -1);
        root.classList.add(
            "hidden",
            "fixed",
            "inset-0",
            "z-50",
            "flex",
            "items-center",
            "justify-center",
            "bg-black/40",
            "backdrop-blur-md",
            "backdrop-brightness-50",
            "animate-modal-fade"
        );

        // === CONTAINER ===
        const container = document.createElement("div");
        container.classList.add(
            "fixed","md:p-3","right-0","left-0","z-50",
            "w-full","md:inset-0","h-screen"
        );

        // === CONTENT ===
        const content = document.createElement("div");
        
        content.classList.add(
            "flex","shadow","rounded-t-xl",
            "max-w-w-[98%]",
            "md:max-w-[600px]",
            "lg:max-w-[680px]",
            "xl:max-w-[520px]",
            "justify-center","mx-auto","flex-col","border", borderColor, "transition-all", "bg-zinc-950/95",
            "md:rounded-2xl", "scale-100", "opacity-100", "font-shadow"
        );

        // === HEADER ===
        const headerContainer = document.createElement("div");
        headerContainer.id = `${modalId}-header`;
        headerContainer.classList.add("p-1","flex","flex-row","items-center");

        const header = {
            el: headerContainer,
            titleEl: null,

            setTitle(text) {
                if (!this.titleEl) {
                    this.titleEl = document.createElement("h3");
                    this.titleEl.classList.add(
                        "lg:text-xl","text-md","text-center",
                        "font-bold","flex","w-[95%]",
                        "text-white","p-1","justify-center"
                    );
                    this.el.append(this.titleEl);
                }
                this.titleEl.textContent = text;
            },

            setCloseButton(modalId) {
                const closeBtn = document.createElement("img");
                closeBtn.src = "/static/img/ux/close.svg";
                closeBtn.classList.add(
                    "inline-block","w-[5%]","h-[5%]",
                    "cursor-pointer","hover:animate-pulse"
                );
                closeBtn.onclick = () => open_close_modal(modalId);
                this.el.append(closeBtn);
            }
        };

        // === BODY ===
        const bodyContainer = document.createElement("div");
        bodyContainer.id = `${modalId}-body`;
        bodyContainer.classList.add(
            "items-center","p-2","flex","flex-col","gap-3",
            "overflow-y-auto","md:max-h-[70vh]","max-h-[80vh]",
            "no-scrollbar","sf-scroll"
        );

        if (modalId.includes("npc")) {
            bodyContainer.classList.add("sf-scroll-red");
        } else if (modalId.includes("pc")) {
            bodyContainer.classList.add("sf-scroll-cyan");
        } else {
            bodyContainer.classList.add("sf-scroll-emerald");
        }

        const body = {
            el: bodyContainer,
            addSection(section) {
                this.el.append(section);
            }
        };

        // === FOOTER ===
        const footerContainer = document.createElement("div");
        footerContainer.classList.add("p-2","flex","flex-row","w-full","mx-auto");

        const footer = {
            el: footerContainer,
            setCloseButton(modalId) {
                let footer_container = document.createElement('div')
                footer_container.className = "w-full flex justify-center items-center py-3  relative z-10";
                let closeBtn = document.createElement('button');
                closeBtn.className = "text-emerald-400 hover:text-[#B1F1CB] font-bold px-6 py-1.5 rounded-md border border-emerald-400/30 hover:border-[#B1F1CB] text-sm transition-all";
                closeBtn.textContent= gettext('close');
                closeBtn.onclick = () => open_close_modal(modalId);
                footer_container.append(closeBtn)
                this.el.append(footer_container);
            }
        };

        // === ASSEMBLAGE ===
        content.append(headerContainer, bodyContainer, footerContainer);
        container.append(content);
        root.append(container);

        return {
            root,
            container,
            content,
            header,
            body,
            footer
        };
    }

    // ===================================================
    // EXPOSITION GLOBALE + BRIDGE LEGACY
    // ===================================================
    window.ModalShell = {
        createStandardModalShell,
        buildPcNpcImage
    };

    // Legacy (aucune ligne existante à changer)
    window.createStandardModalShell = createStandardModalShell;
    window.buildPcNpcImage = buildPcNpcImage;
    window.h = h;

})();
