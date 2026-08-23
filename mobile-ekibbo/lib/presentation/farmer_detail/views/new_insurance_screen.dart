import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/date_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/insurance/insurance_info_response.dart';

class NewInsuranceScreen extends StatefulWidget {
  const NewInsuranceScreen({
    super.key,
    this.dataCrop,
    this.insurance,
  });
  final InsuranceInfoModel? insurance;
  final List<DropdownMasterModel>? dataCrop;
  @override
  State<NewInsuranceScreen> createState() => _NewInsuranceScreenState();
}

class _NewInsuranceScreenState extends State<NewInsuranceScreen> {
  late InsuranceInfoModel _insurance;
  final ctrlLifeProvider = TextEditingController();
  final ctrlLifeAmount = TextEditingController();
  String dateLifeEnroll = DateHelper.convertDateToStr(DateTime.now());
  String dateLifeEnd = DateHelper.convertDateToStr(DateTime.now());

  final ctrlHealthProvider = TextEditingController();
  final ctrlHealthAmount = TextEditingController();
  String dateHealthEnroll = DateHelper.convertDateToStr(DateTime.now());
  String dateHealthEnd = DateHelper.convertDateToStr(DateTime.now());

  final ctrlCropProvider = TextEditingController();
  final ctrlCropAmount = TextEditingController();
  int? _insuredIndex;
  String dateCropEnroll = DateHelper.convertDateToStr(DateTime.now());
  String dateCropEnd = DateHelper.convertDateToStr(DateTime.now());

  final ctrlSocialProvider = TextEditingController();
  String dateSocialEnroll = DateHelper.convertDateToStr(DateTime.now());
  String dateSocialEnd = DateHelper.convertDateToStr(DateTime.now());

  final _otherProviderTxtCtrler = TextEditingController();

  List<DropdownMasterModel> _dataCrop = [];

  @override
  void initState() {
    _dataCrop = widget.dataCrop ?? [];
    if (widget.insurance != null) {
      _insurance = widget.insurance!;
      _setData();
    } else {
      _insurance = InsuranceInfoModel();
    }
    super.initState();
  }

  @override
  dispose() {
    ctrlLifeProvider.dispose();
    ctrlLifeAmount.dispose();
    ctrlHealthProvider.dispose();
    ctrlHealthAmount.dispose();
    ctrlCropProvider.dispose();
    ctrlCropAmount.dispose();
    ctrlSocialProvider.dispose();
    _otherProviderTxtCtrler.dispose();
    super.dispose();
  }

  _setData() {
    if (_insurance.lifeInsurance == 'yes') {
      ctrlLifeProvider.text = _insurance.providerLifeInsurance ?? '';
      ctrlLifeAmount.text = '${_insurance.lifeInsuranceAmount ?? ''}';
      if (_insurance.lifeInsuranceEnrolledDate != null &&
          _insurance.lifeInsuranceEnrolledDate != '') {
        dateLifeEnroll = _insurance.lifeInsuranceEnrolledDate!;
      }
      if (_insurance.lifeInsuranceEndDate != null &&
          _insurance.lifeInsuranceEndDate != '') {
        dateLifeEnd = _insurance.lifeInsuranceEndDate!;
      }
    }
    if (_insurance.healthInsurance == 'yes') {
      ctrlHealthProvider.text = _insurance.providerHealthInsurance ?? '';
      ctrlHealthAmount.text = '${_insurance.healthInsuranceAmount ?? ''}';
      if (_insurance.healthInsuranceEnrolledDate != null &&
          _insurance.healthInsuranceEnrolledDate != '') {
        dateHealthEnroll = _insurance.healthInsuranceEnrolledDate!;
      }
      if (_insurance.healthInsuranceEndDate != null &&
          _insurance.healthInsuranceEndDate != '') {
        dateHealthEnd = _insurance.healthInsuranceEndDate!;
      }
    }
    if (_insurance.cropInsurance == 'yes') {
      ctrlCropProvider.text = _insurance.providerCropInsurance ?? '';
      ctrlCropAmount.text = '${_insurance.noOfAreaInsured ?? ''}';
      _insuredIndex = _dataCrop.getIndex((p0) =>
          p0.id ==
          int.tryParse(_insurance.cropInsured?.split(',').first ?? ''));
      if (_insurance.cropInsuranceEnrolledDate != null &&
          _insurance.cropInsuranceEnrolledDate != '') {
        dateCropEnroll = _insurance.cropInsuranceEnrolledDate!;
      }
      if (_insurance.cropInsuranceEndDate != null &&
          _insurance.cropInsuranceEndDate != '') {
        dateCropEnd = _insurance.cropInsuranceEndDate!;
      }
    }
    if (_insurance.socialInsurance == 'yes') {
      ctrlSocialProvider.text = _insurance.providerSocialInsurance ?? '';

      if (_insurance.socialInsuranceEnrolledDate != null &&
          _insurance.socialInsuranceEnrolledDate != '') {
        dateSocialEnroll = _insurance.socialInsuranceEnrolledDate!;
      }
      if (_insurance.socialInsuranceEndDate != null &&
          _insurance.socialInsuranceEndDate != '') {
        dateSocialEnd = _insurance.socialInsuranceEndDate!;
      }
    }
    if (_insurance.otherInsurance != null && _insurance.otherInsurance != '') {
      _otherProviderTxtCtrler.text = _insurance.otherInsurance ?? '';
    }
  }

