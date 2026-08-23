import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/bank_info/bank_info_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class BankTabView extends StatelessWidget {
  const BankTabView({super.key, required this.farmerId});
  final int farmerId;

  fetchData() async {
    try {
      if (DFarmerInfo.instance.infoBanks == null) {
        final res = await ApiProvider.instance.apiFarmer.getBankInfo(farmerId);
        DFarmerInfo.instance.infoBanks = res?.data?.bankInfo ?? [];
      }
      return DFarmerInfo.instance.infoBanks;
    } catch (e) {
      throw Exception();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: fetchData(),
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
            final banks = snapshot.data as List<BankInfoModel>;
            return banks.isEmpty
                ? const NoDataView()
                : ListView.builder(
                    itemCount: banks.length,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    shrinkWrap: true,
                    itemBuilder: (_, index) {
                      return _buildItemView(banks[index]);
                    },
                  );
        }
      }),
    );
  }

  Widget _buildItemView(BankInfoModel bank) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayF7F8FA,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildItem(AppLang.local.account_type, bank.accoutType ?? 'N/A'),
          const SizedBox(height: 16),
          _buildItem(AppLang.local.bank_name, bank.bankName ?? 'N/A'),
          const SizedBox(height: 16),
          _buildItem(AppLang.local.account_number, bank.accoutNo ?? 'N/A'),
          const SizedBox(height: 16),
          _buildItem(AppLang.local.branch, bank.branchDetails ?? 'N/A'),
        ],
      ),
    );
  }

  _buildItem(String title, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyleConstant.robotoW700(
            color: ColorConstant.text79,
            fontSize: 16,
          ),
        ),
        const SizedBox(
          height: 8,
        ),
        Text(
          value,
          style: TextStyleConstant.robotoW400(
            color: ColorConstant.text79,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
