// ignore_for_file: use_build_context_synchronously

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_address.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/map_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmer.dart';
import 'package:agrobase_ekibbo/models/distribution/model_cooperative.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farmer_local/farmer_local_model.dart';
import 'package:agrobase_ekibbo/models/location/commune/commune_model.dart';
import 'package:agrobase_ekibbo/models/location/country/country_model.dart';
import 'package:agrobase_ekibbo/models/location/district/district_model.dart';
import 'package:agrobase_ekibbo/models/location/province/province_model.dart';

class FarmerRegistrationScreen extends StatefulWidget {
  const FarmerRegistrationScreen({
    super.key,
    required this.farmerLocal,
  });

  final MFarmerLocal farmerLocal;

  @override
  State<FarmerRegistrationScreen> createState() =>
      _FarmerRegistrationScreenState();
}

class _FarmerRegistrationScreenState extends State<FarmerRegistrationScreen> {
  final _birthDateTxtController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  DateTime? _birthDate;
  XFile? _avtFile;
  XFile? _frontImg;
  XFile? _backImg;
  List<CountryModel> _countries = [];
  List<ProvinceModel> _provinces = [];
  List<DistrictModel> _districts = [];
  List<CommuneModel> _communes = [];
  List<DropdownDataModel> _genders = [];
  List<DropdownDataModel> _enrollmentPlace = [];
  List<DropdownDataModel> _identityProofs = [];
  List<MCooperative> _cooperatives = [];
  bool _isUpdate = false;

  late LatLng _latLng;
  late MFarmerLocal mFarmerLocal;

  @override
  void initState() {
    mFarmerLocal = MFarmerLocal.fromMap(widget.farmerLocal.toMap());
    _setupData();
    _initDataLocation();
    _getDropdownData();
    super.initState();
  }

  @override
  void dispose() {
    _birthDateTxtController.dispose();
    _avtFile = null;
    _frontImg = null;
    _backImg = null;
    super.dispose();
  }

  _setupData() async {
    _isUpdate = mFarmerLocal.farmer_code.isNotEmpty;
    _avtFile = XFile(mFarmerLocal.farmer_photo);
    if (mFarmerLocal.id_proof_photo_url.isEmpty) {
      if (mFarmerLocal.id_proof_photo_front.isNotEmpty) {
        _frontImg = XFile(mFarmerLocal.id_proof_photo_front);
      }
      if (mFarmerLocal.id_proof_photo_back.isNotEmpty) {
        _backImg = XFile(mFarmerLocal.id_proof_photo_back);
      }
    } else {
      _frontImg = XFile(mFarmerLocal.id_proof_photo_url.first);
      _backImg = XFile(mFarmerLocal.id_proof_photo_url.last);
    }
    if (mFarmerLocal.dob.isNotEmpty) {
      _birthDateTxtController.text = mFarmerLocal.dob;
    }
  }

  _initDataLocation() async {
    _latLng = LatLng(double.tryParse(mFarmerLocal.lat) ?? 0,
        double.tryParse(mFarmerLocal.lng) ?? 0);
    await _getCountries();
    await _getCooperatives();
    if (mFarmerLocal.province != 0) await _getProvinces();
    if (mFarmerLocal.district != 0) await _getDistricts();
    if (mFarmerLocal.commune != 0) await _getCommune();
  }

  Future<void> _getDropdownData() async {
    final res = await ApiAddress.getDropDownForRegister();
    setState(() {
      _genders = res.dataGender ?? [];
      _enrollmentPlace = res.dataEnrollmentPlace ?? [];
      _identityProofs = res.dataIdentityProof ?? [];
    });
  }

  _getCooperatives() async {
    _cooperatives = await ApiAddress.getCooperatives();
    if (_cooperatives.isNotEmpty) {
      setState(() {});
    }
  }

  _getCountries() async {
    _countries = await ApiAddress.getCountries();
    if (_countries.isNotEmpty) {
      setState(() {});
    }
  }

  _getProvinces() async {
    if (_countries.isEmpty) return;
    _provinces = await ApiAddress.getProvices(mFarmerLocal.country);
    if (_provinces.isNotEmpty) {
      setState(() {});
    }
  }

  _getDistricts() async {
    if (_provinces.isEmpty) return;
    _districts = await ApiAddress.getDistricts(mFarmerLocal.province);
    if (_districts.isNotEmpty) {
      setState(() {});
    }
  }

  _getCommune() async {
    if (_districts.isEmpty) return;
    _communes = await ApiAddress.getCommunes(mFarmerLocal.district);
    if (_communes.isNotEmpty) {
      setState(() {});
    }
  }

