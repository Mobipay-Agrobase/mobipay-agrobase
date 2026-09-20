# mobipay-ekibbo

> **EKiBBO Agrobase** — Coffee exporter field officer & farmer app for Uganda
>
> Built on top of the Farm Angel Upstream (`fa-upstream-mobile`) skeleton
> from Terratech-VN, re-themed for EKiBBO with the Sheet-3 spec changes
> applied and wired to the MobiPay Agrobase Next.js backend.

## What this is

A new Flutter app, separate from the existing `mobile/` folder, designed to
match EKiBBO's brand (coffee brown + forest green + gold) and follow the
clarifications Issac gave in the Sheet-3 review.

## Tech stack

- **Flutter** (Dart `>=3.0.3 <4.0.0`)
- **State management**: `flutter_bloc` (kept from upstream)
- **Routing**: custom `RoutesManager.onGenerateRoute` (kept from upstream — no `go_router`)
- **i18n**: `flutter_localizations` + `flutter gen-l10n` (ARB-based, English only — Vietnamese removed per user)
- **Networking**: `http` (talks to `https://mobipay-agrobase.vercel.app`)
- **Storage**: `shared_preferences` (auth token + tenant ID)
- **Image picker**: `image_picker` (for farmer photos + training attachments)
- **URL launcher**: `url_launcher` (call farmer, open external links)
- **Fonts**: WorkSans (4 weights) + Quicksand (2 weights) — bundled in `assets/fonts/`
- **Icons**: SVG via `flutter_svg`

## App structure

```
mobipay-ekibbo/
├── pubspec.yaml                       ← package: mobipay_ekibbo
├── l10n.yaml                           ← flutter gen-l10n config
├── lib/
│   ├── main.dart                       ← MaterialApp with EKiBBO theme
│   ├── routes/routes_manager.dart      ← Login / Dashboard / Farmer Registration
│   ├── data/api_client.dart            ← JWT auth + Vercel backend (NEW)
│   ├── components/                     ← reusable UI (AppButton, AppFormField, AppDropwdownButton, MyAppBar, GImage, OptionBottomDialog, RadioButton)
│   ├── constant/
│   │   ├── color_constant.dart         ← EKiBBO palette: coffee brown / forest green / gold
│   │   └── text_style_constant.dart    ← WorkSans + Quicksand + Roboto
│   ├── l10n/
│   │   ├── app_en.arb                  ← 203 English keys (Sheet-3 expanded)
│   │   └── app_lang.dart               ← AppLang.local helper
│   └── screens/
│       ├── login/
│       │   ├── model/user_role.dart    ← Admin / Field Officer / Farmer enum
│       │   └── views/login_screen.dart ← role + phone + password, calls /api/auth/mobile-login
│       ├── dashboard/views/
│       │   └── dashboard_screen.dart   ← fetches /api/dashboard/stats, KPI cards, quick actions
│       └── farmer_registration/views/
│           └── farmer_registration_screen.dart ← 6-section form with Sheet-3 changes
├── android/                            ← app ID: co.mobipay.ekibbo (renamed from com.example.upstream)
├── ios/                                ← bundle ID: co.mobipay.ekibbo
├── assets/                             ← fonts + icons + images
└── test/
```

## EKiBBO Sheet-3 changes applied (per Issac's clarifications)

