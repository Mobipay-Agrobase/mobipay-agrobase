import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_dropdown_button.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';

/// LocationPicker — 7-level dependent dropdown for Uganda's government
/// admin hierarchy: Region → Sub Region → District → County → Sub County →
/// Parish → Village.
///
/// Mirrors the web app's src/components/ui/location-picker.tsx exactly:
///   - Fetches options from /api/settings/geo/{level}?{parentParam}={parentId}
///   - Selecting a level loads its children (dependent dropdown)
///   - Changing a parent clears all children below it
///   - Returns the full selection (IDs + names) via onChange
///
/// API endpoints (all are SYSTEM_ROUTES, no auth needed — but we send the
/// bearer token anyway since the mobile app always has one):
///   GET /api/settings/geo/regions                 → top-level regions
///   GET /api/settings/geo/sub-regions?regionId=X   → sub-regions of X
///   GET /api/settings/geo/districts?subRegionId=X  → districts of X
///   GET /api/settings/geo/counties?districtId=X    → counties of X
///   GET /api/settings/geo/sub-counties?countyId=X  → sub-counties of X
///   GET /api/settings/geo/parishes?subCountyId=X    → parishes of X
///   GET /api/settings/geo/villages?parishId=X       → villages of X
class LocationPicker extends StatefulWidget {
  final ValueChanged<LocationSelection> onChange;

  /// Optional initial selection (for edit mode — loads the full chain via ancestors API).
  /// Pass a [LocationSelection] with just [LocationSelection.villageId] set, and
  /// the picker will call /api/settings/geo/ancestors?villageId=X to fetch the
  /// full chain, then pre-select each level + load children for the next level.
  final LocationSelection? initial;

  /// A counter that, when changed, resets the picker to empty (no selection).
  /// Pass `resetTrigger: ++_resetCounter` from the parent form after a successful
  /// submit so the location dropdowns clear alongside the other text fields.
  final int resetTrigger;

  const LocationPicker({
    super.key,
    required this.onChange,
    this.initial,
    this.resetTrigger = 0,
  });

  @override
  State<LocationPicker> createState() => _LocationPickerState();

  /// Static helper to build a [LocationSelection] from a farmer record's
  /// `villageId` (used by the edit screen to seed the picker).
  static LocationSelection fromVillageId(String? villageId) {
    return LocationSelection(villageId: villageId);
  }
}

class _LocationPickerState extends State<LocationPicker> {
  // Each level: selected ID + list of options
  String? _regionId;
  String? _subRegionId;
  String? _districtId;
  String? _countyId;
  String? _subCountyId;
  String? _parishId;
  String? _villageId;

  List<GeoNode> _regions = [];
  List<GeoNode> _subRegions = [];
  List<GeoNode> _districts = [];
  List<GeoNode> _counties = [];
  List<GeoNode> _subCounties = [];
  List<GeoNode> _parishes = [];
  List<GeoNode> _villages = [];

  bool _loadingRegions = true;
  bool _loadingSubRegions = false;
  bool _loadingDistricts = false;
  bool _loadingCounties = false;
  bool _loadingSubCounties = false;
  bool _loadingParishes = false;
  bool _loadingVillages = false;
  bool _loadingInitial = false;  // loading ancestors for edit mode

  @override
  void initState() {
    super.initState();
    _loadRegions().then((_) {
      // After regions are loaded, if an initial villageId was provided,
      // fetch the ancestor chain and pre-select each level.
      if (widget.initial?.villageId != null && widget.initial!.villageId!.isNotEmpty) {
        _loadInitialChain(widget.initial!.villageId!);
      }
    });
  }

  @override
  void didUpdateWidget(covariant LocationPicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If the parent bumped resetTrigger, clear all selections.
    if (widget.resetTrigger != oldWidget.resetTrigger && widget.resetTrigger > 0) {
      _resetSelections();
    }
    // If the initial villageId changed (e.g. navigating to a different farmer's edit page),
    // load the new chain.
    final newVid = widget.initial?.villageId;
    final oldVid = oldWidget.initial?.villageId;
    if (newVid != oldVid && newVid != null && newVid.isNotEmpty) {
      _loadInitialChain(newVid);
    }
  }

  void _resetSelections() {
    setState(() {
      _regionId = _subRegionId = _districtId = _countyId = _subCountyId = _parishId = _villageId = null;
      _subRegions = _districts = _counties = _subCounties = _parishes = _villages = [];
    });
    widget.onChange(LocationSelection());
  }

