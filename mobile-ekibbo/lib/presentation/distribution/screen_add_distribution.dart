// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/mixin/input_farmer.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_address.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_distribution.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/distribution/model_cooperative.dart';
import 'package:agrobase_ekibbo/models/distribution/model_product.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/distribution/widget/info_product.dart';

import '../../components/custom_appbar.dart';

class ScreenAddDistribution extends StatefulWidget {
  const ScreenAddDistribution({super.key});

  @override
  State<ScreenAddDistribution> createState() => _ScreenAddDistributionState();
}

class _ScreenAddDistributionState extends State<ScreenAddDistribution>
    with InputFarmerMixin {
  final _dateController = TextEditingController(
      text: DateHelper.convertDateToStr(DateTime.now(), format: "yyyy-MM-dd"));

  DateTime? _date;
  bool isShowAddress = true;

  int cooperativeId = 0;

  List<MCooperative> _cooperatives = [];
  List<MProductItem> _products = [];
  List<int> _stocksError = [];

  @override
  void initState() {
    _initData();
    super.initState();
  }

  @override
  void dispose() {
    _dateController.dispose();
    NavigatorManager.contextRoot
        .read<AppProvider>()
        .updateState(AppEvent.appSearchResetData);
    super.dispose();
  }

  bool get isShowBtnAdd =>
      cooperativeId != 0 && farmerId != 0 && _dateController.text.isNotEmpty;

  _initData() async {
    _cooperatives = await ApiAddress.getCooperatives();
    if (_cooperatives.isNotEmpty) {
      setState(() {});
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await DateHelper.showDateDialog(
      context,
      initialDate: _date ?? DateTime.now(),
      lastDate: DateTime.now(),
      firstDate: DateTime(1900, 1),
    );
    if (picked != null && picked != _date) {
      _date = picked;
      _dateController.text =
          DateHelper.convertDateToStr(_date!, format: "yyyy-MM-dd");
      setState(() {});
    }
  }

  indexCooperative() {
    if (_cooperatives.isEmpty || cooperativeId == 0) return null;
    final index =
        _cooperatives.indexWhere((element) => element.id == cooperativeId);
    if (index == -1) return null;
    return index;
  }

  @override
  Future<void> onChangeFarmer(BuildContext context,
      {int cooperativeId = 0,
      int provinceId = 0,
      int communeId = 0,
      int hasData = 0}) async {
    await super.onChangeFarmer(
      context,
      cooperativeId: cooperativeId,
      communeId: communeId,
      hasData: hasData,
    );
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.input_distribution,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: ListView(
            children: [
              WidgetCommon.buildHeaderForm(AppLang.local.general_information),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 24.0),
                child: InkWell(
                  onTap: _selectDate,
                  child: IgnorePointer(
                    child: AppFormField(
                      controller: _dateController,
                      hint: AppLang.local.date, //Todo: translate
                      readOnly: true,
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return AppLang.local.please_fill_name;
                        }
                        return null;
                      },
                      prefixIcon: Padding(
                        padding: const EdgeInsets.only(left: 16, right: 16),
                        child: SvgPicture.asset('ic_calendar'.iconSvg),
                      ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 24.0),
                child: InputDropDownData(
                  hintText: AppLang.local.cooperative,
                  items: _cooperatives.map((e) => e.name).toList(),
                  itemIndex: indexCooperative(),
                  onChanged: (index) {
                    cooperativeId = _cooperatives[index].id;
                    context.read<AppProvider>().updateState(
                        AppEvent.appSearchSetCooperative,
                        argument: {
                          "cooperativeId": cooperativeId,
                          "hasData": 0
                        });
                    setState(() {
                      isShowAddress = true;
                      farmerId = 0;
                      initValueFarmer = '';
                      _products.clear();
                    });
                  },
                ),
              ),
              Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: inputFarmerMixin(context,
                      cooperativeId: cooperativeId, hasData: 0)),
              WidgetCommon.buildHeaderForm(AppLang.local.product_information),
              const SizedBox(height: 10),
              ..._products
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10.0),
                      child: InfoProduct(
                        product: item,
                        isOutOfStock: _stocksError.contains(item.stock_id),
                        onRemove: () {
                          setState(() {
                            _products.removeWhere(
                                (element) => element.stock_id == item.stock_id);
                          });
                        },
                        onEdit: () async {
                          final argument = await Navigator.of(context)
                              .pushNamed(RouterName.add_product_distribution,
                                  arguments: ArgumentAddProductDistribution(
                                    cooperativeId: cooperativeId,
                                    products: _products,
                                    stockId: item.stock_id,
                                    farmerId: farmerId,
                                  ));
                          if (argument is ArgumentAddProductDistribution) {
                            setState(() {
                              _products = argument.products;
                              if (argument.isStockNotEnough) {
                                _stocksError.remove(argument.stockId);
                              }
                            });
                          }
                        },
                      ),
                    ),
                  )
                  .toList(),
              isShowBtnAdd ? _buildBtnAddProduct() : const SizedBox.shrink(),
              const SizedBox(height: 20),
              _products.isNotEmpty
                  ? _buildBtnSubmit()
                  : const SizedBox.shrink(),
            ],
          ),
        ),
      ),
    );
  }

  _buildBtnSubmit() {
    return AppButton(
      title: AppLang.local.submit,
      height: 46,
      onTap: () async {
        final data = {
          "distribution_date": _dateController.text,
          "farmer_id": farmerId,
          "products": _products.map((e) => e.toMap()).toList()
        };
        try {
          final formData = FormData.fromMap(data);
          DialogHelper.showLoading();
          final res = await ApiDistribution.createDistribution(formData);
          DialogHelper.hideLoading();
          if (res.result!) {
            final receiptNo = res.data['receipt_no'] ?? '';
            // ignore: use_build_context_synchronously
            DialogHelper.showOkDialog(
                context, "${AppLang.local.added_distribution} $receiptNo",
                okAction: () {
              // ignore: use_build_context_synchronously
              Navigator.of(context).pop();
            });
          } else {
            if (res.errors != null) {
              _stocksError = ((res.errors['stock_id'] ?? []) as List)
                  .map((e) => int.parse(e))
                  .toList();
              setState(() {});
            }
            // ignore: use_build_context_synchronously
            DialogHelper.showToast(context, res.message);
          }
        } catch (e) {
          // ignore: use_build_context_synchronously
          DialogHelper.showToast(context, e.toString());
        }
      },
    );
  }

  _buildBtnAddProduct() {
    return AppButton(
      title: AppLang.local.add_product,
      height: 46,
      borderColor: ColorConstant.primary,
      color: Colors.white,
      titleStyle: TextStyleConstant.worksansW500(
        fontSize: 16,
        color: ColorConstant.primary,
      ),
      onTap: () async {
        final argument = await Navigator.of(context).pushNamed(
          RouterName.add_product_distribution,
          arguments: ArgumentAddProductDistribution(
            cooperativeId: cooperativeId,
            products: _products,
            farmerId: farmerId,
          ),
        );
        if (argument is ArgumentAddProductDistribution) {
          setState(() {
            _products = argument.products;
            if (argument.isStockNotEnough) {
              _stocksError.remove(argument.stockId);
            }
          });
        }
      },
    );
  }
}
