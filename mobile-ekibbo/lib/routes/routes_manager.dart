// ignore_for_file: constant_identifier_names

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farmer_local/farmer_local_model.dart';
import 'package:agrobase_ekibbo/presentation/distribution/screen_add_distribution.dart';
import 'package:agrobase_ekibbo/presentation/distribution/screen_distribution.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/farmer_list_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_query/screen_query_create.dart';
import 'package:agrobase_ekibbo/presentation/farmer_query/screen_query_listing.dart';
import 'package:agrobase_ekibbo/presentation/information/check_fishing/index.dart';
import 'package:agrobase_ekibbo/presentation/information/feeding/index.dart';
import 'package:agrobase_ekibbo/presentation/information/mortality/index.dart';
import 'package:agrobase_ekibbo/presentation/information/species/index.dart';
import 'package:agrobase_ekibbo/presentation/information/water_quality/index.dart';
import 'package:agrobase_ekibbo/presentation/sync_screen/index.dart';
import 'package:agrobase_ekibbo/presentation/sync_screen/views/list_farmers_local_screen.dart';
import 'package:agrobase_ekibbo/presentation/pond/pond_inspection_screen.dart';
import 'package:agrobase_ekibbo/presentation/pond/pond_reg_screen.dart';
import 'package:agrobase_ekibbo/presentation/procurement/views/screen_crop_harvest.dart';
import 'package:agrobase_ekibbo/presentation/procurement/views/screen_procurement.dart';
import 'package:agrobase_ekibbo/presentation/procurement/views/screen_vendor_procurement.dart';
import 'package:agrobase_ekibbo/presentation/stock/creation/index.dart';
import 'package:agrobase_ekibbo/presentation/stock/transfer/index.dart';
import 'package:agrobase_ekibbo/presentation/sync_screen/views/list_pond_local_screen.dart';
import 'package:agrobase_ekibbo/presentation/sync_screen/views/list_species_local_screen.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/presentation/crop/add_crop_screen.dart';
import 'package:agrobase_ekibbo/presentation/crop/crop_detail_screen.dart';
import 'package:agrobase_ekibbo/presentation/plot/add_farm_plotting.dart';
import 'package:agrobase_ekibbo/presentation/plot/add_plot_screen.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/screens/add_carbon_footprint_screen.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/views/dashboard_screen.dart';
import 'package:agrobase_ekibbo/presentation/distribution/screen_add_product.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/animal_husbandry_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/certificate_info_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/new_animal_husbandry_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/asset_info_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/bank_info_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/edit_farmer_profile_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/family_info_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/farm_equipment_info_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/farmer_detail_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/finance_info_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/insurance_info_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/new_bank_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/new_equipment_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/views/new_insurance_screen.dart';
import 'package:agrobase_ekibbo/presentation/plot/list_plot_screen.dart';
import 'package:agrobase_ekibbo/presentation/login/views/login_screen.dart';
import 'package:agrobase_ekibbo/presentation/plot/near_by_plot_screen.dart';
import 'package:agrobase_ekibbo/presentation/plot/land_document_screen.dart';
import 'package:agrobase_ekibbo/presentation/plot/plot_detail_screen.dart';
import 'package:agrobase_ekibbo/presentation/procurement/child/screen_add_crop_harvest.dart';
import 'package:agrobase_ekibbo/presentation/profile/profile_screen.dart';
import 'package:agrobase_ekibbo/presentation/sale_intention/views/add_sale_intention_screen.dart';
import 'package:agrobase_ekibbo/presentation/sale_intention/views/list_sale_intention_screen.dart';
//import 'package:agrobase_ekibbo/presentation/scan/scan_qr_screen.dart';
import 'package:agrobase_ekibbo/presentation/splash/splash_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/list_transaction_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/transaction_calendar_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/transaction_detail_screen.dart';
import 'package:agrobase_ekibbo/presentation/farmer_registration/farmer_registration_screen.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_module_list_screen.dart';

