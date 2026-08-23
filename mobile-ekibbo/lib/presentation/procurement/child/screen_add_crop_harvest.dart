// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_cultivation.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_crop.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/crop_harvest_model.dart';

// ignore: must_be_immutable
class ScreenAddCropHarvest extends StatefulWidget {
  const ScreenAddCropHarvest({super.key, required this.argument});
  final ArgumentAddCropHardvest argument;

  @override
  State<ScreenAddCropHarvest> createState() => _ScreenAddCropHarvestState();
}

class _ScreenAddCropHarvestState extends State<ScreenAddCropHarvest>
    with DropCropMixin, DropCultivationMixin {
  final ctrlArea = TextEditingController();
  final ctrlSowingDate = TextEditingController();
  final ctrlExpectDate = TextEditingController();
  final ctrlEstimateQty = TextEditingController();
  final ctrlSubTotal = TextEditingController();

  Timer? _debounce;
  MCropHarvest? mCropHarvest;

  String valueQty = '';
  String valuePrice = '';

  @override
  void initState() {
    super.initState();
    initData();
  }

  initData() async {
    await fetchCropInformation(widget.argument.farmlandId);
    if (widget.argument.cultivationId == 0) return;
    mCropHarvest = widget.argument.cropHarvests.firstWhereOrNull(
        (element) => element.cultivationId == widget.argument.cultivationId);
    if (mCropHarvest == null) return;
    valuePrice = "${mCropHarvest!.pricePerUnit}";
    valueQty = "${mCropHarvest!.quantity}";
    ctrlSubTotal.text = mCropHarvest!.subTotal;
    cropInformationId = mCropHarvest!.cropId;
    await fetchCultivation(widget.argument.seasonId, widget.argument.farmlandId,
        cropInformationId);
    cultivationId = mCropHarvest!.cultivationId;
    final cultivation =
        cultivations.firstWhereOrNull((element) => element.id == cultivationId);
    if (cultivation == null) return;
    ctrlSowingDate.text = cultivation.sowingDate ?? '';
    ctrlExpectDate.text = cultivation.expectDate ?? '';
    ctrlEstimateQty.text = cultivation.estYield!;
    ctrlArea.text = "${widget.argument.actualArea}";
    setState(() {});
  }

  @override
  Future fetchCropInformation(int farmlandId) async {
    seasonId = widget.argument.seasonId;
    await super.fetchCropInformation(farmlandId);
    setState(() {});
  }

  @override
  void dispose() {
    ctrlArea.dispose();
    ctrlExpectDate.dispose();
    ctrlSowingDate.dispose();
    ctrlSubTotal.dispose();
    super.dispose();
  }

  @override
  setCropInformations(List<DropdownMasterModel> datas) {
    super.setCropInformations(datas);
    setState(() {});
  }

  @override
  fetchCultivation(int seasonId, int farmlandId, int cropId) async {
    await super.fetchCultivation(seasonId, farmlandId, cropId);
    setState(() {});
    final culIds =
        widget.argument.cropHarvests.map((e) => e.cultivationId).toList();
    if (widget.argument.cultivationId == 0) {
      cultivations.removeWhere((element) => culIds.contains(element.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        ///Todo: translate
        title: AppLang.local.crop_information,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                WidgetCommon.buildHeaderForm(
                    AppLang.local.crop_harvest_information),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24, top: 10),
                  child: InputDropDownData(
                    hintText: AppLang.local.crop_cultivated,
                    items: cropInformations.map((e) => e.name!).toList(),
                    itemIndex: indexCropInformation(),
                    onChanged: (index) {
                      cropInformationId = cropInformations[index].id!;
                      fetchCultivation(widget.argument.seasonId,
                          widget.argument.farmlandId, cropInformationId);
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: InputDropDownData(
                    hintText: AppLang.local.variety,
                    items: cultivations.map((e) => e.cropVariety!).toList(),
                    itemIndex: indexCultivation(),
                    onChanged: (index) {
                      final cultivation = cultivations[index];
                      cultivationId = cultivation.id ?? 0;
                      ctrlSowingDate.text = cultivation.sowingDate ?? '';
                      ctrlExpectDate.text = cultivation.expectDate ?? '';
                      ctrlEstimateQty.text = cultivation.estYield!;
                      ctrlArea.text = "${widget.argument.actualArea}";
                      setState(() {});
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.cultivated_area,
                    controller: ctrlArea,
                    readOnly: true,
                    fillColor: ColorConstant.grayDBDBDB,
                    suffixIcon: Padding(
                      padding: const EdgeInsets.only(top: 16, bottom: 16),
                      child: Text(
                        'ha',
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
                    hint: AppLang.local.sowing_date,
                    controller: ctrlSowingDate,
                    readOnly: true,
                    fillColor: ColorConstant.grayDBDBDB,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.expected_harvest_date,
                    controller: ctrlExpectDate,
                    readOnly: true,
                    fillColor: ColorConstant.grayDBDBDB,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.estimated_harvest_qty,
                    controller: ctrlEstimateQty,
                    readOnly: true,
                    fillColor: ColorConstant.grayDBDBDB,
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
                    hint: AppLang.local.approx_harvest_qty,
                    initialValue: valueQty,
                    keyboardType: TextInputType.number,
                    onChanged: _onChangedQty,
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
                    hint: AppLang.local.price_per_unit,
                    initialValue: valuePrice,
                    keyboardType: TextInputType.number,
                    onChanged: _onChangedPrice,
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
                    controller: ctrlSubTotal,
                    hint: AppLang.local.sub_total,
                    readOnly: true,
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
      if (valuePrice.isEmpty) return;
      ctrlSubTotal.text = (double.parse(valuePrice) * double.parse(valueQty))
          .toStringAsFixed(1);
      setState(() {});
    });
  }

  _onChangedPrice(String value) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      valuePrice = value.isEmpty ? "0" : value;
      if (valuePrice.isEmpty) return;
      if (valueQty.isEmpty) return;
      ctrlSubTotal.text = (double.parse(valuePrice) * double.parse(valueQty))
          .toStringAsFixed(1);
      setState(() {});
    });
  }

  _buildBtnSubmit() {
    return AppButton(
      title: "Add",
      height: 46,
      onTap: () {
        if (cultivationId == 0) return;
        if (widget.argument.cultivationId != 0) {
          widget.argument.cropHarvests.removeWhere((element) =>
              element.cultivationId == widget.argument.cultivationId);
        }
        final mCropHarvest = MCropHarvest(
          cropId: cropInformationId,
          cropName: cropInformations
              .firstWhere((element) => element.id == cropInformationId)
              .name!,
          cultivationId: cultivationId,
          cultivationName: cultivations
              .firstWhere((element) => element.id == cultivationId)
              .cropVariety!,
          cultivatedArea: widget.argument.actualArea,
          subTotal: ctrlSubTotal.text,
          quantity: double.parse(valueQty),
          pricePerUnit: double.parse(valuePrice),
        );
        widget.argument.cropHarvests.add(mCropHarvest);
        Navigator.of(context).pop(widget.argument);
      },
    );
  }
}
