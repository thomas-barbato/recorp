import { computeDistance } from "./distance.js";
import { computeModuleRangeCheck } from "./range.js";

export const systems = {
compute_distance: computeDistance, // UI / tooltip
    compute_module_range: computeModuleRangeCheck // gameplay
};