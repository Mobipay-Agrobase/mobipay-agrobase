// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_ekibbo_modules.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_module_form_widgets.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo New Purchase (Sheet-2 feedback, Purchase Module):
/// "Under new purchase, forms of coffee only include the following
///  (Fresh, Kiboko, FAQ)."
///
/// Mirrors the web PurchaseFormPage:
///   Farmer → Commodity → Form (per-commodity list; coffee: Fresh, Kiboko,
///   FAQ) → weights / moisture / quality → price → deductions, with the
///   moisture-deduction, net-weight, total and net-payment math live.
/// POSTs /api/mobile/ekibbo-purchases (the same web Purchase table, so the
/// record shows on the web Purchases + Approval Hub immediately).
/// ─────────────────────────────────────────────────────────────────────────
class EkibboPurchaseFormScreen extends StatefulWidget {
  const EkibboPurchaseFormScreen({super.key});

  @override
  State<EkibboPurchaseFormScreen> createState() =>
      _EkibboPurchaseFormScreenState();
}

class _EkibboPurchaseFormScreenState extends State<EkibboPurchaseFormScreen> {
  // Ekibbo feedback: commodity→form catalog (coffee ONLY Fresh/Kiboko/FAQ).
  static const Map<String, List<String>> commodityForms = {
    'Coffee': ['Fresh', 'Kiboko', 'FAQ'],
    'Cocoa': ['Wet Beans', 'Dry Beans', 'Pods'],
    'Vanilla': ['Green Vanilla', 'Cured Vanilla'],
    'Cassava': ['Fresh Tubers', 'Dry Chips', 'Flour'],
    'Avocado': ['Fresh Fruit'],
    'Jackfruit': ['Fresh Fruit', 'Slices'],
  };

  String _farmerName = '';
  int _farmerId = 0;
  String? _farmerError;

  String _commodity = 'Coffee'; // first key by default
  String? _form; // dependent on commodity

  final _weightCtrl = TextEditingController(); // total weight kg
  final _moistureCtrl = TextEditingController(); // moisture %
  final _moistureStdCtrl =
      TextEditingController(text: '13'); // threshold, default 13
  final _defectsCtrl = TextEditingController(); // blacks/defects count
  final _qualityDeductionCtrl = TextEditingController(); // kg
  final _priceCtrl = TextEditingController(); // UGX per kg
  final _loanDeductionCtrl = TextEditingController();
  final _inputDeductionCtrl = TextEditingController();
  final _momoChargesCtrl = TextEditingController();
  final _momoTaxCtrl = TextEditingController();

  bool _saving = false;

  @override
  void dispose() {
    _weightCtrl.dispose();
    _moistureCtrl.dispose();
    _moistureStdCtrl.dispose();
    _defectsCtrl.dispose();
    _qualityDeductionCtrl.dispose();
    _priceCtrl.dispose();
    _loanDeductionCtrl.dispose();
    _inputDeductionCtrl.dispose();
    _momoChargesCtrl.dispose();
    _momoTaxCtrl.dispose();
    super.dispose();
  }

  // ── Live math (same formulas as the web form) ───────────────────────────
  double get _totalWeight => double.tryParse(_weightCtrl.text) ?? 0;
  double get _moisture => double.tryParse(_moistureCtrl.text) ?? 0;
  double get _threshold => double.tryParse(_moistureStdCtrl.text) ?? 13;
  double get _qualityDeduction =>
      double.tryParse(_qualityDeductionCtrl.text) ?? 0;
  double get _dailyPrice => double.tryParse(_priceCtrl.text) ?? 0;
  double get _loanDeduction => double.tryParse(_loanDeductionCtrl.text) ?? 0;
  double get _inputDeduction =>
      double.tryParse(_inputDeductionCtrl.text) ?? 0;
  double get _momoCharges => double.tryParse(_momoChargesCtrl.text) ?? 0;
  double get _momoTax => double.tryParse(_momoTaxCtrl.text) ?? 0;

  double get _moistureExcess => (_moisture - _threshold).clamp(0, 100).toDouble();
  double get _moistureDeduction =>
      _totalWeight <= 0 ? 0 : (_moistureExcess * (_totalWeight / 100)).clamp(0, _totalWeight).toDouble();
  double get _netWeight =>
      (_totalWeight - _qualityDeduction - _moistureDeduction).clamp(0, double.infinity).toDouble();
  double get _purchaseTotal => _netWeight * _dailyPrice;
  double get _netPayment =>
      _purchaseTotal - _loanDeduction - _inputDeduction - _momoCharges - _momoTax;

  String _fmtUGX(double n) =>
      'UGX ${n.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',')}';

