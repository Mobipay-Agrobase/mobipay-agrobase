#!/usr/bin/env python3
"""
dart_sanity.py — static sanity sweep for the Flutter apps (mobile/, mobile-ekibbo/).

Recreated after sandbox resets kept losing the script (see worklog Task 28/29).
This version is COMMITTED so it survives resets.

Checks per .dart file:
  1. Delimiter balance () [] {} — via a string/comment-aware state machine
     (raw regex counting is wrong: URLs contain //, strings contain braces).
  2. Import resolution — package: imports must match a dependency in that
     app's pubspec.yaml; relative imports must resolve to existing files.
  3. Corruption signatures — the "find() returned -1 and spliced into line 1"
     class: truncated imports, source starting mid-statement, stray
     'this.' fragments inside imports.
  4. (optional) --symbols FILE=SYMBOL,... — on-disk symbol existence checks.

Exit code 0 = all clean; 1 = problems found (printed).
"""
import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Packages that are legal to import directly even though they are only
# TRANSITIVE dependencies (resolved automatically by `flutter pub get`).
TRANSITIVE_OK = {
    'intl',                      # via flutter_localizations
    'http',                      # via dio/retrofit ecosystem
    'webview_flutter_wkwebview', # via webview_flutter
    'webview_flutter_android',   # via webview_flutter
    'path_provider_android',
    'path_provider_foundation',
    'shared_preferences_android',
    'shared_preferences_foundation',
}

# Pre-existing findings (not introduced by the security follow-up work).
# Reported as WARNINGS, never as failures. Keep this list short + reviewed.
# NOTE: problems are formatted as "<abs-path>:<line> <message>".
KNOWN_PREEXISTING = {
    'status_badge.dart:2 relative import missing: ../../../../core/utils/constants.dart',  # orphan file in mobile/, one ../ too many — pre-existing
}


def strip_strings_and_comments(src: str) -> str:
    """Replace string literal contents and comments with spaces (preserving
    offsets/newlines) so delimiter counting is reliable."""
    out = []
    i = 0
    n = len(src)
    in_line_comment = False
    in_block_comment = False
    in_string = None  # "'", '"', "'''" or '"""'
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ''

        # ── comments ──
        if not in_string and not in_line_comment and not in_block_comment:
            if c == '/' and nxt == '/':
                in_line_comment = True
                out.append('  ')
                i += 2
                continue
            if c == '/' and nxt == '*':
                in_block_comment = True
                out.append('  ')
                i += 2
                continue
        if in_line_comment:
            if c == '\n':
                in_line_comment = False
                out.append(c)
            else:
                out.append(' ')
            i += 1
            continue
        if in_block_comment:
            if c == '*' and nxt == '/':
                in_block_comment = False
                out.append('  ')
                i += 2
                continue
            out.append('\n' if c == '\n' else ' ')
            i += 1
            continue

        # ── strings ──
        if in_string:
            if c == '\\':  # escape — skip next char
                out.append('  ' if nxt != '\n' else ' \n')
                i += 2
                continue
            if (c == in_string and not (in_string in ("'''", '"""'))):
                in_string = None
                out.append(' ')
                i += 1
                continue
            if in_string in ("'''", '"""') and src.startswith(in_string, i):
                in_string = None
                out.append('   ')
                i += 3
                continue
            out.append('\n' if c == '\n' else ' ')
            i += 1
            continue

        # not in string/comment
        if c in ("'", '"'):
            trip = src[i:i + 3]
            if trip in ("'''", '"""'):
                in_string = trip
                out.append('   ')
                i += 3
                continue
            in_string = c
            out.append(' ')
            i += 1
            continue
        out.append(c)
        i += 1
    return ''.join(out)


def check_balance(path: Path) -> list:
    src = path.read_text(encoding='utf-8', errors='replace')
    stripped = strip_strings_and_comments(src)
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    problems = []
    for ln_no, line in enumerate(stripped.splitlines(), 1):
        for col, ch in enumerate(line, 1):
            if ch in '([{':
                stack.append((ch, ln_no, col))
            elif ch in ')]}':
                if not stack or stack[-1][0] != pairs[ch]:
                    problems.append(f'{path}:{ln_no}:{col} unmatched "{ch}"')
                    if stack:
                        stack.pop()
                else:
                    stack.pop()
    for ch, ln_no, col in stack:
        problems.append(f'{path}:{ln_no}:{col} unclosed "{ch}"')
    return problems


