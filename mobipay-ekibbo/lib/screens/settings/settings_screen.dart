import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:mobipay_ekibbo/screens/profile/profile_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

/// EKiBBO Settings screen (Screen 12).
///
/// Sections:
///   1. General — App Language (English only)
///   2. Sync — Sync Now (stub showing snackbar), Auto-sync on WiFi toggle
///   3. Developer — API Server (links to Profile's API Server dialog),
///      Clear Cache button (clears shared_preferences — but NOT auth token),
///      Show Debug Logs toggle
///   4. About — Version, Open Source Licenses, Privacy Policy, Terms
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _autoSyncOnWifi = false;
  bool _debugLogs = false;
  bool _clearing = false;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _autoSyncOnWifi = prefs.getBool('auto_sync_wifi') ?? false;
      _debugLogs = prefs.getBool('show_debug_logs') ?? false;
    });
  }

  Future<void> _setAutoSync(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('auto_sync_wifi', value);
    if (!mounted) return;
    setState(() => _autoSyncOnWifi = value);
  }

  Future<void> _setDebugLogs(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('show_debug_logs', value);
    if (!mounted) return;
    setState(() => _debugLogs = value);
  }

  Future<void> _syncNow() async {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.sync_started),
        backgroundColor: ColorConstant.info,
      ),
    );
    // A real sync engine will be wired in here later — for now this is a
    // no-op stub per the task spec.
  }

  Future<void> _confirmClearCache() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLang.local.clear_cache),
        content: Text(AppLang.local.clear_cache_msg),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(AppLang.local.cancel),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: ColorConstant.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(AppLang.local.clear),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    if (!mounted) return;
    setState(() => _clearing = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      // Remove only cache-related keys — explicitly preserve auth_token +
      // tenant_id + api_base_url so the user stays logged in.
      final keys = prefs.getKeys();
      final preserve = <String>{
        'auth_token',
        'tenant_id',
        'api_base_url',
      };
      for (final k in keys) {
        if (preserve.contains(k)) continue;
        await prefs.remove(k);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLang.local.cache_cleared),
          backgroundColor: ColorConstant.success,
        ),
      );
      // Refresh toggles after clearing cache.
      await _loadPrefs();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${AppLang.local.clear_failed}: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _clearing = false);
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    try {
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${AppLang.local.could_not_open}: $url'),
            backgroundColor: ColorConstant.danger,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${AppLang.local.could_not_open}: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(title: AppLang.local.settings),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildSectionTitle(AppLang.local.general),
            const SizedBox(height: 8),
            _buildCard([
              _SettingsItem(
                icon: Icons.language_outlined,
                label: AppLang.local.app_language,
                trailing: const Text(
                  'English',
                  style: TextStyle(
                    fontSize: 13,
                    color: ColorConstant.textSecondary,
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 24),
            _buildSectionTitle(AppLang.local.sync),
            const SizedBox(height: 8),
            _buildCard([
              _SettingsItem(
                icon: Icons.sync_outlined,
                label: AppLang.local.sync_now,
                onTap: _syncNow,
              ),
              const _SettingsDivider(),
              SwitchListTile(
                value: _autoSyncOnWifi,
                onChanged: _setAutoSync,
                activeColor: ColorConstant.primary,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                title: Text(
                  AppLang.local.auto_sync_wifi,
                  style: TextStyleConstant.robotoW500(
                    fontSize: 14,
                    color: ColorConstant.textPrimary,
                  ),
                ),
                secondary: const Icon(Icons.wifi_outlined,
                    size: 22, color: ColorConstant.textSecondary),
              ),
            ]),
            const SizedBox(height: 24),
            _buildSectionTitle(AppLang.local.developer),
            const SizedBox(height: 8),
            _buildCard([
              _SettingsItem(
                icon: Icons.dns_outlined,
                label: AppLang.local.api_server_dev,
                trailing: const Icon(Icons.chevron_right,
                    color: ColorConstant.textSecondary, size: 20),
                onTap: () async {
                  // Reuse the Profile screen's API Server picker by pushing
                  // it; this keeps the picker logic in one place.
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const ProfileScreen(),
                    ),
                  );
                },
              ),
              const _SettingsDivider(),
              _SettingsItem(
                icon: Icons.cleaning_services_outlined,
                label: _clearing
                    ? AppLang.local.clearing
                    : AppLang.local.clear_cache,
                onTap: _clearing ? null : _confirmClearCache,
              ),
              const _SettingsDivider(),
              SwitchListTile(
                value: _debugLogs,
                onChanged: _setDebugLogs,
                activeColor: ColorConstant.primary,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                title: Text(
                  AppLang.local.show_debug_logs,
                  style: TextStyleConstant.robotoW500(
                    fontSize: 14,
                    color: ColorConstant.textPrimary,
                  ),
                ),
                secondary: const Icon(Icons.bug_report_outlined,
                    size: 22, color: ColorConstant.textSecondary),
              ),
            ]),
            const SizedBox(height: 24),
            _buildSectionTitle(AppLang.local.about),
            const SizedBox(height: 8),
            _buildCard([
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
                icon: Icons.article_outlined,
                label: AppLang.local.open_source_licenses,
                trailing: const Icon(Icons.chevron_right,
                    color: ColorConstant.textSecondary, size: 20),
                onTap: () {
                  showLicensePage(
                    context: context,
                    applicationName: 'EKiBBO Agrobase',
                    applicationVersion: '1.0.0+1',
                  );
                },
              ),
              const _SettingsDivider(),
              _SettingsItem(
                icon: Icons.privacy_tip_outlined,
                label: AppLang.local.privacy_policy,
                trailing: const Icon(Icons.open_in_new,
                    color: ColorConstant.textSecondary, size: 18),
                onTap: () => _openUrl(
                    'https://mobipay-agrobase.vercel.app/privacy'),
              ),
              const _SettingsDivider(),
              _SettingsItem(
                icon: Icons.description_outlined,
                label: AppLang.local.terms,
                trailing: const Icon(Icons.open_in_new,
                    color: ColorConstant.textSecondary, size: 18),
                onTap: () =>
                    _openUrl('https://mobipay-agrobase.vercel.app/terms'),
              ),
            ]),
          ],
        ),
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

  Widget _buildCard(List<Widget> children) {
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
