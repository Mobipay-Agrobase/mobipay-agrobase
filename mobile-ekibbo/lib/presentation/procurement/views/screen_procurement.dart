import 'dart:async';
import 'dart:io';
import 'package:collection/collection.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_cropharvest.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_vehicle.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_warehouse.dart';
import 'package:agrobase_ekibbo/components/mixin/input_date.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_procurement.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_orther_info.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/procurement_request.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/child/screen_add_cost.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/cost_procurement_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/widget/cost_information.dart';
import 'package:agrobase_ekibbo/presentation/procurement/widget/product_information.dart';

class ScreenProcurement extends StatefulWidget {
  const ScreenProcurement({super.key});

  @override
  State<ScreenProcurement> createState() => _ScreenProcurementState();
}

class _ScreenProcurementState extends State<ScreenProcurement>
    with
        InputDateMixin,
        DropVehicleMixin,
        DropCropHarvestMixin,
        DropWarehouseMixin {
  final ctrlDriverName = TextEditingController();
  final ctrlDriverPhone = TextEditingController();
  final ctrlVehicleCap = TextEditingController();

  List<MProcurementCost> costProcurements = [];

  XFile? _photo;
  //LatLng? point;
  //String textLocation = "Pin location * ";
  String dateTransaction =
      DateHelper.convertDateToStr(DateTime.now(), format: "yyyy-MM-dd");

  @override
  void initState() {
    super.initState();
    fetchingData();
  }

  fetchingData() async {
    await Future.wait([
      fetchVehicleType(),
      fetchCropHarvest(),
      fetchWareHouse(),
    ]);
    setState(() {});
  }

  @override
  void dispose() {
    ctrlDriverName.dispose();
    ctrlDriverPhone.dispose();
    ctrlVehicleCap.dispose();
    dateController.dispose();
    super.dispose();
  }

  @override
  fetchVehicleNumber() async {
    await super.fetchVehicleNumber();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: false,
      appBar: const CustomAppBar(
        title: "Procurement",
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                WidgetCommon.buildHeaderForm(AppLang.local.general_information),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24, top: 10),
                  child: AppFormField(
                    hint: AppLang.local.transaction_date,
                    initialValue: dateTransaction,
                    readOnly: true,
                    fillColor: ColorConstant.grayDBDBDB,
                  ),
                ),
                // Padding(
                //   padding: const EdgeInsets.only(bottom: 24),
                //   child: InkWell(
                //     onTap: () async {
                //       final res = await Navigator.of(context).push(
                //         MaterialPageRoute(
                //           builder: (context) => ScreenPinLocation(point: point),
                //         ),
                //       );
                //       if (res is LatLng) {
                //         point = res;
                //         textLocation =
                //             "[${point!.latitude.toStringAsFixed(2)} : ${point!.longitude.toStringAsFixed(2)}]";
                //         setState(() {});
                //       }
                //     },
                //     child: Container(
                //       padding: const EdgeInsets.all(16),
                //       decoration: BoxDecoration(
                //         borderRadius: BorderRadius.circular(8),
                //         color: ColorConstant.grayF6F7F9,
                //       ),
                //       child: Column(
                //         crossAxisAlignment: CrossAxisAlignment.start,
                //         children: [
                //           Row(
                //             children: [
                //               SvgPicture.asset(
                //                 'ic_location'.iconSvg,
                //               ),
                //               const SizedBox(width: 10),
                //               Text(
                //                 textLocation,
                //                 style: TextStyleConstant.quicksandW600(
                //                   color: ColorConstant.text79,
                //                 ),
                //               ),
                //             ],
                //           ),
                //         ],
                //       ),
                //     ),
                //   ),
                // ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: InputDropDownData(
                    hintText: "${AppLang.local.vehicle_type} *",
                    items: vehicleTypes.map((e) => e.name).toList(),
                    itemIndex: indexVehicleType(),
                    onChanged: (index) async {
                      vehicleNumberId = 0;
                      vehicleTypeId = vehicleTypes[index].id;
                      fetchVehicleNumber();
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: InputDropDownData(
                    hintText: "${AppLang.local.vehicle_license_number} *",
                    items: vehicleNumbers.map((e) => e.licenseNumber).toList(),
                    itemIndex: indexVehicleNumber(),
                    onChanged: (index) {
                      final vehicleNumber = vehicleNumbers[index];
                      vehicleNumberId = vehicleNumber.id;
                      ctrlDriverName.text = vehicleNumber.driverName;
                      ctrlDriverPhone.text = vehicleNumber.driverPhoneNumber;
                      ctrlVehicleCap.text = "1000";
                      setState(() {});
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.driver_name,
                    controller: ctrlDriverName,
                    readOnly: true,
                    fillColor: ColorConstant.grayDBDBDB,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.driver_phone_number,
                    controller: ctrlDriverPhone,
                    readOnly: true,
                    fillColor: ColorConstant.grayDBDBDB,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.vehicle_capacity,
                    controller: ctrlVehicleCap,
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
                  padding: const EdgeInsets.only(bottom: 24.0, top: 10),
                  child: inputDateMixin(context, firstDate: DateTime.now()),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: InputDropDownData(
                    hintText: "${AppLang.local.crop_harvest_ids} *",
                    items: cropHarvests.map((e) => e.id.toString()).toList(),
                    itemIndex: indexCropHarvest(),
                    onChanged: (index) {
                      cropHarvestId = cropHarvests[index].id;
                      setState(() {});
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: _buildPhoto(context),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: InputDropDownData(
                    hintText: "${AppLang.local.warehouse} *",
                    items: warehouses.map((e) => e.name).toList(),
                    itemIndex: indexWareHouse(),
                    onChanged: (index) {
                      warehouseId = warehouses[index].id;
                    },
                  ),
                ),
                WidgetCommon.buildHeaderForm(AppLang.local.product_information),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24, top: 10),
                  child: ProductInformation(
                    cropHarvest: cropHarvests.firstWhereOrNull(
                        (element) => element.id == cropHarvestId),
                  ),
                ),
                WidgetCommon.buildHeaderForm(AppLang.local.cost_information),
                const SizedBox(height: 10),
                ...costProcurements
                    .map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: CostInformation(
                          cost: item,
                          onRemove: () {
                            costProcurements.removeWhere(
                                (element) => element.itemId == item.itemId);
                            setState(() {});
                          },
                          onEdit: () async {
                            final res = await Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => ScreenAddCost(
                                  argument: ArgumentAddCostProcurement(
                                    itemId: item.itemId,
                                    costProcurements: costProcurements,
                                  ),
                                ),
                              ),
                            );
                            if (res is ArgumentAddCostProcurement) {
                              costProcurements = res.costProcurements;
                              setState(() {});
                            }
                          },
                        ),
                      ),
                    )
                    .toList(),
                _buildBtnAddProduct(),
                const SizedBox(height: 10),
                _buildBtnSubmit(),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  _buildBtnSubmit() {
    return AppButton(
      title: AppLang.local.submit,
      height: 46,
      onTap: () async {
        final isAccept = await DOrtherInfo.instance.isAcceptLocation();
        if (!isAccept) return;
        if (_photo == null || _photo!.path.isEmpty) {
          // ignore: use_build_context_synchronously
          DialogHelper.showOkDialog(context, AppLang.local.please_choose_photo);
          return;
        }

        if (warehouseId == 0) {
          // ignore: use_build_context_synchronously
          DialogHelper.showOkDialog(
              context, AppLang.local.please_choose_warehouse);
          return;
        }

        MProcurementRequest mProcurementRequest = MProcurementRequest(
            warehouseId: warehouseId,
            lat: DOrtherInfo.instance.location!.latitude,
            lng: DOrtherInfo.instance.location!.longitude,
            bookingDate: dateController.text,
            vehicleId: vehicleNumberId,
            procurementDetails: [
              cropHarvests
                  .firstWhereOrNull((element) => element.id == cropHarvestId)
            ].map((e) => e!.toMap()).toList(),
            otherCosts: costProcurements.map((e) => e.toMap()).toList());

        var formData = FormData.fromMap(mProcurementRequest.toMap());
        formData.files.addAll([
          MapEntry(
            'photo[]',
            MultipartFile.fromFileSync(
              _photo!.path,
              contentType: MediaType.parse(lookupMimeType(_photo!.path) ?? ''),
            ),
          ),
        ]);

        DialogHelper.showLoading();
        final res = await ApiProcurement.createProcurement(formData);
        DialogHelper.hideLoading();
        if (res.result!) {
          // ignore: use_build_context_synchronously
          DialogHelper.showOkDialog(context, "Add Procurement Success!",
              okAction: () {
            // ignore: use_build_context_synchronously
            Navigator.of(context).pop();
          });
        }
        // ignore: use_build_context_synchronously
        DialogHelper.showToast(context,
            res.message ?? "Something wrong here, please check again!");
      },
    );
  }

  _buildBtnAddProduct() {
    return AppButton(
      title: "Add Crop Information",
      height: 46,
      borderColor: ColorConstant.primary,
      color: Colors.white,
      titleStyle: TextStyleConstant.worksansW500(
        fontSize: 16,
        color: ColorConstant.primary,
      ),
      onTap: () async {
        final res = await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ScreenAddCost(
              argument: ArgumentAddCostProcurement(
                itemId: 0,
                costProcurements: costProcurements,
              ),
            ),
          ),
        );
        if (res is ArgumentAddCostProcurement) {
          costProcurements = res.costProcurements;
          setState(() {});
        }
      },
    );
  }

  StatefulBuilder _buildPhoto(BuildContext context) {
    return StatefulBuilder(
      builder: (_, s) => InkWell(
        onTap: () async {
          _photo = await CommonHelper.chooseImgOptions(context);
          s(() {});
        },
        child: Container(
          height: 94,
          width: double.maxFinite,
          clipBehavior: Clip.hardEdge,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: ColorConstant.grayF6F7F9,
          ),
          child: _photo != null
              ? GImage.file(file: File(_photo!.path))
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SvgPicture.asset(
                      'ic_bold_camera'.iconSvg,
                    ),
                    const SizedBox(
                      height: 4,
                    ),
                    Text(
                      AppLang.local.crop_photos,
                      style: TextStyleConstant.quicksandW600(
                        color: ColorConstant.text79,
                      ),
                    )
                  ],
                ),
        ),
      ),
    );
  }
}