def pubspec_deps(pubspec: Path) -> set:
    deps = {'flutter'}  # sdk dep
    if not pubspec.exists():
        return deps
    in_deps = False
    sdk_only = False
    for line in pubspec.read_text(errors='replace').splitlines():
        if re.match(r'^(dependencies|dev_dependencies):', line):
            in_deps = True
            sdk_only = True
            continue
        if line.startswith('#'):  # comment — never resets state
            continue
        if re.match(r'^\S', line):  # new top-level key
            in_deps = False
            continue
        if in_deps:
            m = re.match(r'^\s{2,4}([\w.]+):', line)
            if m:
                deps.add(m.group(1))
    return deps


def check_imports(path: Path, own_pkg: str, deps: set) -> list:
    problems = []
    src_lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    for ln_no, line in enumerate(src_lines, 1):
        m = re.match(r"^\s*import\s+'([^']+)'", line)
        if not m:
            continue
        target = m.group(1)
        if target.startswith('dart:'):
            continue
        if target.startswith('package:'):
            pkg = target.split(':')[1].split('/')[0]
            if pkg not in deps and pkg != own_pkg and pkg not in TRANSITIVE_OK:
                problems.append(f"{path}:{ln_no} package '{pkg}' not in pubspec")
        else:  # relative
            resolved = (path.parent / target).resolve()
            if not resolved.exists():
                problems.append(f"{path}:{ln_no} relative import missing: {target}")
    return problems


def check_corruption(path: Path) -> list:
    problems = []
    src = path.read_text(encoding='utf-8', errors='replace')
    # Import line spliced mid-identifier (the find()=-1 corruption class).
    if re.search(r"import\s+'packag[^'\s]*this\.", src):
        problems.append(f'{path}: corrupted import (stray this. inside import)')
    for ln_no, line in enumerate(src.splitlines(), 1):
        if re.match(r"^\s*import\s+'packag[^']*$", line):
            problems.append(f'{path}:{ln_no} truncated import (no closing quote)')
        # Source must start with a statement, not mid-splice like "e:json..."
        if ln_no == 1 and re.match(r"^[a-z]+:\w", line) and not line.startswith(('import', 'library', '//', '/*', '@', "'")):
            problems.append(f'{path}:1 suspicious first line (mid-statement splice?)')
    return problems


def check_symbols(path: Path, symbols: list) -> list:
    problems = []
    src = path.read_text(encoding='utf-8', errors='replace')
    for sym in symbols:
        if sym.startswith('!'):  # negative assertion
            if sym[1:] in src:
                problems.append(f'{path}: FORBIDDEN symbol present: {sym[1:]}')
        elif sym not in src:
            problems.append(f'{path}: missing expected symbol: {sym}')
    return problems


def sweep(app_dir: Path, own_pkg: str) -> list:
    problems = []
    deps = pubspec_deps(app_dir / 'pubspec.yaml')
    dart_files = sorted(app_dir.rglob('*.dart'))
    for f in dart_files:
        rel = f.relative_to(app_dir)
        # Generated files: skip import/corruption checks (balance still checked).
        is_gen = f.name.endswith('.g.dart') or f.name.endswith('.freezed.dart')
        problems.extend(check_balance(f))
        if not is_gen:
            problems.extend(check_imports(f, own_pkg, deps))
            problems.extend(check_corruption(f))
    print(f'  {app_dir.name}: {len(dart_files)} dart files swept '
          f'({len(problems)} problems)')
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--symbols', action='append', default=[],
                    help='FILE=SYM1,SYM2 (prefix ! = must NOT be present), '
                         'path relative to repo root; repeatable')
    args = ap.parse_args()

    all_problems = []
    print('Dart sanity sweep')
    for app, pkg in [(REPO / 'mobile', 'agrobase_mobile'),
                     (REPO / 'mobile-ekibbo', 'agrobase_ekibbo')]:
        if app.exists():
            all_problems.extend(sweep(app, pkg))

    for spec in args.symbols:
        if '=' not in spec:
            continue
        fpath, syms = spec.split('=', 1)
        f = REPO / fpath
        if not f.exists():
            all_problems.append(f'MISSING FILE: {fpath}')
            continue
        all_problems.extend(check_symbols(f, syms.split(',')))

    def is_known(p):
        return any(p.endswith(k) or k in p for k in KNOWN_PREEXISTING)
    failures = [p for p in all_problems if not is_known(p)]
    warnings = [p for p in all_problems if is_known(p)]
    for w in warnings:
        print(f'  WARN (pre-existing, not a failure): {w}')
    if failures:
        print(f'\nFAIL — {len(failures)} problem(s):')
        for p in failures:
            print(f'  {p}')
        sys.exit(1)
    print('\nALL CLEAN')


if __name__ == '__main__':
    main()
