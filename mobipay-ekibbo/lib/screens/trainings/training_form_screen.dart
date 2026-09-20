import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/components/app_dropdown_button.dart';
import 'package:mobipay_ekibbo/components/app_form_field.dart';
import 'package:mobipay_ekibbo/components/empty_state.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// EKiBBO Training form screen (Screen 8).
///
/// Multi-tab form for scheduling and reporting on training events:
///   1. Scheduling — type, main topic, specific topic, funder, date, trainer,
///                   farmer group, status, start/end time, duration, location,
///                   expected attendees
///   2. Reporting  — findings, challenges, recommendations, materials used,
///                   notes (all textareas)
///   3. Attendees  — list enrolled attendees (GET /api/trainings/<id>/attendance),
///                   bulk "Enroll All Group Members" (POST /api/trainings/<id>/
///                   enroll-group with groupId), per-attendee Attended/Absent
///                   toggle (PUT /api/trainings/<id>/attendance/<attId>)
///   4. Files      — Take Photo (camera), Pick Photos (gallery), upload via
///                   ApiClient().uploadFiles(), grid of thumbnails with delete
///                   (DELETE /api/trainings/<id>/attachments?url=...)
///
/// Save → POST /api/trainings (create) or PUT /api/trainings/<id> (edit).
/// Mode: create (trainingId == null) or edit (trainingId != null).
///
/// The Attendees + Files tabs are disabled in create mode (no training row
/// exists yet to attach to). After the first save, the screen stays open in
/// edit mode and those tabs become available.
class TrainingFormScreen extends StatefulWidget {
  const TrainingFormScreen({
    super.key,
    this.trainingId,
  });

  /// If non-null, the form operates in edit mode and loads the existing
  /// training record before paint.
  final String? trainingId;

  @override
  State<TrainingFormScreen> createState() => _TrainingFormScreenState();
}

