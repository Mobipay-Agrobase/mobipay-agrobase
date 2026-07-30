import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pull_to_refresh_flutter3/pull_to_refresh_flutter3.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/api/api_client.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/empty_state.dart';

/// SACCO Management Page — for the SAA/WFP AMS project.
///
/// Features:
///   - KPI summary cards (SACCOs, members, loans, districts)
///   - List of SACCOs with member/loan counts
///   - Per-SACCO tap → detail view with charts
///   - CSV report export
class SaccoPage extends StatefulWidget {
  const SaccoPage({super.key});

  @override
  State<SaccoPage> createState() => _SaccoPageState();
}

class _SaccoPageState extends State<SaccoPage> {
  final RefreshController _refreshController =
      RefreshController(initialRefresh: true);
  final ApiClient _api = ApiClient();

  List<dynamic> _saccos = [];
  bool _loading = true;
  String? _error;
  String? _selectedSaccoId;

  @override
  void dispose() {
    _refreshController.dispose();
    super.dispose();
  }

  Future<void> _loadSaccos() async {
    try {
      final res = await _api.get('/api/sacco');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _saccos = data['saccos'] ?? [];
          _loading = false;
          _error = null;
        });
      } else {
        setState(() {
          _error = 'Failed to load SACCOs (${res.statusCode})';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
    _refreshController.refreshCompleted();
  }

  @override
  Widget build(BuildContext context) {
    // Show detail view if a SACCO is selected
    if (_selectedSaccoId != null) {
      return _SaccoDetailPage(
        saccoId: _selectedSaccoId!,
        onBack: () {
          setState(() => _selectedSaccoId = null);
          _loadSaccos();
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('SACCO Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: _exportSummary,
            tooltip: 'Export Summary',
          ),
        ],
      ),
      body: SmartRefresher(
        controller: _refreshController,
        onRefresh: _loadSaccos,
        child: _loading
            ? const LoadingShimmer()
            : _error != null
                ? EmptyState(
                    icon: Icons.error_outline,
                    title: 'Error',
                    message: _error!,
                    actionLabel: 'Retry',
                    onAction: () {
                      setState(() => _loading = true);
                      _loadSaccos();
                    },
                  )
                : _saccos.isEmpty
                    ? const EmptyState(
                        icon: Icons.account_balance,
                        title: 'No SACCOs',
                        message: 'No SACCOs found for your tenant.',
                      )
                    : _buildSaccoList(),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/sacco/new'),
        child: const Icon(Icons.add),
        tooltip: 'New SACCO',
      ),
    );
  }

  Widget _buildSaccoList() {
    final totalMembers = _saccos.fold<int>(
        0, (sum, s) => sum + (s['memberCount'] ?? 0) as int);
    final totalLoans = _saccos.fold<int>(
        0, (sum, s) => sum + (s['loanCount'] ?? 0) as int);
    final districts = <String>{};
    for (final s in _saccos) {
      if (s['district'] != null) districts.add(s['district']);
    }

    return CustomScrollView(
      slivers: [
        // KPI cards
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _buildKpiCard('SACCOs', '${_saccos.length}', Icons.account_balance, Colors.teal)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildKpiCard('Members', '$totalMembers', Icons.people, Colors.blue)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(child: _buildKpiCard('Loans', '$totalLoans', Icons.account_balance_wallet, Colors.orange)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildKpiCard('Districts', '${districts.length}', Icons.map, Colors.green)),
                  ],
                ),
              ],
            ),
          ),
        ),
        // SACCO list
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) => _buildSaccoCard(_saccos[index]),
            childCount: _saccos.length,
          ),
        ),
      ],
    );
  }

  Widget _buildKpiCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildSaccoCard(dynamic sacco) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: () {
          setState(() => _selectedSaccoId = sacco['id']);
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      sacco['name'] ?? 'Unknown',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: sacco['isActive'] == true ? Colors.green.shade100 : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      sacco['isActive'] == true ? 'Active' : 'Inactive',
                      style: TextStyle(fontSize: 10, color: sacco['isActive'] == true ? Colors.green.shade700 : Colors.grey.shade600),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${sacco['district'] ?? 'No district'} · ${sacco['registrationNo'] ?? 'No reg. no.'}',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildStatChip('Members', '${sacco['memberCount'] ?? 0}'),
                  const SizedBox(width: 8),
                  _buildStatChip('Loans', '${sacco['loanCount'] ?? 0}'),
                  const SizedBox(width: 8),
                  _buildStatChip('Share', 'UGX ${(sacco['shareValue'] ?? 0)}'),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _exportReport(sacco['id'], sacco['name']),
                      icon: const Icon(Icons.download, size: 18),
                      label: const Text('Report'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        setState(() => _selectedSaccoId = sacco['id']);
                      },
                      icon: const Icon(Icons.bar_chart, size: 18),
                      label: const Text('Details'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatChip(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }

  void _exportReport(String? saccoId, String? saccoName) {
    if (saccoId == null) return;
    _api.get('/api/sacco/reports?saccoId=$saccoId&type=summary&format=csv').then((res) {
      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Report downloaded for ${saccoName ?? "SACCO"}')),
        );
      }
    });
  }

  void _exportSummary() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Use the web admin for full summary export')),
    );
  }
}

// ─── SACCO Detail Page (with charts) ───────────────────────────────────────

class _SaccoDetailPage extends StatefulWidget {
  final String saccoId;
  final VoidCallback onBack;

  const _SaccoDetailPage({required this.saccoId, required this.onBack});

