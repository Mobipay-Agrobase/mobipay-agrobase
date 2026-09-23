#!/usr/bin/env python3
"""Bracket balance checker for new EKiBBO screen files."""

import os
import sys


def check_balance(path: str) -> tuple[bool, str]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
    except OSError as e:
        return False, f"cannot read: {e}"

    pairs = {")": "(", "]": "[", "}": "{"}
    opens = {"(", "[", "{"}
    stack = []
    i = 0
    n = len(text)
    line = 1
    col = 1
    state = "code"

    def advance():
        nonlocal i, line, col
        i += 1
        if i < n and text[i - 1] == "\n":
            line += 1
            col = 1
        else:
            col += 1

    while i < n:
        c = text[i]
        if state == "code":
            if c == "/" and i + 1 < n and text[i + 1] == "/":
                state = "line_comment"
                advance(); advance()
                continue
            if c == "/" and i + 1 < n and text[i + 1] == "*":
                state = "block_comment"
                advance(); advance()
                continue
            if c == "r" and i + 1 < n and text[i + 1] == "'":
                state = "raw"
                advance(); advance()
                continue
            if c == "r" and i + 1 < n and text[i + 1] == '"':
                state = "raw_d"
                advance(); advance()
                continue
            if c == "'":
                if i + 2 < n and text[i + 1] == "'" and text[i + 2] == "'":
                    state = "triple_s"
                    advance(); advance(); advance()
                    continue
                state = "single"
                advance()
                continue
            if c == '"':
                if i + 2 < n and text[i + 1] == '"' and text[i + 2] == '"':
                    state = "triple_d"
                    advance(); advance(); advance()
                    continue
                state = "double"
                advance()
                continue
            if c in opens:
                stack.append((c, line, col))
                advance()
                continue
            if c in pairs:
                if not stack or stack[-1][0] != pairs[c]:
                    return False, f"unbalanced '{c}' at line {line}:{col}"
                stack.pop()
                advance()
                continue
            advance()
            continue

        if state == "single":
            if c == "\\":
                advance(); advance()
                continue
            if c == "'":
                state = "code"
                advance()
                continue
            advance()
            continue

        if state == "double":
            if c == "\\":
                advance(); advance()
                continue
            if c == '"':
                state = "code"
                advance()
                continue
            advance()
            continue

        if state == "raw":
            if c == "'":
                state = "code"
                advance()
                continue
            advance()
            continue

        if state == "raw_d":
            if c == '"':
                state = "code"
                advance()
                continue
            advance()
            continue

        if state == "triple_s":
            if c == "'" and i + 2 < n and text[i + 1] == "'" and text[i + 2] == "'":
                state = "code"
                advance(); advance(); advance()
                continue
            advance()
            continue

        if state == "triple_d":
            if c == '"' and i + 2 < n and text[i + 1] == '"' and text[i + 2] == '"':
                state = "code"
                advance(); advance(); advance()
                continue
            advance()
            continue

        if state == "line_comment":
            if c == "\n":
                state = "code"
            advance()
            continue

        if state == "block_comment":
            if c == "*" and i + 1 < n and text[i + 1] == "/":
                state = "code"
                advance(); advance()
                continue
            advance()
            continue

    if stack:
        last = stack[-1]
        return False, f"unclosed '{last[0]}' opened at line {last[1]}:{last[2]}"
    if state != "code":
        return False, f"unterminated {state} string at end of file"
    return True, "OK"


def main():
    # Resolve paths relative to the script's own location so the checker works
    # from any clone directory (the original project lives at
    # /home/z/my-project/mobipay-ekibbo, this clone at
    # /home/z/my-project/p4-clone/mobipay-ekibbo).
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base = os.path.join(script_dir, "lib")
    files = [
        "screens/shell/main_shell.dart",
        "screens/crops/crops_list_screen.dart",
        "screens/trainings/training_form_screen.dart",
        "screens/trainings/trainings_list_screen.dart",
        "screens/dashboard/breakdowns_dashboard_screen.dart",
        "screens/dashboard/views/dashboard_screen.dart",
        "screens/profile/profile_screen.dart",
        "screens/settings/settings_screen.dart",
        "routes/routes_manager.dart",
        "data/api_client.dart",
        # Screens 13-18
        "screens/procurement/procurement_list_screen.dart",
        "screens/transactions/transactions_list_screen.dart",
        "screens/qr_scan/qr_scan_screen.dart",
        "screens/settings/sync_screen.dart",
        "screens/farmers/farmer_photo_upload_screen.dart",
        "screens/vehicles/vehicles_list_screen.dart",
    ]
    all_ok = True
    for rel in files:
        path = os.path.join(base, rel)
        ok, msg = check_balance(path)
        status = "OK " if ok else "FAIL"
        print(f"  [{status}] {rel}: {msg}")
        if not ok:
            all_ok = False

    arb_path = os.path.join(base, "l10n/app_en.arb")
    try:
        import json
        with open(arb_path, "r", encoding="utf-8") as f:
            json.load(f)
        print(f"  [OK ] l10n/app_en.arb: valid JSON")
    except Exception as e:
        print(f"  [FAIL] l10n/app_en.arb: invalid JSON — {e}")
        all_ok = False

    print()
    print("RESULT:", "ALL OK" if all_ok else "FAILURES DETECTED")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
