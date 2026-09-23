import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/dairy_modules.dart';

/// Config-driven form dialog for create + edit operations on any dairy module.
///
/// Takes a `DairyModule` (which declares the field list) and an optional
/// `values` map (for edit mode). Renders one input per field, with the
/// appropriate widget per `DairyFieldType`:
///   - text      → AppFormField (single-line)
///   - textarea  → AppFormField (multi-line, 3 lines)
///   - number    → AppFormField (numeric keyboard)
///   - date      → tappable TextField that opens a DatePicker
///   - dropdown  → DropdownButtonFormField (only if `options` is non-empty;
///                 otherwise falls back to a plain text field)
///   - switch_   → Switch row
///
/// On Save, returns `Map<String, dynamic>` of field values via
/// `Navigator.pop(context, values)`. Returns `null` (Cancel / dismiss).
class DairyFormDialog extends StatefulWidget {
  const DairyFormDialog({
    super.key,
    required this.module,
    this.values,
  });

  final DairyModule module;

  /// Initial values when editing. `null` means create mode.
  final Map<String, dynamic>? values;

  /// Convenience method — shows the dialog and awaits the result.
  static Future<Map<String, dynamic>?> show(
    BuildContext context, {
    required DairyModule module,
    Map<String, dynamic>? values,
  }) {
    return showDialog<Map<String, dynamic>?>(
      context: context,
      builder: (_) => DairyFormDialog(module: module, values: values),
    );
  }

  @override
  State<DairyFormDialog> createState() => _DairyFormDialogState();
}

