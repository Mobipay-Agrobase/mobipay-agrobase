// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/bank_info/bank_info_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class BankInfoScreen extends StatefulWidget {
  const BankInfoScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<BankInfoScreen> createState() => _BankInfoScreenState();
}

class _BankInfoScreenState extends State<BankInfoScreen> {
  List<DropdownDataModel> _accountTypes = [];
  List<BankInfoModel> _bankInfos = [];
  @override
  void initState() {
    _getBankInfo();
    super.initState();
  }

  _getBankInfo() async {
    final res =
        await ApiProvider.instance.apiFarmer.getBankInfo(widget.farmerId);
    if (!mounted) return;
    if (res?.data != null) {
      setState(() {
        _accountTypes = res!.data!.dataAccountType ?? [];
        _bankInfos = res.data!.bankInfo ?? [];
      });
    }
  }

  _onSave() async {
    DialogHelper.showLoading();
    final data = {
      'data_bank': _bankInfos.map((e) => e.toJson()).toList(),
    };
    final res = await ApiProvider.instance.apiFarmer
        .updateBankInfo(widget.farmerId, data);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      Navigator.of(context).pop();
      DialogHelper.showToast(context, AppLang.local.update_bank_successfully);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.bank_info,
        actions: _bankInfos.isEmpty
            ? null
            : [
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _bankInfos.isEmpty
                ? const NoDataView()
                : ListView.builder(
                      itemCount: _bankInfos.length,
                      shrinkWrap: true,
                      itemBuilder: (_, index) {
                        final item = _bankInfos[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(3),
                            color: ColorConstant.grayEDEFF4,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.accoutType ?? '',
                                style: TextStyleConstant.robotoW600(),
                              ),
                              const SizedBox(
                                height: 10,
                              ),
                              Text(
                                item.accoutNo ?? '',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              const SizedBox(
                                height: 4,
                              ),
                              Text(
                                item.bankName ?? '',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              const SizedBox(
                                height: 4,
                              ),
                              Text(
                                item.branchDetails ?? '',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              const SizedBox(
                                height: 10,
                              ),
                              Text(
                                'Sort Code: ${item.sortCode ?? ''}',
                                style: TextStyleConstant.robotoW400(),
                              ),
                              const SizedBox(
                                height: 16,
                              ),
                              Row(
                                children: [
                                  InkWell(
                                    onTap: () {
                                      Navigator.of(context).pushNamed(
                                          RouterName.new_bank,
                                          arguments: {
                                            'account_types': _accountTypes,
                                            'bank': item,
                                          }).then((value) {
                                        if (value != null &&
                                            value is BankInfoModel) {
                                          _bankInfos[index] = value;
                                          setState(() {});
                                        }
                                      });
                                    },
                                    child: Text(
                                      AppLang.local.edit,
                                      style: TextStyleConstant.robotoW400(
                                        fontSize: 12,
                                        color: ColorConstant.primary,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(
                                    width: 16,
                                  ),
                                  InkWell(
                                    onTap: () {
                                      setState(() {
                                        _bankInfos.removeAt(index);
                                      });
                                    },
                                    child: Text(
                                      AppLang.local.remove,
                                      style: TextStyleConstant.robotoW400(
                                        fontSize: 12,
                                        color: ColorConstant.redFF1A21,
                                      ),
                                    ),
                                  )
                                ],
                              )
                            ],
                          ),
                        );
                      },
                    ),
            AppButton(
              onTap: () {
                Navigator.of(context).pushNamed(RouterName.new_bank,
                    arguments: {'account_types': _accountTypes}).then((value) {
                  if (value != null && value is BankInfoModel) {
                    _bankInfos.add(value);
                    setState(() {});
                  }
                });
              },
              height: 40,
              radius: 8,
              title: AppLang.local.new_bank_info,
              color: Colors.white,
              borderColor: ColorConstant.primary,
              titleStyle: TextStyleConstant.quicksandW600(
                fontSize: 16,
                color: ColorConstant.primary,
              ),
            )
          ],
        ),
      ),
    );
  }
}
