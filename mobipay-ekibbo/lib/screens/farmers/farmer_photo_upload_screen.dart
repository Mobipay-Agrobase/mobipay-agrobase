import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// EKiBBO Farmer photo upload screen (Screen 17).
///
/// Takes a [farmerId] and shows 3 photo upload tiles:
///   1. Farmer Photo (farmer.photoUrl)
///   2. ID Front (farmer.idProofPhotoUrl or farmer.idFrontPhotoUrl)
///   3. ID Back  (farmer.idBackPhotoUrl)
///
/// On load we fetch `/api/farmers/<id>` and read the existing photo URLs.
/// Tapping a tile opens a bottom sheet with two options:
///   - Take Photo  → ImagePicker.camera
///   - Pick from Gallery → ImagePicker.gallery
///
/// Once picked, the file is displayed locally and persisted to
/// shared_preferences keyed by `photo_<farmerId>_<kind>` (URL or path).
///
/// NOTE: The EKiBBO backend doesn't currently expose a farmer photo upload
/// endpoint. Per task spec, the Save button shows a snackbar saying
/// "Photo upload not yet supported on the backend" rather than attempting
/// a PUT that would 404. Production deployment should add a real upload
/// endpoint (multipart POST to /api/farmers/<id>/photos or similar) and
/// wire it here.
class FarmerPhotoUploadScreen extends StatefulWidget {
  const FarmerPhotoUploadScreen({super.key, required this.farmerId});

  final String farmerId;

  @override
  State<FarmerPhotoUploadScreen> createState() =>
      _FarmerPhotoUploadScreenState();
}

class _FarmerPhotoUploadScreenState extends State<FarmerPhotoUploadScreen> {
  final ImagePicker _picker = ImagePicker();

  /// Display URLs/paths for each kind. May be a remote URL (from the farmer
  /// profile) or a local file path (just captured).
  String? _photoUrl;
  String? _idFrontUrl;
  String? _idBackUrl;

