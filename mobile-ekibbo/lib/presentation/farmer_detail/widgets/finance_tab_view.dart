import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/finance_info/finance_info_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class FinanceTabView extends StatelessWidget {
  const FinanceTabView({super.key, required this.farmerId});
  final int farmerId;

  fetchData() async {
    try {
      if (DFarmerInfo.instance.infoFinance == null) {
        final res =
            await ApiProvider.instance.apiFarmer.getFinanceInfo(farmerId);
        DFarmerInfo.instance.infoFinance = res?.data?.financeInfo;
      }
      return DFarmerInfo.instance.infoFinance;
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
            return _buildInfo(snapshot.data as FinanceInfoModel);
        }
      }),
    );
  }

  _buildInfo(FinanceInfoModel finance) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayF7F8FA,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildItem(AppLang.local.loan_taken_last_year,
              finance.loanTakenLastYear ?? 'N/A'),
          if (finance.loanTakenLastYear?.toLowerCase() == 'yes')
            Column(
              children: [
                const SizedBox(height: 16),
                _buildItem(AppLang.local.loan_taken_from,
                    finance.loanTakenFrom ?? 'N/A'),
                const SizedBox(height: 16),
                _buildItem(AppLang.local.loan_amount,
                    '${finance.loanAmount ?? 'N/A'}'),
                const SizedBox(height: 16),
                _buildItem(AppLang.local.loan_interest,
                    '${finance.loanInterest ?? 'N/A'}'),
                const SizedBox(height: 16),
                _buildItem(AppLang.local.interst_period,
                    finance.interestPeriod ?? 'N/A'),
                const SizedBox(height: 16),
                _buildItem(AppLang.local.loan_repayment_amount,
                    '${finance.loanRepaymentAmount ?? 'N/A'}'),
                const SizedBox(height: 16),
                _buildItem(AppLang.local.loan_repayment_date,
                    finance.loanRepaymentDate ?? 'N/A'),
              ],
            ),
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