### Login screen
- Role selection: **Admin / Field Officer / Farmer** (dropdown)
- Authenticates via `POST /api/auth/mobile-login` (custom JWT endpoint — bypasses NextAuth cookies that don't work with Flutter)
- Persists JWT in `SharedPreferences`, sends as `Authorization: Bearer <token>` on every subsequent call
- On 401 (session expired), automatically logs out + returns to login screen

### Dashboard
- Fetches real KPIs from `GET /api/dashboard/stats` (farmerCount, trainingCount, groupCount, loanCount)
- Welcome card with EKiBBO branding (coffee brown gradient)
- 4 stat tiles (color-coded: green for farmers, gold for trainings, etc.)
- 4 quick action buttons (Add Farmer → farmer_registration; QR Scan, Activity History, Settings → stubs)
- Pull-to-refresh + manual refresh + logout buttons

### Farmer Registration form (6 sections)
1. **Basic Info** — enrollment date, farmer code (auto-generated), group name/code, field officer
2. **Farmer Info** — first/last name, phone, gender, DOB, ID type + number
3. **Contact Info** — country (Uganda), district, village
4. **Family Info** — Next of Kin alt phone, household size, children <18, school-going children
5. **Certification Info** — toggle + RA/Organic/Fairtrade/4C dropdown + Year of ICS
6. **Finance Info** — loan taken last year + loan source (Fresh/Kiboko/FAQ) + loan amount

### Issac's clarifications implemented
- **Q1 (Cultivation module)**: Standalone Cultivation module will be hidden (handled in web Sidebar config); the Farm Land KPI breakdown dashboard uses the simplified "Crops per Plot" inline form on Farm Land detail (already on web).
- **Q3 (Certification types)**: Replaced Individual/Group/RFA/UTZ with **RA, Organic, Fairtrade, 4C**.
- **Q3 (Season A/B)**: Confirmed season mapping in the breakdowns API (Q3-Q4 = Season A, Q1-Q2 = Season B).
- **Q4 (Next of Kin)**: Replaced "Spouse Name" with **"Next of Kin — Alternative Phone"** (no name field needed, just alt contact).
- **Q4 (Household Size)**: Renamed "No of Family Members" → **"Household Size"**.
- **Q5 (Input distribution seedlings)**: Added per-type options (Cocoa, Coffee, Shade Tree, Other) on the web InputDistributionView.
- **Q5 (Secateurs)**: Added to INPUT_TYPES on web.
- **Loan source = crop sold to EKiBBO**: Replaced Bank/Relative/Friend with Fresh (cherry), Kiboko (unwashed), FAQ (washed), Other.

## How to run locally

```bash
cd mobipay-ekibbo
flutter pub get
flutter run
# Default: talks to https://mobipay-agrobase.vercel.app (production)
# For local dev: flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Test credentials (EKiBBO tenant — verified against production DB):

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Field Officer (EKB_EXTENSION) | `fieldofficer@ekibbo.test` | `password123` | Moses Ekibbo — primary field officer test account |
| Field Officer (EKB_EXTENSION) | `eo1@ekibbo.co` | `password123` | Extension Officer 1 |
| Field Officer (EKB_EXTENSION) | `eo2@ekibbo.co` | `password123` | Extension Officer 2 |
| Field Officer (EKB_EXTENSION) | `exporter.agent@ekibbo.co` | `password123` | Betty Nabukenya |
| Field Officer (EXTENSION_OFFICER) | `eric@ekibbo.co` | `password123` | JOHN DOE |
| Farmer (EKB_FARMER) | `farmer@ekibbo.test` | `password123` | Sarah Nakato — farmer test account |
| Managing Director (EKB_MD) | `sophie@ekibbo.com` | `password123` | Sophie Ekibbo — full admin dashboard |
| Ops Manager (EKB_OPS_MANAGER) | `ops@ekibbo.co` | `password123` | Operations Manager |
| Finance (EKB_FINANCE) | `finance@ekibbo.co` | `password123` | Finance Officer |
| MEC (EKB_MEC) | `mec@ekibbo.co` | `password123` | MEC Officer |
| Super Admin (SUPER_ADMIN) | `admin@agrobase.co` | `password123` | Platform-wide admin (any tenant) |

## What's still pending (not yet implemented)

These features exist on the web app but haven't been ported to this mobile app yet:

- Plots module (Add plot, view plots, GPS pin)
- Crops module (cultivated area, harvest, sale intentions)
- Procurement module (distribution, QC, reception)
- Transactions module (calendar, revenue)
- Profile screen with 9 sub-tabs (Bank, Insurance, Equipment, etc.)
- QR Scan flow
- Training form (Phase C1 + C2 — attendee selection, file upload)
- Breakdowns dashboard (Phase B — 10 disaggregation cards)
- Settings screen (language switch, API server switch, version, sign out)

The login + dashboard + farmer registration are working. The above will be added incrementally.

## Source

- Based on: `Terratech-VN/fa-upstream-mobile` (Farm Angel Upstream Mobile, package `upstream`)
- Renamed package: `upstream` → `mobipay_ekibbo`
- Renamed app: "Upstream" → "EKiBBO Agrobase"
- Renamed Android app ID: `com.example.upstream` → `co.mobipay.ekibbo`
- Renamed iOS bundle ID: `com.example.upstream` → `co.mobipay.ekibbo`
- Removed Vietnamese localization (English-only per user request)
