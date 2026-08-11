import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/sync/offline_repository.dart';
import '../../../../core/theme/app_theme.dart';

/// Cultivation create/edit form with seed & sowing auto-calculations.
class CultivationFormPage extends StatefulWidget {
  final String? cultivationId;
  final String? farmId;
  const CultivationFormPage({super.key, this.cultivationId, this.farmId});

  @override
  State<CultivationFormPage> createState() => _CultivationFormPageState();
}

class _CultivationFormPageState extends State<CultivationFormPage> {
  final _cropCtrl = TextEditingController();
  final _varietyCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();
  final _sowingDateCtrl = TextEditingController();
  final _estYieldCtrl = TextEditingController();
  final _seedQtyCtrl = TextEditingController();
  final _seedPriceCtrl = TextEditingController();
  final _sowingChargesCtrl = TextEditingController();
  final _sowingHoursCtrl = TextEditingController();
  final _seedlingCountCtrl = TextEditingController();
  final _bambooCtrl = TextEditingController();

  String _cropCategory = 'Main Crop';
  String _season = '2026A';
  String _seedSource = 'Certified';
  bool _isSeedTreated = false;
  String _seedType = 'Certified';
  String _sowingType = 'Transplanting';
  String _sowingChargesBy = 'hectare';
  String? _farmId;

  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _farmId = widget.farmId;
    _load();
  }

  @override
  void dispose() {
    _cropCtrl.dispose(); _varietyCtrl.dispose(); _areaCtrl.dispose();
    _sowingDateCtrl.dispose(); _estYieldCtrl.dispose(); _seedQtyCtrl.dispose();
    _seedPriceCtrl.dispose(); _sowingChargesCtrl.dispose(); _sowingHoursCtrl.dispose();
    _seedlingCountCtrl.dispose(); _bambooCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (widget.cultivationId != null) {
      final repo = context.read<OfflineRepository>();
      final c = await repo.getCultivationById(widget.cultivationId!);
      if (c != null) {
        _cropCtrl.text = c['cropName'] ?? '';
        _varietyCtrl.text = c['variety'] ?? '';
        _areaCtrl.text = _fmtNum(c['cultivationAreaHa']);
        _sowingDateCtrl.text = _fmtDate(c['sowingDate']);
        _estYieldCtrl.text = _fmtNum(c['estimatedYield']);
        _seedQtyCtrl.text = _fmtNum(c['seedQuantity']);
        _seedPriceCtrl.text = _fmtNum(c['seedPrice']);
        _sowingChargesCtrl.text = _fmtNum(c['sowingCharges']);
        if (c['sowingChargesBy'] == 'hour') _sowingHoursCtrl.text = _fmtNum(c['sowingHours']);
        _seedlingCountCtrl.text = _fmtNum(c['seedlingCount']);
        _bambooCtrl.text = c['bambooVariety'] ?? '';
        _cropCategory = c['cropCategory'] ?? 'Main Crop';
        _season = c['season'] ?? '2026A';
        _seedSource = c['seedSource'] ?? 'Certified';
        _isSeedTreated = c['isSeedTreated'] == true;
        _seedType = c['seedType'] ?? 'Certified';
        _sowingType = c['sowingType'] ?? 'Transplanting';
        _sowingChargesBy = c['sowingChargesBy'] ?? 'hectare';
        _farmId = c['farmId'] ?? _farmId;
      }
    } else if (_farmId == null) {
      final repo = context.read<OfflineRepository>();
      final farms = await repo.getFarmLands();
      _farmId = farms.isNotEmpty ? (farms.first['id'] as String) : null;
    }
    if (mounted) setState(() => _loading = false);
  }

  String _fmtNum(dynamic v) => v == null ? '' : '${v}';
  String _fmtDate(dynamic d) {
    if (d == null) return '';
    final dt = DateTime.tryParse(d.toString());
    if (dt == null) return '';
    return '${dt.year}-${_p(dt.month)}-${_p(dt.day)}';
  }
  String _p(int v) => v.toString().padLeft(2, '0');
  bool get _isEdit => widget.cultivationId != null;

  double get _seedCost =>
      (double.tryParse(_seedQtyCtrl.text) ?? 0) * (double.tryParse(_seedPriceCtrl.text) ?? 0);

  double get _sowingCost {
    final charges = double.tryParse(_sowingChargesCtrl.text) ?? 0;
    if (_sowingChargesBy == 'hour') {
      return (double.tryParse(_sowingHoursCtrl.text) ?? 0) * charges;
    }
    return (double.tryParse(_areaCtrl.text) ?? 0) * charges;
  }

  Future<void> _save() async {
    if (_farmId == null || _cropCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Farm and Crop Name are required')));
      return;
    }
    setState(() => _saving = true);
    final payload = {
      'farmId': _farmId,
      'cropName': _cropCtrl.text.trim(),
      'cropCategory': _cropCategory,
      'variety': _emptyToNull(_varietyCtrl.text.trim()),
      'season': _season,
      'cultivationAreaHa': _num(_areaCtrl.text),
      'sowingDate': _date(_sowingDateCtrl.text),
      'estimatedYield': _num(_estYieldCtrl.text),
      'seedSource': _seedSource,
      'isSeedTreated': _isSeedTreated,
      'seedType': _seedType,
      'seedQuantity': _num(_seedQtyCtrl.text),
      'seedPrice': _num(_seedPriceCtrl.text),
      'seedCost': _seedCost == 0 ? null : _seedCost,
      'sowingType': _sowingType,
      'sowingChargesBy': _sowingChargesBy,
      'sowingCharges': _num(_sowingChargesCtrl.text),
      'sowingCost': _sowingCost == 0 ? null : _sowingCost,
      'sowingHours': _sowingChargesBy == 'hour' ? _num(_sowingHoursCtrl.text) : null,
      'bambooVariety': _emptyToNull(_bambooCtrl.text.trim()),
      'seedlingCount': _num(_seedlingCountCtrl.text),
    };

    final repo = context.read<OfflineRepository>();
    try {
      if (_isEdit) {
        await repo.updateCultivation(widget.cultivationId!, payload);
      } else {
        await repo.createCultivation(payload);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'Cultivation updated' : 'Cultivation created'),
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

  dynamic _emptyToNull(String s) => s.isEmpty ? null : s;
  num? _num(String t) {
    final v = double.tryParse(t);
    return v == null ? null : v;
  }
  DateTime? _date(String t) => t.isEmpty ? null : DateTime.tryParse(t);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Cultivation' : 'New Cultivation'),
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
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _sectionTitle('Cultivation Information'),
                _pick(_cropCtrl, 'Crop Name *'),
                const SizedBox(height: 12),
                _fieldDropdown('Crop Category', const ['Main Crop', 'Inter Crop', 'Border Crop'], _cropCategory, (v) => _cropCategory = v),
                const SizedBox(height: 12),
                _pick(_varietyCtrl, 'Crop Variety'),
                const SizedBox(height: 12),
                _fieldDropdown('Season', const ['2026A', '2026B', '2025A', 'Annual'], _season, (v) => _season = v),
                const SizedBox(height: 12),
                _pick(_areaCtrl, 'Cultivation Area (ha)', keyboard: TextInputType.number),
                const SizedBox(height: 12),
                _pick(_sowingDateCtrl, 'Sowing Date (YYYY-MM-DD)'),
                const SizedBox(height: 12),
                _pick(_estYieldCtrl, 'Estimated Yield (kg)', keyboard: TextInputType.number),
                const SizedBox(height: 20),
                _sectionTitle('Seed Information'),
                _fieldDropdown('Seed Source', const ['Certified', 'Local', 'Retained', 'Imported'], _seedSource, (v) => _seedSource = v),
                SwitchListTile(
                  value: _isSeedTreated,
                  onChanged: (v) => setState(() => _isSeedTreated = v),
                  title: const Text('Seed Treated'),
                  contentPadding: EdgeInsets.zero,
                ),
                _fieldDropdown('Seed Type', const ['Certified', 'Hybrid', 'Local', 'Open Pollinated'], _seedType, (v) => _seedType = v),
                const SizedBox(height: 12),
                _pick(_seedQtyCtrl, 'Seed Quantity (kg)', keyboard: TextInputType.number),
                const SizedBox(height: 12),
                _pick(_seedPriceCtrl, 'Seed Price (per kg)', keyboard: TextInputType.number),
                _calcRow('Seed Cost', _seedCost),
                const SizedBox(height: 20),
                _fieldDropdown('Type of Sowing', const ['Direct Seeding', 'Transplanting', 'Broadcasting', 'Drilling'], _sowingType, (v) => _sowingType = v),
                const SizedBox(height: 12),
                _fieldDropdown('Sowing Charges By', const ['hectare', 'hour', 'day', 'acre'], _sowingChargesBy, (v) => setState(() => _sowingChargesBy = v!)),
                const SizedBox(height: 12),
                _pick(_sowingChargesCtrl, 'Sowing Charges', keyboard: TextInputType.number),
                if (_sowingChargesBy == 'hour') ...[
                  const SizedBox(height: 12),
                  _pick(_sowingHoursCtrl, 'Sowing Hours', keyboard: TextInputType.number),
                ],
                _calcRow('Sowing Cost', _sowingCost),
                const SizedBox(height: 20),
                _sectionTitle('Additional'),
                _pick(_seedlingCountCtrl, 'Seedling Count', keyboard: TextInputType.number),
                const SizedBox(height: 12),
                _pick(_bambooCtrl, 'Bamboo Variety'),
                const SizedBox(height: 100),
              ],
            ),
    );
  }

  Widget _sectionTitle(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 4),
        child: Text(t, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
      );

  Widget _pick(TextEditingController ctrl, String label, {TextInputType? keyboard}) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboard,
      decoration: InputDecoration(labelText: label),
      onChanged: (_) => setState(() {}),
    );
  }

  Widget _fieldDropdown(String label, List<String> options, String value, ValueChanged<String> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(labelText: label),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
      onChanged: (v) => onChanged(v!),
    );
  }

  Widget _calcRow(String label, double amount) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        const Icon(Icons.calculate, color: AppTheme.primaryGreen),
        const SizedBox(width: 8),
        Text('$label:', style: const TextStyle(fontWeight: FontWeight.w600)),
        const Spacer(),
        Text('UGX ${amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
      ]),
    );
  }
}
