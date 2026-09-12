import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_distribution.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/models/distribution/model_input_summary.dart';
import 'package:agrobase_ekibbo/presentation/distribution/screen_add_distribution.dart';
import 'package:agrobase_ekibbo/presentation/distribution/widget/info_destribution.dart';

class ScreenDistribution extends StatefulWidget {
  const ScreenDistribution({super.key});

  @override
  State<ScreenDistribution> createState() => _ScreenDistributionState();
}

class _ScreenDistributionState extends State<ScreenDistribution> {
  // Second review (K — Input Summary): stock-ledger header, same numbers
  // as the web Input Aggregation summary. Null → section hidden.
  MInputSummary? _inputSummary;

  Future<void> _loadInputSummary() async {
    final summary = await ApiDistribution.getInputSummary();
    if (!mounted) return;
    setState(() => _inputSummary = summary);
  }

  @override
  void initState() {
    super.initState();
    _loadInputSummary();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.input_distribution,
        actions: [
          (DUserInfo.instance.user!.roleUser == EnumUserRole.staff)
              ? InkWell(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => const ScreenAddDistribution(),
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: SvgPicture.asset(
                      'ic_add_fill'.iconSvg,
                      color: ColorConstant.primary
                    ),
                  ),
                )
              : const SizedBox.shrink()
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: ColorConstant.primary,
          onRefresh: () async {
            DListingData.instance.distributions = null;
            _loadInputSummary();
            setState(() {});
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: _buildFutureDistribution(),
          ),
        ),
      ),
    );
  }

  // Second review (J): KPI card for the input distribution summary
  Widget _buildKpiCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.greyEBEBEB),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyleConstant.robotoW400(
              fontSize: 11,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyleConstant.robotoW700(
              fontSize: 20,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  String _fmtUnits(double units) {
    final rounded =
        units == units.roundToDouble() ? units.toInt() : units;
    return '$rounded';
  }

  // Second review (K): Input Summary card — dealers, products in stock,
  // units on hand and pending requests straight from the stock ledger.
  Widget _buildInputSummaryCard(MInputSummary s) {
    final chips = s.byCategory.take(4).map((c) {
      final label =
          '${c.name} · ${_fmtUnits(c.units)}';
      return Container(
        margin: const EdgeInsets.only(right: 6, bottom: 6),
        padding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: ColorConstant.primary.withOpacity(0.08),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          label,
          style: TextStyleConstant.robotoW400(
            fontSize: 10,
            color: ColorConstant.primary,
          ),
        ),
      );
    }).toList();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Input Summary',
            style: TextStyleConstant.robotoW700(
              fontSize: 14,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _summaryCell('Dealers', '${s.dealers}'),
              ),
              Expanded(
                child: _summaryCell(
                    'In Stock', '${s.productsInStock}/${s.productsTotal}'),
              ),
              Expanded(
                child: _summaryCell('Units', _fmtUnits(s.unitsInStock)),
              ),
              Expanded(
                child:
                    _summaryCell('Pending', '${s.pendingRequests}'),
              ),
            ],
          ),
          if (chips.isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(children: chips),
          ],
        ],
      ),
    );
  }

  Widget _summaryCell(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyleConstant.robotoW400(
            fontSize: 10,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyleConstant.robotoW700(
            fontSize: 15,
            color: ColorConstant.text79,
          ),
        ),
      ],
    );
  }

  _buildFutureDistribution() {
    return FutureBuilder(
      future: DListingData.instance.fetchDistributions(), // async work
      builder: (BuildContext context, snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.waiting:
            return const Center(
              child: AppCircularIndicator(
                color: ColorConstant.primary,
              ),
            );
          default:
            if (snapshot.hasError) {
              return const NoDataView();
            } else {
              if (snapshot.data == null) return const NoDataView();
              final datas = snapshot.data as List<MDistribution>;
              // K: when no distributions exist yet, still show the Input
              // Summary (stock ledger) above the empty state.
              if (datas.isEmpty) {
                if (_inputSummary != null) {
                  return ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: _buildInputSummaryCard(_inputSummary!),
                      ),
                      const SizedBox(
                          height: 160,
                          child: NoDataView()),
                    ],
                  );
                }
                return const NoDataView();
              }
              // ── Second review (J): 3 KPI cards — Tools / Fertilisers (kg) / Seedlings ──
              final rows = datas
                  .expand((d) => d.distributionDetails)
                  .toList();
              final toolRows = rows.where((r) =>
                  ['pruning_saw', 'secateurs', 'tarpaulin', 'tool', 'tools', 'equipment']
                      .contains(r.category_name.toLowerCase().replaceAll(' ', '_')) ||
                  RegExp(r'saw|secateur|tarpaulin', caseSensitive: false)
                      .hasMatch(r.category_name)).toList();
              final fertKg = rows
                  .where((r) => RegExp('fertil', caseSensitive: false)
                      .hasMatch(r.category_name))
                  .fold<int>(0, (sum, r) => sum + r.quantity);
              final seedlingRows = rows
                  .where((r) => RegExp('seedling', caseSensitive: false)
                      .hasMatch(r.category_name))
                  .toList();
              final toolsTotal =
                  toolRows.fold<int>(0, (sum, r) => sum + r.quantity);
              final seedlingsTotal =
                  seedlingRows.fold<int>(0, (sum, r) => sum + r.quantity);
              return ListView(
                children: [
                  if (_inputSummary != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: _buildInputSummaryCard(_inputSummary!),
                    ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                            child: _buildKpiCard('Tools',
                                '$toolsTotal', ColorConstant.primary)),
                        const SizedBox(width: 12),
                        Expanded(
                            child: _buildKpiCard('Fertilisers (kg)',
                                '$fertKg', const Color(0xFFF59E0B))),
                        const SizedBox(width: 12),
                        Expanded(
                            child: _buildKpiCard('Seedlings',
                                '$seedlingsTotal', ColorConstant.primary)),
                      ],
                    ),
                  ),
                  ...datas
                      .map((item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 5.0),
                            child: DistributionInfo(
                                isDetail: false, distribution: item),
                          ))
                      .toList(),
                ],
              );
            }
        }
      },
    );
  }
}
