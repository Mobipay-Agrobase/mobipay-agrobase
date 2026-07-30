import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:workmanager/workmanager.dart';
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

/// Background sync task name — must match the uniqueName registered in
/// Workmanager().initialize() and Workmanager().registerPeriodicTask().
const kBackgroundSyncTask = 'agrobase-background-sync';

/// Callback dispatcher for workmanager — runs in a background isolate.
/// This function must be top-level (not a class method) and must be
/// resolvable by the workmanager plugin.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    debugPrint('[Workmanager] Background task: $task');

    if (task == kBackgroundSyncTask) {
      // Initialize the same infrastructure as the main app, but in the
      // background isolate. We only need the sync engine — no UI.
      final db = AppDatabase();
      final apiClient = ApiClient();
      await apiClient.init();
      final connectivityManager = ConnectivityManager();
      await connectivityManager.initialize();

      // Only sync if online
      if (connectivityManager.isOnline) {
        final syncEngine = SyncEngine(db, apiClient, connectivityManager);
        await syncEngine.initialize();
        await syncEngine.syncNow();
        debugPrint('[Workmanager] Background sync complete: '
            'synced=${syncEngine.syncedCount}, failed=${syncEngine.failedCount}, '
            'pending=${syncEngine.pendingCount}');
      } else {
        debugPrint('[Workmanager] Offline — skipping sync');
      }
    }

    return true;
  });
}

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

  // ─── P6: Initialize workmanager for background sync ─────────
  // Runs every 15 minutes (the minimum interval allowed by Android's
  // WorkManager). The task is rescheduled automatically by the OS.
  // On iOS, background fetch is less predictable but still works.
  await Workmanager().initialize(callbackDispatcher, isInDebugMode: false);
  await Workmanager().registerPeriodicTask(
    kBackgroundSyncTask,
    kBackgroundSyncTask,
    frequency: const Duration(minutes: 15),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
    existingWorkPolicy: ExistingWorkPolicy.keep,
  );

  // ─── Initialize lightweight mode (for low-end phones) ───────
  final lightweightMode = LightweightMode();
  await lightweightMode.initialize();

  // ─── Auto-sync on app launch (if online) ────────────────────
  if (connectivityManager.isOnline) {
    syncEngine.syncNow();
  }

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