  /// The farmer's display name (loaded alongside the photo URLs).
  String _farmerName = '';

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFarmer();
  }

  Future<void> _loadFarmer() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res =
          await ApiClient().get('/api/farmers/${widget.farmerId}');
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
      final farmer = body is Map ? (body['farmer'] ?? body) : null;
      final f = farmer is Map
          ? Map<String, dynamic>.from(farmer)
          : <String, dynamic>{};

      // Build display name.
      final first = _str(f['firstName']);
      final last = _str(f['lastName']);
      final name = '$first $last'.trim();
      if (name.isEmpty) {
        _farmerName = _str(f['farmerCode']);
      } else {
        _farmerName = name;
      }

      // Read existing photo URLs (try multiple key variants the backend
      // might use).
      final remotePhoto = _str(f['photoUrl'] ?? f['photo'] ?? f['avatarUrl']);
      final remoteIdFront = _str(
          f['idProofPhotoUrl'] ?? f['idFrontPhotoUrl'] ?? f['idFrontUrl']);
      final remoteIdBack =
          _str(f['idBackPhotoUrl'] ?? f['idBackUrl']);

      // Read locally-cached paths (if the user already captured a photo
      // earlier and it wasn't uploaded). Local paths override remote URLs
      // since they're more recent.
      final prefs = await SharedPreferences.getInstance();
      final localPhoto = prefs.getString(_cacheKey('photo'));
      final localFront = prefs.getString(_cacheKey('id_front'));
      final localBack = prefs.getString(_cacheKey('id_back'));

      if (!mounted) return;
      setState(() {
        _photoUrl = localPhoto ?? (remotePhoto.isNotEmpty ? remotePhoto : null);
        _idFrontUrl =
            localFront ?? (remoteIdFront.isNotEmpty ? remoteIdFront : null);
        _idBackUrl =
            localBack ?? (remoteIdBack.isNotEmpty ? remoteIdBack : null);
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

  String _cacheKey(String kind) =>
      'photo_${widget.farmerId}_$kind';

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

  Future<void> _showPhotoSourceSheet(String kind) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: ColorConstant.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    AppLang.local.take_photo_or_pick,
                    style: TextStyleConstant.quicksandW700(
                      fontSize: 15,
                      color: ColorConstant.heading,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                ListTile(
                  leading: const Icon(Icons.camera_alt_outlined,
                      color: ColorConstant.primary),
                  title: Text(AppLang.local.take_photo),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _captureAndStore(kind, ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_outlined,
                      color: ColorConstant.secondary),
                  title: Text(AppLang.local.pick_from_gallery),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _captureAndStore(kind, ImageSource.gallery);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.close,
                      color: ColorConstant.textSecondary),
                  title: Text(AppLang.local.cancel),
                  onTap: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _captureAndStore(String kind, ImageSource source) async {
    try {
      final xfile = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1280,
        maxHeight: 1280,
        preferredCameraDevice: CameraDevice.rear,
      );
      if (xfile == null) return;
      final path = xfile.path;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cacheKey(kind), path);
      if (!mounted) return;
      setState(() {
        switch (kind) {
          case 'photo':
            _photoUrl = path;
            break;
          case 'id_front':
            _idFrontUrl = path;
            break;
          case 'id_back':
            _idBackUrl = path;
            break;
        }
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${AppLang.local.upload_failed}: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    }
  }

  Future<void> _removePhoto(String kind) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_cacheKey(kind));
    if (!mounted) return;
    setState(() {
      switch (kind) {
        case 'photo':
          _photoUrl = null;
          break;
        case 'id_front':
          _idFrontUrl = null;
          break;
        case 'id_back':
          _idBackUrl = null;
          break;
      }
    });
  }

  void _onSave() {
    // Per task spec: backend has no farmer photo upload endpoint yet. Show
    // a snackbar instead of attempting a PUT that would 404.
    // TODO(production): wire this to a real multipart upload endpoint
    // (e.g. POST /api/farmers/<id>/photos) once the backend exposes it.
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.upload_not_supported),
        backgroundColor: ColorConstant.info,
      ),
    );
  }

  String _str(dynamic v) => v == null ? '' : v.toString();

  bool _isFile(String? url) => url != null && url.startsWith('/');

  Widget _buildPhotoTile({
    required String kind,
    required String title,
    required IconData icon,
    required Color color,
    String? url,
  }) {
    final hasPhoto = url != null && url.isNotEmpty;
    return Container(
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.grayEB),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Photo or placeholder
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: color.withOpacity(0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              clipBehavior: Clip.antiAlias,
              child: hasPhoto
                  ? (url != null && _isFile(url)
                      ? Image.file(File(url), fit: BoxFit.cover)
                      : (url != null
                          ? Image.network(
                              url,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Center(
                                child: Icon(icon,
                                    color: color, size: 28),
                              ),
                            )
                          : const SizedBox.shrink()))
                  : Center(
                      child: Icon(icon, color: color, size: 28),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyleConstant.robotoW600(
                      fontSize: 13,
                      color: ColorConstant.heading,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    hasPhoto
                        ? AppLang.local.tap_to_capture
                        : AppLang.local.no_photo_set,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 11,
                      color: ColorConstant.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      TextButton.icon(
                        icon: const Icon(Icons.camera_alt_outlined,
                            size: 16),
                        label: Text(AppLang.local.take_photo),
                        style: TextButton.styleFrom(
                          foregroundColor: color,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 0),
                          minimumSize: const Size(0, 32),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: () => _showPhotoSourceSheet(kind),
                      ),
                      if (hasPhoto) ...[
                        const SizedBox(width: 4),
                        TextButton.icon(
                          icon: const Icon(Icons.delete_outline,
                              size: 16),
                          label: Text(AppLang.local.remove),
                          style: TextButton.styleFrom(
                            foregroundColor: ColorConstant.danger,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 0),
                            minimumSize: const Size(0, 32),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          onPressed: () => _removePhoto(kind),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(title: AppLang.local.farmer_photos),
      body: _buildBody(),
      bottomNavigationBar: _buildSaveBar(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return _buildErrorState();
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      children: [
        if (_farmerName.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                const Icon(Icons.person_outline,
                    size: 16, color: ColorConstant.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _farmerName,
                    style: TextStyleConstant.robotoW600(
                      fontSize: 13,
                      color: ColorConstant.heading,
                    ),
                  ),
                ),
              ],
            ),
          ),
        _buildPhotoTile(
          kind: 'photo',
          title: AppLang.local.farmer_photo,
          icon: Icons.account_circle_outlined,
          color: ColorConstant.primary,
          url: _photoUrl,
        ),
        const SizedBox(height: 12),
        _buildPhotoTile(
          kind: 'id_front',
          title: AppLang.local.id_front,
          icon: Icons.badge_outlined,
          color: ColorConstant.secondary,
          url: _idFrontUrl,
        ),
        const SizedBox(height: 12),
        _buildPhotoTile(
          kind: 'id_back',
          title: AppLang.local.id_back,
          icon: Icons.badge_outlined,
          color: ColorConstant.gold,
          url: _idBackUrl,
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: ColorConstant.warning.withOpacity(0.10),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: ColorConstant.warning.withOpacity(0.30)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.warning_amber_outlined,
                  size: 18, color: ColorConstant.warning),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  AppLang.local.upload_not_supported,
                  style: TextStyleConstant.robotoW400(
                    fontSize: 12,
                    color: ColorConstant.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSaveBar() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        decoration: BoxDecoration(
          color: ColorConstant.surface,
          border: Border(
            top: BorderSide(color: ColorConstant.grayEB),
          ),
        ),
        child: AppButton(
          title: AppLang.local.save,
          height: 48,
          onTap: _onSave,
        ),
      ),
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
              onPressed: _loadFarmer,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}
