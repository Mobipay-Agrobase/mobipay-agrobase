import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/presentation/distribution/widget/info_destribution.dart';
import '../../components/custom_appbar.dart';
import 'widget/info_product.dart';

class ScreenDetailDistribution extends StatelessWidget {
  const ScreenDetailDistribution({super.key, required this.distribution});
  final MDistribution distribution;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.distribution_detail,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: ListView(
            children: [
              WidgetCommon.buildHeaderForm(AppLang.local.general_information),
              const SizedBox(height: 10),
              DistributionInfo(distribution: distribution),
              const SizedBox(height: 20),
              WidgetCommon.buildHeaderForm(AppLang.local.product_information),
              const SizedBox(height: 10),
              ...distribution.distributionDetails
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 5.0),
                      child: InfoProduct(
                        product: item,
                        isEdit: false,
                        onRemove: () {},
                        onEdit: () {},
                      ),
                    ),
                  )
                  .toList()
            ],
          ),
        ),
      ),
    );
  }
}
