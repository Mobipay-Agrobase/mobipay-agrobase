import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/models/edit_farmer_type.dart';

class EditFarmerProfileScreen extends StatefulWidget {
  const EditFarmerProfileScreen({
    super.key,
    required this.model,
  });
  final FarmerModel model;
  @override
  State<EditFarmerProfileScreen> createState() =>
      _EditFarmerProfileScreenState();
}

class _EditFarmerProfileScreenState extends State<EditFarmerProfileScreen> {
  late FarmerModel farmer;

  @override
  void initState() {
    super.initState();
    farmer = widget.model;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.edit_farmer_profile,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(
                height: 32,
              ),
              GInternetImage(
                url: farmer.farmerPhoto ?? farmer.avatarUrl,
                width: 120,
                height: 120,
                borderRadius: 60,
              ),
              const SizedBox(
                height: 16,
              ),
              Text(
                farmer.fullName ?? '',
                style: TextStyleConstant.quicksandW600(
                  fontSize: 18,
                ),
              ),
              ListView.builder(
                itemCount: EditFarmerType.values.length,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.only(
                  top: 30,
                  left: 16,
                  right: 16,
                ),
                shrinkWrap: true,
                itemBuilder: (_, index) {
                  final item = EditFarmerType.values[index];
                  return InkWell(
                    onTap: () => _onTap(item),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      decoration: const BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: ColorConstant.greyEBEBEB),
                        ),
                      ),
                      child: Row(
                        children: [
                          SvgPicture.asset(item.getIcon().iconSvg),
                          const SizedBox(
                            width: 12,
                          ),
                          Expanded(
                            child: Text(
                              item.getTitle(),
                              style: TextStyleConstant.robotoW500(
                                fontSize: 16,
                              ),
                            ),
                          ),
                          // Text(
                          //   '75%',
                          //   style: TextStyleConstant.robotoW400(
                          //     fontSize: 12,
                          //     color: ColorConstant.text79,
                          //   ),
                          // ),
                          // const SizedBox(
                          //   width: 8,
                          // ),
                          // SizedBox(
                          //   width: 60,
                          //   child: LinearProgressIndicator(
                          //     color: ColorConstant.primary,
                          //     value: 0.75,
                          //     minHeight: 4,
                          //     borderRadius: BorderRadius.circular(2),
                          //     backgroundColor: ColorConstant.grayF6F7F9,
                          //   ),
                          // )
                        ],
                      ),
                    ),
                  );
                },
              )
            ],
          ),
        ),
      ),
    );
  }

  _onTap(EditFarmerType type) async {
    if (type == EditFarmerType.basic) {
      Navigator.of(context).pushNamed(RouterName.farmer_registration,
          arguments: {
            "farmerData": farmer.toMap()
          }).then((value) {
        if (value != null && value is FarmerModel) {
          setState(() {
            farmer = value;
          });
        }
      });
    } else if (type == EditFarmerType.family) {
      Navigator.of(context).pushNamed(
        RouterName.family_info,
        arguments: farmer.id,
      );
    } else if (type == EditFarmerType.asset) {
      Navigator.of(context).pushNamed(
        RouterName.asset_info,
        arguments: farmer.id,
      );
    } else if (type == EditFarmerType.bank) {
      Navigator.of(context).pushNamed(
        RouterName.bank_info,
        arguments: farmer.id,
      );
    } else if (type == EditFarmerType.finance) {
      Navigator.of(context).pushNamed(
        RouterName.finance_info,
        arguments: farmer.id,
      );
    } else if (type == EditFarmerType.insurance) {
      Navigator.of(context).pushNamed(
        RouterName.insurance_info,
        arguments: farmer.id,
      );
    } else if (type == EditFarmerType.equipment) {
      Navigator.of(context).pushNamed(
        RouterName.farm_equip,
        arguments: farmer.id,
      );
    } else if (type == EditFarmerType.animal) {
      Navigator.of(context).pushNamed(
        RouterName.animal_husbandry,
        arguments: farmer.id,
      );
    } else if (type == EditFarmerType.certificate) {
      Navigator.of(context).pushNamed(
        RouterName.certificate_info,
        arguments: farmer.id,
      );
    }
  }
}
