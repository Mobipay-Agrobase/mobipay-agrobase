import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/connectivity/connectivity_manager.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_shimmer.dart';

/// EKB Breakdowns Dashboard (Phase B mirror of web EkbBreakdownSections)
///
/// Shows disaggregated analytics on the mobile app for MD/Admin roles:
///   - Farmer categorization (Youth, Gender, District)
///   - Trainings by Funder
///   - Purchase/Sales breakdowns
///   - Sales by buyer company
///   - Revenue per produce
///   - Loans/Inputs disaggregation
///   - Farm land KPIs + plant breakdown
///   - Input distribution categorization (Tools/Fertilizers/Seedlings)
class EkbBreakdownsPage extends StatefulWidget {
  const EkbBreakdownsPage({super.key});

  @override
  State<EkbBreakdownsPage> createState() => _EkbBreakdownsPageState();
}

class _EkbBreakdownsPageState extends State<EkbBreakdownsPage> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final connectivity = context.read<ConnectivityManager>();
      if (!connectivity.isOnline) {
        if (!mounted) return;
        setState(() {
          _error = 'Breakdowns require an internet connection. Please connect and try again.';
          _loading = false;
        });
        return;
      }
      final res = await ApiClient().get('/api/dashboard/ekibbo-breakdowns');
      if (!mounted) return;
      if (res.statusCode == 200) {
        setState(() {
          _data = jsonDecode(res.body);
          _loading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load breakdowns (HTTP ${res.statusCode})';
          _loading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Error: $e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Breakdowns Dashboard'),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
          ? const LoadingShimmer()
          : _error != null
              ? EmptyState(
                  icon: Icons.error_outline,
                  title: 'Could not load breakdowns',
                  description: _error!,
                  actionLabel: 'Retry',
                  onAction: _load,
                )
              : _data == null
                  ? const EmptyState(
                      icon: Icons.bar_chart,
                      title: 'No data available',
                      description: 'Try refreshing.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          _farmerCategorizationCard(),
                          const SizedBox(height: 16),
                          _trainingsByFunderCard(),
                          const SizedBox(height: 16),
                          _purchaseBreakdownCard(),
                          const SizedBox(height: 16),
                          _salesBreakdownCard(),
                          const SizedBox(height: 16),
                          _salesByBuyerCard(),
                          const SizedBox(height: 16),
                          _revenueByProduceCard(),
                          const SizedBox(height: 16),
                          _loansDisaggCard(),
                          const SizedBox(height: 16),
                          _inputsDisaggCard(),
                          const SizedBox(height: 16),
                          _farmLandKpisCard(),
                          const SizedBox(height: 16),
                          _inputDistributionCategoryCard(),
                        ],
                      ),
                    ),
    );
  }

  // ─── Card primitives ───
  Widget _card(String title, String description, IconData icon, Color color, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                Text(description, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ]),
            ),
          ]),
          const SizedBox(height: 12),
          ...children,
        ]),
      ),
    );
  }

  Widget _kpiRow(List<({String label, String value, IconData icon, Color color})> kpis) {
    return SizedBox(
      height: 72,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: kpis.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final k = kpis[i];
          return Container(
            width: 130,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: k.color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: k.color.withOpacity(0.2)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Row(children: [
                Icon(k.icon, color: k.color, size: 14),
                const SizedBox(width: 4),
                Expanded(child: Text(k.label, style: TextStyle(fontSize: 10, color: Colors.grey[700]), overflow: TextOverflow.ellipsis)),
              ]),
              Text(k.value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            ]),
          );
        },
      ),
    );
  }

  Widget _table(List<Map<String, dynamic>> rows, List<String> columns) {
    if (rows.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text('No data available', style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic)),
      );
    }
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 32,
        dataRowHeight: 32,
        columnSpacing: 12,
        columns: columns.map((c) => DataColumn(label: Text(c, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)))).toList(),
        rows: rows.take(15).map((r) => DataRow(
          cells: columns.map((c) => DataCell(Text('${r[c] ?? '—}', style: const TextStyle(fontSize: 11)))),
        )).toList(),
      ),
    );
  }

  // ─── 1. Farmer categorization ───
  Widget _farmerCategorizationCard() {
    final fc = _data?['farmerCategorization'];
    if (fc == null) return _card('Farmer Categorization', 'Unavailable', Icons.people, Colors.grey, []);
    final youth = fc['byYouth'] ?? {};
    final byGender = (fc['byGender'] as List?) ?? [];
    final byDistrict = (fc['byDistrict'] as List?) ?? [];
    return _card(
      'Farmer Categorization',
      'Youth, gender, district breakdown',
      Icons.people,
      Colors.green,
      [
        _kpiRow([
          (label: 'Total', value: '${fc['totalFarmers'] ?? 0}', icon: Icons.people, color: Colors.green),
          (label: 'Youth ${youth['ageRange'] ?? '18-30'}', value: '${youth['youth'] ?? 0} (${youth['youthRate'] ?? 0}%)', icon: Icons.cake, color: Colors.orange),
          (label: 'Male', value: '${byGender.firstWhere((g) => g['label'] == 'Male', orElse: () => {'count': 0})['count']}', icon: Icons.male, color: Colors.blue),
          (label: 'Female', value: '${byGender.firstWhere((g) => g['label'] == 'Female', orElse: () => {'count': 0})['count']}', icon: Icons.female, color: Colors.pink),
        ]),
        const SizedBox(height: 8),
        const Text('Top Districts', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        _table(
          byDistrict.map((d) => {'District': d['label'], 'Farmers': d['count']}).toList(),
          ['District', 'Farmers'],
        ),
      ],
    );
  }

  // ─── 2. Trainings by funder ───
  Widget _trainingsByFunderCard() {
    final tbf = (_data?['trainingsByFunder'] as List?) ?? [];
    return _card(
      'Trainings by Funder',
      'Count + attendees per funding partner',
      Icons.school,
      Colors.cyan,
      [
        _kpiRow([
          (label: 'Trainings', value: '${tbf.fold<int>(0, (s, f) => s + (f['count'] as num? ?? 0).toInt())}', icon: Icons.school, color: Colors.cyan),
          (label: 'Attendees', value: '${tbf.fold<int>(0, (s, f) => s + (f['attendees'] as num? ?? 0).toInt())}', icon: Icons.people, color: Colors.green),
          (label: 'Funders', value: '${tbf.length}', icon: Icons.business, color: Colors.purple),
        ]),
        const SizedBox(height: 8),
        _table(
          tbf.map((f) => {'Funder': f['funder'], 'Trainings': f['count'], 'Attendees': f['attendees']}).toList(),
          ['Funder', 'Trainings', 'Attendees'],
        ),
      ],
    );
  }

  // ─── 3. Purchase breakdown ───
  Widget _purchaseBreakdownCard() {
    final pb = _data?['purchaseBreakdown'];
    if (pb == null) return _card('Purchase Breakdowns', 'Unavailable', Icons.shopping_cart, Colors.grey, []);
    final byCommodity = (pb['byCommodity'] as List?) ?? [];
    return _card(
      'Purchase Breakdowns',
      'Volume, value by commodity + district',
      Icons.shopping_cart,
      Colors.amber,
      [
        _kpiRow([
          (label: 'Total', value: '${pb['totalPurchases'] ?? 0}', icon: Icons.shopping_cart, color: Colors.amber),
          (label: 'Years', value: '${(pb['byYear'] as List?)?.length ?? 0}', icon: Icons.calendar_today, color: Colors.cyan),
          (label: 'Districts', value: '${(pb['byDistrict'] as List?)?.length ?? 0}', icon: Icons.map, color: Colors.green),
        ]),
        const SizedBox(height: 8),
        const Text('By Commodity', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        _table(
          byCommodity.take(10).map((c) => {
            'Commodity': c['label'],
            'Volume': (c['volume'] as num?)?.toStringAsFixed(1),
            'Value': 'UGX ${(c['value'] ?? 0)}',
            'Count': c['count'],
          }).toList(),
          ['Commodity', 'Volume', 'Value', 'Count'],
        ),
      ],
    );
  }

  // ─── 4. Sales breakdown ───
  Widget _salesBreakdownCard() {
    final sb = _data?['salesBreakdown'];
    if (sb == null) return _card('Sales Breakdowns', 'Unavailable', Icons.receipt, Colors.grey, []);
    final byCommodity = (sb['byCommodity'] as List?) ?? [];
    return _card(
      'Sales Breakdowns',
      'Volume, value by commodity + district',
      Icons.receipt,
      Colors.purple,
      [
        _kpiRow([
          (label: 'Total', value: '${sb['totalSales'] ?? 0}', icon: Icons.receipt, color: Colors.purple),
          (label: 'Years', value: '${(sb['byYear'] as List?)?.length ?? 0}', icon: Icons.calendar_today, color: Colors.cyan),
          (label: 'Districts', value: '${(sb['byDistrict'] as List?)?.length ?? 0}', icon: Icons.map, color: Colors.green),
        ]),
        const SizedBox(height: 8),
        const Text('By Commodity', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        _table(
          byCommodity.take(10).map((c) => {
            'Commodity': c['label'],
            'Volume': (c['volume'] as num?)?.toStringAsFixed(1),
            'Value': 'UGX ${(c['value'] ?? 0)}',
            'Count': c['count'],
          }).toList(),
          ['Commodity', 'Volume', 'Value', 'Count'],
        ),
      ],
    );
  }

  // ─── 5. Sales by buyer ───
  Widget _salesByBuyerCard() {
    final sbb = (_data?['salesByBuyer'] as List?) ?? [];
    final totalValue = sbb.fold<int>(0, (s, b) => s + (b['value'] as num? ?? 0).toInt());
    return _card(
      'Sales by Buyer Company',
      'Top buyers + revenue per buyer',
      Icons.business,
      Colors.indigo,
      [
        _kpiRow([
          (label: 'Buyers', value: '${sbb.length}', icon: Icons.business, color: Colors.indigo),
          (label: 'Total Value', value: 'UGX $totalValue', icon: Icons.receipt, color: Colors.purple),
          (label: 'Avg / Buyer', value: sbb.isNotEmpty ? 'UGX ${(totalValue ~/ sbb.length)}' : '—', icon: Icons.trending_up, color: Colors.green),
        ]),
        const SizedBox(height: 8),
        _table(
          sbb.take(15).map((b) => {
            'Buyer': b['buyerName'],
            'Sales': b['count'],
            'Volume': (b['volume'] as num?)?.toStringAsFixed(1),
            'Value': 'UGX ${(b['value'] ?? 0)}',
          }).toList(),
          ['Buyer', 'Sales', 'Volume', 'Value'],
        ),
      ],
    );
  }

  // ─── 6. Revenue per produce ───
  Widget _revenueByProduceCard() {
    final rbp = (_data?['revenueByProduce'] as List?) ?? [];
    final totalRevenue = rbp.fold<int>(0, (s, p) => s + (p['value'] as num? ?? 0).toInt());
    return _card(
      'Revenue per Produce',
      'Top crops by revenue',
      Icons.eco,
      Colors.green,
      [
        _kpiRow([
          (label: 'Total Revenue', value: 'UGX $totalRevenue', icon: Icons.receipt, color: Colors.green),
          (label: 'Produces', value: '${rbp.length}', icon: Icons.eco, color: Colors.pink),
          (label: 'Top', value: rbp.isNotEmpty ? rbp[0]['produce'] : '—', icon: Icons.star, color: Colors.amber),
        ]),
        const SizedBox(height: 8),
        _table(
          rbp.take(10).map((p) => {
            'Produce': p['produce'],
            'Volume': (p['volume'] as num?)?.toStringAsFixed(1),
            'Revenue': 'UGX ${(p['value'] ?? 0)}',
            'Avg/kg': p['avgPricePerUnit'] != null ? 'UGX ${p['avgPricePerUnit']}' : '—',
          }).toList(),
          ['Produce', 'Volume', 'Revenue', 'Avg/kg'],
        ),
      ],
    );
  }

  // ─── 7. Loans disaggregation ───
  Widget _loansDisaggCard() {
    final ld = _data?['loansDisaggregation'];
    if (ld == null) return _card('Loans Disaggregation', 'Unavailable', Icons.account_balance, Colors.grey, []);
    final byGender = (ld['byGender'] as List?) ?? [];
    final byType = (ld['byType'] as List?) ?? [];
    // Cast to num first — JSON values come as num (could be int or double).
    final totalLoans = (ld['totalLoans'] as num?)?.toInt() ?? 0;
    final totalAmount = (ld['totalAmount'] as num?)?.toInt() ?? 0;
    final avgLoan = totalLoans > 0 ? (totalAmount ~/ totalLoans) : null;
    return _card(
      'Loans Disaggregation',
      'By gender, age, district, type',
      Icons.account_balance,
      Colors.red,
      [
        _kpiRow([
          (label: 'Total Loans', value: '$totalLoans', icon: Icons.account_balance, color: Colors.red),
          (label: 'Total Amount', value: 'UGX $totalAmount', icon: Icons.receipt, color: Colors.purple),
          (label: 'Avg Loan', value: avgLoan != null ? 'UGX $avgLoan' : '—', icon: Icons.trending_up, color: Colors.green),
        ]),
        const SizedBox(height: 8),
        const Text('By Gender', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        _table(byGender.map((g) => {'Gender': g['label'], 'Count': g['count'], 'Amount': 'UGX ${g['amount']}'}).toList(), ['Gender', 'Count', 'Amount']),
        const SizedBox(height: 8),
        const Text('By Type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        _table(byType.map((t) => {'Type': t['label'], 'Count': t['count'], 'Amount': 'UGX ${t['amount']}'}).toList(), ['Type', 'Count', 'Amount']),
      ],
    );
  }

  // ─── 8. Inputs disaggregation ───
  Widget _inputsDisaggCard() {
    final id = _data?['inputsDisaggregation'];
    if (id == null) return _card('Inputs Disaggregation', 'Unavailable', Icons.inventory, Colors.grey, []);
    final byGender = (id['byGender'] as List?) ?? [];
    final byType = (id['byType'] as List?) ?? [];
    // Cast to num first — JSON values come as num (could be int or double).
    final totalDist = (id['totalDistributions'] as num?)?.toInt() ?? 0;
    final totalAmount = (id['totalAmount'] as num?)?.toInt() ?? 0;
    final avgDist = totalDist > 0 ? (totalAmount ~/ totalDist) : null;
    return _card(
      'Inputs Disaggregation',
      'By gender, age, district, type',
      Icons.inventory,
      Colors.amber,
      [
        _kpiRow([
          (label: 'Distributions', value: '$totalDist', icon: Icons.inventory, color: Colors.amber),
          (label: 'Total Cost', value: 'UGX $totalAmount', icon: Icons.receipt, color: Colors.purple),
          (label: 'Avg', value: avgDist != null ? 'UGX $avgDist' : '—', icon: Icons.trending_up, color: Colors.green),
        ]),
        const SizedBox(height: 8),
        const Text('By Gender', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        _table(byGender.map((g) => {'Gender': g['label'], 'Count': g['count'], 'Amount': 'UGX ${g['amount']}'}).toList(), ['Gender', 'Count', 'Amount']),
        const SizedBox(height: 8),
        const Text('By Type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        _table(byType.map((t) => {'Type': t['label'], 'Count': t['count'], 'Amount': 'UGX ${t['amount']}'}).toList(), ['Type', 'Count', 'Amount']),
      ],
    );
  }

  // ─── 9. Farm Land KPIs ───
  Widget _farmLandKpisCard() {
    final fl = _data?['farmLandKpis'];
    if (fl == null) return _card('Farm Land KPIs', 'Unavailable', Icons.landscape, Colors.grey, []);
    final pb = (fl['plantBreakdown'] as List?) ?? [];
    return _card(
      'Farm Land KPIs',
      'Plots, acreage, plants + breakdown',
      Icons.landscape,
      Colors.green,
      [
        _kpiRow([
          (label: 'Plots', value: '${fl['totalPlots'] ?? 0}', icon: Icons.landscape, color: Colors.green),
          (label: 'Acreage (ha)', value: '${fl['totalAcreageHa'] ?? 0}', icon: Icons.crop_square, color: Colors.amber),
          (label: 'Plants/Trees', value: '${fl['totalPlants'] ?? 0}', icon: Icons.forest, color: Colors.red),
          (label: 'Avg/Plot (ha)', value: '${fl['avgAcreagePerPlot'] ?? 0}', icon: Icons.trending_up, color: Colors.cyan),
        ]),
        const SizedBox(height: 8),
        const Text('Plant Breakdown by Crop', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        _table(
          pb.take(10).map((c) => {
            'Crop': c['cropName'],
            'Plants': c['plantCount'],
            'Area (ha)': c['areaHa'],
            'Plots': c['plotCount'],
          }).toList(),
          ['Crop', 'Plants', 'Area (ha)', 'Plots'],
        ),
      ],
    );
  }

  // ─── 10. Input distribution by category ───
  Widget _inputDistributionCategoryCard() {
    final idc = _data?['inputDistributionByCategory'];
    if (idc == null) return _card('Input Distribution by Category', 'Unavailable', Icons.category, Colors.grey, []);
    final categories = (idc['categories'] as List?) ?? [];
    return _card(
      'Input Distribution by Category',
      'Tools / Fertilizers / Seedlings / Other',
      Icons.category,
      Colors.blue,
      [
        _kpiRow(categories.take(4).map((c) {
          Color color = Colors.blue;
          IconData icon = Icons.inventory;
          if (c['category'] == 'Tools') { color = Colors.amber; icon = Icons.build; }
          else if (c['category'] == 'Fertilizers') { color = Colors.green; icon = Icons.science; }
          else if (c['category'] == 'Seedlings') { color = Colors.red; icon = Icons.forest; }
          return (label: c['category'], value: '${c['count']}', icon: icon, color: color);
        }).toList()),
        const SizedBox(height: 8),
        _table(
          categories.map((c) => {
            'Category': c['category'],
            'Count': c['count'],
            'Quantity': (c['quantity'] as num?)?.toStringAsFixed(1),
            'Amount': 'UGX ${c['amount']}',
            '%': '${c['pct']}%',
          }).toList(),
          ['Category', 'Count', 'Quantity', 'Amount', '%'],
        ),
      ],
    );
  }
}
