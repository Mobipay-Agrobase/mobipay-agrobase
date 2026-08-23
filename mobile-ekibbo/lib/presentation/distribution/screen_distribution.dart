import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
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
              return ListView(
                children: datas
                    .map((item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 5.0),
                          child: DistributionInfo(
                              isDetail: false, distribution: item),
                        ))
                    .toList(),
              );
            }
        }
      },
    );
  }
}
