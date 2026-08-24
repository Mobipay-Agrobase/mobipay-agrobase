// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_ekibbo_modules.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_module_form_widgets.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Training create/edit (web Training CRUD parity).
///
/// Create: topic, type, date, location, trainer, expected attendees, notes.
/// Edit:  same fields + enrolled-farmer management (enroll via the farmer
///        picker, remove per row) — the web attendance flow.
/// ─────────────────────────────────────────────────────────────────────────
class EkibboTrainingFormScreen extends StatefulWidget {
  const EkibboTrainingFormScreen({super.key, this.id});

  /// Numeric id of the training to edit; null → create mode.
  final int? id;

  @override
  State<EkibboTrainingFormScreen> createState() =>
      _EkibboTrainingFormScreenState();
}

class _EkibboTrainingFormScreenState extends State<EkibboTrainingFormScreen> {
  static const trainingTypes = [
    'GROUP_TRAINING',
    'FARM_VISIT',
    'DEMO_PLOT',
    'WORKSHOP',
    'FIELD_DAY',
  ];
  static const trainingStatuses = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

  final _topicCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _trainerCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _attendeesCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();

  DateTime? _date;
  int _typeIndex = 0;
  int _statusIndex = 0;
  bool _saving = false;
  bool _loading = true;

  /// Enrolled farmers (edit mode): {id, farmer_name, farmer_code, enrollment_status}
  List<Map<String, dynamic>> _attendance = [];

