const moduleUrl = new URL(import.meta.url);
const version = moduleUrl.searchParams.get("v");
const suffix = version ? `?v=${encodeURIComponent(version)}` : "";

const [
    { computeDistance },
    { computeModuleRangeCheck },
    { findPath, initPathfindingGrid, syncPathfindingDynamic }
] = await Promise.all([
    import(`./distance.js${suffix}`),
    import(`./range.js${suffix}`),
    import(`./pathfinding.js${suffix}`)
]);

export const systems = {
    compute_distance: computeDistance, // UI / tooltip
    compute_module_range: computeModuleRangeCheck, // gameplay
    init_pathfinding_grid: initPathfindingGrid,
    sync_pathfinding_dynamic: syncPathfindingDynamic,
    find_path: findPath
};