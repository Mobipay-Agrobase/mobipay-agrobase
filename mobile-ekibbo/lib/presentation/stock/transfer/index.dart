// ignore_for_file: use_build_context_synchronously

import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_upload.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/models/master/catalogue_response.dart';
import 'package:agrobase_ekibbo/models/stock/creation_response.dart';
import 'package:agrobase_ekibbo/models/stock/transfer_response.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class StockTransfer extends StatefulWidget {
  const StockTransfer({super.key, this.params});
  final StockTransferResponse? params;

  @override
  State<StockTransfer> createState() => _StockTransferState();
}

class _StockTransferState extends State<StockTransfer> {
  final _formKey = GlobalKey<FormState>();
  late StockTransferResponse body;

  final _ctrlWeight = TextEditingController();
  final _ctrlRemark = TextEditingController();
  final _ctrlSpeciesDate = TextEditingController();
  final _ctrlFarmerName = TextEditingController();
  final _ctrlPondName = TextEditingController();
  final _ctrlSpeciesCount = TextEditingController();
  final _ctrlNumberTransfered = TextEditingController();

  XFile? _photo;
  String initValuePhoto = '';

  List<StockCreationResponse> _creations = [];
  int? _creationIndex;
  String initValueCreation = '';

  List<CatalogueValueResponse> _catalogues = [];
  int? _catalogueIndex;
  String initValueCatalogue = '';

  int farmerId = 0;

  final _ctrlDateAdd = TextEditingController(
      text: DateHelper.convertDateToStr(DateTime.now(), format: "dd/MM/yyyy"));
  DateTime? dataAdd;

  _getStockCreation() async {
    final res = await ApiProvider.instance.apiStockCreation.fetch();
    setState(() {
      _creations = res?.data ?? [];
    });
  }

  _getCatalogue() async {
    final res = await ApiProvider.instance.apiCatalogue.fetch();
    setState(() {
      _catalogues = res?.data ?? [];
    });
  }

  setup() {
    if (widget.params == null) {
      body = StockTransferResponse.fromJson({});
      return;
    }
    body = StockTransferResponse.copy(widget.params!);
    farmerId = body.farmerId.toInt();
    _ctrlFarmerName.text = body.farmerName;
    _ctrlPondName.text = body.pondName;
    _ctrlDateAdd.text = DateHelper.convertDateToStr(
      DateTime.fromMillisecondsSinceEpoch(body.transferDate),
      format: "dd/MM/yyyy",
    );
    initValuePhoto = "${EnvConfig.domainOrigin}/${body.photo}";
    _ctrlRemark.text = body.remarks;

    _ctrlNumberTransfered.text = body.numberOfFishesTransfered.toString();
    _ctrlWeight.text = body.availableWeight.toString();
    _ctrlSpeciesCount.text = body.speciesCount.toString();
    initValueCreation = body.batchId;
    initValueCatalogue = body.destinationPond;
  }

  @override
  void initState() {
    _getStockCreation();
    _getCatalogue();
    super.initState();
    setup();
  }

  @override
  void dispose() {
    _ctrlSpeciesDate.dispose();
    _ctrlWeight.dispose();
    _ctrlNumberTransfered.dispose();
    _ctrlRemark.dispose();
    _photo = null;
    // Deferred: notifying listeners synchronously inside dispose() crashes
    // with "setState() or markNeedsBuild() called when widget tree was locked"
    // (the framework unmounts this screen with the tree locked). A microtask
    // runs right after the tree unlocks — same event-loop turn, no crash.
    Future.microtask(() {
      NavigatorManager.contextRoot
          .read<AppProvider>()
          .updateState(AppEvent.appSearchResetData);
    });
    super.dispose();
  }

  _onSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (widget.params == null) {
      if (_creationIndex == null) {
        DialogHelper.showOkDialog(context, 'Please choose farmer!');
        return;
      }
      if (_catalogueIndex == null) {
        DialogHelper.showOkDialog(context, 'Please choose pond');
        return;
      }
      if (_photo == null) {
        DialogHelper.showOkDialog(context, 'Please select photo!');
        return;
      }
    }

    if (widget.params == null) {
      body.transferDate = DateTime.now().millisecondsSinceEpoch;
      body.creationId = _creations[_creationIndex!].id;
    }

    body.destinationPond = _catalogueIndex == null
        ? initValueCatalogue
        : _catalogues[_catalogueIndex!].name;
    body.numberOfFishesTransfered =
        int.tryParse(_ctrlNumberTransfered.text) ?? 0;
    body.remarks = _ctrlRemark.text;

