import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// EKiBBO Profile screen (Screen 11).
///
/// Shows logged-in user info, exposes the API server switcher (dev helper),
/// and provides a logout button. The app doesn't cache user name/email from
/// the login response yet, so we display "Field Officer" (or "Farmer" if the
/// role can be inferred) as a placeholder.
///
/// Sections:
///   1. Account — User info (read-only), Logout button (clears session → /login)
///   2. App Settings — API Server (Dev) — opens dialog to switch between
///      Production / Local dev (Android emulator) / Local dev (iOS) / Custom URL.
///      Calls ApiClient.setBaseUrl() + ApiClient().clearAuth() + shows snackbar
///      "Please log out + log back in"
///   3. About — App version (hardcoded "1.0.0+1"), powered by "MobiPay AgroSys"
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? _currentBaseUrl;
  bool _loadingUrl = true;

  @override
  void initState() {
    super.initState();
    _loadCurrentBaseUrl();
  }

  Future<void> _loadCurrentBaseUrl() async {
    final url = await ApiClient.getBaseUrl();
    if (!mounted) return;
    setState(() {
      _currentBaseUrl = url;
      _loadingUrl = false;
    });
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLang.local.sign_out),
        content: Text(AppLang.local.confirm_logout_msg),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(AppLang.local.cancel),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: ColorConstant.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(AppLang.local.sign_out),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ApiClient().clearSession();
    ApiClient().clearAuth();
    if (!mounted) return;
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  Future<void> _showApiServerPicker() async {
    final current = _currentBaseUrl ?? '';
    final presets = <Map<String, String>>[
      {
        'label': 'Production (Vercel)',
        'url': 'https://mobipay-agrobase.vercel.app',
      },
      {
        'label': 'Local dev (Android emulator → host)',
        'url': 'http://10.0.2.2:3000',
      },
      {
        'label': 'Local dev (iOS simulator → host)',
        'url': 'http://127.0.0.1:3000',
      },
      {
        'label': 'Local dev (physical device → LAN)',
        'url': 'http://192.168.1.50:3000',
      },
      {'label': 'Custom URL…', 'url': '__custom__'},
    ];
    final selected = await showDialog<String>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: Text(
          AppLang.local.api_server,
          style: TextStyleConstant.robotoW600(fontSize: 16),
        ),
        children: presets.map((p) {
          final isCurrent = current == p['url'];
          return SimpleDialogOption(
            onPressed: () => Navigator.pop(ctx, p['url']),
            child: Row(
              children: [
                Icon(
                  isCurrent
                      ? Icons.radio_button_checked
                      : Icons.radio_button_off,
                  size: 18,
                  color: isCurrent
                      ? ColorConstant.primary
                      : ColorConstant.textSecondary,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p['label']!,
                        style: TextStyleConstant.robotoW500(
                          fontSize: 13,
                          color: ColorConstant.textPrimary,
                        ),
                      ),
                      Text(
                        p['url']!,
                        style: TextStyleConstant.robotoW400(
                          fontSize: 11,
                          color: ColorConstant.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
    if (selected == null) return;
    if (selected == '__custom__') {
      await _showCustomUrlDialog(current);
      return;
    }
    await ApiClient.setBaseUrl(selected);
    ApiClient().clearAuth();
    if (!mounted) return;
    setState(() => _currentBaseUrl = selected);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
            '${AppLang.local.api_server_changed}: $selected\n${AppLang.local.please_relogin}'),
        backgroundColor: ColorConstant.info,
      ),
    );
  }

  Future<void> _showCustomUrlDialog(String current) async {
    final controller = TextEditingController(text: current);
    try {
      final custom = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(
            AppLang.local.custom_api_url,
            style: TextStyleConstant.robotoW600(fontSize: 16),
          ),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: 'http://10.0.2.2:3000',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.url,
            autocorrect: false,
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(AppLang.local.cancel)),
            TextButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              child: Text(AppLang.local.save),
            ),
          ],
        ),
      );
      if (custom == null || custom.isEmpty) return;
      final uri = Uri.tryParse(custom);
      if (uri == null ||
          !uri.hasAbsolutePath ||
          !(uri.scheme == 'http' || uri.scheme == 'https')) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.invalid_url),
            backgroundColor: ColorConstant.danger,
          ),
        );
        return;
      }
      await ApiClient.setBaseUrl(custom);
      ApiClient().clearAuth();
      if (!mounted) return;
      setState(() => _currentBaseUrl = custom);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              '${AppLang.local.api_server_changed}: $custom\n${AppLang.local.please_relogin}'),
          backgroundColor: ColorConstant.info,
        ),
      );
    } finally {
      controller.dispose();
    }
  }

  String _shortUrl(String url) {
    if (url.length <= 32) return url;
    return '${url.substring(0, 14)}…${url.substring(url.length - 18)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(title: AppLang.local.profile),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildProfileHeader(),
            const SizedBox(height: 24),
            _buildSectionTitle(AppLang.local.account),
            const SizedBox(height: 8),
            _buildSettingsCard([
              _SettingsItem(
                icon: Icons.person_outline,
                label: AppLang.local.role,
                trailing: const Text(
                  'Field Officer',
                  style: TextStyle(
                    fontSize: 13,
                    color: ColorConstant.textSecondary,
                  ),
                ),
              ),
              const _SettingsDivider(),
              _SettingsItem(
                icon: Icons.dns_outlined,
                label: AppLang.local.api_server_dev,
                trailing: _loadingUrl
                    ? const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _currentBaseUrl != null
                                ? _shortUrl(_currentBaseUrl!)
                                : '—',
                            style: TextStyleConstant.robotoW400(
                              fontSize: 11,
                              color: ColorConstant.textSecondary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.chevron_right,
                              color: ColorConstant.textSecondary, size: 20),
                        ],
                      ),
                onTap: _showApiServerPicker,
              ),
              const _SettingsDivider(),
              _SettingsItem(
                icon: Icons.logout,
                label: AppLang.local.sign_out,
                iconColor: ColorConstant.danger,
                labelColor: ColorConstant.danger,
                onTap: _logout,
              ),
            ]),
            const SizedBox(height: 24),
            _buildSectionTitle(AppLang.local.about),
            const SizedBox(height: 8),
            _buildSettingsCard([
              _SettingsItem(
                icon: Icons.info_outline,
                label: AppLang.local.version,
                trailing: const Text(
                  '1.0.0+1',
                  style: TextStyle(
                    fontSize: 13,
                    color: ColorConstant.textSecondary,
                  ),
                ),
              ),
              const _SettingsDivider(),
              _SettingsItem(
                icon: Icons.coffee_outlined,
                label: AppLang.local.powered_by,
                trailing: const Text(
                  'MobiPay AgroSys',
                  style: TextStyle(
                    fontSize: 13,
                    color: ColorConstant.textSecondary,
                  ),
                ),
              ),
              const _SettingsDivider(),
              _SettingsItem(
                icon: Icons.settings_outlined,
                label: AppLang.local.settings,
                trailing: const Icon(Icons.chevron_right,
                    color: ColorConstant.textSecondary, size: 20),
                onTap: () => Navigator.of(context)
                    .pushNamed(RouterName.settings),
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [ColorConstant.primary, ColorConstant.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.16),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.coffee, color: Colors.white, size: 40),
          ),
          const SizedBox(height: 12),
          Text(
            'Field Officer',
            style: TextStyleConstant.quicksandW700(
              fontSize: 20,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'EKiBBO Coffee Exporters',
            style: TextStyleConstant.robotoW400(
              fontSize: 13,
              color: Colors.white.withOpacity(0.85),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title.toUpperCase(),
        style: TextStyleConstant.robotoW600(
          fontSize: 12,
          color: ColorConstant.textSecondary,
        ),
      ),
    );
  }

  Widget _buildSettingsCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.grayEB),
      ),
      child: Column(children: children),
    );
  }
}

/// Small reusable settings list item with optional trailing widget.
class _SettingsItem extends StatelessWidget {
  const _SettingsItem({
    required this.icon,
    required this.label,
    this.trailing,
    this.iconColor,
    this.labelColor,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final Widget? trailing;
  final Color? iconColor;
  final Color? labelColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor = iconColor ?? ColorConstant.textSecondary;
    final effectiveLabelColor = labelColor ?? ColorConstant.textPrimary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 22, color: effectiveIconColor),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: TextStyleConstant.robotoW500(
                    fontSize: 14,
                    color: effectiveLabelColor,
                  ),
                ),
              ),
              if (trailing != null) trailing!,
              if (trailing == null)
                const Icon(Icons.chevron_right,
                    color: ColorConstant.textSecondary, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _SettingsDivider extends StatelessWidget {
  const _SettingsDivider();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16),
      child: Divider(height: 1, color: ColorConstant.grayEB),
    );
  }
}
