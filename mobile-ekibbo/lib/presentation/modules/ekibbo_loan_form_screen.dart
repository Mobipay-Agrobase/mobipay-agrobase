// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_ekibbo_modules.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_module_form_widgets.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Loan Application create/edit (web LoanApplication CRUD parity).
///
/// Fields: loan product (from the web LoanProduct master), farmer (picker —
/// prefills applicant name/phone), amount, purpose, status.
/// New applications default to PENDING, same as the web form.
/// ─────────────────────────────────────────────────────────────────────────
class EkibboLoanFormScreen extends StatefulWidget {
  const EkibboLoanFormScreen({super.key, this.id});

  /// Numeric id of the loan to edit; null → create mode.
  final int? id;

  @override
  State<EkibboLoanFormScreen> createState() => _EkibboLoanFormScreenState();
}

class _EkibboLoanFormScreenState extends State<EkibboLoanFormScreen> {
  static const loanStatuses = [
    'PENDING',
    'LEVEL1_APPROVED',
    'LEVEL2_APPROVED',
    'APPROVED',
    'DISBURSED',
    'REJECTED',
    'COMPLETED',
    'OVERDUE',
  ];

  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _purposeCtrl = TextEditingController();

  /// Loan products from the web LoanProduct master:
  /// {id, name, interest_rate, max_amount, min_amount, max_duration_months}
  List<Map<String, dynamic>> _products = [];
  int? _productIndex;
  int _statusIndex = 0;
  bool _saving = false;
  bool _loading = true;

  int _farmerId = 0;
  String _farmerName = '';