  _onSave() {
    if (_insurance.lifeInsurance == 'yes') {
      _insurance.providerLifeInsurance = ctrlLifeProvider.text;
      _insurance.lifeInsuranceAmount = double.tryParse(ctrlLifeAmount.text);
      _insurance.lifeInsuranceEnrolledDate = dateLifeEnroll;
      _insurance.lifeInsuranceEndDate = dateLifeEnd;
    }
    if (_insurance.healthInsurance == 'yes') {
      _insurance.providerHealthInsurance = ctrlHealthProvider.text;
      _insurance.healthInsuranceAmount = double.tryParse(ctrlHealthAmount.text);
      _insurance.healthInsuranceEnrolledDate = dateHealthEnroll;
      _insurance.healthInsuranceEndDate = dateHealthEnd;
    }
    if (_insurance.cropInsurance == 'yes') {
      _insurance.providerCropInsurance = ctrlCropProvider.text;
      _insurance.noOfAreaInsured = double.tryParse(ctrlCropAmount.text);
      _insurance.cropInsured = _insuredIndex != null
          ? _dataCrop[_insuredIndex!].id.toString()
          : null;
      _insurance.cropInsuranceEnrolledDate = dateCropEnroll;
      _insurance.cropInsuranceEndDate = dateCropEnd;
    }
    if (_insurance.socialInsurance == 'yes') {
      _insurance.providerSocialInsurance = ctrlSocialProvider.text;
      _insurance.socialInsuranceEnrolledDate = dateSocialEnroll;
      _insurance.socialInsuranceEndDate = dateSocialEnd;
    }
    _insurance.otherInsurance = _otherProviderTxtCtrler.text;
    print(_insurance.toJson());
    Navigator.of(context).pop(_insurance);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: AppLang.local.insurance_info,
          actions: [
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
                _buildSwitchInsurance(
                  AppLang.local.life_insurance,
                  value: _insurance.lifeInsurance == 'yes',
                  onChanged: (v) {
                    setState(() {
                      _insurance.lifeInsurance = v ? 'yes' : 'no';
                    });
                  },
                ),
                if (_insurance.lifeInsurance == 'yes') _buildInfoLifeView(),
                Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(vertical: 24),
                  color: ColorConstant.greyEBEBEB,
                ),
                _buildSwitchInsurance(
                  AppLang.local.health_insurance,
                  value: _insurance.healthInsurance == 'yes',
                  onChanged: (v) {
                    setState(() {
                      _insurance.healthInsurance = v ? 'yes' : 'no';
                    });
                  },
                ),
                if (_insurance.healthInsurance == 'yes') _buildInfoHealthView(),
                Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(vertical: 24),
                  color: ColorConstant.greyEBEBEB,
                ),
                _buildSwitchInsurance(
                  AppLang.local.crop_insurance,
                  value: _insurance.cropInsurance == 'yes',
                  onChanged: (v) {
                    setState(() {
                      _insurance.cropInsurance = v ? 'yes' : 'no';
                    });
                  },
                ),
                if (_insurance.cropInsurance == 'yes')
                  _buildCropInfoInsuranceView(),
                Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(vertical: 24),
                  color: ColorConstant.greyEBEBEB,
                ),
                _buildSwitchInsurance(
                  AppLang.local.social_insurance,
                  value: _insurance.socialInsurance == 'yes',
                  onChanged: (v) {
                    setState(() {
                      _insurance.socialInsurance = v ? 'yes' : 'no';
                    });
                  },
                ),
                if (_insurance.socialInsurance == 'yes') _buildInfoSocialView(),
                Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(vertical: 24),
                  color: ColorConstant.greyEBEBEB,
                ),
                AppFormField(
                  labelText: AppLang.local.other_insurance,
                  controller: _otherProviderTxtCtrler,
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoLifeView() {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        children: [
          AppFormField(
            labelText: AppLang.local.provider,
            controller: ctrlLifeProvider,
          ),
          Padding(
            padding: const EdgeInsets.only(top: 24),
            child: AppFormField(
              labelText: AppLang.local.insurance_amount,
              keyboardType: TextInputType.number,
              controller: ctrlLifeAmount,
            ),
          ),
          const SizedBox(
            height: 24,
          ),
          DateFormField(
            initialDate: dateLifeEnroll.isEmpty
                ? DateTime.now()
                : DateHelper.convertStrToDate(dateLifeEnroll),
            hint: AppLang.local.enrollment_date,
            onChanged: (date) {
              dateLifeEnroll = DateHelper.convertDateToStr(date);
            },
          ),
          const SizedBox(
            height: 24,
          ),
          DateFormField(
            initialDate: dateLifeEnd.isEmpty
                ? DateTime.now()
                : DateHelper.convertStrToDate(dateLifeEnd),
            hint: AppLang.local.end_date,
            onChanged: (date) {
              dateLifeEnd = DateHelper.convertDateToStr(date);
            },
          )
        ],
      ),
    );
  }

  Widget _buildInfoHealthView() {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        children: [
          AppFormField(
            labelText: AppLang.local.provider,
            controller: ctrlHealthProvider,
          ),
          Padding(
            padding: const EdgeInsets.only(top: 24),
            child: AppFormField(
              labelText: AppLang.local.insurance_amount,
              keyboardType: TextInputType.number,
              controller: ctrlHealthAmount,
            ),
          ),
          const SizedBox(
            height: 24,
          ),
          DateFormField(
            initialDate: dateHealthEnroll.isEmpty
                ? DateTime.now()
                : DateHelper.convertStrToDate(dateHealthEnroll),
            hint: AppLang.local.enrollment_date,
            onChanged: (date) {
              dateHealthEnroll = DateHelper.convertDateToStr(date);
            },
          ),
          const SizedBox(
            height: 24,
          ),
          DateFormField(
            initialDate: dateHealthEnd.isEmpty
                ? DateTime.now()
                : DateHelper.convertStrToDate(dateHealthEnd),
            hint: AppLang.local.end_date,
            onChanged: (date) {
              dateHealthEnd = DateHelper.convertDateToStr(date);
            },
          )
        ],
      ),
    );
  }

  Widget _buildInfoSocialView() {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        children: [
          AppFormField(
            labelText: AppLang.local.provider,
            controller: ctrlSocialProvider,
          ),
          const SizedBox(
            height: 24,
          ),
          DateFormField(
            initialDate: dateSocialEnroll.isEmpty
                ? DateTime.now()
                : DateHelper.convertStrToDate(dateSocialEnroll),
            hint: AppLang.local.enrollment_date,
            onChanged: (date) {
              dateSocialEnroll = DateHelper.convertDateToStr(date);
            },
          ),
          const SizedBox(
            height: 24,
          ),
          DateFormField(
            initialDate: dateSocialEnd.isEmpty
                ? DateTime.now()
                : DateHelper.convertStrToDate(dateSocialEnd),
            hint: AppLang.local.end_date,
            onChanged: (date) {
              dateSocialEnd = DateHelper.convertDateToStr(date);
            },
          )
        ],
      ),
    );
  }

  Widget _buildCropInfoInsuranceView() {
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        children: [
          AppFormField(
            hint: AppLang.local.provider,
            controller: ctrlCropProvider,
          ),
          const SizedBox(
            height: 24,
          ),
          AppDropdownButton(
            hintText: AppLang.local.crop_insured,
            items: _dataCrop.map((e) => e.name!).toList(),
            itemSelected:
                _insuredIndex != null ? _dataCrop[_insuredIndex!].name : null,
            onChanged: (v) {
              setState(() {
                _insuredIndex = v;
              });
            },
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            labelText: AppLang.local.no_of_area_insured,
            keyboardType: TextInputType.number,
            controller: ctrlCropAmount,
          ),
          const SizedBox(
            height: 24,
          ),
          DateFormField(
            initialDate: dateCropEnroll.isEmpty
                ? DateTime.now()
                : DateHelper.convertStrToDate(dateCropEnroll),
            hint: AppLang.local.enrollment_date,
            onChanged: (date) {
              dateCropEnroll = DateHelper.convertDateToStr(date);
            },
          ),
          const SizedBox(
            height: 24,
          ),
          DateFormField(
            initialDate: dateCropEnd.isEmpty
                ? DateTime.now()
                : DateHelper.convertStrToDate(dateCropEnd),
            hint: AppLang.local.end_date,
            onChanged: (date) {
              dateCropEnd = DateHelper.convertDateToStr(date);
            },
          )
        ],
      ),
    );
  }

  Row _buildSwitchInsurance(
    String title, {
    bool value = false,
    Function(bool)? onChanged,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: TextStyleConstant.quicksandW600(
            color: ColorConstant.text79,
          ),
        ),
        CupertinoSwitch(
          value: value,
          onChanged: onChanged,
        )
      ],
    );
  }
}
