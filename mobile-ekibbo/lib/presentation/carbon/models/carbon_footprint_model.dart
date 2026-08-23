enum CarbonFootprintType {
  generalInfo,
  cropEstab,
  waterSoilMangement,
  fertilizerMechanization,
  harvestStraw,
  dryingStoring,
  millingPackaging,
  transportation,
  sale
}

extension ExtCarbonFootprintType on CarbonFootprintType {
  String get title {
    switch (this) {
      case CarbonFootprintType.generalInfo:
        return 'General information';
      case CarbonFootprintType.cropEstab:
        return 'Crop establishment';
      case CarbonFootprintType.waterSoilMangement:
        return 'Water/Soil management';
      case CarbonFootprintType.fertilizerMechanization:
        return 'Fertilizer & Mechanization';
      case CarbonFootprintType.harvestStraw:
        return 'Harvest & Straw';
      case CarbonFootprintType.dryingStoring:
        return 'Drying & Storing';
      case CarbonFootprintType.millingPackaging:
        return 'Milling & Packaging';
      case CarbonFootprintType.transportation:
        return 'Transportation';
      case CarbonFootprintType.sale:
        return 'Sale';
    }
  }
}