  /// Loads the full ancestor chain for edit mode (villageId → region).
  /// Then iteratively loads the children for each level so the dropdowns
  /// can show the selected option.
  Future<void> _loadInitialChain(String villageId) async {
    setState(() => _loadingInitial = true);
    try {
      final res = await ApiClient().get('/api/settings/geo/ancestors?villageId=$villageId');
      if (res.statusCode != 200) {
        if (mounted) setState(() => _loadingInitial = false);
        return;
      }
      final d = jsonDecode(res.body);
      final chain = d['data'];
      if (chain == null) {
        if (mounted) setState(() => _loadingInitial = false);
        return;
      }
      // Set the selected IDs from the chain
      setState(() {
        _regionId = chain['regionId'] as String?;
        _subRegionId = chain['subRegionId'] as String?;
        _districtId = chain['districtId'] as String?;
        _countyId = chain['countyId'] as String?;
        _subCountyId = chain['subCountyId'] as String?;
        _parishId = chain['parishId'] as String?;
        _villageId = chain['villageId'] as String?;
      });
      // Load children for each level in parallel (so the dropdowns have options
      // matching the selected ID).
      final futures = <Future<void>>[];
      if (_regionId != null) futures.add(_loadSubRegions(_regionId!));
      if (_subRegionId != null) futures.add(_loadDistricts(_subRegionId!));
      if (_districtId != null) futures.add(_loadCounties(_districtId!));
      if (_countyId != null) futures.add(_loadSubCounties(_countyId!));
      if (_subCountyId != null) futures.add(_loadParishes(_subCountyId!));
      if (_parishId != null) futures.add(_loadVillages(_parishId!));
      await Future.wait(futures);
      // Emit the initial selection to the parent so it has the full chain
      widget.onChange(LocationSelection(
        country: chain['country'] ?? 'Uganda',
        regionId: _regionId,
        regionName: chain['region'] as String?,
        subRegionId: _subRegionId,
        subRegionName: chain['subRegion'] as String?,
        districtId: _districtId,
        districtName: chain['district'] as String?,
        countyId: _countyId,
        countyName: chain['county'] as String?,
        subCountyId: _subCountyId,
        subCountyName: chain['subCounty'] as String?,
        parishId: _parishId,
        parishName: chain['parish'] as String?,
        villageId: _villageId,
        villageName: chain['village'] as String?,
      ));
    } catch (_) {
      // Non-fatal — picker just shows blank selections
    } finally {
      if (mounted) setState(() => _loadingInitial = false);
    }
  }

