import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';

/// DynamicNavigationService — fetches and caches the mobile navigation config
/// from the server. Replaces the hardcoded 13-tab bottom nav in app_router.dart.
///
/// The config is fetched on login and cached in SharedPreferences. On subsequent
/// app launches, the cached config is used immediately (for instant UI), then
/// a background refresh updates it if the server version has changed.
///
/// Usage:
///   final navService = DynamicNavigationService();
///   await navService.initialize();
///   final destinations = navService.destinations;
///   final quickActions = navService.quickActions;

class NavDestination {
  final String key;
  final String label;
  final String icon;
  final String route;
  final String? badge;

  NavDestination({
    required this.key,
    required this.label,
    required this.icon,
    required this.route,
    this.badge,
  });

  factory NavDestination.fromJson(Map<String, dynamic> json) {
    return NavDestination(
      key: json['key'] ?? '',
      label: json['label'] ?? '',
      icon: json['icon'] ?? 'dashboard',
      route: json['route'] ?? '/',
      badge: json['badge'],
    );
  }

  /// Maps the string icon name to a Flutter Material Icon.
  /// Falls back to Icons.dashboard if unknown.
  IconData get iconData {
    const iconMap = <String, IconData>{
      'dashboard': Icons.dashboard,
      'map': Icons.map,
      'people': Icons.people,
      'landscape': Icons.landscape,
      'shopping_cart': Icons.shopping_cart,
      'payment': Icons.payment,
      'account_balance_wallet': Icons.account_balance_wallet,
      'savings': Icons.savings,
      'account_balance': Icons.account_balance,
      'eco': Icons.eco,
      'verified_user': Icons.verified_user,
      'insights': Icons.insights,
      'person': Icons.person,
      'volunteer_activism': Icons.volunteer_activism,
      'school': Icons.school,
      'person_add': Icons.person_add,
      'badge': Icons.badge,
      'inventory': Icons.inventory,
      'receipt_long': Icons.receipt_long,
    };
    return iconMap[icon] ?? Icons.dashboard;
  }
}

class QuickAction {
  final String label;
  final String icon;
  final String route;

  QuickAction({required this.label, required this.icon, required this.route});

  factory QuickAction.fromJson(Map<String, dynamic> json) {
    return QuickAction(
      label: json['label'] ?? '',
      icon: json['icon'] ?? 'dashboard',
      route: json['route'] ?? '/',
    );
  }

  IconData get iconData {
    const iconMap = <String, IconData>{
      'person_add': Icons.person_add,
      'shopping_cart': Icons.shopping_cart,
      'payment': Icons.payment,
      'eco': Icons.eco,
      'badge': Icons.badge,
      'inventory': Icons.inventory,
      'receipt_long': Icons.receipt_long,
    };
    return iconMap[icon] ?? Icons.dashboard;
  }
}

class NavConfig {
  final String version;
  final List<NavDestination> destinations;
  final List<QuickAction> quickActions;

  NavConfig({
    required this.version,
    required this.destinations,
    required this.quickActions,
  });

  factory NavConfig.fromJson(Map<String, dynamic> json) {
    return NavConfig(
      version: json['version'] ?? 'v1-default',
      destinations: ((json['destinations'] ?? []) as List)
          .map((d) => NavDestination.fromJson(d as Map<String, dynamic>))
          .toList(),
      quickActions: ((json['quickActions'] ?? []) as List)
          .map((q) => QuickAction.fromJson(q as Map<String, dynamic>))
          .toList(),
    );
  }

