class StockTransferResponse {
  final num id;
  int transferDate;
  num creationId;
  String batchId;
  num farmerId;
  num pondId;
  num availableWeight;
  num speciesCount;
  String destinationPond;
  num numberOfFishesTransfered;
  String photo;
  String remarks;
  String farmerName;
  String pondName;

  StockTransferResponse({
    required this.id,
    required this.transferDate,
    required this.creationId,
    required this.batchId,
    required this.farmerId,
    required this.pondId,
    required this.availableWeight,
    required this.speciesCount,
    required this.destinationPond,
    required this.numberOfFishesTransfered,
    required this.photo,
    required this.remarks,
    this.farmerName = '',
    this.pondName = '',
  });

  factory StockTransferResponse.fromJson(Map<String, dynamic> json) {
    return StockTransferResponse(
      id: json['id'] ?? 0,
      transferDate: json['transfer_date'] ?? 0,
      creationId: json['creation_id'] ?? 0,
      batchId: json['batch_id'] ?? '',
      farmerId: json['farmer_id'] ?? 0,
      pondId: json['pond_id'] ?? 0,
      availableWeight: json['available_weight'] ?? 0,
      speciesCount: json['species_count'] ?? 0,
      destinationPond: json['destination_pond'] ?? '',
      numberOfFishesTransfered: json['number_of_fishes_transfered'] ?? 0,
      photo: json['photo'] ?? '',
      remarks: json['remarks'] ?? '',
      farmerName: json['farmer_name'] ?? '',
      pondName: json['pond_name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transfer_date': transferDate,
      'creation_id': creationId,
      'destination_pond': destinationPond,
      'number_of_fishes_transfered': numberOfFishesTransfered,
      'photo': photo,
      'remarks': remarks,
    };
  }

  factory StockTransferResponse.copy(StockTransferResponse source) {
    return StockTransferResponse(
      id: source.id,
      transferDate: source.transferDate,
      creationId: source.creationId,
      batchId: source.batchId,
      farmerId: source.farmerId,
      pondId: source.pondId,
      availableWeight: source.availableWeight,
      speciesCount: source.speciesCount,
      destinationPond: source.destinationPond,
      numberOfFishesTransfered: source.numberOfFishesTransfered,
      photo: source.photo,
      remarks: source.remarks,
      farmerName: source.farmerName,
      pondName: source.pondName,
    );
  }
}
