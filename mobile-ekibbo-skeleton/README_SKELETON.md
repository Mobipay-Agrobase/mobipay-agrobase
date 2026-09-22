# mobile-ekibbo-skeleton (Original Source from Terratech-VN/fa-upstream-mobile)

> **STATUS: This is the upstream skeleton — NOT the expanded EKiBBO app you have locally.**

This folder contains the **original source code** from the public/private repo
[`Terratech-VN/fa-upstream-mobile`](https://github.com/Terratech-VN/fa-upstream-mobile)
(app name: "Farm Angel Upstream Mobile" — package: `upstream`).

It's the **base skeleton** that someone forked and expanded into the
full EKiBBO app. The expanded version (with plots, crops, procurement,
transactions, 9-tab farmer form, etc.) exists only on your Mac and has
**NOT been shared with me**.

## What's in this skeleton

```
mobile-ekibbo-skeleton/
├── README_UPSTREAM_ORIGINAL.md        ← original repo's README
├── analysis_options.yaml
├── l10n.yaml                            ← Flutter l10n config (output → lib/l10n/app_localizations.dart)
├── pubspec.yaml                         ← upstream package, Dart 3.0.3+
├── pubspec.lock
├── assets/                              ← WorkSans + Quicksand fonts, dashboard_bg.png, logo_fa.png, SVG icons
├── lib/
│   ├── main.dart                        ← entry point, MaterialApp with onGenerateRoute
│   ├── routes/
│   │   └── routes_manager.dart          ← custom RoutesManager (NOT go_router)
│   ├── components/                      ← reusable UI components
│   │   ├── app_button.dart
│   │   ├── app_dropdown_button.dart     ← used for role selection on login
│   │   ├── app_form_field.dart
│   │   ├── g_image.dart                 ← image helper (asset + network)
│   │   ├── my_app_bar.dart
│   │   ├── option_bottom_dialog.dart
│   │   └── radio_button.dart
│   ├── constant/
│   │   ├── color_constant.dart
│   │   └── text_style_constant.dart
│   ├── l10n/
│   │   ├── app_en.arb                   ← 23 English translation keys
│   │   └── app_lang.dart                ← AppLang.local helper
│   └── screens/
│       ├── login/
│       │   ├── model/user_role.dart     ← enum: admin / fieldOfficer / farmer
│       │   └── views/login_screen.dart  ← role-based login screen
│       ├── dashboard/views/
│       │   └── dashboard_screen.dart    ← dashboard with bg image + summary cards
│       └── farmer_registration/views/
│           └── farmer_registration_screen.dart  ← multi-section farmer form
├── android/                             ← Android project config
├── ios/                                 ← iOS project config
├── linux/, macos/, web/, windows/       ← desktop/web platforms
└── test/
```

## What the skeleton HAS (vs the expanded EKiBBO app on your Mac)

| Feature | This skeleton (fa-upstream-mobile) | Expanded EKiBBO (your local zip) |
|---------|------------------------------------|----------------------------------|
| Login with role selection (Admin / Field Officer / Farmer) | ✅ | ✅ |
| Dashboard (Total Farmers, Hectares, Yield, map bg) | ✅ (basic) | ✅ (more complete) |
| Farmer Registration form (Basic Info, Farmer Info, Contact Info) | ✅ (3 sections) | ✅ (9 tabs) |
| Plots module | ❌ | ✅ |
| Crops module (cultivated area, harvest, sale, insurance) | ❌ | ✅ |
| Procurement module (distribution, QC, reception) | ❌ | ✅ |
| Transactions module (calendar, revenue) | ❌ | ✅ |
| Vehicle management (driver, capacity, license) | ❌ | ✅ |
| Settings (language, sync, sign out) | ❌ | ✅ |
| Profile tab with 9 sub-tabs (Bank, Insurance, Equipment, Animal Husbandry, etc.) | ❌ | ✅ |
| QR Scan | ❌ | ✅ |
| i18n keys (English .arb) | 23 | 299 |
| State management | flutter_bloc | (unknown — code not seen) |
| Vietnamese localization | ❌ (English only) | ✅ (was there, now removed per user) |
| google_maps_flutter | ❌ | ✅ (per GeneratedPluginRegistrant) |
| image_picker | ❌ | ✅ |
| sqflite (local DB) | ❌ | ✅ |
| webview_flutter | ❌ | ✅ |
| url_launcher | ❌ | ✅ |

## Tech stack of the skeleton

- **Dart**: `>=3.0.3 <4.0.0`
- **Flutter**: latest 3.x compatible
- **State management**: `flutter_bloc: ^8.1.3`
- **Routing**: custom `RoutesManager.onGenerateRoute` (NOT go_router)
- **i18n**: `flutter_localizations` + `intl: ^0.18.0` + `flutter gen-l10n` (ARB-based)
- **Fonts**: WorkSans (4 weights) + Quicksand (2 weights) — bundled in `assets/fonts/`
- **Images**: SVG icons (`flutter_svg: ^2.0.7`), PNG backgrounds, network image caching (`cached_network_image`)
- **No backend integration**: this skeleton has NO API client, NO auth tokens, NO data layer — it's pure UI mockup. The expanded EKiBBO app on your Mac added all of that.

## Important — the "real" mobile-ekibbo source is still missing

The 276 i18n keys present in your local zip but absent from this skeleton
represent real features someone built. To recover those features, we need
the actual Dart source from your local `~/Documents/Project/MobiPay/mobile-ekibbo/`
folder — not just the i18n files.

Please re-zip from your local `mobile-ekibbo/` folder using:

```bash
cd ~/Documents/Project/MobiPay/mobile-ekibbo
zip -r mobile-ekibbo-actual.zip \
  lib \
  pubspec.yaml \
  pubspec.lock \
  android/app \
  android/gradle.properties \
  android/local.properties \
  android/settings.gradle \
  android/build.gradle \
  android/build.gradle.kts \
  ios/Runner \
  ios/Runner.xcodeproj \
  test \
  analysis_options.yaml \
  l10n.yaml \
  2>/dev/null
```

Note: the previous `zip` command you ran reported `name not matched: pubspec.yaml` —
that's the smoking gun. A real Flutter project ALWAYS has `pubspec.yaml` at the
project root. If `find ~/path/to/mobile-ekibbo -name pubspec.yaml` returns
nothing, then your local `mobile-ekibbo/` folder is ALSO just the i18n leftovers
from the earlier Archive.zip extraction — the real source is somewhere else.

## What we can do RIGHT NOW with this skeleton

Even without the expanded source, this skeleton gives us:

1. **The role-based login screen** (`lib/screens/login/views/login_screen.dart`)
   - Admin / Field Officer / Farmer role dropdown
   - Phone number + password fields
   - "Sign In" button + "Forgot Password?" link
2. **The dashboard scaffold** (`lib/screens/dashboard/views/dashboard_screen.dart`)
   - Background image header
   - Summary cards layout
3. **The farmer registration form pattern** (`lib/screens/farmer_registration/views/farmer_registration_screen.dart`)
   - Multi-section form pattern (Basic Info, Farmer Info, Contact Info)
4. **Reusable components** (`lib/components/`)
   - AppButton, AppDropdownButton, AppFormField, GImage, MyAppBar, etc.
5. **Design system** (`lib/constant/`)
   - ColorConstant, TextStyleConstant (Quicksand + WorkSans font stack)

If we can't recover the expanded source, we can rebuild the full app from
this skeleton + the 299 i18n keys (which tell us every screen and feature
that needs to exist).

## Decision needed from the user

**Option A** — Find the real expanded source on your Mac (preferred).
Run these commands to locate it:
```bash
find ~ -name "pubspec.yaml" -exec grep -l "flutter" {} \; 2>/dev/null
find ~ -name "login_screen.dart" -path "*/login/*" 2>/dev/null
find ~ -name "user_role.dart" 2>/dev/null
```

**Option B** — Rebuild the full app from this skeleton + the 299 i18n keys.
Estimated effort: 2–3 days of work. We'd lose:
- Exact visual design (colors, layouts, custom widgets)
- Any business logic that's not visible from the i18n keys
- API contracts (we'd need to re-derive them from the Next.js backend)

**Option C** — Stick with the current `mobile/` Flutter app (the one I've
been working on). It works, just doesn't have the role-based login flow.

Please let me know which option you prefer.

---

Source: cloned from `https://github.com/Terratech-VN/fa-upstream-mobile.git`
(branch: `main`, commit: latest as of 2026-09-20).
