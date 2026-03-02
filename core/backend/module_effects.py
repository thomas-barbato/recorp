from __future__ import annotations

import json
from typing import Any, Dict, Iterable, List, Optional


_NUMERIC_TYPES = (int, float)
_ADDITIVE_KEYS = {
    "defense",
    "movement",
    "hp",
    "capacity",
    "repair_shield",
    "gathering_amount",
    "aiming_increase",
    "aiming_discrease",
    "movement_discrease",
    "research_time_discrease",
}
_MAX_KEYS = {"range", "max_damage", "crafting_tier_allowed"}
_MIN_KEYS = {"min_damage"}
_BOOLEAN_KEYS = {"can_scavenge", "display_mineral_data", "display_ship_data"}


def _read_attr(source: Any, keys: Iterable[str]) -> Any:
    if isinstance(source, dict):
        for key in keys:
            if key in source:
                return source.get(key)
        return None

    for key in keys:
        if hasattr(source, key):
            return getattr(source, key)
    return None


def _as_dict(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return dict(value)

    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return {}
        try:
            parsed = json.loads(raw)
        except Exception:
            return {}
        if isinstance(parsed, dict):
            return dict(parsed)
    return {}


def _coerce_effect_entries(raw_effects: Any) -> List[Dict[str, Any]]:
    if isinstance(raw_effects, str):
        try:
            raw_effects = json.loads(raw_effects)
        except Exception:
            raw_effects = None

    if not isinstance(raw_effects, list):
        return []

    normalized: List[Dict[str, Any]] = []
    for item in raw_effects:
        parsed = _as_dict(item)
        if parsed:
            normalized.append(parsed)
    return normalized


def get_module_subtype(module_like: Any, default: str = "GENERIC") -> str:
    raw = _read_attr(
        module_like,
        ("subtype", "module__subtype", "module_id__subtype"),
    )
    value = str(raw or "").strip().upper()
    return value or default


def get_module_effects(module_like: Any) -> List[Dict[str, Any]]:
    effects_raw = _read_attr(
        module_like,
        ("effects", "module__effects", "module_id__effects", "module_effects", "module__module_effects", "module_id__module_effects"),
    )
    return _coerce_effect_entries(effects_raw)


def get_module_effect_map(module_like: Any) -> Dict[str, Any]:
    effects = get_module_effects(module_like)
    merged: Dict[str, Any] = {}

    for idx, effect in enumerate(effects):
        for key, value in effect.items():
            if value is None:
                continue

            if key == "label":
                if idx == 0 and isinstance(value, str) and value.strip():
                    merged["label"] = value
                continue

            if key in _BOOLEAN_KEYS:
                merged[key] = bool(merged.get(key, False) or bool(value))
                continue

            if key in _ADDITIVE_KEYS and isinstance(value, _NUMERIC_TYPES):
                previous = merged.get(key, 0)
                if isinstance(previous, _NUMERIC_TYPES):
                    merged[key] = previous + value
                else:
                    merged[key] = value
                continue

            if key in _MAX_KEYS and isinstance(value, _NUMERIC_TYPES):
                previous = merged.get(key)
                if not isinstance(previous, _NUMERIC_TYPES) or value > previous:
                    merged[key] = value
                continue

            if key in _MIN_KEYS and isinstance(value, _NUMERIC_TYPES):
                previous = merged.get(key)
                if not isinstance(previous, _NUMERIC_TYPES) or value < previous:
                    merged[key] = value
                continue

            if key not in merged:
                merged[key] = value

    return merged


def get_effect_numeric(
    module_like: Any,
    key: str,
    *,
    default: Optional[float] = None,
    strategy: str = "first",
) -> Optional[float]:
    values: List[float] = []
    for effect in get_module_effects(module_like):
        if key not in effect:
            continue
        raw = effect.get(key)
        if isinstance(raw, _NUMERIC_TYPES):
            values.append(float(raw))
            continue
        try:
            values.append(float(raw))
        except Exception:
            continue

    if not values:
        return default

    mode = str(strategy or "first").lower()
    if mode == "sum":
        return float(sum(values))
    if mode == "max":
        return float(max(values))
    if mode == "min":
        return float(min(values))
    return float(values[0])


def module_effect_fields(module_like: Any) -> Dict[str, Any]:
    effects = get_module_effects(module_like)
    return {
        "subtype": get_module_subtype(module_like),
        "effects": effects,
    }
