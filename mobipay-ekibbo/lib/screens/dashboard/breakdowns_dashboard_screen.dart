import 'dart:convert';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// EKiBBO Breakdowns Dashboard (Screen 10).
///
/// Fetches `/api/dashboard/ekibbo-breakdowns` and renders 10 cards vertically
/// scrollable:
///   1. Farmer Categorization — totalFarmers, youth count + rate, gender split,
///      top districts table
///   2. Trainings by Funder — count + attendees per funder, bar chart + table
///   3. Purchase Breakdowns — total, by commodity table
///   4. Sales Breakdowns — total, by commodity table
///   5. Sales by Buyer — top buyers table
///   6. Revenue per Produce — top crops by revenue, table
///   7. Loans Disaggregation — by gender + by type tables
///   8. Inputs Disaggregation — by gender + by type tables
///   9. Farm Land KPIs — totalPlots, totalAcreageHa, totalPlants, plant
///      breakdown by crop table
///   10. Input Distribution by Category — Tools/Fertilizers/Seedlings/Other
///       counts + amounts
///
/// Each card: title with icon, KPI row (horizontal scroll of small stat tiles),
/// optional data table, optional chart. Two charts use fl_chart:
///   - Pie chart: gender split inside Farmer Categorization
///   - Bar chart: trainings by funder inside Trainings by Funder
class BreakdownsDashboardScreen extends StatefulWidget {
  const BreakdownsDashboardScreen({super.key});

  @override
  State<BreakdownsDashboardScreen> createState() =>
      _BreakdownsDashboardScreenState();
}

