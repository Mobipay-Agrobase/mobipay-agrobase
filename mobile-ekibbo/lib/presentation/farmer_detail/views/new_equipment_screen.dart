import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_equipment/farm_equipment_response.dart';

class NewEquipmentScreen extends StatefulWidget {
  const NewEquipmentScreen({
    super.key,
    this.equipment,
    this.equipmentTypes,
  });
  final FarmEquipmentModel? equipment;
  final List<DropdownDataModel>? equipmentTypes;
  @override
  State<NewEquipmentScreen> createState() => _NewEquipmentScreenState();
}

class _NewEquipmentScreenState extends State<NewEquipmentScreen> {
  List<DropdownDataModel> _equipTypes = [];
  int? _typeIndex;
  final _numTxtController = TextEditingController();
  final _yearManufactureTxtController = TextEditingController();
  final _yearPurchaseTxtController = TextEditingController();
  @override
  void initState() {
    super.initState();
    _equipTypes = widget.equipmentTypes ?? [];
    if (widget.equipment != null) {
      _typeIndex = _equipTypes
          .getIndex((p0) => p0.name == widget.equipment!.farmEquipmentItems);
      _numTxtController.text =
          '${widget.equipment!.farmEquipmentItemsCount ?? ''}';
      _yearManufactureTxtController.text =
          '${widget.equipment!.yearOfManufacture ?? ''}';
      _yearPurchaseTxtController.text =
          '${widget.equipment!.yearOfPurchase ?? ''}';
    }
  }

  _onSave() {
    final b = widget.equipment ?? FarmEquipmentModel();
    b.farmEquipmentItems =
        _typeIndex != null ? _equipTypes[_typeIndex!].name : null;
    b.farmEquipmentItemsCount = int.tryParse(_numTxtController.text);
    b.yearOfManufacture = int.tryParse(_yearManufactureTxtController.text);
    b.yearOfPurchase = int.tryParse(_yearPurchaseTxtController.text);
    Navigator.of(context).pop(b);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: AppLang.local.new_equipment,
          actions: _typeIndex == null
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
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: SingleChildScrollView(
            child: Column(
              children: [
                AppDropdownButton(
                  items: _equipTypes.map((e) => e.name!).toList(),
                  hintText: AppLang.local.farm_equipment,
                  itemSelected:
                      _typeIndex != null ? _equipTypes[_typeIndex!].name : null,
                  onChanged: (v) {
                    setState(() {
                      _typeIndex = v;
                    });
                  },
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  labelText: AppLang.local.farm_equipment_item_count,
                  controller: _numTxtController,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  labelText: AppLang.local.year_of_manufature,
                  controller: _yearManufactureTxtController,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  labelText: AppLang.local.year_of_purchase,
                  controller: _yearPurchaseTxtController,
                  keyboardType: TextInputType.number,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
