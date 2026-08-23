// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_equipment/farm_equipment_response.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class FarmEquipmentScreen extends StatefulWidget {
  const FarmEquipmentScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<FarmEquipmentScreen> createState() => _FarmEquipmentScreenState();
}

class _FarmEquipmentScreenState extends State<FarmEquipmentScreen> {
  List<FarmEquipmentModel> _equipments = [];
  List<DropdownDataModel> _equipmentTypes = [];
  @override
  void initState() {
    _getEquipmentInfo();
    super.initState();
  }

  _getEquipmentInfo() async {
    final res =
        await ApiProvider.instance.apiFarmer.getFarmEquipment(widget.farmerId);
    if (!mounted) return;
    if (res?.data != null) {
      setState(() {
        _equipments = res!.data!.farmEquipment ?? [];
        _equipmentTypes = res.data?.dataFarmEquipment ?? [];
      });
    }
  }

  _onSave() async {
    DialogHelper.showLoading();
    final data = {
      'data_farm_equipment': _equipments.map((e) => e.toJson()).toList(),
    };
    final res = await ApiProvider.instance.apiFarmer
        .updateFarmEquipment(widget.farmerId, data);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      Navigator.of(context).pop();
      DialogHelper.showToast(
          context, AppLang.local.update_equipment_successfully);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.farm_equipment,
        actions: _equipments.isEmpty
            ? null
            : [
                InkWell(
                  onTap: _onSave,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      AppLang.local.save,
                      style: TextStyleConstant.quicksandW600(
                        color: ColorConstant.primary,
                        fontSize: 16,
                      ),
                    ),
                  ),
                )
              ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _equipments.isEmpty
                ? const NoDataView()
                : ListView.builder(
                      itemCount: _equipments.length,
                      shrinkWrap: true,
                      itemBuilder: (_, index) {
                        final item = _equipments[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(3),
                            color: ColorConstant.grayEDEFF4,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.farmEquipmentItems ?? '',
                                style: TextStyleConstant.robotoW600(),
                              ),
                              const SizedBox(
                                height: 10,
                              ),
                              Text(
                                '${AppLang.local.farm_equipment_item_count}: ${item.farmEquipmentItemsCount ?? ''}',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              const SizedBox(
                                height: 4,
                              ),
                              Text(
                                '${AppLang.local.year_of_manufature}: ${item.yearOfManufacture ?? ''}',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              const SizedBox(
                                height: 4,
                              ),
                              Text(
                                '${AppLang.local.year_of_purchase}: ${item.yearOfPurchase ?? ''}',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              const SizedBox(
                                height: 16,
                              ),
                              Row(
                                children: [
                                  InkWell(
                                    onTap: () {
                                      Navigator.of(context).pushNamed(
                                          RouterName.new_equipment,
                                          arguments: {
                                            'equipment_types': _equipmentTypes,
                                            "equipment": item,
                                          }).then((value) {
                                        if (value != null &&
                                            value is FarmEquipmentModel) {
                                          _equipments[index] = value;
                                          setState(() {});
                                        }
                                      });
                                    },
                                    child: Text(
                                      AppLang.local.edit,
                                      style: TextStyleConstant.robotoW400(
                                        fontSize: 12,
                                        color: ColorConstant.primary,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(
                                    width: 16,
                                  ),
                                  InkWell(
                                    onTap: () {
                                      setState(() {
                                        _equipments.removeAt(index);
                                      });
                                    },
                                    child: Text(
                                      AppLang.local.remove,
                                      style: TextStyleConstant.robotoW400(
                                        fontSize: 12,
                                        color: ColorConstant.redFF1A21,
                                      ),
                                    ),
                                  )
                                ],
                              )
                            ],
                          ),
                        );
                      },
                    ),
            AppButton(
              onTap: () {
                Navigator.of(context).pushNamed(RouterName.new_equipment,
                    arguments: {
                      'equipment_types': _equipmentTypes
                    }).then((value) {
                  if (value != null && value is FarmEquipmentModel) {
                    _equipments.add(value);
                    setState(() {});
                  }
                });
              },
              height: 40,
              radius: 8,
              title: AppLang.local.add_new_equipment,
              color: Colors.white,
              borderColor: ColorConstant.primary,
              titleStyle: TextStyleConstant.quicksandW600(
                fontSize: 16,
                color: ColorConstant.primary,
              ),
            )
          ],
        ),
      ),
    );
  }
}
