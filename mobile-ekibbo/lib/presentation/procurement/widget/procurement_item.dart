import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/procurement/procurement_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/screen_procurement_detail.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class ProcurementItem extends StatelessWidget {
  const ProcurementItem({super.key, required this.mProcurement});
  final MProcurement mProcurement;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        NavigatorManager.push(
          ScreenProcurementDetail(mProcurement: mProcurement),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: ColorConstant.grayF7F8FA,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildItemInfo(
                      AppLang.local.date,
                      mProcurement.transactionDate.split(" ")[0],
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 15),
                      child: _buildItemInfo(
                        AppLang.local.total_cost,
                        mProcurement.totalAmount.toString(),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 0),
                      child: _buildItemInfo(
                        'Code',
                        mProcurement.procurementCode,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 15),
                      child: _buildItemInfo(
                        "Driver",
                        mProcurement.booking.vehicle.driverName,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  _buildItemInfo(String key, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          key,
          style: TextStyleConstant.robotoW700(
            fontSize: 16,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyleConstant.robotoW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        )
      ],
    );
  }
}
