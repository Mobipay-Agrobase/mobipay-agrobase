// ignore_for_file: constant_identifier_names

import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/screens/crops/crops_list_screen.dart';
import 'package:mobipay_ekibbo/screens/dashboard/breakdowns_dashboard_screen.dart';
import 'package:mobipay_ekibbo/screens/dashboard/views/dashboard_screen.dart';
import 'package:mobipay_ekibbo/screens/farmer_detail_screen.dart';
import 'package:mobipay_ekibbo/screens/farmer_registration/views/farmer_registration_screen.dart';
import 'package:mobipay_ekibbo/screens/farm_lands/farm_land_detail_screen.dart';
import 'package:mobipay_ekibbo/screens/farm_lands/farm_land_form_screen.dart';
import 'package:mobipay_ekibbo/screens/farm_lands/farm_lands_list_screen.dart';
import 'package:mobipay_ekibbo/screens/farmers/farmers_list_screen.dart';
import 'package:mobipay_ekibbo/screens/farmers/farmer_photo_upload_screen.dart';
import 'package:mobipay_ekibbo/screens/login/views/login_screen.dart';
import 'package:mobipay_ekibbo/screens/procurement/procurement_list_screen.dart';
import 'package:mobipay_ekibbo/screens/profile/profile_screen.dart';
import 'package:mobipay_ekibbo/screens/qr_scan/qr_scan_screen.dart';
import 'package:mobipay_ekibbo/screens/settings/settings_screen.dart';
import 'package:mobipay_ekibbo/screens/settings/sync_screen.dart';
import 'package:mobipay_ekibbo/screens/trainings/training_form_screen.dart';
import 'package:mobipay_ekibbo/screens/trainings/trainings_list_screen.dart';
import 'package:mobipay_ekibbo/screens/transactions/transactions_list_screen.dart';
import 'package:mobipay_ekibbo/screens/vehicles/vehicles_list_screen.dart';

/// Global navigator key — used to access the navigator context from
/// non-widget code (e.g. AppLang.local looks it up via navigatorKey).
final GlobalKey<NavigatorState> navigatorKey = GlobalKey();

/// EKiBBO routes — simple onGenerateRoute router (no go_router dependency).
/// Add new screens here as they're built.
class RoutesManager {
  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    Widget screen = const SizedBox.shrink();
    final args = settings.arguments;
    switch (settings.name) {
      case RouterName.login:
        screen = const LoginScreen();
        break;
      case RouterName.dashboard:
        screen = const DashboardScreen();
        break;
      case RouterName.farmerRegistration:
        // Existing FarmerRegistrationScreen takes no args (per task rules we
        // cannot modify it). Edit mode will be wired up later — for now the
        // Edit button on Farmer detail simply navigates here.
        screen = const FarmerRegistrationScreen();
        break;
      case RouterName.farmersList:
        screen = const FarmersListScreen();
        break;
      case RouterName.farmerDetail:
        final farmerId = (args is String)
            ? args
            : (args is Map ? args['farmerId'] as String? : null);
        screen = FarmerDetailScreen(farmerId: farmerId ?? '');
        break;
      case RouterName.farmLandsList:
        final farmerId = (args is String)
            ? args
            : (args is Map ? args['farmerId'] as String? : null);
        screen = FarmLandsListScreen(initialFarmerId: farmerId);
        break;
      case RouterName.farmLandDetail:
        final farmLandId = (args is String)
            ? args
            : (args is Map ? args['farmLandId'] as String? : null);
        screen = FarmLandDetailScreen(farmLandId: farmLandId ?? '');
        break;
      case RouterName.farmLandForm:
        if (args is Map) {
          screen = FarmLandFormScreen(
            farmLandId: args['farmLandId'] as String?,
            farmerId: args['farmerId'] as String?,
          );
        } else {
          screen = const FarmLandFormScreen();
        }
        break;
      case RouterName.cropsList:
        screen = const CropsListScreen();
        break;
      case RouterName.trainingsList:
        screen = const TrainingsListScreen();
        break;
      case RouterName.trainingForm:
        final trainingId = (args is String)
            ? args
            : (args is Map ? args['trainingId'] as String? : null);
        screen = TrainingFormScreen(trainingId: trainingId);
        break;
      case RouterName.breakdownsDashboard:
        screen = const BreakdownsDashboardScreen();
        break;
      case RouterName.profile:
        screen = const ProfileScreen();
        break;
      case RouterName.settings:
        screen = const SettingsScreen();
        break;

      // ─── Screens 13-18 ───
      case RouterName.procurementList:
        screen = const ProcurementListScreen();
        break;
      case RouterName.transactionsList:
        screen = const TransactionsListScreen();
        break;
      case RouterName.qrScan:
        screen = const QrScanScreen();
        break;
      case RouterName.sync:
        screen = const SyncScreen();
        break;
      case RouterName.farmerPhotoUpload:
        final farmerId = (args is String)
            ? args
            : (args is Map ? args['farmerId'] as String? : null);
        screen = FarmerPhotoUploadScreen(farmerId: farmerId ?? '');
        break;
      case RouterName.vehiclesList:
        screen = const VehiclesListScreen();
        break;
    }
    return MaterialPageRoute(builder: (_) => screen);
  }
}

class RouterName {
  static const login = '/login';
  static const dashboard = '/dashboard';
  static const farmerRegistration = '/farmer_registration';
  static const farmersList = '/farmers';
  static const farmerDetail = '/farmer_detail';
  static const farmLandsList = '/farm_lands';
  static const farmLandDetail = '/farm_land_detail';
  static const farmLandForm = '/farm_land_form';

  // ─── Screens 7-12 ───
  static const cropsList = '/crops';
  static const trainingsList = '/trainings';
  static const trainingForm = '/training_form';
  static const breakdownsDashboard = '/breakdowns';
  static const profile = '/profile';
  static const settings = '/settings';

  // ─── Screens 13-18 ───
  static const procurementList = '/procurement';
  static const transactionsList = '/transactions';
  static const qrScan = '/qr_scan';
  static const sync = '/sync';
  static const farmerPhotoUpload = '/farmer_photo_upload';
  static const vehiclesList = '/vehicles';
}
