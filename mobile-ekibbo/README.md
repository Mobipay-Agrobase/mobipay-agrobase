# Agrobase Ekibbo — Field Officer & Farmer Mobile App

Offline-first Flutter mobile app for the **Ekibbo tenant** of the Agrobase
platform, built for **Field Officers (Extension Officers)** and **Farmers**.

Same proven UI/UX as the upstream design (login → role-aware dashboard →
drawer navigation → quick-action FAB menu), rebranded to **Agrobase** with
the Ekibbo emerald-green identity.

## Features

### Roles
| Role | Web role | What they see |
|------|----------|---------------|
| Field Officer | `EKB_EXTENSION` | Farmer registry (register + polygon capture), purchases, input distributions, trainings, farm visits, sale intentions, dashboard |
| Farmer | `EKB_FARMER` | Personal dashboard (hectares, yield, loans), farmer queries, news & advisory |

### Offline-first
- Farmer registrations captured offline are queued in on-device **Hive** boxes
- Dropdown catalogs, addresses and reference data are cached locally
- **Sync Data** screen pushes the offline queue (with photos) when connectivity returns
- Successful syncs are removed from the queue automatically

### Multi-tenant isolation
- Login returns a token carrying `(userId : role : tenantId)`
- Every API call sends `Authorization: Bearer <token>`; the Agrobase backend
  derives the tenant scope server-side and injects `x-tenant-id` /
  `x-tenant-scope` headers — **one tenant can never read another tenant's data**
- The client-side `TenantInterceptor` only labels requests for tracing;
  authoritative enforcement is server-side and cannot be spoofed

## Configuration

API base URL defaults to `http://10.0.2.2:3000` (Android emulator → host).
Override for production builds:

```bash
flutter build apk \
  --dart-define=AGROBASE_API_BASE=https://your-agrobase-domain
```

## Build

```bash
flutter pub get
flutter gen-l10n
flutter pub run flutter_launcher_icons          # regenerate launcher icons
flutter run --dart-define=AGROBASE_API_BASE=http://10.0.2.2:3000
```

## Structure

```
lib/
├── application/          # ChangeNotifier app state (offline queues, listings)
├── components/           # Design-system widgets + brand color constants
├── domain/
│   ├── config/           # env_config.dart — API base URLs
│   ├── core/             # Dio client, interceptors (auth + tenant)
│   ├── l10n/             # localization
│   └── roles/            # role / drawer / FAB menu configs (Ekibbo-tuned)
├── infrastructure/
│   ├── local_data/       # Hive boxes + shared preferences (offline store)
│   └── remote_data/      # API clients + Agrobase auth service
├── models/               # JSON models (freezed/json_serializable)
├── presentation/         # Screens: login, dashboard, farmers, plots, crops,
│                         # procurement, distribution, queries, sync…
└── routes/               # Named-route manager
```

## Ekibbo menu (role-aware)

**Drawer — Field Officer:** Profile · Purchases · Input Distributions ·
Sale Intentions · Farmer Queries · News & Advisory · Settings

**Quick actions (FAB) — Field Officer:** Add Farmer · Add Plot (polygon) ·
Add Purchase · Input Distribution · Add Crop · Crop Harvest · Sale
Intention · Carbon Footprint

**Farmer:** Dashboard · Farmer Queries · News & Advisory · Profile · Settings
