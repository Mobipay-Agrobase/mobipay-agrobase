import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';

class TaskItemView extends StatelessWidget {
  const TaskItemView({
    super.key,
    required this.item,
  });
  final SRPActionModel item;
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 182,
      width: 320,
      padding: const EdgeInsets.only(top: 16, left: 16, right: 16),
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayEDEFF4,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.getNameAction().toTitleCase(),
            style: TextStyleConstant.quicksandW600(
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 12,
          ),
          AppButton(
            height: 24,
            width: 90,
            radius: 12,
            title: 'In Progress',
            titleStyle: TextStyleConstant.robotoW400(color: Colors.white),
          ),
          const SizedBox(
            height: 16,
          ),
          Row(
            children: [
              SvgPicture.asset(
                'ic_land_plot'.iconSvg,
                width: 16,
                height: 16,
                color: ColorConstant.text79,
              ),
              const SizedBox(
                width: 10,
              ),
              Text(
                item.srp?.cultivation?.cropVariety ?? '',
                style: TextStyleConstant.robotoW400(
                  color: ColorConstant.text79,
                  fontSize: 12,
                ),
              )
            ],
          ),
          const SizedBox(
            height: 12,
          ),
          Row(
            children: [
              SvgPicture.asset(
                'ic_calendar'.iconSvg,
                width: 16,
                height: 16,
                color: ColorConstant.text79,
              ),
              const SizedBox(
                width: 10,
              ),
              Text(
                DateHelper.convertDateToStr(item.date_action!),
                style: TextStyleConstant.robotoW400(
                  color: ColorConstant.text79,
                  fontSize: 12,
                ),
              )
            ],
          ),
          const SizedBox(
            height: 12,
          ),
          Row(
            children: [
              SvgPicture.asset(
                'ic_profile'.iconSvg,
                width: 16,
                height: 16,
                color: ColorConstant.text79,
              ),
              const SizedBox(
                width: 10,
              ),
              Text(
                item.srp?.farmer?.fullName ?? '',
                style: TextStyleConstant.robotoW400(
                  color: ColorConstant.text79,
                  fontSize: 12,
                ),
              )
            ],
          )
        ],
      ),
    );
  }
}
