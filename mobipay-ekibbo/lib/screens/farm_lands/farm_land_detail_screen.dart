import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/info_field.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:mobipay_ekibbo/screens/farm_lands/widgets/crops_per_plot_tab.dart';

/// EKiBBO Farm Land detail screen (Screen 4).
///
/// Fetches `/api/farm-lands/<id>` and displays the farm profile across 4 tabs:
///   1. Overview        — location details, physical features, access map, soil
///   2. Crops per Plot  — embedded `CropsPerPlotTab` (Screen 5) for inline CRUD
///   3. Soil & Irrigation
///   4. Labour
///
/// Hero card shows name, farmer name, size (ha), ownership badge, GPS coords.
/// Edit → Farm Land form. Delete → confirmation → DELETE /api/farm-lands/<id>.
class FarmLandDetailScreen extends StatefulWidget {
  const FarmLandDetailScreen({super.key, required this.farmLandId});

  final String farmLandId;

  @override
  State<FarmLandDetailScreen> createState() => _FarmLandDetailScreenState();
}

class _FarmLandDetailScreenState extends State<FarmLandDetailScreen>
    with TickerProviderStateMixin {
  Map<String, dynamic>? _farm;
  bool _loading = true;
  bool _deleting = false;
  String? _error;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadFarm();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadFarm() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().get('/api/farm-lands/${widget.farmLandId}');
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
      final farm = body is Map ? (body['farm'] ?? body['farmLand'] ?? body) : null;
      if (!mounted) return;
      setState(() {
        _farm = farm is Map ? Map<String, dynamic>.from(farm) : null;
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

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLang.local.confirm_delete),
        content: Text(AppLang.local.confirm_delete_farm_land_msg),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(AppLang.local.cancel),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: ColorConstant.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(AppLang.local.delete),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    if (!mounted) return;
    setState(() => _deleting = true);
    try {
      final res =
          await ApiClient().delete('/api/farm-lands/${widget.farmLandId}');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200 || res.statusCode == 204) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.farm_land_deleted_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        Navigator.of(context).pop();
      } else {
        String err = AppLang.local.delete_failed;
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: ColorConstant.danger),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${AppLang.local.delete_failed}: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
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

  List<Map<String, dynamic>> _listOf(dynamic v) {
    if (v is! List) return const [];
    return v
        .map((e) => e is Map ? Map<String, dynamic>.from(e) : <String, dynamic>{})
        .where((e) => e.isNotEmpty)
        .toList();
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
    final farm = _farm;
    final name = farm == null ? '' : _str(farm['name'] ?? farm['plotName'] ?? farm['farmName']);

    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: name.isEmpty ? AppLang.local.farm_land : name,
        actions: [
          IconButton(
            icon: _deleting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.edit_outlined, color: Colors.white),
            tooltip: AppLang.local.edit,
            onPressed: _deleting
                ? null
                : () => Navigator.of(context).pushNamed(
                      RouterName.farmLandForm,
                      arguments: <String, dynamic>{
                        'farmLandId': widget.farmLandId,
                      },
                    ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.white),
            tooltip: AppLang.local.delete,
            onPressed: _deleting ? null : _confirmDelete,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : farm == null
                  ? _buildErrorState(empty: true)
                  : Column(
                      children: [
                        _buildHeroCard(farm),
                        Container(
                          color: ColorConstant.surface,
                          child: TabBar(
                            controller: _tabController,
                            isScrollable: true,
                            labelColor: ColorConstant.primary,
                            unselectedLabelColor: ColorConstant.textSecondary,
                            indicatorColor: ColorConstant.primary,
                            indicatorSize: TabBarIndicatorSize.label,
                            tabs: [
                              Tab(text: AppLang.local.overview),
                              Tab(text: AppLang.local.crops_per_plot),
                              Tab(text: AppLang.local.soil_irrigation),
                              Tab(text: AppLang.local.labour_tab),
                            ],
                          ),
                        ),
                        Expanded(
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _buildOverviewTab(farm),
                              CropsPerPlotTab(
                                farmLandId: widget.farmLandId,
                                initialCultivations:
                                    _listOf(farm['cultivations']),
                                onCultivationsChanged: _loadFarm,
                              ),
                              _buildSoilIrrigationTab(farm),
                              _buildLabourTab(farm),
                            ],
                          ),
                        ),
                      ],
                    ),
    );
  }

  Widget _buildHeroCard(Map<String, dynamic> farm) {
    final name = _str(farm['name'] ?? farm['plotName'] ?? farm['farmName']);
    final farmerName = _farmerName(farm);
    final size = (farm['sizeHa'] as num?)?.toDouble() ??
        (farm['size'] as num?)?.toDouble() ??
        (farm['areaHa'] as num?)?.toDouble();
    final lat = (farm['latitude'] as num?)?.toDouble();
    final lng = (farm['longitude'] as num?)?.toDouble();
    final ownership = _str(farm['ownership'] ?? farm['landOwnership']);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [ColorConstant.secondary, ColorConstant.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.landscape,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name.isEmpty ? '(Unnamed)' : name,
                      style: TextStyleConstant.quicksandW700(
                        fontSize: 16,
                        color: Colors.white,
                      ),
                    ),
                    if (farmerName.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        farmerName,
                        style: TextStyleConstant.robotoW400(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.85),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (ownership.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _ownershipColor(ownership),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    ownership,
                    style: TextStyleConstant.robotoW600(
                      fontSize: 10,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 6,
            children: [
              _heroMeta(
                Icons.straighten,
                '${AppLang.local.size_ha}: ${size != null ? size.toStringAsFixed(2) : '—'}',
              ),
              if (lat != null && lng != null)
                _heroMeta(
                  Icons.location_on_outlined,
                  '${AppLang.local.lat_lng}: ${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}',
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _heroMeta(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.white.withOpacity(0.85)),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyleConstant.robotoW500(
            fontSize: 12,
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _sectionHeader(String title) {
    return Row(
      children: [
        Text(
          title.toUpperCase(),
          style: TextStyleConstant.robotoW800(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: Container(height: 1, color: ColorConstant.grayEB)),
      ],
    );
  }

  Widget _tabScaffold(String title, List<Widget> children) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionHeader(title),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: ColorConstant.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ColorConstant.grayEB),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildOverviewTab(Map<String, dynamic> farm) {
    final village = _str(farm['villageName'] ?? farm['village']);
    final district = _str(farm['district']);
    final county = _str(farm['county']);
    final subCounty = _str(farm['subCounty'] ?? farm['sub_county']);
    final parish = _str(farm['parish']);
    final accessMap = _str(farm['accessMap'] ?? farm['approachRoad']);
    final physicalFeatures = _str(farm['physicalFeatures']);
    final ownership = _str(farm['ownership'] ?? farm['landOwnership']);
    final totalLandHolding = (farm['totalLandHolding'] as num?)?.toDouble();
    final plotArea = (farm['totalPlotArea'] as num?)?.toDouble();
    final soilFertility = _str(farm['soilFertility']);

    return _tabScaffold(AppLang.local.overview, [
      InfoField(label: AppLang.local.plot_name, value: _str(farm['name'] ?? farm['plotName'])),
      InfoField(label: AppLang.local.farmer, value: _farmerName(farm)),
      if (totalLandHolding != null)
        InfoField(
            label: AppLang.local.total_land_holding,
            value: '${totalLandHolding.toStringAsFixed(2)} ha'),
      if (plotArea != null)
        InfoField(
            label: AppLang.local.total_plot_area,
            value: '${plotArea.toStringAsFixed(2)} ha'),
      InfoField(label: AppLang.local.land_ownership, value: ownership),
      if (village.isNotEmpty)
        InfoField(label: AppLang.local.village, value: village),
      if (district.isNotEmpty)
        InfoField(label: AppLang.local.district, value: district),
      if (subCounty.isNotEmpty)
        InfoField(label: 'Sub-county', value: subCounty),
      if (county.isNotEmpty) InfoField(label: 'County', value: county),
      if (parish.isNotEmpty) InfoField(label: 'Parish', value: parish),
      InfoField(label: AppLang.local.approach_road, value: accessMap),
      InfoField(label: AppLang.local.physical_features, value: physicalFeatures),
      InfoField(label: AppLang.local.soil_fertility, value: soilFertility),
    ]);
  }

  Widget _buildSoilIrrigationTab(Map<String, dynamic> farm) {
    final fertility = _str(farm['soilFertility']);
    final irrigationType = _str(farm['irrigationType']);
    final irrigationSource = _str(farm['irrigationSource']);
    final soilAnalyses = _listOf(farm['soilAnalyses'] ?? farm['soilAnalysis']);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionHeader(AppLang.local.soil_irrigation),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: ColorConstant.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ColorConstant.grayEB),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              InfoField(label: AppLang.local.soil_fertility, value: fertility),
              InfoField(
                  label: AppLang.local.irrigation_type, value: irrigationType),
              InfoField(
                  label: AppLang.local.irrigation_source,
                  value: irrigationSource),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _sectionHeader(AppLang.local.soil_analysis),
        const SizedBox(height: 12),
        if (soilAnalyses.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: ColorConstant.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ColorConstant.grayEB),
            ),
            child: Text(
              AppLang.local.no_data_for_tab,
              style: TextStyleConstant.robotoW400(
                  fontSize: 12, color: ColorConstant.textSecondary),
              textAlign: TextAlign.center,
            ),
          )
        else
          ...soilAnalyses.map((s) => _buildSubCard(
                AppLang.local.soil_analysis,
                [
                  InfoField(
                      label: AppLang.local.soil_collection_date,
                      value: _str(s['collectionDate'])),
                  InfoField(
                      label: AppLang.local.lab_submission_date,
                      value: _str(s['labSubmissionDate'])),
                  InfoField(
                      label: AppLang.local.result_date,
                      value: _str(s['resultDate'])),
                  InfoField(
                      label: AppLang.local.samples_collected,
                      value: _intStr(s['samplesCollected'])),
                  InfoField(
                      label: AppLang.local.lab_name, value: _str(s['labName'])),
                  InfoField(
                      label: AppLang.local.report_url,
                      value: _str(s['reportUrl'])),
                ],
              )),
      ],
    );
  }

  Widget _buildLabourTab(Map<String, dynamic> farm) {
    return _tabScaffold(AppLang.local.labour_tab, [
      InfoField(
          label: AppLang.local.full_time_workers,
          value: _intStr(farm['fullTimeWorkers'])),
      InfoField(
          label: AppLang.local.part_time_workers,
          value: _intStr(farm['partTimeWorkers'])),
      InfoField(
          label: AppLang.local.seasonal_workers,
          value: _intStr(farm['seasonalWorkers'])),
      InfoField(
          label: AppLang.local.family_workers,
          value: _intStr(farm['familyWorkers'])),
    ]);
  }

  Widget _buildSubCard(String title, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.grayEB),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title.toUpperCase(),
            style: TextStyleConstant.robotoW600(
              fontSize: 11,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(height: 6),
          ...children,
        ],
      ),
    );
  }

  Widget _buildErrorState({bool empty = false}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              empty ? Icons.landscape_outlined : Icons.error_outline,
              size: 48,
              color: ColorConstant.danger,
            ),
            const SizedBox(height: 12),
            Text(
              empty
                  ? AppLang.local.no_farm_lands_title
                  : (_error ?? 'Unknown error'),
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadFarm,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }

  String _intStr(dynamic v) {
    if (v == null) return '';
    if (v is num) return v.toInt().toString();
    return v.toString();
  }
}
