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
/// Farm Visit create/edit (web FarmVisit CRUD parity).
///
/// Fields: farmer (picker), visit date, topic, observations,
/// recommendations, follow-up date, status.
/// ─────────────────────────────────────────────────────────────────────────
class EkibboFarmVisitFormScreen extends StatefulWidget {
  const EkibboFarmVisitFormScreen({super.key, this.id});

  /// Numeric id of the visit to edit; null → create mode.
  final int? id;

  @override
  State<EkibboFarmVisitFormScreen> createState() =>
      _EkibboFarmVisitFormScreenState();
}

class _EkibboFarmVisitFormScreenState extends State<EkibboFarmVisitFormScreen> {
  static const visitStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

  final _topicCtrl = TextEditingController();
  final _observationsCtrl = TextEditingController();
  final _recommendationsCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();
  final _followUpCtrl = TextEditingController();

  DateTime? _date;
  DateTime? _followUpDate;
  int _statusIndex = 1; // default COMPLETED (web default)
  bool _saving = false;
  bool _loading = true;

  int _farmerId = 0;
  String _farmerName = '';

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
    _observationsCtrl.dispose();
    _recommendationsCtrl.dispose();
    _dateCtrl.dispose();
    _followUpCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDetail() async {
    try {
      final d = await ApiEkibboModules.detail('farm-visits', widget.id!);
      if (!mounted) return;
      if (d == null) {
        setState(() => _loading = false);
        return;
      }
      _farmerId = (d['farmer_id'] ?? 0) as int;
      _farmerName = (d['farmer_name'] ?? '').toString();
      _topicCtrl.text = (d['topic'] ?? '').toString();
      _observationsCtrl.text = (d['observations'] ?? '').toString();
      _recommendationsCtrl.text = (d['recommendations'] ?? '').toString();
      final visitDate = (d['visit_date'] ?? '').toString();
      if (visitDate.length >= 10) {
        _date = DateTime.tryParse(visitDate.substring(0, 10));
        _dateCtrl.text = visitDate.substring(0, 10);
      }
      final followUp = (d['follow_up_date'] ?? '').toString();
      if (followUp.length >= 10) {
        _followUpDate = DateTime.tryParse(followUp.substring(0, 10));
        _followUpCtrl.text = followUp.substring(0, 10);
      }
      _statusIndex = visitStatuses.indexOf((d['status'] ?? '').toString());
      if (_statusIndex < 0) _statusIndex = 1;
      setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        DialogHelper.showToast(context, e.toString());
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _pickFarmer() async {
    final res = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) =>
            ScreenSearchFarmer(argument: ArgumentScreenSearchFarmer()),
      ),
    );
    if (res is ArgumentScreenSearchFarmer && mounted) {
      setState(() {
        _farmerId = res.farmerId;
        _farmerName = res.farmerSelected;
      });
    }
  }

  Future<void> _pickDate({bool followUp = false}) async {
    final initial = followUp
        ? (_followUpDate ?? DateTime.now())
        : (_date ?? DateTime.now());
    final picked = await DateHelper.showDateDialog(
      context,
      initialDate: initial,
      firstDate: DateTime(2000, 1),
    );
    if (picked != null) {
      setState(() {
        if (followUp) {
          _followUpDate = picked;
          _followUpCtrl.text =
              DateHelper.convertDateToStr(picked, format: 'yyyy-MM-dd');
        } else {
          _date = picked;
          _dateCtrl.text =
              DateHelper.convertDateToStr(picked, format: 'yyyy-MM-dd');
        }
      });
    }
  }

  Future<void> _deleteVisit() {
    return DialogHelper.showOkDialog(
      context,
      'Delete this farm visit? This cannot be undone.',
      isCancel: true,
      titleOK: 'Delete',
      okAction: () async {
        try {
          DialogHelper.showLoading();
          await ApiEkibboModules.delete('farm-visits', widget.id!);
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
    if (_farmerId == 0) {
      DialogHelper.showToast(context, 'Please choose the farmer visited');
      return;
    }
    if (_topicCtrl.text.trim().isEmpty) {
      DialogHelper.showToast(context, 'Please enter the visit topic');
      return;
    }
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'farmer_id': _farmerId,
      'visit_date': _dateCtrl.text,
      'topic': _topicCtrl.text.trim(),
      'observations': _observationsCtrl.text.trim(),
      'recommendations': _recommendationsCtrl.text.trim(),
      'follow_up_date': _followUpCtrl.text.trim().isEmpty ? null : _followUpCtrl.text.trim(),
      'status': visitStatuses[_statusIndex],
    };
    try {
      DialogHelper.showLoading();
      if (_isEdit) {
        await ApiEkibboModules.update('farm-visits', widget.id!, body);
      } else {
        await ApiEkibboModules.create('farm-visits', body);
      }
      DialogHelper.hideLoading();
      if (!mounted) return;
      DialogHelper.showToastSuccess(
          context, message: _isEdit ? 'Farm visit updated' : 'Farm visit created');
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
        title: _isEdit ? 'Edit Farm Visit' : 'New Farm Visit',
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
                          const EkibboLabel('Farmer *'),
                          InkWell(
                            onTap: _pickFarmer,
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: ColorConstant.grayF6F7F9,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      _farmerName.isEmpty
                                          ? 'Tap to choose a farmer'
                                          : _farmerName,
                                      style: TextStyleConstant.robotoW400(
                                        fontSize: 14,
                                        color: _farmerName.isEmpty
                                            ? ColorConstant.text79.withOpacity(0.6)
                                            : Colors.black,
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.chevron_right, size: 20),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Visit Date *'),
                          InkWell(
                            onTap: () => _pickDate(),
                            child: IgnorePointer(
                              child: AppFormField(
                                  hint: 'yyyy-MM-dd', controller: _dateCtrl, readOnly: true),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Topic *'),
                          AppFormField(
                            hint: 'e.g. Pest inspection',
                            controller: _topicCtrl,
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Observations'),
                          AppFormField(
                            hint: 'What was observed on the farm',
                            controller: _observationsCtrl,
                            maxLines: 3,
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Recommendations'),
                          AppFormField(
                            hint: 'Advice given to the farmer',
                            controller: _recommendationsCtrl,
                            maxLines: 3,
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Follow-up Date'),
                          InkWell(
                            onTap: () => _pickDate(followUp: true),
                            child: IgnorePointer(
                              child: AppFormField(
                                  hint: 'yyyy-MM-dd (optional)',
                                  controller: _followUpCtrl,
                                  readOnly: true),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const EkibboLabel('Status'),
                          EkibboDropdown(
                            items: visitStatuses,
                            selectedIndex: _statusIndex,
                            onChanged: (i) => setState(() => _statusIndex = i),
                          ),
                          const SizedBox(height: 16),

                          // ─── Attachments (visit photos / farm evidence) ───
                          const EkibboLabel(
                              'Attachments (photos / visit evidence)'),
                          EkibboAttachmentSection(
                            relatedType: 'FARM_VISIT',
                            relatedId: _isEdit ? widget.id.toString() : null,
                            uploadDescription:
                                'Farm visit — ${_topicCtrl.text.trim().isEmpty ? "field attachment" : _topicCtrl.text.trim()}',
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
                          title: _isEdit ? 'Save Changes' : 'Create Farm Visit',
                          height: 46,
                          onTap: _saving ? null : _submit,
                        ),
                        if (_isEdit) ...[
                          const SizedBox(height: 12),
                          AppButton(
                            title: 'Delete Farm Visit',
                            height: 44,
                            color: Colors.white,
                            borderColor: Colors.red,
                            titleStyle: TextStyleConstant.quicksandW600(
                              fontSize: 14,
                              color: Colors.red,
                            ),
                            onTap: _deleteVisit,
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
}
