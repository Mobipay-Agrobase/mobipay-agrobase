// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/insurance/insurance_info_response.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class InsuranceInfoScreen extends StatefulWidget {
  const InsuranceInfoScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<InsuranceInfoScreen> createState() => _InsuranceInfoScreenState();
}

class _InsuranceInfoScreenState extends State<InsuranceInfoScreen> {
  List<InsuranceInfoModel> _insurances = [];
  List<DropdownMasterModel> _dataCrop = [];

  _onSave() async {
    DialogHelper.showLoading();
    final data = {
      'data_insurance': _insurances.map((e) => e.toJson()).toList(),
    };
    final res = await ApiProvider.instance.apiFarmer
        .updateInsuranceData(widget.farmerId, data);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      DFarmerInfo.instance.infoInsurances = null;
      Navigator.of(context).pop();
      DialogHelper.showToast(
          context, AppLang.local.update_insurance_successfully);
    }
  }

  _buildFutureFetchData() {
    return FutureBuilder(
      future: DFarmerInfo.instance.fetchDataInfoInsurances(widget.farmerId),
      builder: ((context, snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.waiting:
            return const Center(
              child: AppCircularIndicator(
                color: ColorConstant.primary,
              ),
            );
          default:
            if (snapshot.hasError) {
              return const Center(child: NoDataView());
            }
            if (snapshot.data == null) {
              return const Center(child: NoDataView());
            }
            _insurances = snapshot.data as List<InsuranceInfoModel>;
            _dataCrop = DFarmerInfo.instance.dataCrop ?? [];
            return _insurances.isEmpty
                ? const NoDataView()
                : ListView.builder(
                    itemCount: _insurances.length,
                    shrinkWrap: true,
                    itemBuilder: (_, index) {
                      final item = _insurances[index];
                      return _InsuranceItemView(
                        item: item,
                        remove: () {
                          setState(() {
                            _insurances.removeAt(index);
                          });
                        },
                        edit: () {
                          Navigator.of(context).pushNamed(
                            RouterName.new_insurance,
                            arguments: {
                              'insurance': item,
                              'data_crop': _dataCrop,
                            },
                          ).then((value) {
                            if (value != null && value is InsuranceInfoModel) {
                              _insurances[index] = value;
                              setState(() {});
                            }
                          });
                        },
                      );
                    },
                  );
        }
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
        child: Column(
          children: [
            Expanded(
              child: _buildFutureFetchData(),
            ),
            AppButton(
              onTap: () {
                Navigator.of(context).pushNamed(
                  RouterName.new_insurance,
                  arguments: {'data_crop': _dataCrop},
                ).then((value) {
                  if (value != null && value is InsuranceInfoModel) {
                    _insurances.add(value);
                    setState(() {});
                  }
                });
              },
              height: 40,
              radius: 8,
              title: AppLang.local.add_new_insurance,
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

class _InsuranceItemView extends StatelessWidget {
  const _InsuranceItemView({
    required this.item,
    this.edit,
    this.remove,
  });

  final InsuranceInfoModel item;
  final Function()? edit;
  final Function()? remove;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.only(
        bottom: 16,
        right: 16,
        left: 16,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(3),
        color: ColorConstant.grayEDEFF4,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (item.lifeInsurance == 'yes') _buildLifeInfoView(),
          if (item.healthInsurance == 'yes') _buildHealthInfoView(),
          if (item.cropInsurance == 'yes') _buildCropInfoView(),
          if (item.socialInsurance == 'yes') _buildSocialInfoView(),
          if (item.otherInsurance != null && item.otherInsurance != '')
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(
                '${AppLang.local.other_insurance}: ${item.otherInsurance ?? ''}',
                style: TextStyleConstant.robotoW600(),
              ),
            ),
          const SizedBox(
            height: 10,
          ),
          Row(
            children: [
              InkWell(
                onTap: edit,
                child: Container(
                  height: 30,
                  width: 40,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    AppLang.local.edit,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 12,
                      color: ColorConstant.primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(
                width: 16,
              ),
              InkWell(
                onTap: remove,
                child: Container(
                  height: 30,
                  width: 40,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    AppLang.local.remove,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 12,
                      color: ColorConstant.redFF1A21,
                    ),
                  ),
                ),
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildSocialInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${AppLang.local.social_insurance}: ${item.providerSocialInsurance ?? ''}',
            style: TextStyleConstant.robotoW600(),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.enrollment_date}: ${item.socialInsuranceEnrolledDate ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.end_date}: ${item.socialInsuranceEndDate ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLifeInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${AppLang.local.life_insurance}: ${item.providerLifeInsurance ?? ''}',
            style: TextStyleConstant.robotoW600(),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.insurance_amount}: ${item.lifeInsuranceAmount ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.enrollment_date}: ${item.lifeInsuranceEnrolledDate ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.end_date}: ${item.lifeInsuranceEndDate ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${AppLang.local.health_insurance}: ${item.providerHealthInsurance ?? ''}',
            style: TextStyleConstant.robotoW600(),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.insurance_amount}: ${item.healthInsuranceAmount ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.enrollment_date}: ${item.healthInsuranceEnrolledDate ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.end_date}: ${item.healthInsuranceEndDate ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${AppLang.local.crop_insurance}: ${item.providerCropInsurance ?? ''}',
            style: TextStyleConstant.robotoW600(),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.enrollment_date}: ${item.cropInsuranceEnrolledDate ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${AppLang.local.end_date}: ${item.cropInsuranceEndDate ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
            ),
          ),
        ],
      ),
    );
  }
}