  Future<void> _loadRegions() async {
    setState(() => _loadingRegions = true);
    try {
      final res = await ApiClient().get('/api/settings/geo/regions');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['data'] as List?) ?? [];
        if (!mounted) return;
        setState(() {
          _regions = list.map((e) => GeoNode(id: e['id'] as String, name: e['name'] as String)).toList();
          _loadingRegions = false;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingRegions = false);
  }

  Future<void> _loadSubRegions(String regionId) async {
    setState(() => _loadingSubRegions = true);
    try {
      final res = await ApiClient().get('/api/settings/geo/sub-regions?regionId=$regionId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['data'] as List?) ?? [];
        if (!mounted) return;
        setState(() {
          _subRegions = list.map((e) => GeoNode(id: e['id'] as String, name: e['name'] as String)).toList();
          _loadingSubRegions = false;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingSubRegions = false);
  }

  Future<void> _loadDistricts(String subRegionId) async {
    setState(() => _loadingDistricts = true);
    try {
      final res = await ApiClient().get('/api/settings/geo/districts?subRegionId=$subRegionId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['data'] as List?) ?? [];
        if (!mounted) return;
        setState(() {
          _districts = list.map((e) => GeoNode(id: e['id'] as String, name: e['name'] as String)).toList();
          _loadingDistricts = false;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingDistricts = false);
  }

  Future<void> _loadCounties(String districtId) async {
    setState(() => _loadingCounties = true);
    try {
      final res = await ApiClient().get('/api/settings/geo/counties?districtId=$districtId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['data'] as List?) ?? [];
        if (!mounted) return;
        setState(() {
          _counties = list.map((e) => GeoNode(id: e['id'] as String, name: e['name'] as String)).toList();
          _loadingCounties = false;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingCounties = false);
  }

  Future<void> _loadSubCounties(String countyId) async {
    setState(() => _loadingSubCounties = true);
    try {
      final res = await ApiClient().get('/api/settings/geo/sub-counties?countyId=$countyId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['data'] as List?) ?? [];
        if (!mounted) return;
        setState(() {
          _subCounties = list.map((e) => GeoNode(id: e['id'] as String, name: e['name'] as String)).toList();
          _loadingSubCounties = false;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingSubCounties = false);
  }

  Future<void> _loadParishes(String subCountyId) async {
    setState(() => _loadingParishes = true);
    try {
      final res = await ApiClient().get('/api/settings/geo/parishes?subCountyId=$subCountyId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['data'] as List?) ?? [];
        if (!mounted) return;
        setState(() {
          _parishes = list.map((e) => GeoNode(id: e['id'] as String, name: e['name'] as String)).toList();
          _loadingParishes = false;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingParishes = false);
  }

  Future<void> _loadVillages(String parishId) async {
    setState(() => _loadingVillages = true);
    try {
      final res = await ApiClient().get('/api/settings/geo/villages?parishId=$parishId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['data'] as List?) ?? [];
        if (!mounted) return;
        setState(() {
          _villages = list.map((e) => GeoNode(id: e['id'] as String, name: e['name'] as String)).toList();
          _loadingVillages = false;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingVillages = false);
  }

  void _onRegionSelected(int index) {
    final node = _regions[index];
    setState(() {
      _regionId = node.id;
      // Clear all children
      _subRegionId = null;
      _districtId = null;
      _countyId = null;
      _subCountyId = null;
      _parishId = null;
      _villageId = null;
      _subRegions = [];
      _districts = [];
      _counties = [];
      _subCounties = [];
      _parishes = [];
      _villages = [];
    });
    _loadSubRegions(node.id);
    _emitSelection();
  }

  void _onSubRegionSelected(int index) {
    final node = _subRegions[index];
    setState(() {
      _subRegionId = node.id;
      _districtId = null;
      _countyId = null;
      _subCountyId = null;
      _parishId = null;
      _villageId = null;
      _districts = [];
      _counties = [];
      _subCounties = [];
      _parishes = [];
      _villages = [];
    });
    _loadDistricts(node.id);
    _emitSelection();
  }

  void _onDistrictSelected(int index) {
    final node = _districts[index];
    setState(() {
      _districtId = node.id;
      _countyId = null;
      _subCountyId = null;
      _parishId = null;
      _villageId = null;
      _counties = [];
      _subCounties = [];
      _parishes = [];
      _villages = [];
    });
    _loadCounties(node.id);
    _emitSelection();
  }

  void _onCountySelected(int index) {
    final node = _counties[index];
    setState(() {
      _countyId = node.id;
      _subCountyId = null;
      _parishId = null;
      _villageId = null;
      _subCounties = [];
      _parishes = [];
      _villages = [];
    });
    _loadSubCounties(node.id);
    _emitSelection();
  }

  void _onSubCountySelected(int index) {
    final node = _subCounties[index];
    setState(() {
      _subCountyId = node.id;
      _parishId = null;
      _villageId = null;
      _parishes = [];
      _villages = [];
    });
    _loadParishes(node.id);
    _emitSelection();
  }

  void _onParishSelected(int index) {
    final node = _parishes[index];
    setState(() {
      _parishId = node.id;
      _villageId = null;
      _villages = [];
    });
    _loadVillages(node.id);
    _emitSelection();
  }

  void _onVillageSelected(int index) {
    final node = _villages[index];
    setState(() {
      _villageId = node.id;
    });
    _emitSelection();
  }

  void _emitSelection() {
    widget.onChange(LocationSelection(
      country: 'Uganda',
      regionId: _regionId,
      regionName: _regions.where((e) => e.id == _regionId).firstOrNull?.name,
      subRegionId: _subRegionId,
      subRegionName: _subRegions.where((e) => e.id == _subRegionId).firstOrNull?.name,
      districtId: _districtId,
      districtName: _districts.where((e) => e.id == _districtId).firstOrNull?.name,
      countyId: _countyId,
      countyName: _counties.where((e) => e.id == _countyId).firstOrNull?.name,
      subCountyId: _subCountyId,
      subCountyName: _subCounties.where((e) => e.id == _subCountyId).firstOrNull?.name,
      parishId: _parishId,
      parishName: _parishes.where((e) => e.id == _parishId).firstOrNull?.name,
      villageId: _villageId,
      villageName: _villages.where((e) => e.id == _villageId).firstOrNull?.name,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Location (Government Admin Units)',
          style: TextStyleConstant.robotoW600(fontSize: 13, color: ColorConstant.text79),
        ),
        const SizedBox(height: 12),
        // Loading banner shown while fetching ancestors for edit mode
        if (_loadingInitial)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                const SizedBox(
                  width: 14, height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: ColorConstant.primary),
                ),
                const SizedBox(width: 8),
                Text(
                  'Loading location...',
                  style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79),
                ),
              ],
            ),
          ),
        // Level 1: Region
        _buildDropdown(
          label: 'Region',
          items: _regions.map((e) => e.name).toList(),
          selectedIndex: _regions.indexWhere((e) => e.id == _regionId),
          loading: _loadingRegions,
          onChanged: _onRegionSelected,
        ),
        const SizedBox(height: 12),
        // Level 2: Sub Region
        if (_regionId != null)
          _buildDropdown(
            label: 'Sub Region',
            items: _subRegions.map((e) => e.name).toList(),
            selectedIndex: _subRegions.indexWhere((e) => e.id == _subRegionId),
            loading: _loadingSubRegions,
            onChanged: _onSubRegionSelected,
          ),
        if (_regionId != null) const SizedBox(height: 12),
        // Level 3: District
        if (_subRegionId != null)
          _buildDropdown(
            label: 'District',
            items: _districts.map((e) => e.name).toList(),
            selectedIndex: _districts.indexWhere((e) => e.id == _districtId),
            loading: _loadingDistricts,
            onChanged: _onDistrictSelected,
          ),
        if (_subRegionId != null) const SizedBox(height: 12),
        // Level 4: County
        if (_districtId != null)
          _buildDropdown(
            label: 'County',
            items: _counties.map((e) => e.name).toList(),
            selectedIndex: _counties.indexWhere((e) => e.id == _countyId),
            loading: _loadingCounties,
            onChanged: _onCountySelected,
          ),
        if (_districtId != null) const SizedBox(height: 12),
        // Level 5: Sub County
        if (_countyId != null)
          _buildDropdown(
            label: 'Sub County',
            items: _subCounties.map((e) => e.name).toList(),
            selectedIndex: _subCounties.indexWhere((e) => e.id == _subCountyId),
            loading: _loadingSubCounties,
            onChanged: _onSubCountySelected,
          ),
        if (_countyId != null) const SizedBox(height: 12),
        // Level 6: Parish
        if (_subCountyId != null)
          _buildDropdown(
            label: 'Parish',
            items: _parishes.map((e) => e.name).toList(),
            selectedIndex: _parishes.indexWhere((e) => e.id == _parishId),
            loading: _loadingParishes,
            onChanged: _onParishSelected,
          ),
        if (_subCountyId != null) const SizedBox(height: 12),
        // Level 7: Village
        if (_parishId != null)
          _buildDropdown(
            label: 'Village',
            items: _villages.map((e) => e.name).toList(),
            selectedIndex: _villages.indexWhere((e) => e.id == _villageId),
            loading: _loadingVillages,
            onChanged: _onVillageSelected,
          ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required List<String> items,
    required int selectedIndex,
    required bool loading,
    required ValueChanged<int> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79)),
        const SizedBox(height: 4),
        AppDropwdownButton(
          hintText: loading ? 'Loading…' : 'Select $label',
          items: items,
          itemSelected: selectedIndex >= 0 ? items[selectedIndex] : null,
          onChanged: (index) {
            if (index >= 0 && !loading) onChanged(index);
          },
        ),
      ],
    );
  }
}

/// A single geo node (id + name) returned by the API.
class GeoNode {
  final String id;
  final String name;
  GeoNode({required this.id, required this.name});
}

/// The full location selection returned by LocationPicker.
class LocationSelection {
  final String country;
  final String? regionId;
  final String? regionName;
  final String? subRegionId;
  final String? subRegionName;
  final String? districtId;
  final String? districtName;
  final String? countyId;
  final String? countyName;
  final String? subCountyId;
  final String? subCountyName;
  final String? parishId;
  final String? parishName;
  final String? villageId;
  final String? villageName;

  LocationSelection({
    this.country = 'Uganda',
    this.regionId,
    this.regionName,
    this.subRegionId,
    this.subRegionName,
    this.districtId,
    this.districtName,
    this.countyId,
    this.countyName,
    this.subCountyId,
    this.subCountyName,
    this.parishId,
    this.parishName,
    this.villageId,
    this.villageName,
  });
}
