import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/farmers/presentation/pages/farmers_page.dart';
import '../../features/farmers/presentation/pages/farmer_detail_page.dart';
import '../../features/farmers/presentation/pages/farmer_edit_page.dart';
import '../../features/farm_lands/presentation/pages/farm_lands_page.dart';
import '../../features/farm_lands/presentation/pages/farm_land_detail_page.dart';
import '../../features/farm_lands/presentation/pages/farm_land_form_page.dart';
import '../../features/cultivations/presentation/pages/cultivations_page.dart';
import '../../features/cultivations/presentation/pages/cultivation_form_page.dart';
import '../../features/cultivations/presentation/pages/cultivation_detail_page.dart';
import '../../features/sales/presentation/pages/sales_page.dart';
import '../../features/payments/presentation/pages/payments_page.dart';
import '../../features/loans/presentation/pages/loans_page.dart';
import '../../features/vsla/presentation/pages/vsla_page.dart';
import '../../features/sacco/presentation/pages/sacco_page.dart';
import '../../features/vsla_v2/presentation/pages/member_login_page.dart';
import '../../features/vsla_v2/presentation/pages/member_dashboard_page.dart';
import '../../features/vsla_v2/presentation/pages/integrations_page.dart';
import '../../features/reset/presentation/pages/reset_dashboard_page.dart';
import '../../features/reset/presentation/pages/beneficiaries_page.dart';
import '../../features/reset/presentation/pages/vouchers_page.dart';
import '../../features/reset/presentation/pages/merchants_page.dart';
import '../../features/reset/presentation/pages/reports_page.dart';
import '../../features/mfi/presentation/pages/mfi_page.dart';
import '../../features/carbon/presentation/pages/carbon_page.dart';
import '../../features/compliance/presentation/pages/compliance_page.dart';
import '../../features/plots/presentation/pages/plots_page.dart';
import '../../features/plots/presentation/pages/plot_detail_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/profile/presentation/pages/farmer_id_card_page.dart';
import '../../features/trainings/presentation/pages/my_trainings_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/billing/presentation/pages/recovery_page.dart';
import '../../features/impact/presentation/pages/impact_dashboard_page.dart';
import '../../features/impact/presentation/pages/practice_logger_page.dart';
import '../../features/impact/presentation/pages/my_passport_page.dart';
import '../../features/purchases/presentation/pages/produce_purchase_page.dart';
import '../../features/input_distribution/presentation/pages/input_distribution_page.dart';
import '../../features/farmer_ledger/presentation/pages/farmer_ledger_page.dart';
import '../../features/farmer_ledger/presentation/pages/my_farmer_dashboard_page.dart';
import '../../core/navigation/dynamic_navigation_service.dart';
import 'drawer_shell.dart';

class AppRouter {
  static final _rootNavigatorKey = GlobalKey<NavigatorState>();

