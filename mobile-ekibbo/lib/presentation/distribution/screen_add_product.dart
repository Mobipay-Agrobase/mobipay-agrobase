import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_distribution.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/distribution/model_attribute.dart';
import 'package:agrobase_ekibbo/models/distribution/model_category.dart';
import 'package:agrobase_ekibbo/models/distribution/model_product.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';

class ScreenAddProduct extends StatefulWidget {
  const ScreenAddProduct({Key? key, required this.argument}) : super(key: key);

  final ArgumentAddProductDistribution argument;
  @override
  State<ScreenAddProduct> createState() => _ScreenAddProductState();
}

class _ScreenAddProductState extends State<ScreenAddProduct> {
  final TextEditingController ctrlAvailableStock = TextEditingController();
  final TextEditingController ctrlPreviousStock = TextEditingController();
  final TextEditingController ctrlUnit = TextEditingController();
  final TextEditingController ctrlPrice = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  int categoryId = 0;
  int productId = 0;
  int typeId = 0;
  String quantity = '';

  List<MCategory> _categories = [];
  List<MProduct> _products = [];
  List<MAttribute> _types = [];

  @override
  void initState() {
    super.initState();
    initData();
  }

  @override
  void dispose() {
    ctrlAvailableStock.dispose();
    ctrlPreviousStock.dispose();
    ctrlUnit.dispose();
    ctrlPrice.dispose();
    super.dispose();
  }

  initData() async {
    if (widget.argument.stockId == 0) {
      _getCategory();
      return;
    }
    final mProductItem = widget.argument.products
        .firstWhere((element) => element.stock_id == widget.argument.stockId);
    categoryId = mProductItem.category_id;
    productId = mProductItem.product_id;
    typeId = mProductItem.stock_id;
    quantity = "${mProductItem.quantity}";
    await _getCategory();
    await _getProduct();
    await _getType();
    final mproduct =
        _products.firstWhereOrNull((element) => element.id == productId);
    if (mproduct == null) {
      setState(() {});
      return;
    }
    final mstock =
        mproduct.stocks.firstWhereOrNull((element) => element.id == typeId);
    ctrlAvailableStock.text =
        "${AppLang.local.available_stock} ${mstock == null ? 0 : mstock.availableStocks}";
    setState(() {});
  }

  _getCategory() async {
    // Categories come from the web InputProduct master (tenant-scoped).
    // The legacy cooperative scoping is intentionally dropped.
    _categories = await ApiDistribution.getCategoryByCooperId(
        widget.argument.cooperativeId);
    if (_categories.isNotEmpty) setState(() {});
  }

  _getProduct() async {
    if (_categories.isEmpty) return;
    _products = await ApiDistribution.getProductsByCateId(
        categoryId, widget.argument.farmerId);
    if (_products.isNotEmpty) setState(() {});
  }