  int? initIndex(List<String> items, String item) {
    try {
      int index = items.indexOf(item);
      return index == -1 ? null : index;
    } catch (e) {
      return null;
    }
  }

  int? indexCooperative() {
    if (mFarmerLocal.cooperative_id == 0 || _cooperatives.isEmpty) return null;
    final index = _cooperatives
        .indexWhere((element) => element.id == mFarmerLocal.cooperative_id);
    if (index == -1) return null;
    return index;
  }

  int? indexIdentityProof() {
    if (mFarmerLocal.identity_proof.isEmpty || _identityProofs.isEmpty) {
      return null;
    }
    final index = _identityProofs
        .indexWhere((element) => element.name == mFarmerLocal.identity_proof);
    if (index == -1) return null;
    return index;
  }

  _onSaveToLocal() {
    mFarmerLocal.farmer_photo = _avtFile!.path;
    if (_frontImg != null) {
      mFarmerLocal.id_proof_photo_front = _frontImg!.path;
      mFarmerLocal.id_proof_photo_url.add(_frontImg!.path);
    }
    if (_backImg != null) {
      mFarmerLocal.id_proof_photo_back = _backImg!.path;
      mFarmerLocal.id_proof_photo_url.add(_backImg!.path);
    }
    context
        .read<AppProvider>()
        .updateState(AppEvent.appFarmerSaveToLocal, argument: mFarmerLocal);
  }