  static GoRouter get router => GoRouter(
        navigatorKey: _rootNavigatorKey,
        initialLocation: '/splash',
        routes: [
          GoRoute(
            path: '/splash',
            builder: (_, __) => const SplashPage(),
          ),
          // VSLA V2 — Member login via SMS OTP
          GoRoute(
            path: '/vsla-member-login',
            builder: (_, __) => const MemberLoginPage(),
          ),
          // VSLA V2 — Member dashboard
          GoRoute(
            path: '/vsla-member-dashboard',
            builder: (_, __) => const MemberDashboardPage(),
          ),
          // VSLA V2 — Cross-module integrations
          GoRoute(
            path: '/vsla-integrations',
            builder: (_, __) => const IntegrationsPage(groupId: ''),
          ),
          // ReSET MarketLink
          GoRoute(path: '/reset-dashboard', builder: (_, __) => const ResetDashboardPage()),
          GoRoute(path: '/reset-beneficiaries', builder: (_, __) => const BeneficiariesPage()),
          GoRoute(path: '/reset-vouchers', builder: (_, __) => const VouchersPage()),
          GoRoute(path: '/reset-merchants', builder: (_, __) => const MerchantsPage()),
          GoRoute(path: '/reset-reports', builder: (_, __) => const ReportsPage()),
          GoRoute(
            path: '/login',
            builder: (_, __) => const LoginPage(),
          ),
          // Self-service password reset (OTP via SMS)
          GoRoute(
            path: '/forgot-password',
            builder: (_, __) => const ForgotPasswordPage(),
          ),
          GoRoute(
            path: '/farmers/:id',
            builder: (_, state) =>
                FarmerDetailPage(id: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/farmers/:id/edit',
            builder: (_, state) =>
                FarmerEditPage(farmerId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/plots/:id',
            builder: (_, state) =>
                PlotDetailPage(id: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/recovery',
            builder: (_, __) => const RecoveryPage(),
          ),
          // ─── SACCO Management (SAA/WFP AMS) ───
          GoRoute(
            path: '/sacco',
            builder: (_, __) => const SaccoPage(),
          ),
          GoRoute(
            path: '/sacco/new',
            builder: (_, __) => const SaccoPage(),
          ),
          // ─── Impact Engine routes (6-week sprint) ───
          GoRoute(
            path: '/impact',
            builder: (_, __) => const ImpactDashboardPage(),
          ),
          GoRoute(
            path: '/impact/practices',
            builder: (_, __) => const PracticeLoggerPage(),
          ),
          GoRoute(
            path: '/impact/passport',
            builder: (_, __) => const MyPassportPage(),
          ),
          // ─── EKIBBO: Farmer ID Card + My Trainings ───
          GoRoute(
            path: '/profile/farmer-id-card',
            builder: (_, __) => const FarmerIdCardPage(),
          ),
          GoRoute(
            path: '/profile/trainings',
            builder: (_, __) => const MyTrainingsPage(),
          ),
          // ─── EKIBBO Phase 3: Purchase, Input Distribution, Farmer Ledger ───
          GoRoute(
            path: '/purchase/new',
            builder: (_, __) => const ProducePurchasePage(),
          ),
          GoRoute(
            path: '/input-distribution',
            builder: (_, __) => const InputDistributionPage(),
          ),
          GoRoute(
            path: '/farmer/:id/ledger',
            builder: (_, state) =>
                FarmerLedgerPage(farmerId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/my-dashboard',
            builder: (_, __) => const MyFarmerDashboardPage(),
          ),
          // ─── Phase 2: Farm Lands, Cultivations, Sales, Payments ───
          GoRoute(
            path: '/farm-lands',
            builder: (_, __) => const FarmLandsPage(),
          ),
          GoRoute(
            path: '/farm-lands/new',
            builder: (_, state) => FarmLandFormPage(farmerId: state.uri.queryParameters['farmerId']),
          ),
          GoRoute(
            path: '/farm-lands/:id',
            builder: (_, state) => FarmLandDetailPage(farmLandId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/farm-lands/:id/edit',
            builder: (_, state) => FarmLandFormPage(farmLandId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/cultivations',
            builder: (_, state) => CultivationsPage(farmId: state.uri.queryParameters['farmId']),
          ),
          GoRoute(
            path: '/cultivation-create',
            builder: (_, state) => CultivationFormPage(farmId: state.uri.queryParameters['farmId']),
          ),
          GoRoute(
            path: '/cultivation-edit/:id',
            builder: (_, state) => CultivationFormPage(cultivationId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/cultivation-detail/:id',
            builder: (_, state) => CultivationDetailPage(cultivationId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/sales',
            builder: (_, __) => const SalesPage(),
          ),
          GoRoute(
            path: '/payments',
            builder: (_, __) => const PaymentsPage(),
          ),
          StatefulShellRoute.indexedStack(
            builder: (context, state, navigationShell) {
              return DrawerShell(navigationShell: navigationShell);
            },
            branches: [
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/',
                  builder: (_, __) => const DashboardPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/plots',
                  builder: (_, __) => const PlotsPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/farmers',
                  builder: (_, __) => const FarmersPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/farm-lands',
                  builder: (_, __) => const FarmLandsPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/sales',
                  builder: (_, __) => const ProducePurchasePage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/payments',
                  builder: (_, __) => const PaymentsPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/loans',
                  builder: (_, __) => const LoansPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/vsla',
                  builder: (_, __) => const VslaPage(),
                ),
              ]),
              // P7-SAA: SACCO branch (index 8)
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/sacco-tab',
                  builder: (_, __) => const SaccoPage(),
                ),
              ]),
              // ReSET branch (index 9)
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/reset-tab',
                  builder: (_, __) => const ResetDashboardPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/mfi',
                  builder: (_, __) => const MfiPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/carbon',
                  builder: (_, __) => const CarbonPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/compliance',
                  builder: (_, __) => const CompliancePage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/impact',
                  builder: (_, __) => const ImpactDashboardPage(),
                ),
              ]),
              StatefulShellBranch(routes: [
                GoRoute(
                  path: '/profile',
                  builder: (_, __) => const ProfilePage(),
                ),
              ]),
            ],
          ),
        ],
      );
}

