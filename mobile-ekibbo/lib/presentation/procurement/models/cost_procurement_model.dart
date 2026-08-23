// ignore_for_file: public_member_api_docs, sort_constructors_first
class MProcurementCost {
  int itemId;
  String itemName;
  double rate;
  double quantity;
  double subTotal;

  MProcurementCost({
    required this.itemId,
    required this.itemName,
    required this.rate,
    required this.quantity,
    required this.subTotal,
  });

  toMap() => {"item": itemName, "quantity": quantity, "rate": rate};
}
