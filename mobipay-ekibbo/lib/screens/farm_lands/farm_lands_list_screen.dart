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

/// EKiBBO Farm Lands list screen (Screen 3).
///
/// Fetches `/api/farm-lands?limit=100` and displays farm cards: name, farmer
/// name, size (ha), location (lat/lng or village), ownership badge, crops
/// count. Tap card → /farm_land_detail route with farmLandId argument.
/// Supports search (by farm name or farmer name) and pull-to-refresh.
class FarmLandsListScreen extends StatefulWidget {
  const FarmLandsListScreen({super.key, this.initialFarmerId});

  /// Optional farmerId used to pre-filter the list (e.g. when navigated from
  /// a Farmer detail screen → "View Farm Lands").
  final String? initialFarmerId;

  @override
  State<FarmLandsListScreen> createState() => _FarmLandsListScreenState();
}

class _FarmLandsListScreenState extends State<FarmLandsListScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  Timer? _debounce;

  List<Map<String, dynamic>> _farms = [];
  bool _loading = true;
  String? _error;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadFarms();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadFarms() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // Build query — server may accept farmerId filter, search, limit.
      final params = <String>['limit=100'];
      if (widget.initialFarmerId != null &&
          widget.initialFarmerId!.isNotEmpty) {
        params.add('farmerId=${widget.initialFarmerId}');
      }
      if (_searchCtrl.text.trim().isNotEmpty) {
        params.add('search=${Uri.encodeComponent(_searchCtrl.text.trim())}');
      }
      final res = await ApiClient().get('/api/farm-lands?${params.join('&')}');
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
      final list = (body['farms'] ?? body['farmLands'] ?? body['data']) as List? ?? [];
      final parsed = list
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      if (!mounted) return;
      setState(() {
        _farms = parsed;
        _total = (body['total'] as num?)?.toInt() ?? parsed.length;
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
    _debounce = Timer(const Duration(milliseconds: 500), _loadFarms);
  }

  String _str(dynamic v) => v == null ? '' : v.toString();

  String _farmerName(Map<String, dynamic> farm) {
    final farmer = farm['farmer'];
    if (farmer is Map) {
      final first = _str(farmer['firstName']);
      final last = _str(farmer['lastName']);
      final name = '$first $last'.trim();
      if (name.isNotEmpty) return name;
    }
    return _str(farm['farmerName'] ?? '');
  }

  Color _ownershipColor(String ownership) {
    final o = ownership.toLowerCase();
    if (o.contains('owned') || o.contains('family')) return ColorConstant.secondary;
    if (o.contains('rent') || o.contains('leased')) return ColorConstant.gold;
    if (o.contains('inherited')) return ColorConstant.info;
    if (o.contains('communal')) return ColorConstant.primaryLight;
    return ColorConstant.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(title: AppLang.local.farm_lands),
      body: Column(
        children: [
          Container(
            color: ColorConstant.surface,
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            child: TextField(
              controller: _searchCtrl,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: AppLang.local.search_farm_lands_hint,
                prefixIcon: const Icon(Icons.search,
                    color: ColorConstant.textSecondary),
                filled: true,
                fillColor: ColorConstant.grayF6F7F9,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide:
                      BorderSide(color: ColorConstant.primary, width: 1.5),
                ),
              ),
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: ColorConstant.primary,
        foregroundColor: Colors.white,
        onPressed: () {
          Navigator.of(context).pushNamed(
            RouterName.farmLandForm,
            arguments: <String, dynamic>{
              if (widget.initialFarmerId != null)
                'farmerId': widget.initialFarmerId,
            },
          );
        },
        child: const Icon(Icons.add),
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
    if (_farms.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadFarms,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            EmptyState(
              title: AppLang.local.no_farm_lands_title,
              description: AppLang.local.no_farm_lands_desc,
              icon: Icons.landscape_outlined,
              actionTitle: AppLang.local.add_plot,
              onAction: () => Navigator.of(context).pushNamed(
                RouterName.farmLandForm,
                arguments: <String, dynamic>{
                  if (widget.initialFarmerId != null)
                    'farmerId': widget.initialFarmerId,
                },
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadFarms,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
        itemCount: _farms.length,
        itemBuilder: (_, i) => _buildFarmCard(_farms[i]),
      ),
    );
  }

  Widget _buildFarmCard(Map<String, dynamic> farm) {
    final name = _str(farm['name'] ?? farm['plotName'] ?? farm['farmName']);
    final farmerName = _farmerName(farm);
    final size = (farm['sizeHa'] as num?)?.toDouble() ??
        (farm['size'] as num?)?.toDouble() ??
        (farm['areaHa'] as num?)?.toDouble();
    final lat = (farm['latitude'] as num?)?.toDouble();
    final lng = (farm['longitude'] as num?)?.toDouble();
    final village = _str(farm['villageName'] ?? farm['village']);
    final ownership = _str(farm['ownership'] ?? farm['landOwnership']);
    final cultivations = farm['cultivations'];
    final cropCount = cultivations is List ? cultivations.length : 0;
    final id = _str(farm['id'] ?? farm['_id']);

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
          Navigator.of(context).pushNamed(
            RouterName.farmLandDetail,
            arguments: id,
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: ColorConstant.secondary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.landscape,
                        color: ColorConstant.secondary, size: 20),
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
                        if (farmerName.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            farmerName,
                            style: TextStyleConstant.robotoW400(
                              fontSize: 11,
                              color: ColorConstant.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (ownership.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _ownershipColor(ownership).withOpacity(0.14),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        ownership,
                        style: TextStyleConstant.robotoW500(
                          fontSize: 10,
                          color: _ownershipColor(ownership),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 12,
                runSpacing: 6,
                children: [
                  _metaChip(
                    Icons.straighten,
                    size != null
                        ? '${AppLang.local.size_ha}: ${size.toStringAsFixed(2)}'
                        : '${AppLang.local.size_ha}: —',
                  ),
                  _metaChip(
                    Icons.spa_outlined,
                    '${AppLang.local.crops_count}: $cropCount',
                  ),
                  if (lat != null && lng != null)
                    _metaChip(
                      Icons.location_on_outlined,
                      '${AppLang.local.lat_lng}: ${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}',
                    )
                  else if (village.isNotEmpty)
                    _metaChip(
                      Icons.location_on_outlined,
                      village,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _metaChip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: ColorConstant.textSecondary),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyleConstant.robotoW400(
            fontSize: 11,
            color: ColorConstant.text79,
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: ColorConstant.danger),
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
              onPressed: _loadFarms,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}