  _onSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_avtFile == null || _avtFile!.path.isEmpty) {
      DialogHelper.showOkDialog(context, AppLang.local.please_choose_avt);
      return;
    }
    if (mFarmerLocal.identity_proof.isNotEmpty) {
      if (_frontImg == null || mFarmerLocal.id_proof_photo_front.isEmpty) {
        DialogHelper.showOkDialog(context, AppLang.local.please_choose_front);
        return;
      }
      if (_backImg == null || mFarmerLocal.id_proof_photo_back.isEmpty) {
        DialogHelper.showOkDialog(context, AppLang.local.please_choose_back);
        return;
      }
    }

    var formData = FormData.fromMap(
      mFarmerLocal.toUpdate(),
    );

    formData.files.addAll(
      [
        if (_frontImg != null && !_frontImg!.path.contains('https://'))
          MapEntry(
            'id_proof_photo[]',
            MultipartFile.fromFileSync(
              _frontImg!.path,
              contentType:
                  MediaType.parse(lookupMimeType(_frontImg!.path) ?? ''),
            ),
          ),
        if (_backImg != null && !_backImg!.path.contains('https://'))
          MapEntry(
            'id_proof_photo[]',
            MultipartFile.fromFileSync(
              _backImg!.path,
              contentType:
                  MediaType.parse(lookupMimeType(_backImg!.path) ?? ''),
            ),
          ),
        if (_avtFile != null && !_avtFile!.path.contains('https://'))
          MapEntry(
            'farmer_photo[]',
            MultipartFile.fromFileSync(
              _avtFile!.path,
              contentType:
                  MediaType.parse(lookupMimeType(_avtFile!.path) ?? ''),
            ),
          ),
      ],
    );

    if (_isUpdate) {
      return await _onUpdateFarmer(formData);
    }
    await _onInsertFarmer(formData);
  }

  _onInsertFarmer(FormData form) async {
    try {
      DialogHelper.showLoading();
      final res = await ApiFarmer.registerFarmer(form);
      DialogHelper.hideLoading();
      if (res.result == false) {
        DialogHelper.showToast(context,
            res.message ?? AppLang.local.farmer_save_local_successfully);
        return;
      }
      context.read<AppProvider>().updateState(AppEvent.appFarmerDeleteFromLocal,
          argument: widget.farmerLocal.id);
      Navigator.of(context).pop();
      DialogHelper.showToast(context, AppLang.local.create_farmer_successfully);
    } catch (_) {
      DialogHelper.hideLoading();
      _onSaveToLocal();
      Navigator.of(context).pop();
      DialogHelper.showToast(
          context, AppLang.local.farmer_save_local_successfully);
    }
  }

  _onUpdateFarmer(FormData form) async {
    try {
      DialogHelper.showLoading();
      final res = await ApiFarmer.updateFarmer(form);
      DialogHelper.hideLoading();
      if (res.result == false) {
        DialogHelper.showToast(context,
            res.message ?? AppLang.local.farmer_save_local_successfully);
        return;
      }
      context.read<AppProvider>().updateState(AppEvent.appFarmerDeleteFromLocal,
          argument: widget.farmerLocal.id);
      Navigator.of(context).pop(res.data);
      DialogHelper.showToast(context, AppLang.local.update_farmer_successfully);
    } catch (_) {
      DialogHelper.hideLoading();
      _onSaveToLocal();
      Navigator.of(context).pop();
      DialogHelper.showToast(
          context, AppLang.local.farmer_save_local_successfully);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: _isUpdate
              ? AppLang.local.basic_info
              : AppLang.local.farmer_registration,
          actions: _isUpdate
              ? [
                  InkWell(
                    onTap: _onSubmit,
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
                ]
              : null,
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 20,
            ),
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          _buildBasicInfoView(),
                          _buildFarmerInfoView(),
                          _buildContactInfoView(),
                        ],
                      ),
                    ),
                  ),
                ),
                _isUpdate
                    ? const SizedBox.shrink()
                    : Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: AppButton(
                          height: 45,
                          title: _isUpdate
                              ? AppLang.local.save
                              : AppLang.local.submit,
                          onTap: _onSubmit,
                        ),
                      ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  _buildHeaderForm(String title) => Row(
        children: [
          Text(
            title,
            style: TextStyleConstant.robotoW800(
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            width: 10,
          ),
          Expanded(
            child: Container(
              height: 1,
              color: ColorConstant.greyEBEBEB,
            ),
          )
        ],
      );

  Widget _buildIdentityInfo() {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        children: [
          AppFormField(
            hint: AppLang.local.id_number,
            keyboardType: TextInputType.number,
            initialValue: mFarmerLocal.proof_no,
            onChanged: (value) {
              mFarmerLocal.proof_no = value;
            },
          ),
          const SizedBox(
            height: 24,
          ),
          _IdentifyPhotosView(
            key: UniqueKey(),
            frontImg: _frontImg,
            backImg: _backImg,
            onChangedBack: (f) {
              _frontImg = f;
              mFarmerLocal.id_proof_photo_front = f.path;
            },
            onChangedFront: (f) {
              _backImg = f;
              mFarmerLocal.id_proof_photo_back = f.path;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBasicInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(
        children: [
          _buildHeaderForm(AppLang.local.basic_information),
          const SizedBox(
            height: 20,
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: AppLang.local.enrollment_date,
              readOnly: true,
              initialValue: mFarmerLocal.enrollment_date,
              fillColor: ColorConstant.grayDBDBDB,
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: InputDropDownData(
              hintText: AppLang.local.enrollment_place,
              items: _enrollmentPlace.map((e) => e.name!).toList(),
              itemIndex: mFarmerLocal.enrollment_place.isEmpty ||
                      _enrollmentPlace.isEmpty
                  ? null
                  : _enrollmentPlace.indexWhere(
                      (e) => e.name == mFarmerLocal.enrollment_place),
              onChanged: (index) {
                mFarmerLocal.enrollment_place = _enrollmentPlace[index].name!;
              },
            ),
          ),
          mFarmerLocal.farmer_code.isEmpty
              ? const SizedBox.shrink()
              : Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: AppLang.local.farmer_code,
                    readOnly: true,
                    initialValue: mFarmerLocal.farmer_code,
                    fillColor: ColorConstant.grayDBDBDB,
                  ),
                ),
          InputDropDownData(
            hintText: AppLang.local.cooperative,
            items: _cooperatives.map((e) => e.name).toList(),
            itemIndex: indexCooperative(),
            onChanged: (index) {
              mFarmerLocal.cooperative_id = _cooperatives[index].id;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFarmerInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(
        children: [
          _buildHeaderForm(AppLang.local.farmer_information),
          const SizedBox(
            height: 20,
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: AppLang.local.full_name,
              initialValue: mFarmerLocal.full_name,
              validator: (v) {
                if (v == null || v.isEmpty) {
                  return AppLang.local.please_fill_name;
                }
                return null;
              },
              onChanged: (value) {
                mFarmerLocal.full_name = value;
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: AppLang.local.phone_number,
              keyboardType: TextInputType.phone,
              initialValue: mFarmerLocal.phone_number,
              validator: (v) {
                if (v == null || v.isEmpty) {
                  return AppLang.local.please_fill_phone;
                }
                return null;
              },
              onChanged: (value) {
                mFarmerLocal.phone_number = value;
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: InputDropDownData(
              items: _genders.map((e) => e.name!).toList(),
              hintText: AppLang.local.gender,
              itemIndex: initIndex(
                  _genders.map((e) => e.name!).toList(), mFarmerLocal.gender),
              onChanged: (index) {
                mFarmerLocal.gender = _genders[index].name!;
              },
            ),
          ),
          StatefulBuilder(builder: (context, s) {
            return _AvtPhotoView(
              key: UniqueKey(),
              avtFile: _avtFile!,
              onChanged: (f) {
                s(() {
                  _avtFile = f;
                });
              },
            );
          }),
          const SizedBox(
            height: 24,
          ),
          InputDropDownData(
            hintText: AppLang.local.identity_proof,
            items: _identityProofs.map((e) => e.name!).toList(),
            itemIndex: indexIdentityProof(),
            onChanged: (index) {
              mFarmerLocal.identity_proof = _identityProofs[index].name!;
              setState(() {});
            },
          ),
          mFarmerLocal.identity_proof.isEmpty
              ? const SizedBox.shrink()
              : _buildIdentityInfo(),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: InkWell(
              onTap: _selectDate,
              child: IgnorePointer(
                child: AppFormField(
                  controller: _birthDateTxtController,
                  hint: AppLang.local.date_of_birth,
                  readOnly: true,
                  prefixIcon: Padding(
                    padding: const EdgeInsets.only(left: 16, right: 16),
                    child: SvgPicture.asset('ic_calendar'.iconSvg),
                  ),
                ),
              ),
            ),
          ),
          Row(
            children: [
              Text(
                'SRP Certification',
                style: TextStyleConstant.quicksandW600(
                  color: ColorConstant.text79,
                ),
              ),
              Checkbox(
                value: mFarmerLocal.srp_certification == 1,
                activeColor: ColorConstant.primary,
                onChanged: (value) {
                  setState(() {
                    mFarmerLocal.srp_certification = value! ? 1 : 0;
                  });
                },
              )
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContactInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 32, bottom: 32),
      child: Column(
        children: [
          _buildHeaderForm(AppLang.local.contact_information),
          const SizedBox(
            height: 20,
          ),
          InputDropDownData(
            items: _countries.map((e) => e.countryName!).toList(),
            hintText: AppLang.local.country,
            itemIndex: mFarmerLocal.country == 0 || _countries.isEmpty
                ? null
                : _countries.indexWhere(
                    (element) => element.id == mFarmerLocal.country),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.country = _countries[index].id!;
                mFarmerLocal.province = 0;
                mFarmerLocal.district = 0;
                mFarmerLocal.commune = 0;
              });
              _getProvinces();
            },
          ),
          const SizedBox(
            height: 24,
          ),
          InputDropDownData(
            items: _provinces.map((e) => e.provinceName!).toList(),
            hintText: AppLang.local.province,
            itemIndex: mFarmerLocal.province == 0 || _provinces.isEmpty
                ? null
                : _provinces.indexWhere(
                    (element) => element.id == mFarmerLocal.province),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.province = _provinces[index].id!;
                mFarmerLocal.district = 0;
                mFarmerLocal.commune = 0;
              });
              _getDistricts();
            },
          ),
          const SizedBox(
            height: 24,
          ),
          InputDropDownData(
            items: _districts.map((e) => e.districtName!).toList(),
            hintText: AppLang.local.district,
            itemIndex: mFarmerLocal.district == 0 || _districts.isEmpty
                ? null
                : _districts.indexWhere(
                    (element) => element.id == mFarmerLocal.district),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.district = _districts[index].id!;
                mFarmerLocal.commune = 0;
              });
              _getCommune();
            },
          ),
          const SizedBox(
            height: 24,
          ),
          InputDropDownData(
            items: _communes.map((e) => e.communeName!).toList(),
            hintText: AppLang.local.commune,
            itemIndex: mFarmerLocal.commune == 0 || _communes.isEmpty
                ? null
                : _communes.indexWhere(
                    (element) => element.id == mFarmerLocal.commune),
            onChanged: (index) {
              mFarmerLocal.commune = _communes[index].id!;
            },
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.village,
            initialValue: mFarmerLocal.village,
            onChanged: (value) {
              mFarmerLocal.village = value;
            },
          ),
          const SizedBox(
            height: 24,
          ),
          InkWell(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => MapView(
                  latLng: _latLng,
                ),
              ),
            ).then((value) {
              if (value != null) {
                _latLng = value;
                mFarmerLocal.lat = _latLng.latitude.toString();
                mFarmerLocal.lng = _latLng.longitude.toString();
              }
            }),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                GImage.asset(
                  name: 'map'.imgPNG,
                  height: 50,
                  width: 50,
                ),
                const SizedBox(
                  width: 16,
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'You can choose on map',
                        style: TextStyleConstant.worksansW500(
                          color: ColorConstant.text79,
                        ),
                      ),
                    ],
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await DateHelper.showDateDialog(
      context,
      initialDate: _birthDate ?? DateTime.now(),
      lastDate: DateTime.now(),
      firstDate: DateTime(1900, 1),
    );
    if (picked != null && picked != _birthDate) {
      _birthDate = picked;
      _birthDateTxtController.text = DateHelper.convertDateToStr(_birthDate!);
      mFarmerLocal.dob = _birthDateTxtController.text;
    }
  }
}

