import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';

class ScreenPreHarvestQuality extends StatelessWidget {
  ScreenPreHarvestQuality({super.key, required this.preHarvestQC});
  final List<MPreHarvestQC> preHarvestQC;
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: 'Pre Harvest Quality Check',
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                ...preHarvestQC
                    .map((e) => Padding(
                          padding: const EdgeInsets.only(top: 16.0),
                          child: AppFormField(
                            hint: '${e.description} *',
                            initialValue: e.value,
                            keyboardType:
                                e.type == 1 ? TextInputType.number : null,
                            onChanged: (v) {
                              e.value = v;
                            },
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return AppLang.local.please_fill_name;
                              }
                              if (e.type == 0) return null;
                              if (double.parse(v) < e.min_standard) {
                                return "${e.description} more than ${e.min_standard}";
                              }
                              if (e.max_standard > 0) {
                                if (double.parse(v) > e.max_standard) {
                                  return "${e.description} less than ${e.max_standard}";
                                }
                              }
                              return null;
                            },
                            suffixIcon: Padding(
                              padding:
                                  const EdgeInsets.only(top: 16, bottom: 16),
                              child: Text(
                                e.unit,
                                style: TextStyleConstant.quicksandW600(
                                  color: ColorConstant.text79.withOpacity(0.3),
                                ),
                              ),
                            ),
                          ),
                        ))
                    .toList(),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16.0),
                  child: AppButton(
                    title: AppLang.local.add,
                    height: 46,
                    onTap: () {
                      if (!_formKey.currentState!.validate()) {
                        return;
                      }
                      Navigator.of(context).pop(preHarvestQC);
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
