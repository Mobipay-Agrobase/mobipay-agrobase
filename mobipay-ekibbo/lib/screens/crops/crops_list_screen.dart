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

/// EKiBBO Crops list screen (Screen 7).
///
/// Fetches `/api/cultivations?limit=100` and displays crop cards across all
/// farm lands in the tenant. Each card shows crop name, variety badge, season
/// badge, area (ha), plant count, status (Active/Harvested), and the parent
/// farm land + farmer name. Tapping a card expands it inline (acting as a
/// simple detail view), since no dedicated crop detail screen exists yet.
///
/// Features:
///   - Search by crop name (debounced 500ms)
///   - Pull-to-refresh
///   - Empty state with "Add Crop" CTA (links to Farm Lands list so the user
///     can pick a plot, since cultivations are always created from the plot
///     context)
///   - 401 → clear session + go to /login
class CropsListScreen extends StatefulWidget {
  const CropsListScreen({super.key});

  @override
  State<CropsListScreen> createState() => _CropsListScreenState();
}

class _CropsListScreenState extends State<CropsListScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  Timer? _debounce;

  List<Map<String, dynamic>> _crops = [];
  bool _loading = true;
  String? _error;

  /// Total stats from the response (kept for future header card usage).
  Map<String, dynamic> _stats = {};

  /// When non-null, the card with that id expands to show extra detail.
  String? _expandedId;

  @override
  void initState() {
    super.initState();
    _loadCrops();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _loadCrops() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = '/api/cultivations?limit=100'
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
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final list = (body['cultivations'] ?? body['data'] ?? body) as List? ?? [];
      final parsed = list
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      if (!mounted) return;
      setState(() {
        _crops = parsed;
        _stats = body['stats'] is Map
            ? Map<String, dynamic>.from(body['stats'] as Map)
            : <String, dynamic>{};
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
    _debounce = Timer(const Duration(milliseconds: 500), _loadCrops);
  }

  Future<void> _onRefresh() => _loadCrops();

  // ─── Field accessors (defensive JSON casting) ─────────────────────────────
  String _str(dynamic v) => v == null ? '' : v.toString();

  String _cropName(Map<String, dynamic> c) =>
      _str(c['cropName'] ?? c['name'] ?? c['bambooVariety']);

  String _variety(Map<String, dynamic> c) =>
      _str(c['bambooVariety'] ?? c['variety']);

  String _season(Map<String, dynamic> c) => _str(c['season']);

  int _plantCount(Map<String, dynamic> c) {
    final v = c['seedlingCount'] ?? c['plantCount'] ?? c['count'];
    if (v is num) return v.toInt();
    return int.tryParse(_str(v)) ?? 0;
  }

  double _area(Map<String, dynamic> c) {
    final v = c['areaHa'] ?? c['area'] ?? c['areaInHa'];
    if (v is num) return v.toDouble();
    return double.tryParse(_str(v)) ?? 0.0;
  }

  String _id(Map<String, dynamic> c) => _str(c['id'] ?? c['_id']);

  String _status(Map<String, dynamic> c) {
    final s = _str(c['status'] ?? c['cultivationStatus']).toLowerCase();
    if (s.isEmpty) return 'active';
    return s;
  }

  String _farmLandName(Map<String, dynamic> c) {
    // Backend may populate farm as nested object or just farmId.
    final farm = c['farm'];
    if (farm is Map) {
      return _str(farm['name'] ?? farm['plotName'] ?? farm['farmName']);
    }
    return _str(c['farmName'] ?? c['plotName']);
  }

  String _farmerName(Map<String, dynamic> c) {
    final farm = c['farm'];
    if (farm is Map) {
      final farmer = farm['farmer'];
      if (farmer is Map) {
        final first = _str(farmer['firstName']);
        final last = _str(farmer['lastName']);
        final name = '$first $last'.trim();
        if (name.isNotEmpty) return name;
      }
    }
    return _str(c['farmerName']);
  }

  Color _seasonColor(String s) {
    if (s.contains('A')) return ColorConstant.info;
    if (s.contains('B')) return ColorConstant.secondary;
    return ColorConstant.gold;
  }

  Color _statusColor(String s) {
    if (s == 'harvested' || s == 'completed') return ColorConstant.gold;
    return ColorConstant.success;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: AppLang.local.crops,
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
        onPressed: () {
          // Cultivations are created from the plot context — push the user
          // to the farm lands list so they can pick a plot first.
          Navigator.of(context).pushNamed(RouterName.farmLandsList);
        },
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
        hint: AppLang.local.search,
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
    if (_crops.isEmpty) {
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            EmptyState(
              title: AppLang.local.no_crops_added,
              description: AppLang.local.no_crops_desc,
              icon: Icons.grass_outlined,
              color: ColorConstant.secondary,
              actionTitle: AppLang.local.add_crop,
              onAction: () =>
                  Navigator.of(context).pushNamed(RouterName.farmLandsList),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
        itemCount: _crops.length,
        itemBuilder: (_, i) => _buildCropCard(_crops[i]),
      ),
    );
  }

  Widget _buildCropCard(Map<String, dynamic> c) {
    final id = _id(c);
    final name = _cropName(c);
    final variety = _variety(c);
    final season = _season(c);
    final count = _plantCount(c);
    final area = _area(c);
    final status = _status(c);
    final farmLandName = _farmLandName(c);
    final farmerName = _farmerName(c);
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
                      color: ColorConstant.secondary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.park,
                        color: ColorConstant.secondary, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name.isEmpty ? '(Unnamed)' : name,
                          style: TextStyleConstant.robotoW600(
                            fontSize: 14,
                            color: ColorConstant.heading,
                          ),
                        ),
                        if (farmLandName.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(Icons.landscape_outlined,
                                  size: 12,
                                  color: ColorConstant.textSecondary),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  farmLandName,
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
                        if (farmerName.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(Icons.person_outline,
                                  size: 12,
                                  color: ColorConstant.textSecondary),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  farmerName,
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
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor(status).withOpacity(0.14),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      status.isEmpty
                          ? 'active'
                          : (status[0].toUpperCase() + status.substring(1)),
                      style: TextStyleConstant.robotoW500(
                        fontSize: 10,
                        color: _statusColor(status),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  if (variety.isNotEmpty)
                    _badge(variety, ColorConstant.primary),
                  if (season.isNotEmpty)
                    _badge(season, _seasonColor(season)),
                  _badge(
                    '$count ${AppLang.local.plant_count.toLowerCase()}',
                    ColorConstant.info,
                    icon: Icons.park_outlined,
                  ),
                  if (area > 0)
                    _badge(
                      '${area.toStringAsFixed(2)} ha',
                      ColorConstant.gold,
                      icon: Icons.straighten,
                    ),
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
                      _detailRow(AppLang.local.crop, name),
                      if (variety.isNotEmpty)
                        _detailRow(AppLang.local.crop_variety, variety),
                      if (season.isNotEmpty)
                        _detailRow(AppLang.local.season, season),
                      _detailRow(
                          AppLang.local.plant_count, count.toString()),
                      if (area > 0)
                        _detailRow(AppLang.local.area_ha,
                            '${area.toStringAsFixed(2)} ha'),
                      _detailRow(AppLang.local.farm_land, farmLandName),
                      if (farmerName.isNotEmpty)
                        _detailRow(AppLang.local.farmer, farmerName),
                      _detailRow(AppLang.local.certification_status,
                          status[0].toUpperCase() + status.substring(1)),
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
            width: 100,
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
              onPressed: _loadCrops,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}
