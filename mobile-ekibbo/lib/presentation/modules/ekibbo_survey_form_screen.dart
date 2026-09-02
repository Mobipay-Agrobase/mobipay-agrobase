// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_ekibbo_modules.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_module_form_widgets.dart';

/// One row of the survey question builder.
class _QuestionDraft {
  _QuestionDraft();

  final TextEditingController questionCtrl = TextEditingController();
  final TextEditingController optionsCtrl = TextEditingController();
  int typeIndex = 0; // 0=TEXT 1=RADIO 2=CHECKBOX 3=NUMBER

  static const types = ['TEXT', 'RADIO', 'CHECKBOX', 'NUMBER'];

  String get type => types[typeIndex];

  /// Options parsed from the comma-separated field (RADIO/CHECKBOX only).
  List<String> get options {
    if (type != 'RADIO' && type != 'CHECKBOX') return const [];
    return optionsCtrl.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
  }

  Map<String, dynamic> toBody() => {
        'question': questionCtrl.text.trim(),
        'type': type,
        'options': options,
      };

  void dispose() {
    questionCtrl.dispose();
    optionsCtrl.dispose();
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// Survey create/edit (web Survey CRUD parity, including the question
/// builder). Fields: title, description, status, questions[] with
/// type (TEXT/RADIO/CHECKBOX/NUMBER) + comma-separated options.
/// ─────────────────────────────────────────────────────────────────────────
class EkibboSurveyFormScreen extends StatefulWidget {
  const EkibboSurveyFormScreen({super.key, this.id});

  /// Numeric id of the survey to edit; null → create mode.
  final int? id;

  @override
  State<EkibboSurveyFormScreen> createState() => _EkibboSurveyFormScreenState();
}

class _EkibboSurveyFormScreenState extends State<EkibboSurveyFormScreen> {
  static const surveyStatuses = ['ACTIVE', 'INACTIVE'];

  final _titleCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();

  final List<_QuestionDraft> _questions = [_QuestionDraft()];
  int _statusIndex = 0;
  bool _saving = false;
  bool _loading = true;

  bool get _isEdit => widget.id != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      _loadDetail();
    } else {
      _loading = false;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    for (final q in _questions) {
      q.dispose();
    }
    super.dispose();
  }

  Future<void> _loadDetail() async {
    try {
      final d = await ApiEkibboModules.detail('surveys', widget.id!);
      if (!mounted) return;
      if (d == null) {
        setState(() => _loading = false);
        return;
      }
      _titleCtrl.text = (d['title'] ?? '').toString();
      _descriptionCtrl.text = (d['description'] ?? '').toString();
      _statusIndex = surveyStatuses.indexOf((d['status'] ?? '').toString());
      if (_statusIndex < 0) _statusIndex = 0;
      final qs = d['questions'];
      if (qs is List && qs.isNotEmpty) {
        for (final q in _questions) {
          q.dispose();
        }
        _questions.clear();
        for (final raw in qs.cast<Map<String, dynamic>>()) {
          final draft = _QuestionDraft();
          draft.questionCtrl.text = (raw['question'] ?? '').toString();
          final typeIdx = _QuestionDraft.types.indexOf((raw['type'] ?? 'TEXT').toString());
          draft.typeIndex = typeIdx < 0 ? 0 : typeIdx;
          final opts = raw['options'];
          if (opts is List) {
            draft.optionsCtrl.text = opts.map((e) => e.toString()).join(', ');
          }
          _questions.add(draft);
        }
      }
      setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        DialogHelper.showToast(context, e.toString());
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _deleteSurvey() {
    return DialogHelper.showOkDialog(
      context,
      'Delete this survey and all its questions? This cannot be undone.',
      isCancel: true,
      titleOK: 'Delete',
      okAction: () async {
        try {
          DialogHelper.showLoading();
          await ApiEkibboModules.delete('surveys', widget.id!);
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
    if (_titleCtrl.text.trim().isEmpty) {
      DialogHelper.showToast(context, 'Please enter the survey title');
      return;
    }
    final questions = <Map<String, dynamic>>[];
    for (final q in _questions) {
      final text = q.questionCtrl.text.trim();
      if (text.isEmpty) continue;
      if ((q.type == 'RADIO' || q.type == 'CHECKBOX') && q.options.isEmpty) {
        DialogHelper.showToast(
            context, 'Please add options for "$text" (comma-separated)');
        return;
      }
      questions.add(q.toBody());
    }

    setState(() => _saving = true);
    final body = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim(),
      'status': surveyStatuses[_statusIndex],
      'questions': questions,
    };
    try {
      DialogHelper.showLoading();
      if (_isEdit) {
        await ApiEkibboModules.update('surveys', widget.id!, body);
      } else {
        await ApiEkibboModules.create('surveys', body);
      }
      DialogHelper.hideLoading();
      if (!mounted) return;
      DialogHelper.showToastSuccess(
          context, message: _isEdit ? 'Survey updated' : 'Survey created');
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
        title: _isEdit ? 'Edit Survey' : 'New Survey',
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
                          const EkibboLabel('Title *'),
                          AppFormField(
                            hint: 'e.g. Coffee yield assessment 2026',
                            controller: _titleCtrl,
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Description'),
                          AppFormField(
                            hint: 'What this survey is about',
                            controller: _descriptionCtrl,
                            maxLines: 2,
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Status'),
                          EkibboDropdown(
                            items: surveyStatuses,
                            selectedIndex: _statusIndex,
                            onChanged: (i) => setState(() => _statusIndex = i),
                          ),
                          const SizedBox(height: 24),
                          EkibboSectionTitle(
                              'Questions (${_questions.length})'),
                          const SizedBox(height: 8),
                          ..._questions.asMap().entries.map(_questionCard),
                          const SizedBox(height: 8),
                          AppButton(
                            title: 'Add Question',
                            height: 44,
                            color: Colors.white,
                            borderColor: ColorConstant.primary,
                            titleStyle: TextStyleConstant.quicksandW600(
                              fontSize: 14,
                              color: ColorConstant.primary,
                            ),
                            onTap: () => setState(
                                () => _questions.add(_QuestionDraft())),
                          ),
                          const SizedBox(height: 16),

                          // ─── Attachments (survey photos / evidence) ───
                          const EkibboLabel(
                              'Attachments (photos / survey evidence)'),
                          EkibboAttachmentSection(
                            relatedType: 'SURVEY',
                            relatedId: _isEdit ? widget.id.toString() : null,
                            uploadDescription:
                                'Survey — ${_titleCtrl.text.trim().isEmpty ? "field attachment" : _titleCtrl.text.trim()}',
                          ),
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
                          title: _isEdit ? 'Save Changes' : 'Create Survey',
                          height: 46,
                          onTap: _saving ? null : _submit,
                        ),
                        if (_isEdit) ...[
                          const SizedBox(height: 12),
                          AppButton(
                            title: 'Delete Survey',
                            height: 44,
                            color: Colors.white,
                            borderColor: Colors.red,
                            titleStyle: TextStyleConstant.quicksandW600(
                              fontSize: 14,
                              color: Colors.red,
                            ),
                            onTap: _deleteSurvey,
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

  Widget _questionCard(MapEntry<int, _QuestionDraft> entry) {
    final i = entry.key;
    final q = entry.value;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Question ${i + 1}',
                  style: TextStyleConstant.quicksandW600(fontSize: 13),
                ),
              ),
              if (_questions.length > 1)
                InkWell(
                  onTap: () {
                    setState(() {
                      final removed = _questions.removeAt(i);
                      removed.dispose();
                    });
                  },
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(Icons.close, size: 18, color: Colors.red),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          AppFormField(
            hint: 'Question text',
            controller: q.questionCtrl,
          ),
          const SizedBox(height: 8),
          EkibboDropdown(
            items: _QuestionDraft.types,
            selectedIndex: q.typeIndex,
            onChanged: (v) => setState(() => q.typeIndex = v),
          ),
          if (q.type == 'RADIO' || q.type == 'CHECKBOX') ...[
            const SizedBox(height: 8),
            AppFormField(
              hint: 'Options (comma-separated): Yes, No, Maybe',
              controller: q.optionsCtrl,
            ),
          ],
        ],
      ),
    );
  }
}
