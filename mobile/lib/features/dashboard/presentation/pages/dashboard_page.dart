import 'dart:convert';
import 'dart:io' as io;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:pull_to_refresh_flutter3/pull_to_refresh_flutter3.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart' as path_provider;
import 'package:share_plus/share_plus.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/auth/auth_provider.dart';
import '../../../../core/sync/offline_repository.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../../../core/sync/sync_status_widget.dart';
import '../../../../core/connectivity/connectivity_manager.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/utils/constants.dart';
import '../../../shared/widgets/kpi_card.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/empty_state.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final RefreshController _refreshController =
      RefreshController(initialRefresh: true);

  Map<String, dynamic>? _dashboardData;
  bool _loading = true;

  @override
  void dispose() {
    _refreshController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Listen to auth state changes — when the user logs in, the dashboard
    // should reload. Without this, the dashboard runs _loadData() on startup
    // (before login), gets 401, and never retries after login.
    final auth = context.read<AuthState>();
    if (auth.isAuthenticated && _dashboardData == null && !_loading) {
      _loading = true;
      _loadData();
    }
  }

  Future<void> _loadData() async {
    try {
      // Try online first
      final connectivity = context.read<ConnectivityManager>();
      if (connectivity.isOnline) {
        final api = ApiClient();
        final res = await api.get('/api/dashboard');
        if (res.statusCode == 200) {
          setState(() {
            _dashboardData = jsonDecode(res.body);
            _loading = false;
          });
        } else if (res.statusCode == 401) {
          // Not logged in yet — don't set _loading=false so the skeleton
          // stays visible until auth completes and didChangeDependencies
          // triggers a reload.
          debugPrint('[Dashboard] 401 — waiting for login');
          return;
        }
      } else {
        // Offline: build dashboard from local cache
        final repo = context.read<OfflineRepository>();
        final farmers = await repo.getFarmers();
        final farms = await repo.getFarmLands();
        final trainings = await repo.getTrainings();
        setState(() {
          _dashboardData = {
            'stats': {
              'farmerCount': farmers.length,
              'farmCount': farms.length,
              'trainingCount': trainings.length,
            },
            'offline': true,
          };
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Dashboard load error: $e');
      // Fallback to offline cache
      try {
        final repo = context.read<OfflineRepository>();
        final farmers = await repo.getFarmers();
        setState(() {
          _dashboardData = {
            'stats': {'farmerCount': farmers.length},
            'offline': true,
          };
          _loading = false;
        });
      } catch (_) {
        setState(() => _loading = false);
      }
    } finally {
      _refreshController.refreshCompleted();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthState>();
    final user = authProvider.userName;

    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Agrobase',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 20,
              ),
            ),
            if (user != null)
              Text(
                'Welcome, $user',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                ),
              ),
          ],
        ),
        backgroundColor: AppTheme.surfaceLight,
        elevation: 0,
        actions: [
          const SyncStatusWidget(),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: _loading
          ? _buildShimmer()
          : SmartRefresher(
              controller: _refreshController,
              onRefresh: _loadData,
              child: _buildDashboardBody(),
            ),
    );
  }

  /// Picks the dashboard body based on the `dashboardType` field from the API.
  /// - 'farmer': self-service view (own sales, loans, ledger, trainings)
  /// - 'admin' / null: tenant-wide KPIs (existing widgets)
  Widget _buildDashboardBody() {
    final dashboardType = _dashboardData?['dashboardType'] as String? ?? 'admin';
    if (dashboardType == 'farmer') {
      return _buildFarmerDashboard();
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          _buildKpiGrid(),
          const SizedBox(height: 24),
          // ─── Loyalty KPI section (Phase 1 + Phase 2) ───
          // Shown when the mobile dashboard endpoint returns a `loyalty` block.
          // (Currently only the EKIBBO tenant has loyalty data populated, but the
          // section gracefully hides itself when loyalty is null.)
          if (_dashboardData?['loyalty'] != null) _buildLoyaltySection(),
          if (_dashboardData?['loyalty'] != null) const SizedBox(height: 24),
          _buildLoanPortfolioChart(),
          const SizedBox(height: 24),
          _buildRecentActivity(),
          const SizedBox(height: 24),
          _buildQuickActions(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  /// Loyalty KPI section — shows the same Phase 1 metrics the web dashboard
  /// shows (loyal farmer rate, repeat sellers, engagement breakdown) + a
  /// CSV export button that downloads the per-farmer loyalty report via the
  /// web's export endpoint.
  Widget _buildLoyaltySection() {
    final loyalty = _dashboardData!['loyalty'] as Map<String, dynamic>;
    final loyalCount = loyalty['loyalFarmerCount'] as int? ?? 0;
    final activeCount = loyalty['activeFarmerCount'] as int? ?? 0;
    final rate = loyalty['loyalFarmerRate']; // num or null
    final repeatCount = loyalty['repeatSellerCount'] as int? ?? 0;
    final inputBuyers = loyalty['inputPurchaseFarmerCount'] as int? ?? 0;
    final trainingCount = loyalty['trainingFarmerCount'] as int? ?? 0;
    final period = loyalty['period'] as Map<String, dynamic>?;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row: title + export button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFB7185).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.favorite, color: Color(0xFFFB7185), size: 20),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Customer Loyalty',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                // CSV export button
                IconButton(
                  icon: const Icon(Icons.download_rounded, size: 20),
                  color: AppTheme.primaryGreen,
                  tooltip: 'Export CSV',
                  onPressed: _exportLoyaltyCsv,
                  constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            if (period != null) ...[
              const SizedBox(height: 4),
              Text(
                'Year to date (${period['from']} → ${period['to']})',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
            const SizedBox(height: 14),
            // Hero KPI row: Loyalty rate (big) + progress bar
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        rate == null ? '—' : '${rate}%',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                          height: 1.0,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$loyalCount of $activeCount active farmers',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 3,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: activeCount > 0 ? (loyalCount / activeCount).toDouble().clamp(0.0, 1.0) : 0,
                      minHeight: 10,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFB7185)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Mini stats grid
            Row(
              children: [
                Expanded(child: _buildLoyaltyMiniStat('Repeat Sellers', repeatCount.toString(), const Color(0xFFFBBF24))),
                const SizedBox(width: 8),
                Expanded(child: _buildLoyaltyMiniStat('Input Buyers', inputBuyers.toString(), const Color(0xFF60A5FA))),
                const SizedBox(width: 8),
                Expanded(child: _buildLoyaltyMiniStat('Trained', trainingCount.toString(), const Color(0xFFA78BFA))),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoyaltyMiniStat(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 10,
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  /// Download the loyalty CSV export via the authenticated API client,
  /// save it to a temp file, then trigger the native share sheet so the
  /// user can send it to email / WhatsApp / Files / etc.
  ///
  /// Uses the existing ApiClient (which carries the user's auth token) so
  /// the export works even when the mobile session isn't shared with the
  /// browser.
  Future<void> _exportLoyaltyCsv() async {
    final loyalty = _dashboardData?['loyalty'] as Map<String, dynamic>?;
    final period = loyalty?['period'] as Map<String, dynamic>?;
    final from = period?['from'] as String? ?? '';
    final to = period?['to'] as String? ?? '';

    // Show a loading snackbar — the fetch can take a few seconds for
    // tenants with many farmers.
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            SizedBox(width: 12),
            Text('Preparing loyalty report…'),
          ],
        ),
        duration: Duration(seconds: 10),
      ),
    );

    try {
      final api = ApiClient();
      final res = await api.get(
        '/api/dashboard/ekibbo-loyalty/export?from=$from&to=$to',
      );

      if (res.statusCode != 200) {
        throw Exception('HTTP ${res.statusCode}');
      }

      // Get the temp directory + write the CSV
      final dir = await path_provider.getTemporaryDirectory();
      final filename = 'ekibbo-loyalty-$from-to-$to.csv';
      final file = io.File('${dir.path}/$filename');
      await file.writeAsString(res.body);

      // Hide the loading snackbar
      if (!mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();

      // Share the file via the native share sheet (email / WhatsApp / Files)
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'EKiBBO Customer Loyalty Report ($from to $to)',
      );
    } catch (e) {
      debugPrint('Loyalty CSV export error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to export loyalty report: $e')),
      );
    }
  }

  /// Farmer self-service dashboard — shown when the logged-in user is a FARMER
  /// or EKB_FARMER. Renders their own sales, loan balance, ledger, and recent
  /// trainings instead of tenant-wide KPIs.
  Widget _buildFarmerDashboard() {
    final farmer = _dashboardData?['farmer'] as Map<String, dynamic>?;
    final summary = _dashboardData?['summary'] as Map<String, dynamic>? ?? {};
    final recentSales = _dashboardData?['recentSales'] as List<dynamic>? ?? [];
    final activeLoans = _dashboardData?['activeLoans'] as List<dynamic>? ?? [];
    final recentTrainings = _dashboardData?['recentTrainings'] as List<dynamic>? ?? [];
    final recentLedger = _dashboardData?['recentLedger'] as List<dynamic>? ?? [];

    if (farmer == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.person_off, size: 64, color: AppTheme.textSecondary),
              const SizedBox(height: 16),
              const Text('No farmer profile linked to your account',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              const Text('Please contact your field officer or cooperative to be registered.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    final farmerName = '${farmer['firstName'] ?? ''} ${farmer['lastName'] ?? ''}'.trim();
    final farmerCode = farmer['farmerCode'] ?? '—';
    final groupName = farmer['group']?['name'] ?? '—';

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          // Farmer card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryGreen, Color(0xFF2D6A4F)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.white.withOpacity(0.2),
                  child: Text(
                    (farmerName.isNotEmpty ? farmerName[0] : '?'),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(farmerName,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 4),
                      Text('Code: $farmerCode  ·  Group: $groupName',
                        style: const TextStyle(fontSize: 12, color: Colors.white70),
                      ),
                      if (farmer['isCertified'] == true) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text('Certified: ${farmer['certificationType'] ?? 'Yes'}',
                            style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Summary KPIs (4 cards)
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.6,
            children: [
              _buildFarmerKpiCard('Total Income', 'UGX ${(summary['totalIncome'] ?? 0).toStringAsFixed(0)}', Icons.trending_up, Colors.green),
              _buildFarmerKpiCard('Sales', '${summary['totalSales'] ?? 0}', Icons.shopping_cart, Colors.blue),
              _buildFarmerKpiCard('Loan Balance', 'UGX ${(summary['outstandingLoans'] ?? 0).toStringAsFixed(0)}', Icons.account_balance_wallet, Colors.orange),
              _buildFarmerKpiCard('Trainings', '${summary['trainingsAttended'] ?? 0}', Icons.school, Colors.purple),
            ],
          ),
          const SizedBox(height: 24),
          // Recent sales
          if (recentSales.isNotEmpty) ...[
            _buildSectionHeader('Recent Sales', Icons.shopping_cart),
            const SizedBox(height: 8),
            ...recentSales.take(5).map((s) => _buildSaleTile(s as Map<String, dynamic>)),
            const SizedBox(height: 24),
          ],
          // Active loans
          if (activeLoans.isNotEmpty) ...[
            _buildSectionHeader('Active Loans', Icons.account_balance_wallet),
            const SizedBox(height: 8),
            ...activeLoans.take(3).map((l) => _buildLoanTile(l as Map<String, dynamic>)),
            const SizedBox(height: 24),
          ],
          // Recent ledger entries
          if (recentLedger.isNotEmpty) ...[
            _buildSectionHeader('Recent Transactions', Icons.receipt_long),
            const SizedBox(height: 8),
            ...recentLedger.take(5).map((e) => _buildLedgerTile(e as Map<String, dynamic>)),
            const SizedBox(height: 24),
          ],
          // Recent trainings
          if (recentTrainings.isNotEmpty) ...[
            _buildSectionHeader('Recent Trainings', Icons.school),
            const SizedBox(height: 8),
            ...recentTrainings.take(3).map((t) => _buildTrainingTile(t as Map<String, dynamic>)),
            const SizedBox(height: 32),
          ],
        ],
      ),
    );
  }

  Widget _buildFarmerKpiCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(label,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          Text(value,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primaryGreen),
        const SizedBox(width: 8),
        Text(title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
      ],
    );
  }

  Widget _buildSaleTile(Map<String, dynamic> sale) {
    final product = sale['product'] ?? '—';
    final qty = sale['quantity'] ?? '—';
    final amount = (sale['netAmount'] ?? sale['totalAmount'] ?? 0) as num;
    final date = sale['createdAt'] != null
        ? DateFormat('dd MMM').format(DateTime.parse(sale['createdAt']).toLocal())
        : '—';
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const CircleAvatar(child: Icon(Icons.shopping_basket, size: 18)),
        title: Text('$product ($qty)', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        subtitle: Text(date, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        trailing: Text('UGX ${amount.toStringAsFixed(0)}',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.green),
        ),
      ),
    );
  }

  Widget _buildLoanTile(Map<String, dynamic> loan) {
    final amount = (loan['amount'] ?? 0) as num;
    final repaid = (loan['amountRepaid'] ?? 0) as num;
    final totalRepayable = (loan['totalRepayable'] ?? amount) as num;
    final balance = (totalRepayable - repaid).clamp(0, double.infinity).toDouble();
    final status = loan['status'] ?? '—';
    final groupName = loan['vslaGroup']?['name'] ?? '—';
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(groupName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: status == 'OVERDUE' ? Colors.red.shade100 : Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: status == 'OVERDUE' ? Colors.red : Colors.orange)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildLoanColumn('Principal', 'UGX ${amount.toStringAsFixed(0)}'),
                _buildLoanColumn('Repaid', 'UGX ${repaid.toStringAsFixed(0)}'),
                _buildLoanColumn('Balance', 'UGX ${balance.toStringAsFixed(0)}', highlight: true),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoanColumn(String label, String value, {bool highlight = false}) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
          const SizedBox(height: 2),
          Text(value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: highlight ? Colors.red : AppTheme.textPrimary,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildLedgerTile(Map<String, dynamic> entry) {
    final type = entry['type'] ?? '—';
    final desc = entry['description'] ?? '—';
    final amount = (entry['amount'] ?? 0) as num;
    final date = entry['date'] != null
        ? DateFormat('dd MMM').format(DateTime.parse(entry['date']).toLocal())
        : '—';
    final isCredit = amount >= 0;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        dense: true,
        title: Text(desc, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis),
        subtitle: Text('$type · $date', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        trailing: Text('${isCredit ? '+' : ''}UGX ${amount.abs().toStringAsFixed(0)}',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: isCredit ? Colors.green : Colors.red,
          ),
        ),
      ),
    );
  }

  Widget _buildTrainingTile(Map<String, dynamic> t) {
    final training = t['training'] as Map<String, dynamic>?;
    final topic = training?['topic'] ?? '—';
    final location = training?['location'] ?? '—';
    final date = training?['date'] != null
        ? DateFormat('dd MMM yyyy').format(DateTime.parse(training!['date']).toLocal())
        : '—';
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const CircleAvatar(child: Icon(Icons.school, size: 18)),
        title: Text(topic, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        subtitle: Text('$location · $date', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
      ),
    );
  }

  Widget _buildShimmer() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          LoadingShimmer(width: double.infinity, height: 90),
          const SizedBox(height: 12),
          LoadingShimmer(width: double.infinity, height: 90),
          const SizedBox(height: 12),
          LoadingShimmer(width: double.infinity, height: 200),
          const SizedBox(height: 24),
          LoadingShimmer(width: double.infinity, height: 60),
          const SizedBox(height: 8),
          LoadingShimmer(width: double.infinity, height: 60),
          const SizedBox(height: 8),
          LoadingShimmer(width: double.infinity, height: 60),
          const SizedBox(height: 24),
          LoadingShimmer(width: double.infinity, height: 100),
        ],
      ),
    );
  }

  Widget _buildKpiGrid() {
    final kpis = _dashboardData?['kpis'] as List<dynamic>?;
    if (kpis == null || kpis.isEmpty) {
      return const SizedBox.shrink();
    }

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: kpis.map<Widget>((kpi) {
        return _buildKpiCard(kpi as Map<String, dynamic>);
      }).toList(),
    );
  }

  Widget _buildKpiCard(Map<String, dynamic> kpi) {
    final icon = _getKpiIcon(kpi['key'] as String? ?? '');
    final label = kpi['label'] as String? ?? '';
    final value = kpi['value'];
    final trend = kpi['trend'] as double? ?? 0.0;
    final isPositive = trend >= 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: AppTheme.primaryGreen,
                  size: 20,
                ),
              ),
              const Spacer(),
              if (trend != 0)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isPositive
                        ? AppTheme.successGreen.withValues(alpha: 0.1)
                        : AppTheme.errorRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isPositive
                            ? Icons.trending_up
                            : Icons.trending_down,
                        size: 14,
                        color: isPositive
                            ? AppTheme.successGreen
                            : AppTheme.errorRed,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '${isPositive ? '+' : ''}${trend.toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isPositive
                              ? AppTheme.successGreen
                              : AppTheme.errorRed,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _formatKpiValue(kpi['key'] as String? ?? '', value),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatKpiValue(String key, dynamic value) {
    if (value == null) return '0';
    if (key == 'revenue') {
      return formatCurrency(value);
    }
    if (value is int) {
      return NumberFormat.compact().format(value);
    }
    return value.toString();
  }

  IconData _getKpiIcon(String key) {
    switch (key) {
      case 'total_farmers':
        return Icons.people_outline;
      case 'active_loans':
        return Icons.account_balance_wallet_outlined;
      case 'vsla_groups':
        return Icons.groups_outlined;
      case 'revenue':
        return Icons.attach_money_outlined;
      default:
        return Icons.analytics_outlined;
    }
  }

  Widget _buildLoanPortfolioChart() {
    final portfolio =
        _dashboardData?['loanPortfolio'] as Map<String, dynamic>?;
    if (portfolio == null) {
      return const SizedBox.shrink();
    }

    final activeCount = (portfolio['active'] as num?)?.toInt() ?? 0;
    final pendingCount = (portfolio['pending'] as num?)?.toInt() ?? 0;
    final overdueCount = (portfolio['overdue'] as num?)?.toInt() ?? 0;
    final completedCount = (portfolio['completed'] as num?)?.toInt() ?? 0;
    final total =
        activeCount + pendingCount + overdueCount + completedCount;

    if (total == 0) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Loan Portfolio',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: Row(
              children: [
                Expanded(
                  child: PieChart(
                    PieChartData(
                      sections: [
                        if (activeCount > 0)
                          PieChartSectionData(
                            value: activeCount.toDouble(),
                            color: AppTheme.primaryGreen,
                            title:
                                '${((activeCount / total) * 100).round()}%',
                            titleStyle: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                            radius: 60,
                          ),
                        if (pendingCount > 0)
                          PieChartSectionData(
                            value: pendingCount.toDouble(),
                            color: AppTheme.accentAmber,
                            title:
                                '${((pendingCount / total) * 100).round()}%',
                            titleStyle: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                            radius: 60,
                          ),
                        if (overdueCount > 0)
                          PieChartSectionData(
                            value: overdueCount.toDouble(),
                            color: AppTheme.errorRed,
                            title:
                                '${((overdueCount / total) * 100).round()}%',
                            titleStyle: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                            radius: 60,
                          ),
                        if (completedCount > 0)
                          PieChartSectionData(
                            value: completedCount.toDouble(),
                            color: AppTheme.textSecondary
                                .withValues(alpha: 0.5),
                            title:
                                '${((completedCount / total) * 100).round()}%',
                            titleStyle: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                            radius: 60,
                          ),
                      ],
                      sectionsSpace: 2,
                      centerSpaceRadius: 30,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildChartLegend(
                        AppTheme.primaryGreen, 'Active', activeCount),
                    const SizedBox(height: 8),
                    _buildChartLegend(
                        AppTheme.accentAmber, 'Pending', pendingCount),
                    const SizedBox(height: 8),
                    _buildChartLegend(
                        AppTheme.errorRed, 'Overdue', overdueCount),
                    const SizedBox(height: 8),
                    _buildChartLegend(
                        AppTheme.textSecondary.withValues(alpha: 0.5),
                        'Completed',
                        completedCount),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChartLegend(Color color, String label, int count) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          '$label ($count)',
          style: const TextStyle(
            fontSize: 12,
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentActivity() {
    final activities =
        _dashboardData?['recentActivity'] as List<dynamic>?;
    if (activities == null || activities.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Activity',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            TextButton(
              onPressed: () {},
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...activities.map((activity) {
          return _buildActivityItem(activity as Map<String, dynamic>);
        }),
      ],
    );
  }

  Widget _buildActivityItem(Map<String, dynamic> activity) {
    final type = activity['type'] as String? ?? '';
    final description = activity['description'] as String? ?? '';
    final timestamp = activity['timestamp'] as String?;
    final icon = _getActivityIcon(type);
    final color = _getActivityColor(type);

    String timeAgo = '';
    if (timestamp != null) {
      try {
        final dt = DateTime.parse(timestamp);
        final now = DateTime.now();
        final diff = now.difference(dt);
        if (diff.inMinutes < 60) {
          timeAgo = '${diff.inMinutes}m ago';
        } else if (diff.inHours < 24) {
          timeAgo = '${diff.inHours}h ago';
        } else {
          timeAgo = '${diff.inDays}d ago';
        }
      } catch (_) {
        timeAgo = '';
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (timeAgo.isNotEmpty)
                  Text(
                    timeAgo,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _getActivityIcon(String type) {
    switch (type) {
      case 'loan_disbursement':
        return Icons.account_balance_wallet_outlined;
      case 'farmer_registration':
        return Icons.person_add_outlined;
      case 'vsla_savings':
        return Icons.savings_outlined;
      case 'loan_repayment':
        return Icons.payment_outlined;
      default:
        return Icons.local_activity_outlined;
    }
  }

  Color _getActivityColor(String type) {
    switch (type) {
      case 'loan_disbursement':
        return AppTheme.primaryGreen;
      case 'farmer_registration':
        return AppTheme.accentAmber;
      case 'vsla_savings':
        return const Color(0xFF6366F1);
      case 'loan_repayment':
        return AppTheme.successGreen;
      default:
        return AppTheme.textSecondary;
    }
  }

  Widget _buildQuickActions() {
    final actions = [
      _QuickAction(
        icon: Icons.person_add_alt_1_outlined,
        label: 'Register Farmer',
        route: '/farmers/register',
        color: AppTheme.primaryGreen,
      ),
      _QuickAction(
        icon: Icons.add_card_outlined,
        label: 'New Loan',
        route: '/loans/new',
        color: AppTheme.accentAmber,
      ),
      _QuickAction(
        icon: Icons.savings_outlined,
        label: 'Record Savings',
        route: '/vsla/savings/new',
        color: const Color(0xFF6366F1),
      ),
      _QuickAction(
        icon: Icons.assessment_outlined,
        label: 'View Reports',
        route: '/reports',
        color: const Color(0xFFEC4899),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.8,
          children: actions.map((action) {
            return _buildQuickActionCard(action);
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildQuickActionCard(_QuickAction action) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(action.route),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: action.color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  action.icon,
                  color: action.color,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  action.label,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: AppTheme.textSecondary,
                size: 18,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAction {
  final IconData icon;
  final String label;
  final String route;
  final Color color;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.route,
    required this.color,
  });
}