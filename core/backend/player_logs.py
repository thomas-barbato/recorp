from __future__ import annotations

from copy import deepcopy
from decimal import Decimal, InvalidOperation
from contextlib import nullcontext
from typing import Any, Optional

from django.conf import settings
from django.db import transaction
from django.utils.translation import get_language, gettext as _, override

from core.models import Log, PlayerLog


@transaction.atomic
def create_event_log(
    *,
    players_roles: list[tuple],
    log_type: str,
    payload: dict,
):
    """
    Create one log and attach it to many players with role metadata.

    players_roles = [
        (player_obj, "TRANSMITTER"),
        (player_obj, "RECEIVER"),
        (player_obj, "OBSERVER"),
    ]
    """

    log = Log.objects.create(
        log_type=log_type,
        content=payload,
    )

    PlayerLog.objects.bulk_create(
        [
            PlayerLog(
                player=player,
                log=log,
                role=role,
            )
            for player, role in players_roles
        ]
    )

    return log


def _normalize_language_code(language_code: Optional[str]) -> str:
    raw = (language_code or get_language() or settings.LANGUAGE_CODE or "en").strip().lower()
    if raw.startswith("fr"):
        return "fr"
    return "en"


def _language_ctx(language_code: Optional[str]):
    lang = _normalize_language_code(language_code)
    return override(lang) if lang else nullcontext()


def _as_text(value: Any, default: str) -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def _zone_name(value: Any) -> str:
    return _as_text(value, "-").replace("_", " ").replace("-", " ")


def _event_type(log_type: Optional[str], payload: dict[str, Any]) -> str:
    if isinstance(payload, dict):
        val = payload.get("event")
        if val:
            return str(val).upper()
    return str(log_type or "UNKNOWN").upper()


def _format_amount(value: Any, language_code: Optional[str]) -> str:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        amount = Decimal("0")

    txt = f"{amount:.2f}"
    if _normalize_language_code(language_code) == "fr":
        txt = txt.replace(".", ",")
    return txt


def _event_label(event_type: str, language_code: Optional[str]) -> str:
    with _language_ctx(language_code):

        if event_type in {"BANK_TRANSFER", "BANK_DEPOSIT_TO_ACCOUNT", "BANK_WITHDRAW_TO_SHIP"}:
            return _("Bank")
        if event_type in {"COMBAT_ACTION", "COMBAT_DEATH", "ATTACK"}:
            return _("Combat")
        if event_type == "SCAN":
            return _("Scan")
        if event_type == "ZONE_CHANGE":
            return _("Sector")
        if event_type == "CRAFT":
            return _("Craft")
        if event_type == "RESEARCH":
            return _("Research")
        return _("Log")


def _combat_action_message(
    *,
    payload: dict[str, Any],
    role: str,
    language_code: Optional[str],
) -> str:
    event_type = str(payload.get("combat_event_type") or "").upper()
    source = _as_text(payload.get("source_name"), "Unknown")
    target = _as_text(payload.get("target_name"), "Unknown")
    damage_total = int(payload.get("damage_total") or 0)
    damage_type_raw = str(payload.get("damage_type") or "").upper()
    is_counter = bool(payload.get("is_counter") is True)
    is_critical = bool(payload.get("is_critical") is True)

    with _language_ctx(language_code):
        unknown_label = _("Unknown")
        source = _as_text(payload.get("source_name"), unknown_label)
        target = _as_text(payload.get("target_name"), unknown_label)

        if damage_type_raw == "THERMAL":
            damage_type = _("thermal")
        elif damage_type_raw == "BALLISTIC":
            damage_type = _("ballistic")
        elif damage_type_raw == "MISSILE":
            damage_type = _("missile")
        else:
            damage_type = _("mixed")

        suffix_parts: list[str] = []
        if is_counter:
            suffix_parts.append(_("counterattack"))
        if is_critical:
            suffix_parts.append(_("critical"))
        suffix = f" ({', '.join(suffix_parts)})" if suffix_parts else ""

        if event_type == "ATTACK_HIT":
            if role == "TRANSMITTER":
                return _("You hit %(target)s for %(damage)s %(damage_type)s damage%(suffix)s") % {
                    "target": target,
                    "damage": damage_total,
                    "damage_type": damage_type,
                    "suffix": suffix,
                }
            if role == "RECEIVER":
                return _("%(source)s hit you for %(damage)s %(damage_type)s damage%(suffix)s") % {
                    "source": source,
                    "damage": damage_total,
                    "damage_type": damage_type,
                    "suffix": suffix,
                }
            return _("%(source)s hit %(target)s for %(damage)s %(damage_type)s damage%(suffix)s") % {
                "source": source,
                "target": target,
                "damage": damage_total,
                "damage_type": damage_type,
                "suffix": suffix,
            }

        if event_type == "ATTACK_MISS":
            if role == "TRANSMITTER":
                return _("You attacked %(target)s but missed%(suffix)s") % {
                    "target": target,
                    "suffix": suffix,
                }
            if role == "RECEIVER":
                return _("%(source)s attacked you but missed%(suffix)s") % {
                    "source": source,
                    "suffix": suffix,
                }
            return _("%(source)s attacked %(target)s but missed%(suffix)s") % {
                "source": source,
                "target": target,
                "suffix": suffix,
            }

        if event_type == "ATTACK_EVADED":
            if role == "TRANSMITTER":
                return _("You attacked %(target)s but the target evaded%(suffix)s") % {
                    "target": target,
                    "suffix": suffix,
                }
            if role == "RECEIVER":
                return _("%(source)s attacked you but you evaded%(suffix)s") % {
                    "source": source,
                    "suffix": suffix,
                }
            return _("%(source)s attacked %(target)s but the target evaded%(suffix)s") % {
                "source": source,
                "target": target,
                "suffix": suffix,
            }

        return _("Combat")