class RoutesManager {
  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    Widget screen = Container();
    switch (settings.name) {
      case RouterName.farmer_registration:
        final arguments =
            (settings.arguments ?? <String, dynamic>{}) as Map<String, dynamic>;
        final farmerData = (arguments["farmerData"] ?? <String, dynamic>{})
            .cast<String, dynamic>();
        MFarmerLocal farmerLocal = MFarmerLocal.fromMap(farmerData);
        //debugPrint("data farmer $farmerData");
        screen = FarmerRegistrationScreen(
          farmerLocal: farmerLocal,
        );
        break;
      case RouterName.ekbTrainings:
        screen = const EkibboModuleListScreen(type: 'trainings', title: 'Trainings');
        break;
      case RouterName.ekbFarmerVisits:
        screen = const EkibboModuleListScreen(type: 'farm-visits', title: 'Farmer Visits');
        break;
      case RouterName.ekbSurveys:
        screen = const EkibboModuleListScreen(type: 'surveys', title: 'Surveys');
        break;
      case RouterName.ekbLoans:
        screen = const EkibboModuleListScreen(type: 'loans', title: 'Loans');
        break;
      case RouterName.login:
        screen = const LoginScreen();
        break;
      case RouterName.splash:
        screen = const SplashScreen();
        break;
      case RouterName.dashboard:
        screen = const DashboardScreen();
        break;
      case RouterName.farmer_detail:
        screen = FarmerDetailScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.list_plots:
        screen = ListPlotScreen(
          farmer: settings.arguments as FarmerModel,
        );
        break;
      case RouterName.family_info:
        screen = FamilyInfoScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.edit_farmer_profile:
        screen = EditFarmerProfileScreen(
          model: settings.arguments as FarmerModel,
        );
        break;
      case RouterName.farmer_list:
        screen = const FarmerListScreen();
        break;
      case RouterName.profile:
        screen = const ProfileScreen();
        break;
      case RouterName.asset_info:
        screen = AssetInfoScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.bank_info:
        screen = BankInfoScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.finance_info:
        screen = FinanceInfoScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.insurance_info:
        screen = InsuranceInfoScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.farm_equip:
        screen = FarmEquipmentScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.new_animal:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        screen = NewAnimalHusbandryScreen(
          animalRes: map['animal_res'],
          animal: map['animal'],
        );
        break;
      case RouterName.new_insurance:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        screen = NewInsuranceScreen(
          insurance: map['insurance'],
          dataCrop: map['data_crop'],
        );
        break;
      case RouterName.animal_husbandry:
        screen = AnimalHusbandryScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.certificate_info:
        screen = CertificateInfoScreen(
          farmerId: settings.arguments as int,
        );
        break;
      case RouterName.add_plot:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        screen = AddPlotScreen(
          farmer: map['farmer'],
          farmland: map['farmland'],
        );
        break;
      case RouterName.add_crop:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        screen = AddCropScreen(
          crop: map['crop'],
          farmland: map['farmland'],
          farmer: map['farmer'],
        );
        break;
      case RouterName.plot_detail:
        final arg = settings.arguments as Map<String, dynamic>;
        screen = PlotDetailScreen(
          farmer: arg['farmer'],
          plot: arg['plot'],
        );
        break;
      case RouterName.farmers_local:
        screen = const ListFarmerLocalScreen();
        break;
      case RouterName.ponds_local:
        screen = const ListPondLocalScreen();
        break;
      case RouterName.species_local:
        screen = const ListSpeciesLocalScreen();
        break;
      case RouterName.sync_from_local:
        screen = const ScreenSync();
        break;
      case RouterName.transaction_calendar:
        screen = const TransactionCalendarScreen();
        break;
      case RouterName.land_document:
        screen = LandDocumentScreen(
          landDocument:
              settings.arguments != null ? settings.arguments as String : null,
        );
        break;
      case RouterName.crop_detail:
        screen = CropDetailScreen(
          cropId: settings.arguments as int,
        );
        break;
      // case RouterName.scan_qr:
      //   screen = const ScanQrScreen();
      //   break;
      case RouterName.add_sale_intention:
        String? productId;
        if (settings.arguments != null) {
          productId = settings.arguments as String;
        }
        screen = AddSaleIntentionScreen(
          productId: productId,
        );
        break;
      case RouterName.near_by_plot:
        screen = const NearByPlotScreen();
        break;
      case RouterName.list_sale_intention:
        screen = const ListSaleIntentionScreen();
        break;
      case RouterName.list_transaction:
        screen = ListTransactionScreen(
          date: settings.arguments as DateTime,
        );
        break;
      case RouterName.transaction_detail:
        final map = settings.arguments as Map<String, dynamic>;
        screen = TransactionDetailScreen(srp: map['srp'], date: map['date']);
        break;
      case RouterName.add_carbon_footprint:
        screen = BlocProvider(
            create: (_) => CarbonCubit(),
            child: const AddCarbonFootprintScreen());
        break;
      case RouterName.new_bank:
        final map = settings.arguments as Map;
        screen = NewBankScreen(
          accountTypes: map['account_types'] as List<DropdownDataModel>,
          bank: map['bank'],
        );
        break;
      case RouterName.new_equipment:
        final map = settings.arguments as Map;
        screen = NewEquipmentScreen(
          equipmentTypes: map['equipment_types'] as List<DropdownDataModel>,
          equipment: map['equipment'],
        );
        break;
      case RouterName.farm_land_plotting:
        var map = <String, dynamic>{};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        screen = AddFarmPlotting(
          points: map['points'] as List<LatLng>,
          isEnable: map['is_enable'] != null ? false : true,
        );
        break;
      case RouterName.distribution:
        screen = const ScreenDistribution();
        break;
      case RouterName.add_product_distribution:
        final argument = settings.arguments;
        if (argument is ArgumentAddProductDistribution) {
          screen = ScreenAddProduct(argument: argument);
        }
        break;
      case RouterName.add_distribution:
        screen = const ScreenAddDistribution();
        break;
      case RouterName.add_crop_harvest:
        final argument = settings.arguments;
        if (argument is ArgumentAddCropHardvest) {
          screen = ScreenAddCropHarvest(argument: argument);
        }
        break;
      case RouterName.crop_harvest:
        screen = const ScreenCropHarvest();
        break;
      case RouterName.procurement:
        screen = const ScreenProcurement();
        break;
      case RouterName.add_vendor_procurement:
        screen = const ScreenVendorProcurement();
        break;
      case RouterName.farmer_queries:
        screen = ScreenQueriesListing();
        break;
      case RouterName.add_farmer_queries:
        screen = const ScreenQueryCreate();
        break;
      case RouterName.add_pond_reg:
        screen = const PondRegScreen();
        break;
      case RouterName.add_pond_inspection:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        screen = PondInspectionScreen(
          crop: map['crop'],
          farmland: map['farmland'],
          farmer: map['farmer'],
        );
        break;
      case RouterName.add_species_info:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        final params = map['params'];
        screen = SpeciesInformation(params: params);
        break;
      case RouterName.add_feeding_info:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        final params = map['params'];
        screen = FeedingInformation(params: params);
        break;
      case RouterName.add_mortality_info:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        final params = map['params'];
        screen = MortalityInformation(params: params);
        break;
      case RouterName.add_check_fishing:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        final params = map['params'];
        screen = ScreenAddCheckFishing(params: params);
        break;
      case RouterName.add_water_quanlity_info:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        final params = map['params'];
        screen = WaterQualityInformation(params: params);
        break;
      case RouterName.add_stock_creation:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        final params = map['params'];
        screen = StockCreation(params: params);
        break;
      case RouterName.add_stock_transfer:
        Map<String, dynamic> map = {};
        if (settings.arguments != null) {
          map = settings.arguments as Map<String, dynamic>;
        }
        final params = map['params'];
        screen = StockTransfer(params: params);
        break;
      default:
    }
    return MaterialPageRoute(builder: (_) => screen);
  }
}

