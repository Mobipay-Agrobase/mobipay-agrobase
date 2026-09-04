import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pull_to_refresh_flutter3/pull_to_refresh_flutter3.dart';
import 'package:intl/intl.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loyalty_badge.dart';

/// Farmer detail page (officers + self-viewing farmers).
///
/// Loads GET /api/farmers/:id — the same endpoint the web FarmerDetailFull
/// component uses. The response is `{ data: { ...farmer, loyalty, financialSummary } }`
/// where:
///   - farmer fields: firstName/lastName, phone/email (decrypted), district,
///     commune, villageName, farmSize (ha), farmOwnership, mainCrops (JSON
///     array), vslaLoans[], group, trainings[] (attendance records with a
///     nested `training` object), sales[] (recent 10)
///   - loyalty: EKIBBO-only loyalty summary (null for other tenants)
///   - financialSummary: loan balance / sales totals for the summary cards
class FarmerDetailPage extends StatefulWidget {
  final String id;

  const FarmerDetailPage({super.key, required this.id});

  @override
  State<FarmerDetailPage> createState() => _FarmerDetailPageState();
}

class _FarmerDetailPageState extends State<FarmerDetailPage> {
  final RefreshController _refreshController =
      RefreshController(initialRefresh: true);

  Map<String, dynamic>? _farmer;
  bool _loading = true;

