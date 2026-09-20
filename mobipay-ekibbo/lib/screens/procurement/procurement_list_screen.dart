import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/empty_state.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:mobipay_ekibbo/screens/farmers/farmers_list_screen.dart'
    show AppSearchField;

/// EKiBBO Procurement list screen (Screen 13).
///
/// Fetches `/api/purchases?limit=100` and displays purchase cards with:
///   - Commodity (Coffee/Cocoa/etc.)
///   - Farmer name (nested farmer.firstName + lastName or farmerName string)
///   - Quantity + unit
///   - Total amount (UGX)
///   - Status badge (PENDING/APPROVED/REJECTED)
///   - Approval status badge (DRAFT/SUBMITTED/APPROVED/REJECTED)
///   - Purchase date
///   - Coffee form badge (Fresh/Kiboko/FAQ) when present
///
/// Tapping a card expands it inline (ExpansionTile-style) to show extra fields:
///   - moistureReading, defectCount, qualityDeduction
///   - netWeight, dailyPrice
///   - loanDeduction, inputDeduction, momoCharges, netPayment
///
/// Features:
///   - Search by farmer name or commodity (debounced 500ms)
///   - Pull-to-refresh
///   - Empty state with "Add Procurement" CTA (shows coming-soon snackbar)
///   - Add-procurement FAB → snackbar "Coming soon — use the web app"
///   - 401 → clear session + go to /login
class ProcurementListScreen extends StatefulWidget {
  const ProcurementListScreen({super.key});

  @override
  State<ProcurementListScreen> createState() => _ProcurementListScreenState();
}

