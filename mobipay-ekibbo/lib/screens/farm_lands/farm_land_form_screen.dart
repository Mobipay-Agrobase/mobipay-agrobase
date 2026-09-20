import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/components/app_dropdown_button.dart';
import 'package:mobipay_ekibbo/components/app_form_field.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';

/// EKiBBO Farm Land form screen (Screen 6).
///
/// Multi-tab form for creating or editing a farm land. Six tabs match the
/// web app:
///   1. Field / Farm Info   — farmer select, plot name, size, ownership, GPS,
///                            access map, physical features multi-select chips
///   2. Soil & Irrigation   — fertility, irrigation type, irrigation source
///   3. Labour              — FT / PT / Seasonal / Family workers
///   4. Conversion          — last chemical application, conventional lands,
///                            fallow, crops, est yield, cert type, status,
///                            date, inspector, qualified, remarks
///   5. Soil Analysis       — collection/lab/result dates, samples, lab name,
///                            report URL, dynamic criteria rows
///   6. GPS Polygon         — capture points via geolocator, show as chips,
///                            compute area using shoelace formula
///
/// Mode:
///   - Create: pass `farmerId` to pre-select the farmer (optional).
///   - Edit:   pass `farmLandId` to load the existing farm land into the form.
///
/// Save → POST /api/farm-lands (create) or PUT /api/farm-lands/<id> (edit).
class FarmLandFormScreen extends StatefulWidget {
  const FarmLandFormScreen({
    super.key,
    this.farmLandId,
    this.farmerId,
  });

  /// If non-null, the form operates in edit mode and preloads the farm land.
  final String? farmLandId;

  /// If non-null (create mode), pre-selects the farmer for the new farm land.
  final String? farmerId;

  @override
  State<FarmLandFormScreen> createState() => _FarmLandFormScreenState();
}

