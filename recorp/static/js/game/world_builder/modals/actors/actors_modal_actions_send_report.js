// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {

    let lastTargetContext = null;

    /**
     * Entrée principale
     */
    window.openSendReportModal = function ({
        targetKey,
        targetType,
        targetId,
        modalData,
        targetModalId,
    }) {
        // Sauvegarde du contexte pour réouverture
        lastTargetContext = {
            targetKey,
            targetType,
            targetId,
            modalData,
            targetModalId
        };

        // Fermer le modal courant (cible)
        open_close_modal(targetModalId)

        createSendReportModal(modalData, targetModalId);
    };

    /**
     * Création du modal Send Report
     */
    function createSendReportModal(modalData, targetModalId) {
        const modalId = "send-report-modal";

        const modal = document.createElement("div");
        modal.id = modalId;
        modal.className = `
            fixed inset-0 z-50 flex items-center justify-center
            bg-black/60 backdrop-blur-sm
        `;

        modal.innerHTML = `
            <div class="relative shadow-2xl md:w-[60vw] md:max-w-2xl md:h-[80vh] w-full h-full flex flex-col md:overflow-hidden transition-all bg-zinc-950/95 border md:border border-emerald-500/40 md:rounded-2xl shadow-[0_0_30px_rgba(10,185,129,0.4)] scale-100 opacity-100">

                ${renderHeader()}
                ${renderBody(modalData)}
                ${renderFooter()}
            </div>
        `;

        document.body.appendChild(modal);

        bindSendReportEvents(modalId, targetModalId);
    }

    function renderHeader() {
        return `
            <div class="flex justify-between items-center px-5 py-4 border-b border-emerald-500/40 bg-gradient-to-r from-emerald-900/60 to-zinc-900/60 shadow-inner">

                <h2 class="font-orbitron text-emerald-400 text-xl md:text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                    <i class="fa-solid fa-envelope"></i>
                    TRANSMISSION — INTEL REPORT
                </h2>

                <button id="send-report-close"
                    class="text-emerald-300 hover:text-red-400 transition">
                    ✕
                </button>
            </div>
        `;
    }

    function renderBody(modalData) {
        return `
            <div class="flex-1 overflow-y-auto p-4 space-y-4">

                <!-- Recipients -->
                <div>
                    <label class="text-xs text-emerald-300 uppercase tracking-wide">
                        Recipients
                    </label>
                    <div class="mt-1 p-2 bg-black/40 border border-emerald-500/30 rounded">
                        <input
                            type="text"
                            placeholder="Enter player name..."
                            class="w-full bg-transparent text-emerald-200 outline-none text-sm"
                            disabled
                        />
                        <p class="text-xs text-emerald-500 mt-1">
                            (autocomplete next step)
                        </p>
                    </div>
                </div>

                <!-- Intel report preview -->
                <div>
                    <label class="text-xs text-emerald-300 uppercase tracking-wide">
                        Intel report
                    </label>

                    <div class="mt-2 p-3 bg-black/50 border border-emerald-500/20 rounded font-mono text-xs text-emerald-200 whitespace-pre-wrap">
                        ${renderIntelReport(modalData)}
                    </div>
                </div>

                <!-- Optional message -->
                <div>
                    <label class="text-xs text-emerald-300 uppercase tracking-wide">
                        Optional message
                    </label>
                    <textarea
                        rows="3"
                        class="mt-1 w-full bg-black/40 border border-emerald-500/30 rounded
                        text-emerald-200 text-sm p-2 resize-none outline-none"
                        placeholder="Add a personal note…"></textarea>
                </div>
            </div>
        `;
    }

    function renderFooter() {
        return `
            <div class="border-t border-emerald-500/30 p-3 flex items-center gap-2 justify-center">

                <button id="send-report-cancel"
                    class="px-4 py-1 text-sm rounded
                    border border-emerald-500/40 text-emerald-300
                    hover:bg-emerald-900/40 transition">
                    Cancel
                </button>

                <button id="send-report-submit"
                    class="px-4 py-1 text-sm rounded
                    bg-emerald-600/80 text-black
                    hover:bg-emerald-500 transition font-semibold">
                    Send report
                </button>
            </div>
        `;
    }

    /**
     * Génération du texte du rapport (lecture seule)
     */
    function renderIntelReport(data) {
        
        const lines = [];
        const user = data.user || {};
        const ship = data.ship || {};
        const faction = data.player.faction_name || {};
        const user_type = user.is_npc == true ? "NPC" : "PLAYER";
        // === IDENTITÉ ===
        lines.push(`NAME: ${data.player.name}`);
        lines.push(`TYPE: ${user_type}`);

        if (faction) {
            lines.push(`FACTION: ${faction}`);
        }

        if (data.player.coordinates) {
            lines.push(`POSITION: [Y: ${data.player.coordinates.y} ; X: ${data.player.coordinates.x}]`);
        }

        // === SHIP ===
        lines.push("");
        lines.push("--- SHIP ---");

        if (ship.name) {
            lines.push(`SHIP NAME: ${ship.name}`);
        }

        if (ship.current_hp !== undefined) {
            lines.push(`HP: ${ship.current_hp} / ${ship.max_hp}`);
        }

        if (user.current_ap !== undefined) {
            lines.push(`AP: ${user.current_ap} / ${user.max_ap}`);
        }

        if (ship.current_movement !== undefined) {
            lines.push(`MP: ${ship.current_movement} / ${ship.max_movement}`);
        }

        // === DEFENSES ===
        if (ship.current_ballistic_defense !== undefined) {
            lines.push(`Ballistic: ${ship.current_ballistic_defense} / ${ship.max_ballistic_defense}`);
            lines.push(`Thermal: ${ship.current_thermal_defense} / ${ship.max_thermal_defense}`);
            lines.push(`Missile: ${ship.current_missile_defense} / ${ship.max_missile_defense}`);
        }

        // === MODULES ===
        if (Array.isArray(ship.modules) && ship.modules.length > 0) {
            lines.push("");
            lines.push("--- MODULES ---");
            ship.modules.forEach(m => {
                lines.push(`- ${m.name}`);
            });
        }

        return lines.join("\n");
    }

    /**
     * Events
     */
    function bindSendReportEvents(modalId, targetModalId) {
        const modal = document.getElementById(modalId);

        modal.querySelector("#send-report-close")?.addEventListener("click", () => {
            modal?.remove();
            open_close_modal(targetModalId);
        });
        modal.querySelector("#send-report-cancel")?.addEventListener("click", () => {
            modal?.remove();
            open_close_modal(targetModalId);
        });

        modal.querySelector("#send-report-submit")?.addEventListener("click", () => {
            modal?.remove();
            open_close_modal(targetModalId);
        });
    }

    function cancel() {
        reopenTargetModal();
    }

    function reopenTargetModal() {
        const modal = document.getElementById("send-report-modal");
        modal?.remove();

        if (!lastTargetContext) return;

        // Réouverture propre via le système officiel
        open_close_modal(
            lastTargetContext.targetType,
            lastTargetContext.targetId
        );

        lastTargetContext = null;
    }

})();