  /// Default config used when the server is unreachable.
  /// Only includes core modules that every tenant has.
  /// Module-specific destinations (VSLA, MFI, Carbon, etc.) are added
  /// by the server's /api/mobile/navigation endpoint when reachable.
  factory NavConfig.defaultConfig() {
    return NavConfig(
      version: 'v1-default',
      destinations: [
        NavDestination(key: 'dashboard', label: 'Home', icon: 'dashboard', route: '/'),
        NavDestination(key: 'plots', label: 'Plots', icon: 'map', route: '/plots'),
        NavDestination(key: 'farmers', label: 'Farmers', icon: 'people', route: '/farmers'),
        NavDestination(key: 'farm_lands', label: 'Farms', icon: 'landscape', route: '/farm-lands'),
        NavDestination(key: 'purchases', label: 'Purchase', icon: 'shopping_cart', route: '/purchase/new'),
        NavDestination(key: 'payments', label: 'Pay', icon: 'payment', route: '/payments'),
        NavDestination(key: 'loans', label: 'Loans', icon: 'account_balance_wallet', route: '/loans'),
        NavDestination(key: 'profile', label: 'Profile', icon: 'person', route: '/profile'),
      ],
      quickActions: [],
    );
  }
}

class DynamicNavigationService extends ChangeNotifier {
  static const _cacheKey = 'mobile_nav_config';
  static const _versionKey = 'mobile_nav_version';

  final ApiClient _api;
  NavConfig _config = NavConfig.defaultConfig();
  bool _isLoading = false;
  String? _lastError;

  DynamicNavigationService({ApiClient? api}) : _api = api ?? ApiClient();

  NavConfig get config => _config;
  List<NavDestination> get destinations => _config.destinations;
  List<QuickAction> get quickActions => _config.quickActions;
  bool get isLoading => _isLoading;
  String? get lastError => _lastError;

  /// Initialize: load cached config, then fetch fresh from server.
  Future<void> initialize() async {
    // 1. Load cached config for instant UI
    await _loadCachedConfig();

    // 2. Fetch fresh config from server (non-blocking)
    await refresh();
  }

  /// Load the cached nav config from SharedPreferences.
  Future<void> _loadCachedConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString(_cacheKey);
      if (cached != null) {
        final json = jsonDecode(cached) as Map<String, dynamic>;
        _config = NavConfig.fromJson(json);
        notifyListeners();
      }
    } catch (e) {
      // Ignore cache errors — use default config
      debugPrint('[DynamicNav] Failed to load cached config: $e');
    }
  }

  /// Fetch the latest nav config from the server.
  /// If the server version matches the cached version, no update is made.
  Future<void> refresh() async {
    if (_isLoading) return;
    _isLoading = true;
    _lastError = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/mobile/navigation');
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final newConfig = NavConfig.fromJson(json);

        // Only update + cache if the version changed
        if (newConfig.version != _config.version) {
          _config = newConfig;
          await _cacheConfig(newConfig);
          notifyListeners();
          debugPrint('[DynamicNav] Updated to version ${newConfig.version} '
              '(${newConfig.destinations.length} destinations)');
        } else {
          debugPrint('[DynamicNav] Version unchanged (${newConfig.version})');
        }
      } else {
        _lastError = 'Server returned ${response.statusCode}';
        debugPrint('[DynamicNav] $_lastError');
      }
    } catch (e) {
      _lastError = e.toString();
      debugPrint('[DynamicNav] Failed to fetch nav config: $e');
      // Keep using the cached/default config
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Cache the nav config in SharedPreferences for offline use.
  Future<void> _cacheConfig(NavConfig config) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cacheKey, jsonEncode({
        'version': config.version,
        'destinations': config.destinations.map((d) => {
          'key': d.key,
          'label': d.label,
          'icon': d.icon,
          'route': d.route,
          if (d.badge != null) 'badge': d.badge,
        }).toList(),
        'quickActions': config.quickActions.map((q) => {
          'label': q.label,
          'icon': q.icon,
          'route': q.route,
        }).toList(),
      }));
      await prefs.setString(_versionKey, config.version);
    } catch (e) {
      debugPrint('[DynamicNav] Failed to cache config: $e');
    }
  }

  /// Clear the cached config (called on logout).
  Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_cacheKey);
    await prefs.remove(_versionKey);
    _config = NavConfig.defaultConfig();
    notifyListeners();
  }
}
