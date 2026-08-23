import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/bank_info/bank_info_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';

class NewBankScreen extends StatefulWidget {
  const NewBankScreen({
    super.key,
    this.bank,
    this.accountTypes,
  });
  final BankInfoModel? bank;
  final List<DropdownDataModel>? accountTypes;
  @override
  State<NewBankScreen> createState() => _NewBankScreenState();
}

class _NewBankScreenState extends State<NewBankScreen> {
  List<DropdownDataModel> _accountTypes = [];
  int? _typeIndex;
  final _accountNoTxtController = TextEditingController();
  final _bankTxtController = TextEditingController();
  final _branchTxtController = TextEditingController();
  final _sortCodeTxtController = TextEditingController();
  @override
  void initState() {
    super.initState();
    _accountTypes = widget.accountTypes ?? [];
    if (widget.bank != null) {
      _typeIndex =
          _accountTypes.getIndex((p0) => p0.name == widget.bank!.accoutType);
      _accountNoTxtController.text = widget.bank!.accoutNo ?? '';
      _bankTxtController.text = widget.bank!.bankName ?? '';
      _branchTxtController.text = widget.bank!.branchDetails ?? '';
      _sortCodeTxtController.text = widget.bank!.sortCode ?? '';
    }
  }

  _onSave() {
    if (_typeIndex == null) {
      return;
    }
    final b = widget.bank ?? BankInfoModel();
    b.accoutType = _typeIndex != null ? _accountTypes[_typeIndex!].name : null;
    b.accoutNo = _accountNoTxtController.text;
    b.bankName = _bankTxtController.text;
    b.branchDetails = _branchTxtController.text;
    b.sortCode = _sortCodeTxtController.text;
    Navigator.of(context).pop(b);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: AppLang.local.new_bank_info,
          actions: _typeIndex == null
              ? null
              : [
                  InkWell(
                    onTap: _onSave,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        widget.bank != null ? AppLang.local.save : 'Add',
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
                  items: _accountTypes.map((e) => e.name!).toList(),
                  hintText: AppLang.local.account_type,
                  itemSelected: _typeIndex != null
                      ? _accountTypes[_typeIndex!].name
                      : null,
                  onChanged: (v) {
                    setState(() {
                      _typeIndex = v;
                    });
                  },
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  labelText: AppLang.local.account_number,
                  controller: _accountNoTxtController,
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  labelText: AppLang.local.bank_name,
                  controller: _bankTxtController,
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  labelText: AppLang.local.branch,
                  controller: _branchTxtController,
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  labelText: AppLang.local.sort_code,
                  controller: _sortCodeTxtController,
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