  bool get _isEdit => widget.id != null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _amountCtrl.dispose();
    _purposeCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final products = await ApiEkibboModules.loanProducts();
      if (!mounted) return;
      setState(() => _products = products);
      if (_isEdit) {
        await _loadDetail();
      } else {
        setState(() => _loading = false);
      }
    } catch (e) {
      if (mounted) {
        DialogHelper.showToast(context, 'Could not load loan products: $e');
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loadDetail() async {
    try {
      final d = await ApiEkibboModules.detail('loans', widget.id!);
      if (!mounted) return;
      if (d == null) {
        setState(() => _loading = false);
        return;
      }
      _nameCtrl.text = (d['applicant_name'] ?? '').toString();
      _phoneCtrl.text = (d['applicant_phone'] ?? '').toString();
      _amountCtrl.text = (d['amount'] ?? '').toString();
      _purposeCtrl.text = (d['purpose'] ?? '').toString();
      _farmerId = (d['farmer_id'] ?? 0) as int;
      _farmerName = _nameCtrl.text;
      final productId = (d['loan_product_id'] ?? 0) as int;
      if (productId != 0) {
        _productIndex = _products.indexWhere((p) => p['id'] == productId);
        if (_productIndex! < 0) _productIndex = null;
      }
      _statusIndex = loanStatuses.indexOf((d['status'] ?? '').toString());
      if (_statusIndex < 0) _statusIndex = 0;
      setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        DialogHelper.showToast(context, e.toString());
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _pickFarmer() async {
    final res = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) =>
            ScreenSearchFarmer(argument: ArgumentScreenSearchFarmer()),
      ),
    );
    if (res is ArgumentScreenSearchFarmer && mounted) {
      setState(() {
        _farmerId = res.farmerId;
        _farmerName = res.farmerSelected;
        // Prefill the applicant fields with the picked farmer.
        _nameCtrl.text = res.farmerSelected;
        _phoneCtrl.text = res.farmerPhone;
      });
    }
  }

  Future<void> _deleteLoan() {
    return DialogHelper.showOkDialog(
      context,
      'Delete this loan application? This cannot be undone.',
      isCancel: true,
      titleOK: 'Delete',
      okAction: () async {
        try {
          DialogHelper.showLoading();
          await ApiEkibboModules.delete('loans', widget.id!);
          DialogHelper.hideLoading();
          if (!mounted) return;
          Navigator.of(context).pop(true);
        } catch (e) {
          DialogHelper.hideLoading();
          DialogHelper.showToast(context, e.toString());
        }
      },
    );
  }

  Future<void> _submit() async {
    if (_productIndex == null) {
      DialogHelper.showToast(context, 'Please choose a loan product');
      return;
    }
    if (_nameCtrl.text.trim().isEmpty) {
      DialogHelper.showToast(context, 'Please enter the applicant name');
      return;
    }
    final amount = double.tryParse(_amountCtrl.text.trim());
    if (amount == null || amount <= 0) {
      DialogHelper.showToast(context, 'Please enter a valid amount');
      return;
    }
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'loan_product_id': _products[_productIndex!]['id'],
      'farmer_id': _farmerId == 0 ? null : _farmerId,
      'applicant_name': _nameCtrl.text.trim(),
      'applicant_phone': _phoneCtrl.text.trim(),
      'amount': amount,
      'purpose': _purposeCtrl.text.trim(),
      'status': loanStatuses[_statusIndex],
    };
    try {
      DialogHelper.showLoading();
      if (_isEdit) {
        await ApiEkibboModules.update('loans', widget.id!, body);
      } else {
        await ApiEkibboModules.create('loans', body);
      }
      DialogHelper.hideLoading();
      if (!mounted) return;
      DialogHelper.showToastSuccess(
          context, message: _isEdit ? 'Loan application updated' : 'Loan application created');
      Navigator.of(context).pop(true);
    } catch (e) {
      DialogHelper.hideLoading();
      DialogHelper.showToast(context, e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: _isEdit ? 'Edit Loan Application' : 'New Loan Application',
        color: ColorConstant.primary,
        titleColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ColorConstant.primary))
          : SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const EkibboLabel('Loan Product *'),
                          if (_products.isEmpty)
                            Text(
                              'No loan products configured for your organisation yet. An admin must create them on the web platform first (Loans → Products).',
                              style: TextStyleConstant.robotoW400(
                                fontSize: 12,
                                color: ColorConstant.text79,
                              ),
                            )
                          else
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                EkibboDropdown(
                                  items: _products
                                      .map((p) => (p['name'] ?? '').toString())
                                      .toList(),
                                  selectedIndex: _productIndex ?? 0,
                                  onChanged: (i) =>
                                      setState(() => _productIndex = i),
                                ),
                                if (_productIndex != null) ...[
                                  const SizedBox(height: 6),
                                  _productHint(_products[_productIndex!]),
                                ],
                              ],
                            ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Farmer (applicant)'),
                          InkWell(
                            onTap: _pickFarmer,
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: ColorConstant.grayF6F7F9,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      _farmerName.isEmpty
                                          ? 'Tap to choose a farmer'
                                          : _farmerName,
                                      style: TextStyleConstant.robotoW400(
                                        fontSize: 14,
                                        color: _farmerName.isEmpty
                                            ? ColorConstant.text79.withOpacity(0.6)
                                            : Colors.black,
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.chevron_right, size: 20),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Applicant Name *'),
                          AppFormField(hint: 'Full name', controller: _nameCtrl),
                          const SizedBox(height: 16),
                          const EkibboLabel('Applicant Phone'),
                          AppFormField(
                            hint: 'e.g. 700111222',
                            controller: _phoneCtrl,
                            keyboardType: TextInputType.phone,
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Amount (UGX) *'),
                          AppFormField(
                            hint: 'e.g. 500000',
                            controller: _amountCtrl,
                            keyboardType: TextInputType.number,
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Purpose'),
                          AppFormField(
                            hint: 'e.g. Buying seed and fertilizer',
                            controller: _purposeCtrl,
                            maxLines: 2,
                          ),
                          if (_isEdit) ...[
                            const SizedBox(height: 16),
                            const EkibboLabel('Status'),
                            EkibboDropdown(
                              items: loanStatuses,
                              selectedIndex: _statusIndex,
                              onChanged: (i) => setState(() => _statusIndex = i),
                            ),
                          ],
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        AppButton(
                          title: _isEdit ? 'Save Changes' : 'Submit Application',
                          height: 46,
                          onTap: _saving ? null : _submit,
                        ),
                        if (_isEdit) ...[
                          const SizedBox(height: 12),
                          AppButton(
                            title: 'Delete Loan Application',
                            height: 44,
                            color: Colors.white,
                            borderColor: Colors.red,
                            titleStyle: TextStyleConstant.quicksandW600(
                              fontSize: 14,
                              color: Colors.red,
                            ),
                            onTap: _deleteLoan,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _productHint(Map<String, dynamic> p) {
    final rate = p['interest_rate'];
    final min = p['min_amount'];
    final max = p['max_amount'];
    final months = p['max_duration_months'];
    final parts = <String>[
      if (rate != null) '$rate% interest',
      if (min != null && max != null)
        'UGX ${_fmt(min)} – ${_fmt(max)}',
      if (months != null) 'up to $months months',
    ];
    if (parts.isEmpty) return const SizedBox.shrink();
    return Text(
      parts.join(' · '),
      style: TextStyleConstant.robotoW400(
        fontSize: 11,
        color: ColorConstant.text79,
      ),
    );
  }

  String _fmt(dynamic n) {
    final v = num.tryParse(n.toString());
    if (v == null) return n.toString();
    return v.toInt().toString().replaceAllMapped(
        RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');
  }
}