  bool get _isEdit => widget.id != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      _loadDetail();
    } else {
      _date = DateTime.now();
      _dateCtrl.text = DateHelper.convertDateToStr(_date!, format: 'yyyy-MM-dd');
      _loading = false;
    }
  }

  @override
  void dispose() {
    _topicCtrl.dispose();
    _locationCtrl.dispose();
    _trainerCtrl.dispose();
    _notesCtrl.dispose();
    _attendeesCtrl.dispose();
    _dateCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDetail() async {
    try {
      final d = await ApiEkibboModules.detail('trainings', widget.id!);
      if (!mounted) return;
      if (d == null) {
        setState(() => _loading = false);
        return;
      }
      _topicCtrl.text = (d['topic'] ?? '').toString();
      _locationCtrl.text = (d['location'] ?? '').toString();
      _trainerCtrl.text = (d['trainer'] ?? '').toString();
      _notesCtrl.text = (d['notes'] ?? '').toString();
      final expected = d['expected_attendees'];
      _attendeesCtrl.text = expected == null ? '' : expected.toString();
      final dateStr = (d['date'] ?? '').toString();
      if (dateStr.length >= 10) {
        _date = DateTime.tryParse(dateStr.substring(0, 10));
        _dateCtrl.text = dateStr.substring(0, 10);
      }
      _typeIndex = trainingTypes.indexOf((d['type'] ?? '').toString());
      if (_typeIndex < 0) _typeIndex = 0;
      _statusIndex = trainingStatuses.indexOf((d['status'] ?? '').toString());
      if (_statusIndex < 0) _statusIndex = 0;
      final att = d['attendance'];
      _attendance = att is List ? att.cast<Map<String, dynamic>>() : [];
      setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        DialogHelper.showToast(context, e.toString());
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _pickDate() async {
    final picked = await DateHelper.showDateDialog(
      context,
      initialDate: _date ?? DateTime.now(),
      firstDate: DateTime(2000, 1),
    );
    if (picked != null) {
      setState(() {
        _date = picked;
        _dateCtrl.text = DateHelper.convertDateToStr(picked, format: 'yyyy-MM-dd');
      });
    }
  }

  Future<void> _enrollFarmer() async {
    final res = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) =>
            ScreenSearchFarmer(argument: ArgumentScreenSearchFarmer()),
      ),
    );
    if (res is ArgumentScreenSearchFarmer && res.farmerId != 0) {
      try {
        DialogHelper.showLoading();
        await ApiEkibboModules.enrollFarmer(widget.id!, res.farmerId);
        DialogHelper.hideLoading();
        DialogHelper.showToastSuccess(context, message: 'Farmer enrolled');
        _loadDetail();
      } catch (e) {
        DialogHelper.hideLoading();
        DialogHelper.showToast(context, e.toString());
      }
    }
  }

  Future<void> _removeEnrollment(Map<String, dynamic> row) async {
    try {
      DialogHelper.showLoading();
      await ApiEkibboModules.delete('training-attendance', row['id'] as int);
      DialogHelper.hideLoading();
      _loadDetail();
    } catch (e) {
      DialogHelper.hideLoading();
      DialogHelper.showToast(context, e.toString());
    }
  }

  Future<void> _deleteTraining() {
    return DialogHelper.showOkDialog(
      context,
      'Delete this training? This cannot be undone.',
      isCancel: true,
      titleOK: 'Delete',
      okAction: () async {
        try {
          DialogHelper.showLoading();
          await ApiEkibboModules.delete('trainings', widget.id!);
          DialogHelper.hideLoading();
          if (!mounted) return;
          Navigator.of(context).pop(true);
        } catch (e) {
          DialogHelper.hideLoading();
          DialogHelper.showToast(context, e.toString());
        }
      },
    );
  }

  Future<void> _submit() async {
    if (_topicCtrl.text.trim().isEmpty) {
      DialogHelper.showToast(context, 'Please enter the training topic');
      return;
    }
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'topic': _topicCtrl.text.trim(),
      'description': _notesCtrl.text.trim(),
      'date': _dateCtrl.text,
      'location': _locationCtrl.text.trim(),
      'trainerName': _trainerCtrl.text.trim(),
      'type': trainingTypes[_typeIndex],
      'status': trainingStatuses[_statusIndex],
      'expectedAttendees':
          _attendeesCtrl.text.trim().isEmpty ? null : int.tryParse(_attendeesCtrl.text.trim()),
      'notes': _notesCtrl.text.trim(),
    };
    try {
      DialogHelper.showLoading();
      if (_isEdit) {
        await ApiEkibboModules.update('trainings', widget.id!, body);
      } else {
        await ApiEkibboModules.create('trainings', body);
      }
      DialogHelper.hideLoading();
      if (!mounted) return;
      DialogHelper.showToastSuccess(
          context, message: _isEdit ? 'Training updated' : 'Training created');
      Navigator.of(context).pop(true);
    } catch (e) {
      DialogHelper.hideLoading();
      DialogHelper.showToast(context, e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: _isEdit ? 'Edit Training' : 'New Training',
        color: ColorConstant.primary,
        titleColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ColorConstant.primary))
          : SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Topic *'),
                          AppFormField(
                            hint: 'e.g. Good Agricultural Practices',
                            controller: _topicCtrl,
                          ),
                          const SizedBox(height: 16),
                          _label('Type'),
                          _dropdown(
                            trainingTypes.map(_prettyType).toList(),
                            _typeIndex,
                            (i) => setState(() => _typeIndex = i),
                          ),
                          const SizedBox(height: 16),
                          _label('Date *'),
                          _dateField(_dateCtrl, _pickDate),
                          const SizedBox(height: 16),
                          _label('Location'),
                          AppFormField(hint: 'e.g. Nakisunga Sub-county Hall', controller: _locationCtrl),
                          const SizedBox(height: 16),
                          _label('Trainer / Facilitator'),
                          AppFormField(hint: 'e.g. John Okello', controller: _trainerCtrl),
                          const SizedBox(height: 16),
                          _label('Expected Attendees'),
                          AppFormField(
                            hint: 'e.g. 25',
                            controller: _attendeesCtrl,
                            keyboardType: TextInputType.number,
                          ),
                          const SizedBox(height: 16),
                          _label('Status'),
                          _dropdown(trainingStatuses, _statusIndex,
                              (i) => setState(() => _statusIndex = i)),
                          const SizedBox(height: 16),
                          _label('Notes'),
                          AppFormField(
                            hint: 'Training notes / materials used',
                            controller: _notesCtrl,
                            maxLines: 3,
                          ),
                          if (_isEdit) ...[
                            const SizedBox(height: 24),
                            _sectionTitle('Enrolled Farmers (${_attendance.length})'),
                            const SizedBox(height: 8),
                            if (_attendance.isEmpty)
                              Text(
                                'No farmers enrolled yet. Tap "Enroll Farmer" to invite farmers to this training.',
                                style: TextStyleConstant.robotoW400(
                                  fontSize: 12,
                                  color: ColorConstant.text79,
                                ),
                              )
                            else
                              ..._attendance.map(_attendanceRow),
                            const SizedBox(height: 12),
                            AppButton(
                              title: 'Enroll Farmer',
                              height: 44,
                              color: Colors.white,
                              borderColor: ColorConstant.primary,
                              titleStyle: TextStyleConstant.quicksandW600(
                                fontSize: 14,
                                color: ColorConstant.primary,
                              ),
                              onTap: _enrollFarmer,
                            ),
                          ],
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        AppButton(
                          title: _isEdit ? 'Save Changes' : 'Create Training',
                          height: 46,
                          onTap: _saving ? null : _submit,
                        ),
                        if (_isEdit) ...[
                          const SizedBox(height: 12),
                          AppButton(
                            title: 'Delete Training',
                            height: 44,
                            color: Colors.white,
                            borderColor: Colors.red,
                            titleStyle: TextStyleConstant.quicksandW600(
                              fontSize: 14,
                              color: Colors.red,
                            ),
                            onTap: _deleteTraining,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _attendanceRow(Map<String, dynamic> row) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (row['farmer_name'] ?? '').toString(),
                  style: TextStyleConstant.quicksandW600(fontSize: 13),
                ),
                Text(
                  '${(row['farmer_code'] ?? '').toString()} · ${(row['enrollment_status'] ?? '').toString()}',
                  style: TextStyleConstant.robotoW400(
                    fontSize: 11,
                    color: ColorConstant.text79,
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: () => _removeEnrollment(row),
            child: const Padding(
              padding: EdgeInsets.all(6),
              child: Icon(Icons.close, size: 18, color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) => EkibboLabel(text);

  Widget _sectionTitle(String text) => EkibboSectionTitle(text);

  Widget _dropdown(List<String> items, int index, ValueChanged<int> onChanged) {
    return EkibboDropdown(
      items: items,
      selectedIndex: index,
      onChanged: onChanged,
    );
  }

  Widget _dateField(TextEditingController ctrl, VoidCallback onTap) => InkWell(
        onTap: onTap,
        child: IgnorePointer(
          child: AppFormField(hint: 'yyyy-MM-dd', controller: ctrl, readOnly: true),
        ),
      );

  String _prettyType(String t) => t.replaceAll('_', ' ');
}
