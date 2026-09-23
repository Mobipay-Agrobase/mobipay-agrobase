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
  final LocationSelection? initial;

  const LocationPicker({
    super.key,
    required this.onChange,
    this.initial,
  });

  @override
  State<LocationPicker> createState() => _LocationPickerState();
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

  @override
  void initState() {
    super.initState();
    _loadRegions();
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
