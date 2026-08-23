// ignore_for_file: use_build_context_synchronously

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/date_form_field.dart';
import 'package:agrobase_ekibbo/components/radio_button.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/finance_info/finance_info_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class FinanceInfoScreen extends StatefulWidget {
  const FinanceInfoScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<FinanceInfoScreen> createState() => _FinanceInfoScreenState();
}

class _FinanceInfoScreenState extends State<FinanceInfoScreen> {
  bool _hasLoan = false;
  final List<String> _loanFrom = [
    'Bank',
    'Relative',
    'Friend',
    'Farming',
    'contract',
    'Other',
  ];
  int? _loanFromIndex;
  DateTime? _repaymentDate;
  String? _period;
  final _loanAmountTxtController = TextEditingController();
  final _interestTxtController = TextEditingController();
  final _repaymentAmountTxtController = TextEditingController();
  bool _isSecure = false;
  FinanceInfoModel? _financeInfo;
  @override
  void initState() {
    _getFinanceInfo();
    super.initState();
  }

  _getFinanceInfo() async {
    final res =
        await ApiProvider.instance.apiFarmer.getFinanceInfo(widget.farmerId);
    if (res?.data != null) {
      setState(() {
        _financeInfo = res?.data?.financeInfo;
        _setData();
      });
    }
  }

  _setData() {
    if (_financeInfo != null) {
      _hasLoan = _financeInfo!.loanTakenLastYear == 'Yes';
      _loanFromIndex =
          _loanFrom.getIndex((p0) => p0 == _financeInfo!.loanTakenFrom);
      _loanAmountTxtController.text = "${_financeInfo!.loanAmount ?? ''}";
      _interestTxtController.text = "${_financeInfo!.loanInterest ?? ''}";
      _period = _financeInfo!.interestPeriod;
      _isSecure = _financeInfo!.security == 'YES';
      _repaymentAmountTxtController.text =
          '${_financeInfo!.loanRepaymentAmount ?? ''}';
      _repaymentDate = _financeInfo!.loanRepaymentDate != null
          ? DateHelper.convertStrToDate(_financeInfo!.loanRepaymentDate!)
          : null;
    }
  }

  _onSave() async {
    DialogHelper.showLoading();
    final data = {
      "data_finance": {
        "loan_taken_last_year": _hasLoan ? "Yes" : "No",
        "loan_taken_from": !_hasLoan
            ? null
            : (_loanFromIndex != null ? _loanFrom[_loanFromIndex!] : null),
        "loan_amount": !_hasLoan ? null : _loanAmountTxtController.text,
        "purpose": null,
        "loan_interest": !_hasLoan ? null : _interestTxtController.text,
        "interest_period": !_hasLoan ? null : _period,
        "security": !_hasLoan ? null : (_isSecure ? "YES" : "NO"),
        "loan_repayment_amount":
            !_hasLoan ? null : _repaymentAmountTxtController.text,
        "loan_repayment_date": !_hasLoan
            ? null
            : (_repaymentDate != null
                ? DateHelper.convertDateToStr(_repaymentDate!)
                : null)
      }
    };
    final res = await ApiProvider.instance.apiFarmer
        .updateFinanceInfo(widget.farmerId, data);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      Navigator.of(context).pop();
      DialogHelper.showToast(
          context, AppLang.local.update_finance_successfully);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: AppLang.local.finance_info,
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
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      AppLang.local.loan_taken_last_year,
                      style: TextStyleConstant.quicksandW600(
                        color: ColorConstant.text79,
                      ),
                    ),
                    CupertinoSwitch(
                      value: _hasLoan,
                      onChanged: (v) {
                        setState(() {
                          _hasLoan = v;
                        });
                      },
                    )
                  ],
                ),
                !_hasLoan
                    ? const SizedBox.shrink()
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(
                            height: 24,
                          ),
                          AppDropdownButton(
                            items: _loanFrom,
                            hintText: AppLang.local.loan_taken_from,
                            itemSelected: _loanFromIndex != null
                                ? _loanFrom[_loanFromIndex!]
                                : null,
                            onChanged: (v) {
                              setState(() {
                                _loanFromIndex = v;
                              });
                            },
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppFormField(
                            labelText: AppLang.local.loan_amount,
                            keyboardType: TextInputType.number,
                            controller: _loanAmountTxtController,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppDropdownButton(
                            items: [],
                            hintText: AppLang.local.purpose,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppFormField(
                            labelText: AppLang.local.loan_interest,
                            keyboardType: TextInputType.number,
                            controller: _interestTxtController,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          Text(
                            AppLang.local.interst_period,
                            style: TextStyleConstant.quicksandW600(
                              color: ColorConstant.text79,
                            ),
                          ),
                          const SizedBox(
                            height: 8,
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      RadioButton(
                                        groupValue: _period,
                                        value: 'Monthly',
                                        onChanged: (v) {
                                          setState(() {
                                            _period = v;
                                          });
                                        },
                                      ),
                                      const SizedBox(
                                        width: 8,
                                      ),
                                      Text(
                                        AppLang.local.monthly,
                                        style: TextStyleConstant.robotoW400(
                                          color: ColorConstant.text79,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(
                                  width: 24,
                                ),
                                Expanded(
                                  child: Row(
                                    children: [
                                      RadioButton(
                                        groupValue: _period,
                                        value: 'Yearly',
                                        onChanged: (v) {
                                          setState(() {
                                            _period = v;
                                          });
                                        },
                                      ),
                                      const SizedBox(
                                        width: 8,
                                      ),
                                      Text(
                                        AppLang.local.yearly,
                                        style: TextStyleConstant.robotoW400(
                                          color: ColorConstant.text79,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          Row(
                            children: [
                              Text(
                                AppLang.local.security,
                                style: TextStyleConstant.quicksandW600(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              Checkbox(
                                value: _isSecure,
                                activeColor: ColorConstant.primary,
                                onChanged: (v) {
                                  setState(() {
                                    _isSecure = v!;
                                  });
                                },
                              )
                            ],
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppFormField(
                            labelText: AppLang.local.loan_repayment_amount,
                            keyboardType: TextInputType.number,
                            controller: _repaymentAmountTxtController,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          DateFormField(
                            key: UniqueKey(),
                            initialDate: _repaymentDate ?? DateTime.now(),
                            hint: AppLang.local.loan_repayment_date,
                            onChanged: (v) {
                              setState(() {
                                _repaymentDate = v;
                              });
                            },
                          ),
                        ],
                      ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
