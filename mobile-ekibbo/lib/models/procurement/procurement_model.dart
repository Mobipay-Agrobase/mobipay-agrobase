// ignore_for_file: public_member_api_docs, sort_constructors_first

class MProcurementResponse {
  final List<MProcurement> procurements;
  final int total;
  final int currentPage;
  final int lastPage;
  MProcurementResponse({
    required this.procurements,
    required this.total,
    required this.currentPage,
    required this.lastPage,
  });

  factory MProcurementResponse.fromJson(Map<String, dynamic> json) {
    return MProcurementResponse(
      procurements: List<MProcurement>.from(
        ((json['data'] ?? []) as List<dynamic>).map<MProcurement>(
          (x) => MProcurement.fromJson(x as Map<String, dynamic>),
        ),
      ),
      total: json['total'] as int,
      currentPage: json['current_page'] as int,
      lastPage: json['last_page'] as int,
    );
  }
}

class MProcurement {
  final int id;
  final String transactionDate;
  final String procurementCode;
  final int bookingId;
  final int warehouseId;
  final int totalAmount;
  final int staffId;
  final double lat;
  final double lng;
  final MWarehouse warehouse;
  final MBooking booking;
  final List<MDetails> details;
  final List<MOtherCost> otherCosts;

  MProcurement({
    required this.id,
    required this.transactionDate,
    required this.procurementCode,
    required this.bookingId,
    required this.warehouseId,
    required this.totalAmount,
    required this.staffId,
    required this.lat,
    required this.lng,
    required this.warehouse,
    required this.booking,
    required this.details,
    required this.otherCosts,
  });

  factory MProcurement.fromJson(Map<String, dynamic> json) {
    return MProcurement(
      id: json['id'] ?? 0,
      transactionDate: json['transaction_date'] ?? '',
      procurementCode: json['procurement_code'] ?? '',
      bookingId: json['booking_id'] ?? 0,
      warehouseId: json['warehouse_id'] ?? 0,
      totalAmount: json['total_amount'] ?? 0,
      staffId: json['staff_id'] ?? 0,
      lat: json['lat'] ?? 0.0,
      lng: json['lng'] ?? 0.0,
      warehouse: MWarehouse?.fromJson(
          (json['warehouse'] ?? {}) as Map<String, dynamic>),
      booking:
          MBooking?.fromJson((json['booking'] ?? {}) as Map<String, dynamic>),
      details: json['details'] == null
          ? []
          : (json['details'] as List<dynamic>)
              .map((e) => MDetails.fromJson(e as Map<String, dynamic>))
              .toList(),
      otherCosts: json['other_costs'] == null
          ? []
          : (json['other_costs'] as List<dynamic>)
              .map((e) => MOtherCost.fromJson(e as Map<String, dynamic>))
              .toList(),
    );
  }
}

class MWarehouse {
  final int id;
  final int staffId;
  final String name;
  final String code;
  final int capacity;
  final String type;
  final double lat;
  final double lng;
  final String address;
  final String status;
  final String createdAt;
  final String updatedAt;

  MWarehouse({
    required this.id,
    required this.staffId,
    required this.name,
    required this.code,
    required this.capacity,
    required this.type,
    required this.lat,
    required this.lng,
    required this.address,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MWarehouse.fromJson(Map<String, dynamic> json) {
    return MWarehouse(
      id: json['id'] ?? 0,
      staffId: json['staff_id'] ?? 0,
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      capacity: json['capacity'] ?? 0,
      type: json['type'] ?? '',
      lat: json['lat'] ?? 0.0,
      lng: json['lng'] ?? 0.0,
      address: json['address'] ?? '',
      status: json['status'] ?? '',
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
    );
  }
}

class MBooking {
  final int id;
  final String bookingCode;
  final String bookingDate;
  final MVehicle vehicle;

  MBooking({
    required this.id,
    required this.bookingCode,
    required this.bookingDate,
    required this.vehicle,
  });

  factory MBooking.fromJson(Map<String, dynamic> json) {
    return MBooking(
      id: json['id'] ?? 0,
      bookingCode: json['booking_code'] ?? '',
      bookingDate: json['booking_date'] ?? '',
      vehicle:
          MVehicle?.fromJson((json['vehicle'] ?? {}) as Map<String, dynamic>),
    );
  }
}

class MDetails {
  final int id;
  final int procurementId;
  final int farmerId;
  final int cropHarvestDetailId;
  final int actualQty;
  final int actualSubTotal;
  final String createdAt;
  final String updatedAt;

  MDetails({
    required this.id,
    required this.procurementId,
    required this.farmerId,
    required this.cropHarvestDetailId,
    required this.actualQty,
    required this.actualSubTotal,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MDetails.fromJson(Map<String, dynamic> json) {
    return MDetails(
      id: json['id'] ?? 0,
      procurementId: json['procurement_id'] ?? 0,
      farmerId: json['farmer_id'] ?? 0,
      cropHarvestDetailId: json['crop_harvest_detail_id'] ?? 0,
      actualQty: json['actual_qty'] ?? 0,
      actualSubTotal: json['actual_sub_total'] ?? 0,
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
    );
  }
}

class MOtherCost {
  final int id;
  final String item;
  final int quantity;
  final int rate;
  final int subTotal;

  MOtherCost({
    required this.id,
    required this.item,
    required this.quantity,
    required this.rate,
    required this.subTotal,
  });

  factory MOtherCost.fromJson(Map<String, dynamic> json) {
    return MOtherCost(
      id: json['id'] ?? 0,
      item: json['item'] ?? '',
      quantity: json['quantity'] ?? 0,
      rate: json['rate'] ?? 0,
      subTotal: json['sub_total'] ?? 0,
    );
  }
}

class MVehicle {
  final int id;
  final int typeId;
  final String licenseNumber;
  final String driverName;
  final String driverPhoneNumber;
  final int capacity;
  final String status;
  final dynamic driverPhoto;
  final dynamic driverIdPhoto;
  final dynamic document;
  final dynamic createdAt;
  final String updatedAt;

  MVehicle({
    required this.id,
    required this.typeId,
    required this.licenseNumber,
    required this.driverName,
    required this.driverPhoneNumber,
    required this.capacity,
    required this.status,
    required this.driverPhoto,
    required this.driverIdPhoto,
    required this.document,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MVehicle.fromJson(Map<String, dynamic> json) {
    return MVehicle(
      id: json['id'] ?? 0,
      typeId: json['type_id'] ?? 0,
      licenseNumber: json['license_number'] ?? '',
      driverName: json['driver_name'] ?? '',
      driverPhoneNumber: json['driver_phone_number'] ?? '',
      capacity: json['capacity'] ?? 0,
      status: json['status'] ?? '',
      driverPhoto: json['driver_photo'] ?? null,
      driverIdPhoto: json['driver_id_photo'] ?? null,
      document: json['document'] ?? null,
      createdAt: json['created_at'] ?? null,
      updatedAt: json['updated_at'] ?? '',
    );
  }
}
