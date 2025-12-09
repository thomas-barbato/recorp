// ========================================================
//  MODAL CONTROLLER
//  Etape B - Front dynamique pour modals PC / NPC / FG
// ========================================================
//
//  API publique :
//      ModalController.openForObject(obj)
//      ModalController.close()
//
//  obj = un objet provenant de MapData (clicked object)
// ========================================================

export const ModalController = {

    // Référence vers l’élément du modal (DOM)
    modalEl: null,
    modalContentEl: null,

    // Cible actuellement affichée dans le modal
    currentTarget: {
        type: null,
        id: null,
        subtype: null, // pour les foregrounds : planet, station...
    },

    // ============================
    // 1. INITIALISATION
    // ============================
    init() {
        // Création du modal root (invisible au début)
        const modal = document.createElement("div");
        modal.id = "dynamic-modal-root";
        modal.className = `
            fixed inset-0 z-[9999] hidden 
            bg-black/70 backdrop-blur-sm 
            flex justify-center items-center
        `;
        modal.innerHTML = `
            <div class="relative bg-zinc-900 border border-emerald-500 
                        shadow-xl rounded-xl w-[90%] max-w-3xl max-h-[90vh] 
                        overflow-hidden flex flex-col animate-modal-rise">
                
                <!-- HEADER -->
                <div class="flex justify-between items-center px-4 py-3 
                            bg-gradient-to-r from-emerald-900/60 to-zinc-900/60 
                            border-b border-emerald-600/40">
                    <h3 id="modal-title" 
                        class="text-xl font-bold text-emerald-300 uppercase tracking-widest">
                        Loading...
                    </h3>
                    <button id="modal-close-btn"
                            class="text-emerald-400 hover:text-red-400 text-2xl transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- CONTENT -->
                <div id="modal-content" 
                    class="flex-1 overflow-y-auto p-4 text-emerald-200">
                    Loading modal...
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        this.modalEl = modal;
        this.modalContentEl = modal.querySelector("#modal-content");

        // Fermeture
        modal.querySelector("#modal-close-btn").addEventListener("click", () => {
            this.close();
        });
    },

    // ====================================================
    // 2. IDENTIFICATION DE LA CIBLE (depuis MapData/canvas)
    // ====================================================
    identifyObject(obj) {
        if (!obj || !obj.id) return null;

        const raw = obj.id;  // ex: "pc_23", "npc_51", "planet_8"

        // Players
        if (raw.startsWith("pc_")) {
            return { type: "pc", id: Number(raw.slice(3)) };
        }

        // NPC
        if (raw.startsWith("npc_")) {
            return { type: "npc", id: Number(raw.slice(4)) };
        }

        // Foreground (planet, station, asteroid, warpzone)
        const parts = raw.split("_");          // ["planet", "8"]
        if (parts.length === 2) {
            const subtype = parts[0];
            const id = Number(parts[1]);
            return { type: "fg", subtype, id };
        }

        return null;
    },

    // ================================================
    // 3. APPEL API + OUVERTURE DYNAMIQUE DU MODAL
    // ================================================
    async openForObject(obj) {
        const info = this.identifyObject(obj);
        if (!info) return;

        this.currentTarget = info;

        // On affiche le modal immédiatement (avec loading)
        this.show();
        this.setContent("Loading modal...");

        try {
            const payload = await this.fetchModalData(info);
            this.renderModal(payload);
        } catch (err) {
            console.error("Modal fetch error:", err);
            this.setContent(`<p class="text-red-400">Error loading modal.</p>`);
        }
    },

    // ===============================
    // 4. FETCH vers les endpoints API
    // ===============================
    async fetchModalData(info) {
        let url = null;

        if (info.type === "pc") {
            url = `/api/modal/pc/${info.id}/`;
        } else if (info.type === "npc") {
            url = `/api/modal/npc/${info.id}/`;
        } else if (info.type === "fg") {
            url = `/api/modal/fg/${info.subtype}/${info.id}/`;
        }

        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
    },

    // =======================================
    // 5. RENDU FINAL DU MODAL (HTML dynamique)
    // =======================================
    renderModal(data) {
        // Titre
        const modalTitle = this.modalEl.querySelector("#modal-title");

        if (data.type === "pc") {
            modalTitle.textContent = `${data.name}`;
            this.renderPcModal(data);
        }
        else if (data.type === "npc") {
            modalTitle.textContent = `${data.name}`;
            this.renderNpcModal(data);
        }
        else if (data.type === "foreground") {
            modalTitle.textContent = `${data.name}`;
            this.renderFgModal(data);
        }
        else {
            modalTitle.textContent = "Unknown";
            this.setContent(`<p>Impossible de charger ce modal.</p>`);
        }
    },

    // ========================================================
    // 5A. TEMPLATE PC
    // ========================================================
    renderPcModal(pc) {
        const html = `
            <div class="space-y-4">

                <div class="text-emerald-300 text-lg font-bold">
                    Faction: <span class="text-emerald-400">${pc.faction?.name || "??"}</span>
                </div>

                <div class="flex gap-4 items-center">
                    <img src="/static/img/ships/${pc.ship.image}.png"
                         class="w-32 h-32 rounded-md border border-emerald-600/50"/>
                    <div>
                        <p>Ship: <span class="text-emerald-300">${pc.ship.name}</span></p>
                        <p>Size: ${pc.size.x}×${pc.size.y}</p>
                        <p>Coordinates: ${pc.coordinates.x}, ${pc.coordinates.y}</p>
                    </div>
                </div>

                <hr class="border-emerald-600/40">

                <h3 class="text-emerald-300 text-lg uppercase tracking-wider">Actions</h3>
                ${this.renderActions(pc.actions)}
            </div>
        `;

        this.setContent(html);
    },

    // ========================================================
    // 5B. TEMPLATE NPC
    // ========================================================
    renderNpcModal(npc) {
        const html = `
            <div class="space-y-4">

                <div class="flex gap-4 items-center">
                    <img src="/static/img/ships/${npc.ship.image}.png"
                         class="w-28 h-28 rounded-md border border-emerald-600/50"/>
                    <div>
                        <p>Template: <span class="text-emerald-300">${npc.internal_name}</span></p>
                        <p>Size: ${npc.size.x}×${npc.size.y}</p>
                        <p>Coordinates: ${npc.coordinates.x}, ${npc.coordinates.y}</p>
                    </div>
                </div>

                <hr class="border-emerald-600/40">

                <h3 class="text-emerald-300 text-lg uppercase tracking-wider">Actions</h3>
                ${this.renderActions(npc.actions)}
            </div>
        `;
        this.setContent(html);
    },

    // ========================================================
    // 5C. TEMPLATE FOREGROUND ELEMENT
    // ========================================================
    renderFgModal(fg) {
        const html = `
            <div class="space-y-4">
                <p><strong>Description :</strong> ${fg.description || "No description"}</p>

                <p><strong>Coords:</strong> ${fg.coordinates.x}, ${fg.coordinates.y}</p>
                <p><strong>Size:</strong> ${fg.size.x}×${fg.size.y}</p>

                <hr class="border-emerald-600/40">
                <h3 class="text-emerald-300 text-lg uppercase tracking-wider">Actions</h3>

                ${this.renderActions(fg.actions)}
            </div>
        `;
        this.setContent(html);
    },

    // =====================================================
    // 6. Rendu des actions (désactivées ou non)
    // =====================================================
    renderActions(actions) {
        if (!actions) return `<p>No actions.</p>`;

        return `
            <div class="flex flex-col gap-2">
                ${Object.entries(actions).map(([name, info]) => {
                    const disabled = !info.enabled ? "opacity-40 cursor-not-allowed" : "";
                    const reason = !info.enabled && info.reason ? `<span class='text-red-400 text-xs ml-2'>(${info.reason})</span>` : "";

                    return `
                        <button class="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 
                                    rounded-md text-sm font-bold uppercase tracking-widest
                                    ${disabled}"
                                data-action="${name}">
                            ${name.toUpperCase()} ${reason}
                        </button>
                    `;
                }).join("")}
            </div>
        `;
    },

    // ================================
    // 7. Helpers (afficher/fermer)
    // ================================
    show() {
        this.modalEl.classList.remove("hidden");
    },

    close() {
        this.modalEl.classList.add("hidden");
        this.setContent("");
        this.currentTarget = {};
    },

    setContent(html) {
        this.modalContentEl.innerHTML = html;
    },
};

// Auto-init
window.addEventListener("DOMContentLoaded", () => ModalController.init());
