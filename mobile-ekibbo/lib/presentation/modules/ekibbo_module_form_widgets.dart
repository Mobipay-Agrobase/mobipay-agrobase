import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_ekibbo_modules.dart';

/// Shared widgets for the Ekibbo module CRUD forms
/// (Trainings / Farm Visits / Surveys / Loans).

/// Compact dropdown used by the module forms.
class EkibboDropdown extends StatelessWidget {
  const EkibboDropdown({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onChanged,
  });

  final List<String> items;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: ColorConstant.grayF6F7F9,
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: selectedIndex < 0 ? 0 : selectedIndex.clamp(0, items.length - 1),
          isExpanded: true,
          items: items
              .asMap()
              .entries
              .map((e) => DropdownMenuItem<int>(
                    value: e.key,
                    child: Text(
                      e.value,
                      style: TextStyleConstant.robotoW400(fontSize: 14),
                    ),
                  ))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }
}

/// Form field label.
class EkibboLabel extends StatelessWidget {
  const EkibboLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: TextStyleConstant.quicksandW600(fontSize: 13),
      ),
    );
  }
}

/// Section title inside a form.
class EkibboSectionTitle extends StatelessWidget {
  const EkibboSectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyleConstant.quicksandW700(fontSize: 15),
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────
/// Attachments section for Ekibbo reporting (EKiBBO feedback: report
/// attachments — training photos + scanned attendance form).
///
/// Shares the web platform's /api/attachments storage, so files uploaded
/// from mobile appear on the web report and vice-versa.
///
/// • [relatedId] provided (edit mode): grid of uploaded attachments with
///   per-file delete, plus an add-photo tile (camera or gallery). Photos are
///   compressed in-flight (1600px, JPEG q70) to stay well under the 5 MB cap
///   on rural connections.
/// • [relatedId] null (create mode): hint to save the record first.
/// ─────────────────────────────────────────────────────────────────────────
class EkibboAttachmentSection extends StatefulWidget {
  const EkibboAttachmentSection({
    super.key,
    required this.relatedType,
    this.relatedId,
    this.uploadDescription = 'Training report attachment',
  });

  /// Polymorphic type on the server: 'TRAINING', 'FARM_VISIT', ...
  final String relatedType;

  /// Numeric record id (as string). null → create mode hint.
  final String? relatedId;

  /// Description stored with each uploaded file.
  final String uploadDescription;

  @override
  State<EkibboAttachmentSection> createState() =>
      _EkibboAttachmentSectionState();
}

class _EkibboAttachmentSectionState extends State<EkibboAttachmentSection> {
  final ImagePicker _picker = ImagePicker();

  List<Map<String, dynamic>> _attachments = [];
  bool _loading = false;
  bool _uploading = false;
  String? _error;