class RouterName {
  static const farmer_registration = '/farmer_registration';
  static const login = '/login';
  static const dashboard = '/dashboard';
  static const farmer_detail = '/farmer_detail';
  static const edit_farmer_profile = '/edit_farmer_profile';
  static const ekbTrainings = '/ekb-trainings';
  static const ekbFarmerVisits = '/ekb-farmer-visits';
  static const ekbSurveys = '/ekb-surveys';
  static const ekbLoans = '/ekb-loans';
  static const farmer_list = '/farmer_list';
  static const add_plot = '/add_plot';
  static const farm_land_plotting = '/farm_land_plotting';
  static const add_crop = '/add_crop';
  static const farmers_local = '/farmers_local';
  static const ponds_local = '/ponds_local';
  static const species_local = '/species_local';
  static const sync_from_local = '/sync_from_local';
  static const list_plots = '/list_plots';
  static const plot_detail = '/plot_detail';
  static const family_info = '/family_info';
  static const asset_info = '/asset_info';
  static const bank_info = '/bank_info';
  static const finance_info = '/finance_info';
  static const new_bank = '/new_bank';
  static const insurance_info = '/insurance_info';
  static const farm_equip = '/farm_equip';
  static const new_equipment = '/new_equipment';
  static const animal_husbandry = '/animal_husbandry';
  static const new_animal = '/new_animal';
  static const new_insurance = '/new_insurance';
  static const certificate_info = '/certificate_info';
  static const scan_qr = '/scan_qr';
  static const splash = '/splash';
  static const profile = '/profile';
  static const land_document = '/land_document';
  static const add_carbon_footprint = '/add_carbon_footprint';
  static const crop_detail = '/crop_detail';
  static const transaction_calendar = '/transaction_calendar';
  static const transaction_detail = '/transaction_detail';
  static const list_transaction = '/list_transaction';
  static const add_sale_intention = '/add_sale_intention';
  static const list_sale_intention = '/list_sale_intention';
  static const near_by_plot = '/near_by_plot';
  static const distribution = '/distribution';
  static const add_distribution = '/add_distribution';
  static const add_product_distribution = '/add_product_distribution';
  static const add_crop_harvest = '/add_crop_harverst';
  static const crop_harvest = '/crop_harverst';
  static const procurement = '/procurement';
  static const add_vendor_procurement = '/add_vendor_procurement';
  static const farmer_queries = '/farmer_queries';
  static const add_farmer_queries = '/add_farmer_queries';
  static const add_pond_reg = '/add_pond_reg';
  static const add_pond_inspection = '/add_pond_inspection';
  static const add_species_info = '/add_species_info';
  static const add_feeding_info = '/add_feeding_info';
  static const add_mortality_info = '/add_mortality_info';
  static const add_water_quanlity_info = '/add_water_quanlity_info';
  static const add_check_fishing = '/add_check_fishing';
  static const add_stock_creation = '/add_stock_creation';
  static const add_stock_transfer = '/add_stock_transfer';
}
