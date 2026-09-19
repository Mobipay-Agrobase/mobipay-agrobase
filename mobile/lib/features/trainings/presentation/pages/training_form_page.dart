import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_shimmer.dart';

/// Training Form Page (Phase C1 + C2 mirror of web)
///
/// Allows an extension officer / admin to:
///   - Create or edit a training (scheduling + reporting fields)
///   - Bulk-enroll all active farmers from a selected farmer group (Phase C1)
///   - Mark each attendee as Attended / Absent
///   - Upload photos + attendance form (PDF/Excel/Word) (Phase C2)
///   - View and delete uploaded attachments
class TrainingFormPage extends StatefulWidget {
  final String? trainingId;
  const TrainingFormPage({super.key, this.trainingId});

  @override
  State<TrainingFormPage> createState() => _TrainingFormPageState();
}

class _TrainingFormPageState extends State<TrainingFormPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Scheduling fields
  final _topicCtrl = TextEditingController();
  final _specificTopicCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();
  final _trainerCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _expectedAttendeesCtrl = TextEditingController();
  final _startTimeCtrl = TextEditingController();
  final _endTimeCtrl = TextEditingController();
  final _durationCtrl = TextEditingController();
  final _materialsCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  // Reporting
  final _findingsCtrl = TextEditingController();
  final _challengesCtrl = TextEditingController();
  final _recommendationsCtrl = TextEditingController();

  String _type = 'GROUP_TRAINING';
  String _status = 'SCHEDULED';
  String _mainTopic = '';
  String _funder = '';
  String _groupId = '';

  List<dynamic> _farmerGroups = [];
  List<dynamic> _attendees = [];
  List<dynamic> _attachments = [];

  bool _loading = true;
  bool _saving = false;
  bool _enrolling = false;
  bool _uploading = false;

  bool get _isEdit => widget.trainingId != null;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadFarmerGroups();
    if (_isEdit) {
      _loadTraining();
    } else {
      _loading = false;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _topicCtrl.dispose();
    _specificTopicCtrl.dispose();
    _dateCtrl.dispose();
    _trainerCtrl.dispose();
    _locationCtrl.dispose();
    _expectedAttendeesCtrl.dispose();
    _startTimeCtrl.dispose();
    _endTimeCtrl.dispose();
    _durationCtrl.dispose();
    _materialsCtrl.dispose();
    _notesCtrl.dispose();
    _findingsCtrl.dispose();
    _challengesCtrl.dispose();
    _recommendationsCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadFarmerGroups() async {
    try {
      final res = await ApiClient().get('/api/farmer-groups?limit=200');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (!mounted) return;
        setState(() {
          _farmerGroups = data['data'] ?? data['groups'] ?? [];
        });
      }
    } catch (_) {}
  }

  Future<void> _loadTraining() async {
    try {
      final res = await ApiClient().get('/api/trainings/${widget.trainingId}');
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        final t = d['data'] ?? d;
        if (!mounted) return;
        setState(() {
          _topicCtrl.text = t['topic'] ?? '';
          _specificTopicCtrl.text = t['specificTopic'] ?? t['description'] ?? '';
          // Use tryParse — older records may have startTime/endTime in non-ISO formats.
          _dateCtrl.text = t['date'] != null
              ? (DateTime.tryParse(t['date'])?.toIso8601String().split('T')[0] ?? '')
              : '';
          _trainerCtrl.text = t['trainerName'] ?? '';
          _locationCtrl.text = t['location'] ?? '';
          _expectedAttendeesCtrl.text = t['expectedAttendees']?.toString() ?? '';
          _startTimeCtrl.text = t['startTime'] != null
              ? (DateTime.tryParse(t['startTime'])?.toIso8601String().split('T')[1].substring(0, 5) ?? '')
              : '';
          _endTimeCtrl.text = t['endTime'] != null
              ? (DateTime.tryParse(t['endTime'])?.toIso8601String().split('T')[1].substring(0, 5) ?? '')
              : '';
          _durationCtrl.text = t['durationMinutes']?.toString() ?? '';
          _materialsCtrl.text = t['materialsUsed'] ?? '';
          _notesCtrl.text = t['notes'] ?? '';
          _findingsCtrl.text = t['findings'] ?? '';
          _challengesCtrl.text = t['challenges'] ?? '';
          _recommendationsCtrl.text = t['recommendations'] ?? '';
          _type = t['type'] ?? 'GROUP_TRAINING';
          _status = t['status'] ?? 'SCHEDULED';
          _mainTopic = t['mainTopic'] ?? '';
          _funder = t['funder'] ?? '';
          _groupId = t['groupId'] ?? '';
        });
        // Load attachments (JSON-string column)
        if (t['attachmentUrls'] != null) {
          try {
            final parsed = t['attachmentUrls'] is String
                ? jsonDecode(t['attachmentUrls'])
                : t['attachmentUrls'];
            if (parsed is List) {
              if (!mounted) return;
              setState(() => _attachments = parsed);
            }
          } catch (_) {}
        }
        // Load attendees
        await _loadAttendees();
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load training')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadAttendees() async {
    if (!_isEdit) return;
    try {
      final res = await ApiClient().get('/api/trainings/${widget.trainingId}/attendance');
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        if (!mounted) return;
        setState(() => _attendees = (d['data'] as List?) ?? []);
      }
    } catch (_) {}
  }

  Future<void> _save() async {
    if (_topicCtrl.text.trim().isEmpty && _mainTopic.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Topic / Main Topic is required')));
      return;
    }
    if (_dateCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Date is required')));
      return;
    }
    setState(() => _saving = true);
    try {
      final payload = {
        'topic': _specificTopicCtrl.text.isNotEmpty ? _specificTopicCtrl.text : _mainTopic,
        'description': _specificTopicCtrl.text.isNotEmpty ? _specificTopicCtrl.text : null,
        'date': _dateCtrl.text,
        'location': _locationCtrl.text.isNotEmpty ? _locationCtrl.text : null,
        'trainerName': _trainerCtrl.text.isNotEmpty ? _trainerCtrl.text : null,
        'type': _type,
        'status': _status,
        'startTime': _startTimeCtrl.text.isNotEmpty ? '${_dateCtrl.text}T${_startTimeCtrl.text}' : null,
        'endTime': _endTimeCtrl.text.isNotEmpty ? '${_dateCtrl.text}T${_endTimeCtrl.text}' : null,
        'durationMinutes': _durationCtrl.text.isNotEmpty ? int.tryParse(_durationCtrl.text) : null,
        'expectedAttendees': _expectedAttendeesCtrl.text.isNotEmpty ? int.tryParse(_expectedAttendeesCtrl.text) : null,
        'materialsUsed': _materialsCtrl.text.isNotEmpty ? _materialsCtrl.text : null,
        'notes': _notesCtrl.text.isNotEmpty ? _notesCtrl.text : null,
        'groupId': _groupId.isNotEmpty ? _groupId : null,
        'mainTopic': _mainTopic.isNotEmpty ? _mainTopic : null,
        'specificTopic': _specificTopicCtrl.text.isNotEmpty ? _specificTopicCtrl.text : null,
        'funder': _funder.isNotEmpty ? _funder : null,
        'findings': _findingsCtrl.text.isNotEmpty ? _findingsCtrl.text : null,
        'challenges': _challengesCtrl.text.isNotEmpty ? _challengesCtrl.text : null,
        'recommendations': _recommendationsCtrl.text.isNotEmpty ? _recommendationsCtrl.text : null,
      };
      // Use POST for create, PUT for edit. The /api/trainings route only
      // defines GET + POST — calling PUT on a collection URL returns 405,
      // which previously caused a wasted round-trip and a confusing flow.
      final http.Response res;
      if (_isEdit) {
        res = await ApiClient().put('/api/trainings/${widget.trainingId}', body: payload);
        if (res.statusCode != 200) {
          throw Exception('Failed to save: ${res.body}');
        }
      } else {
        res = await ApiClient().post('/api/trainings', body: payload);
        if (res.statusCode != 201) {
          throw Exception('Failed to create: ${res.body}');
        }
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'Training updated' : 'Training scheduled'),
          backgroundColor: AppTheme.primaryGreen,
        ));
        // For new trainings, navigate to edit mode so attendees/upload tabs work
        if (!_isEdit) {
          // Pop back to trainings list
          Navigator.of(context).pop(true);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  // ─── Phase C1 — Bulk enroll group members ──────────────────────────────
  Future<void> _enrollGroup() async {
    if (!_isEdit) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Save the training first')));
      return;
    }
    if (_groupId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a farmer group first')));
      return;
    }
    setState(() => _enrolling = true);
    try {
      final res = await ApiClient().post(
        '/api/trainings/${widget.trainingId}/enroll-group',
        body: {'groupId': _groupId},
      );
      final d = jsonDecode(res.body);
      if (res.statusCode != 201) {
        throw Exception(d['error'] ?? 'Failed to enroll');
      }
      final data = d['data'];
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Enrolled ${data['enrolled']} farmers (${data['skipped']} already enrolled)'),
          backgroundColor: AppTheme.primaryGreen,
        ));
      }
      await _loadAttendees();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _enrolling = false);
    }
  }

  Future<void> _toggleAttended(int idx) async {
    final att = _attendees[idx];
    // Cast to a typed map so the spread operator works safely — without
    // this, the runtime throws "TypeError: ... is not a subtype of Map"
    // if att is null or not a Map.
    final attMap = Map<String, dynamic>.from(att as Map);
    final newAttended = !(attMap['attended'] ?? false);
    setState(() {
      _attendees[idx] = {
        ...attMap,
        'attended': newAttended,
        'enrollmentStatus': newAttended ? 'ATTENDED' : 'ENROLLED',
      };
    });
    try {
      final res = await ApiClient().put(
        '/api/trainings/${widget.trainingId}/attendance/${attMap['id']}',
        body: {
          'attended': newAttended,
          'enrollmentStatus': newAttended ? 'ATTENDED' : 'ENROLLED',
        },
      );
      if (res.statusCode != 200) {
        // Revert
        if (!mounted) return;
        setState(() {
          _attendees[idx] = {
            ...attMap,
            'attended': !newAttended,
            'enrollmentStatus': !newAttended ? 'ATTENDED' : 'ENROLLED',
          };
        });
        throw Exception('Failed to update');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  // ─── Phase C2 — File upload ─────────────────────────────────────────────
  Future<void> _pickAndUploadFiles(ImageSource source) async {
    if (!_isEdit) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Save the training first')));
      return;
    }
    setState(() => _uploading = true);
    try {
      final picker = ImagePicker();
      final List<XFile> picked;
      if (source == ImageSource.camera) {
        final p = await picker.pickImage(source: source, imageQuality: 85);
        picked = p != null ? [p] : [];
      } else {
        // image_picker's API method is pickMultiImage (no "ple").
        // The previous name pickMultipleImage was wrong and failed to compile.
        picked = await picker.pickMultiImage(imageQuality: 85);
      }
      if (picked.isEmpty) {
        setState(() => _uploading = false);
        return;
      }
      // Build files payload
      final List<Map<String, dynamic>> files = [];
      for (final x in picked) {
        final bytes = await x.readAsBytes();
        files.add({
          'bytes': bytes,
          'name': x.name,
          'contentType': x.mimeType ?? 'application/octet-stream',
        });
      }
      final res = await ApiClient().uploadFiles(
        '/api/trainings/${widget.trainingId}/attachments',
        files: files,
      );
      final d = jsonDecode(res.body);
      if (res.statusCode != 201) {
        throw Exception(d['error'] ?? 'Upload failed');
      }
      // The API responds with { data: { attachments: [...] } }. Be defensive —
      // if the server ever returns the attachments array at the root, fall back.
      final dataMap = d is Map ? (d['data'] as Map?) ?? d : null;
      final List attachmentsList;
      if (dataMap != null) {
        attachmentsList = (dataMap['attachments'] as List?) ?? [];
      } else {
        attachmentsList = [];
      }
      if (!mounted) return;
      setState(() {
        _attachments = attachmentsList;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Uploaded ${files.length} file(s)'),
          backgroundColor: AppTheme.primaryGreen,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _deleteAttachment(String url) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete attachment?'),
        content: const Text('This will permanently delete the file.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      final res = await ApiClient().delete(
        '/api/trainings/${widget.trainingId}/attachments?url=${Uri.encodeComponent(url)}',
      );
      if (res.statusCode != 200) {
        throw Exception('Failed to delete');
      }
      setState(() {
        _attachments = _attachments.where((a) => a['url'] != url).toList();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Attachment deleted'),
          backgroundColor: AppTheme.primaryGreen,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Training' : 'New Training'),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        actions: [
          TextButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.save, color: Colors.white),
            label: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          isScrollable: true,
          tabs: [
            const Tab(icon: Icon(Icons.calendar_today, size: 16), text: 'Scheduling'),
            const Tab(icon: Icon(Icons.assignment, size: 16), text: 'Reporting'),
            Tab(icon: const Icon(Icons.people, size: 16), text: 'Attendees (${_attendees.length})'),
            Tab(icon: const Icon(Icons.attach_file, size: 16), text: 'Files (${_attachments.length})'),
          ],
        ),
      ),
      body: _loading
          ? const LoadingShimmer()
          : TabBarView(
              controller: _tabController,
              children: [
                _schedulingTab(),
                _reportingTab(),
                _attendeesTab(),
                _attachmentsTab(),
              ],
            ),
    );
  }

  // ─── Scheduling Tab ───
  Widget _schedulingTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _dropdownField('Type of Training', ['GROUP_TRAINING', 'FARM_VISIT'], _type, (v) => setState(() => _type = v)),
        const SizedBox(height: 12),
        // Pass through the actual _mainTopic value — if empty, the DropdownButtonFormField
        // initialValue will be null and the placeholder shows. Don't substitute a default
        // because that would silently persist "Bamboo" when the user never picked anything.
        _dropdownField('Main Topic', ['Bamboo', 'Regenerative Agriculture', 'Financial Literacy'], _mainTopic.isEmpty ? 'Bamboo' : _mainTopic, (v) => setState(() => _mainTopic = v)),
        const SizedBox(height: 12),
        _textField(_specificTopicCtrl, 'Specific Topic'),
        const SizedBox(height: 12),
        _dropdownField('Training Funder', ['EKiBBO', 'ETG', 'Enabel', 'Doen'], _funder.isEmpty ? 'EKiBBO' : _funder, (v) => setState(() => _funder = v)),
        const SizedBox(height: 12),
        _dateField(_dateCtrl, 'Date *'),
        const SizedBox(height: 12),
        _textField(_trainerCtrl, 'Trainer Name'),
        const SizedBox(height: 12),
        _groupDropdown(),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _dropdownField('Status', ['SCHEDULED', 'COMPLETED', 'CANCELLED'], _status, (v) => setState(() => _status = v))),
          const SizedBox(width: 12),
          Expanded(child: _timeField(_startTimeCtrl, 'Start Time')),
          const SizedBox(width: 12),
          Expanded(child: _timeField(_endTimeCtrl, 'End Time')),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _textField(_durationCtrl, 'Duration (min)', keyboard: TextInputType.number)),
          const SizedBox(width: 12),
          Expanded(child: _textField(_expectedAttendeesCtrl, 'Expected Attendees', keyboard: TextInputType.number)),
        ]),
        const SizedBox(height: 12),
        _textField(_locationCtrl, 'Location'),
        const SizedBox(height: 12),
        _textField(_materialsCtrl, 'Materials Used'),
        const SizedBox(height: 12),
        _textField(_notesCtrl, 'Notes', maxLines: 2),
      ]),
    );
  }

  // ─── Reporting Tab ───
  Widget _reportingTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(8)),
          child: const Text(
            'Fill in the reporting fields after the training has been conducted.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ),
        const SizedBox(height: 16),
        _textField(_findingsCtrl, 'Findings', maxLines: 3),
        const SizedBox(height: 12),
        _textField(_challengesCtrl, 'Challenges', maxLines: 2),
        const SizedBox(height: 12),
        _textField(_recommendationsCtrl, 'Recommendations', maxLines: 2),
      ]),
    );
  }

  // ─── Attendees Tab (Phase C1) ───
  Widget _attendeesTab() {
    final attendedCount = _attendees.where((a) => a['attended'] == true).length;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(8)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Phase C1 — Attendee selection from farmer group', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            const Text(
              'Select a farmer group in Scheduling tab, then bulk-enroll all active members. Mark each farmer Attended/Absent after the training.',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            if (_groupId.isNotEmpty)
              Text('Selected: ${_farmerGroups.firstWhere((g) => g['id'] == _groupId, orElse: () => {'name': '—'})['name']}',
                  style: const TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: (!_isEdit || _groupId.isEmpty || _enrolling) ? null : _enrollGroup,
              icon: _enrolling
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.group_add, size: 18),
              label: Text(_enrolling ? 'Enrolling...' : 'Enroll All Group Members'),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        Row(children: [
          Text('Attendees (${_attendees.length})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          const Spacer(),
          if (_attendees.isNotEmpty)
            Text('$attendedCount attended · ${_attendees.length - attendedCount} absent',
                style: const TextStyle(fontSize: 11, color: Colors.grey)),
        ]),
        const SizedBox(height: 8),
        if (_attendees.isEmpty)
          const EmptyState(
            icon: Icons.people_outline,
            title: 'No attendees enrolled yet',
            description: 'Select a farmer group and tap "Enroll All Group Members" above.',
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _attendees.length,
            itemBuilder: (ctx, i) {
              final att = _attendees[i];
              final farmer = att['farmer'] ?? {};
              final attended = att['attended'] == true;
              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: attended ? Colors.green[50] : Colors.orange[50],
                    child: Icon(attended ? Icons.check : Icons.schedule, color: attended ? Colors.green : Colors.orange, size: 18),
                  ),
                  title: Text('${farmer['firstName'] ?? ''} ${farmer['lastName'] ?? ''}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                  subtitle: Text(farmer['farmerCode'] ?? '—', style: const TextStyle(fontSize: 11)),
                  trailing: ElevatedButton(
                    onPressed: () => _toggleAttended(i),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: attended ? Colors.green : Colors.orange[100],
                      foregroundColor: attended ? Colors.white : Colors.orange[900],
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      minimumSize: const Size(0, 32),
                    ),
                    child: Text(attended ? 'Attended' : 'Absent', style: const TextStyle(fontSize: 11)),
                  ),
                ),
              );
            },
          ),
      ]),
    );
  }

  // ─── Attachments Tab (Phase C2) ───
  Widget _attachmentsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.purple[50], borderRadius: BorderRadius.circular(8)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Phase C2 — File upload (photos + attendance form)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            const Text(
              'Capture training photos with camera, or pick from gallery. Max 10 files, 10MB each.',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            if (!_isEdit)
              const Text('Save the training first before uploading attachments.',
                  style: TextStyle(fontSize: 11, color: Colors.orange, fontWeight: FontWeight.w500)),
          ]),
        ),
        const SizedBox(height: 16),
        if (_uploading)
          const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
        else
          Row(children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isEdit ? () => _pickAndUploadFiles(ImageSource.camera) : null,
                icon: const Icon(Icons.camera_alt, size: 18),
                label: const Text('Take Photo'),
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isEdit ? () => _pickAndUploadFiles(ImageSource.gallery) : null,
                icon: const Icon(Icons.photo_library, size: 18),
                label: const Text('Pick Photos'),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
              ),
            ),
          ]),
        const SizedBox(height: 16),
        if (_attachments.isEmpty)
          const EmptyState(
            icon: Icons.attach_file,
            title: 'No attachments uploaded',
            description: 'Use the camera or gallery buttons above.',
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 0.8,
            ),
            itemCount: _attachments.length,
            itemBuilder: (ctx, i) {
              final att = _attachments[i];
              final url = att['url'] as String;
              return FutureBuilder<String>(
                future: ApiClient.getBaseUrl(),
                builder: (ctx, snap) {
                  final base = snap.data ?? '';
                  final fullUrl = url.startsWith('http') ? url : '$base$url';
                  final isImage = (att['type'] as String?)?.startsWith('image/') ?? false;
                  return _attachmentTile(att, fullUrl, isImage, url);
                },
              );
            },
          ),
      ]),
    );
  }

  Widget _attachmentTile(dynamic att, String fullUrl, bool isImage, String url) {
    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: isImage
                ? Image.network(fullUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.broken_image))
                : const Center(child: Icon(Icons.description, size: 36, color: Colors.grey)),
          ),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () => _deleteAttachment(url),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
              child: const Icon(Icons.close, color: Colors.white, size: 12),
            ),
          ),
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.6),
              borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(8), bottomRight: Radius.circular(8)),
            ),
            child: Text(
              att['name'] ?? 'file',
              style: const TextStyle(color: Colors.white, fontSize: 9),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ],
    );
  }

  // ─── Form field helpers ───
  Widget _textField(TextEditingController ctrl, String label, {TextInputType? keyboard, int maxLines = 1}) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboard,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        isDense: true,
        border: const OutlineInputBorder(),
      ),
    );
  }

  Widget _dateField(TextEditingController ctrl, String label) {
    return TextField(
      controller: ctrl,
      readOnly: true,
      decoration: InputDecoration(
        labelText: label,
        isDense: true,
        border: const OutlineInputBorder(),
        suffixIcon: const Icon(Icons.calendar_today, size: 16),
      ),
      onTap: () async {
        final d = await showDatePicker(
          context: context,
          initialDate: DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime(2100),
        );
        if (d != null) {
          ctrl.text = d.toIso8601String().split('T')[0];
        }
      },
    );
  }

  Widget _timeField(TextEditingController ctrl, String label) {
    return TextField(
      controller: ctrl,
      readOnly: true,
      decoration: InputDecoration(
        labelText: label,
        isDense: true,
        border: const OutlineInputBorder(),
        suffixIcon: const Icon(Icons.access_time, size: 16),
      ),
      onTap: () async {
        final t = await showTimePicker(context: context, initialTime: TimeOfDay.now());
        if (t != null) {
          ctrl.text = '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
        }
      },
    );
  }

  Widget _dropdownField(String label, List<String> options, String value, ValueChanged<String> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(
        labelText: label,
        isDense: true,
        border: const OutlineInputBorder(),
      ),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
      onChanged: (v) { if (v != null) onChanged(v); },
    );
  }

  Widget _groupDropdown() {
    return DropdownButtonFormField<String>(
      initialValue: _groupId.isNotEmpty ? _groupId : null,
      decoration: const InputDecoration(
        labelText: 'Farmer Group (for bulk enrollment)',
        isDense: true,
        border: OutlineInputBorder(),
      ),
      items: [
        const DropdownMenuItem<String>(value: '', child: Text('All groups')),
        ..._farmerGroups.map((g) => DropdownMenuItem<String>(
          value: g['id'],
          child: Text('${g['name']}${g['groupCode'] != null ? ' (${g['groupCode']})' : ''}'),
        )),
      ],
      onChanged: (v) { if (v != null) setState(() => _groupId = v); },
    );
  }
}
