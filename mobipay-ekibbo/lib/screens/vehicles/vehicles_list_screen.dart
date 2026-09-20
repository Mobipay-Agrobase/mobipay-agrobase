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

/// EKiBBO Vehicles list screen (Screen 18).
///
/// Fetches `/api/deliveries?limit=100` and displays each delivery as a card
/// with: driver name, vehicle reg, status badge (PENDING/IN_TRANSIT/DELIVERED),
/// dispatched + delivered dates, related type (PURCHASE/CONSIGNMENT/
/// INPUT_REQUEST).
///
/// Features:
///   - Search by driver name or vehicle reg (debounced 500ms)
///   - Pull-to-refresh
///   - Empty state with "Add Vehicle" CTA (shows coming-soon snackbar)
///   - Add-vehicle FAB → snackbar "Coming soon — use the web app"
///   - 401 → clear session + go to /login
class VehiclesListScreen extends StatefulWidget {
  const VehiclesListScreen({super.key});

  @override
  State<VehiclesListScreen> createState() => _VehiclesListScreenState();
}

class _VehiclesListScreenState extends State<VehiclesListScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  Timer? _debounce;

  List<Map<String, dynamic>> _deliveries = [];
  bool _loading = true;
  String? _error;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadDeliveries();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _loadDeliveries() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = '/api/deliveries?limit=100'
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
      // Backend may return either `{data: [...]}`, `{deliveries: [...]}` or
      // an unwrapped list. Handle all defensively.
      List<dynamic> list;
      if (body is List) {
        list = body;
      } else if (body is Map) {
        final raw = body['data'] ?? body['deliveries'] ?? body['items'] ?? [];
        list = raw is List ? raw : [];
      } else {
        list = [];
      }
      final parsed = list
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      if (!mounted) return;
      setState(() {
        _deliveries = parsed;
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
    _debounce = Timer(const Duration(milliseconds: 500), _loadDeliveries);
  }

  Future<void> _onRefresh() => _loadDeliveries();

  void _showAddComingSoon() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.vehicle_add_coming_soon),
        backgroundColor: ColorConstant.info,
      ),
    );
  }

  // ─── Field accessors (defensive JSON casting) ────────────────────────────
  String _str(dynamic v) => v == null ? '' : v.toString();

  String _id(Map<String, dynamic> d) => _str(d['id'] ?? d['_id']);

  String _driverName(Map<String, dynamic> d) {
    final driver = d['driver'];
    if (driver is Map) {
      final first = _str(driver['firstName'] ?? driver['name']);
      final last = _str(driver['lastName']);
      final name = '$first $last'.trim();
      if (name.isNotEmpty) return name;
    }
    return _str(d['driverName'] ?? d['driver']);
  }

  String _driverPhone(Map<String, dynamic> d) =>
      _str(d['driverPhone'] ?? d['driverPhoneNumber']);

  String _vehicleReg(Map<String, dynamic> d) =>
      _str(d['vehicleReg'] ?? d['vehicleRegistration'] ?? d['vehicleNumber']);

  String _vehicleType(Map<String, dynamic> d) =>
      _str(d['vehicleType'] ?? d['vehicle']);

  String _status(Map<String, dynamic> d) =>
      _str(d['status']).toUpperCase();

  String _relatedType(Map<String, dynamic> d) =>
      _str(d['relatedType'] ?? d['sourceType']).toUpperCase();

  String _dispatchedAt(Map<String, dynamic> d) =>
      _str(d['dispatchedAt'] ?? d['dispatchDate'] ?? d['createdAt']);

  String _deliveredAt(Map<String, dynamic> d) =>
      _str(d['deliveredAt'] ?? d['deliveryDate']);

  String _formatDate(String iso) {
    if (iso.isEmpty) return '—';
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/'
          '${d.month.toString().padLeft(2, '0')}/${d.year} '
          '${d.hour.toString().padLeft(2, '0')}:'
          '${d.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'DELIVERED':
        return ColorConstant.success;
      case 'IN_TRANSIT':
        return ColorConstant.info;
      case 'PENDING':
      default:
        return ColorConstant.warning;
    }
  }

  Color _relatedColor(String s) {
    switch (s) {
      case 'PURCHASE':
        return ColorConstant.primary;
      case 'CONSIGNMENT':
        return ColorConstant.gold;
      case 'INPUT_REQUEST':
        return ColorConstant.secondary;
      default:
        return ColorConstant.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: AppLang.local.vehicles_list,
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
        child: const Icon(Icons.local_shipping),
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
        hint: AppLang.local.search_vehicles_hint,
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
    if (_deliveries.isEmpty) {
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            EmptyState(
              title: AppLang.local.no_vehicles_title,
              description: AppLang.local.no_vehicles_desc,
              icon: Icons.local_shipping_outlined,
              color: ColorConstant.primary,
              actionTitle: AppLang.local.add_vehicle,
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
        itemCount: _deliveries.length,
        itemBuilder: (_, i) => _buildDeliveryCard(_deliveries[i]),
      ),
    );
  }

  Widget _buildDeliveryCard(Map<String, dynamic> d) {
    final driver = _driverName(d);
    final phone = _driverPhone(d);
    final reg = _vehicleReg(d);
    final type = _vehicleType(d);
    final status = _status(d);
    final related = _relatedType(d);
    final dispatched = _formatDate(_dispatchedAt(d));
    final delivered = _formatDate(_deliveredAt(d));

    return Card(
      color: ColorConstant.surface,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: ColorConstant.grayEB),
      ),
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
                  child: const Icon(Icons.local_shipping,
                      color: ColorConstant.primary, size: 22),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        reg.isEmpty ? '(Unregistered)' : reg,
                        style: TextStyleConstant.robotoW600(
                          fontSize: 14,
                          color: ColorConstant.heading,
                        ),
                        maxLines: 1,
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
                              driver.isEmpty ? '—' : driver,
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
                if (type.isNotEmpty)
                  _badge(type, ColorConstant.secondary,
                      icon: Icons.local_shipping_outlined),
                if (related.isNotEmpty)
                  _badge(related, _relatedColor(related)),
                _badge(dispatched, ColorConstant.primary,
                    icon: Icons.calendar_today_outlined),
                if (delivered != '—')
                  _badge(delivered, ColorConstant.success,
                      icon: Icons.check_circle_outline),
              ],
            ),
            if (phone.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.phone,
                      size: 12, color: ColorConstant.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    phone,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 11,
                      color: ColorConstant.text79,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
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
              onPressed: _loadDeliveries,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}