  _getType() async {
    final product =
        _products.firstWhereOrNull((element) => element.id == productId);
    if (product == null) return;
    _types = product.stocks;
    if (widget.argument.stockId == 0) {
      final mproductItem = widget.argument.products
          .firstWhereOrNull((element) => element.product_id == productId);
      if (mproductItem != null) {
        _types.removeWhere((element) => element.id == mproductItem.stock_id);
      }
    }
    ctrlUnit.text = product.unit;
    ctrlPrice.text = "${product.unit_price}";
    await _getPreviousStock();
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {});
  }

  _getPreviousStock() async {
    // Reads the previously-distributed quantity from the web
    // InputDistribution ledger (via the product payload).
    final previousStock = await ApiDistribution.getPreviousStock(
        widget.argument.farmerId, productId);
    ctrlPreviousStock.text =
        "${AppLang.local.privious_distribution_quantity} $previousStock";
  }

  bool get isEnough =>
      int.parse(quantity) <=
      _types.firstWhere((element) => element.id == typeId).availableStocks;

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
          child: ListView(children: [
            WidgetCommon.buildHeaderForm(AppLang.local.product_information),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: InputDropDownData(
                hintText: AppLang.local.category,
                items: _categories.map((e) => e.name).toList(),
                itemIndex: _categories.isEmpty || categoryId == 0
                    ? null
                    : _categories
                        .indexWhere((element) => element.id == categoryId),
                onChanged: (index) {
                  categoryId = _categories[index].id;
                  productId = 0;
                  typeId = 0;
                  ctrlAvailableStock.text = '';
                  ctrlPreviousStock.text = '';
                  ctrlUnit.text = '';
                  ctrlPrice.text = '';
                  _getProduct();
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: InputDropDownData(
                hintText: AppLang.local.product,
                items: _products.map((e) => e.name).toList(),
                itemIndex: _products.isEmpty || productId == 0
                    ? null
                    : _products
                        .indexWhere((element) => element.id == productId),
                onChanged: (index) {
                  productId = _products[index].id;
                  typeId = 0;
                  _getType();
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: InputDropDownData(
                hintText: AppLang.local.type,
                items: _types.map((e) => e.sku).toList(),
                itemIndex: _types.isEmpty || typeId == 0
                    ? null
                    : _types.indexWhere((element) => element.id == typeId),
                onChanged: (index) {
                  typeId = _types[index].id;
                  setState(() {
                    ctrlAvailableStock.text =
                        "${AppLang.local.available_stock} ${_types[index].availableStocks}";
                  });
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: AppFormField(
                hint: AppLang.local.price_per_unit,
                controller: ctrlPrice,
                readOnly: true,
                fillColor: ColorConstant.grayDBDBDB,
                suffixIcon: Padding(
                  padding: const EdgeInsets.only(top: 16, bottom: 16),
                  child: Text(
                    'đ',
                    style: TextStyleConstant.quicksandW600(
                      color: ColorConstant.text79,
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: AppFormField(
                hint: AppLang.local.unit,
                controller: ctrlUnit,
                readOnly: true,
                fillColor: ColorConstant.grayDBDBDB,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: AppFormField(
                hint: AppLang.local.available_stock,
                controller: ctrlAvailableStock,
                readOnly: true,
                fillColor: ColorConstant.grayDBDBDB,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: AppFormField(
                hint: AppLang.local.privious_distribution_quantity,
                controller: ctrlPreviousStock,
                readOnly: true,
                fillColor: ColorConstant.grayDBDBDB,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Form(
                key: _formKey,
                child: AppFormField(
                  hint: AppLang.local.distribution_stocks,
                  keyboardType: TextInputType.number,
                  initialValue: quantity.isEmpty ? null : quantity,
                  onChanged: (value) {
                    quantity = value;
                  },
                  validator: (v) {
                    final arr = _types
                        .firstWhereOrNull((element) => element.id == typeId);
                    if (arr == null) return null;
                    if (v == null || v.isEmpty) {
                      return AppLang.local.please_fill_stock_distribution;
                    }
                    if (!RegExp(r'^-?[0-9]+$').hasMatch(v)) {
                      return AppLang.local.quantity_must_be_whole_number;
                    }
                    if (int.parse(v) <= 0) {
                      return AppLang.local.quantity_must_be_greater_than_0;
                    }
                    if (int.parse(v) > arr.availableStocks) {
                      return "${AppLang.local.quantity_must_be_less_than} ${arr.availableStocks}";
                    }
                    return null;
                  },
                ),
              ),
            ),
            _buildBtnAdd(),
          ]),
        ),
      ),
    );
  }

  _buildBtnAdd() {
    return AppButton(
      title: AppLang.local.add,
      height: 46,
      onTap: () {
        if (!_formKey.currentState!.validate()) {
          return;
        }
        if (widget.argument.stockId != 0) {
          widget.argument.products.removeWhere(
              (element) => element.stock_id == widget.argument.stockId);
        }
        final product =
            _products.firstWhere((element) => element.id == productId);
        final arrtibute =
            product.stocks.firstWhere((element) => element.id == typeId);
        final mProductItem = MProductItem(
            product_id: productId,
            product_name: product.name,
            category_id: product.category_id,
            category_name: product.category_name,
            quantity: int.parse(quantity),
            price_per_unit: arrtibute.pricePerUnit,
            available_stocks: arrtibute.availableStocks,
            unit: product.unit,
            stock_id: typeId);
        widget.argument.products.add(mProductItem);
        widget.argument.isStockNotEnough = isEnough;
        Navigator.of(context).pop(widget.argument);
      },
    );
  }
}
