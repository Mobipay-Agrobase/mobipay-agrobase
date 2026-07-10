import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:pull_to_refresh_flutter3/pull_to_refresh_flutter3.dart';
import 'package:intl/intl.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../shared/widgets/kpi_card.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/empty_state.dart';

/// Recovery Dashboard for mobile — shows the tenant's billing arrangement
/// and investment recovery progress.
///
/// Visible to: EKB_MD, EKB_FINANCE (any role with billing:read)
/// API: GET /api/billing/recovery
///
/// File: mobile/lib/features/billing/presentation/pages/recovery_page.dart

class RecoveryPage extends StatefulWidget {
  const RecoveryPage({super.key});

  @override
  State<RecoveryPage> createState() => _RecoveryPageState();
}

class _RecoveryPageState extends State<RecoveryPage> {
  final RefreshController _refreshController =
      RefreshController(initialRefresh: true);

  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  final _currencyFormat = NumberFormat.currency(symbol: 'UGX ', decimalDigits: 0);

  Future<void> _loadData() async {
    try {
      final api = ApiClient();
      final res = await api.get('/api/billing/recovery');

      if (res.statusCode == 200) {
        setState(() {
          _data = jsonDecode(res.body);
          _error = null;
        });
      } else if (res.statusCode == 403) {
        setState(() {
          _error = 'You do not have permission to view billing data.';
        });
      } else {
        setState(() {
          _error = 'Failed to load recovery data (${res.statusCode})';
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Network error: $e';
      });
    } finally {
      setState(() => _loading = false);
      _refreshController.refreshCompleted();
    }
  }

  @override
  void dispose() {
    _refreshController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      appBar: AppBar(
        title: const Text('Platform Recovery'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _loading = true);
              _loadData();
            },
          ),
        ],
      ),
      body: SmartRefresher(
        controller: _refreshController,
        onRefresh: _loadData,
        child: _loading
            ? const LoadingShimmer()
            : _error != null
                ? EmptyState(
                    icon: Icons.error_outline,
                    title: 'Something went wrong',
                    message: _error!,
                    actionLabel: 'Retry',
                    onAction: () {
                      setState(() {
                        _loading = true;
                        _error = null;
                      });
                      _loadData();
                    },
                  )
                : _data == null || _data!['agreement'] == null
                    ? _buildNoAgreement()
                    : _buildContent(),
      ),
    );
  }

  Widget _buildNoAgreement() {
    return EmptyState(
      icon: Icons.receipt_long_outlined,
      title: 'No Billing Arrangement',
      message: 'Contact MobiPay AgroSys to set up your billing arrangement.',
    );
  }

  Widget _buildContent() {
    final agreement = _data!['agreement'] as Map<String, dynamic>;
    final billingModel = agreement['billingModel'] as String? ?? '';
    final isVendorFinancing = billingModel == 'VENDOR_FINANCING';
    final isRecovered = agreement['status'] == 'RECOVERED';

    final investmentRemaining =
        (_data!['investmentRemaining'] as num?)?.toDouble() ?? 0;
    final recoveredPercent =
        (_data!['recoveredPercent'] as num?)?.toDouble() ?? 0;
    final projectedRecoveryMonth =
        _data!['projectedRecoveryMonth'] as String?;
    final thisMonthFees =
        (_data!['thisMonthFees'] as num?)?.toDouble() ?? 0;
    final thisMonthCost =
        (_data!['thisMonthCost'] as num?)?.toDouble() ?? 0;
    final thisMonthSurplus =
        (_data!['thisMonthSurplus'] as num?)?.toDouble() ?? 0;
    final thisMonthTxnCount =
        _data!['thisMonthTransactionCount'] as int? ?? 0;

    final upfrontInvestment =
        (agreement['upfrontInvestment'] as num?)?.toDouble() ?? 0;
    final recoveredAmount =
        (agreement['recoveredAmount'] as num?)?.toDouble() ?? 0;
    final feeType = agreement['feeType'] as String?;
    final feeRate = (agreement['feeRate'] as num?)?.toDouble() ?? 0;
    final recurringMonthlyCost =
        (agreement['recurringMonthlyCost'] as num?)?.toDouble() ?? 0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Billing Model Banner
        _buildModelBanner(billingModel, isRecovered, feeType, feeRate),
        const SizedBox(height: 16),

        // KPI Cards
        if (isVendorFinancing && !isRecovered) ...[
          KpiCard(
            title: 'Investment Remaining',
            value: _currencyFormat.format(investmentRemaining),
            icon: Icons.access_time,
            color: Colors.amber,
          ),
          const SizedBox(height: 12),
          KpiCard(
            title: 'Recovered',
            value: '${recoveredPercent.toStringAsFixed(1)}%',
            icon: Icons.trending_up,
            color: Colors.green,
          ),
          const SizedBox(height: 12),
        ],
        KpiCard(
          title: 'Fees This Month',
          value: _currencyFormat.format(thisMonthFees),
          icon: Icons.receipt,
          color: Colors.blue,
        ),
        const SizedBox(height: 12),
        KpiCard(
          title: 'Transactions This Month',
          value: thisMonthTxnCount.toString(),
          icon: Icons.show_chart,
          color: Colors.purple,
        ),
        const SizedBox(height: 24),

        // Recovery Progress (vendor financing only)
        if (isVendorFinancing) ...[
          _buildRecoveryProgress(
            recoveredAmount: recoveredAmount,
            upfrontInvestment: upfrontInvestment,
            recoveredPercent: recoveredPercent,
            projectedRecoveryMonth: projectedRecoveryMonth,
            thisMonthFees: thisMonthFees,
            thisMonthCost: thisMonthCost,
            thisMonthSurplus: thisMonthSurplus,
            isRecovered: isRecovered,
            recurringMonthlyCost: recurringMonthlyCost,
            recoveryPeriodMonths: agreement['recoveryPeriodMonths'] as int?,
          ),
          const SizedBox(height: 16),
        ],

        // Recovered banner
        if (isRecovered)
          _buildRecoveredBanner(
            recurringMonthlyCost: recurringMonthlyCost,
            upfrontInvestment: upfrontInvestment,
            recoveryPeriodMonths: agreement['recoveryPeriodMonths'] as int?,
          ),
      ],
    );
  }

  Widget _buildModelBanner(
    String billingModel,
    bool isRecovered,
    String? feeType,
    double feeRate,
  ) {
    final modelLabel = billingModel == 'VENDOR_FINANCING'
        ? 'Vendor Financing — No Upfront Cost'
        : billingModel == 'SUBSCRIPTION'
            ? 'Annual Subscription'
            : billingModel == 'HYBRID'
                ? 'Hybrid — Subscription + Reduced Fee'
                : billingModel;

    final feeLabel = feeType == 'PERCENTAGE'
        ? '${(feeRate * 100).toStringAsFixed(1)}% of transactions'
        : feeType == 'PER_KG'
            ? 'UGX ${feeRate.toStringAsFixed(0)}/kg'
            : feeType ?? '—';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    modelLabel,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isRecovered ? Colors.blue : Colors.green,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isRecovered ? 'Recovered' : 'Active',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Fee Type',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      Text(
                        feeLabel,
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecoveryProgress({
    required double recoveredAmount,
    required double upfrontInvestment,
    required double recoveredPercent,
    String? projectedRecoveryMonth,
    required double thisMonthFees,
    required double thisMonthCost,
    required double thisMonthSurplus,
    required bool isRecovered,
    required double recurringMonthlyCost,
    int? recoveryPeriodMonths,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.savings, size: 18, color: Colors.amber),
                const SizedBox(width: 8),
                const Text(
                  'Investment Recovery Progress',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Progress bar
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recovered: ${_currencyFormat.format(recoveredAmount)}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                Text(
                  'of ${_currencyFormat.format(upfrontInvestment)}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: recoveredPercent / 100,
                minHeight: 12,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(
                  isRecovered ? Colors.blue : Colors.amber,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${recoveredPercent.toStringAsFixed(1)}% recovered',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (projectedRecoveryMonth != null)
                  Text(
                    'Projected: $projectedRecoveryMonth',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            // This month breakdown
            const Text(
              "This Month's Breakdown",
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildBreakdownCard(
                    'Fees Collected',
                    _currencyFormat.format(thisMonthFees),
                    Colors.green,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildBreakdownCard(
                    'Platform Cost',
                    _currencyFormat.format(thisMonthCost),
                    Colors.amber,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildBreakdownCard(
                    'Surplus to Recovery',
                    _currencyFormat.format(thisMonthSurplus),
                    thisMonthSurplus >= 0 ? Colors.blue : Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBreakdownCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: Colors.grey),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecoveredBanner({
    required double recurringMonthlyCost,
    required double upfrontInvestment,
    int? recoveryPeriodMonths,
  }) {
    final oldAnnual = recoveryPeriodMonths != null
        ? (upfrontInvestment / recoveryPeriodMonths * 12) + (recurringMonthlyCost * 12)
        : recurringMonthlyCost * 12;
    final newAnnual = recurringMonthlyCost * 12;

    return Card(
      color: Colors.blue.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.check_circle, color: Colors.blue, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Investment Fully Recovered!',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "MobiPay's upfront investment has been fully recovered from transaction fees. "
                    "Your annual platform cost has dropped from ${_currencyFormat.format(oldAnnual)} "
                    "to ${_currencyFormat.format(newAnnual)} (recurring costs only).",
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