  bool get _isEdit => widget.relatedId != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ApiEkibboModules.listAttachments(
        widget.relatedType,
        widget.relatedId!,
      );
      if (!mounted) return;
      setState(() {
        _attachments = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _pickAndUpload(ImageSource source) async {
    if (_uploading) return;
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        imageQuality: 70,
      );
      if (picked == null) return;
      if (!mounted) return;
      setState(() => _uploading = true);
      await ApiEkibboModules.uploadAttachment(
        picked.path,
        relatedId: widget.relatedId!,
        relatedType: widget.relatedType,
        description: widget.uploadDescription,
      );
      await _load();
      if (!mounted) return;
      setState(() => _uploading = false);
      DialogHelper.showToastSuccess(context, message: 'Attachment uploaded');
    } catch (e) {
      if (!mounted) return;
      setState(() => _uploading = false);
      DialogHelper.showToastError(
        context,
        message: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> att) {
    return DialogHelper.showOkDialog(
      context,
      'Delete this attachment? This cannot be undone.',
      isCancel: true,
      titleOK: 'Delete',
      okAction: () async {
        try {
          DialogHelper.showLoading();
          await ApiEkibboModules.deleteAttachment(att['id'].toString());
          DialogHelper.hideLoading();
          _load();
        } catch (e) {
          DialogHelper.hideLoading();
          if (mounted) {
            DialogHelper.showToastError(
              context,
              message: e.toString().replaceFirst('Exception: ', ''),
            );
          }
        }
      },
    );
  }

  void _showSourceSheet() {
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
              child: Text(
                'Add Photo Attachment',
                style: TextStyleConstant.quicksandW700(fontSize: 15),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera, color: ColorConstant.primary),
              title: Text('Take Photo',
                  style: TextStyleConstant.robotoW400(fontSize: 14)),
              onTap: () {
                Navigator.of(context).pop();
                _pickAndUpload(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: ColorConstant.primary),
              title: Text('Choose from Gallery',
                  style: TextStyleConstant.robotoW400(fontSize: 14)),
              onTap: () {
                Navigator.of(context).pop();
                _pickAndUpload(ImageSource.gallery);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  /// Decodes the data-URI thumbnail the API returns in `fileUrl`.
  Widget? _thumb(Map<String, dynamic> att) {
    final url = (att['fileUrl'] ?? '').toString();
    final idx = url.indexOf('base64,');
    if (!url.startsWith('data:image/') || idx < 0) return null;
    try {
      final bytes = base64Decode(url.substring(idx + 7));
      return Image.memory(bytes, fit: BoxFit.cover, gaplessPlayback: true);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isEdit) {
      return Text(
        'Save the training first, then add photos and the attendance form to the report.',
        style: TextStyleConstant.robotoW400(
          fontSize: 11,
          color: ColorConstant.text79,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                const Icon(Icons.error_outline, size: 14, color: Colors.red),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Could not load attachments ($_error)',
                    style: TextStyleConstant.robotoW400(
                      fontSize: 11,
                      color: Colors.red,
                    ),
                  ),
                ),
                InkWell(
                  onTap: _load,
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Text(
                      'RETRY',
                      style: TextStyleConstant.quicksandW600(
                        fontSize: 11,
                        color: ColorConstant.primary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        if (_uploading)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: ColorConstant.primary,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'Uploading attachment…',
                  style: TextStyleConstant.robotoW400(
                    fontSize: 12,
                    color: ColorConstant.text79,
                  ),
                ),
              ],
            ),
          ),
        if (_attachments.isEmpty && !_loading && !_uploading && _error == null)
          Text(
            'No attachments yet. Add photos from the field or the scanned attendance form.',
            style: TextStyleConstant.robotoW400(
              fontSize: 11,
              color: ColorConstant.text79,
            ),
          )
        else if (_error == null)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ..._attachments.map(_tile),
              if (!_uploading) _addTile(),
            ],
          ),
        if (_loading && _attachments.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        if (!_loading &&
            _attachments.isNotEmpty &&
            !_uploading &&
            _error == null)
          _addTileHint(),
      ],
    );
  }

  Widget _tile(Map<String, dynamic> att) {
    final image = _thumb(att);
    final isPdf = (att['fileType'] ?? '').toString() == 'application/pdf';
    return SizedBox(
      width: 104,
      height: 128,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  color: ColorConstant.grayF6F7F9,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: ColorConstant.grayF6F7F9),
                ),
                clipBehavior: Clip.antiAlias,
                child: image ?? _pdfPlaceholder(isPdf),
              ),
              Positioned(
                top: 4,
                right: 4,
                child: InkWell(
                  onTap: () => _delete(att),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, size: 14, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            (att['fileName'] ?? 'attachment').toString(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyleConstant.robotoW400(
              fontSize: 10,
              color: ColorConstant.text79,
            ),
          ),
        ],
      ),
    );
  }

  Widget _pdfPlaceholder(bool isPdf) {
    if (isPdf) {
      return const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.picture_as_pdf, size: 34, color: Colors.red),
          SizedBox(height: 4),
        ],
      );
    }
    return const Icon(Icons.insert_drive_file,
        size: 30, color: ColorConstant.text79);
  }

  Widget _addTile() {
    return InkWell(
      onTap: _showSourceSheet,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 104,
        height: 104,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: ColorConstant.primary.withOpacity(0.5),
          ),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_a_photo, size: 30, color: ColorConstant.primary),
            SizedBox(height: 6),
          ],
        ),
      ),
    );
  }

  Widget _addTileHint() {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Text(
        'Tap the + tile to add photos (camera or gallery) or a scanned attendance form.',
        style: TextStyleConstant.robotoW400(
          fontSize: 11,
          color: ColorConstant.text79,
        ),
      ),
    );
  }
}
