// ignore: library_names
library AppProvider;

import 'dart:async';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/domain/l10n/model/app_language.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_farmer.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_pond.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_species.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_orther_info.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/models/farmer_local/farmer_local_model.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/information/species_response.dart';

part 'src/app_setting.dart';
part 'src/app_farmer.dart';
part 'src/app_listing_farmer.dart';
part 'src/app_search_farmer.dart';
part 'src/app_pond.dart';
part 'src/app_species.dart';

enum AppEvent {
  appSettingSwitchLanguage,
  appSettingSwitchMode,

  appFarmerSaveToLocal,
  appFarmerDeleteFromLocal,

  appPondSaveToLocal,
  appPondDeleteFromLocal,

  appSpeciesSaveToLocal,
  appSpeciesDeleteFromLocal,

  appListingInit,
  appListingSearchFarmer,
  appListingFetchData,

  appSearchInit,
  appSearchFarmer,
  appSearchFetchData,
  appSearchResetData,
  appSearchSetCooperative,
}

class AppProvider with ChangeNotifier {
  AppProvider();

  AppSettings appSettings = AppSettings();
  AppFarmer appFarmer = AppFarmer();
  AppListingFarmer appListingFarmer = AppListingFarmer();
  AppSearchFarmer appSearchFarmer = AppSearchFarmer();

  AppPond appPond = AppPond();
  AppSpecies appSpecies = AppSpecies();

  void initState() async {
    appPond.init();
    appSpecies.init();
    await appFarmer.init();
    notifyListeners();
  }

  void updateState(AppEvent appEvent, {dynamic argument}) {
    switch (appEvent) {
      case AppEvent.appSettingSwitchMode:
        appSettings.switchMode();
        break;
      case AppEvent.appFarmerSaveToLocal:
        final mFarmerLocal = argument as MFarmerLocal;
        appFarmer.save(mFarmerLocal);
        break;
      case AppEvent.appFarmerDeleteFromLocal:
        final idFarmer = argument as int;
        appFarmer.delete(idFarmer.toString());
        break;
      case AppEvent.appSearchResetData:
        appSearchFarmer.resetData();
        break;
      case AppEvent.appSearchSetCooperative:
        final param = argument as Map<String, dynamic>;
        appSearchFarmer.setCooperative(
            param['cooperativeId'], param['hasData']);
        break;
      default:
    }
    notifyListeners();
  }

  Future updateStateFuture(AppEvent appEvent, {dynamic argument}) async {
    switch (appEvent) {
      case AppEvent.appSettingSwitchLanguage:
        await appSettings.switchLanguage();
        break;
      case AppEvent.appListingInit:
        await appListingFarmer.fetchInit();
        break;
      case AppEvent.appListingSearchFarmer:
        final param = argument as String;
        await appListingFarmer.searchFarmer(param);
        break;
      case AppEvent.appListingFetchData:
        await appListingFarmer.fetchNextPage();
        break;
      case AppEvent.appSearchInit:
        await appSearchFarmer.fetchInit();
        break;
      case AppEvent.appSearchFarmer:
        final param = argument as String;
        await appSearchFarmer.searchFarmer(param);
        break;
      case AppEvent.appSearchFetchData:
        await appSearchFarmer.fetchNextPage();
        break;
      case AppEvent.appPondSaveToLocal:
        final farmLandModel = argument as FarmLandModel;
        await appPond.save(farmLandModel);
        break;
      case AppEvent.appPondDeleteFromLocal:
        final idPond = argument as String;
        await appPond.delete(idPond);
        break;
      case AppEvent.appSpeciesSaveToLocal:
        final speciesInfoResponse = argument as SpeciesInfoResponse;
        await appSpecies.save(speciesInfoResponse);
        break;
      case AppEvent.appSpeciesDeleteFromLocal:
        final idSpecies = argument as String;
         appSpecies.delete(idSpecies);
        break;
      default:
    }
    notifyListeners();
  }
}
