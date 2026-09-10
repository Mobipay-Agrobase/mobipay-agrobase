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
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/presentation/distribution/screen_add_distribution.dart';
import 'package:agrobase_ekibbo/presentation/distribution/widget/info_destribution.dart';

class ScreenDistribution extends StatefulWidget {
  const ScreenDistribution({super.key});

  @override
  State<ScreenDistribution> createState() => _ScreenDistributionState();
}

class _ScreenDistributionState extends State<ScreenDistribution> {
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
              if (datas.isEmpty) return const NoDataView();
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
                  Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 8),
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