  @override
  State<_SaccoDetailPage> createState() => _SaccoDetailPageState();
}

class _SaccoDetailPageState extends State<_SaccoDetailPage> {
  final ApiClient _api = ApiClient();
  Map<String, dynamic>? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    try {
      final res = await _api.get('/api/sacco/${widget.saccoId}');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _detail = data['sacco'];
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_detail?['name'] ?? 'SACCO Detail'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: widget.onBack,
        ),
      ),
      body: _loading
          ? const LoadingShimmer()
          : _detail == null
              ? const EmptyState(icon: Icons.error, title: 'Not Found', message: 'SACCO not found')
              : _buildDetailContent(),
    );
  }

  Widget _buildDetailContent() {
    final members = _detail!['members'] as List? ?? [];
    final loans = _detail!['loans'] as List? ?? [];
    final shareValue = (_detail!['shareValue'] ?? 10000) as num;
    final interestRate = (_detail!['interestRate'] ?? 12) as num;

    final totalShares = members.fold<int>(0, (s, m) => s + ((m['sharesOwned'] ?? 0) as int));
    final totalSavings = members.fold<double>(0, (s, m) => s + ((m['totalSavings'] ?? 0) as num).toDouble());
    final totalDisbursed = loans.fold<double>(0, (s, l) => s + ((l['principal'] ?? 0) as num).toDouble());
    final totalOutstanding = loans.where((l) => l['status'] == 'DISBURSED').fold<double>(
        0, (s, l) => s + (((l['totalRepayable'] ?? 0) as num).toDouble() - ((l['amountRepaid'] ?? 0) as num).toDouble()));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // KPI Grid
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1.5,
          children: [
            _buildKpiTile('Members', '${members.length}', Icons.people, Colors.blue),
            _buildKpiTile('Share Capital', 'UGX ${(totalShares * shareValue.toInt() / 1000000).toStringAsFixed(1)}M', Icons.wallet, Colors.teal),
            _buildKpiTile('Total Savings', 'UGX ${(totalSavings / 1000000).toStringAsFixed(1)}M', Icons.savings, Colors.green),
            _buildKpiTile('Disbursed', 'UGX ${(totalDisbursed / 1000000).toStringAsFixed(1)}M', Icons.trending_up, Colors.orange),
            _buildKpiTile('Outstanding', 'UGX ${(totalOutstanding / 1000000).toStringAsFixed(1)}M', Icons.trending_down, Colors.red),
            _buildKpiTile('Interest Rate', '${interestRate}%', Icons.percent, Colors.purple),
          ],
        ),
        const SizedBox(height: 16),

        // Loan Status Chart
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Loan Portfolio by Status', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                SizedBox(
                  height: 200,
                  child: _buildLoanStatusChart(loans),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Members List
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Members (${members.length})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...members.take(10).map((m) => _buildMemberRow(m, shareValue.toInt())),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Loans List
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Loans (${loans.length})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...loans.take(10).map((l) => _buildLoanRow(l)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildKpiTile(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 16),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600]), overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildLoanStatusChart(List loans) {
    final statuses = ['PENDING', 'DISBURSED', 'REPAID', 'DEFAULTED'];
    final counts = statuses.map((s) => loans.where((l) => l['status'] == s).length).toList();
    final maxCount = counts.reduce((a, b) => a > b ? a : b).toDouble().clamp(1, double.infinity);

    final colors = [Colors.orange, Colors.teal, Colors.green, Colors.red];

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: maxCount + 1,
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              return BarTooltipItem(
                '${statuses[groupIndex]}: ${counts[groupIndex]}',
                const TextStyle(color: Colors.white, fontSize: 12),
              );
            },
          ),
        ),
        titlesData: FlTitlesData(
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(statuses[value.toInt()].substring(0, 4), style: const TextStyle(fontSize: 10)),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        barGroups: List.generate(4, (i) => BarChartGroupData(
          x: i,
          barRods: [BarChartRodData(toY: counts[i].toDouble(), color: colors[i], width: 30, borderRadius: const BorderRadius.only(topLeft: Radius.circular(4), topRight: Radius.circular(4)))],
        )),
      ),
    );
  }

  Widget _buildMemberRow(dynamic member, int shareValue) {
    final shares = (member['sharesOwned'] ?? 0) as int;
    return ListTile(
      dense: true,
      leading: CircleAvatar(
        child: Text((member['fullName'] ?? '?')[0]),
      ),
      title: Text(member['fullName'] ?? 'Unknown', style: const TextStyle(fontSize: 13)),
      subtitle: Text('${member['memberNumber'] ?? ''} · ${shares} shares', style: const TextStyle(fontSize: 11)),
      trailing: Text('UGX ${(shares * shareValue).toString()}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildLoanRow(dynamic loan) {
    final status = loan['status'] ?? 'PENDING';
    final colors = {
      'PENDING': Colors.orange,
      'DISBURSED': Colors.teal,
      'REPAID': Colors.green,
      'DEFAULTED': Colors.red,
    };
    return ListTile(
      dense: true,
      title: Text(loan['loanNumber'] ?? '', style: const TextStyle(fontSize: 13, fontFamily: 'monospace')),
      subtitle: Text('UGX ${(loan['principal'] ?? 0)}', style: const TextStyle(fontSize: 11)),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: (colors[status] ?? Colors.grey).withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(status, style: TextStyle(fontSize: 10, color: colors[status] ?? Colors.grey, fontWeight: FontWeight.w600)),
      ),
    );
  }
}
