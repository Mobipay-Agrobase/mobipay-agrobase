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
/// Training create/edit — Ekibbo two-part structure (Ekibbo team feedback).
///
/// Part 1 — Scheduling: type (Group training | Farmer visit), main topic
/// (Bamboo, Regenerative agriculture, Financial literacy), specific topic,
/// funder (EKiBBO, ETG, Enabel, Doen), date, trainer, farmer group (list of
/// formed groups with group codes).
///
/// Part 2 — Reporting (edit mode): time spent (minutes), findings,
/// challenges, recommendations, attendee attendance marking, and
/// attachments (field photos + scanned attendance form) — uploaded to the
/// same /api/attachments store the web platform uses, so reports are
/// complete from either side.
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
  // Ekibbo: type of training — Group training or Farmer visit only.
  static const trainingTypes = ['GROUP_TRAINING', 'FARM_VISIT'];
  static const trainingStatuses = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

  // Ekibbo: main topics.
  static const mainTopics = [
    'BAMBOO',
    'REGENERATIVE_AGRICULTURE',
    'FINANCIAL_LITERACY',
  ];
  // Ekibbo: training funders.
  static const funders = ['EKIBBO', 'ETG', 'ENABEL', 'DOEN'];

  final _topicCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _trainerCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _attendeesCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();

  // ─── Reporting fields ───
  final _durationCtrl = TextEditingController();
  final _findingsCtrl = TextEditingController();
  final _challengesCtrl = TextEditingController();
  final _recommendationsCtrl = TextEditingController();

  DateTime? _date;
  int _typeIndex = 0;
  int _statusIndex = 0;
  int _mainTopicIndex = -1; // -1 = not selected
  int _funderIndex = -1; // -1 = not selected
  int _groupIndex = -1; // -1 = not selected
  bool _saving = false;
  bool _loading = true;

  /// Farmer groups for the group selector: {id, name, group_code, farmer_count}
  List<Map<String, dynamic>> _groups = [];

  /// Enrolled farmers (edit mode): {id, farmer_id, farmer_name, farmer_code, enrollment_status, attended}
  List<Map<String, dynamic>> _attendance = [];

  bool get _isEdit => widget.id != null;

  @override
  void initState() {
    super.initState();
    _loadGroups();
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
    _durationCtrl.dispose();
    _findingsCtrl.dispose();
    _challengesCtrl.dispose();
    _recommendationsCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadGroups() async {
    try {
      final groups = await ApiEkibboModules.farmerGroups();
      if (!mounted) return;
      setState(() => _groups = groups);
    } catch (_) {
      // Groups list is optional; the form still works without it.
    }
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

      // ─── Ekibbo scheduling fields ───
      _mainTopicIndex = mainTopics.indexOf((d['main_topic'] ?? '').toString());
      _funderIndex = funders.indexOf((d['funder'] ?? '').toString());
      // Group pre-select: match numeric group_id against loaded groups
      final groupId = d['group_id'];
      if (groupId != null && _groups.isNotEmpty) {
        final idx = _groups.indexWhere((g) => g['id'] == groupId);
        if (idx >= 0) _groupIndex = idx;
      }

      // ─── Ekibbo reporting fields ───
      final duration = d['duration_minutes'];
      _durationCtrl.text = duration == null ? '' : duration.toString();
      _findingsCtrl.text = (d['findings'] ?? '').toString();
      _challengesCtrl.text = (d['challenges'] ?? '').toString();
      _recommendationsCtrl.text = (d['recommendations'] ?? '').toString();

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

  /// Reporting: toggle a farmer's attendance on this training.
  Future<void> _toggleAttended(Map<String, dynamic> row) async {
    final farmerId = row['farmer_id'] as int;
    final current = row['attended'] == true;
    try {
      DialogHelper.showLoading();
      await ApiEkibboModules.markAttendance(
        widget.id!,
        farmerId,
        attended: !current,
      );
      DialogHelper.hideLoading();
      _loadDetail();
    } catch (e) {
      DialogHelper.hideLoading();
      DialogHelper.showToast(context, e.toString());
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
      DialogHelper.showToast(context, 'Please enter the specific training topic');
      return;
    }
    if (_mainTopicIndex < 0) {
      DialogHelper.showToast(context, 'Please select the main topic');
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
      // ─── Ekibbo scheduling fields ───
      'mainTopic': _mainTopicIndex >= 0 ? mainTopics[_mainTopicIndex] : null,
      'funder': _funderIndex >= 0 ? funders[_funderIndex] : null,
      'group_id': _groupIndex >= 0 && _groupIndex < _groups.length
          ? _groups[_groupIndex]['id']
          : null,
      // ─── Ekibbo reporting fields ───
      'durationMinutes':
          _durationCtrl.text.trim().isEmpty ? null : int.tryParse(_durationCtrl.text.trim()),
      'findings': _findingsCtrl.text.trim(),
      'challenges': _challengesCtrl.text.trim(),
      'recommendations': _recommendationsCtrl.text.trim(),
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
                          _sectionTitle('Scheduling'),
                          const SizedBox(height: 12),
                          _label('Type of Training *'),
                          _dropdown(
                            trainingTypes.map(_prettyType).toList(),
                            _typeIndex,
                            (i) => setState(() => _typeIndex = i),
                          ),
                          const SizedBox(height: 16),
                          _label('Main Topic *'),
                          _dropdownWithPlaceholder(
                            mainTopics.map(_prettyMainTopic).toList(),
                            _mainTopicIndex,
                            'Select main topic',
                            (i) => setState(() => _mainTopicIndex = i),
                          ),
                          const SizedBox(height: 16),
                          _label('Specific Topic *'),
                          AppFormField(
                            hint: 'e.g. Coffee Pruning Best Practices',
                            controller: _topicCtrl,
                          ),
                          const SizedBox(height: 16),
                          _label('Training Funder'),
                          _dropdownWithPlaceholder(
                            funders.map(_prettyFunder).toList(),
                            _funderIndex,
                            'Select funder',
                            (i) => setState(() => _funderIndex = i),
                          ),
                          const SizedBox(height: 16),
                          _label('Date *'),
                          _dateField(_dateCtrl, _pickDate),
                          const SizedBox(height: 16),
                          _label('Trainer / Facilitator'),
                          AppFormField(hint: 'e.g. John Okello', controller: _trainerCtrl),
                          const SizedBox(height: 16),
                          _label('Farmer Group to be Trained'),
                          _groups.isEmpty
                              ? Text(
                                  'No farmer groups available yet. Groups of 25-35 farmers with group codes are set up by EKiBBO.',
                                  style: TextStyleConstant.robotoW400(
                                    fontSize: 12,
                                    color: ColorConstant.text79,
                                  ),
                                )
                              : _dropdownWithPlaceholder(
                                  _groups
                                      .map((g) =>
                                          '${g['name']}'
                                          '${(g['group_code'] ?? '').toString().isNotEmpty ? ' (${g['group_code']})' : ''}'
                                          ' — ${g['farmer_count']} farmers')
                                      .toList(),
                                  _groupIndex,
                                  'Select farmer group',
                                  (i) => setState(() => _groupIndex = i),
                                ),
                          const SizedBox(height: 16),
                          _label('Location'),
                          AppFormField(hint: 'e.g. Nakisunga Sub-county Hall', controller: _locationCtrl),
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

                          // ─── Part 2: Reporting (Ekibbo feedback) ───
                          const SizedBox(height: 28),
                          _sectionTitle('Reporting'),
                          const SizedBox(height: 8),
                          Text(
                            'Fill after the training takes place — time spent, attendees, findings, challenges, recommendations and photo attachments.',
                            style: TextStyleConstant.robotoW400(
                              fontSize: 11,
                              color: ColorConstant.text79,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _label('Time Spent on Training (minutes)'),
                          AppFormField(
                            hint: 'e.g. 120',
                            controller: _durationCtrl,
                            keyboardType: TextInputType.number,
                          ),
                          const SizedBox(height: 16),
                          _label('Findings'),
                          AppFormField(
                            hint: 'What was observed or learned during the training?',
                            controller: _findingsCtrl,
                            maxLines: 3,
                          ),
                          const SizedBox(height: 16),
                          _label('Challenges'),
                          AppFormField(
                            hint: 'What challenges were encountered?',
                            controller: _challengesCtrl,
                            maxLines: 3,
                          ),
                          const SizedBox(height: 16),
                          _label('Recommendations'),
                          AppFormField(
                            hint: 'What should be done next or improved?',
                            controller: _recommendationsCtrl,
                            maxLines: 3,
                          ),
                          const SizedBox(height: 16),

                          // ─── Attachments (photos + attendance form) ───
                          _label('Attachments (photos / attendance form)'),
                          EkibboAttachmentSection(
                            relatedType: 'TRAINING',
                            relatedId: _isEdit ? widget.id.toString() : null,
                            uploadDescription:
                                'Training report — ${_topicCtrl.text.trim().isEmpty ? "field attachment" : _topicCtrl.text.trim()}',
                          ),

                          // ─── Attendees (enrollment + attendance marking) ───
                          if (_isEdit) ...[
                            const SizedBox(height: 24),
                            _sectionTitle('Attendees (${_attendance.length})'),
                            const SizedBox(height: 8),
                            if (_attendance.isEmpty)
                              Text(
                                'No farmers enrolled yet. Tap "Enroll Farmer" to add attendees from the group.',
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
    final attended = row['attended'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: attended ? ColorConstant.primary.withOpacity(0.06) : ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(8),
        border: attended ? Border.all(color: ColorConstant.primary.withOpacity(0.4)) : null,
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
          // Reporting: mark attended / absent
          InkWell(
            onTap: () => _toggleAttended(row),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: attended ? ColorConstant.primary : Colors.white,
                border: Border.all(color: ColorConstant.primary),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                attended ? 'ATTENDED' : 'Mark Attended',
                style: TextStyleConstant.quicksandW600(
                  fontSize: 10,
                  color: attended ? Colors.white : ColorConstant.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 4),
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

  /// Dropdown that supports "no selection yet" (placeholder) state.
  Widget _dropdownWithPlaceholder(
    List<String> items,
    int index,
    String placeholder,
    ValueChanged<int> onChanged,
  ) {
    if (index < 0) {
      return InkWell(
        onTap: () {
          // Open a bottom sheet picker so a value can be chosen.
          _showPickerSheet(items, placeholder, onChanged);
        },
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          decoration: BoxDecoration(
            color: ColorConstant.grayF6F7F9,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            placeholder,
            style: TextStyleConstant.robotoW400(
              fontSize: 14,
              color: ColorConstant.text79,
            ),
          ),
        ),
      );
    }
    return EkibboDropdown(
      items: items,
      selectedIndex: index,
      onChanged: onChanged,
    );
  }

  void _showPickerSheet(
    List<String> items,
    String title,
    ValueChanged<int> onChanged,
  ) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(title, style: TextStyleConstant.quicksandW700(fontSize: 15)),
            ),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: items.length,
                itemBuilder: (context, i) => ListTile(
                  title: Text(items[i], style: TextStyleConstant.robotoW400(fontSize: 14)),
                  onTap: () {
                    Navigator.of(context).pop();
                    onChanged(i);
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dateField(TextEditingController ctrl, VoidCallback onTap) => InkWell(
        onTap: onTap,
        child: IgnorePointer(
          child: AppFormField(hint: 'yyyy-MM-dd', controller: ctrl, readOnly: true),
        ),
      );

  String _prettyType(String t) => t.replaceAll('_', ' ');
  String _prettyMainTopic(String t) => t
      .replaceAll('_', ' ')
      .replaceAllMapped(RegExp(r'^\w'), (m) => m.group(0)!.toUpperCase());
  String _prettyFunder(String f) {
    switch (f) {
      case 'EKIBBO':
        return 'EKiBBO';
      case 'ETG':
        return 'ETG';
      case 'ENABEL':
        return 'Enabel';
      case 'DOEN':
        return 'Doen';
    }
    return f;
  }
}