class _TrainingFormScreenState extends State<TrainingFormScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;

  // ─── Scheduling controllers ──────────────────────────────────────────────
  final _specificTopicCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();
  final _trainerCtrl = TextEditingController();
  final _startTimeCtrl = TextEditingController();
  final _endTimeCtrl = TextEditingController();
  final _durationCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _expectedAttendeesCtrl = TextEditingController();

  // ─── Reporting controllers ──────────────────────────────────────────────
  final _findingsCtrl = TextEditingController();
  final _challengesCtrl = TextEditingController();
  final _recommendationsCtrl = TextEditingController();
  final _materialsCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  // Dropdowns / selects
  String? _type;
  String? _mainTopic;
  String? _funder;
  String? _status;
  String? _selectedGroupId;
  String? _selectedGroupLabel;

  // Farmer groups fetched from /api/farmer-groups?limit=200
  List<Map<String, dynamic>> _farmerGroups = [];
  bool _groupsLoading = false;

  // Loading / saving state
  bool _loading = true;
  bool _saving = false;
  bool _enrollingAll = false;
  bool _uploading = false;
  String? _error;

  // The currently-saved training id (equals widget.trainingId after first
  // load, or assigned after a successful create).
  String? _currentTrainingId;

  // Attendees + attachments (only loaded in edit mode)
  List<Map<String, dynamic>> _attendees = [];
  bool _attendeesLoading = false;
  String? _attendeesError;

  List<String> _attachments = [];
  bool _attachmentsLoading = false;
  String? _attachmentsError;
  String? _deletingUrl;

  static const _types = ['GROUP_TRAINING', 'FARM_VISIT'];
  static const _mainTopics = [
    'Bamboo',
    'Regenerative Agriculture',
    'Financial Literacy',
  ];
  static const _funders = ['EKiBBO', 'ETG', 'Enabel', 'Doen'];
  static const _statuses = [
    'PLANNED',
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _currentTrainingId = widget.trainingId;
    _loadInitial();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _specificTopicCtrl.dispose();
    _dateCtrl.dispose();
    _trainerCtrl.dispose();
    _startTimeCtrl.dispose();
    _endTimeCtrl.dispose();
    _durationCtrl.dispose();
    _locationCtrl.dispose();
    _expectedAttendeesCtrl.dispose();
    _findingsCtrl.dispose();
    _challengesCtrl.dispose();
    _recommendationsCtrl.dispose();
    _materialsCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadInitial() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _loadFarmerGroups();
      if (_currentTrainingId != null) {
        await _loadTraining();
      }
      if (!mounted) return;
      setState(() => _loading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '${AppLang.local.load_failed} ($e)';
        _loading = false;
      });
    }
  }

  Future<void> _loadFarmerGroups() async {
    setState(() => _groupsLoading = true);
    try {
      final res = await ApiClient().get('/api/farmer-groups?limit=200');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        final list = (body['groups'] ?? body['farmerGroups'] ?? body['data'])
                as List? ??
            [];
        if (!mounted) return;
        setState(() {
          _farmerGroups = list
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
          _groupsLoading = false;
        });
      } else {
        if (!mounted) return;
        setState(() => _groupsLoading = false);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _groupsLoading = false);
    }
  }

  Future<void> _loadTraining() async {
    if (_currentTrainingId == null) return;
    try {
      final res =
          await ApiClient().get('/api/trainings/$_currentTrainingId');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode != 200) {
        if (!mounted) return;
        setState(() {
          _error = '${AppLang.local.load_failed} (HTTP ${res.statusCode})';
        });
        return;
      }
      final body = jsonDecode(res.body);
      final t = body is Map
          ? (body['training'] ?? body['data'] ?? body)
          : null;
      if (t is Map) {
        final data = Map<String, dynamic>.from(t);
        _hydrateForm(data);
      }
      if (!mounted) return;
      // After loading the training, fetch attendees + attachments in parallel.
      await Future.wait([
        _loadAttendees(),
        _loadAttachments(),
      ]);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '${AppLang.local.load_failed} ($e)';
      });
    }
  }

  void _hydrateForm(Map<String, dynamic> t) {
    _type = _strOrNull(t['type']);
    _mainTopic = _strOrNull(t['mainTopic']);
    _funder = _strOrNull(t['funder']);
    _status = _strOrNull(t['status']);
    _specificTopicCtrl.text = _str(t['specificTopic'] ?? t['topic']);
    _dateCtrl.text = _str(t['date'] ?? t['trainingDate']);
    _trainerCtrl.text = _str(t['trainerName'] ?? t['trainer']);
    _startTimeCtrl.text = _str(t['startTime']);
    _endTimeCtrl.text = _str(t['endTime']);
    _durationCtrl.text = _str(t['duration'] ?? t['durationMinutes']);
    _locationCtrl.text = _str(t['location']);
    _expectedAttendeesCtrl.text = _str(t['expectedAttendees']);
    _findingsCtrl.text = _str(t['findings']);
    _challengesCtrl.text = _str(t['challenges']);
    _recommendationsCtrl.text = _str(t['recommendations']);
    _materialsCtrl.text = _str(t['materialsUsed'] ?? t['materials']);
    _notesCtrl.text = _str(t['notes']);

    // Farmer group pre-selection
    final groupId = _str(t['groupId'] ?? t['farmerGroupId']);
    if (groupId.isNotEmpty) {
      _selectedGroupId = groupId;
      // Find label from already-loaded groups; if not found, fall back to id.
      final match = _farmerGroups.firstWhere(
        (g) => _str(g['id'] ?? g['_id']) == groupId,
        orElse: () => <String, dynamic>{},
      );
      _selectedGroupLabel = _str(match['name'] ?? match['groupName']);
      if (_selectedGroupLabel!.isEmpty) _selectedGroupLabel = groupId;
    }
  }

  String _str(dynamic v) => v == null ? '' : v.toString();
  String? _strOrNull(dynamic v) {
    final s = _str(v);
    return s.isEmpty ? null : s;
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
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (d != null) {
      ctrl.text = d.toIso8601String().split('T')[0];
    }
  }

  Future<void> _pickTime(TextEditingController ctrl) async {
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (t != null) {
      // Format as HH:mm (24h)
      final hh = t.hour.toString().padLeft(2, '0');
      final mm = t.minute.toString().padLeft(2, '0');
      ctrl.text = '$hh:$mm';
    }
  }

  // ─── Save (create or update) ────────────────────────────────────────────
  Future<void> _save() async {
    if (_mainTopic == null && _specificTopicCtrl.text.trim().isEmpty) {
      _showError('Please fill in the main topic or specific topic');
      return;
    }
    if (_dateCtrl.text.isEmpty) {
      _showError('Please pick a training date');
      return;
    }
    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'type': _type ?? 'GROUP_TRAINING',
        'mainTopic': _mainTopic,
        'specificTopic': _specificTopicCtrl.text.trim().isNotEmpty
            ? _specificTopicCtrl.text.trim()
            : null,
        'funder': _funder,
        'date': _dateCtrl.text,
        'trainerName': _trainerCtrl.text.trim().isNotEmpty
            ? _trainerCtrl.text.trim()
            : null,
        'groupId': _selectedGroupId,
        'status': _status ?? 'PLANNED',
        'startTime': _startTimeCtrl.text.isNotEmpty ? _startTimeCtrl.text : null,
        'endTime': _endTimeCtrl.text.isNotEmpty ? _endTimeCtrl.text : null,
        'duration': int.tryParse(_durationCtrl.text),
        'location': _locationCtrl.text.trim().isNotEmpty
            ? _locationCtrl.text.trim()
            : null,
        'expectedAttendees': int.tryParse(_expectedAttendeesCtrl.text),
        // Reporting tab
        'findings': _findingsCtrl.text.trim().isNotEmpty
            ? _findingsCtrl.text.trim()
            : null,
        'challenges': _challengesCtrl.text.trim().isNotEmpty
            ? _challengesCtrl.text.trim()
            : null,
        'recommendations': _recommendationsCtrl.text.trim().isNotEmpty
            ? _recommendationsCtrl.text.trim()
            : null,
        'materialsUsed': _materialsCtrl.text.trim().isNotEmpty
            ? _materialsCtrl.text.trim()
            : null,
        'notes': _notesCtrl.text.trim().isNotEmpty
            ? _notesCtrl.text.trim()
            : null,
      };

      final isEdit = _currentTrainingId != null;
      final res = isEdit
          ? await ApiClient()
              .put('/api/trainings/$_currentTrainingId', body: payload)
          : await ApiClient().post('/api/trainings', body: payload);

      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200 || res.statusCode == 201) {
        // Capture the training id (in create mode the server returns it).
        if (!isEdit) {
          try {
            final d = jsonDecode(res.body);
            final id = _str(d['id'] ?? d['_id'] ?? (d['training'] is Map
                ? d['training']['id']
                : null));
            if (id.isNotEmpty) _currentTrainingId = id;
          } catch (_) {}
        }
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isEdit
                ? AppLang.local.training_updated_success
                : AppLang.local.training_created_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        // After a successful create, switch to the Scheduling tab and refresh
        // attendees/attachments tabs (now available).
        setState(() {});
        if (!isEdit && _currentTrainingId != null) {
          await Future.wait([
            _loadAttendees(),
            _loadAttachments(),
          ]);
        }
      } else {
        String err = AppLang.local.training_save_failed;
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        _showError(err);
      }
    } catch (e) {
      _showError('${AppLang.local.training_save_failed}: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: ColorConstant.danger),
    );
  }

  // ─── Attendees ──────────────────────────────────────────────────────────
  Future<void> _loadAttendees() async {
    if (_currentTrainingId == null) return;
    setState(() {
      _attendeesLoading = true;
      _attendeesError = null;
    });
    try {
      final res = await ApiClient()
          .get('/api/trainings/$_currentTrainingId/attendance');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode != 200) {
        if (!mounted) return;
        setState(() {
          _attendeesError =
              '${AppLang.local.load_failed} (HTTP ${res.statusCode})';
          _attendeesLoading = false;
        });
        return;
      }
      final body = jsonDecode(res.body);
      final list = (body['attendance'] ?? body['attendees'] ?? body['data'])
              as List? ??
          [];
      if (!mounted) return;
      setState(() {
        _attendees = list
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _attendeesLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _attendeesError = '${AppLang.local.load_failed} ($e)';
        _attendeesLoading = false;
      });
    }
  }

  Future<void> _enrollAllGroupMembers() async {
    if (_currentTrainingId == null) {
      _showError(AppLang.local.save_training_first);
      return;
    }
    if (_selectedGroupId == null || _selectedGroupId!.isEmpty) {
      _showError('Please select a farmer group first');
      return;
    }
    setState(() => _enrollingAll = true);
    try {
      final res = await ApiClient().post(
        '/api/trainings/$_currentTrainingId/enroll-group',
        body: {'groupId': _selectedGroupId},
      );
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200 || res.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.enrolled_group_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        await _loadAttendees();
      } else {
        String err = AppLang.local.enroll_group_failed;
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        _showError(err);
      }
    } catch (e) {
      _showError('${AppLang.local.enroll_group_failed}: $e');
    } finally {
      if (mounted) setState(() => _enrollingAll = false);
    }
  }

  Future<void> _setAttended(Map<String, dynamic> att, bool attended) async {
    if (_currentTrainingId == null) return;
    final attId = _str(att['id'] ?? att['_id']);
    if (attId.isEmpty) return;
    try {
      final res = await ApiClient().put(
        '/api/trainings/$_currentTrainingId/attendance/$attId',
        body: {
          'attended': attended,
          'enrollmentStatus': attended ? 'ATTENDED' : 'ABSENT',
        },
      );
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200) {
        if (!mounted) return;
        // Optimistically update the local list to reflect the change immediately.
        setState(() {
          final idx = _attendees.indexWhere(
              (a) => _str(a['id'] ?? a['_id']) == attId);
          if (idx >= 0) {
            _attendees[idx] = Map<String, dynamic>.from(_attendees[idx])
              ..['attended'] = attended
              ..['enrollmentStatus'] = attended ? 'ATTENDED' : 'ABSENT';
          }
        });
      } else {
        String err = AppLang.local.attendance_update_failed;
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        _showError(err);
      }
    } catch (e) {
      _showError('${AppLang.local.attendance_update_failed}: $e');
    }
  }

  // ─── Files / Attachments ────────────────────────────────────────────────
  Future<void> _loadAttachments() async {
    if (_currentTrainingId == null) return;
    setState(() {
      _attachmentsLoading = true;
      _attachmentsError = null;
    });
    try {
      // The server returns attachments inside the training record itself,
      // so fetch the training and extract the attachments array.
      final res =
          await ApiClient().get('/api/trainings/$_currentTrainingId');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode != 200) {
        if (!mounted) return;
        setState(() {
          _attachmentsError =
              '${AppLang.local.load_failed} (HTTP ${res.statusCode})';
          _attachmentsLoading = false;
        });
        return;
      }
      final body = jsonDecode(res.body);
      final t = body is Map
          ? (body['training'] ?? body['data'] ?? body)
          : null;
      final list = (t is Map ? t['attachments'] : null) as List? ?? [];
      if (!mounted) return;
      setState(() {
        _attachments = list
            .map((e) => e is String
                ? e
                : _str(e is Map ? (e['url'] ?? e['fileUrl'] ?? e['path']) : e))
            .where((u) => u.isNotEmpty)
            .toList();
        _attachmentsLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _attachmentsError = '${AppLang.local.load_failed} ($e)';
        _attachmentsLoading = false;
      });
    }
  }

  Future<void> _takePhoto() async {
    if (_currentTrainingId == null) {
      _showError(AppLang.local.save_training_first);
      return;
    }
    try {
      final picker = ImagePicker();
      final x = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
      );
      if (x == null) return;
      await _uploadFiles([x]);
    } catch (e) {
      _showError('${AppLang.local.upload_failed}: $e');
    }
  }

  Future<void> _pickPhotos() async {
    if (_currentTrainingId == null) {
      _showError(AppLang.local.save_training_first);
      return;
    }
    try {
      final picker = ImagePicker();
      final xs = await picker.pickMultiImage(imageQuality: 80);
      if (xs.isEmpty) return;
      await _uploadFiles(xs);
    } catch (e) {
      _showError('${AppLang.local.upload_failed}: $e');
    }
  }

  Future<void> _uploadFiles(List<XFile> xs) async {
    setState(() => _uploading = true);
    try {
      final files = <Map<String, dynamic>>[];
      for (final x in xs) {
        final bytes = await x.readAsBytes();
        final name = x.name.isNotEmpty ? x.name : 'photo.jpg';
        files.add({
          'bytes': bytes,
          'name': name,
          'contentType': x.mimeType ?? 'image/jpeg',
        });
      }
      final res = await ApiClient().uploadFiles(
        '/api/trainings/$_currentTrainingId/attachments',
        files: files,
      );
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200 || res.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.upload_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        await _loadAttachments();
      } else {
        String err = AppLang.local.upload_failed;
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        _showError(err);
      }
    } catch (e) {
      _showError('${AppLang.local.upload_failed}: $e');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _deleteAttachment(String url) async {
    if (_currentTrainingId == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLang.local.confirm_delete),
        content: Text(AppLang.local.confirm_delete_attachment_msg),
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
    setState(() => _deletingUrl = url);
    try {
      final encoded = Uri.encodeComponent(url);
      final res = await ApiClient()
          .delete('/api/trainings/$_currentTrainingId/attachments?url=$encoded');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200 || res.statusCode == 204) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.attachment_deleted_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        await _loadAttachments();
      } else {
        String err = AppLang.local.delete_failed;
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        _showError(err);
      }
    } catch (e) {
      _showError('${AppLang.local.delete_failed}: $e');
    } finally {
      if (mounted) setState(() => _deletingUrl = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = _currentTrainingId != null;
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: isEdit
            ? AppLang.local.edit_training
            : AppLang.local.new_training,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : Column(
                  children: [
                    Container(
                      color: ColorConstant.surface,
                      child: TabBar(
                        controller: _tabController,
                        isScrollable: true,
                        labelColor: ColorConstant.primary,
                        unselectedLabelColor: ColorConstant.textSecondary,
                        indicatorColor: ColorConstant.primary,
                        indicatorSize: TabBarIndicatorSize.label,
                        labelStyle: TextStyleConstant.robotoW600(
                          fontSize: 12,
                          color: ColorConstant.primary,
                        ),
                        unselectedLabelStyle: TextStyleConstant.robotoW500(
                          fontSize: 12,
                          color: ColorConstant.textSecondary,
                        ),
                        tabs: [
                          Tab(text: AppLang.local.scheduling),
                          Tab(text: AppLang.local.reporting),
                          Tab(text: AppLang.local.attendees),
                          Tab(text: AppLang.local.files),
                        ],
                      ),
                    ),
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildSchedulingTab(),
                          _buildReportingTab(),
                          _buildAttendeesTab(),
                          _buildFilesTab(),
                        ],
                      ),
                    ),
                  ],
                ),
      bottomNavigationBar: SafeArea(
        child: Container(
          color: ColorConstant.surface,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: AppButton(
            title: _saving
                ? AppLang.local.saving
                : (isEdit ? AppLang.local.save : AppLang.local.save_training),
            height: 48,
            isLoading: _saving,
            onTap: _saving ? null : _save,
          ),
        ),
      ),
    );
  }

  // ─── Scheduling tab ─────────────────────────────────────────────────────
  Widget _buildSchedulingTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionHeader(AppLang.local.scheduling.toUpperCase()),
          const SizedBox(height: 12),
          AppDropwdownButton(
            items: _types.toList(),
            itemSelected: _type,
            hintText: AppLang.local.training_type,
            onChanged: (i) => setState(() => _type = _types[i]),
          ),
          const SizedBox(height: 12),
          AppDropwdownButton(
            items: _mainTopics.toList(),
            itemSelected: _mainTopic,
            hintText: AppLang.local.main_topic,
            onChanged: (i) => setState(() => _mainTopic = _mainTopics[i]),
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _specificTopicCtrl,
            hint: AppLang.local.specific_topic,
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          AppDropwdownButton(
            items: _funders.toList(),
            itemSelected: _funder,
            hintText: AppLang.local.funder,
            onChanged: (i) => setState(() => _funder = _funders[i]),
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _dateCtrl,
            hint: AppLang.local.training_date,
            readOnly: true,
            suffixIcon:
                const Icon(Icons.calendar_today_outlined, size: 18),
            onTap: () => _pickDate(_dateCtrl),
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _trainerCtrl,
            hint: AppLang.local.trainer_name,
          ),
          const SizedBox(height: 12),
          // Farmer group select — opens a bottom sheet
          _buildGroupSelector(),
          const SizedBox(height: 12),
          AppDropwdownButton(
            items: _statuses.toList(),
            itemSelected: _status,
            hintText: AppLang.local.status,
            onChanged: (i) => setState(() => _status = _statuses[i]),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _startTimeCtrl,
                  hint: AppLang.local.start_time,
                  readOnly: true,
                  suffixIcon: const Icon(Icons.access_time, size: 18),
                  onTap: () => _pickTime(_startTimeCtrl),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _endTimeCtrl,
                  hint: AppLang.local.end_time,
                  readOnly: true,
                  suffixIcon: const Icon(Icons.access_time, size: 18),
                  onTap: () => _pickTime(_endTimeCtrl),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppFormField(
                  controller: _durationCtrl,
                  hint: AppLang.local.duration_minutes,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppFormField(
                  controller: _expectedAttendeesCtrl,
                  hint: AppLang.local.expected_attendees,
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _locationCtrl,
            hint: AppLang.local.location,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildGroupSelector() {
    return InkWell(
      onTap: _groupsLoading ? null : _showGroupPicker,
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: ColorConstant.grayF6F7F9,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                _selectedGroupLabel ??
                    (_groupsLoading
                        ? AppLang.local.loading_groups
                        : AppLang.local.select_farmer_group),
                style: TextStyleConstant.worksansW500(
                  color: _selectedGroupLabel != null
                      ? ColorConstant.textPrimary
                      : ColorConstant.gray6C757D,
                ),
              ),
            ),
            const Icon(Icons.arrow_drop_down, color: ColorConstant.gray6C757D),
          ],
        ),
      ),
    );
  }

  Future<void> _showGroupPicker() async {
    if (_farmerGroups.isEmpty) {
      _showError(AppLang.local.no_farmer_groups);
      return;
    }
    final labels = _farmerGroups.map((g) {
      final name = _str(g['name'] ?? g['groupName']);
      final count = (g['farmerCount'] as num?)?.toInt() ?? 0;
      return count > 0 ? '$name ($count)' : name;
    }).toList();
    final selectedIndex = _farmerGroups.indexWhere(
      (g) => _str(g['id'] ?? g['_id']) == _selectedGroupId,
    );
    final picked = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      AppLang.local.select_farmer_group,
                      style: TextStyleConstant.robotoW600(
                        fontSize: 14,
                        color: ColorConstant.heading,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(ctx).size.height * 0.6,
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: labels.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final isSelected = i == selectedIndex;
                    return ListTile(
                      title: Text(
                        labels[i],
                        style: TextStyleConstant.robotoW500(
                          fontSize: 14,
                          color: ColorConstant.textPrimary,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check_circle,
                              color: ColorConstant.primary, size: 20)
                          : null,
                      onTap: () => Navigator.of(ctx).pop(i),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
    if (picked == null) return;
    final g = _farmerGroups[picked];
    setState(() {
      _selectedGroupId = _str(g['id'] ?? g['_id']);
      _selectedGroupLabel = _str(g['name'] ?? g['groupName']);
    });
  }

  // ─── Reporting tab ──────────────────────────────────────────────────────
  Widget _buildReportingTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionHeader(AppLang.local.reporting.toUpperCase()),
          const SizedBox(height: 12),
          AppFormField(
            controller: _findingsCtrl,
            hint: AppLang.local.findings,
            maxLines: 4,
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _challengesCtrl,
            hint: AppLang.local.challenges,
            maxLines: 4,
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _recommendationsCtrl,
            hint: AppLang.local.recommendations,
            maxLines: 4,
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _materialsCtrl,
            hint: AppLang.local.materials_used,
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _notesCtrl,
            hint: AppLang.local.notes,
            maxLines: 4,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ─── Attendees tab ──────────────────────────────────────────────────────
  Widget _buildAttendeesTab() {
    if (_currentTrainingId == null) {
      return _buildSaveFirstHint(AppLang.local.save_training_first);
    }
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  '${_attendees.length} ${AppLang.local.attendees}',
                  style: TextStyleConstant.robotoW600(
                    fontSize: 13,
                    color: ColorConstant.heading,
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: _enrollingAll ? null : _enrollAllGroupMembers,
                icon: _enrollingAll
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.group_add, size: 18),
                label: Text(AppLang.local.enroll_group_members),
                style: TextButton.styleFrom(
                  foregroundColor: ColorConstant.primary,
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(child: _buildAttendeesBody()),
      ],
    );
  }

  Widget _buildAttendeesBody() {
    if (_attendeesLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_attendeesError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline,
                  size: 40, color: ColorConstant.danger),
              const SizedBox(height: 8),
              Text(
                _attendeesError!,
                textAlign: TextAlign.center,
                style: TextStyleConstant.robotoW400(
                    fontSize: 12, color: ColorConstant.text79),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _loadAttendees,
                child: Text(AppLang.local.retry),
              ),
            ],
          ),
        ),
      );
    }
    if (_attendees.isEmpty) {
      return Center(
        child: EmptyState(
          title: AppLang.local.no_attendees_enrolled,
          description: AppLang.local.enroll_group_hint,
          icon: Icons.people_outline,
          color: ColorConstant.secondary,
          actionTitle: AppLang.local.enroll_group_members,
          onAction: _enrollingAll ? null : _enrollAllGroupMembers,
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
      itemCount: _attendees.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) => _buildAttendeeRow(_attendees[i]),
    );
  }

  Widget _buildAttendeeRow(Map<String, dynamic> a) {
    final farmer = a['farmer'];
    String name;
    String phone;
    if (farmer is Map) {
      final first = _str(farmer['firstName']);
      final last = _str(farmer['lastName']);
      name = '$first $last'.trim();
      phone = _str(farmer['phone']);
    } else {
      name = _str(a['farmerName']);
      phone = _str(a['phone']);
    }
    final attended = (a['attended'] as bool?) ?? false;
    final status = _str(a['enrollmentStatus']).toUpperCase();
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: ColorConstant.grayEB),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: ColorConstant.secondary.withOpacity(0.14),
            child: Text(
              name.isEmpty ? '?' : name[0].toUpperCase(),
              style: TextStyleConstant.quicksandW700(
                fontSize: 13,
                color: ColorConstant.secondary,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name.isEmpty ? '(Unknown)' : name,
                  style: TextStyleConstant.robotoW600(
                    fontSize: 13,
                    color: ColorConstant.heading,
                  ),
                ),
                if (phone.isNotEmpty)
                  Text(
                    phone,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 11,
                      color: ColorConstant.textSecondary,
                    ),
                  ),
                if (status.isNotEmpty)
                  Text(
                    status,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 10,
                      color: attended
                          ? ColorConstant.success
                          : ColorConstant.warning,
                    ),
                  ),
              ],
            ),
          ),
          // Attended/Absent toggle
          Container(
            decoration: BoxDecoration(
              color: ColorConstant.grayF6F7F9,
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.all(2),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _toggleBtn(
                  label: AppLang.local.attended,
                  selected: attended,
                  color: ColorConstant.success,
                  onTap: () =>
                      !attended ? _setAttended(a, true) : null,
                ),
                _toggleBtn(
                  label: AppLang.local.absent,
                  selected: !attended && status == 'ABSENT',
                  color: ColorConstant.danger,
                  onTap: () =>
                      attended || status != 'ABSENT'
                          ? _setAttended(a, false)
                          : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _toggleBtn({
    required String label,
    required bool selected,
    required Color color,
    required VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(
          label,
          style: TextStyleConstant.robotoW500(
            fontSize: 11,
            color: selected ? Colors.white : ColorConstant.textSecondary,
          ),
        ),
      ),
    );
  }

  // ─── Files tab ──────────────────────────────────────────────────────────
  Widget _buildFilesTab() {
    if (_currentTrainingId == null) {
      return _buildSaveFirstHint(AppLang.local.save_training_first);
    }
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            children: [
              Expanded(
                child: _actionBtn(
                  icon: Icons.camera_alt_outlined,
                  label: AppLang.local.take_photo,
                  onTap: _uploading ? null : _takePhoto,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _actionBtn(
                  icon: Icons.photo_library_outlined,
                  label: AppLang.local.pick_photos,
                  onTap: _uploading ? null : _pickPhotos,
                ),
              ),
            ],
          ),
        ),
        if (_uploading)
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: LinearProgressIndicator(),
          ),
        const Divider(height: 1),
        Expanded(child: _buildAttachmentsBody()),
      ],
    );
  }

  Widget _actionBtn({
    required IconData icon,
    required String label,
    required VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: ColorConstant.primary.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: ColorConstant.primary.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: ColorConstant.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyleConstant.robotoW600(
                fontSize: 12,
                color: ColorConstant.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentsBody() {
    if (_attachmentsLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_attachmentsError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline,
                  size: 40, color: ColorConstant.danger),
              const SizedBox(height: 8),
              Text(
                _attachmentsError!,
                textAlign: TextAlign.center,
                style: TextStyleConstant.robotoW400(
                    fontSize: 12, color: ColorConstant.text79),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _loadAttachments,
                child: Text(AppLang.local.retry),
              ),
            ],
          ),
        ),
      );
    }
    if (_attachments.isEmpty) {
      return Center(
        child: EmptyState(
          title: AppLang.local.no_attachments,
          description: AppLang.local.no_attachments_desc,
          icon: Icons.photo_outlined,
          color: ColorConstant.gold,
        ),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1,
      ),
      itemCount: _attachments.length,
      itemBuilder: (_, i) {
        final url = _attachments[i];
        final isDeleting = _deletingUrl == url;
        return Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: ColorConstant.grayF6F7F9,
                  child: const Icon(Icons.broken_image_outlined,
                      color: ColorConstant.textSecondary),
                ),
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return Container(
                    color: ColorConstant.grayF6F7F9,
                    child: const Center(
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  );
                },
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: isDeleting ? null : () => _deleteAttachment(url),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: isDeleting
                      ? const SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(
                            strokeWidth: 1.5,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.close,
                          color: Colors.white, size: 12),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSaveFirstHint(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline,
                size: 40, color: ColorConstant.textSecondary),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: ColorConstant.text79,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Row(
      children: [
        Text(
          title,
          style: TextStyleConstant.robotoW800(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: Container(height: 1, color: ColorConstant.grayEB)),
      ],
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 48, color: ColorConstant.danger),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadInitial,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}
