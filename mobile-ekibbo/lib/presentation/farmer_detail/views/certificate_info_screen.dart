// ignore_for_file: use_build_context_synchronously

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class CertificateInfoScreen extends StatefulWidget {
  const CertificateInfoScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<CertificateInfoScreen> createState() => _CertificateInfoScreenState();
}

class _CertificateInfoScreenState extends State<CertificateInfoScreen> {
  bool _isCert = false;
  String? _type;
  final _yearTxtCtrler = TextEditingController();
  @override
  void initState() {
    _getCertificateInfo();
    super.initState();
  }

  _getCertificateInfo() async {
    final res = await ApiProvider.instance.apiFarmer
        .getCertificateInfo(widget.farmerId);
    if (res?.data?.certificateInfo != null) {
      setState(() {
        _isCert =
            res?.data?.certificateInfo!.isCertifiedFarmer!.toLowerCase() ==
                'yes';
        _type = res?.data?.certificateInfo?.certificationType;
        _yearTxtCtrler.text = res?.data?.certificateInfo?.yearOfIcs ?? '';
      });
    }
  }

  _onSave() async {
    DialogHelper.showLoading();
    final data = {
      "data_certificate": {
        "is_certified_farmer": _isCert ? "Yes" : "No",
        "certification_type": _isCert ? _type : null,
        "year_of_ics": _yearTxtCtrler.text,
      }
    };
    try {
      final res = await ApiProvider.instance.apiFarmer
          .updateCertificateInfo(widget.farmerId, data);
      DialogHelper.hideLoading();
      if (res?.result == true) {
        Navigator.of(context).pop(true);
        DialogHelper.showToast(context, AppLang.local.update_cert_successfully);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.certificate_info,
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
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  AppLang.local.certified_farmer,
                  style: TextStyleConstant.quicksandW600(
                    color: ColorConstant.text79,
                  ),
                ),
                CupertinoSwitch(
                  value: _isCert,
                  onChanged: (v) {
                    setState(() {
                      _isCert = v;
                    });
                  },
                )
              ],
            ),
            if (_isCert)
              Column(
                children: [
                  const SizedBox(
                    height: 24,
                  ),
                  AppDropdownButton(
                    items: const [
                      'Individual',
                      'Group',
                    ],
                    hintText: AppLang.local.certification_type,
                    itemSelected: _type,
                    onChanged: (v) {
                      setState(() {
                        _type = v == 0 ? 'Individual' : 'Group';
                      });
                    },
                  ),
                  const SizedBox(
                    height: 24,
                  ),
                  AppFormField(
                    labelText: AppLang.local.year,
                    controller: _yearTxtCtrler,
                    keyboardType: TextInputType.phone,
                  )
                ],
              ),
          ],
        ),
      ),
    );
  }
}