/// Map from destination key (from /api/mobile/navigation) to branch index.
/// The branch indices correspond to the order of StatefulShellBranch entries
/// in the StatefulShellRoute above.
const _keyToBranchIndex = <String, int>{
  'dashboard': 0,    // / (DashboardPage)
  'plots': 1,        // /plots
  'farmers': 2,      // /farmers
  'farm_lands': 3,   // /farm-lands
  'purchases': 4,    // /sales (ProducePurchasePage)
  'payments': 5,     // /payments
  'loans': 6,        // /loans
  'vsla': 7,         // /vsla
  'sacco': 8,        // /sacco-tab (SaccoPage)
  'reset': 9,        // /reset-tab (ResetDashboardPage)
  'mfi': 10,         // /mfi
  'carbon': 11,      // /carbon
  'compliance': 12,  // /compliance
  'impact': 13,      // /impact
  'profile': 14,     // /profile
};

class ScaffoldWithNavBar extends StatefulWidget {
  final StatefulNavigationShell navigationShell;
  const ScaffoldWithNavBar({super.key, required this.navigationShell});

  @override
  State<ScaffoldWithNavBar> createState() => _ScaffoldWithNavBarState();
}

class _ScaffoldWithNavBarState extends State<ScaffoldWithNavBar> {
  @override
  Widget build(BuildContext context) {
    final navService = context.watch<DynamicNavigationService>();
    final destinations = navService.destinations;

    // If no destinations loaded yet, use a default set
    final visibleDestinations = destinations.isNotEmpty
        ? destinations
        : [
            NavDestination(key: 'dashboard', label: 'Home', icon: 'dashboard', route: '/'),
            NavDestination(key: 'farmers', label: 'Farmers', icon: 'people', route: '/farmers'),
            NavDestination(key: 'profile', label: 'Profile', icon: 'person', route: '/profile'),
          ];

    // Build NavigationDestinations from the dynamic config
    final navDestinations = visibleDestinations.map((d) {
      return NavigationDestination(
        icon: Icon(d.iconData, color: Colors.grey),
        selectedIcon: Icon(d.iconData),
        label: d.label,
      );
    }).toList();

    // Map the current navigationShell branch to the visible destination index
    // Find which visible destination corresponds to the current branch
    int selectedDestIndex = 0;
    for (int i = 0; i < visibleDestinations.length; i++) {
      final branchIndex = _keyToBranchIndex[visibleDestinations[i].key] ?? 0;
      if (branchIndex == widget.navigationShell.currentIndex) {
        selectedDestIndex = i;
        break;
      }
    }

    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedDestIndex,
        onDestinationSelected: (index) {
          final dest = visibleDestinations[index];
          final branchIndex = _keyToBranchIndex[dest.key] ?? 0;
          widget.navigationShell.goBranch(branchIndex);
        },
        height: 68,
        destinations: navDestinations,
      ),
    );
  }
}