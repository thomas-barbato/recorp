// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {

    function groupModulesByCategory(modules = []) {
        const grouped = {
            WEAPONRY: [],
            EWAR: [],
            DEFENSIVE: [],
            UTILITY: [],
            PROBE: []
        };

        for (const mod of modules) {
            for (const catKey in window.ModalConfig.MODULE_CATEGORIES) {
                if (window.ModalConfig.MODULE_CATEGORIES[catKey].types.includes(mod.type)) {
                    grouped[catKey].push(mod);
                    break;
                }
            }
        }
        return grouped;
    }

    function playerHasModule(types = [], requiredName = null) {
        const modules = window.currentPlayer?.ship?.modules || [];
        return modules.some(m => {
            if (!types.includes(m.type)) return false;
            if (requiredName) {
                return m.name?.toLowerCase() === requiredName.toLowerCase();
            }
            return true;
        });
    }

    function extractResourceInfo(resource) {
        if (!resource) return null;
        return {
            id: resource.id,
            name: resource.name,
            quantity_str: resource.quantity_str,
            quantity: resource.quantity,
            translated_text_resource: resource.translated_text_resource,
            translated_quantity_str: resource.translated_quantity_str,
            translated_scan_msg_str: resource.translated_scan_msg_str
        };
    }

    function extractElementInfo(sectorData) {
        return {
            type: sectorData.data.type,
            translatedType: sectorData.data.type_translated || null,
            animationName: sectorData.animations,
            name: sectorData.data.name,
            description: sectorData.data.description,
            coordinates: sectorData.data.coordinates,
            size: sectorData.size
        };
    }

    // 🔥 exposition globale
    window.ModalUtils = {
        groupModulesByCategory,
        playerHasModule,
        extractResourceInfo,
        extractElementInfo
    };

})();

// === Legacy globals bridge ===
window.groupModulesByCategory = window.ModalUtils.groupModulesByCategory;
window.playerHasModule = window.ModalUtils.playerHasModule;
window.extractResourceInfo = window.ModalUtils.extractResourceInfo;
window.extractElementInfo = window.ModalUtils.extractElementInfo;