  Future<void> _pickFarmer() async {
    final res = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ScreenSearchFarmer(
          argument: ArgumentScreenSearchFarmer(
            farmerSelected: _farmerName,
            farmerId: _farmerId,
          ),
        ),
      ),
    );
    if (res is ArgumentScreenSearchFarmer) {
      setState(() {
        _farmerName = res.farmerSelected;
        _farmerId = res.farmerId;
        _farmerError = null;
      });
    }
  }

  Future<void> _submit() async {
    if (_farmerId <= 0) {
      setState(() => _farmerError = 'Please select a farmer');
      return;
    }
    if (_form == null) {
      DialogHelper.showToast(context, 'Please select the form of the produce');
      return;
    }
    if (_totalWeight <= 0) {
      DialogHelper.showToast(context, 'Total weight must be greater than zero');
      return;
    }
    if (_dailyPrice <= 0) {
      DialogHelper.showToast(context, 'Daily price must be greater than zero');
      return;
    }

    setState(() => _saving = true);
    DialogHelper.showLoading();
    try {
      await ApiEkibboModules.createPurchase({
        'farmerId': _farmerId,
        'commodity': _commodity,
        'form': _form,
        'totalWeight': _weightCtrl.text.trim(),
        'moistureReading':
            _moistureCtrl.text.trim().isEmpty ? null : _moistureCtrl.text.trim(),
        'moistureThreshold': _moistureStdCtrl.text.trim().isEmpty
            ? null
            : _moistureStdCtrl.text.trim(),
        'defectCount':
            _defectsCtrl.text.trim().isEmpty ? null : _defectsCtrl.text.trim(),
        'qualityDeduction': _qualityDeductionCtrl.text.trim().isEmpty
            ? null
            : _qualityDeductionCtrl.text.trim(),
        'dailyPrice': _priceCtrl.text.trim(),
        'loanDeduction': _loanDeductionCtrl.text.trim().isEmpty
            ? null
            : _loanDeductionCtrl.text.trim(),
        'inputDeduction': _inputDeductionCtrl.text.trim().isEmpty
            ? null
            : _inputDeductionCtrl.text.trim(),
        'momoCharges': _momoChargesCtrl.text.trim().isEmpty
            ? null
            : _momoChargesCtrl.text.trim(),
        'momoTax': _momoTaxCtrl.text.trim().isEmpty
            ? null
            : _momoTaxCtrl.text.trim(),
      });
      DialogHelper.hideLoading();
      if (!mounted) return;
      DialogHelper.showToastSuccess(context,
          message:
              'Purchase recorded — ${_fmtUGX(_netPayment)} net to farmer');
      Navigator.of(context).pop(true);
    } catch (e) {
      DialogHelper.hideLoading();
      if (!mounted) return;
      DialogHelper.showToast(context, e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final forms = commodityForms[_commodity] ?? const <String>[];
    // Effective selection — a stale form (commodity changed) renders unselected.
    final selectedForm = (_form != null && forms.contains(_form)) ? _form : null;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'New Purchase',
        color: ColorConstant.primary,
        titleColor: Colors.white,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('Purchase Details'),
                    const SizedBox(height: 12),
                    _label('Farmer *'),
                    _farmerPicker(),
                    const SizedBox(height: 16),
                    _label('Commodity *'),
                    EkibboDropdown(
                      items: commodityForms.keys.toList(),
                      selectedIndex:
                          commodityForms.keys.toList().indexOf(_commodity),
                      onChanged: (i) => setState(() {
                        _commodity = commodityForms.keys.elementAt(i);
                        _form = null; // reset dependent form
                      }),
                    ),
                    const SizedBox(height: 16),
                    _label('Form *'),
                    _formPicker(forms, selectedForm),
                    const SizedBox(height: 8),
                    if (_commodity == 'Coffee')
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(
                          'Coffee purchases are recorded as Fresh, Kiboko or FAQ only (EKiBBO feedback).',
                          style: TextStyleConstant.robotoW400(
                            fontSize: 11,
                            color: ColorConstant.text79.withOpacity(0.7),
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),

                    _sectionTitle('Weights & Quality'),
                    const SizedBox(height: 12),
                    _label('Total Weight (kg) *'),
                    AppFormField(
                      hint: 'e.g. 250',
                      controller: _weightCtrl,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('Moisture (%)'),
                              AppFormField(
                                hint: 'e.g. 14.5',
                                controller: _moistureCtrl,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                onChanged: (_) => setState(() {}),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('Moisture Std. (%)'),
                              AppFormField(
                                controller: _moistureStdCtrl,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                onChanged: (_) => setState(() {}),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('Defects (blacks)'),
                              AppFormField(
                                hint: 'e.g. 12',
                                controller: _defectsCtrl,
                                keyboardType: TextInputType.number,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('Quality Deduction (kg)'),
                              AppFormField(
                                hint: 'e.g. 2.5',
                                controller: _qualityDeductionCtrl,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                onChanged: (_) => setState(() {}),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    _sectionTitle('Price & Deductions'),
                    const SizedBox(height: 12),
                    _label('Daily Price (UGX/kg) *'),
                    AppFormField(
                      hint: 'e.g. 4500',
                      controller: _priceCtrl,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 16),
                    _label('Loan Deduction (UGX)'),
                    AppFormField(
                      controller: _loanDeductionCtrl,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 16),
                    _label('Input Deduction (UGX)'),
                    AppFormField(
                      controller: _inputDeductionCtrl,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('MoMo Charges'),
                              AppFormField(
                                controller: _momoChargesCtrl,
                                keyboardType: TextInputType.number,
                                onChanged: (_) => setState(() {}),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _label('MoMo Tax'),
                              AppFormField(
                                controller: _momoTaxCtrl,
                                keyboardType: TextInputType.number,
                                onChanged: (_) => setState(() {}),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    _calculationSummary(),
                    const SizedBox(height: 24),
                    Text(
                      'The purchase is saved as PENDING and goes to the Approval Hub on the web platform for payment approval.',
                      style: TextStyleConstant.robotoW400(
                        fontSize: 11,
                        color: ColorConstant.text79.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: AppButton(
                title: 'Record Purchase',
                height: 46,
                onTap: _saving ? null : _submit,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── widgets ──────────────────────────────────────────────────────────────

  Widget _label(String text) => EkibboLabel(text);

  Widget _sectionTitle(String text) => EkibboSectionTitle(text);

  Widget _farmerPicker() {
    return InkWell(
      onTap: _pickFarmer,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            decoration: BoxDecoration(
              color: ColorConstant.grayF6F7F9,
              borderRadius: BorderRadius.circular(8),
              border: _farmerError != null
                  ? Border.all(color: Colors.redAccent)
                  : null,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    _farmerName.isEmpty ? 'Select farmer' : _farmerName,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 14,
                      color: _farmerName.isEmpty
                          ? ColorConstant.text79.withOpacity(0.5)
                          : ColorConstant.text79,
                    ),
                  ),
                ),
                const Icon(Icons.search, size: 20),
              ],
            ),
          ),
          if (_farmerError != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                _farmerError!,
                style: TextStyleConstant.robotoW400(
                  fontSize: 11,
                  color: Colors.redAccent,
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Dependent dropdown: the form list follows the selected commodity.
  Widget _formPicker(List<String> forms, String? selectedForm) {
    return InkWell(
      onTap: () => _showPickerSheet(
        forms,
        'Select form',
        (i) => setState(() => _form = forms[i]),
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: ColorConstant.grayF6F7F9,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                selectedForm ?? 'Select form',
                style: TextStyleConstant.robotoW400(
                  fontSize: 14,
                  color: selectedForm == null
                      ? ColorConstant.text79.withOpacity(0.5)
                      : ColorConstant.text79,
                ),
              ),
            ),
            const Icon(Icons.arrow_drop_down, size: 22),
          ],
        ),
      ),
    );
  }

  void _showPickerSheet(
    List<String> items,
    String title,
    ValueChanged<int> onChanged,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                title,
                style: TextStyleConstant.quicksandW700(fontSize: 15),
              ),
            ),
            ...items.asMap().entries.map(
                  (e) => ListTile(
                    dense: true,
                    title: Text(
                      e.value,
                      style: TextStyleConstant.robotoW400(fontSize: 14),
                    ),
                    onTap: () {
                      onChanged(e.key);
                      Navigator.of(ctx).pop();
                    },
                  ),
                ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _calculationSummary() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColorConstant.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.primary.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Calculated Payment',
            style: TextStyleConstant.quicksandW700(
              fontSize: 14,
              color: ColorConstant.primary,
            ),
          ),
          const SizedBox(height: 12),
          _calcRow('Total Weight', '${_totalWeight.toStringAsFixed(2)} kg'),
          _calcRow(
              'Moisture Deduction', '${_moistureDeduction.toStringAsFixed(2)} kg'),
          _calcRow('Net Weight', '${_netWeight.toStringAsFixed(2)} kg'),
          _calcRow('Purchase Total', _fmtUGX(_purchaseTotal)),
          _calcRow('Total Deductions',
              _fmtUGX(_loanDeduction + _inputDeduction + _momoCharges + _momoTax)),
          const Divider(height: 20),
          _calcRow('Net Payment to Farmer', _fmtUGX(_netPayment),
              emphasized: true),
        ],
      ),
    );
  }

  Widget _calcRow(String label, String value, {bool emphasized = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79.withOpacity(0.8),
            ),
          ),
          Text(
            value,
            style: emphasized
                ? TextStyleConstant.quicksandW700(
                    fontSize: 14,
                    color: ColorConstant.primary,
                  )
                : TextStyleConstant.robotoW600(
                    fontSize: 12,
                    color: ColorConstant.text79,
                  ),
          ),
        ],
      ),
    );
  }
}
