#!/usr/bin/env python
"""Check and compile gettext catalogs without external msgfmt.

Usage:
    python scripts/i18n_sync.py --check
    python scripts/i18n_sync.py --compile
    python scripts/i18n_sync.py --compile --check
"""

from __future__ import annotations

import argparse
import ast
import re
import struct
import sys
from pathlib import Path


MSGSTR_RE = re.compile(r"^msgstr(?:\[(\d+)\])?\s+(.*)$")
MO_MAGIC = 0x950412DE


def _parse_po_string(raw: str, po_path: Path, lineno: int) -> str:
    try:
        value = ast.literal_eval(raw)
    except Exception as exc:
        raise ValueError(f"{po_path}:{lineno}: invalid po string: {raw}") from exc
    if not isinstance(value, str):
        raise ValueError(f"{po_path}:{lineno}: expected string literal")
    return value


def parse_po_messages(po_path: Path) -> dict[str, str]:
    messages: dict[str, str] = {}

    msgctxt: str | None = None
    msgid: str | None = None
    msgid_plural: str | None = None
    msgstr_map: dict[int, str] = {}
    fuzzy = False
    section: str | None = None
    section_index = 0

    def reset_entry() -> None:
        nonlocal msgctxt, msgid, msgid_plural, msgstr_map, fuzzy, section, section_index
        msgctxt = None
        msgid = None
        msgid_plural = None
        msgstr_map = {}
        fuzzy = False
        section = None
        section_index = 0

    def flush_entry() -> None:
        nonlocal msgctxt, msgid, msgid_plural, msgstr_map, fuzzy
        if msgid is None:
            reset_entry()
            return

        if fuzzy and msgid != "":
            reset_entry()
            return

        key = msgid
        value = ""

        if msgid_plural is not None:
            if msgstr_map:
                max_index = max(msgstr_map.keys())
                forms = [msgstr_map.get(i, "") for i in range(max_index + 1)]
                if any(forms):
                    key = f"{msgid}\x00{msgid_plural}"
                    value = "\x00".join(forms)
        else:
            value = msgstr_map.get(0, "")

        if value:
            if msgctxt:
                key = f"{msgctxt}\x04{key}"
            messages[key] = value

        reset_entry()

    lines = po_path.read_text(encoding="utf-8").splitlines()
    for lineno, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()

        if not line:
            flush_entry()
            continue

        if line.startswith("#,") and "fuzzy" in line:
            fuzzy = True
            continue
        if line.startswith("#"):
            continue

        if line.startswith("msgctxt "):
            section = "msgctxt"
            msgctxt = _parse_po_string(line[len("msgctxt ") :].strip(), po_path, lineno)
            continue

        if line.startswith("msgid_plural "):
            section = "msgid_plural"
            msgid_plural = _parse_po_string(
                line[len("msgid_plural ") :].strip(), po_path, lineno
            )
            continue

        if line.startswith("msgid "):
            if msgid is not None:
                flush_entry()
            section = "msgid"
            msgid = _parse_po_string(line[len("msgid ") :].strip(), po_path, lineno)
            continue

        if line.startswith("msgstr"):
            match = MSGSTR_RE.match(line)
            if not match:
                raise ValueError(f"{po_path}:{lineno}: malformed msgstr line")
            section = "msgstr"
            section_index = int(match.group(1) or 0)
            msgstr_map[section_index] = _parse_po_string(
                match.group(2).strip(), po_path, lineno
            )
            continue

        if line.startswith('"'):
            chunk = _parse_po_string(line, po_path, lineno)
            if section == "msgctxt":
                msgctxt = (msgctxt or "") + chunk
                continue
            if section == "msgid":
                msgid = (msgid or "") + chunk
                continue
            if section == "msgid_plural":
                msgid_plural = (msgid_plural or "") + chunk
                continue
            if section == "msgstr":
                msgstr_map[section_index] = msgstr_map.get(section_index, "") + chunk
                continue
            raise ValueError(f"{po_path}:{lineno}: stray string line")

        raise ValueError(f"{po_path}:{lineno}: unsupported po line: {line}")

    flush_entry()
    return messages