    if (_photo != null) {
      final res = await ApiUpload.uploads({'photo': _photo!});
      if (res == null) {
        DialogHelper.showOkDialog(context, "Upload photo fail!");
        return;
      }
      _photo = null;
      body.photo = res['photo'] ?? '';
      initValuePhoto = "${EnvConfig.domainOrigin}/${body.photo}";
    }

    if (widget.params == null) {
      onInsert();
    } else {
      onUpdate();
    }
  }

  onInsert() async {
    final res = await ApiProvider.instance.apiStockTransfer
        .add(jsonEncode(body.toJson()));

    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      DListingData.instance.stockTransfer = null;
      Navigator.of(context).pop(true);
    } else {
      DialogHelper.showOkDialog(context, 'Insert data fail!');
    }
  }

  onUpdate() async {
    final res = await ApiProvider.instance.apiStockTransfer
        .update(widget.params?.id.toString() ?? '0', jsonEncode(body.toJson()));

    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      DListingData.instance.stockTransfer = null;
      Navigator.of(context).pop(true);
    } else {
      DialogHelper.showOkDialog(context, 'Update data fail!');
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: const CustomAppBar(
          title: "Stock Transfer",
        ),
        body: Form(
          key: _formKey,
          child: Column(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        const SizedBox(height: 24),
                        AppFormField(
                          controller: _ctrlDateAdd,
                          hint: 'Date *',
                          readOnly: true,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_name;
                            }
                            return null;
                          },
                          prefixIcon: Padding(
                            padding: const EdgeInsets.only(left: 16, right: 16),
                            child: SvgPicture.asset('ic_calendar'.iconSvg),
                          ),
                        ),
                        const SizedBox(height: 24),
                        AppDropdownButton(
                          hintText: "Stock Creation",
                          items: _creations.map((e) => e.batchId).toList(),
                          itemSelected: initValueCreation,
                          isDisable: widget.params != null,
                          onChanged: (v) {
                            setState(() {
                              _creationIndex = v;
                              final creation = _creations[_creationIndex!];
                              initValueCreation = creation.batchId;
                              _ctrlFarmerName.text =
                                  creation.farmerName.toString();
                              _ctrlPondName.text = creation.pondName.toString();
                              _ctrlWeight.text = creation.avgWeight.toString();
                              _ctrlSpeciesCount.text =
                                  creation.speciesCount.toString();
                            });
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Farmer Name',
                          controller: _ctrlFarmerName,
                          readOnly: true,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Pond Name',
                          controller: _ctrlPondName,
                          readOnly: true,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Average Weight',
                          readOnly: true,
                          controller: _ctrlWeight,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          controller: _ctrlSpeciesCount,
                          hint: 'Species Count',
                          readOnly: true,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppDropdownButton(
                          hintText: "Destination Pond",
                          items: _catalogues.map((e) => e.name).toList(),
                          itemSelected: initValueCatalogue,
                          onChanged: (v) {
                            setState(() {
                              _catalogueIndex = v;
                              initValueCatalogue =
                                  _catalogues[_catalogueIndex!].name;
                            });
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Number of fishes transfered',
                          keyboardType: TextInputType.number,
                          controller: _ctrlNumberTransfered,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Remarks ',
                          controller: _ctrlRemark,
                          maxLines: 5,
                        ),
                        const SizedBox(height: 24),
                        StatefulBuilder(
                          builder: (_, s) => _buildImgView(
                            'Photo',
                            url: "${EnvConfig.domainOrigin}/${body.photo}",
                            chooseImg: () async {
                              _photo = await CommonHelper.chooseImg();
                              s(() {});
                            },
                            img: _photo,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(
                  left: 20,
                  right: 20,
                  bottom: 16,
                ),
                child: AppButton(
                  onTap: () {
                    _onSubmit();
                  },
                  title: AppLang.local.submit,
                  height: 46,
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImgView(
    String title, {
    XFile? img,
    Function()? chooseImg,
    String? url,
  }) {
    Widget view = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SvgPicture.asset(
          'ic_bold_camera'.iconSvg,
        ),
        const SizedBox(
          height: 4,
        ),
        Text(
          AppLang.local.choose_photo,
          style: TextStyleConstant.quicksandW600(
            color: ColorConstant.text79,
          ),
        )
      ],
    );
    if (img != null) {
      view = GImage.file(file: File(img.path));
    } else if (url != null) {
      view = GInternetImage(url: url);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style:
              TextStyleConstant.worksansW500(color: ColorConstant.gray6C757D),
        ),
        const SizedBox(
          height: 8,
        ),
        Row(
          children: [
            InkWell(
              onTap: chooseImg,
              child: Container(
                height: 94,
                width: 160,
                clipBehavior: Clip.hardEdge,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: ColorConstant.grayF6F7F9,
                ),
                child: view,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
