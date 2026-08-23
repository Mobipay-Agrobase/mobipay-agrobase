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
import 'package:agrobase_ekibbo/infrastructure/local_data/ota_cache_service.dart';
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
import 'package:agrobase_ekibbo/models/farmer_local/farmer_local_model.dart';
import 'package:agrobase_ekibbo/models/location/commune/commune_model.dart';
import 'package:agrobase_ekibbo/models/location/village/village_model.dart';
import 'package:agrobase_ekibbo/models/location/district/district_model.dart';

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
  // Web-platform aligned dropdowns — sourced from OTA cache (CatalogMaster)
  List<String> _gendersList = [];
  List<String> _educationLevels = [];
  List<String> _maritalStatuses = [];
  List<String> _idTypes = [];
  List<String> _enrollmentPlaces = [];
  List<String> _certTypes = [];
  List<String> _housingOwnerships = [];
  List<String> _houseTypes = [];

  // 7-level location cascade from the web Location Master:
  // Region → SubRegion → District → County → SubCounty → Parish → Village
  List<Map<String, dynamic>> _regions = [];
  List<Map<String, dynamic>> _subRegions = [];
  List<DistrictModel> _districts = [];
  List<Map<String, dynamic>> _counties = [];
  List<CommuneModel> _communes = [];
  List<Map<String, dynamic>> _parishes = [];
  List<VillageModel> _villages = [];
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
    await _getRegions();
    await _getDistrictsMaster();
    await _getCooperatives();
    if (mFarmerLocal.commune != 0) await _getCommune();
    if (mFarmerLocal.parish != 0) await _getVillages(mFarmerLocal.parish);
  }

  Future<void> _getDropdownData() async {
    // OTA catalog cache — same CatalogMaster rows as the web platform.
    final ota = OtaCacheService.instance;
    // refresh in background (OTA update) but render from cache immediately
    ota.refreshCatalog().then((_) {
      if (mounted) setState(() => _fillCatalogLists());
    });
    _fillCatalogLists();
  }

  void _fillCatalogLists() {
    final ota = OtaCacheService.instance;
    _gendersList = ota.categoryValues('gender');
    _educationLevels = ota.categoryValues('education_level');
    _maritalStatuses = ota.categoryValues('marital_status');
    _idTypes = ota.categoryValues('national_id_type');
    _enrollmentPlaces = ota.categoryValues('enrollment_place');
    _certTypes = ota.categoryValues('certification_type');
    _housingOwnerships = ota.categoryValues('housing_ownership');
    _houseTypes = ota.categoryValues('house_type');
    setState(() {});
  }

  _getCooperatives() async {
    _cooperatives = await ApiAddress.getCooperatives();
    if (_cooperatives.isNotEmpty) {
      setState(() {});
    }
  }

  /// Top-level regions from the web Location Master.
  _getRegions() async {
    _regions = await ApiAddress.getRegions();
    if (_regions.isNotEmpty) setState(() {});
  }

  /// Sub-regions under the selected region.
  _getSubRegions() async {
    if (mFarmerLocal.region == 0) return;
    _subRegions = await ApiAddress.getChildren('sub-region', mFarmerLocal.region);
    setState(() {});
  }

  /// Counties under the selected district.
  _getCounties() async {
    if (mFarmerLocal.district == 0) return;
    _counties = await ApiAddress.getChildren('county', mFarmerLocal.district);
    setState(() {});
  }

  /// Parishes under the selected sub-county.
  _getParishes() async {
    if (mFarmerLocal.commune == 0) return;
    _parishes = await ApiAddress.getChildren('parish', mFarmerLocal.commune);
    setState(() {});
  }

  /// All districts from the web Location Master.
  _getDistrictsMaster() async {
    _districts = await ApiAddress.getAllDistrictsMaster();
    if (_districts.isNotEmpty) {
      setState(() {});
    }
  }

  /// Sub-counties under the selected district (web Location Master).
  _getCommune() async {
    if (_districts.isEmpty) return;
    _communes = await ApiAddress.getCommunes(mFarmerLocal.district);
    if (_communes.isNotEmpty) {
      setState(() {});
    }
  }

  /// Villages under the selected parish (web Location Master).
  _getVillages(int parishId) async {
    _villages = await ApiAddress.getVillages(parishId);
    setState(() {});
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
    if (mFarmerLocal.region == 0 ||
        mFarmerLocal.district == 0 ||
        mFarmerLocal.commune == 0 ||
        mFarmerLocal.village.isEmpty) {
      DialogHelper.showOkDialog(
          context,
          'Please select the full location: Region, District, Sub County and Village ( Parish completes the chain)');
      return;
    }
    if (mFarmerLocal.farmer_registration_under.isEmpty) {
      DialogHelper.showOkDialog(
          context, 'Please select Farmer Registration Under (Agri/Aqua)');
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
          _buildHeaderForm('Enrollment'),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: 'Enrollment Date',
              readOnly: true,
              initialValue: mFarmerLocal.enrollment_date,
              fillColor: ColorConstant.grayDBDBDB,
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: InputDropDownData(
              hintText: 'Enrollment Place',
              items: _enrollmentPlaces,
              itemIndex: mFarmerLocal.enrollment_place.isEmpty || _enrollmentPlaces.isEmpty
                  ? null
                  : _enrollmentPlaces.indexOf(mFarmerLocal.enrollment_place) == -1
                      ? null
                      : _enrollmentPlaces.indexOf(mFarmerLocal.enrollment_place),
              onChanged: (index) {
                mFarmerLocal.enrollment_place = _enrollmentPlaces[index];
              },
            ),
          ),
          mFarmerLocal.farmer_code.isEmpty
              ? const SizedBox.shrink()
              : Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: AppFormField(
                    hint: 'Farmer Code (auto: e.g. MN0001L)',
                    readOnly: true,
                    initialValue: mFarmerLocal.farmer_code,
                    fillColor: ColorConstant.grayDBDBDB,
                  ),
                ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: InputDropDownData(
              hintText: 'Farmer Group *',
              items: _cooperatives.map((e) => e.name).toList(),
              itemIndex: indexCooperative(),
              onChanged: (index) {
                mFarmerLocal.cooperative_id = _cooperatives[index].id;
              },
            ),
          ),
          // ── Is Certified Farmer (YES/NO) — web parity ──
          StatefulBuilder(builder: (context, s) {
            return Column(children: [
              InputDropDownData(
                hintText: 'Is Certified Farmer',
                items: const ['NO', 'YES'],
                itemIndex: mFarmerLocal.is_certified == 'true' ? 1 : 0,
                onChanged: (index) {
                  s(() {
                    mFarmerLocal.is_certified = index == 1 ? 'true' : 'false';
                  });
                },
              ),
              if (mFarmerLocal.is_certified == 'true') ...[
                const SizedBox(height: 16),
                InputDropDownData(
                  hintText: 'Certification Type',
                  items: _certTypes,
                  itemIndex: mFarmerLocal.certification_type.isEmpty
                      ? null
                      : _certTypes.indexOf(mFarmerLocal.certification_type),
                  onChanged: (index) {
                    s(() {
                      mFarmerLocal.certification_type = _certTypes[index];
                    });
                  },
                ),
                const SizedBox(height: 16),
                AppFormField(
                  hint: 'Year of ICS',
                  keyboardType: TextInputType.number,
                  initialValue: mFarmerLocal.ics_year,
                  onChanged: (value) {
                    mFarmerLocal.ics_year = value;
                  },
                ),
              ],
              const SizedBox(height: 24),
            ]);
          }),
          // ── Farmer Registration Under (Agri / Aqua) — web parity ──
          InputDropDownData(
            hintText: 'Farmer Registration Under *',
            items: const ['Agri', 'Aqua'],
            itemIndex: mFarmerLocal.farmer_registration_under.isEmpty
                ? null
                : ['Agri', 'Aqua'].indexOf(mFarmerLocal.farmer_registration_under),
            onChanged: (index) {
              mFarmerLocal.farmer_registration_under = index == 0 ? 'Agri' : 'Aqua';
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
          _buildHeaderForm('Personal Information'),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: 'First Name *',
              initialValue: mFarmerLocal.first_name,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Please fill first name';
                return null;
              },
              onChanged: (value) {
                mFarmerLocal.first_name = value;
                _syncFullName();
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: 'Last Name *',
              initialValue: mFarmerLocal.last_name,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Please fill last name';
                return null;
              },
              onChanged: (value) {
                mFarmerLocal.last_name = value;
                _syncFullName();
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: 'Contact Number *',
              keyboardType: TextInputType.phone,
              initialValue: mFarmerLocal.phone_number,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Please fill phone number';
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
              items: _gendersList,
              hintText: 'Gender',
              itemIndex: mFarmerLocal.gender.isEmpty ? null : _gendersList.indexOf(mFarmerLocal.gender),
              onChanged: (index) {
                mFarmerLocal.gender = _gendersList[index];
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: 'Date of Birth',
              readOnly: true,
              controller: _birthDateTxtController,
              onTap: () async {
                final now = DateTime.now();
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _birthDate ?? DateTime(now.year - 30),
                  firstDate: DateTime(1930),
                  lastDate: now,
                );
                if (picked != null) {
                  setState(() {
                    _birthDate = picked;
                    _birthDateTxtController.text =
                        DateHelper.convertDateToStr(picked, format: 'yyyy-MM-dd');
                    mFarmerLocal.dob = _birthDateTxtController.text;
                  });
                }
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: InputDropDownData(
              items: _educationLevels,
              hintText: 'Education',
              itemIndex: mFarmerLocal.education.isEmpty ? null : _educationLevels.indexOf(mFarmerLocal.education),
              onChanged: (index) {
                mFarmerLocal.education = _educationLevels[index];
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: InputDropDownData(
              items: _maritalStatuses,
              hintText: 'Marital Status',
              itemIndex: mFarmerLocal.marital_status.isEmpty ? null : _maritalStatuses.indexOf(mFarmerLocal.marital_status),
              onChanged: (index) {
                mFarmerLocal.marital_status = _maritalStatuses[index];
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: 'Guardian / Parent Name',
              initialValue: mFarmerLocal.spouse_name_guardian,
              onChanged: (value) {
                mFarmerLocal.spouse_name_guardian = value;
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: AppFormField(
              hint: 'Email (optional)',
              keyboardType: TextInputType.emailAddress,
              initialValue: mFarmerLocal.email,
              onChanged: (value) {
                mFarmerLocal.email = value;
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
          const SizedBox(height: 24),
          InputDropDownData(
            hintText: 'National ID Type',
            items: _idTypes,
            itemIndex: mFarmerLocal.identity_proof.isEmpty ? null : _idTypes.indexOf(mFarmerLocal.identity_proof),
            onChanged: (index) {
              mFarmerLocal.identity_proof = _idTypes[index];
            },
          ),
          if (mFarmerLocal.identity_proof.isNotEmpty) _buildIdentityInfo(),
        ],
      ),
    );
  }

  void _syncFullName() {
    mFarmerLocal.full_name =
        '${mFarmerLocal.first_name} ${mFarmerLocal.last_name}'.trim();
  }

  Widget _buildContactInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 32, bottom: 32),
      child: Column(
        children: [
          _buildHeaderForm('Contact Information'),
          const SizedBox(height: 20),
          // ── 7-level location cascade — SAME hierarchy as the web
          //    Location Master: Region → SubRegion → District → County →
          //    SubCounty → Parish → Village (drives MN0001L farmer codes) ──
          InputDropDownData(
            items: _regions.map((e) => e['name'] as String).toList(),
            hintText: 'Region *',
            itemIndex: mFarmerLocal.region == 0 || _regions.isEmpty
                ? null
                : _regions.indexWhere((e) => e['id'] == mFarmerLocal.region),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.region = _regions[index]['id'] as int;
                mFarmerLocal.region_name = _regions[index]['name'] as String;
                mFarmerLocal.sub_region = 0;
                mFarmerLocal.sub_region_name = '';
                mFarmerLocal.district = 0;
                mFarmerLocal.district_name = '';
                mFarmerLocal.county = 0;
                mFarmerLocal.county_name = '';
                mFarmerLocal.commune = 0;
                mFarmerLocal.commune_name = '';
                mFarmerLocal.parish = 0;
                mFarmerLocal.parish_name = '';
                mFarmerLocal.village = '';
                _subRegions = [];
                _districts = [];
                _counties = [];
                _communes = [];
                _parishes = [];
                _villages = [];
              });
              _getSubRegions();
            },
          ),
          const SizedBox(height: 24),
          InputDropDownData(
            items: _subRegions.map((e) => e['name'] as String).toList(),
            hintText: 'Sub Region *',
            itemIndex: mFarmerLocal.sub_region == 0 || _subRegions.isEmpty
                ? null
                : _subRegions.indexWhere((e) => e['id'] == mFarmerLocal.sub_region),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.sub_region = _subRegions[index]['id'] as int;
                mFarmerLocal.sub_region_name = _subRegions[index]['name'] as String;
                mFarmerLocal.district = 0;
                mFarmerLocal.district_name = '';
                mFarmerLocal.county = 0;
                mFarmerLocal.county_name = '';
                mFarmerLocal.commune = 0;
                mFarmerLocal.commune_name = '';
                mFarmerLocal.parish = 0;
                mFarmerLocal.parish_name = '';
                mFarmerLocal.village = '';
                _districts = [];
                _counties = [];
                _communes = [];
                _parishes = [];
                _villages = [];
              });
              _getDistricts();
            },
          ),
          const SizedBox(height: 24),
          InputDropDownData(
            items: _districts.map((e) => e.districtName!).toList(),
            hintText: 'District *',
            itemIndex: mFarmerLocal.district == 0 || _districts.isEmpty
                ? null
                : _districts.indexWhere((element) => element.id == mFarmerLocal.district),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.district = _districts[index].id!;
                mFarmerLocal.district_name = _districts[index].districtName ?? '';
                mFarmerLocal.county = 0;
                mFarmerLocal.county_name = '';
                mFarmerLocal.commune = 0;
                mFarmerLocal.commune_name = '';
                mFarmerLocal.parish = 0;
                mFarmerLocal.parish_name = '';
                mFarmerLocal.village = '';
                _counties = [];
                _communes = [];
                _parishes = [];
                _villages = [];
              });
              _getCounties();
            },
          ),
          const SizedBox(height: 24),
          InputDropDownData(
            items: _counties.map((e) => e['name'] as String).toList(),
            hintText: 'County *',
            itemIndex: mFarmerLocal.county == 0 || _counties.isEmpty
                ? null
                : _counties.indexWhere((e) => e['id'] == mFarmerLocal.county),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.county = _counties[index]['id'] as int;
                mFarmerLocal.county_name = _counties[index]['name'] as String;
                mFarmerLocal.commune = 0;
                mFarmerLocal.commune_name = '';
                mFarmerLocal.parish = 0;
                mFarmerLocal.parish_name = '';
                mFarmerLocal.village = '';
                _communes = [];
                _parishes = [];
                _villages = [];
              });
              _getCommune();
            },
          ),
          const SizedBox(height: 24),
          InputDropDownData(
            items: _communes.map((e) => e.communeName!).toList(),
            hintText: 'Sub County *',
            itemIndex: mFarmerLocal.commune == 0 || _communes.isEmpty
                ? null
                : _communes.indexWhere((element) => element.id == mFarmerLocal.commune),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.commune = _communes[index].id!;
                mFarmerLocal.commune_name = _communes[index].communeName ?? '';
                mFarmerLocal.parish = 0;
                mFarmerLocal.parish_name = '';
                mFarmerLocal.village = '';
                _parishes = [];
                _villages = [];
              });
              _getParishes();
            },
          ),
          const SizedBox(height: 24),
          InputDropDownData(
            items: _parishes.map((e) => e['name'] as String).toList(),
            hintText: 'Parish *',
            itemIndex: mFarmerLocal.parish == 0 || _parishes.isEmpty
                ? null
                : _parishes.indexWhere((e) => e['id'] == mFarmerLocal.parish),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.parish = _parishes[index]['id'] as int;
                mFarmerLocal.parish_name = _parishes[index]['name'] as String;
                mFarmerLocal.village = '';
                _villages = [];
              });
              _getVillages(mFarmerLocal.parish);
            },
          ),
          const SizedBox(height: 24),
          InputDropDownData(
            items: _villages.map((e) => e.villageName ?? '').toList(),
            hintText: 'Village *',
            itemIndex: mFarmerLocal.village.isEmpty || _villages.isEmpty
                ? null
                : _villages.indexWhere((element) => element.villageName == mFarmerLocal.village),
            onChanged: (index) {
              setState(() {
                mFarmerLocal.village = _villages[index].villageName ?? '';
              });
            },
          ),
          const SizedBox(height: 24),
          // Family Information — web parity
          AppFormField(
            hint: 'Spouse Name',
            initialValue: mFarmerLocal.spouse_name,
            onChanged: (value) {
              mFarmerLocal.spouse_name = value;
            },
          ),
          const SizedBox(height: 24),
          AppFormField(
            hint: 'No of Family Members',
            keyboardType: TextInputType.number,
            initialValue: mFarmerLocal.family_members,
            onChanged: (value) {
              mFarmerLocal.family_members = value;
            },
          ),
          const SizedBox(height: 24),
          AppFormField(
            hint: 'Total Children below 18',
            keyboardType: TextInputType.number,
            initialValue: mFarmerLocal.children_under_18,
            onChanged: (value) {
              mFarmerLocal.children_under_18 = value;
            },
          ),
          const SizedBox(height: 24),
          AppFormField(
            hint: 'Total School Going Children',
            keyboardType: TextInputType.number,
            initialValue: mFarmerLocal.school_going_children,
            onChanged: (value) {
              mFarmerLocal.school_going_children = value;
            },
          ),
          const SizedBox(height: 24),
          // Asset Information — web parity
          InputDropDownData(
            items: _housingOwnerships,
            hintText: 'Housing Ownership',
            itemIndex: mFarmerLocal.housing_ownership.isEmpty ? null : _housingOwnerships.indexOf(mFarmerLocal.housing_ownership),
            onChanged: (index) {
              mFarmerLocal.housing_ownership = _housingOwnerships[index];
            },
          ),
          const SizedBox(height: 24),
          InputDropDownData(
            items: _houseTypes,
            hintText: 'House Type',
            itemIndex: mFarmerLocal.house_type.isEmpty ? null : _houseTypes.indexOf(mFarmerLocal.house_type),
            onChanged: (index) {
              mFarmerLocal.house_type = _houseTypes[index];
            },
          ),
          const SizedBox(height: 24),
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
