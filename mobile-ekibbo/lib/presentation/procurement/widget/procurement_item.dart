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
          child:
              mProcurement.isEkibbo ? _buildEkibboBody() : _buildLegacyBody(),
        ),
      ),
    );
  }

  /// Ekibbo purchase row (Sheet-2): commodity + form, farmer, total, status.
  Widget _buildEkibboBody() {
    final raw = (mProcurement.commodity ?? '').toLowerCase();
    final commodity =
        raw.isEmpty ? '' : '${raw[0].toUpperCase()}${raw.substring(1)}';
    final form = mProcurement.variety ?? '';
    final status = mProcurement.status ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                form.isEmpty ? commodity : '$commodity — $form',
                style: TextStyleConstant.quicksandW600(
                  fontSize: 16,
                  color: ColorConstant.text79,
                ),
              ),
            ),
            _statusChip(status),
          ],
        ),
        const SizedBox(height: 10),
        _buildItemInfo('Farmer',
            mProcurement.farmerName ?? mProcurement.farmerCode ?? '—'),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _buildItemInfo('Date',
                  mProcurement.transactionDate.split(" ")[0]),
            ),
            Expanded(
              child: _buildItemInfo('Total (UGX)',
                  _fmtAmount(mProcurement.totalAmount)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _statusChip(String status) {
    Color color;
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'PAID':
        color = Colors.green;
        break;
      case 'REJECTED':
        color = Colors.redAccent;
        break;
      default:
        color = ColorConstant.primary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.isEmpty ? 'PENDING' : status.toUpperCase(),
        style: TextStyleConstant.robotoW600(
          fontSize: 10,
          color: color,
        ),
      ),
    );
  }

  String _fmtAmount(int n) =>
      n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

  /// Legacy generic procurement row (pre-Ekibbo data).
  Widget _buildLegacyBody() {
    return Row(
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
