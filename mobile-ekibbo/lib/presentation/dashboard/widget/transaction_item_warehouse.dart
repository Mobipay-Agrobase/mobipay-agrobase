import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class TransactionItemWarehouse extends StatelessWidget {
  const TransactionItemWarehouse({super.key});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.of(context).pushNamed(
        RouterName.plot_detail,
        arguments: {},
      ),
      child: Container(
        width: double.maxFinite,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: ColorConstant.grayF6F7F9,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildItemInfo(AppLang.local.booking_id, 'code00001'),
              const SizedBox(height: 16),
              _buildItemInfo(AppLang.local.procurement_id, 'code00001'),
              const SizedBox(height: 16),
              _buildItemInfo(AppLang.local.warehouse, 'abc'),
              const SizedBox(height: 16),
              _buildItemInfo(
                  AppLang.local.reception_date,
                  DateHelper.convertDateToStr(DateTime.now(),
                      format: 'MMMM dd, yyyy HH:mm')),
              const SizedBox(height: 16),
              _buildItemInfo(
                  AppLang.local.procurement_date,
                  DateHelper.convertDateToStr(DateTime.now(),
                      format: 'MMMM dd, yyyy HH:mm')),
              const SizedBox(height: 16),
              _buildItemInfo(AppLang.local.vehicle_type, 'Boat'),
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
