import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/api/api_client.dart';
import 'core/auth/auth_provider.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/lightweight_mode.dart';
import 'core/database/app_database.dart';
import 'core/connectivity/connectivity_manager.dart';
import 'core/sync/sync_engine.dart';
import 'core/sync/offline_repository.dart';
import 'core/navigation/dynamic_navigation_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ─── Initialize offline-first infrastructure ────────────────
  final db = AppDatabase();
  final apiClient = ApiClient();
  await apiClient.init();

  final connectivityManager = ConnectivityManager();
  await connectivityManager.initialize();

  final syncEngine = SyncEngine(db, apiClient, connectivityManager);
  await syncEngine.initialize();

  final offlineRepo = OfflineRepository(db, apiClient, connectivityManager, syncEngine);

  // ─── P6: Initialize dynamic navigation service ──────────────
  final navService = DynamicNavigationService(api: apiClient);
  await navService.initialize();

  // ─── Background sync via Timer (replaces workmanager plugin) ──
  // Runs a sync check every 15 minutes when the app is in foreground.
  // Native background sync requires workmanager plugin which is
  // incompatible with current Flutter version — will be re-added
  // when the plugin is updated.
  // Runs a sync check every 15 minutes when the app is in foreground.
  // Only syncs if the user is authenticated (has a token).
  Timer.periodic(const Duration(minutes: 15), (timer) {
    if (connectivityManager.isOnline &&
        syncEngine.status != SyncStatus.syncing &&
        apiClient.isAuthenticated) {
      syncEngine.syncNow();
    }
  });

  // ─── Initialize lightweight mode (for low-end phones) ───────
  final lightweightMode = LightweightMode();
  await lightweightMode.initialize();

  // ─── Auto-sync on app launch — ONLY after auth ──────────────
  // Don't sync on startup — the user isn't logged in yet, so all API
  // calls return 401. Sync is triggered after login via the auth state
  // listener in the dashboard page.

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthState()..init()),
        ChangeNotifierProvider(create: (_) => connectivityManager),
        ChangeNotifierProvider(create: (_) => syncEngine),
        ChangeNotifierProvider(create: (_) => lightweightMode),
        ChangeNotifierProvider(create: (_) => navService),
        Provider(create: (_) => offlineRepo),
        Provider(create: (_) => db),
      ],
      child: const AgrobaseApp(),
    ),
  );
}

class AgrobaseApp extends StatelessWidget {
  const AgrobaseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Agrobase',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      routerConfig: AppRouter.router,
    );
  }
}
