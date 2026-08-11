import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/sync/offline_repository.dart';
import '../../../../core/theme/app_theme.dart';

/// Farm Land create/edit form with 6 sections matching the Excel spec.
class FarmLandFormPage extends StatefulWidget {
  final String? farmLandId;
  final String? farmerId;
  const FarmLandFormPage({super.key, this.farmLandId, this.farmerId});

  @override
  State<FarmLandFormPage> createState() => _FarmLandFormPageState();
}

class _FarmLandFormPageState extends State<FarmLandFormPage> {
  final _nameCtrl = TextEditingController();
  final _sizeCtrl = TextEditingController();
  final _surveyNoCtrl = TextEditingController();
  final _latCtrl = TextEditingController();
  final _lngCtrl = TextEditingController();
  final _workersFT = TextEditingController();
  final _workersPT = TextEditingController();
  final _workersSeasonal = TextEditingController();
  final _workersFamily = TextEditingController();
  final _conventionalLands = TextEditingController();
  final _fallowPastureLand = TextEditingController();
  final _conventionalCrops = TextEditingController();
  final _inspectorName = TextEditingController();
  final _soilSamplesInfo = TextEditingController();
  final _soilReportUrl = TextEditingController();
  final _estYieldCtrl = TextEditingController();

  String? _farmerId;
  String _landOwnership = 'Owned';
  String? _landTopology;
  String _waterSource = 'Well';
  String? _powerSource;
  String _soilFertility = 'Good';
  String? _irrigationType;
  String? _conversionStatus;
  String? _certType;
  bool? _conversionQualified;
  bool _loading = true;
  bool _saving = false;
  int _tab = 0;

  // ─── Polygon boundary capture (EKIBBO Phase 3) ───
  final List<({double lat, double lng})> _points = [];
  double? _computedAreaHa;
  bool _capturing = false;

  @override
  void initState() {
    super.initState();
    _farmerId = widget.farmerId;
    _load();
  }

