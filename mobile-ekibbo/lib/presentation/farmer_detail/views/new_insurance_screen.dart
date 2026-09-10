import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
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
  // Second review (D): season ('A' | 'B') replaces start/end dates
  String seasonLife = 'A';

  final ctrlHealthProvider = TextEditingController();
  final ctrlHealthAmount = TextEditingController();
  String seasonHealth = 'A';

  final ctrlCropProvider = TextEditingController();
  final ctrlCropAmount = TextEditingController();
  int? _insuredIndex;
  String seasonCrop = 'A';

  final ctrlSocialProvider = TextEditingController();
  String seasonSocial = 'A';

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
        seasonLife = _insurance.lifeSeason ?? 'A';
      }
      if (_insurance.lifeInsuranceEndDate != null &&
          _insurance.lifeInsuranceEndDate != '') {
      }
    }
    if (_insurance.healthInsurance == 'yes') {
      ctrlHealthProvider.text = _insurance.providerHealthInsurance ?? '';
      ctrlHealthAmount.text = '${_insurance.healthInsuranceAmount ?? ''}';
      if (_insurance.healthInsuranceEnrolledDate != null &&
          _insurance.healthInsuranceEnrolledDate != '') {
        seasonHealth = _insurance.healthSeason ?? 'A';
      }
      if (_insurance.healthInsuranceEndDate != null &&
          _insurance.healthInsuranceEndDate != '') {
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
        seasonCrop = _insurance.cropSeason ?? 'A';
      }
      if (_insurance.cropInsuranceEndDate != null &&
          _insurance.cropInsuranceEndDate != '') {
      }
    }
    if (_insurance.socialInsurance == 'yes') {
      ctrlSocialProvider.text = _insurance.providerSocialInsurance ?? '';

      if (_insurance.socialInsuranceEnrolledDate != null &&
          _insurance.socialInsuranceEnrolledDate != '') {
        seasonSocial = _insurance.socialSeason ?? 'A';
      }
      if (_insurance.socialInsuranceEndDate != null &&
          _insurance.socialInsuranceEndDate != '') {
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
      _insurance.lifeSeason = seasonLife;
    }
    if (_insurance.healthInsurance == 'yes') {
      _insurance.providerHealthInsurance = ctrlHealthProvider.text;
      _insurance.healthInsuranceAmount = double.tryParse(ctrlHealthAmount.text);
      _insurance.healthSeason = seasonHealth;
    }
    if (_insurance.cropInsurance == 'yes') {
      _insurance.providerCropInsurance = ctrlCropProvider.text;
      _insurance.noOfAreaInsured = double.tryParse(ctrlCropAmount.text);
      _insurance.cropInsured = _insuredIndex != null
          ? _dataCrop[_insuredIndex!].id.toString()
          : null;
      _insurance.cropSeason = seasonCrop;
    }
    if (_insurance.socialInsurance == 'yes') {
      _insurance.providerSocialInsurance = ctrlSocialProvider.text;
      _insurance.socialSeason = seasonSocial;
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
              labelText: 'Payout Amount', // Second review (D)
              keyboardType: TextInputType.number,
              controller: ctrlLifeAmount,
            ),
          ),
          const SizedBox(
            height: 24,
          ),
          // Second review (D): start/end dates replaced by Season (A/B)
          AppDropdownButton(
            hintText: 'Season',
            items: const ['Season A (Mar-Aug)', 'Season B (Sep-Feb)'],
            itemSelected: seasonLife == 'A' ? 'Season A (Mar-Aug)' : (seasonLife == 'B' ? 'Season B (Sep-Feb)' : null),
            onChanged: (index) {
              setState(() {
                if (index != null) {
                  seasonLife = index == 0 ? 'A' : 'B';
                }
              });
            },
          ),
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
              labelText: 'Payout Amount', // Second review (D)
              keyboardType: TextInputType.number,
              controller: ctrlHealthAmount,
            ),
          ),
          const SizedBox(
            height: 24,
          ),
          // Second review (D): start/end dates replaced by Season (A/B)
          AppDropdownButton(
            hintText: 'Season',
            items: const ['Season A (Mar-Aug)', 'Season B (Sep-Feb)'],
            itemSelected: seasonHealth == 'A' ? 'Season A (Mar-Aug)' : (seasonHealth == 'B' ? 'Season B (Sep-Feb)' : null),
            onChanged: (index) {
              setState(() {
                if (index != null) {
                  seasonHealth = index == 0 ? 'A' : 'B';
                }
              });
            },
          ),
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
          // Second review (D): start/end dates replaced by Season (A/B)
          AppDropdownButton(
            hintText: 'Season',
            items: const ['Season A (Mar-Aug)', 'Season B (Sep-Feb)'],
            itemSelected: seasonSocial == 'A' ? 'Season A (Mar-Aug)' : (seasonSocial == 'B' ? 'Season B (Sep-Feb)' : null),
            onChanged: (index) {
              setState(() {
                if (index != null) {
                  seasonSocial = index == 0 ? 'A' : 'B';
                }
              });
            },
          ),
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
          // Second review (D): start/end dates replaced by Season (A/B)
          AppDropdownButton(
            hintText: 'Season',
            items: const ['Season A (Mar-Aug)', 'Season B (Sep-Feb)'],
            itemSelected: seasonCrop == 'A' ? 'Season A (Mar-Aug)' : (seasonCrop == 'B' ? 'Season B (Sep-Feb)' : null),
            onChanged: (index) {
              setState(() {
                if (index != null) {
                  seasonCrop = index == 0 ? 'A' : 'B';
                }
              });
            },
          ),
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