  @override
  void dispose() {
    _refreshController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final api = ApiClient();
      final res = await api.get('/api/farmers/${widget.id}');
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final data = (body['data'] ?? body) as Map<String, dynamic>;
        setState(() {
          _farmer = data;
        });
      }
    } catch (e) {
      debugPrint('Farmer detail load error: $e');
    } finally {
      _loading = false;
      _refreshController.refreshCompleted();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      appBar: AppBar(
        title: const Text(
          'Farmer Details',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        backgroundColor: AppTheme.surfaceLight,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit farmer',
            onPressed: () async {
              final changed =
                  await context.push('/farmers/${widget.id}/edit');
              if (changed == true) {
                _loadData();
              }
            },
          ),
        ],
      ),
      body: _loading
          ? _buildShimmer()
          : _farmer == null
              ? const EmptyState(
                  icon: Icons.person_off_outlined,
                  title: 'Farmer not found',
                  subtitle: 'This farmer may have been removed',
                )
              : SmartRefresher(
                  controller: _refreshController,
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        _buildProfileHeader(),
                        const SizedBox(height: 16),
                        _buildFinancialSummary(),
                        _buildContactInfo(),
                        _buildFarmInfo(),
                        _buildSalesHistory(),
                        _buildLoansHistory(),
                        _buildVslaMembership(),
                        _buildTrainingAttendance(),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildShimmer() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          const SizedBox(height: 8),
          LoadingShimmer(height: 120),
          const SizedBox(height: 16),
          LoadingShimmer(height: 100),
          const SizedBox(height: 16),
          LoadingShimmer(height: 160),
          const SizedBox(height: 16),
          LoadingShimmer(height: 200),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final farmer = _farmer!;
    final firstName = farmer['firstName'] as String? ?? '';
    final lastName = farmer['lastName'] as String? ?? '';
    final name = '$firstName $lastName'.trim();
    final initials = _getInitials(name.isNotEmpty ? name : '?');
    final status = farmer['status'] as String? ?? 'ACTIVE';
    // Loyalty data is embedded in the /api/farmers/[id] response (inline
    // `loyalty` block, EKIBBO tenant only — null elsewhere).
    final loyaltyJson = farmer['loyalty'] as Map<String, dynamic>?;
    final stages = stagesFromLoyaltyJson(loyaltyJson);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.1),
            child: Text(
              initials,
              style: const TextStyle(
                color: AppTheme.primaryGreen,
                fontWeight: FontWeight.w700,
                fontSize: 22,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name.isNotEmpty ? name : 'Unknown',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                    StatusBadge(status: status),
                  ],
                ),
                if ((farmer['farmerCode'] as String?)?.isNotEmpty == true) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Code: ${farmer['farmerCode']}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  'Registered ${_formatDate(farmer['createdAt'] as String?)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
                // Loyalty tier subtitle — only if data is present
                if (loyaltyJson != null && stages != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.favorite, size: 12, color: _tierColor(stages)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${loyaltyJson['label'] ?? 'Loyalty'} · $stages/4 stages',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _tierColor(stages),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          // Loyalty donut badge on the right (matches web hero card design).
          // Only shown when the API returns loyalty data (EKIBBO tenant only).
          if (loyaltyJson != null && stages != null)
            LoyaltyBadge(stages: stages, size: 56),
        ],
      ),
    );
  }

  /// Tier color matching the LoyaltyBadge widget's internal config.
  Color _tierColor(int stages) {
    const colors = [
      Color(0xFF94A3B8), // New — slate
      Color(0xFF60A5FA), // Engaged — blue
      Color(0xFFFBBF24), // Active — amber
      Color(0xFF34D399), // Loyal — emerald
      Color(0xFFFB7185), // Champion — rose
    ];
    return colors[stages.clamp(0, 4)];
  }

  // ─── Financial summary: loan balance + sales cards ──────────────────────

  Widget _buildFinancialSummary() {
    final summary = _farmer?['financialSummary'] as Map<String, dynamic>?;
    if (summary == null) return const SizedBox.shrink();

    final loanBalance = (summary['loanBalance'] as num? ?? 0).toDouble();
    final breakdown = summary['loanBalanceBreakdown'] as Map<String, dynamic>?;
    final agriBalance = (breakdown?['agribusiness'] as num? ?? 0).toDouble();
    final vslaBalance = (breakdown?['vsla'] as num? ?? 0).toDouble();
    final activeLoans = summary['activeLoanCount'] as num? ?? 0;
    final sales = summary['sales'] as Map<String, dynamic>?;
    final salesTotal = (sales?['totalAllTime'] as num? ?? 0).toDouble();
    final salesYtd = (sales?['ytd'] as num? ?? 0).toDouble();
    final salesCount = sales?['count'] as num? ?? 0;
    final lastSaleAt = sales?['lastSaleAt'] as String?;

    // Hide the whole block when there is genuinely nothing to show.
    final hasLoans = loanBalance > 0 || activeLoans > 0;
    final hasSales = salesTotal > 0 || salesCount > 0;
    if (!hasLoans && !hasSales) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: _summaryCard(
                  title: 'Loan Balance',
                  value: formatCurrency(loanBalance),
                  icon: Icons.account_balance_wallet_outlined,
                  accent: AppTheme.accentAmber,
                  subtitle: activeLoans > 0 ? '$activeLoans active loan${activeLoans == 1 ? '' : 's'}' : 'No active loans',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _summaryCard(
                  title: 'Total Sales',
                  value: formatCurrency(salesTotal),
                  icon: Icons.trending_up_outlined,
                  accent: AppTheme.primaryGreen,
                  subtitle: salesCount > 0
                      ? '$salesCount sale${salesCount == 1 ? '' : 's'}${lastSaleAt != null ? ' · ${_formatDate(lastSaleAt)}' : ''}'
                      : 'No sales yet',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Breakdown chips: agribusiness vs VSLA loans, YTD sales
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (agriBalance > 0)
                _summaryChip('Agribusiness: ${formatCurrency(agriBalance)}', AppTheme.accentAmber),
              if (vslaBalance > 0)
                _summaryChip('VSLA: ${formatCurrency(vslaBalance)}', AppTheme.accentAmber),
              if (salesYtd > 0)
                _summaryChip('This year: ${formatCurrency(salesYtd)}', AppTheme.primaryGreen),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryCard({
    required String title,
    required String value,
    required IconData icon,
    required Color accent,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: accent, size: 16),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: accent,
              letterSpacing: -0.3,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 11,
              color: AppTheme.textSecondary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _summaryChip(String label, Color accent) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accent.withValues(alpha: 0.25)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: accent,
        ),
      ),
    );
  }

  // ─── Contact information ────────────────────────────────────────────────

  Widget _buildContactInfo() {
    final farmer = _farmer!;
    final phone = farmer['phone'] as String? ?? '';
    final email = farmer['email'] as String? ?? '';
    final district = farmer['district'] as String? ??
        _villageChain(farmer, ['parish', 'subCounty', 'county', 'district', 'name']);
    final subcounty = farmer['commune'] as String? ??
        _villageChain(farmer, ['parish', 'subCounty', 'name']);
    final village = farmer['villageName'] as String? ??
        (farmer['village'] as Map<String, dynamic>?)?['name'] as String? ??
        '';

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Contact Information',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          if (phone.isNotEmpty)
            _buildInfoRow(Icons.phone_outlined, 'Phone', phone),
          if (email.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildInfoRow(Icons.email_outlined, 'Email', email),
          ],
          if (district.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildInfoRow(Icons.location_on_outlined, 'District', district),
          ],
          if (subcounty.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildInfoRow(
                Icons.location_city_outlined, 'Sub-county', subcounty),
          ],
          if (village.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildInfoRow(Icons.home_outlined, 'Village', village),
          ],
        ],
      ),
    );
  }

  /// Walks the nested geo hierarchy on the `village` relation:
  /// village.parish.subCounty.county.district.name (or a shorter chain).
  String _villageChain(Map<String, dynamic> farmer, List<String> path) {
    dynamic node = farmer['village'];
    if (node == null) return '';
    // First hop is the village object itself, then follow the path.
    for (final key in path) {
      if (node is! Map<String, dynamic>) return '';
      node = node[key];
      if (node == null) return '';
    }
    return node is String ? node : '';
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.textSecondary),
        const SizedBox(width: 12),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: AppTheme.textSecondary,
          ),
        ),
        const Spacer(),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppTheme.textPrimary,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // ─── Farm information ───────────────────────────────────────────────────

  Widget _buildFarmInfo() {
    final farmer = _farmer!;
    final farmSize = farmer['farmSize'] as num?;
    final farmOwnership = farmer['farmOwnership'] as String? ?? '';
    final mainCrops = _stringList(farmer['mainCrops']);
    final livestockTypes = _stringList(farmer['livestockTypes']);

    if (farmSize == null &&
        farmOwnership.isEmpty &&
        mainCrops.isEmpty &&
        livestockTypes.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Farm Information',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          if (mainCrops.isNotEmpty)
            _buildInfoRow(Icons.grain_outlined, 'Main Crops', mainCrops.join(', ')),
          if (farmSize != null) ...[
            const SizedBox(height: 10),
            _buildInfoRow(Icons.square_foot, 'Farm Size', '${farmSize} ha'),
          ],
          if (farmOwnership.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildInfoRow(
                Icons.agriculture_outlined, 'Ownership', farmOwnership),
          ],
          if (livestockTypes.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildInfoRow(
                Icons.pets_outlined, 'Livestock', livestockTypes.join(', ')),
          ],
        ],
      ),
    );
  }

  /// mainCrops / livestockTypes are stored as JSON — the API already parses
  /// them to a List, but be defensive and accept a String too.
  List<String> _stringList(dynamic raw) {
    if (raw == null) return [];
    if (raw is List) return raw.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
    if (raw is String && raw.isNotEmpty) {
      final trimmed = raw.trim();
      if (trimmed.startsWith('[')) {
        try {
          final parsed = jsonDecode(trimmed);
          if (parsed is List) {
            return parsed.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
          }
        } catch (_) {}
      }
      return trimmed.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    }
    return [];
  }

  // ─── Recent sales ────────────────────────────────────────────────────────

  Widget _buildSalesHistory() {
    final sales = _farmer?['sales'] as List<dynamic>?;
    if (sales == null || sales.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Recent Sales',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              Text(
                'last ${sales.length}',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...sales.map((s) {
            return _buildSaleItem(s as Map<String, dynamic>);
          }),
        ],
      ),
    );
  }

  Widget _buildSaleItem(Map<String, dynamic> sale) {
    final product = sale['product'] as String? ?? 'Sale';
    final category = (sale['category'] as String? ?? 'PRODUCE').toUpperCase();
    final quantity = sale['quantity']?.toString() ?? '';
    final total = (sale['totalAmount'] as num? ?? 0).toDouble();
    final status = sale['status'] as String? ?? 'PENDING';
    final createdAt = sale['createdAt'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (category == 'PRODUCE' ? AppTheme.primaryGreen : AppTheme.accentAmber)
                  .withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              category == 'PRODUCE' ? Icons.grain_outlined : Icons.shopping_bag_outlined,
              color: category == 'PRODUCE' ? AppTheme.primaryGreen : AppTheme.accentAmber,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                if (quantity.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Qty: $quantity',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 2),
                Text(
                  formatCurrency(total),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              StatusBadge(status: status),
              if (createdAt != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    _formatDate(createdAt),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Loans history (VSLA loans) ──────────────────────────────────────────

  Widget _buildLoansHistory() {
    final loans = _farmer?['vslaLoans'] as List<dynamic>?;
    if (loans == null || loans.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Loans History',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          ...loans.map((loan) {
            return _buildLoanHistoryItem(loan as Map<String, dynamic>);
          }),
        ],
      ),
    );
  }

  Widget _buildLoanHistoryItem(Map<String, dynamic> loan) {
    final amount = (loan['amount'] as num? ?? 0).toDouble();
    final status = loan['status'] as String? ?? 'PENDING';
    final purpose = loan['purpose'] as String? ?? 'VSLA Loan';
    final disbursedAt = loan['disbursedAt'] as String? ?? loan['loanDate'] as String?;
    final totalRepayable = (loan['totalRepayable'] as num? ?? 0).toDouble();
    final amountRepaid = (loan['amountRepaid'] as num? ?? 0).toDouble();
    final outstanding =
        ((totalRepayable - amountRepaid).clamp(0, double.infinity)).toDouble();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.account_balance_wallet_outlined,
              color: AppTheme.primaryGreen,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  purpose,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  formatCurrency(amount),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryGreen,
                  ),
                ),
                if (amountRepaid > 0) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Repaid ${formatCurrency(amountRepaid)} of ${formatCurrency(totalRepayable)} · outstanding ${formatCurrency(outstanding)}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              StatusBadge(status: status),
              if (disbursedAt != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    _formatDate(disbursedAt),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── VSLA membership ─────────────────────────────────────────────────────

  Widget _buildVslaMembership() {
    final group = _farmer?['group'] as Map<String, dynamic>?;
    if (group == null || (group['name'] as String?)?.isNotEmpty != true) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'VSLA Membership',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.surfaceLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.accentAmber.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.groups_outlined,
                    color: AppTheme.accentAmber,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        group['name'] as String? ?? '',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const Text(
                        'Member',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Training attendance ─────────────────────────────────────────────────

  Widget _buildTrainingAttendance() {
    final trainings = _farmer?['trainings'] as List<dynamic>?;
    if (trainings == null || trainings.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Training Attendance',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          ...trainings.map((training) {
            // Each record is a TrainingAttendance with a nested `training`.
            final t = training as Map<String, dynamic>;
            final inner = t['training'] as Map<String, dynamic>?;
            final name = inner?['topic'] as String? ?? inner?['name'] as String? ?? 'Training';
            final date = inner?['date'] as String?;
            final attended = t['attended'] as bool? ?? false;

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.surfaceLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(
                    attended
                        ? Icons.check_circle_outline
                        : Icons.cancel_outlined,
                    color:
                        attended ? AppTheme.successGreen : AppTheme.errorRed,
                    size: 18,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      name,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  if (date != null)
                    Text(
                      _formatDate(date),
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(dt);
    } catch (_) {
      return dateStr;
    }
  }
}
