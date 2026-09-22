import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/components/app_dropdown_button.dart';
import 'package:mobipay_ekibbo/components/app_form_field.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';

/// EKiBBO Crops per Plot — embedded tab content widget (Screen 5).
///
/// This is NOT a standalone screen. It's used inside the Farm Land detail
/// screen's Tab #2. It manages the cultivations (crops planted on this plot)
/// for the parent farm land:
///
///   - Inline "Add Crop" button (top-right) expands an inline form:
///       Crop Name (required), Variety, Plant Count, Area (ha), Season (A/B/Annual)
///   - Save → POST /api/cultivations (with farmId = parent farm land id,
///     seedlingCount = plant count, bambooVariety = variety)
///   - List of existing cultivations below the form: each row shows crop name,
///     variety badge, season badge, plant count (TreePine icon), area (ha),
///     delete button. Delete → DELETE /api/cultivations/<id> with confirmation.
///   - Refresh the list after add/delete (calls onCultivationsChanged callback
///     so the parent can refresh its crop count badge too).
class CropsPerPlotTab extends StatefulWidget {
  const CropsPerPlotTab({
    super.key,
    required this.farmLandId,
    this.initialCultivations,
    this.onCultivationsChanged,
  });

  /// The parent farm land ID (used when POSTing new cultivations).
  final String farmLandId;

  /// Optional initial cultivations list (avoid refetch on first paint).
  final List<Map<String, dynamic>>? initialCultivations;

  /// Notify parent that cultivations changed (so parent can refresh totals).
  final VoidCallback? onCultivationsChanged;

  @override
  State<CropsPerPlotTab> createState() => _CropsPerPlotTabState();
}

class _CropsPerPlotTabState extends State<CropsPerPlotTab> {
  final _cropNameCtrl = TextEditingController();
  final _varietyCtrl = TextEditingController();
  final _plantCountCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();

  bool _formExpanded = false;
  bool _saving = false;
  bool _loading = true;
  bool _deletingId = false;
  String? _error;
  String? _season;
  String? _deleteTargetId;

  static const _seasons = ['Season A', 'Season B', 'Annual'];

  List<Map<String, dynamic>> _cultivations = [];

  @override
  void initState() {
    super.initState();
    if (widget.initialCultivations != null) {
      _cultivations = List.from(widget.initialCultivations!);
      _loading = false;
    } else {
      _loadCultivations();
    }
  }

  @override
  void dispose() {
    _cropNameCtrl.dispose();
    _varietyCtrl.dispose();
    _plantCountCtrl.dispose();
    _areaCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCultivations() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient()
          .get('/api/cultivations?farmId=${widget.farmLandId}');
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
      final list = (body['cultivations'] ?? body['data'] ?? body) as List? ?? [];
      if (!mounted) return;
      setState(() {
        _cultivations = list
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
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
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  Future<void> _save() async {
    if (_cropNameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLang.local.please_fill_crop_name),
          backgroundColor: ColorConstant.danger,
        ),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'farmId': widget.farmLandId,
        'cropName': _cropNameCtrl.text.trim(),
        'bambooVariety': _varietyCtrl.text.trim().isNotEmpty
            ? _varietyCtrl.text.trim()
            : null,
        'seedlingCount': int.tryParse(_plantCountCtrl.text),
        'areaHa': double.tryParse(_areaCtrl.text),
        'season': _season,
      };
      final res = await ApiClient().post('/api/cultivations', body: payload);
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 201 || res.statusCode == 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.cultivation_added_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        _resetForm();
        await _loadCultivations();
        widget.onCultivationsChanged?.call();
      } else {
        String err = AppLang.local.cultivation_save_failed;
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
          content: Text('${AppLang.local.cultivation_save_failed}: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _resetForm() {
    _cropNameCtrl.clear();
    _varietyCtrl.clear();
    _plantCountCtrl.clear();
    _areaCtrl.clear();
    setState(() {
      _season = null;
      _formExpanded = false;
    });
  }

  Future<void> _confirmDelete(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLang.local.confirm_delete),
        content: Text(AppLang.local.confirm_delete_cultivation_msg),
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
    setState(() {
      _deletingId = true;
      _deleteTargetId = id;
    });
    try {
      final res = await ApiClient().delete('/api/cultivations/$id');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200 || res.statusCode == 204) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.cultivation_deleted_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        await _loadCultivations();
        widget.onCultivationsChanged?.call();
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
      if (mounted) {
        setState(() {
          _deletingId = false;
          _deleteTargetId = null;
        });
      }
    }
  }

  String _str(dynamic v) => v == null ? '' : v.toString();

