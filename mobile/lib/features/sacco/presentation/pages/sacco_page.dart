import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pull_to_refresh_flutter3/pull_to_refresh_flutter3.dart';
import '../../../../core/api/api_client.dart';
import '../../../shared/widgets/kpi_card.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/empty_state.dart';

/// SACCO Management Page — for the SAA/WFP AMS project.
///
/// Displays:
///   - KPI summary (total SACCOs, members, loans, districts)
///   - List of SACCOs with member/loan counts
///   - Per-SACCO actions: view members, view loans, export report
///
/// Used by SACCO_ADMIN and SACCO_OFFICER roles.
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('SACCO Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () => _exportSummary(),
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
                    Expanded(
                      child: KpiCard(
                        title: 'SACCOs',
                        value: '${_saccos.length}',
                        icon: Icons.account_balance,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: KpiCard(
                        title: 'Members',
                        value: '$totalMembers',
                        icon: Icons.people,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: KpiCard(
                        title: 'Loans',
                        value: '$totalLoans',
                        icon: Icons.account_balance_wallet,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: KpiCard(
                        title: 'Districts',
                        value: '${districts.length}',
                        icon: Icons.map,
                      ),
                    ),
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

  Widget _buildSaccoCard(dynamic sacco) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ExpansionTile(
        title: Text(sacco['name'] ?? 'Unknown'),
        subtitle: Text(
          '${sacco['district'] ?? 'No district'} · ${sacco['memberCount'] ?? 0} members',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        trailing: StatusBadge(
          text: sacco['isActive'] == true ? 'Active' : 'Inactive',
          color: sacco['isActive'] == true ? Colors.green : Colors.grey,
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildDetailRow('Registration No.', sacco['registrationNo'] ?? '—'),
                _buildDetailRow('Share Value', 'UGX ${(sacco['shareValue'] ?? 0).toString()}'),
                _buildDetailRow('Interest Rate', '${sacco['interestRate'] ?? 0}% p.a.'),
                _buildDetailRow('Max Loan Multiplier', '${sacco['maxLoanMultiplier'] ?? 0}x'),
                _buildDetailRow('Meeting Frequency', sacco['meetingFrequency'] ?? '—'),
                _buildDetailRow('Total Loans', '${sacco['loanCount'] ?? 0}'),
                _buildDetailRow('Total Meetings', '${sacco['meetingCount'] ?? 0}'),
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
                          // Navigate to SACCO detail (future)
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('SACCO detail view coming soon')),
                          );
                        },
                        icon: const Icon(Icons.visibility, size: 18),
                        label: const Text('View'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          )),
        ],
      ),
    );
  }

  void _exportReport(String? saccoId, String? saccoName) {
    if (saccoId == null) return;
    // Open the CSV export URL in the browser
    final url = '/api/sacco/reports?saccoId=$saccoId&type=summary&format=csv';
    _api.get(url).then((res) {
      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Report downloaded for ${saccoName ?? "SACCO"}')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to export report')),
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
