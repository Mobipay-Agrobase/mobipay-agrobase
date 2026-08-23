import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/models/sale_intention/sale_intention_response.dart';
import 'package:agrobase_ekibbo/presentation/sale_intention/views/detail_sale_intention_screen.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class ListSaleIntentionScreen extends StatefulWidget {
  const ListSaleIntentionScreen({super.key});

  @override
  State<ListSaleIntentionScreen> createState() =>
      _ListSaleIntentionScreenState();
}

class _ListSaleIntentionScreenState extends State<ListSaleIntentionScreen> {
  List<SaleIntentionModel> _saleIntentions = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.add_sale_intention,
        actions: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: InkWell(
              onTap: () => Navigator.of(context)
                  .pushNamed(RouterName.add_sale_intention)
                  .then((value) {
                if (value != null) {
                  setState(() {});
                }
              }),
              child: const Icon(
                Icons.add,
                color: ColorConstant.primary,
              ),
            ),
          )
        ],
      ),
      body: FutureBuilder(
        future: DListingData.instance.fetchSaleIntention(),
        builder: ((context, snapshot) {
          switch (snapshot.connectionState) {
            case ConnectionState.waiting:
              return const Center(
                child: AppCircularIndicator(
                  color: ColorConstant.primary,
                ),
              );
            default:
              if (snapshot.hasError) {
                return const Center(child: NoDataView());
              }
              if (snapshot.data == null) {
                return const Center(child: NoDataView());
              }
              _saleIntentions = snapshot.data as List<SaleIntentionModel>;
              return RefreshIndicator(
                color: ColorConstant.primary,
                onRefresh: () async {
                  DListingData.instance.saleIntentions = null;
                  setState(() {});
                },
                child: _saleIntentions.isEmpty
                    ? const NoDataView()
                    : ListView.builder(
                        itemCount: _saleIntentions.length,
                        shrinkWrap: true,
                        padding: const EdgeInsets.all(16),
                        itemBuilder: (_, index) {
                          final item = _saleIntentions[index];
                          return _buildSaleIntentionItem(item);
                        },
                      ),
              );
          }
        }),
      ),
    );
  }

  _buildSaleIntentionItem(SaleIntentionModel item) {
    return InkWell(
      onTap: () =>
          NavigatorManager.push(ScreenSaleIntentionDetail(saleIntention: item)),
      child: Container(
        padding: const EdgeInsets.all(22),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: ColorConstant.grayF7F8FA,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppLang.local.transaction_date,
              style: TextStyleConstant.robotoW700(
                fontSize: 16,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(
              height: 8,
            ),
            Text(
              DateHelper.convertDateToStr(item.createdAt!,
                  format: 'MMM dd, yyyy'),
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(
              height: 16,
            ),
            Text(
              AppLang.local.product,
              style: TextStyleConstant.robotoW700(
                fontSize: 16,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(
              height: 8,
            ),
            Text(
              item.variety ?? '',
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(
              height: 16,
            ),
            Text(
              AppLang.local.farmer,
              style: TextStyleConstant.robotoW700(
                fontSize: 16,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(
              height: 8,
            ),
            Text(
              item.farmer?.fullName ?? '',
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            )
          ],
        ),
      ),
    );
  }
}