class _BreakdownsDashboardScreenState extends State<BreakdownsDashboardScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBreakdowns();
  }

  Future<void> _loadBreakdowns() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().get('/api/dashboard/ekibbo-breakdowns');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode != 200) {
        if (!mounted) return;
        setState(() {
          _error = '${AppLang.local.load_failed} (HTTP ${res.statusCode})';
          _loading = false;
        });
        return;
      }
      final body = jsonDecode(res.body);
      // Server may return either the breakdowns object directly or wrapped
      // under `data` / `breakdowns`.
      final data = body is Map
          ? (body['breakdowns'] ?? body['data'] ?? body)
          : <String, dynamic>{};
      if (!mounted) return;
      setState(() {
        _data = data is Map ? Map<String, dynamic>.from(data) : null;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '${AppLang.local.load_failed} ($e)';
        _loading = false;
      });
    }
  }

  Future<void> _handleUnauthorized() async {
    await ApiClient().clearSession();
    ApiClient().clearAuth();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.session_expired),
        backgroundColor: ColorConstant.danger,
      ),
    );
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  // ─── JSON helpers ────────────────────────────────────────────────────────
  String _str(dynamic v) => v == null ? '' : v.toString();

  int _asInt(dynamic v) {
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  double _asDouble(dynamic v) {
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0.0;
    return 0.0;
  }

  List<Map<String, dynamic>> _asListOfMaps(dynamic v) {
    if (v is! List) return [];
    return v
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  Map<String, dynamic> _asMap(dynamic v) {
    if (v is! Map) return <String, dynamic>{};
    return Map<String, dynamic>.from(v);
  }

  String _formatNum(dynamic v) {
    final n = _asDouble(v);
    if (n == n.toInt()) return n.toInt().toString();
    return n.toStringAsFixed(2);
  }

  String _formatCurrency(dynamic v) {
    final n = _asDouble(v);
    if (n >= 1000000) return 'UGX ${(n / 1000000).toStringAsFixed(2)}M';
    if (n >= 1000) return 'UGX ${(n / 1000).toStringAsFixed(1)}K';
    return 'UGX ${n.toStringAsFixed(0)}';
  }

  // Section color palette for charts
  static const _chartColors = <Color>[
    ColorConstant.primary,
    ColorConstant.secondary,
    ColorConstant.gold,
    ColorConstant.info,
    ColorConstant.success,
    ColorConstant.warning,
    ColorConstant.danger,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: AppLang.local.breakdowns_dashboard,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            tooltip: AppLang.local.retry,
            onPressed: _loadBreakdowns,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : RefreshIndicator(
                  onRefresh: _loadBreakdowns,
                  child: _data == null
                      ? ListView(
                          children: [
                            const SizedBox(height: 80),
                            EmptyStateInline(
                              title: AppLang.local.no_breakdowns,
                              description: AppLang.local.no_breakdowns_desc,
                            ),
                          ],
                        )
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
                          children: _buildSections(_data!),
                        ),
                ),
    );
  }

  List<Widget> _buildSections(Map<String, dynamic> data) {
    return [
      _buildFarmerCategorization(_asMap(data['farmerCategorization'])),
      const SizedBox(height: 12),
      _buildTrainingsByFunder(_asMap(data['trainingsByFunder'])),
      const SizedBox(height: 12),
      _buildPurchaseBreakdown(_asMap(data['purchaseBreakdown'])),
      const SizedBox(height: 12),
      _buildSalesBreakdown(_asMap(data['salesBreakdown'])),
      const SizedBox(height: 12),
      _buildSalesByBuyer(_asMap(data['salesByBuyer'])),
      const SizedBox(height: 12),
      _buildRevenuePerProduce(_asMap(data['revenueByProduce'])),
      const SizedBox(height: 12),
      _buildLoansDisaggregation(_asMap(data['loansDisaggregation'])),
      const SizedBox(height: 12),
      _buildInputsDisaggregation(_asMap(data['inputsDisaggregation'])),
      const SizedBox(height: 12),
      _buildFarmLandKpis(_asMap(data['farmLandKpis'])),
      const SizedBox(height: 12),
      _buildInputDistributionByCategory(
          _asMap(data['inputDistributionByCategory'])),
    ];
  }

  // ─── Card scaffolding ────────────────────────────────────────────────────
  Widget _card({
    required String title,
    required IconData icon,
    required Color iconColor,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.grayEB),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyleConstant.robotoW600(
                    fontSize: 13,
                    color: ColorConstant.heading,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _kpiTile(String label, String value, Color color) {
    return Container(
      width: 110,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyleConstant.quicksandW700(
              fontSize: 16,
              color: color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyleConstant.robotoW400(
              fontSize: 10,
              color: ColorConstant.textSecondary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _kpiRow(List<Widget> tiles) {
    return SizedBox(
      height: 76,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: tiles.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => tiles[i],
      ),
    );
  }

  // ─── Data table builder ──────────────────────────────────────────────────
  Widget _buildTable({
    required List<String> headers,
    required List<List<String>> rows,
  }) {
    if (rows.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(
          AppLang.local.no_data_for_tab,
          style: TextStyleConstant.robotoW400(
            fontSize: 11,
            color: ColorConstant.textSecondary,
          ),
        ),
      );
    }
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: ColorConstant.grayEB),
        borderRadius: BorderRadius.circular(8),
      ),
      clipBehavior: Clip.antiAlias,
      child: Table(
        columnWidths: const {
          0: FlexColumnWidth(2),
          1: FlexColumnWidth(1),
          2: FlexColumnWidth(1.2),
        },
        children: [
          TableRow(
            decoration: const BoxDecoration(color: ColorConstant.grayF6F7F9),
            children: headers
                .map(
                  (h) => Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 6),
                    child: Text(
                      h,
                      style: TextStyleConstant.robotoW600(
                        fontSize: 10,
                        color: ColorConstant.heading,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          ...rows.map(
            (r) => TableRow(
              children: r
                  .asMap()
                  .entries
                  .map(
                    (e) => Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 6),
                      child: Text(
                        e.value,
                        textAlign: e.key == 0 ? TextAlign.left : TextAlign.right,
                        style: TextStyleConstant.robotoW400(
                          fontSize: 10,
                          color: ColorConstant.textPrimary,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Section 1: Farmer Categorization ────────────────────────────────────
  Widget _buildFarmerCategorization(Map<String, dynamic> d) {
    final total = _asInt(d['totalFarmers']);
    final youth = _asInt(d['youthCount']);
    final youthRate = _asDouble(d['youthRate']);
    final male = _asInt(d['maleCount']);
    final female = _asInt(d['femaleCount']);
    final districts = _asListOfMaps(d['topDistricts']);
    return _card(
      title: AppLang.local.farmer_categorization,
      icon: Icons.people_outline,
      iconColor: ColorConstant.secondary,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.total_farmers, '$total',
              ColorConstant.secondary),
          _kpiTile(AppLang.local.youth, '$youth', ColorConstant.primary),
          _kpiTile(
              AppLang.local.youth_rate, '${youthRate.toStringAsFixed(1)}%',
              ColorConstant.gold),
          _kpiTile(AppLang.local.male, '$male', ColorConstant.info),
          _kpiTile(AppLang.local.female, '$female', ColorConstant.primary),
        ]),
        if (male + female > 0) ...[
          const SizedBox(height: 12),
          _buildGenderPie(male, female),
        ],
        if (districts.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            AppLang.local.top_districts.toUpperCase(),
            style: TextStyleConstant.robotoW600(
              fontSize: 10,
              color: ColorConstant.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          _buildTable(
            headers: [
              AppLang.local.district,
              AppLang.local.farmers,
              AppLang.local.youth
            ],
            rows: districts
                .map((e) => [
                      _str(e['district'] ?? e['name']),
                      '${_asInt(e['farmerCount'] ?? e['count'])}',
                      '${_asInt(e['youthCount'])}',
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildGenderPie(int male, int female) {
    final total = (male + female).toDouble();
    if (total == 0) return const SizedBox.shrink();
    return Row(
      children: [
        SizedBox(
          width: 100,
          height: 100,
          child: PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 28,
              sections: [
                PieChartSectionData(
                  value: male.toDouble(),
                  color: ColorConstant.info,
                  title: '',
                  radius: 24,
                ),
                PieChartSectionData(
                  value: female.toDouble(),
                  color: ColorConstant.primary,
                  title: '',
                  radius: 24,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _legendDot(ColorConstant.info,
                '${AppLang.local.male}: $male (${(male / total * 100).toStringAsFixed(0)}%)'),
            const SizedBox(height: 6),
            _legendDot(ColorConstant.primary,
                '${AppLang.local.female}: $female (${(female / total * 100).toStringAsFixed(0)}%)'),
          ],
        ),
      ],
    );
  }

  Widget _legendDot(Color color, String text) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyleConstant.robotoW500(
            fontSize: 11,
            color: ColorConstant.textPrimary,
          ),
        ),
      ],
    );
  }

  // ─── Section 2: Trainings by Funder ──────────────────────────────────────
  Widget _buildTrainingsByFunder(Map<String, dynamic> d) {
    final total = _asInt(d['totalTrainings'] ?? d['total']);
    final totalAttendees = _asInt(d['totalAttendees']);
    final funders = _asListOfMaps(d['byFunder'] ?? d['funders']);
    return _card(
      title: AppLang.local.trainings_by_funder,
      icon: Icons.school_outlined,
      iconColor: ColorConstant.gold,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.trainings, '$total', ColorConstant.gold),
          _kpiTile(AppLang.local.attendees, '$totalAttendees',
              ColorConstant.secondary),
          _kpiTile(AppLang.local.funders, '${funders.length}',
              ColorConstant.primary),
        ]),
        if (funders.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildTrainingsFunderChart(funders),
          const SizedBox(height: 12),
          _buildTable(
            headers: [
              AppLang.local.funder,
              AppLang.local.trainings,
              AppLang.local.attendees
            ],
            rows: funders
                .map((e) => [
                      _str(e['funder'] ?? e['name']),
                      '${_asInt(e['count'] ?? e['trainingCount'])}',
                      '${_asInt(e['attendees'] ?? e['attendeeCount'])}',
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildTrainingsFunderChart(List<Map<String, dynamic>> funders) {
    final bars = <BarChartGroupData>[];
    for (var i = 0; i < funders.length; i++) {
      final f = funders[i];
      final count = _asInt(f['count'] ?? f['trainingCount']).toDouble();
      final color = _chartColors[i % _chartColors.length];
      bars.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: count,
              gradient: LinearGradient(colors: [color, color]),
              width: 18,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(4),
                topRight: Radius.circular(4),
              ),
            ),
          ],
        ),
      );
    }
    return SizedBox(
      height: 160,
      child: Padding(
        padding: const EdgeInsets.only(top: 8, right: 8),
        child: BarChart(
          BarChartData(
            alignment: BarChartAlignment.spaceAround,
            titlesData: FlTitlesData(
              topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
              rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 28,
                  getTitlesWidget: (v, _) => Text(
                    v.toInt().toString(),
                    style: TextStyleConstant.robotoW400(
                        fontSize: 9, color: ColorConstant.textSecondary),
                  ),
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 28,
                  getTitlesWidget: (v, _) {
                    final i = v.toInt();
                    if (i < 0 || i >= funders.length) {
                      return const SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        _str(funders[i]['funder'] ?? funders[i]['name']),
                        style: TextStyleConstant.robotoW400(
                          fontSize: 9,
                          color: ColorConstant.textSecondary,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            borderData: FlBorderData(
              show: true,
              border: Border(
                top: BorderSide.none,
                right: BorderSide.none,
                left: BorderSide(color: ColorConstant.grayEB),
                bottom: BorderSide(color: ColorConstant.grayEB),
              ),
            ),
            barGroups: bars,
            gridData: const FlGridData(show: false),
          ),
        ),
      ),
    );
  }

  // ─── Section 3: Purchase Breakdowns ──────────────────────────────────────
  Widget _buildPurchaseBreakdown(Map<String, dynamic> d) {
    final total = _asDouble(d['totalValue'] ?? d['total']);
    final totalQty = _asDouble(d['totalQuantity'] ?? d['totalKg']);
    final commodities = _asListOfMaps(d['byCommodity'] ?? d['commodities']);
    return _card(
      title: AppLang.local.purchase_breakdowns,
      icon: Icons.shopping_cart_outlined,
      iconColor: ColorConstant.primary,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.total_value, _formatCurrency(total),
              ColorConstant.primary),
          _kpiTile(AppLang.local.total_qty, '${_formatNum(totalQty)} kg',
              ColorConstant.secondary),
          _kpiTile(AppLang.local.commodities, '${commodities.length}',
              ColorConstant.gold),
        ]),
        if (commodities.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildTable(
            headers: [
              AppLang.local.commodity,
              AppLang.local.quantity,
              AppLang.local.amount
            ],
            rows: commodities
                .map((e) => [
                      _str(e['commodity'] ?? e['name']),
                      '${_formatNum(e['quantity'] ?? e['totalKg'])} kg',
                      _formatCurrency(e['value'] ?? e['totalValue']),
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  // ─── Section 4: Sales Breakdowns ─────────────────────────────────────────
  Widget _buildSalesBreakdown(Map<String, dynamic> d) {
    final total = _asDouble(d['totalValue'] ?? d['total']);
    final totalQty = _asDouble(d['totalQuantity'] ?? d['totalKg']);
    final commodities = _asListOfMaps(d['byCommodity'] ?? d['commodities']);
    return _card(
      title: AppLang.local.sales_breakdowns,
      icon: Icons.point_of_sale_outlined,
      iconColor: ColorConstant.secondary,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.total_value, _formatCurrency(total),
              ColorConstant.secondary),
          _kpiTile(AppLang.local.total_qty, '${_formatNum(totalQty)} kg',
              ColorConstant.primary),
          _kpiTile(AppLang.local.commodities, '${commodities.length}',
              ColorConstant.gold),
        ]),
        if (commodities.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildTable(
            headers: [
              AppLang.local.commodity,
              AppLang.local.quantity,
              AppLang.local.amount
            ],
            rows: commodities
                .map((e) => [
                      _str(e['commodity'] ?? e['name']),
                      '${_formatNum(e['quantity'] ?? e['totalKg'])} kg',
                      _formatCurrency(e['value'] ?? e['totalValue']),
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  // ─── Section 5: Sales by Buyer ───────────────────────────────────────────
  Widget _buildSalesByBuyer(Map<String, dynamic> d) {
    final total = _asDouble(d['totalValue'] ?? d['total']);
    final buyers = _asListOfMaps(d['topBuyers'] ?? d['byBuyer']);
    return _card(
      title: AppLang.local.sales_by_buyer,
      icon: Icons.store_outlined,
      iconColor: ColorConstant.gold,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.total_value, _formatCurrency(total),
              ColorConstant.gold),
          _kpiTile(AppLang.local.buyers, '${buyers.length}',
              ColorConstant.primary),
        ]),
        if (buyers.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildTable(
            headers: [
              AppLang.local.buyer,
              AppLang.local.quantity,
              AppLang.local.amount
            ],
            rows: buyers
                .map((e) => [
                      _str(e['buyer'] ?? e['buyerCompany'] ?? e['name']),
                      '${_formatNum(e['quantity'] ?? e['totalKg'])} kg',
                      _formatCurrency(e['value'] ?? e['totalValue']),
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  // ─── Section 6: Revenue per Produce ──────────────────────────────────────
  Widget _buildRevenuePerProduce(Map<String, dynamic> d) {
    final total = _asDouble(d['totalRevenue'] ?? d['total']);
    final crops = _asListOfMaps(d['topCrops'] ?? d['byProduce']);
    return _card(
      title: AppLang.local.revenue_per_produce,
      icon: Icons.trending_up_outlined,
      iconColor: ColorConstant.success,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.total_revenue, _formatCurrency(total),
              ColorConstant.success),
          _kpiTile(AppLang.local.crops, '${crops.length}',
              ColorConstant.primary),
        ]),
        if (crops.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildTable(
            headers: [
              AppLang.local.crop,
              AppLang.local.quantity,
              AppLang.local.revenue
            ],
            rows: crops
                .map((e) => [
                      _str(e['crop'] ?? e['produce'] ?? e['name']),
                      '${_formatNum(e['quantity'] ?? e['totalKg'])} kg',
                      _formatCurrency(e['revenue'] ?? e['value']),
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  // ─── Section 7: Loans Disaggregation ────────────────────────────────────
  Widget _buildLoansDisaggregation(Map<String, dynamic> d) {
    final total = _asDouble(d['totalAmount'] ?? d['total']);
    final totalLoans = _asInt(d['totalLoans']);
    final byGender = _asListOfMaps(d['byGender']);
    final byType = _asListOfMaps(d['byType']);
    return _card(
      title: AppLang.local.loans_disaggregation,
      icon: Icons.account_balance_wallet_outlined,
      iconColor: ColorConstant.danger,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.total_loans, '$totalLoans',
              ColorConstant.danger),
          _kpiTile(AppLang.local.amount, _formatCurrency(total),
              ColorConstant.primary),
        ]),
        if (byGender.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            AppLang.local.by_gender.toUpperCase(),
            style: TextStyleConstant.robotoW600(
                fontSize: 10, color: ColorConstant.textSecondary),
          ),
          const SizedBox(height: 6),
          _buildTable(
            headers: [
              AppLang.local.gender,
              AppLang.local.count,
              AppLang.local.amount
            ],
            rows: byGender
                .map((e) => [
                      _str(e['gender'] ?? e['label']),
                      '${_asInt(e['count'] ?? e['loanCount'])}',
                      _formatCurrency(e['amount'] ?? e['totalAmount']),
                    ])
                .toList(),
          ),
        ],
        if (byType.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            AppLang.local.by_type.toUpperCase(),
            style: TextStyleConstant.robotoW600(
                fontSize: 10, color: ColorConstant.textSecondary),
          ),
          const SizedBox(height: 6),
          _buildTable(
            headers: [
              AppLang.local.type,
              AppLang.local.count,
              AppLang.local.amount
            ],
            rows: byType
                .map((e) => [
                      _str(e['type'] ?? e['label']),
                      '${_asInt(e['count'] ?? e['loanCount'])}',
                      _formatCurrency(e['amount'] ?? e['totalAmount']),
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  // ─── Section 8: Inputs Disaggregation ───────────────────────────────────
  Widget _buildInputsDisaggregation(Map<String, dynamic> d) {
    final total = _asInt(d['totalDistributions'] ?? d['total']);
    final byGender = _asListOfMaps(d['byGender']);
    final byType = _asListOfMaps(d['byType']);
    return _card(
      title: AppLang.local.inputs_disaggregation,
      icon: Icons.inventory_2_outlined,
      iconColor: ColorConstant.info,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.distributions, '$total',
              ColorConstant.info),
          _kpiTile(AppLang.local.by_gender, '${byGender.length}',
              ColorConstant.primary),
          _kpiTile(AppLang.local.by_type, '${byType.length}',
              ColorConstant.gold),
        ]),
        if (byGender.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            AppLang.local.by_gender.toUpperCase(),
            style: TextStyleConstant.robotoW600(
                fontSize: 10, color: ColorConstant.textSecondary),
          ),
          const SizedBox(height: 6),
          _buildTable(
            headers: [
              AppLang.local.gender,
              AppLang.local.count,
              AppLang.local.amount
            ],
            rows: byGender
                .map((e) => [
                      _str(e['gender'] ?? e['label']),
                      '${_asInt(e['count'] ?? e['distributionCount'])}',
                      _formatCurrency(e['amount'] ?? e['totalValue']),
                    ])
                .toList(),
          ),
        ],
        if (byType.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            AppLang.local.by_type.toUpperCase(),
            style: TextStyleConstant.robotoW600(
                fontSize: 10, color: ColorConstant.textSecondary),
          ),
          const SizedBox(height: 6),
          _buildTable(
            headers: [
              AppLang.local.type,
              AppLang.local.count,
              AppLang.local.amount
            ],
            rows: byType
                .map((e) => [
                      _str(e['type'] ?? e['label']),
                      '${_asInt(e['count'] ?? e['distributionCount'])}',
                      _formatCurrency(e['amount'] ?? e['totalValue']),
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  // ─── Section 9: Farm Land KPIs ───────────────────────────────────────────
  Widget _buildFarmLandKpis(Map<String, dynamic> d) {
    final plots = _asInt(d['totalPlots']);
    final acreage = _asDouble(d['totalAcreageHa'] ?? d['totalArea']);
    final plants = _asInt(d['totalPlants'] ?? d['totalTrees']);
    final byCrop = _asListOfMaps(d['plantBreakdownByCrop'] ?? d['byCrop']);
    return _card(
      title: AppLang.local.farm_land_kpis,
      icon: Icons.landscape_outlined,
      iconColor: ColorConstant.secondary,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.plots, '$plots', ColorConstant.secondary),
          _kpiTile(AppLang.local.acreage_ha, _formatNum(acreage),
              ColorConstant.primary),
          _kpiTile(AppLang.local.total_plants, '$plants', ColorConstant.gold),
          _kpiTile(AppLang.local.crops, '${byCrop.length}',
              ColorConstant.info),
        ]),
        if (byCrop.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildTable(
            headers: [
              AppLang.local.crop,
              AppLang.local.plant_count,
              AppLang.local.area_ha
            ],
            rows: byCrop
                .map((e) => [
                      _str(e['crop'] ?? e['name']),
                      '${_asInt(e['plants'] ?? e['plantCount'] ?? e['count'])}',
                      _formatNum(e['areaHa'] ?? e['area']),
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  // ─── Section 10: Input Distribution by Category ─────────────────────────
  Widget _buildInputDistributionByCategory(Map<String, dynamic> d) {
    final categories = _asListOfMaps(d['byCategory'] ?? d['categories']);
    final totalAmount = _asDouble(d['totalAmount'] ?? d['total']);
    final totalCount = _asInt(d['totalCount'] ?? d['total']);
    return _card(
      title: AppLang.local.input_distribution_categories,
      icon: Icons.category_outlined,
      iconColor: ColorConstant.primary,
      children: [
        _kpiRow([
          _kpiTile(AppLang.local.distributions, '$totalCount',
              ColorConstant.primary),
          _kpiTile(AppLang.local.amount, _formatCurrency(totalAmount),
              ColorConstant.secondary),
          _kpiTile(AppLang.local.categories, '${categories.length}',
              ColorConstant.gold),
        ]),
        if (categories.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildTable(
            headers: [
              AppLang.local.category,
              AppLang.local.count,
              AppLang.local.amount
            ],
            rows: categories
                .map((e) => [
                      _str(e['category'] ?? e['name']),
                      '${_asInt(e['count'] ?? e['distributionCount'])}',
                      _formatCurrency(e['amount'] ?? e['totalValue']),
                    ])
                .toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 48, color: ColorConstant.danger),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadBreakdowns,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}

/// Tiny inline empty state used when the dashboard response is empty.
class EmptyStateInline extends StatelessWidget {
  const EmptyStateInline({
    super.key,
    required this.title,
    required this.description,
  });

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.inbox_outlined,
                size: 48, color: ColorConstant.textSecondary),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyleConstant.quicksandW700(
                fontSize: 16,
                color: ColorConstant.heading,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              description,
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