class _ProcurementListScreenState extends State<ProcurementListScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  Timer? _debounce;

  List<Map<String, dynamic>> _purchases = [];
  bool _loading = true;
  String? _error;
  int _total = 0;

  /// When non-null, the card with that id is expanded inline.
  String? _expandedId;

  @override
  void initState() {
    super.initState();
    _loadPurchases();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _loadPurchases() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = '/api/purchases?limit=100'
          '&search=${Uri.encodeComponent(_searchCtrl.text.trim())}';
      final res = await ApiClient().get(query);
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode != 200) {
        if (!mounted) return;
        setState(() {
          _error = '${AppLang.local.load_failed} (HTTP ${res.statusCode})';
          _loading = false;
        });
        return;
      }
      final body = jsonDecode(res.body);
      // Backend may return either `{data: [...]}`, `{purchases: [...]}` or
      // an unwrapped list. Handle all three defensively.
      List<dynamic> list;
      if (body is List) {
        list = body;
      } else if (body is Map) {
        final raw = body['data'] ?? body['purchases'] ?? body['items'] ?? [];
        list = raw is List ? raw : [];
      } else {
        list = [];
      }
      final parsed = list
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      if (!mounted) return;
      setState(() {
        _purchases = parsed;
        _total = (body is Map)
            ? ((body['total'] as num?)?.toInt() ?? parsed.length)
            : parsed.length;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '${AppLang.local.load_failed} ($e)';
        _loading = false;
      });
    }
  }

  Future<void> _handleUnauthorized() async {
    await ApiClient().clearSession();
    ApiClient().clearAuth();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.session_expired),
        backgroundColor: ColorConstant.danger,
      ),
    );
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), _loadPurchases);
  }

  Future<void> _onRefresh() => _loadPurchases();

  void _showAddComingSoon() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.procurement_add_coming_soon),
        backgroundColor: ColorConstant.info,
      ),
    );
  }

  // ─── Field accessors (defensive JSON casting) ────────────────────────────
  String _str(dynamic v) => v == null ? '' : v.toString();

  String _id(Map<String, dynamic> p) => _str(p['id'] ?? p['_id']);

  String _commodity(Map<String, dynamic> p) =>
      _str(p['commodity'] ?? p['commodityType'] ?? p['produceType']);

  String _farmerName(Map<String, dynamic> p) {
    final f = p['farmer'];
    if (f is Map) {
      final first = _str(f['firstName']);
      final last = _str(f['lastName']);
      final name = '$first $last'.trim();
      if (name.isNotEmpty) return name;
      final altName = _str(f['name'] ?? f['fullName']);
      if (altName.isNotEmpty) return altName;
    }
    return _str(p['farmerName']);
  }

  double _amount(dynamic v) {
    if (v is num) return v.toDouble();
    return double.tryParse(_str(v)) ?? 0.0;
  }

  int _int(dynamic v) {
    if (v is num) return v.toInt();
    return int.tryParse(_str(v)) ?? 0;
  }

  double _quantity(Map<String, dynamic> p) =>
      _amount(p['quantity'] ?? p['weightKg'] ?? p['grossWeight']);

  String _unit(Map<String, dynamic> p) {
    final u = _str(p['unit'] ?? p['quantityUnit']);
    if (u.isNotEmpty) return u;
    // Default to kg for coffee purchases (EKiBBO context).
    return 'kg';
  }

  double _totalAmount(Map<String, dynamic> p) =>
      _amount(p['totalAmount'] ?? p['total'] ?? p['grossAmount']);

  String _status(Map<String, dynamic> p) =>
      _str(p['status']).toUpperCase();

  String _approvalStatus(Map<String, dynamic> p) =>
      _str(p['approvalStatus'] ?? p['approvalState']).toUpperCase();

  String _coffeeForm(Map<String, dynamic> p) =>
      _str(p['coffeeForm'] ?? p['coffeeType']);

  String _date(Map<String, dynamic> p) =>
      _str(p['date'] ?? p['purchaseDate'] ?? p['createdAt']);

  double _netPayment(Map<String, dynamic> p) =>
      _amount(p['netPayment'] ?? p['netAmount']);

  String _formatDate(String iso) {
    if (iso.isEmpty) return '—';
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/'
          '${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }

  String _formatUgx(double v) {
    // Group with thousands separators (no decimals for currency).
    final s = v.toInt().abs().toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    final prefix = v < 0 ? '-' : '';
    return 'UGX $prefix${buf.toString()}';
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'APPROVED':
        return ColorConstant.success;
      case 'REJECTED':
        return ColorConstant.danger;
      case 'PENDING':
      default:
        return ColorConstant.warning;
    }
  }

  Color _approvalColor(String s) {
    switch (s) {
      case 'APPROVED':
        return ColorConstant.success;
      case 'REJECTED':
        return ColorConstant.danger;
      case 'SUBMITTED':
        return ColorConstant.info;
      case 'DRAFT':
      default:
        return ColorConstant.textSecondary;
    }
  }

  Color _coffeeFormColor(String s) {
    final lower = s.toLowerCase();
    if (lower.contains('fresh')) return ColorConstant.danger;
    if (lower.contains('kiboko')) return ColorConstant.primary;
    if (lower.contains('faq')) return ColorConstant.gold;
    return ColorConstant.secondary;
  }

  String _coffeeFormLabel(String s) {
    final lower = s.toLowerCase();
    if (lower.contains('fresh')) return AppLang.local.fresh_cherry;
    if (lower.contains('kiboko')) return AppLang.local.kiboko;
    if (lower.contains('faq')) return AppLang.local.faq;
    return s;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: AppLang.local.procurement_list,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            tooltip: AppLang.local.search,
            onPressed: () => _searchFocus.requestFocus(),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(child: _buildBody()),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: ColorConstant.primary,
        foregroundColor: Colors.white,
        onPressed: _showAddComingSoon,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: ColorConstant.surface,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      child: AppSearchField(
        controller: _searchCtrl,
        focusNode: _searchFocus,
        onChanged: _onSearchChanged,
        hint: AppLang.local.search_procurement_hint,
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return _buildErrorState();
    }
    if (_purchases.isEmpty) {
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            EmptyState(
              title: AppLang.local.no_procurement_title,
              description: AppLang.local.no_procurement_desc,
              icon: Icons.shopping_basket_outlined,
              color: ColorConstant.primary,
              actionTitle: AppLang.local.add_procurement,
              onAction: _showAddComingSoon,
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
        itemCount: _purchases.length,
        itemBuilder: (_, i) => _buildPurchaseCard(_purchases[i]),
      ),
    );
  }

  Widget _buildPurchaseCard(Map<String, dynamic> p) {
    final id = _id(p);
    final commodity = _commodity(p);
    final farmerName = _farmerName(p);
    final qty = _quantity(p);
    final unit = _unit(p);
    final total = _totalAmount(p);
    final status = _status(p);
    final approval = _approvalStatus(p);
    final coffeeForm = _coffeeForm(p);
    final date = _formatDate(_date(p));
    final expanded = _expandedId == id;

    return Card(
      color: ColorConstant.surface,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: ColorConstant.grayEB),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          setState(() {
            _expandedId = expanded ? null : id;
          });
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: ColorConstant.primary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.shopping_basket,
                        color: ColorConstant.primary, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          commodity.isEmpty
                              ? '(Unknown commodity)'
                              : commodity,
                          style: TextStyleConstant.robotoW600(
                            fontSize: 14,
                            color: ColorConstant.heading,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.person_outline,
                                size: 12, color: ColorConstant.textSecondary),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                farmerName.isEmpty ? '—' : farmerName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyleConstant.robotoW400(
                                  fontSize: 11,
                                  color: ColorConstant.text79,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  if (status.isNotEmpty)
                    _badge(status, _statusColor(status)),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  _badge(
                    '${qty.toStringAsFixed(qty == qty.toInt() ? 0 : 2)} $unit',
                    ColorConstant.secondary,
                    icon: Icons.scale_outlined,
                  ),
                  _badge(
                    _formatUgx(total),
                    ColorConstant.gold,
                    icon: Icons.payments_outlined,
                  ),
                  _badge(date, ColorConstant.primary,
                      icon: Icons.calendar_today_outlined),
                  if (approval.isNotEmpty)
                    _badge(approval, _approvalColor(approval)),
                  if (coffeeForm.isNotEmpty)
                    _badge(
                        _coffeeFormLabel(coffeeForm), _coffeeFormColor(coffeeForm)),
                ],
              ),
              if (expanded) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: ColorConstant.grayF6F7F9,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _detailRow(AppLang.local.commodity, commodity),
                      if (farmerName.isNotEmpty)
                        _detailRow(AppLang.local.farmer, farmerName),
                      _detailRow(
                          AppLang.local.quantity,
                          '${qty.toStringAsFixed(qty == qty.toInt() ? 0 : 2)} $unit'),
                      _detailRow(
                          AppLang.local.total_amount, _formatUgx(total)),
                      if (approval.isNotEmpty)
                        _detailRow(AppLang.local.approval_status, approval),
                      _detailRow(AppLang.local.procurement_date, date),
                      if (coffeeForm.isNotEmpty)
                        _detailRow(
                            AppLang.local.crop, _coffeeFormLabel(coffeeForm)),
                      _detailRow(
                          AppLang.local.moisture_reading,
                          '${_amount(p['moistureReading'] ?? p['moisture']).toStringAsFixed(1)} %'),
                      _detailRow(AppLang.local.defect_count,
                          _int(p['defectCount'] ?? p['defects']).toString()),
                      _detailRow(
                          AppLang.local.quality_deduction,
                          _formatUgx(
                              _amount(p['qualityDeduction'] ?? p['quality']))),
                      _detailRow(
                          AppLang.local.net_weight,
                          '${_amount(p['netWeight']).toStringAsFixed(2)} $unit'),
                      _detailRow(AppLang.local.daily_price,
                          _formatUgx(_amount(p['dailyPrice']))),
                      _detailRow(
                          AppLang.local.loan_deduction,
                          _formatUgx(_amount(p['loanDeduction'] ?? p['loan']))),
                      _detailRow(
                          AppLang.local.input_deduction,
                          _formatUgx(_amount(p['inputDeduction'] ?? p['input']))),
                      _detailRow(AppLang.local.momo_charges,
                          _formatUgx(_amount(p['momoCharges'] ?? p['momo']))),
                      _detailRow(AppLang.local.net_payment,
                          _formatUgx(_netPayment(p))),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyleConstant.robotoW500(
                fontSize: 11,
                color: ColorConstant.textSecondary,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value.isEmpty ? '—' : value,
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _badge(String text, Color color, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: color),
            const SizedBox(width: 2),
          ],
          Text(
            text,
            style: TextStyleConstant.robotoW500(
              fontSize: 10,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 48, color: ColorConstant.danger),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadPurchases,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}