class _DairyFormDialogState extends State<DairyFormDialog> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  /// One controller per text/textarea/number/date field. Switches are stored
  /// in [_switchValues], dropdowns in [_dropdownValues].
  final Map<String, TextEditingController> _controllers = {};
  final Map<String, bool> _switchValues = {};
  final Map<String, String?> _dropdownValues = {};
  final Map<String, DateTime?> _dateValues = {};

  bool _saving = false;

  @override
  void initState() {
    super.initState();
    for (final field in widget.module.fields) {
      final initial = _initialFor(field);
      switch (field.type) {
        case DairyFieldType.switch_:
          _switchValues[field.key] = initial == true || initial == 'true';
          break;
        case DairyFieldType.dropdown:
          if (field.options.isNotEmpty) {
            final v = initial?.toString();
            _dropdownValues[field.key] =
                (v != null && v.isNotEmpty && field.options.contains(v)) ? v : null;
          } else {
            _controllers[field.key] =
                TextEditingController(text: initial?.toString() ?? '');
          }
          break;
        case DairyFieldType.date:
          _controllers[field.key] =
              TextEditingController(text: _formatDate(initial));
          final parsed = _parseDate(initial);
          if (parsed != null) _dateValues[field.key] = parsed;
          break;
        case DairyFieldType.text:
        case DairyFieldType.textarea:
        case DairyFieldType.number:
          _controllers[field.key] =
              TextEditingController(text: initial?.toString() ?? '');
          break;
      }
    }
  }

  dynamic _initialFor(DairyField field) {
    final v = widget.values?[field.key];
    if (v != null) return v;
    return field.defaultValue;
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDate(DairyField field) async {
    final now = DateTime.now();
    final initial = _dateValues[field.key] ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 30),
      lastDate: DateTime(now.year + 10),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: widget.module.color,
                ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      _dateValues[field.key] = picked;
      _controllers[field.key]?.text = _formatDate(picked);
    }
  }

  String _formatDate(dynamic v) {
    if (v == null) return '';
    if (v is DateTime) {
      return '${v.year}-${v.month.toString().padLeft(2, '0')}-${v.day.toString().padLeft(2, '0')}';
    }
    final s = v.toString();
    // Backend dates come as ISO strings — strip the time portion.
    if (s.length >= 10 && s.contains('-')) return s.substring(0, 10);
    return s;
  }

  DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    final s = v.toString();
    if (s.length < 10) return null;
    return DateTime.tryParse(s.length >= 10 ? s.substring(0, 10) : s);
  }

  Map<String, dynamic> _collectValues() {
    final out = <String, dynamic>{};
    for (final field in widget.module.fields) {
      switch (field.type) {
        case DairyFieldType.switch_:
          out[field.key] = _switchValues[field.key] ?? false;
          break;
        case DairyFieldType.dropdown:
          if (field.options.isNotEmpty) {
            final v = _dropdownValues[field.key];
            if (v != null && v.isNotEmpty) out[field.key] = v;
          } else {
            final text = _controllers[field.key]?.text.trim() ?? '';
            if (text.isNotEmpty) out[field.key] = text;
          }
          break;
        case DairyFieldType.date:
          final d = _dateValues[field.key];
          if (d != null) {
            out[field.key] = _formatDate(d);
          } else {
            final text = _controllers[field.key]?.text.trim() ?? '';
            if (text.isNotEmpty) out[field.key] = text;
          }
          break;
        case DairyFieldType.number:
          final text = _controllers[field.key]?.text.trim() ?? '';
          if (text.isEmpty) break;
          final asNum = num.tryParse(text);
          if (asNum != null) {
            out[field.key] = asNum is int ? asNum : asNum.toDouble();
          } else {
            out[field.key] = text;
          }
          break;
        case DairyFieldType.text:
        case DairyFieldType.textarea:
          final text = _controllers[field.key]?.text.trim() ?? '';
          if (text.isNotEmpty) out[field.key] = text;
          break;
      }
    }
    return out;
  }

  bool _validate() {
    final textValid = _formKey.currentState?.validate() ?? true;
    if (!textValid) return false;
    for (final field in widget.module.fields) {
      if (!field.required) continue;
      switch (field.type) {
        case DairyFieldType.switch_:
          break;
        case DairyFieldType.dropdown:
          if (field.options.isNotEmpty) {
            final v = _dropdownValues[field.key];
            if (v == null || v.isEmpty) return false;
          } else {
            final v = _controllers[field.key]?.text.trim() ?? '';
            if (v.isEmpty) return false;
          }
          break;
        case DairyFieldType.date:
          final d = _dateValues[field.key];
          final text = _controllers[field.key]?.text.trim() ?? '';
          if (d == null && text.isEmpty) return false;
          break;
        case DairyFieldType.text:
        case DairyFieldType.textarea:
        case DairyFieldType.number:
          final v = _controllers[field.key]?.text.trim() ?? '';
          if (v.isEmpty) return false;
          break;
      }
    }
    return true;
  }

  Future<void> _onSave() async {
    if (!_validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all required fields'),
          backgroundColor: ColorConstant.danger,
        ),
      );
      return;
    }
    setState(() => _saving = true);
    await Future<void>.delayed(const Duration(milliseconds: 200));
    if (!mounted) return;
    setState(() => _saving = false);
    Navigator.of(context).pop(_collectValues());
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.values != null;
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 560, maxHeight: 640),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(isEdit),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: widget.module.fields
                        .map((f) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _buildField(f),
                            ))
                        .toList(),
                  ),
                ),
              ),
            ),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isEdit) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
      decoration: BoxDecoration(
        color: widget.module.color,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
      ),
      child: Row(
        children: [
          Icon(widget.module.icon, color: Colors.white, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '${isEdit ? 'Edit' : 'Add'} ${widget.module.title}',
              style: TextStyleConstant.quicksandW700(
                fontSize: 16,
                color: Colors.white,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Row(
        children: [
          Expanded(
            child: AppButton(
              title: 'Cancel',
              height: 46,
              color: ColorConstant.grayF6F7F9,
              borderColor: ColorConstant.grayEB,
              titleStyle: TextStyleConstant.robotoW500(
                fontSize: 14,
                color: ColorConstant.textPrimary,
              ),
              onTap: () => Navigator.of(context).pop(),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: AppButton(
              title: 'Save',
              height: 46,
              color: widget.module.color,
              isLoading: _saving,
              onTap: _onSave,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildField(DairyField field) {
    final label = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              field.label,
              style: TextStyleConstant.robotoW500(
                fontSize: 12,
                color: ColorConstant.textPrimary,
              ),
            ),
            if (field.required)
              const Text(' *', style: TextStyle(color: ColorConstant.danger)),
          ],
        ),
        const SizedBox(height: 6),
      ],
    );

    switch (field.type) {
      case DairyFieldType.switch_:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            label,
            SwitchListTile(
              value: _switchValues[field.key] ?? false,
              onChanged: (v) => setState(() => _switchValues[field.key] = v),
              activeColor: widget.module.color,
              contentPadding: EdgeInsets.zero,
              title: Text(
                _switchValues[field.key] == true ? 'Yes' : 'No',
                style: TextStyleConstant.robotoW400(
                  fontSize: 13,
                  color: ColorConstant.text79,
                ),
              ),
            ),
          ],
        );

      case DairyFieldType.dropdown:
        if (field.options.isEmpty) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              label,
              _textFormField(
                field,
                controller: _controllers[field.key],
              ),
            ],
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            label,
            DropdownButtonFormField<String?>(
              value: _dropdownValues[field.key],
              decoration: _inputDecoration(field),
              hint: Text(
                field.hint ?? 'Select ${field.label}',
                style: TextStyleConstant.robotoW400(
                  fontSize: 13,
                  color: ColorConstant.textSecondary,
                ),
              ),
              items: field.options
                  .map((o) => DropdownMenuItem<String>(
                        value: o,
                        child: Text(o),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _dropdownValues[field.key] = v),
            ),
          ],
        );

      case DairyFieldType.date:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            label,
            GestureDetector(
              onTap: () => _pickDate(field),
              child: AbsorbPointer(
                child: _textFormField(
                  field,
                  controller: _controllers[field.key],
                  suffixIcon: const Icon(
                    Icons.calendar_today_outlined,
                    size: 18,
                    color: ColorConstant.textSecondary,
                  ),
                  validator: (v) {
                    if (!field.required) return null;
                    if (v == null || v.trim().isEmpty) return 'Required';
                    return null;
                  },
                ),
              ),
            ),
          ],
        );

      case DairyFieldType.number:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            label,
            _textFormField(
              field,
              controller: _controllers[field.key],
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true, signed: false),
              validator: (v) {
                if (!field.required && (v == null || v.trim().isEmpty)) {
                  return null;
                }
                if (v == null || v.trim().isEmpty) return 'Required';
                if (num.tryParse(v.trim()) == null) {
                  return 'Enter a valid number';
                }
                return null;
              },
            ),
          ],
        );

      case DairyFieldType.textarea:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            label,
            _textFormField(
              field,
              controller: _controllers[field.key],
              maxLines: 3,
            ),
          ],
        );

      case DairyFieldType.text:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            label,
            _textFormField(
              field,
              controller: _controllers[field.key],
            ),
          ],
        );
    }
  }

  Widget _textFormField(
    DairyField field, {
    required TextEditingController? controller,
    TextInputType? keyboardType,
    int maxLines = 1,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator ??
          (field.required
              ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
              : null),
      decoration: _inputDecoration(field, suffixIcon: suffixIcon),
    );
  }

  InputDecoration _inputDecoration(DairyField field, {Widget? suffixIcon}) {
    return InputDecoration(
      filled: true,
      fillColor: ColorConstant.grayF6F7F9,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      suffixIcon: suffixIcon,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: widget.module.color, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: ColorConstant.danger, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: ColorConstant.danger, width: 1.5),
      ),
    );
  }
}
