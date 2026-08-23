import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/stock/creation_response.dart';

class CreationItem extends StatelessWidget {
  final StockCreationResponse item;
  final Function onUpdate;

  const CreationItem({
    Key? key,
    required this.item,
    required this.onUpdate,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.only(
        top: 16,
        left: 8,
        right: 8,
        bottom: 8,
      ),
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildItem('Date',
                      DateHelper.convertTimestampToDate(item.transactionDate).toString()),
                  _buildItem('Farmer', item.farmerName),
                  _buildItem('Pond', item.pondName),
                  _buildItem('Total Pond Area', item.totalPondArea.toString()),
                  _buildItem('Species Name', item.speciesName.toString()),
                  _buildItem('Species Count', item.speciesCount.toString()),
                  _buildItem('Species Date', DateHelper.convertTimestampToDate(item.dateOfAddingSpecies).toString()),
                  _buildItem('Avg Weight', item.avgWeight.toString()),
                  _buildItem('Remark', item.remarks),
                  const SizedBox(height: 16),
                  GInternetImage(
                    width: 148,
                    height: 86,
                    url: "${EnvConfig.domainOrigin}/${item.photo}",
                    borderRadius: 8,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            _buildButtonEdit(context),
          ],
        ),
      ),
    );
  }

  _buildItem(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Text(
            title,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            value,
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          )
        ],
      ),
    );
  }

  _buildButtonEdit(BuildContext context) {
    return DUserInfo.instance.user!.roleUser == EnumUserRole.staff
        ? IconButton(
            icon: const Icon(
              Icons.edit,
              color: ColorConstant.text79,
            ),
            onPressed: () {
              onUpdate();
            },
          )
        : const SizedBox.shrink();
  }

  _buildPercentProgress() {
    return SizedBox(
      height: 48,
      width: 48,
      child: Stack(
        children: [
          const Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            child: CircularProgressIndicator(
              value: 0.7,
              strokeWidth: 5,
              backgroundColor: ColorConstant.greyEBEBEB,
              color: ColorConstant.primary,
            ),
          ),
          Center(
            child: Text(
              '70%',
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            ),
          )
        ],
      ),
    );
  }
}