  Future<void> _load() async {
    if (widget.farmLandId != null) {
      final repo = context.read<OfflineRepository>();
      final f = await repo.getFarmLandById(widget.farmLandId!);
      if (f != null) {
        _nameCtrl.text = f['name'] ?? '';
        _sizeCtrl.text = _fmtNum(f['sizeHectares']);
        _surveyNoCtrl.text = f['landSurveyNo'] ?? '';
        _latCtrl.text = _fmtNum(f['latitude']);
        _lngCtrl.text = _fmtNum(f['longitude']);
        _workersFT.text = _fmtNum(f['fullTimeWorkers']);
        _workersPT.text = _fmtNum(f['partTimeWorkers']);
        _workersSeasonal.text = _fmtNum(f['seasonalWorkers']);
        _workersFamily.text = _fmtNum(f['familyWorkers']);
        _conventionalLands.text = f['conventionalLands'] ?? '';
        _fallowPastureLand.text = f['fallowPastureLand'] ?? '';
        _conventionalCrops.text = f['conventionalCrops'] ?? '';
        _inspectorName.text = f['inspectorName'] ?? '';
        _soilSamplesInfo.text = f['soilSamplesInfo'] ?? '';
        _soilReportUrl.text = f['soilReportUrl'] ?? '';
        _estYieldCtrl.text = _fmtNum(f['estYieldKg']);
        _farmerId = f['farmerId'] ?? _farmerId;
        _landOwnership = f['landOwnership'] ?? 'Owned';
        _landTopology = f['landTopology'];
        _waterSource = f['waterSource'] ?? 'Well';
        _powerSource = f['powerSource'];
        _soilFertility = f['soilFertility'] ?? 'Good';
        _irrigationType = f['irrigationType'];
        _conversionStatus = f['conversionStatus'];
        _certType = f['certType'];
        _conversionQualified = f['conversionQualified'];
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  String _fmtNum(dynamic v) => v == null ? '' : '${v}';
  bool get _isEdit => widget.farmLandId != null;

  Future<void> _save() async {
    if (_farmerId == null || _nameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Farmer and Farm Name are required')));
      return;
    }
    setState(() => _saving = true);
    // If the user didn't type a size, use the polygon-computed area.
    if (_sizeCtrl.text.trim().isEmpty && _computedAreaHa != null) {
      _sizeCtrl.text = _computedAreaHa!.toStringAsFixed(3);
    }
    final payload = {
      'farmerId': _farmerId,
      'name': _nameCtrl.text.trim(),
      'sizeHectares': _num(_sizeCtrl.text),
      'landSurveyNo': _emptyToNull(_surveyNoCtrl.text.trim()),
      'latitude': _num(_latCtrl.text),
      'longitude': _num(_lngCtrl.text),
      'landOwnership': _landOwnership,
      'landTopology': _emptyToNull(_landTopology),
      'waterSource': _waterSource,
      'powerSource': _emptyToNull(_powerSource),
      'soilFertility': _soilFertility,
      'irrigationType': _emptyToNull(_irrigationType),
      'fullTimeWorkers': _num(_workersFT.text),
      'partTimeWorkers': _num(_workersPT.text),
      'seasonalWorkers': _num(_workersSeasonal.text),
      'familyWorkers': _num(_workersFamily.text),
      'conventionalLands': _emptyToNull(_conventionalLands.text.trim()),
      'fallowPastureLand': _emptyToNull(_fallowPastureLand.text.trim()),
      'conventionalCrops': _emptyToNull(_conventionalCrops.text.trim()),
      'estYieldKg': _num(_estYieldCtrl.text),
      'certType': _emptyToNull(_certType),
      'conversionStatus': _emptyToNull(_conversionStatus),
      'inspectorName': _emptyToNull(_inspectorName.text.trim()),
      'conversionQualified': _conversionQualified,
      'soilSamplesInfo': _emptyToNull(_soilSamplesInfo.text.trim()),
      'soilReportUrl': _emptyToNull(_soilReportUrl.text.trim()),
    };

    final repo = context.read<OfflineRepository>();
    try {
      Map<String, dynamic>? saved;
      if (_isEdit) {
        await repo.updateFarmLand(widget.farmLandId!, payload);
        saved = {'id': widget.farmLandId};
      } else {
        saved = await repo.createFarmLand(payload);
      }
      final savedId = saved?['id'];
      if (savedId != null && _points.length >= 3) {
        await _persistPolygon(savedId);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'Farm Land updated' : 'Farm Land created'),
          backgroundColor: AppTheme.primaryGreen,
        ));
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  dynamic _emptyToNull(String? s) {
    if (s == null) return null;
    return s.isEmpty ? null : s;
  }
  num? _num(String t) {
    final v = double.tryParse(t);
    return v == null ? null : v;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Farm Land' : 'New Farm Land'),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        actions: [
          TextButton.icon(
            onPressed: _saving ? null : _save,
            icon: const Icon(Icons.save, color: Colors.white),
            label: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              _tabBar(),
              Expanded(child: IndexedStack(index: _tab, children: [
                _fieldTab(),
                _boundaryTab(),
                _soilTab(),
                _labourTab(),
                _conversionTab(),
                _soilAnalysisTab(),
              ])),
            ]),
    );
  }

  Widget _tabBar() {
    const tabs = ['Field', 'Boundary', 'Soil', 'Labour', 'Conversion', 'Soil Analysis'];
    return SizedBox(
      height: 48,
      child: ListView.separated(
        padding: const EdgeInsets.all(8),
        scrollDirection: Axis.horizontal,
        itemCount: tabs.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final selected = _tab == i;
          return ChoiceChip(
            label: Text(tabs[i]),
            selected: selected,
            onSelected: (_) => setState(() => _tab = i),
            selectedColor: AppTheme.primaryGreen,
            labelStyle: TextStyle(color: selected ? Colors.white : AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
          );
        },
      ),
    );
  }

  Widget _fieldTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _pick(_nameCtrl, 'Farm/Plot Name *'),
      const SizedBox(height: 12),
      _pick(_sizeCtrl, 'Total Land Holding (ha)', keyboard: TextInputType.number),
      const SizedBox(height: 12),
      _pick(_surveyNoCtrl, 'Land Survey No.'),
      const SizedBox(height: 12),
      _dropdown('Land Ownership', const ['Owned', 'Rent', 'Lease'], _landOwnership, (v) => _landOwnership = v),
      const SizedBox(height: 12),
      _optionalDropdown('Land Topology', const ['Valley', 'Plains', 'Plateaus'], _landTopology, (v) => _landTopology = v),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _pick(_latCtrl, 'Latitude', keyboard: TextInputType.number)),
        const SizedBox(width: 12),
        Expanded(child: _pick(_lngCtrl, 'Longitude', keyboard: TextInputType.number)),
      ]),
      const SizedBox(height: 12),
      _dropdown('Water Source', const ['Well', 'Bore Well', 'Pump', 'Rainfed', 'Canal'], _waterSource, (v) => _waterSource = v),
      const SizedBox(height: 12),
      _optionalDropdown('Power Source', const ['Solar', 'Electricity', 'Fuel'], _powerSource, (v) => _powerSource = v),
      const SizedBox(height: 12),
      _dropdown('Soil Fertility', const ['Good', 'Normal', 'Poor'], _soilFertility, (v) => _soilFertility = v),
    ]);
  }

  Widget _boundaryTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _sectionTitle('Farm Boundary'),
      const Text(
        'Walk the farm boundary and capture points. Select a point to remove it. '
        'The area is computed automatically from the captured polygon.',
        style: TextStyle(color: AppTheme.textSecondary),
      ),
      const SizedBox(height: 12),
      if (_points.isNotEmpty) ...[
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: _points.asMap().entries.map((e) {
            final p = e.value;
            return InputChip(
              label: Text('${e.key + 1}: ${p.lat.toStringAsFixed(6)}, ${p.lng.toStringAsFixed(6)}'),
              onDeleted: () => _pointsChanged(() => _points.removeAt(e.key)),
              deleteIcon: const Icon(Icons.close, size: 16),
              backgroundColor: AppTheme.lightGreen,
              labelStyle: const TextStyle(fontSize: 11),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
      ],
      Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _capturing ? null : _captureCurrentLocation,
              icon: _capturing
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.my_location),
              label: const Text('Add Current Location'),
            ),
          ),
        ],
      ),
      const SizedBox(height: 8),
      _manualPointRow(),
      const SizedBox(height: 12),
      if (_points.length >= 3) ...[
        Card(
          color: AppTheme.lightGreen,
          child: ListTile(
            dense: true,
            leading: const Icon(Icons.square_foot, color: AppTheme.primaryGreen),
            title: const Text('Estimated Farm Size'),
            subtitle: Text(
              '${_computedAreaHa?.toStringAsFixed(3) ?? '—'} hectares',
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
            ),
            trailing: TextButton(
              onPressed: () {
                setState(() {
                  _sizeCtrl.text = (_computedAreaHa ?? 0).toStringAsFixed(3);
                });
              },
              child: const Text('Use as size'),
            ),
          ),
        ),
      ],
      const SizedBox(height: 8),
      if (_points.isNotEmpty && _points.length < 3)
        const Text(
          'A polygon needs at least 3 points to compute the area.',
          style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
        ),
    ]);
  }

  /// Shoelace area (square metres → hectares) of a closed lat/lng polygon.
  double? _areaFromPoints(List<({double lat, double lng})> pts) {
    if (pts.length < 3) return null;
    final n = pts.length;
    // Convert to local planar coords (metres) around the centroid so the
    // projection distortion is negligible for farm-scale polygons.
    var latSum = 0.0, lngSum = 0.0;
    for (final p in pts) { latSum += p.lat; lngSum += p.lng; }
    final lat0 = latSum / n, lng0 = lngSum / n;

    final mLat = 111320.0; // metres per degree latitude
    final mLng = 111320.0 * math.cos(lat0 * math.pi / 180.0);

    var areaSq = 0.0;
    for (var i = 0; i < n; i++) {
      final j = (i + 1) % n;
      final xi = (pts[i].lng - lng0) * mLng;
      final yi = (pts[i].lat - lat0) * mLat;
      final xj = (pts[j].lng - lng0) * mLng;
      final yj = (pts[j].lat - lat0) * mLat;
      areaSq += (xi * yj - xj * yi);
    }
    final areaM2 = (areaSq.abs() / 2.0);
    return areaM2 / 10000.0; // hectares
  }

  void _pointsChanged(void Function() change) {
    setState(() {
      change();
      _computedAreaHa = _areaFromPoints(_points);
    });
  }

  /// Persist captured polygon points to the server (best-effort, non-fatal).
  Future<void> _persistPolygon(String farmId) async {
    try {
      final res = await ApiClient().post('/api/farm-polygons', body: {
        'points': [
          for (var i = 0; i < _points.length; i++)
            {
              'farmId': farmId,
              'pointOrder': i,
              'latitude': _points[i].lat,
              'longitude': _points[i].lng,
            },
        ],
      });
      if (res.statusCode != 201) {
        debugPrint('[farm-land] polygon persist failed: ${res.statusCode}');
      }
    } catch (e) {
      debugPrint('[farm-land] polygon persist error: $e');
    }
  }

  Widget _manualPointRow() {
    String lat = '';
    String lng = '';
    return Row(
      children: [
        Expanded(child: SizedBox(height: 44, child: TextField(
          decoration: const InputDecoration(labelText: 'Latitude', isDense: true, border: OutlineInputBorder()),
          keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
          onChanged: (v) => lat = v,
        ))),
        const SizedBox(width: 8),
        Expanded(child: SizedBox(height: 44, child: TextField(
          decoration: const InputDecoration(labelText: 'Longitude', isDense: true, border: OutlineInputBorder()),
          keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
          onChanged: (v) => lng = v,
        ))),
        const SizedBox(width: 8),
        IconButton(
          onPressed: () {
            final la = double.tryParse(lat.trim());
            final lo = double.tryParse(lng.trim());
            if (la == null || lo == null) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter valid lat/lng')));
              return;
            }
            _pointsChanged(() => _points.add((lat: la, lng: lo)));
          },
          icon: const Icon(Icons.add_circle, color: AppTheme.primaryGreen),
        ),
      ],
    );
  }

  Future<void> _captureCurrentLocation() async {
    setState(() => _capturing = true);
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      if (mounted) {
        _pointsChanged(() => _points.add((lat: pos.latitude, lng: pos.longitude)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Could not get your location. Check GPS/permissions.'),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _capturing = false);
    }
  }

  Widget _soilTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _dropdown('Soil Fertility', const ['Good', 'Normal', 'Poor'], _soilFertility, (v) => _soilFertility = v),
      const SizedBox(height: 12),
      _optionalDropdown('Irrigation Type', const ['Drip', 'Canal', 'Others', 'Pivot', 'Sprinkler'], _irrigationType, (v) => _irrigationType = v),
      const SizedBox(height: 12),
      const Text('Irrigation Source & more details can be captured in the web catalog.', style: TextStyle(color: AppTheme.textSecondary)),
    ]);
  }

  Widget _labourTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _pick(_workersFT, 'Full-time Workers', keyboard: TextInputType.number),
      const SizedBox(height: 12),
      _pick(_workersPT, 'Part-time Workers', keyboard: TextInputType.number),
      const SizedBox(height: 12),
      _pick(_workersSeasonal, 'Seasonal Workers', keyboard: TextInputType.number),
      const SizedBox(height: 12),
      _pick(_workersFamily, 'Family Workers', keyboard: TextInputType.number),
    ]);
  }

  Widget _conversionTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _sectionTitle('Conversion Information'),
      _pick(_conventionalLands, 'Conventional Lands'),
      const SizedBox(height: 12),
      _pick(_fallowPastureLand, 'Fallow / Pasture Land'),
      const SizedBox(height: 12),
      _pick(_conventionalCrops, 'Conventional Crops'),
      const SizedBox(height: 12),
      _pick(_estYieldCtrl, 'Estimated Yield (kg)', keyboard: TextInputType.number),
      const SizedBox(height: 20),
      _sectionTitle('Conversion Status'),
      _optionalDropdown('Certification Type', const ['NPOP', 'NOP'], _certType, (v) => _certType = v),
      const SizedBox(height: 12),
      _optionalDropdown('Conversion Status', const ['IC-1', 'IC-2', 'IC-3', 'Organic', 'SRP'], _conversionStatus, (v) => _conversionStatus = v),
      const SizedBox(height: 12),
      _pick(_inspectorName, 'Inspector Name'),
      const SizedBox(height: 12),
      _dropdown('Conversion Qualified', const ['Select', 'Yes', 'No'], _conversionQualified == null ? 'Select' : (_conversionQualified! ? 'Yes' : 'No'), (v) {
        if (v == 'Select') return;
        setState(() => _conversionQualified = v == 'Yes');
      }),
    ]);
  }

  Widget _soilAnalysisTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _sectionTitle('Soil Analysis'),
      _pick(_soilSamplesInfo, 'No. of Samples Collected & Area'),
      const SizedBox(height: 12),
      _pick(_soilReportUrl, 'Soil Report URL'),
      const SizedBox(height: 12),
      const Text('Soil criteria rows can be captured from the web catalog.', style: TextStyle(color: AppTheme.textSecondary)),
    ]);
  }

  Widget _sectionTitle(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 4),
        child: Text(t, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
      );

  Widget _pick(TextEditingController ctrl, String label, {TextInputType? keyboard}) {
    return TextField(controller: ctrl, keyboardType: keyboard, decoration: InputDecoration(labelText: label), onChanged: (_) => setState(() {}));
  }

  Widget _dropdown(String label, List<String> options, String value, ValueChanged<String> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(labelText: label),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
      onChanged: (v) => onChanged(v!),
    );
  }

  Widget _optionalDropdown(String label, List<String> options, String? value, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String?>(
      initialValue: value,
      decoration: InputDecoration(labelText: label),
      items: [
        const DropdownMenuItem<String?>(value: null, child: Text('Select')),
        ...options.map((o) => DropdownMenuItem<String?>(value: o, child: Text(o))),
      ],
      onChanged: (v) => onChanged(v),
    );
  }
}