def compile_messages_to_mo(messages: dict[str, str], mo_path: Path) -> None:
    ids = b""
    strs = b""
    offsets: list[tuple[int, int, int, int]] = []

    for msgid, msgstr in sorted(messages.items()):
        msgid_bytes = msgid.encode("utf-8")
        msgstr_bytes = msgstr.encode("utf-8")
        offsets.append((len(ids), len(msgid_bytes), len(strs), len(msgstr_bytes)))
        ids += msgid_bytes + b"\0"
        strs += msgstr_bytes + b"\0"

    n = len(offsets)
    key_table_start = 7 * 4
    value_table_start = key_table_start + n * 8
    ids_start = value_table_start + n * 8
    strs_start = ids_start + len(ids)

    key_table: list[int] = []
    value_table: list[int] = []
    for id_off, id_len, str_off, str_len in offsets:
        key_table.extend([id_len, id_off + ids_start])
        value_table.extend([str_len, str_off + strs_start])

    output = struct.pack(
        "<Iiiiiii",
        MO_MAGIC,
        0,
        n,
        key_table_start,
        value_table_start,
        0,
        0,
    )

    if key_table:
        output += struct.pack("<%di" % len(key_table), *key_table)
        output += struct.pack("<%di" % len(value_table), *value_table)

    output += ids
    output += strs

    mo_path.parent.mkdir(parents=True, exist_ok=True)
    mo_path.write_bytes(output)


def iter_po_files(locale_root: Path) -> list[Path]:
    return sorted(locale_root.glob("*/LC_MESSAGES/*.po"))


def mo_for_po(po_path: Path) -> Path:
    return po_path.with_suffix(".mo")


def stale_reason(po_path: Path, mo_path: Path) -> str | None:
    if not mo_path.exists():
        return "missing .mo"
    if mo_path.stat().st_mtime < po_path.stat().st_mtime:
        return ".mo older than .po"
    return None


def run_compile(po_files: list[Path], force: bool) -> int:
    compiled = 0
    skipped = 0
    for po_path in po_files:
        mo_path = mo_for_po(po_path)
        reason = stale_reason(po_path, mo_path)
        if reason is None and not force:
            skipped += 1
            continue

        messages = parse_po_messages(po_path)
        compile_messages_to_mo(messages, mo_path)
        compiled += 1
        print(f"compiled: {po_path} -> {mo_path}")

    print(f"i18n compile: {compiled} compiled, {skipped} skipped")
    return 0


def run_check(po_files: list[Path]) -> int:
    stale: list[tuple[Path, str]] = []
    for po_path in po_files:
        mo_path = mo_for_po(po_path)
        reason = stale_reason(po_path, mo_path)
        if reason:
            stale.append((po_path, reason))

    if not stale:
        print("i18n check: OK (all catalogs up to date)")
        return 0

    print("i18n check: FAILED")
    for po_path, reason in stale:
        print(f"- {po_path} ({reason})")
    print("Run: python scripts/i18n_sync.py --compile")
    return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Check and compile gettext catalogs.")
    parser.add_argument(
        "--locale-root",
        default="locale",
        help="Root locale directory (default: locale)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check only. Exit 1 when catalogs are missing or stale.",
    )
    parser.add_argument(
        "--compile",
        action="store_true",
        help="Compile missing or stale catalogs.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Compile all catalogs even if up to date.",
    )
    return parser


def main(argv: list[str]) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    locale_root = Path(args.locale_root)
    if not locale_root.exists():
        print(f"Locale root does not exist: {locale_root}")
        return 1

    po_files = iter_po_files(locale_root)
    if not po_files:
        print(f"No .po files found under: {locale_root}")
        return 1

    should_compile = args.compile or not args.check
    if should_compile:
        code = run_compile(po_files, force=args.force)
        if code != 0:
            return code

    if args.check:
        return run_check(po_files)

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))


