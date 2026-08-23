// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_item_add_cost.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/cost_procurement_model.dart';

class ScreenAddCost extends StatefulWidget {
  const ScreenAddCost({super.key, required this.argument});
  final ArgumentAddCostProcurement argument;

  @override
  State<ScreenAddCost> createState() => _ScreenAddCostState();
}

class _ScreenAddCostState extends State<ScreenAddCost>
    with DropItemAddCostMixin {
  final ctrlSubTotal = TextEditingController();

  Timer? _debounce;

  String valueQty = '';
  String valueRate = '';

  @override
  void initState() {
    super.initState();
    initData();
  }

  initData() {
    final itemAddeds =
        widget.argument.costProcurements.map((e) => e.itemId).toList();
    if (widget.argument.itemId != 0) {
      itemAddeds.removeWhere((element) => element == widget.argument.itemId);
    }
    items.removeWhere((element) => itemAddeds.contains(element.id));
    final itemCost = widget.argument.costProcurements.firstWhereOrNull(
        (element) => element.itemId == widget.argument.itemId);
    if (itemCost == null) return;
    valueQty = itemCost.quantity.toString();
    valueRate = itemCost.quantity.toString();
    itemId = itemCost.itemId;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.new_cost,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                WidgetCommon.buildHeaderForm(AppLang.local.crop_harvest_information),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24, top: 10),
                  child: InputDropDownData(
                    hintText: AppLang.local.item,
                    items: items.map((e) => e.name).toList(),
                    itemIndex: indexItem(),
                    onChanged: (index) {
                      itemId = items[index].id;
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.quantity,
                    onChanged: _onChangedQty,
                    initialValue: valueQty,
                    keyboardType: TextInputType.number,
                    suffixIcon: Padding(
                      padding: const EdgeInsets.only(top: 16, bottom: 16),
                      child: Text(
                        'MT',
                        style: TextStyleConstant.quicksandW600(
                          color: ColorConstant.text79.withOpacity(0.3),
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.rate,
                    initialValue: valueRate,
                    keyboardType: TextInputType.number,
                    onChanged: _onChangedRate,
                    suffixIcon: Padding(
                      padding: const EdgeInsets.only(top: 16, bottom: 16),
                      child: Text(
                        'đ',
                        style: TextStyleConstant.quicksandW600(
                          color: ColorConstant.text79.withOpacity(0.3),
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.total_cost,
                    readOnly: true,
                    controller: ctrlSubTotal,
                    fillColor: ColorConstant.grayDBDBDB,
                    suffixIcon: Padding(
                      padding: const EdgeInsets.only(top: 16, bottom: 16),
                      child: Text(
                        'đ',
                        style: TextStyleConstant.quicksandW600(
                          color: ColorConstant.text79.withOpacity(0.3),
                        ),
                      ),
                    ),
                  ),
                ),
                _buildBtnSubmit(),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  _onChangedQty(String value) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      valueQty = value.isEmpty ? "0" : value;
      if (valueQty.isEmpty) return;
      if (valueRate.isEmpty) return;
      ctrlSubTotal.text =
          (double.parse(valueRate) * double.parse(valueQty)).toStringAsFixed(1);
      setState(() {});
    });
  }

  _onChangedRate(String value) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      valueRate = value.isEmpty ? "0" : value;
      if (valueRate.isEmpty) return;
      if (valueQty.isEmpty) return;
      ctrlSubTotal.text =
          (double.parse(valueRate) * double.parse(valueQty)).toStringAsFixed(1);
      setState(() {});
    });
  }

  _buildBtnSubmit() {
    return AppButton(
      title: "Add",
      height: 46,
      onTap: () {
        if (itemId == 0) return;
        if (widget.argument.itemId != 0) {
          widget.argument.costProcurements.removeWhere(
              (element) => element.itemId == widget.argument.itemId);
        }
        final costProc = MProcurementCost(
          itemId: itemId,
          itemName: items.firstWhere((element) => element.id == itemId).name,
          rate: double.parse(valueRate),
          quantity: double.parse(valueQty),
          subTotal: double.parse(ctrlSubTotal.text),
        );
        widget.argument.costProcurements.add(costProc);
        Navigator.of(context).pop(widget.argument);
      },
    );
  }
}