class _FarmLandFormScreenState extends State<FarmLandFormScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;

  // ─── Field/Farm Info controllers ────────────────────────────────────────
  final _plotNameCtrl = TextEditingController();
  final _sizeHaCtrl = TextEditingController();
  final _latCtrl = TextEditingController();
  final _lngCtrl = TextEditingController();
  final _accessMapCtrl = TextEditingController();
  final _villageCtrl = TextEditingController();
  final _districtCtrl = TextEditingController();

  // Farmer selection
  List<Map<String, dynamic>> _farmers = [];
  String? _selectedFarmerId;
  String? _selectedFarmerLabel;
  bool _farmersLoading = false;
  String? _ownership;

  // Physical features multi-select (Sheet-3 spec)
  final Set<String> _physicalFeatures = <String>{};
  static const _physicalFeatureKeys = <MapEntry<String, String>>[
    MapEntry('rivers', 'rivers'),
    MapEntry('lakes', 'lakes'),
    MapEntry('swamp', 'swamp'),
    MapEntry('forest', 'forest'),
    MapEntry('natural_forest', 'natural_forest'),
    MapEntry('planted_forest', 'planted_forest'),
    MapEntry('valley', 'valley'),
    MapEntry('hill_mountain', 'hill_mountain'),
    MapEntry('game_park_reserve', 'game_park_reserve'),
  ];
  static const _ownershipOptions = <String>[
    'rented_leased',
    'sales_agreement',
    'inherited',
    'family_owned',
    'communal_owned',
  ];

  // ─── Soil & Irrigation controllers ──────────────────────────────────────
  final _soilFertilityCtrl = TextEditingController();
  final _irrigationTypeCtrl = TextEditingController();
  final Set<String> _irrigationSources = <String>{};
  static const _irrigationSourceKeys = <String>[
    'River',
    'Borehole',
    'Rain-fed',
    'Tap water',
    'Dam',
    'Spring',
    'Pond',
  ];

  // ─── Labour controllers ──────────────────────────────────────────────────
  final _fullTimeCtrl = TextEditingController();
  final _partTimeCtrl = TextEditingController();
  final _seasonalCtrl = TextEditingController();
  final _familyWorkersCtrl = TextEditingController();

  // ─── Conversion controllers ─────────────────────────────────────────────
  final _lastChemAppCtrl = TextEditingController();
  final _conventionalLandsCtrl = TextEditingController();
  final _fallowCtrl = TextEditingController();
  final _conversionCropsCtrl = TextEditingController();
  final _estYieldCtrl = TextEditingController();
  String? _certType;
  String? _conversionStatus;
  final _conversionDateCtrl = TextEditingController();
  final _inspectorCtrl = TextEditingController();
  bool _qualified = false;
  final _remarksCtrl = TextEditingController();
  static const _certTypes = ['RA', 'Organic', 'Fairtrade', '4C', 'UTZ'];
  static const _conversionStatuses = ['Pending', 'In Progress', 'Completed'];

  // ─── Soil Analysis controllers ───────────────────────────────────────────
  final _collectionDateCtrl = TextEditingController();
  final _labSubmissionDateCtrl = TextEditingController();
  final _resultDateCtrl = TextEditingController();
  final _samplesCollectedCtrl = TextEditingController();
  final _labNameCtrl = TextEditingController();
  final _reportUrlCtrl = TextEditingController();
  final List<Map<String, TextEditingController>> _criteriaRows = [];

  // ─── GPS Polygon ────────────────────────────────────────────────────────
  final List<({double lat, double lng})> _polygonPoints = [];
  bool _capturing = false;

  bool _saving = false;
  bool _loading = false;
  String? _error;

  bool get _isEdit =>
      widget.farmLandId != null && widget.farmLandId!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    if (widget.farmerId != null) {
      _selectedFarmerId = widget.farmerId;
    }
    if (_isEdit) {
      _loadFarmLand();
    } else {
      _loadFarmers();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _plotNameCtrl.dispose();
    _sizeHaCtrl.dispose();
    _latCtrl.dispose();
    _lngCtrl.dispose();
    _accessMapCtrl.dispose();
    _villageCtrl.dispose();
    _districtCtrl.dispose();
    _soilFertilityCtrl.dispose();
    _irrigationTypeCtrl.dispose();
    _fullTimeCtrl.dispose();
    _partTimeCtrl.dispose();
    _seasonalCtrl.dispose();
    _familyWorkersCtrl.dispose();
    _lastChemAppCtrl.dispose();
    _conventionalLandsCtrl.dispose();
    _fallowCtrl.dispose();
    _conversionCropsCtrl.dispose();
    _estYieldCtrl.dispose();
    _conversionDateCtrl.dispose();
    _inspectorCtrl.dispose();
    _remarksCtrl.dispose();
    _collectionDateCtrl.dispose();
    _labSubmissionDateCtrl.dispose();
    _resultDateCtrl.dispose();
    _samplesCollectedCtrl.dispose();
    _labNameCtrl.dispose();
    _reportUrlCtrl.dispose();
    for (final row in _criteriaRows) {
      for (final c in row.values) {
        c.dispose();
      }
    }
    super.dispose();
  }

  Future<void> _loadFarmers() async {
    setState(() => _farmersLoading = true);
    try {
      final res = await ApiClient().get('/api/farmers?limit=200&status=all');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final list = (body['farmers'] as List?) ?? [];
        final parsed = list
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        if (!mounted) return;
        setState(() {
          _farmers = parsed;
          if (_selectedFarmerId != null) {
            final match = _farmers.firstWhere(
              (f) =>
                  (f['id'] ?? f['_id'] ?? '').toString() == _selectedFarmerId,
              orElse: () => <String, dynamic>{},
            );
            if (match.isNotEmpty) {
              _selectedFarmerLabel = _formatFarmerName(match);
            }
          }
          _farmersLoading = false;
        });
      } else {
        if (!mounted) return;
        setState(() => _farmersLoading = false);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _farmersLoading = false);
    }
  }

  Future<void> _loadFarmLand() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // Load farm land + farmers in parallel
      final results = await Future.wait([
        ApiClient().get('/api/farm-lands/${widget.farmLandId}'),
        ApiClient().get('/api/farmers?limit=200&status=all'),
      ]);
      final farmRes = results[0];
      final farmersRes = results[1];

      if (farmRes.statusCode == 401 || farmersRes.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (farmersRes.statusCode == 200) {
        final body =
            jsonDecode(farmersRes.body) as Map<String, dynamic>;
        final list = (body['farmers'] as List?) ?? [];
        if (!mounted) return;
        setState(() {
          _farmers = list
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
        });
      }
      if (farmRes.statusCode != 200) {
        if (!mounted) return;
        setState(() {
          _error = '${AppLang.local.load_failed} (HTTP ${farmRes.statusCode})';
          _loading = false;
        });
        return;
      }
      final body = jsonDecode(farmRes.body);
      final farm = body is Map
          ? (body['farm'] ?? body['farmLand'] ?? body)
          : null;
      if (farm is! Map) {
        if (!mounted) return;
        setState(() {
          _error = AppLang.local.load_failed;
          _loading = false;
        });
        return;
      }
      _hydrateFromFarm(Map<String, dynamic>.from(farm));
      if (!mounted) return;
      setState(() => _loading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '${AppLang.local.load_failed} ($e)';
        _loading = false;
      });
    }
  }

  void _hydrateFromFarm(Map<String, dynamic> farm) {
    _plotNameCtrl.text = _str(farm['name'] ?? farm['plotName'] ?? farm['farmName']);
    final size = (farm['sizeHa'] as num?)?.toDouble() ??
        (farm['size'] as num?)?.toDouble() ??
        (farm['areaHa'] as num?)?.toDouble();
    if (size != null) _sizeHaCtrl.text = size.toStringAsFixed(2);
    final lat = (farm['latitude'] as num?)?.toDouble();
    final lng = (farm['longitude'] as num?)?.toDouble();
    if (lat != null) _latCtrl.text = lat.toString();
    if (lng != null) _lngCtrl.text = lng.toString();
    _accessMapCtrl.text = _str(farm['accessMap'] ?? farm['approachRoad']);
    _villageCtrl.text = _str(farm['villageName'] ?? farm['village']);
    _districtCtrl.text = _str(farm['district']);
    _ownership = _str(farm['ownership'] ?? farm['landOwnership']);
    final pf = farm['physicalFeatures'];
    if (pf is List) {
      _physicalFeatures
        ..clear()
        ..addAll(pf.map((e) => e.toString()));
    } else if (pf is String && pf.isNotEmpty) {
      _physicalFeatures
        ..clear()
        ..addAll(pf.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty));
    }
    // Farmer
    final farmer = farm['farmer'];
    if (farmer is Map) {
      _selectedFarmerId = _str(farmer['id'] ?? farmer['_id']);
      _selectedFarmerLabel = _formatFarmerName(
          Map<String, dynamic>.from(farmer));
    } else if (farm['farmerId'] != null) {
      _selectedFarmerId = _str(farm['farmerId']);
    }
    // Soil & irrigation
    _soilFertilityCtrl.text = _str(farm['soilFertility']);
    _irrigationTypeCtrl.text = _str(farm['irrigationType']);
    final isrc = farm['irrigationSource'];
    if (isrc is List) {
      _irrigationSources
        ..clear()
        ..addAll(isrc.map((e) => e.toString()));
    } else if (isrc is String && isrc.isNotEmpty) {
      _irrigationSources
        ..clear()
        ..addAll(isrc.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty));
    }
    // Labour
    _fullTimeCtrl.text = _intStr(farm['fullTimeWorkers']);
    _partTimeCtrl.text = _intStr(farm['partTimeWorkers']);
    _seasonalCtrl.text = _intStr(farm['seasonalWorkers']);
    _familyWorkersCtrl.text = _intStr(farm['familyWorkers']);
    // Conversion
    _lastChemAppCtrl.text = _str(farm['lastChemicalApplicationDate']);
    _conventionalLandsCtrl.text = _numStr(farm['conventionalLands']);
    _fallowCtrl.text = _str(farm['fallowPeriod']);
    _conversionCropsCtrl.text = _str(farm['conversionCrops']);
    _estYieldCtrl.text = _numStr(farm['estimatedYield']);
    _certType = _str(farm['certificationType']);
    _conversionStatus = _str(farm['conversionStatus']);
    _conversionDateCtrl.text = _str(farm['conversionDate']);
    _inspectorCtrl.text = _str(farm['inspector']);
    _qualified = (farm['qualified'] as bool?) ?? false;
    _remarksCtrl.text = _str(farm['remarks']);
    // Soil analysis (first item if present)
    final soilAnalyses = farm['soilAnalyses'];
    if (soilAnalyses is List && soilAnalyses.isNotEmpty) {
      final s = soilAnalyses.first;
      if (s is Map) {
        final sm = Map<String, dynamic>.from(s);
        _collectionDateCtrl.text = _str(sm['collectionDate']);
        _labSubmissionDateCtrl.text = _str(sm['labSubmissionDate']);
        _resultDateCtrl.text = _str(sm['resultDate']);
        _samplesCollectedCtrl.text = _intStr(sm['samplesCollected']);
        _labNameCtrl.text = _str(sm['labName']);
        _reportUrlCtrl.text = _str(sm['reportUrl']);
      }
    }
    // GPS polygon points
    final polygon = farm['polygonPoints'];
    if (polygon is List) {
      _polygonPoints.clear();
      for (final p in polygon) {
        if (p is Map) {
          final lat = (p['lat'] as num?)?.toDouble() ??
              (p['latitude'] as num?)?.toDouble();
          final lng = (p['lng'] as num?)?.toDouble() ??
              (p['lon'] as num?)?.toDouble() ??
              (p['longitude'] as num?)?.toDouble();
          if (lat != null && lng != null) {
            _polygonPoints.add((lat: lat, lng: lng));
          }
        }
      }
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
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  String _str(dynamic v) => v == null ? '' : v.toString();

  String _intStr(dynamic v) {
    if (v == null) return '';
    if (v is num) return v.toInt().toString();
    return v.toString();
  }

  String _numStr(dynamic v) {
    if (v == null) return '';
    if (v is num) return v.toString();
    return v.toString();
  }

  String _formatFarmerName(Map<String, dynamic> f) {
    final first = _str(f['firstName']);
    final last = _str(f['lastName']);
    final name = '$first $last'.trim();
    if (name.isEmpty) return _str(f['farmerCode']);
    return name;
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1990),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
    );
    if (d != null) {
      ctrl.text = d.toIso8601String().split('T')[0];
    }
  }

  // ─── Save ────────────────────────────────────────────────────────────────

  Future<void> _save() async {
    if (_selectedFarmerId == null || _selectedFarmerId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLang.local.select_farmer_first),
          backgroundColor: ColorConstant.danger,
        ),
      );
      _tabController.animateTo(0);
      return;
    }
    if (_plotNameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLang.local.please_fill_plot_name),
          backgroundColor: ColorConstant.danger,
        ),
      );
      _tabController.animateTo(0);
      return;
    }
    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'farmerId': _selectedFarmerId,
        'name': _plotNameCtrl.text.trim(),
        'plotName': _plotNameCtrl.text.trim(),
        'sizeHa': double.tryParse(_sizeHaCtrl.text),
        'latitude': double.tryParse(_latCtrl.text),
        'longitude': double.tryParse(_lngCtrl.text),
        'accessMap': _accessMapCtrl.text.trim().isNotEmpty
            ? _accessMapCtrl.text.trim()
            : null,
        'approachRoad': _accessMapCtrl.text.trim().isNotEmpty
            ? _accessMapCtrl.text.trim()
            : null,
        'villageName': _villageCtrl.text.trim().isNotEmpty
            ? _villageCtrl.text.trim()
            : null,
        'village': _villageCtrl.text.trim().isNotEmpty
            ? _villageCtrl.text.trim()
            : null,
        'district': _districtCtrl.text.trim().isNotEmpty
            ? _districtCtrl.text.trim()
            : null,
        'ownership': _ownership,
        'landOwnership': _ownership,
        'physicalFeatures': _physicalFeatures.toList(),
        // Soil & irrigation
        'soilFertility': _soilFertilityCtrl.text.trim().isNotEmpty
            ? _soilFertilityCtrl.text.trim()
            : null,
        'irrigationType': _irrigationTypeCtrl.text.trim().isNotEmpty
            ? _irrigationTypeCtrl.text.trim()
            : null,
        'irrigationSource': _irrigationSources.toList(),
        // Labour
        'fullTimeWorkers': int.tryParse(_fullTimeCtrl.text),
        'partTimeWorkers': int.tryParse(_partTimeCtrl.text),
        'seasonalWorkers': int.tryParse(_seasonalCtrl.text),
        'familyWorkers': int.tryParse(_familyWorkersCtrl.text),
        // Conversion
        'lastChemicalApplicationDate': _lastChemAppCtrl.text.isNotEmpty
            ? _lastChemAppCtrl.text
            : null,
        'conventionalLands': double.tryParse(_conventionalLandsCtrl.text),
        'fallowPeriod': _fallowCtrl.text.isNotEmpty ? _fallowCtrl.text : null,
        'conversionCrops': _conversionCropsCtrl.text.isNotEmpty
            ? _conversionCropsCtrl.text
            : null,
        'estimatedYield': double.tryParse(_estYieldCtrl.text),
        'certificationType': _certType,
        'conversionStatus': _conversionStatus,
        'conversionDate': _conversionDateCtrl.text.isNotEmpty
            ? _conversionDateCtrl.text
            : null,
        'inspector': _inspectorCtrl.text.isNotEmpty
            ? _inspectorCtrl.text
            : null,
        'qualified': _qualified,
        'remarks': _remarksCtrl.text.isNotEmpty ? _remarksCtrl.text : null,
        // Soil analysis
        'soilAnalyses': [
          {
            'collectionDate': _collectionDateCtrl.text.isNotEmpty
                ? _collectionDateCtrl.text
                : null,
            'labSubmissionDate': _labSubmissionDateCtrl.text.isNotEmpty
                ? _labSubmissionDateCtrl.text
                : null,
            'resultDate': _resultDateCtrl.text.isNotEmpty
                ? _resultDateCtrl.text
                : null,
            'samplesCollected': int.tryParse(_samplesCollectedCtrl.text),
            'labName': _labNameCtrl.text.isNotEmpty
                ? _labNameCtrl.text
                : null,
            'reportUrl': _reportUrlCtrl.text.isNotEmpty
                ? _reportUrlCtrl.text
                : null,
            'criteria': _criteriaRows
                .map((row) => {
                      'parameter': row['parameter']?.text ?? '',
                      'value': row['value']?.text ?? '',
                    })
                .where((c) => c['parameter']!.isNotEmpty || c['value']!.isNotEmpty)
                .toList(),
          },
        ],
        // GPS polygon
        'polygonPoints': _polygonPoints
            .map((p) => {'lat': p.lat, 'lng': p.lng})
            .toList(),
      };

      http.Response res;
      if (_isEdit) {
        res = await ApiClient()
            .put('/api/farm-lands/${widget.farmLandId}', body: payload);
      } else {
        res = await ApiClient().post('/api/farm-lands', body: payload);
      }
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200 || res.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.farm_land_saved_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        Navigator.of(context).pop();
      } else {
        String err = AppLang.local.farm_land_save_failed;
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
          content: Text('${AppLang.local.farm_land_save_failed}: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  // ─── GPS capture ─────────────────────────────────────────────────────────

  Future<void> _captureGpsPoint() async {
    setState(() => _capturing = true);
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.location_service_disabled),
            backgroundColor: ColorConstant.danger,
          ),
        );
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.location_permission_denied),
            backgroundColor: ColorConstant.danger,
          ),
        );
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      if (!mounted) return;
      setState(() {
        _polygonPoints.add((lat: position.latitude, lng: position.longitude));
        // Pre-fill lat/lng if empty
        if (_latCtrl.text.isEmpty) {
          _latCtrl.text = position.latitude.toString();
        }
        if (_lngCtrl.text.isEmpty) {
          _lngCtrl.text = position.longitude.toString();
        }
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _capturing = false);
    }
  }

  /// Shoelace formula to compute the polygon area in hectares.
  /// Reference: https://en.wikipedia.org/wiki/Shoelace_formula
  double _computeAreaHa() {
    final pts = _polygonPoints;
    if (pts.length < 3) return 0.0;
    double sum = 0;
    for (int i = 0; i < pts.length; i++) {
      final cur = pts[i];
      final next = pts[(i + 1) % pts.length];
      sum += cur.lng * next.lat - next.lng * cur.lat;
    }
    final areaDeg = (sum.abs() / 2);
    // Convert square degrees to m² using approximate Earth radius.
    const earthRadiusM = 6371000.0;
    final avgLat = pts.map((p) => p.lat).reduce((a, b) => a + b) / pts.length;
    final latRad = avgLat * math.pi / 180.0;
    final mPerDegLat = 2 * math.pi * earthRadiusM / 360.0;
    final mPerDegLng = mPerDegLat * math.cos(latRad);
    final areaM2 = areaDeg * mPerDegLat * mPerDegLng;
    return areaM2 / 10000.0; // m² → hectares
  }

  // ─── Build ───────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: _isEdit
            ? AppLang.local.farm_land_edit
            : AppLang.local.farm_land_registration,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : Column(
                  children: [
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
                          Tab(text: AppLang.local.field_farm_info),
                          Tab(text: AppLang.local.soil_irrigation),
                          Tab(text: AppLang.local.labour),
                          Tab(text: AppLang.local.conversion),
                          Tab(text: AppLang.local.soil_analysis),
                          Tab(text: AppLang.local.gps_polygon),
                        ],
                      ),
                    ),
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildFieldInfoTab(),
                          _buildSoilIrrigationTab(),
                          _buildLabourTab(),
                          _buildConversionTab(),
                          _buildSoilAnalysisTab(),
                          _buildGpsPolygonTab(),
                        ],
                      ),
                    ),
                    _buildBottomBar(),
                  ],
                ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: Row(
        children: [
          Text(
            title,
            style: TextStyleConstant.robotoW800(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Container(height: 1, color: ColorConstant.grayEB)),
        ],
      ),
    );
  }

  Widget _buildFieldInfoTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionHeader(AppLang.local.field_farm_info),
          // Farmer select
          Text(
            AppLang.local.farmer,
            style: TextStyleConstant.robotoW600(
                fontSize: 12, color: ColorConstant.text79),
          ),
          const SizedBox(height: 6),
          if (_farmersLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: LinearProgressIndicator(),
            )
          else
            AppDropwdownButton(
              items: _farmers.map(_formatFarmerName).toList(),
              itemSelected: _selectedFarmerLabel,
              hintText: AppLang.local.farmer,
              onChanged: (i) {
                setState(() {
                  _selectedFarmerId = _str(_farmers[i]['id'] ?? _farmers[i]['_id']);
                  _selectedFarmerLabel = _formatFarmerName(_farmers[i]);
                });
              },
            ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _plotNameCtrl,
            hint: AppLang.local.plot_name,
            labelText: '${AppLang.local.plot_name} *',
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _sizeHaCtrl,
                  hint: AppLang.local.size_in_ha,
                  labelText: AppLang.local.size_in_ha,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _latCtrl,
                  hint: 'Latitude',
                  labelText: 'Latitude',
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true, signed: true),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _lngCtrl,
                  hint: 'Longitude',
                  labelText: 'Longitude',
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true, signed: true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Ownership dropdown (Sheet-3 spec)
          Text(
            AppLang.local.land_ownership,
            style: TextStyleConstant.robotoW600(
                fontSize: 12, color: ColorConstant.text79),
          ),
          const SizedBox(height: 6),
          AppDropwdownButton(
            items: _ownershipOptions.map(_ownershipLabel).toList(),
            itemSelected:
                _ownership == null ? null : _ownershipLabel(_ownership!),
            hintText: AppLang.local.land_ownership_hint,
            onChanged: (i) =>
                setState(() => _ownership = _ownershipOptions[i]),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _villageCtrl,
                  hint: AppLang.local.village,
                  labelText: AppLang.local.village,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _districtCtrl,
                  hint: AppLang.local.district,
                  labelText: AppLang.local.district,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _accessMapCtrl,
            hint: AppLang.local.access_map_url,
            labelText: AppLang.local.access_map_url,
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          // Physical features multi-select chips
          Text(
            AppLang.local.physical_features,
            style: TextStyleConstant.robotoW600(
                fontSize: 12, color: ColorConstant.text79),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _physicalFeatureKeys.map((entry) {
              final selected = _physicalFeatures.contains(entry.key);
              return FilterChip(
                label: Text(_physicalFeatureLabel(entry.key)),
                selected: selected,
                onSelected: (v) {
                  setState(() {
                    if (v) {
                      _physicalFeatures.add(entry.key);
                    } else {
                      _physicalFeatures.remove(entry.key);
                    }
                  });
                },
                selectedColor: ColorConstant.primary,
                backgroundColor: ColorConstant.grayF6F7F9,
                labelStyle: TextStyleConstant.robotoW500(
                  fontSize: 11,
                  color: selected ? Colors.white : ColorConstant.textPrimary,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSoilIrrigationTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionHeader(AppLang.local.soil_irrigation),
          AppFormField(
            controller: _soilFertilityCtrl,
            hint: AppLang.local.soil_fertility,
            labelText: AppLang.local.soil_fertility,
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _irrigationTypeCtrl,
            hint: AppLang.local.irrigation_type,
            labelText: AppLang.local.irrigation_type,
          ),
          const SizedBox(height: 12),
          Text(
            AppLang.local.irrigation_source,
            style: TextStyleConstant.robotoW600(
                fontSize: 12, color: ColorConstant.text79),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _irrigationSourceKeys.map((src) {
              final selected = _irrigationSources.contains(src);
              return FilterChip(
                label: Text(src),
                selected: selected,
                onSelected: (v) {
                  setState(() {
                    if (v) {
                      _irrigationSources.add(src);
                    } else {
                      _irrigationSources.remove(src);
                    }
                  });
                },
                selectedColor: ColorConstant.secondary,
                backgroundColor: ColorConstant.grayF6F7F9,
                labelStyle: TextStyleConstant.robotoW500(
                  fontSize: 11,
                  color: selected ? Colors.white : ColorConstant.textPrimary,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildLabourTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionHeader(AppLang.local.labour),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _fullTimeCtrl,
                  hint: AppLang.local.full_time_workers,
                  labelText: AppLang.local.full_time_workers,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _partTimeCtrl,
                  hint: AppLang.local.part_time_workers,
                  labelText: AppLang.local.part_time_workers,
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _seasonalCtrl,
                  hint: AppLang.local.seasonal_workers,
                  labelText: AppLang.local.seasonal_workers,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _familyWorkersCtrl,
                  hint: AppLang.local.family_workers,
                  labelText: AppLang.local.family_workers,
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConversionTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionHeader(AppLang.local.conversion),
          AppFormField(
            controller: _lastChemAppCtrl,
            hint: AppLang.local.last_chemical_application,
            labelText: AppLang.local.last_chemical_application,
            readOnly: true,
            suffixIcon:
                const Icon(Icons.calendar_today_outlined, size: 18),
            onTap: () => _pickDate(_lastChemAppCtrl),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _conventionalLandsCtrl,
                  hint: AppLang.local.conventional_lands,
                  labelText: AppLang.local.conventional_lands,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _fallowCtrl,
                  hint: AppLang.local.fallow_period,
                  labelText: AppLang.local.fallow_period,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _conversionCropsCtrl,
            hint: AppLang.local.conversion_crops,
            labelText: AppLang.local.conversion_crops,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _estYieldCtrl,
                  hint: AppLang.local.estimated_yield,
                  labelText: AppLang.local.estimated_yield,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppDropwdownButton(
                  items: _certTypes,
                  itemSelected: _certType,
                  hintText: AppLang.local.certification_type,
                  onChanged: (i) =>
                      setState(() => _certType = _certTypes[i]),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppDropwdownButton(
                  items: _conversionStatuses,
                  itemSelected: _conversionStatus,
                  hintText: AppLang.local.certification_status,
                  onChanged: (i) =>
                      setState(() => _conversionStatus = _conversionStatuses[i]),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _conversionDateCtrl,
                  hint: AppLang.local.conversion_date,
                  labelText: AppLang.local.conversion_date,
                  readOnly: true,
                  suffixIcon:
                      const Icon(Icons.calendar_today_outlined, size: 18),
                  onTap: () => _pickDate(_conversionDateCtrl),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _inspectorCtrl,
            hint: AppLang.local.inspector,
            labelText: AppLang.local.inspector,
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            title: Text(AppLang.local.qualified,
                style: TextStyleConstant.robotoW500(fontSize: 13)),
            value: _qualified,
            activeColor: ColorConstant.primary,
            contentPadding: EdgeInsets.zero,
            onChanged: (v) => setState(() => _qualified = v),
          ),
          const SizedBox(height: 8),
          AppFormField(
            controller: _remarksCtrl,
            hint: AppLang.local.remarks,
            labelText: AppLang.local.remarks,
            maxLines: 3,
          ),
        ],
      ),
    );
  }

  Widget _buildSoilAnalysisTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionHeader(AppLang.local.soil_analysis),
          AppFormField(
            controller: _collectionDateCtrl,
            hint: AppLang.local.soil_collection_date,
            labelText: AppLang.local.soil_collection_date,
            readOnly: true,
            suffixIcon:
                const Icon(Icons.calendar_today_outlined, size: 18),
            onTap: () => _pickDate(_collectionDateCtrl),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _labSubmissionDateCtrl,
                  hint: AppLang.local.lab_submission_date,
                  labelText: AppLang.local.lab_submission_date,
                  readOnly: true,
                  suffixIcon: const Icon(Icons.calendar_today_outlined,
                      size: 18),
                  onTap: () => _pickDate(_labSubmissionDateCtrl),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _resultDateCtrl,
                  hint: AppLang.local.result_date,
                  labelText: AppLang.local.result_date,
                  readOnly: true,
                  suffixIcon:
                      const Icon(Icons.calendar_today_outlined, size: 18),
                  onTap: () => _pickDate(_resultDateCtrl),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _samplesCollectedCtrl,
                  hint: AppLang.local.samples_collected,
                  labelText: AppLang.local.samples_collected,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _labNameCtrl,
                  hint: AppLang.local.lab_name,
                  labelText: AppLang.local.lab_name,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _reportUrlCtrl,
            hint: AppLang.local.report_url,
            labelText: AppLang.local.report_url,
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 12),
          _sectionHeader(AppLang.local.criteria),
          ..._criteriaRows.asMap().entries.map((entry) {
            final idx = entry.key;
            final row = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Expanded(
                    child: AppFormField(
                      controller: row['parameter'],
                      hint: AppLang.local.criteria,
                      labelText: '${AppLang.local.criteria} #${idx + 1}',
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: AppFormField(
                      controller: row['value'],
                      hint: AppLang.local.amount,
                      labelText: AppLang.local.amount,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline,
                        color: ColorConstant.danger),
                    onPressed: () {
                      setState(() {
                        for (final c in row.values) {
                          c.dispose();
                        }
                        _criteriaRows.removeAt(idx);
                      });
                    },
                  ),
                ],
              ),
            );
          }),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () {
                setState(() {
                  _criteriaRows.add({
                    'parameter': TextEditingController(),
                    'value': TextEditingController(),
                  });
                });
              },
              icon: const Icon(Icons.add, color: ColorConstant.primary),
              label: Text(
                AppLang.local.add_criteria_row,
                style: TextStyleConstant.robotoW600(
                    fontSize: 12, color: ColorConstant.primary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGpsPolygonTab() {
    final areaHa = _computeAreaHa();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionHeader(AppLang.local.gps_polygon),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  title: _capturing
                      ? AppLang.local.saving
                      : AppLang.local.capture_point,
                  height: 44,
                  color: ColorConstant.secondary,
                  isLoading: _capturing,
                  onTap: _capturing ? null : _captureGpsPoint,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: ColorConstant.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ColorConstant.grayEB),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  AppLang.local.computed_area,
                  style: TextStyleConstant.robotoW500(
                      fontSize: 12, color: ColorConstant.text79),
                ),
                Text(
                  '${areaHa.toStringAsFixed(4)} ha',
                  style: TextStyleConstant.quicksandW700(
                    fontSize: 16,
                    color: ColorConstant.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            AppLang.local.polygon_points,
            style: TextStyleConstant.robotoW600(
                fontSize: 12, color: ColorConstant.text79),
          ),
          const SizedBox(height: 6),
          if (_polygonPoints.isEmpty)
            Text(
              AppLang.local.no_polygon_points,
              style: TextStyleConstant.robotoW400(
                  fontSize: 12, color: ColorConstant.textSecondary),
            )
          else
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _polygonPoints.asMap().entries.map((entry) {
                final idx = entry.key;
                final p = entry.value;
                return Chip(
                  label: Text(
                    '#${idx + 1}: ${p.lat.toStringAsFixed(5)}, ${p.lng.toStringAsFixed(5)}',
                    style: TextStyleConstant.robotoW500(
                        fontSize: 11, color: ColorConstant.textPrimary),
                  ),
                  deleteIcon: const Icon(Icons.close,
                      size: 16, color: ColorConstant.danger),
                  onDeleted: () {
                    setState(() {
                      _polygonPoints.removeAt(idx);
                    });
                  },
                  backgroundColor: ColorConstant.grayF6F7F9,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: ColorConstant.surface,
          border: Border(
            top: BorderSide(color: ColorConstant.grayEB),
          ),
        ),
        child: AppButton(
          title: _saving ? AppLang.local.saving : AppLang.local.save_farm_land,
          height: 48,
          isLoading: _saving,
          onTap: _saving ? null : _save,
        ),
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
              onPressed: _loadFarmLand,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Label helpers (i18n-backed) ─────────────────────────────────────────

  String _ownershipLabel(String key) {
    switch (key) {
      case 'rented_leased':
        return AppLang.local.ownership_rented_leased;
      case 'sales_agreement':
        return AppLang.local.ownership_sales_agreement;
      case 'inherited':
        return AppLang.local.ownership_inherited;
      case 'family_owned':
        return AppLang.local.ownership_family_owned;
      case 'communal_owned':
        return AppLang.local.ownership_communal;
      default:
        return key;
    }
  }

  String _physicalFeatureLabel(String key) {
    switch (key) {
      case 'rivers':
        return AppLang.local.rivers;
      case 'lakes':
        return AppLang.local.lakes;
      case 'swamp':
        return AppLang.local.swamp;
      case 'forest':
        return AppLang.local.forest;
      case 'natural_forest':
        return AppLang.local.natural_forest;
      case 'planted_forest':
        return AppLang.local.planted_forest;
      case 'valley':
        return AppLang.local.valley;
      case 'hill_mountain':
        return AppLang.local.hill_mountain;
      case 'game_park_reserve':
        return AppLang.local.game_park_reserve;
      default:
        return key;
    }
  }
}
