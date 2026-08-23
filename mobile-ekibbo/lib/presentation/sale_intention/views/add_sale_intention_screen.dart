// ignore_for_file: use_build_context_synchronously
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/date_form_field.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_crop.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_cultivation.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_farmland.dart';
import 'package:agrobase_ekibbo/components/mixin/input_farmer.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_sale_intention.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_orther_info.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
import 'package:agrobase_ekibbo/models/sale_intention/sale_intention_response.dart';
import 'package:agrobase_ekibbo/presentation/sale_intention/model/sale_intention_request_model.dart';
import 'package:agrobase_ekibbo/presentation/sale_intention/views/pre_harvest_quality_screen.dart';
import 'package:agrobase_ekibbo/presentation/sale_intention/widget/pre_harvest_data.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class AddSaleIntentionScreen extends StatefulWidget {
  const AddSaleIntentionScreen({
    super.key,
    this.productId,
  });
  final String? productId;
  @override
  State<AddSaleIntentionScreen> createState() => _AddSaleIntentionScreenState();
}

class _AddSaleIntentionScreenState extends State<AddSaleIntentionScreen>
    with
        DropCropMixin,
        InputFarmerMixin,
        DropFarmLandMixin,
        DropCultivationMixin {
  SaleIntentionModel? _detail;
  List<MPreHarvestQC> preHarvestQC = [];

  String dateTransaction =
      DateHelper.convertDateToStr(DateTime.now(), format: "yyyy-MM-dd");
  final ctrlArea = TextEditingController();
  final ctrlSowingDate = TextEditingController();

  //LatLng? point;
  String textLocation = "";

  final List<String> _grades = [
    AppLang.local.very_poor,
    AppLang.local.poor,
    AppLang.local.average,
    AppLang.local.good,
    AppLang.local.excellent
  ];

  String? _gradeSelected;

  DateTime _dateHarvest = DateTime.now();
  DateTime _dateAviable = DateTime.now();

  final ctrlPriceFrom = TextEditingController();
  final ctrlPriceTo = TextEditingController();
  final ctrlSale = TextEditingController();
  final ctrlAgeCrop = TextEditingController();
  bool _isDisable = true;
  XFile? _photo;

  @override
  void initState() {
    super.initState();
    if (widget.productId != null) {
      _getDetail();
      return;
    }
    fetchingData();
  }

  fetchingData() async {
    await Future.wait([
      fetchDropSeason(),
      fetchPreHarvestQC(),
    ]);
    setState(() {});
  }

  @override
  void dispose() {
    ctrlArea.dispose();
    ctrlSowingDate.dispose();
    ctrlPriceFrom.dispose();
    ctrlPriceTo.dispose();
    ctrlSale.dispose();
    ctrlAgeCrop.dispose();
    super.dispose();
  }

  Future fetchPreHarvestQC() async {
    preHarvestQC = await ApiSaleIntention.getPreHarvestQC();
  }

  @override
  Future fetchCropInformation(int farmlandId) async {
    await super.fetchCropInformation(farmlandId);
    setState(() {});
  }

  @override
  fetchCultivation(int seasonId, int farmlandId, int cropId) async {
    await super.fetchCultivation(seasonId, farmlandId, cropId);
    setState(() {});
  }

  @override
  Future<void> onChangeFarmer(BuildContext context,
      {int cooperativeId = 0,
      int provinceId = 0,
      int communeId = 0,
      int hasData = 1}) async {
    await super.onChangeFarmer(
      context,
      cooperativeId: cooperativeId,
      communeId: communeId,
      hasData: hasData,
    );
    await fetchFarmland(farmerId);
    setState(() {});
  }

  _getDetail() async {
    DialogHelper.showLoading();
    final res = await ApiProvider.instance.apiSaleIntention
        .getDetailSaleIntention(widget.productId!);
    DialogHelper.hideLoading();
    if (res?.data != null) {
      setState(() {
        _detail = res?.data?.dataSaleIntention;
        _dateHarvest =
            DateHelper.convertStrToDate(_detail?.dateForHarvest ?? '');
        ctrlSale.text = '${_detail?.quantity ?? ''}';
        _dateAviable = DateHelper.convertStrToDate(_detail?.aviableDate ?? '');
        ctrlPriceFrom.text = '${_detail?.minPrice ?? ''}';
        ctrlPriceTo.text = '${_detail?.maxPrice ?? ''}';
        ctrlAgeCrop.text = _detail?.ageOfCrop ?? '';
      });
    }
  }

  _validate() {
    setState(() {
      _isDisable = farmerId == 0 ||
          farmlandId == 0 ||
          cultivationId == 0 ||
          seasonId == 0 ||
          ctrlSale.text.isEmpty ||
          ctrlPriceFrom.text.isEmpty ||
          //ctrlPriceTo.text.isEmpty ||
          //textLocation.isEmpty ||
          _photo == null ||
          !_isInputFullQC;
    });
  }

  bool get _isInputFullQC =>
      preHarvestQC.every((element) => element.value.isNotEmpty);

  _onSave() async {
    final isAccept = await DOrtherInfo.instance.isAcceptLocation();
    if (!isAccept) return;
    if (ctrlSale.text.contains(',')) {
      DialogHelper.showOkDialog(
          context, "Check ${AppLang.local.sale_quantity}");
    }

    final sellerRequestData = MSaleIntentionRequest(
        varietyName: varietyName,
        startingBid: double.tryParse(ctrlPriceFrom.text) ?? 0,
        dateForHarvest: DateHelper.convertDateToStr(_dateHarvest),
        aviableDate: DateHelper.convertDateToStr(_dateAviable),
        farmerId: farmerId,
        farmLandId: farmlandId,
        cultivationId: cultivationId,
        seasonId: seasonId,
        sowingDate: ctrlSowingDate.text,
        quantity: double.parse(ctrlSale.text),
        maxPrice: double.tryParse(ctrlPriceTo.text) ?? 0,
        grade: _gradeSelected ?? '',
        ageOfCrop: ctrlAgeCrop.text,
        lat: DOrtherInfo.instance.location!.latitude,
        lng: DOrtherInfo.instance.location!.longitude,
        phone: farmerPhone,
        preHarvestQC: preHarvestQC);

    //print(sellerRequestData.toMap());
    //return;

    DialogHelper.showLoading();
    final res = await ApiProvider.instance.apiSeller
        .loginSeller(sellerRequestData.sellerLogin());
    if (res?.access_token != null) {
      ApiProvider.instance.setTokenSeller(res!.access_token!);
      _storeProduct(res.access_token!, sellerRequestData.toMap());
    } else {
      DialogHelper.hideLoading();
      DialogHelper.showToast(context, 'No seller profile was already created');
    }
  }

  _storeProduct(String token, Map<String, dynamic> data) async {
    var form = FormData.fromMap(
      data,
    );
    if (_photo != null) {
      form.files.addAll([
        MapEntry(
          'photo[]',
          MultipartFile.fromFileSync(
            _photo!.path,
            contentType: MediaType.parse(lookupMimeType(_photo!.path) ?? ''),
          ),
        ),
      ]);
    }

    try {
      final res = await ApiProvider.instance.apiSeller.saveProduceSeller(form);
      DialogHelper.hideLoading();
      SharedPreferencesProvider.instance.clearKey(SharedKey.sellerToken.name);
      if (res?.result == true) {
        Navigator.of(context).pop(true);
        DialogHelper.showToast(context,
            'Auction Product and Sale Intention has been inserted successfully');
      } else {
        DialogHelper.showToast(
            context, res?.message.toString() ?? "Please try later again");
      }
    } catch (_) {
      debugPrint("_storeProduct $_");
      SharedPreferencesProvider.instance.clearKey(SharedKey.sellerToken.name);
      DialogHelper.hideLoading();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: AppLang.local.add_sale_intention,
        ),
        body: Column(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: SingleChildScrollView(
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
                          hintText: "${AppLang.local.harvest_season} *",
                          itemIndex: indexSeason(),
                          onChanged: (index) {
                            seasonId = seasons[index].id!;
                            fetchCropInformation(farmlandId);
                            _validate();
                          },
                        ),
                      ),
                      Padding(
                          padding: const EdgeInsets.only(bottom: 24.0),
                          child: inputFarmerMixin(context, hasData: 1)),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24.0),
                        child: InputDropDownData(
                          items: farmlands.map((e) => e.farmName!).toList(),
                          hintText: "${AppLang.local.farm_land} *",
                          itemIndex: indexFarmland(),
                          onChanged: (index) {
                            farmlandId = farmlands[index].id ?? 0;
                            ctrlArea.text =
                                farmlands[index].actualArea.toString();
                            fetchCropInformation(farmlandId);
                            _validate();
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24, top: 10),
                        child: InputDropDownData(
                          hintText: "${AppLang.local.crop_cultivated} *",
                          items: cropInformations.map((e) => e.name!).toList(),
                          itemIndex: indexCropInformation(),
                          onChanged: (index) {
                            cropInformationId = cropInformations[index].id!;
                            fetchCultivation(
                                seasonId, farmlandId, cropInformationId);
                            _validate();
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: InputDropDownData(
                          hintText: "${AppLang.local.variety} *",
                          items:
                              cultivations.map((e) => e.cropVariety!).toList(),
                          itemIndex: indexCultivation(),
                          onChanged: (index) {
                            final cultivation = cultivations[index];
                            cultivationId = cultivation.id ?? 0;
                            ctrlSowingDate.text = cultivation.sowingDate ?? '';
                            varietyName = cultivation.cropVariety ?? '';
                            _validate();
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
                      _buildPhoto(context),
                      const SizedBox(height: 24),
                      DateFormField(
                        initialDate: _dateHarvest,
                        hint: AppLang.local.date_for_fix_harvest,
                        isDisable: widget.productId != null,
                        onChanged: (v) {
                          setState(() {
                            _dateHarvest = v;
                          });
                          _validate();
                        },
                      ),
                      const SizedBox(
                        height: 24,
                      ),
                      AppFormField(
                        labelText: AppLang.local.sale_quantity,
                        keyboardType: TextInputType.number,
                        controller: ctrlSale,
                        readOnly: widget.productId != null,
                        suffixIcon: Padding(
                          padding: const EdgeInsets.only(
                              top: 16, bottom: 16, right: 16),
                          child: Text(
                            'KG',
                            style: TextStyleConstant.quicksandW600(
                              color: ColorConstant.text79.withOpacity(0.3),
                            ),
                          ),
                        ),
                        onChanged: (v) {
                          _validate();
                        },
                      ),
                      const SizedBox(
                        height: 24,
                      ),
                      DateFormField(
                        initialDate: _dateAviable,
                        hint: AppLang.local.available_date,
                        isDisable: widget.productId != null,
                        onChanged: (v) {
                          setState(() {
                            _dateAviable = v;
                          });
                          _validate();
                        },
                      ),
                      const SizedBox(
                        height: 24,
                      ),
                      //Row(
                      //  children: [
                      //    Expanded(
                      //      child:
                      AppFormField(
                        labelText: "${AppLang.local.price_from} *",
                        readOnly: widget.productId != null,
                        keyboardType: TextInputType.number,
                        controller: ctrlPriceFrom,
                        suffixIcon: Padding(
                          padding: const EdgeInsets.only(top: 16, bottom: 16),
                          child: Text(
                            'VND',
                            style: TextStyleConstant.quicksandW600(
                              color: ColorConstant.text79.withOpacity(0.3),
                            ),
                          ),
                        ),
                        onChanged: (v) {
                          _validate();
                        },
                      ),
                      //),
                      // const SizedBox(
                      //   width: 16,
                      // ),
                      // Expanded(
                      //   child: AppFormField(
                      //     labelText: "${AppLang.local.price_to} *",
                      //     readOnly: widget.productId != null,
                      //     keyboardType: TextInputType.number,
                      //     controller: ctrlPriceTo,
                      //     suffixIcon: Padding(
                      //       padding:
                      //           const EdgeInsets.only(top: 16, bottom: 16),
                      //       child: Text(
                      //         'đ',
                      //         style: TextStyleConstant.quicksandW600(
                      //           color:
                      //               ColorConstant.text79.withOpacity(0.3),
                      //         ),
                      //       ),
                      //     ),
                      //     onChanged: (v) {
                      //       _validate();
                      //     },
                      //   ),
                      // )
                      //],
                      //),
                      const SizedBox(
                        height: 24,
                      ),
                      AppDropdownButton(
                        hintText: AppLang.local.grade,
                        items: _grades,
                        isDisable: widget.productId != null,
                        itemSelected: widget.productId != null
                            ? _detail?.grade
                            : _gradeSelected,
                        onChanged: (v) {
                          _gradeSelected = _grades[v];
                          _validate();
                        },
                      ),
                      const SizedBox(
                        height: 24,
                      ),
                      AppFormField(
                        labelText: AppLang.local.age_of_crop,
                        keyboardType: TextInputType.number,
                        controller: ctrlAgeCrop,
                        readOnly: widget.productId != null,
                        onChanged: (v) {
                          _validate();
                        },
                      ),
                      const SizedBox(height: 24),
                      WidgetCommon.buildHeaderForm(
                          AppLang.local.pre_harvest_quality_check),
                      const SizedBox(height: 10),
                      _isInputFullQC
                          ? PreHarvestDataShow(
                              preHarvestQC: preHarvestQC,
                              onPressed: () async {
                                await Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        ScreenPreHarvestQuality(
                                            preHarvestQC: preHarvestQC),
                                  ),
                                );
                                _validate();
                              },
                            )
                          : AppButton(
                              title: AppLang.local.add_qc,
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
                                        ScreenPreHarvestQuality(
                                            preHarvestQC: preHarvestQC),
                                  ),
                                );
                                _validate();
                              },
                            ),
                    ],
                  ),
                ),
              ),
            ),
            if (widget.productId == null)
              Padding(
                padding: const EdgeInsets.only(
                    left: 16, right: 16, bottom: 16, top: 8),
                child: AppButton(
                  title: AppLang.local.submit,
                  height: 46,
                  onTap: _onSave,
                  disable: _isDisable,
                  color: _isDisable ? ColorConstant.grayDBDBDB : null,
                ),
              )
          ],
        ),
      ),
    );
  }

  StatefulBuilder _buildPhoto(BuildContext context) {
    return StatefulBuilder(
      builder: (_, s) => Row(
        children: [
          InkWell(
            onTap: () async {
              if (widget.productId != null) {
                return;
              }
              _photo = await CommonHelper.chooseImgOptions(context,
                  imageQuality: 50);
              s(() {});
              _validate();
            },
            child: widget.productId != null
                ? GInternetImage(
                    url: _detail?.photo,
                    height: 94,
                    borderRadius: 8,
                    width: 160,
                    fit: BoxFit.fill,
                  )
                : Container(
                    height: 94,
                    width: 160,
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
                                AppLang.local.product_photo,
                                style: TextStyleConstant.quicksandW600(
                                  color: ColorConstant.text79,
                                ),
                              )
                            ],
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
