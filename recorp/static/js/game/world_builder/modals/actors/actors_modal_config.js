// Global, pour permettre l'utilisation dans modals.js sans passer au type "module"
(function () {
    const MODULE_CATEGORIES = {
        WEAPONRY: { label: "Weaponry", types: ["WEAPONRY"] },
        EWAR: { label: "Electronic Warfare", types: ["ELECTRONIC_WARFARE"] },
        DEFENSIVE: { label: "Defensive Modules", types: ["DEFENSE_BALLISTIC", "DEFENSE_THERMAL", "DEFENSE_MISSILE"] },
        UTILITY: { label: "Utility Modules", types: ["REPAIRE", "COLONIZATION", "CRAFT", "GATHERING", "RESEARCH"] },
        PROBE: { label: "Probe Modules", types: ["PROBE"] }
    };

    const FOREGROUND_ACTIONS = {
        asteroid: [
            {
                key: "gather",
                label: "Récolte",
                icon: "/static/img/ux/gather_icon.svg",
                requires: [{ type: "GATHERING" }],
                ap_cost: 1,
                cost: 0
            },
            {
                key: "scan",
                label: "Scan",
                icon: "/static/img/ux/scan_resource_icon.svg",
                requires: [{ type: "PROBE", name: "drilling probe" }],
                ap_cost: 1,
                cost: 0
            }
        ],
        star: [
            {
                key: "gather",
                label: "Récolte",
                icon: "/static/img/ux/gather_icon.svg",
                requires: [{ type: "GATHERING" }],
                ap_cost: 1,
                cost: 0
            },
            {
                key: "scan",
                label: "Scan",
                icon: "/static/img/ux/scan_resource_icon.svg",
                requires: [{ type: "PROBE", name: "drilling probe" }],
                ap_cost: 1,
                cost: 0
            }
        ],

        planet: [
            { key: "set_home", label: "New Home", icon: "/static/img/ux/new_location.svg", ap_cost: 0, cost: 1000 },
            { key: "join_faction", label: "Join Faction", icon: "/static/img/ux/join_faction.svg", ap_cost: 0, cost: 1000 },
            { key: "dock", label: "Dock", icon: "/static/img/ux/dock.svg", ap_cost: 0, cost: 0 },
            { key: "bank", label: "Bank", icon: "/static/img/ux/bank.svg", ap_cost: 0, cost: 0 },
            { key: "market", label: "Market", icon: "/static/img/ux/market.svg", ap_cost: 0, cost: 0 },
            { key: "task", label: "Task", icon: "/static/img/ux/task.svg", ap_cost: 0, cost: 0 },
            {
                key: "invade",
                label: "Invade",
                icon: "/static/img/ux/invade.svg",
                requires: [{ type: "COLONIZATION" }]
            }
        ],

        warpzone: [
            { key: "warp_destinations" }
        ],

        satellite: [
            { key: "corporation", label: "Corporation", icon: "/static/img/ux/join_faction.svg", cost: 0, ap_cost: 0 },
            { key: "new_home", label: "New Home", icon: "/static/img/ux/new_location.svg", cost: 1000, ap_cost: 0 },
            { key: "dock", label: "Dock", icon: "/static/img/ux/dock.svg", cost: 1000, ap_cost: 0 },
            { key: "bank", label: "Bank", icon: "/static/img/ux/bank.svg", ap_cost: 0, cost: 0 },
            { key: "market", label: "Market", icon: "/static/img/ux/market.svg", cost: 0, ap_cost: 0 }
        ],

        station: [
            { key: "training", label: "Training", iconify: "game-icons--teacher", cost: 0, ap_cost: 0 },
            { key: "craft", label: "Craft", iconify: "game-icons--crafting", cost: 0, ap_cost: 0 },
            { key: "repair", label: "Repair", iconify: "game-icons--auto-repair", cost: 1000, ap_cost: 1 },
            { key: "refuel", label: "Refuel", iconify: "game-icons--fuel-tank", cost: 1000, ap_cost: 1 }
        ],

        wreck: [
            { key: "fouille", label: "Fouille", icon: "/static/img/ux/gather_icon.svg", cost: 0, ap_cost: 0 },
            {
                key: "salvage",
                label: "Salvage",
                icon: "/static/img/ux/gather_icon.svg",
                cost: 0,
                ap_cost: 1,
                requires: [{ type: "GATHERING", name: "scavenging module" }]
            }
        ],

        black_hole: []
    };

    const PC_NPC_EXTRA_ACTIONS = [
        {
            key: "share_to_group",
            label: "Share to group",
            icon: "/static/img/ux/gameIcons-radar-cross-section.svg",
            ap_cost: 1,
            requires_scan: true,
            requires_group: true,
            warning_no_group: "Vous devez faire partie d'un groupe pour effectuer cette action."
        },
        {
            key: "send_report",
            label: "send report",
            iconClass: "fa-solid fa-envelope",
            ap_cost: 0,
            requires_scan: true
        }
    ];

    // Exposition “nouveau namespace”
    window.ModalConfig = {
        MODULE_CATEGORIES,
        FOREGROUND_ACTIONS,
        PC_NPC_EXTRA_ACTIONS
    };

    // Bridge legacy (ton modals.js actuel continue d’utiliser ces noms)
    window.MODULE_CATEGORIES = MODULE_CATEGORIES;
    window.FOREGROUND_ACTIONS = FOREGROUND_ACTIONS;
    window.PC_NPC_EXTRA_ACTIONS = PC_NPC_EXTRA_ACTIONS;
})();
