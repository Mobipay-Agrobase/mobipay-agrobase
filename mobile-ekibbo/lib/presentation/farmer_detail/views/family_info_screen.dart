// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/family_info/family_info_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class FamilyInfoScreen extends StatefulWidget {
  const FamilyInfoScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<FamilyInfoScreen> createState() => _FamilyInfoScreenState();
}

class _FamilyInfoScreenState extends State<FamilyInfoScreen> {
  List<DropdownDataModel> _educations = [];
  List<DropdownDataModel> _marriages = [];
  int? _educationIndex;
  int? _marriageIndex;
  FamilyInfoModel? _familyInfo;
  final _parentTxtController = TextEditingController();
  final _spouseTxtController = TextEditingController();
  final _memberTxtController = TextEditingController();
  final _numBoyTxtController = TextEditingController();
  final _numGirlTxtController = TextEditingController();
  final _numGoSchoolTxtController = TextEditingController();
  @override
  void initState() {
    super.initState();
    _getFamilyInfo();
  }

  _onSave() async {
    DialogHelper.showLoading();
    final data = {
      "data_family": {
        "education":
            _educationIndex != null ? _educations[_educationIndex!].name : null,
        "marial_status":
            _marriageIndex != null ? _marriages[_marriageIndex!].name : null,
        "parent_name": _parentTxtController.text,
        "spouse_name": _spouseTxtController.text,
        "no_of_family": _memberTxtController.text,
        "total_child_under_18": {
          "male": _numBoyTxtController.text,
          "female": _numGirlTxtController.text,
        },
        "total_child_under_18_going_school": _numGoSchoolTxtController.text,
        "staff_lat": DataConstant.lat,
        "staff_lng": DataConstant.lat,
      }
    };
    try {
      final res = await ApiProvider.instance.apiFarmer
          .updateFamilyInfo(widget.farmerId, data);
      DialogHelper.hideLoading();
      if (res?.result == true) {
        Navigator.of(context).pop(true);
        DialogHelper.showToast(
            context, AppLang.local.update_family_info_success);
      }
    } catch (_) {}
  }

  _getFamilyInfo() async {
    final res =
        await ApiProvider.instance.apiFarmer.getFamilyInfo(widget.farmerId);
    if (!mounted) return; // async gap — user may have left the tab
    if (res?.data != null) {
      setState(() {
        _educations = res!.data!.dataEducation ?? [];
        _marriages = res.data!.dataMarialStatus ?? [];
        _familyInfo = res.data!.familyInfo;
        _setData();
      });
    }
  }

  _setData() {
    if (_familyInfo != null) {
      _educationIndex =
          _educations.getIndex((e) => e.name == _familyInfo!.education);
      _marriageIndex =
          _marriages.getIndex((p0) => p0.name == _familyInfo!.marialStatus);
      _parentTxtController.text = _familyInfo!.parentName ?? '';
      _spouseTxtController.text = _familyInfo!.spouseName ?? '';
      _memberTxtController.text = _familyInfo?.noOfFamily ?? '';
      _numBoyTxtController.text = '${_familyInfo?.totalChild?.male ?? ''}';
      _numGirlTxtController.text = '${_familyInfo?.totalChild?.female ?? ''}';
      _numGoSchoolTxtController.text = _familyInfo!.totalGoingSchool ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.family_info,
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
              AppDropdownButton(
                items: _educations.map((e) => e.name!).toList(),
                hintText: AppLang.local.education,
                itemSelected: _educationIndex != null
                    ? _educations[_educationIndex!].name
                    : null,
                onChanged: (v) {
                  setState(() {
                    _educationIndex = v;
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                items: _marriages.map((e) => e.name!).toList(),
                hintText: AppLang.local.marriage_status,
                itemSelected: _marriageIndex != null
                    ? _marriages[_marriageIndex!].name
                    : null,
                onChanged: (v) {
                  setState(() {
                    _marriageIndex = v;
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: AppLang.local.guardian_parent_name,
                controller: _parentTxtController,
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: AppLang.local.spouse_name,
                controller: _spouseTxtController,
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: AppLang.local.no_of_family_members,
                controller: _memberTxtController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: AppLang.local.no_of_boy_children,
                controller: _numBoyTxtController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: AppLang.local.no_of_girl_children,
                controller: _numGirlTxtController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: AppLang.local.no_of_children_going_school,
                controller: _numGoSchoolTxtController,
                keyboardType: TextInputType.number,
              )
            ],
          ),
        ),
      ),
    );
  }
}
