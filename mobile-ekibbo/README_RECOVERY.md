# mobile-ekibbo (Original Source — Partial Recovery)

> ⚠️ **STATUS: INCOMPLETE — needs source code re-share**

This folder contains the **partial** source code of the original mobile-ekibbo
Flutter app. The `Archive.zip` provided on 2026-09-19 only contained 3
localization files (English + Vietnamese) plus Flutter build artifacts
(`GeneratedPluginRegistrant.java/.h/.m`). The actual Dart source code
(login screen, dashboard, farmer form, plot form, etc.) was **NOT included**
in the zip — likely because the zip was created by selecting only the
`lib/domain/l10n/` folder instead of the full `lib/` folder.

## What we have

- `lib/domain/l10n/app_localizations.dart` — base i18n class
- `lib/domain/l10n/app_localizations_en.dart` — 299 English translation keys
- `lib/domain/l10n/app_localizations_vi.dart` — Vietnamese translations
- `android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` — tells us which Flutter plugins were used
- `ios/Runner/GeneratedPluginRegistrant.{h,m}` — iOS plugin registrars

## What the original app looked like (based on i18n keys)

The 299 translation keys give us a clear picture of the app's feature set:

### Login flow
- Login screen with **role selection** (Field Officer / Farmer)
- Phone number + password authentication
- "Forgot password?" link

### Dashboard (Field Officer view)
- Total Farmers
- Total Hectares
- Est Yield Quantity
- Nearby Plots (with map)
- All Tasks / Today Tasks / View All Tasks
- QR Scan (for scanning farmer ID codes)

### Farmers module
- Farmer list (search farmers, view all farmers, add farmer)
- Farmer profile with tabs:
  - Basic Info (enrollment date/place, farmer code, cooperative, full name, phone, ID proof front/back, date of birth, gender)
  - Contact Info (country, province, district, commune, village, street)
  - Family Info (spouse name, family members, children)
  - Asset Info (consumer electronics, vehicles)
  - Bank Info (account type, account number, bank name, branch, sort code)
  - Insurance Info (social insurance, crop insurance)
  - Farm Equipment (add new equipment, year of manufacture/purchase)
  - Animal Husbandry (animal count, breed name, fodder, animal housing, animal for growth)
  - Certificate Info (certification type, certified farmer)
  - Finance Info (cost information)

### Plots module
- Add plot / View plots / All plots
- Plot name, plot farm location, total land holding, total plot area
- Approach road, GPS pin location

### Crops module
- Add crop / Crop cultivated / Crop variety
- Cultivated area, sowing date, age of crop
- Crop photos, est yield, approx harvest qty, expected harvest date
- Crop harvest (harvest quantity, harvest date)
- Crop sale (sale quantity, sale intentions, price from/to, available date, available stock)
- Pre-harvest quality check
- Crop insurance

### Procurement module
- Procurement list (procurement ID, procurement date, product, quantity, unit, sub_total, total_cost)
- Distribution stocks (distribution ID, distribution detail, available stock, distribution quantity)
- Reception date, transit quantity, transfer quantity, received quantity

### Transactions module
- Transaction calendar (yearly view)
- Transaction date, transaction type, revenue

### Vehicle management
- Driver name, driver phone, vehicle type, vehicle license, vehicle capacity

### Settings
- App language (English / Vietnamese)
- Version, Sign Out
- Sync data, Sync all

## Original Flutter plugin stack (from GeneratedPluginRegistrant)

The original app used these plugins:
- `flutter_localization` (mastertipsy) — for runtime language switching
- `flutter_secure_storage` — for auth token storage
- `google_maps_flutter` — for plot/farm location pinning (maps on dashboard + plot form)
- `image_picker` — for farmer photo + ID proof front/back + crop photos
- `location` (lyokone) — for GPS capture
- `path_provider` — for file paths
- `shared_preferences` — for app settings
- `sqflite` — for local SQLite cache
- `url_launcher` — for opening external links (call farmer, etc.)
- `webview_flutter` — for embedded web content

## Why this matters

This original app design is **fundamentally different** from the current
`mobile/` folder in the repo (which is a Next.js-mirrored Flutter app
using `drift`, `go_router`, `provider`, etc.). The original ekibbo app:

- Uses simpler navigation (no go_router)
- Has a role-based login flow (Field Officer / Farmer) — the current mobile
  app has a single login flow
- Has a Vietnamese localization (the current app is English-only)
- Uses `google_maps_flutter` for maps (the current app uses OpenStreetMap iframes)
- Uses `sqflite` directly (the current app uses `drift` ORM)
- Has procurement + distribution + transaction modules (not in current app)

## Action required

To rebuild this app, the user needs to **re-share the full source code**
in a zip that includes the entire `lib/` folder, not just `lib/domain/l10n/`.

Specifically, please zip and share:
- `lib/main.dart`
- `lib/app.dart` or `lib/router.dart`
- `lib/presentation/login/` (the role-selection login screen)
- `lib/presentation/dashboard/`
- `lib/presentation/farmer/`
- `lib/presentation/plot/`
- `lib/presentation/crop/`
- `lib/presentation/procurement/`
- `lib/presentation/transaction/`
- `lib/data/` (API client + repositories)
- `pubspec.yaml` (so we know the exact dependencies + versions)
- `android/app/build.gradle.kts` or `build.gradle` (for app ID + signing config)

Once we have the full source, we can:
1. Move the current `mobile/` folder aside (rename to `mobile-v3/`)
2. Move `mobile-ekibbo/` to `mobile/`
3. Re-apply the EKiBBO Sheet-3 changes (Physical Features, Access Map, etc.)
  to the original app's farmer/plot forms
4. Add Phase B breakdowns dashboard
5. Add Phase C training form + attendees + file upload
6. Wire the app to the existing Next.js backend at
  https://mobipay-agrobase.vercel.app

## How this zip was processed

- File received: `/home/z/my-project/upload/Archive.zip` (4.6 MB)
- Extracted to: `/home/z/my-project/mobile-ekibbo-extract/`
- Filtered out: `__MACOSX/` (macOS metadata), `.gradle/`, `build/`, `ephemeral/`
- Result: only 3 source files survived (`app_localizations*.dart`)

This README was written on 2026-09-19 by the AI assistant to document what
happened and to preserve the i18n keys + plugin list for the rebuild.
