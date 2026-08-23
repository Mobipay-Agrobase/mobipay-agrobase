// ignore_for_file: public_member_api_docs, sort_constructors_first
class MProcurementRequest {
  final int warehouseId;
  final double lat;
  final double lng;
  final String bookingDate;
  final int vehicleId;
  final List<dynamic> procurementDetails;
  final List<dynamic> otherCosts;

  MProcurementRequest({
    required this.warehouseId,
    required this.lat,
    required this.lng,
    required this.bookingDate,
    required this.vehicleId,
    required this.procurementDetails,
    required this.otherCosts,
  });

  toMap() => {
        "warehouse_id": warehouseId,
        "lat": lat,
        "lng": lng,
        "booking_date": bookingDate,
        "vehicle_id": vehicleId,
        "procurement_details": procurementDetails,
        "other_costs": otherCosts
      };
}
