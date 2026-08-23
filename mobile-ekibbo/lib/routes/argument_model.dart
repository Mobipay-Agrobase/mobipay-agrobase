import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/models/distribution/model_product.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/cost_procurement_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/crop_harvest_model.dart';

class ArgumentAddCropHardvest {
  final int seasonId;
  final int farmlandId;
  final int cultivationId;
  final double actualArea;
  final List<MCropHarvest> cropHarvests;
  final List<DropdownMasterModel> cropInformations;

  ArgumentAddCropHardvest({
    required this.seasonId,
    required this.farmlandId,
    required this.cultivationId,
    required this.actualArea,
    required this.cropHarvests,
    required this.cropInformations,
  });
}

class ArgumentScreenSearchFarmer {
  String farmerSelected;
  String farmerPhone;
  int farmerId;
  int cooperativeId;
  int provinceId;
  int communeId;
  int hasData;
  ArgumentScreenSearchFarmer({
    this.farmerSelected = '',
    this.farmerPhone = '',
    this.farmerId = 0,
    this.cooperativeId = 0,
    this.provinceId = 0,
    this.communeId = 0,
    this.hasData = 0,
  });
}

class ArgumentAddCostProcurement {
  List<MProcurementCost> costProcurements;
  int itemId;

  ArgumentAddCostProcurement({
    required this.itemId,
    required this.costProcurements,
  });
}

class ArgumentAddProductDistribution {
  int cooperativeId;
  int farmerId;
  int stockId;
  bool isStockNotEnough;
  List<MProductItem> products;

  ArgumentAddProductDistribution({
    this.cooperativeId = 0,
    this.farmerId = 0,
    this.stockId = 0,
    this.isStockNotEnough = false,
    required this.products,
  });
}

class ArgumentGotoProfile {
  int id;
  EnumUserRole role;

  ArgumentGotoProfile({
    required this.id,
    required this.role,
  });
}