class _AvtPhotoView extends StatefulWidget {
  const _AvtPhotoView({
    super.key,
    this.onChanged,
    required this.avtFile,
  });

  final XFile avtFile;
  final Function(XFile)? onChanged;

  @override
  State<_AvtPhotoView> createState() => _AvtPhotoViewState();
}

class _AvtPhotoViewState extends State<_AvtPhotoView> {
  late XFile avtFile = widget.avtFile;

  _selectAvtImage() async {
    final file = await CommonHelper.chooseImgOptions(context, imageQuality: 50);
    if (file != null) {
      setState(() {
        avtFile = file;
      });
      widget.onChanged?.call(file);
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: _selectAvtImage,
      child: SizedBox(
        height: 120,
        width: 120,
        child: Stack(
          children: [
            Container(
              height: 120,
              width: 120,
              clipBehavior: Clip.hardEdge,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: ColorConstant.grayF6F7F9,
              ),
              child: imgView(),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                height: 32,
                width: 32,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 3),
                  shape: BoxShape.circle,
                  color: ColorConstant.primary,
                ),
                child: Center(
                  child: SvgPicture.asset(
                    'ic_camera'.iconSvg,
                  ),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget imgView() {
    if (avtFile.path.isEmpty) {
      return Center(
        child: SvgPicture.asset(
          'ic_user_bold'.iconSvg,
        ),
      );
    }
    if (avtFile.path.contains('https://')) {
      return GInternetImage(url: avtFile.path);
    }
    return GImage.file(
      file: File(
        widget.avtFile.path,
      ),
      boxFit: BoxFit.fill,
    );
  }
}

class _IdentifyPhotosView extends StatefulWidget {
  const _IdentifyPhotosView({
    super.key,
    this.backImg,
    this.frontImg,
    this.onChangedBack,
    this.onChangedFront,
  });
  final XFile? backImg;
  final XFile? frontImg;
  final Function(XFile)? onChangedFront;
  final Function(XFile)? onChangedBack;
  @override
  State<_IdentifyPhotosView> createState() => __IdentifyPhotosViewState();
}

class __IdentifyPhotosViewState extends State<_IdentifyPhotosView> {
  XFile? _frontImg;
  XFile? _backImg;

  @override
  void initState() {
    super.initState();
    _frontImg = widget.frontImg;
    _backImg = widget.backImg;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _buildIdPhotoView(
          file: _frontImg,
        ),
        const SizedBox(
          width: 15,
        ),
        _buildIdPhotoView(
          isFront: false,
          file: _backImg,
        )
      ],
    );
  }

  Expanded _buildIdPhotoView({
    bool isFront = true,
    XFile? file,
  }) {
    Widget view = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          isFront ? AppLang.local.id_front : AppLang.local.id_back,
          style: TextStyleConstant.worksansW500(
            color: ColorConstant.gray6C757D,
          ),
        ),
        const SizedBox(
          height: 4,
        ),
        SvgPicture.asset('ic_bold_camera'.iconSvg),
      ],
    );

    if (file != null && file.path.isNotEmpty) {
      if (file.path.contains('https://')) {
        view = GInternetImage(url: file.path);
      } else {
        view = GImage.file(
          file: File(
            file.path,
          ),
        );
      }
    }

    return Expanded(
      child: InkWell(
        onTap: () => _selectIdImage(isFront: isFront),
        child: Container(
          height: 94,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: ColorConstant.grayF6F7F9,
          ),
          clipBehavior: Clip.hardEdge,
          child: view,
        ),
      ),
    );
  }

  _selectIdImage({bool isFront = true}) async {
    final file = await CommonHelper.chooseImgOptions(context);
    if (file != null) {
      setState(() {
        if (isFront) {
          _frontImg = file;
          widget.onChangedFront?.call(file);
        } else {
          _backImg = file;
          widget.onChangedBack?.call(file);
        }
      });
    }
  }
}
