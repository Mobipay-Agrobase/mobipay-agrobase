import 'package:collection/collection.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_crop.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_order_sale.dart';
import 'package:agrobase_ekibbo/components/mixin/input_date.dart';
import 'package:agrobase_ekibbo/components/pick_photo.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_procurement.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/presentation/procurement/child/screen_add_post_harvest_check.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/vendor_procurement_request.dart';
import 'package:agrobase_ekibbo/presentation/procurement/widget/post_harvest_data.dart';
import 'package:agrobase_ekibbo/presentation/procurement/widget/product_vendor_info.dart';

class ScreenVendorProcurement extends StatefulWidget {
  const ScreenVendorProcurement({super.key});

  @override
  State<ScreenVendorProcurement> createState() =>
      _ScreenVendorProcurementState();
}

class _ScreenVendorProcurementState extends State<ScreenVendorProcurement>
    with DropCropMixin, InputDateMixin, DropOrderSaleMixin {
  double widthPhoto = (NavigatorManager.size.width - 60) / 2;

  LatLng? point;
  List<MPreHarvestQC> postHarvestQC = [];
  List<XFile> orderPhotos = [];
  List<XFile> qcPhotos = [];

  bool _isDisable = true;
  String textLocation = "";
  String dateTransaction =
      DateHelper.convertDateToStr(DateTime.now(), format: "yyyy-MM-dd");

  @override
  initState() {
    super.initState();
    fetchingData();
  }

  fetchingData() async {
    await Future.wait([
      fetchDropSeason(),
      fetchPreHarvestQC(),
      fetchOrderSaleIntention(),
    ]);
    setState(() {});
  }

  Future fetchPreHarvestQC() async {
    postHarvestQC = await ApiProcurement.getPreHarvestQC();
  }

  _isInputAnyQC() => postHarvestQC.any((element) => element.value.isNotEmpty);

  _validate() {
    setState(() {
      _isDisable = point == null ||
          orderPhotos.isEmpty ||
          orderSaleIntentionId == 0 ||
          seasonId == 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: "Vendor Procurement",
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    children: [
                      WidgetCommon.buildHeaderForm(
                          AppLang.local.general_information),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24, top: 10),
                        child: AppFormField(
                          hint: AppLang.local.transaction_date,
                          initialValue: dateTransaction,
                          readOnly: true,
                          fillColor: ColorConstant.grayDBDBDB,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24.0),
                        child: InputDropDownData(
                          items: seasons.map((e) => e.seasonName!).toList(),
                          hintText: AppLang.local.harvest_season,
                          itemIndex: indexSeason(),
                          onChanged: (index) {
                            seasonId = seasons[index].id!;
                            setState(() {});
                          },
                        ),
                      ),
                      // Padding(
                      //   padding: const EdgeInsets.only(bottom: 24),
                      //   child: InkWell(
                      //     onTap: () async {
                      //       final res = await Navigator.of(context).push(
                      //         MaterialPageRoute(
                      //           builder: (context) =>
                      //               ScreenPinLocation(point: point),
                      //         ),
                      //       );
                      //       if (res is LatLng) {
                      //         point = res;
                      //         textLocation =
                      //             "[${point!.latitude.toStringAsFixed(2)} : ${point!.longitude.toStringAsFixed(2)}]";
                      //         _validate();
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
                        padding: const EdgeInsets.only(bottom: 24, right: 16),
                        child: Wrap(
                          direction: Axis.horizontal,
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            ...orderPhotos
                                .map((e) => WPickPhoto(
                                      photo: e,
                                      width: widthPhoto,
                                      remove: () {
                                        orderPhotos.remove(e);
                                        _validate();
                                      },
                                    ))
                                .toList(),
                            WPickPhoto(
                              width: widthPhoto,
                              isChanged: true,
                              onChossed: (photo) {
                                orderPhotos.insert(0, photo!);
                                _validate();
                              },
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24.0),
                        child: InputDropDownData(
                          items: orderSaleIntentions
                              .map((e) => e.order.code)
                              .toList(),
                          hintText: "Order Sale Intention",
                          itemIndex: indexOrderSaleIntention(),
                          onChanged: (index) {
                            orderSaleIntentionId =
                                orderSaleIntentions[index].order.id;
                            _validate();
                          },
                        ),
                      ),
                      WidgetCommon.buildHeaderForm(
                          AppLang.local.product_information),
                      const SizedBox(height: 10),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24.0),
                        child: WProductVendorInfo(
                          order: orderSaleIntentions.firstWhereOrNull(
                              (element) =>
                                  element.order.id == orderSaleIntentionId),
                        ),
                      ),
                      WidgetCommon.buildHeaderForm(
                          "Post Harvest Quality Check"),
                      const SizedBox(height: 10),
                      _isInputAnyQC() || qcPhotos.isNotEmpty
                          ? PostHarvestDataShow(
                              preHarvestQC: postHarvestQC,
                              qcPhotos: qcPhotos,
                              onPressed: () async {
                                await Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        ScreenPostHarvestCheck(
                                      preHarvestQC: postHarvestQC,
                                      qcPhotos: qcPhotos,
                                    ),
                                  ),
                                );
                                _validate();
                              },
                            )
                          : AppButton(
                              title: "Add QC",
                              height: 46,
                              borderColor: ColorConstant.primary,
                              color: Colors.white,
                              titleStyle: TextStyleConstant.worksansW500(
                                fontSize: 16,
                                color: ColorConstant.primary,
                              ),
                              onTap: () async {
                                await Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        ScreenPostHarvestCheck(
                                      preHarvestQC: postHarvestQC,
                                      qcPhotos: qcPhotos,
                                    ),
                                  ),
                                );
                                _validate();
                              },
                            ),
                      const SizedBox(height: 10),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              child: AppButton(
                title: AppLang.local.submit,
                height: 46,
                onTap: () => _onSubmit(),
                disable: _isDisable,
                color: _isDisable ? ColorConstant.grayDBDBDB : null,
              ),
            ),
          ],
        ),
      ),
    );
  }

  _onSubmit() async {
    final order = orderSaleIntentions.firstWhereOrNull(
        (element) => element.order.id == orderSaleIntentionId);
    if (order == null) return;
    if (order.order.orderDetail.isEmpty) return;
    final MVendorProcurementRequest data = MVendorProcurementRequest(
      seasonId: seasonId,
      lat: double.parse(point!.latitude.toStringAsFixed(2)),
      lng: double.parse(point!.longitude.toStringAsFixed(2)),
      orderId: orderSaleIntentionId,
      productId: order.order.orderDetail[0].productId,
      productName: order.order.orderDetail[0].productName,
      orderCode: order.order.code,
      quantity: order.order.orderDetail[0].quantity,
      postHarvestQC: postHarvestQC,
    );

    var formData = FormData.fromMap(data.toMap());

    formData.files.addAll([
      ...orderPhotos
          .map(
            (e) => MapEntry(
              'order_photo[]',
              MultipartFile.fromFileSync(
                e.path,
                contentType: MediaType.parse(lookupMimeType(e.path) ?? ''),
              ),
            ),
          )
          .toList(),
      ...qcPhotos
          .map(
            (e) => MapEntry(
              'qc_photo[]',
              MultipartFile.fromFileSync(
                e.path,
                contentType: MediaType.parse(lookupMimeType(e.path) ?? ''),
              ),
            ),
          )
          .toList(),
    ]);

    try {
      DialogHelper.showLoading();
      final res = await ApiProcurement.createVendorProcurement(formData);
      DialogHelper.hideLoading();
      if (res.result!) {
        // ignore: use_build_context_synchronously
        DialogHelper.showOkDialog(context, "Add Vendor Procurement Success!",
            okAction: () {
          // ignore: use_build_context_synchronously
          Navigator.of(context).pop();
        });
      }
      // ignore: use_build_context_synchronously
      DialogHelper.showToast(
          context, res.message ?? "Something wrong here, please check again!");
    } catch (e) {
      DialogHelper.hideLoading();
    }
  }
}
