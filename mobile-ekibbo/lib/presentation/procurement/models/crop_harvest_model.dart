// ignore_for_file: public_member_api_docs, sort_constructors_first
class MCropHarvest {
  int cropId;
  String cropName;
  int cultivationId;
  String cultivationName;
  double cultivatedArea;
  String subTotal;
  double quantity;
  double pricePerUnit;

  MCropHarvest({
    required this.cropId,
    required this.cropName,
    required this.cultivationId,
    required this.cultivationName,
    required this.cultivatedArea,
    required this.subTotal,
    required this.quantity,
    required this.pricePerUnit,
  });

  toMap() => {
        "cultivation_id": cultivationId,
        "approx_harvest_qty": quantity,
        "price_per_unit": pricePerUnit
      };
}
