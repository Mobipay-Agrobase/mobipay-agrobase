# MobiPay Agrobase — Mobile App (Flutter)

Companion mobile app for the MobiPay Agrobase V3 platform. Field officers and members use this app to manage VSLA groups, savings, loans, meetings, social fund, and NSSF contributions from any Android or iOS device.

## What's Inside

| Screen | Purpose |
|---|---|
| **Login** | One-tap quick login with 5 demo roles |
| **Dashboard** | Platform KPIs (savings, loans, NSSF, payments) + loan portfolio |
| **VSLA Groups** | Browse all groups; tap for detail (members, loans, savings, meetings) |
| **Group Detail** | 4 tabs: Members / Loans / Savings / Meetings + FAB to record new saving or loan |
| **Loans** | Filterable loan list (PENDING / APPROVED / DISBURSED / OVERDUE / REPAID) |
| **Loan Detail** | Full lifecycle actions: Approve → Disburse → Record Repayment → Write Off |
| **Savings** | All savings transactions with totals + share count |
| **Meetings** | Meeting history with attendance + savings collected |
| **Social Fund** | Contributions + claims (with approve/disburse workflow) |
| **NSSF** | Farmer contributions with SMS confirmation status |

## Quick Start

### Prerequisites
- Flutter 3.4+ (Dart 3.4+)
- Android Studio or Xcode for device/emulator
- A running instance of the MobiPay Agrobase backend (Next.js)

### Setup
```bash
cd mobile
flutter pub get

# Point the app at your backend
# Edit lib/core/config.dart → Config.baseUrl

# For Android emulator (maps to host localhost):
#   static const String baseUrl = 'http://10.0.2.2:3000';

# For physical device (use your computer's LAN IP):
#   static const String baseUrl = 'http://192.168.1.100:3000';

# For production:
#   static const String baseUrl = 'https://agrobase.mobipay.io';
```

### Run
```bash
flutter run                       # Auto-selects device
flutter run -d chrome             # Web (for quick testing)
flutter run -d android            # Android device/emulator
flutter run -d ios                # iOS simulator
```

### Build release
```bash
flutter build apk --release       # Android
flutter build ios --release       # iOS (requires macOS + Xcode)
flutter build web --release       # Web (PWA)
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | `eric@mobipay.agrobase` | `mobipay2025` |
| Tenant Admin | `admin@kilimo.org` | `kilimo2025` |
| VSLA Officer | `officer@kilimo.org` | `officer2025` |
| Partner Admin | `partner@kilimotrust.org` | `partner2025` |
| Finance | `finance@coop.ug` | `finance2025` |

Tap any role on the login screen to auto-fill credentials.

## API Integration

The app calls these backend endpoints (all defined in the Next.js backend at `/api/`):

| Endpoint | Mobile Use |
|---|---|
| `POST /api/auth/login` | Authentication |
| `GET /api/admin/overview` | Dashboard KPIs |
| `GET /api/vsla/groups` | Groups list |
| `GET /api/vsla/members` | Group members |
| `GET /api/vsla/savings` `POST /api/vsla/savings` | Savings list + record |
| `GET /api/vsla/loans` `POST /api/vsla/loans` | Loans list + apply |
| `PUT /api/vsla/loans/[id]` | Loan actions (approve, disburse, write-off) |
| `POST /api/vsla/loans/[id]/repay` | Record repayment |
| `GET /api/vsla/meetings` | Meetings list |
| `GET /api/vsla/social-fund/contributions` | Social fund contributions |
| `GET /api/vsla/social-fund/claims` | Social fund claims |
| `GET /api/nssf/contributions` | NSSF contributions |

## Architecture

```
mobile/
├── lib/
│   ├── main.dart                          # Entry point
│   ├── core/
│   │   └── config.dart                    # Base URL + demo credentials + formatters
│   ├── services/
│   │   └── api_service.dart               # HTTP client with auth token
│   ├── models/
│   │   └── vsla_models.dart               # VslaGroup, VslaMember, VslaLoan, etc.
│   └── screens/
│       ├── login_screen.dart              # Login with quick-login cards
│       ├── home_screen.dart               # Bottom nav (7 tabs)
│       ├── dashboard_screen.dart          # Platform overview
│       ├── vsla_groups_screen.dart        # Groups list
│       ├── vsla_group_detail_screen.dart  # Group detail with 4 tabs + FAB actions
│       ├── vsla_loans_screen.dart         # All loans (filterable)
│       ├── vsla_savings_screen.dart       # All savings
│       ├── vsla_meetings_screen.dart      # Meeting history
│       ├── vsla_social_fund_screen.dart   # Contributions + claims
│       └── nssf_screen.dart               # NSSF contributions
└── pubspec.yaml                           # Dependencies: http, shared_preferences, intl
```

## Production Notes

- **Authentication**: Currently uses demo tokens. For production, integrate JWT with refresh tokens.
- **Offline support**: Add `sqflite` + `workmanager` for offline-first savings recording (field officers often work without connectivity).
- **USSD fallback**: For feature phones, the Next.js backend exposes `/api/ussd` for USSD session handling — the same APIs work.
- **SMS notifications**: Backend auto-sends SMS via Africa's Talking when savings/loans/NSSF events fire — no mobile-side action needed.
- **Push notifications**: Add `firebase_messaging` for real-time loan approval / meeting reminder notifications.
