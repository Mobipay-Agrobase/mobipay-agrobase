import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';

/// EKiBBO QR Scan screen (Screen 15).
///
/// Uses `mobile_scanner` (v5) to scan a farmer QR code. The QR code may
/// contain either a URL like `https://mobipay-agrobase.vercel.app/farmer/<id>`
/// or a plain farmer ID (UUID/cuid). On detect, we extract the farmer ID and
/// verify the farmer exists via `/api/farmers/<id>`:
///   - If found → navigate to Farmer detail screen with that id
///   - If not found → show error overlay + allow re-scan
///   - If QR is invalid → show "Invalid QR code" overlay
///
/// Camera controls:
///   - Flashlight toggle (top-right)
///   - Switch camera (front/back) button (top-left)
///
/// Permission handling:
///   - If the system denies camera permission, `MobileScanner`'s
///     `errorBuilder` shows a fallback UI with an "Open Settings" button.
///
/// Scan overlay: a square cutout in the middle of the screen with corner
/// brackets to guide the user.
class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  late final MobileScannerController _controller;

  /// Whether we have already processed a detection (avoids double-navigate).
  bool _processing = false;

  /// Last detected raw value (for re-scan UX).
  String? _lastDetected;

  /// Verification state: 'idle' / 'verifying' / 'not_found' / 'invalid'.
  String _verifyState = 'idle';
  String? _verifyMessage;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Parses a raw QR value to extract a farmer ID.
  /// Handles three shapes:
  ///   1. URL: https://mobipay-agrobase.vercel.app/farmer/<id>
  ///   2. URL with /farmer/<id> path segment (any host)
  ///   3. Plain farmer ID (UUID/cuid)
  String? _extractFarmerId(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return null;
    // Try as URL.
    try {
      final uri = Uri.parse(trimmed);
      if (uri.hasScheme && uri.host.isNotEmpty) {
        final segs = uri.pathSegments.where((e) => e.isNotEmpty).toList();
        final idx = segs.indexOf('farmer');
        if (idx >= 0 && idx + 1 < segs.length) {
          final candidate = segs[idx + 1];
          if (candidate.isNotEmpty) return candidate;
        }
        // Fall back to the last path segment if it looks like an ID.
        if (segs.isNotEmpty) {
          final last = segs.last;
          if (RegExp(r'^[a-zA-Z0-9_-]{8,}$').hasMatch(last)) return last;
        }
        return null;
      }
    } catch (_) {
      // Not a URL — fall through to plain ID check.
    }
    // Plain ID (UUID/cuid/mongo id).
    if (RegExp(r'^[a-zA-Z0-9_-]{8,}$').hasMatch(trimmed)) {
      return trimmed;
    }
    return null;
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_processing) return;
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;
    final raw = barcodes.first.rawValue;
    if (raw == null || raw.isEmpty) return;

    final farmerId = _extractFarmerId(raw);
    if (!mounted) return;
    setState(() {
      _processing = true;
      _lastDetected = raw;
      _verifyState = 'verifying';
      _verifyMessage = AppLang.local.verifying_farmer;
    });

    if (farmerId == null) {
      if (!mounted) return;
      setState(() {
        _verifyState = 'invalid';
        _verifyMessage = AppLang.local.qr_invalid_code_desc;
      });
      // Brief pause so the user can read the message, then unlock for re-scan.
      await Future<void>.delayed(const Duration(milliseconds: 1500));
      if (!mounted) return;
      setState(() {
        _processing = false;
        _verifyState = 'idle';
        _verifyMessage = null;
      });
      return;
    }

    try {
      final res = await ApiClient().get('/api/farmers/$farmerId');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 404) {
        if (!mounted) return;
        setState(() {
          _verifyState = 'not_found';
          _verifyMessage = AppLang.local.qr_farmer_not_found_desc;
        });
        await Future<void>.delayed(const Duration(milliseconds: 1800));
        if (!mounted) return;
        setState(() {
          _processing = false;
          _verifyState = 'idle';
          _verifyMessage = null;
        });
        return;
      }
      if (res.statusCode != 200) {
        if (!mounted) return;
        setState(() {
          _verifyState = 'not_found';
          _verifyMessage = '${AppLang.local.load_failed} (HTTP ${res.statusCode})';
        });
        await Future<void>.delayed(const Duration(milliseconds: 1800));
        if (!mounted) return;
        setState(() {
          _processing = false;
          _verifyState = 'idle';
          _verifyMessage = null;
        });
        return;
      }
      // Success — navigate to farmer detail.
      if (!mounted) return;
      setState(() {
        _verifyState = 'idle';
        _verifyMessage = null;
      });
      // Pause the camera before navigating.
      try {
        await _controller.stop();
      } catch (_) {
        // Ignore errors when stopping — we're navigating away.
      }
      if (!mounted) return;
      Navigator.of(context)
          .pushReplacementNamed(RouterName.farmerDetail, arguments: farmerId);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _verifyState = 'not_found';
        _verifyMessage = '${AppLang.local.load_failed} ($e)';
      });
      await Future<void>.delayed(const Duration(milliseconds: 1800));
      if (!mounted) return;
      setState(() {
        _processing = false;
        _verifyState = 'idle';
        _verifyMessage = null;
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
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  Future<void> _openAppSettings() async {
    // Try common app-settings schemes (iOS + Android). If url_launcher can't
    // open them, the user is still instructed via the dialog message.
    final candidates = <String>[
      'app-settings:',
      'package:com.mobipay.ekibbo',
      'android.settings.APPLICATION_DETAILS_SETTINGS',
    ];
    for (final url in candidates) {
      try {
        final uri = Uri.parse(url);
        final launched = await launchUrl(uri);
        if (launched) return;
      } catch (_) {
        // Try the next candidate.
      }
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.camera_permission_denied_msg),
        backgroundColor: ColorConstant.warning,
      ),
    );
  }

  Future<void> _showPermissionDialog() async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLang.local.camera_permission_denied),
        content: Text(AppLang.local.camera_permission_denied_msg),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(AppLang.local.cancel),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: ColorConstant.primary),
            onPressed: () {
              Navigator.of(ctx).pop();
              _openAppSettings();
            },
            child: Text(AppLang.local.open_settings),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: MyAppBar(
        title: AppLang.local.scan_farmer_qr,
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_off, color: Colors.white),
            tooltip: AppLang.local.torch_off,
            onPressed: () async {
              try {
                await _controller.toggleTorch();
              } catch (_) {
                // Torch not available on this device.
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch_outlined, color: Colors.white),
            tooltip: AppLang.local.switch_camera,
            onPressed: () async {
              try {
                await _controller.switchCamera();
              } catch (_) {
                // Front camera not available.
              }
            },
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ─── The actual scanner ───
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (ctx, error, child) {
              // MobileScanner hands us a MobileScannerException. We can check
              // its errorCode to detect permission denial specifically.
              final code = error.errorCode;
              if (code == MobileScannerErrorCode.permissionDenied) {
                // Schedule the dialog after the current frame so we have a
                // valid context.
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) _showPermissionDialog();
                });
                return _buildPermissionDeniedView();
              }
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    error.errorCode?.name ?? 'Scanner error',
                    textAlign: TextAlign.center,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 13,
                      color: Colors.white,
                    ),
                  ),
                ),
              );
            },
          ),
          // ─── Scan overlay (square cutout + corner brackets) ───
          _buildScanOverlay(),
          // ─── Verify-state banner at bottom ───
          if (_verifyState != 'idle') _buildVerifyBanner(),
          // ─── Hint text at top ───
          Positioned(
            top: 24,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  AppLang.local.qr_scan_hint,
                  style: TextStyleConstant.robotoW400(
                    fontSize: 12,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Builds the square scan cutout with corner brackets. The cutout is
  /// drawn using a `ColorFiltered` over a `Stack` of 4 brackets — but the
  /// simpler approach (used here) is to paint a translucent overlay with
  /// a transparent hole.
  Widget _buildScanOverlay() {
    return LayoutBuilder(
      builder: (ctx, constraints) {
        final size = constraints.biggest;
        final cutout = (size.shortestSide * 0.65).clamp(180.0, 320.0);
        final left = (size.width - cutout) / 2;
        final top = (size.height - cutout) / 2;
        return IgnorePointer(
          child: Stack(
            children: [
              // Translucent scrim with a transparent square hole.
              ColorFiltered(
                colorFilter: ColorFilter.mode(
                  Colors.black.withOpacity(0.45),
                  BlendMode.srcOut,
                ),
                child: Stack(
                  children: [
                    Container(
                      decoration: const BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.all(Radius.zero),
                      ),
                    ),
                    Positioned(
                      left: left,
                      top: top,
                      child: Container(
                        width: cutout,
                        height: cutout,
                        decoration: const BoxDecoration(
                          color: Colors.red, // any color works (srcOut)
                          borderRadius: BorderRadius.all(Radius.circular(16)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Corner brackets on top of the cutout.
              Positioned(
                left: left,
                top: top,
                child: _buildCornerBracket(
                  cutout,
                  isTop: true,
                  isLeft: true,
                ),
              ),
              Positioned(
                right: left,
                top: top,
                child: _buildCornerBracket(
                  cutout,
                  isTop: true,
                  isLeft: false,
                ),
              ),
              Positioned(
                left: left,
                bottom: top,
                child: _buildCornerBracket(
                  cutout,
                  isTop: false,
                  isLeft: true,
                ),
              ),
              Positioned(
                right: left,
                bottom: top,
                child: _buildCornerBracket(
                  cutout,
                  isTop: false,
                  isLeft: false,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCornerBracket(double size,
      {required bool isTop, required bool isLeft}) {
    const thickness = 4.0;
    const length = 28.0;
    return SizedBox(
      width: length,
      height: length,
      child: Stack(
        children: [
          // Horizontal arm.
          Positioned(
            left: isLeft ? 0 : null,
            right: isLeft ? null : 0,
            top: isTop ? 0 : null,
            bottom: isTop ? null : 0,
            child: Container(
              width: length,
              height: thickness,
              color: ColorConstant.gold,
            ),
          ),
          // Vertical arm.
          Positioned(
            left: isLeft ? 0 : null,
            right: isLeft ? null : 0,
            top: isTop ? 0 : null,
            bottom: isTop ? null : 0,
            child: Container(
              width: thickness,
              height: length,
              color: ColorConstant.gold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionDeniedView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.no_photography,
                size: 56, color: Colors.white70),
            const SizedBox(height: 16),
            Text(
              AppLang.local.camera_permission_denied,
              textAlign: TextAlign.center,
              style: TextStyleConstant.quicksandW700(
                fontSize: 16,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              AppLang.local.camera_permission_denied_msg,
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              icon: const Icon(Icons.settings_outlined, size: 18),
              label: Text(AppLang.local.open_settings),
              onPressed: _openAppSettings,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerifyBanner() {
    final isVerifying = _verifyState == 'verifying';
    final isError = _verifyState == 'not_found' || _verifyState == 'invalid';
    final color = isVerifying
        ? ColorConstant.info
        : (isError ? ColorConstant.danger : ColorConstant.success);
    return Positioned(
      left: 24,
      right: 24,
      bottom: 36,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.25),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            if (isVerifying)
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            else
              Icon(
                isError ? Icons.error_outline : Icons.check_circle_outline,
                color: Colors.white,
                size: 20,
              ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _verifyMessage ?? '',
                style: TextStyleConstant.robotoW500(
                  fontSize: 13,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