def _event_message(
    *,
    event_type: str,
    payload: dict[str, Any],
    role: Optional[str],
    viewer_player_id: Optional[int],
    language_code: Optional[str],
) -> str:
    role_u = str(role or "").upper()

    with _language_ctx(language_code):
        if event_type == "ZONE_CHANGE":
            from_name = _zone_name(payload.get("from"))
            to_name = _zone_name(payload.get("to"))
            if from_name != "-" and to_name != "-":
                return _("Sector change: %(from)s -> %(to)s") % {
                    "from": from_name,
                    "to": to_name,
                }
            return _("Sector change")

        if event_type == "SCAN":
            unknown_label = _("Unknown")
            author = _as_text(payload.get("author"), unknown_label)
            target = _as_text(payload.get("target"), unknown_label)
            if role_u == "TRANSMITTER":
                return _("You scanned %(target)s") % {"target": target}
            if role_u == "RECEIVER":
                return _("%(author)s scanned you") % {"author": author}
            return _("%(author)s scanned %(target)s") % {
                "author": author,
                "target": target,
            }

        if event_type == "ATTACK":
            unknown_label = _("Unknown")
            author = _as_text(payload.get("author"), unknown_label)
            target = _as_text(payload.get("target"), unknown_label)
            if role_u == "TRANSMITTER":
                return _("You attacked %(target)s") % {"target": target}
            if role_u == "RECEIVER":
                return _("%(author)s attacked you") % {"author": author}
            return _("%(author)s attacked %(target)s") % {
                "author": author,
                "target": target,
            }

        if event_type == "COMBAT_ACTION":
            return _combat_action_message(payload=payload, role=role_u, language_code=language_code)

        if event_type == "COMBAT_DEATH":
            unknown_label = _("Unknown")
            dead = _as_text(payload.get("dead"), unknown_label)
            killer = _as_text(payload.get("killer"), unknown_label)
            dead_key = str(payload.get("dead_key") or "")
            local_dead_key = f"pc_{int(viewer_player_id)}" if viewer_player_id else ""
            if role_u == "RECEIVER" or (local_dead_key and dead_key == local_dead_key):
                return _("You were killed by %(killer)s") % {"killer": killer}
            return _("%(dead)s was killed by %(killer)s") % {
                "dead": dead,
                "killer": killer,
            }

        if event_type == "BANK_TRANSFER":
            amount = _format_amount(payload.get("amount"), language_code)
            unknown_label = _("Unknown")
            sender = _as_text(payload.get("sender_name") or payload.get("author"), unknown_label)
            recipient = _as_text(payload.get("recipient_name") or payload.get("target"), unknown_label)
            if role_u == "TRANSMITTER":
                return _("You transferred %(amount)s credits to %(recipient)s") % {
                    "amount": amount,
                    "recipient": recipient,
                }
            if role_u == "RECEIVER":
                return _("You received %(amount)s credits from %(sender)s") % {
                    "amount": amount,
                    "sender": sender,
                }
            return _("%(sender)s transferred %(amount)s credits to %(recipient)s") % {
                "sender": sender,
                "amount": amount,
                "recipient": recipient,
            }

        if event_type == "BANK_DEPOSIT_TO_ACCOUNT":
            amount = _format_amount(payload.get("amount"), language_code)
            return _("You deposited %(amount)s credits to your account") % {
                "amount": amount,
            }

        if event_type == "BANK_WITHDRAW_TO_SHIP":
            amount = _format_amount(payload.get("amount"), language_code)
            return _("You withdrew %(amount)s credits to your ship") % {
                "amount": amount,
            }

        author = payload.get("author")
        target = payload.get("target")
        if author and target:
            return _("%(author)s -> %(target)s") % {
                "author": str(author),
                "target": str(target),
            }

        if payload.get("raw") is not None:
            return _("Log: %(raw)s") % {"raw": str(payload.get("raw"))}

        return _("Unknown log (%(event)s)") % {"event": event_type or "UNKNOWN"}


def enrich_event_log_content(
    *,
    log_type: Optional[str],
    role: Optional[str],
    content: Any,
    viewer_player_id: Optional[int] = None,
    language_code: Optional[str] = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = deepcopy(content) if isinstance(content, dict) else {}
    event_type = _event_type(log_type, payload)

    payload["translated_label"] = _event_label(event_type, language_code)
    payload["translated_message"] = _event_message(
        event_type=event_type,
        payload=payload,
        role=role,
        viewer_player_id=viewer_player_id,
        language_code=language_code,
    )
    return payload


def serialize_event_log_data(
    *,
    log_id: Any,
    log_type: Optional[str],
    role: Optional[str],
    content: Any,
    created_at: Any,
    viewer_player_id: Optional[int] = None,
    language_code: Optional[str] = None,
) -> dict[str, Any]:
    if hasattr(created_at, "isoformat"):
        created_value = created_at.isoformat()
    elif created_at is None:
        created_value = None
    else:
        created_value = str(created_at)

    return {
        "id": log_id,
        "log_type": log_type,
        "role": role,
        "content": enrich_event_log_content(
            log_type=log_type,
            role=role,
            content=content,
            viewer_player_id=viewer_player_id,
            language_code=language_code,
        ),
        "created_at": created_value,
    }