  String _cropName(Map<String, dynamic> c) =>
      _str(c['cropName'] ?? c['name'] ?? c['bambooVariety']);

  String _variety(Map<String, dynamic> c) => _str(c['bambooVariety'] ?? c['variety']);

  String _formatSeason(Map<String, dynamic> c) => _str(c['season']);

  int _plantCount(Map<String, dynamic> c) {
    final v = c['seedlingCount'] ?? c['plantCount'] ?? c['count'];
    if (v is num) return v.toInt();
    return int.tryParse(_str(v)) ?? 0;
  }

  double _area(Map<String, dynamic> c) {
    final v = c['areaHa'] ?? c['area'];
    if (v is num) return v.toDouble();
    return double.tryParse(_str(v)) ?? 0.0;
  }

  String _id(Map<String, dynamic> c) => _str(c['id'] ?? c['_id']);

  Color _seasonColor(String s) {
    if (s.contains('A')) return ColorConstant.info;
    if (s.contains('B')) return ColorConstant.secondary;
    return ColorConstant.gold;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildHeader(),
        if (_formExpanded) _buildForm(),
        const SizedBox(height: 8),
        Expanded(child: _buildBody()),
      ],
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            AppLang.local.crops_per_plot.toUpperCase(),
            style: TextStyleConstant.robotoW800(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          TextButton.icon(
            onPressed: _saving
                ? null
                : () => setState(() => _formExpanded = !_formExpanded),
            icon: Icon(
              _formExpanded ? Icons.expand_less : Icons.add,
              size: 18,
              color: ColorConstant.primary,
            ),
            label: Text(
              AppLang.local.add_crop,
              style: TextStyleConstant.robotoW600(
                fontSize: 12,
                color: ColorConstant.primary,
              ),
            ),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.primary.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppFormField(
            controller: _cropNameCtrl,
            hint: AppLang.local.crop,
            labelText: '${AppLang.local.crop} *',
          ),
          const SizedBox(height: 10),
          AppFormField(
            controller: _varietyCtrl,
            hint: AppLang.local.crop_variety,
            labelText: AppLang.local.crop_variety,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _plantCountCtrl,
                  hint: AppLang.local.plant_count,
                  labelText: AppLang.local.plant_count,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _areaCtrl,
                  hint: AppLang.local.area_ha,
                  labelText: AppLang.local.area_ha,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          AppDropwdownButton(
            items: _seasons,
            itemSelected: _season,
            hintText: AppLang.local.season,
            onChanged: (i) => setState(() => _season = _seasons[i]),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  title: AppLang.local.cancel,
                  height: 42,
                  color: ColorConstant.grayF6F7F9,
                  titleStyle: TextStyleConstant.robotoW600(
                    fontSize: 13,
                    color: ColorConstant.textPrimary,
                  ),
                  onTap: _resetForm,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppButton(
                  title: AppLang.local.save_crop,
                  height: 42,
                  isLoading: _saving,
                  onTap: _saving ? null : _save,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline,
                  size: 40, color: ColorConstant.danger),
              const SizedBox(height: 8),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyleConstant.robotoW400(
                    fontSize: 12, color: ColorConstant.text79),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _loadCultivations,
                child: Text(AppLang.local.retry),
              ),
            ],
          ),
        ),
      );
    }
    if (_cultivations.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            AppLang.local.no_crops_added,
            textAlign: TextAlign.center,
            style: TextStyleConstant.robotoW400(
                fontSize: 12, color: ColorConstant.textSecondary),
          ),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
      itemCount: _cultivations.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) => _buildCultivationRow(_cultivations[i]),
    );
  }

  Widget _buildCultivationRow(Map<String, dynamic> c) {
    final id = _id(c);
    final name = _cropName(c);
    final variety = _variety(c);
    final season = _formatSeason(c);
    final count = _plantCount(c);
    final area = _area(c);
    final isDeleting = _deletingId && _deleteTargetId == id;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: ColorConstant.grayEB),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: ColorConstant.secondary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.park,
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
                    fontSize: 13,
                    color: ColorConstant.heading,
                  ),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    if (variety.isNotEmpty)
                      _badge(variety, ColorConstant.primary),
                    if (season.isNotEmpty) _badge(season, _seasonColor(season)),
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
              ],
            ),
          ),
          const SizedBox(width: 8),
          isDeleting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : IconButton(
                  icon: const Icon(Icons.delete_outline,
                      color: ColorConstant.danger, size: 20),
                  onPressed: () => _confirmDelete(id),
                  tooltip: AppLang.local.delete,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
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
}
