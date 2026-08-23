class StockCreationResponse {
  final num id;
  int transactionDate;
  num speciesInfoId;
  num farmerId;
  num pondId;
  num totalPondArea;
  num speciesCount;
  int dateOfAddingSpecies;
  String batchId;
  num avgWeight;
  String remarks;
  String photo;
  String farmerName;
  String pondName;
  String speciesName;

  StockCreationResponse({
    required this.id,
    required this.transactionDate,
    required this.speciesInfoId,
    required this.farmerId,
    required this.pondId,
    required this.totalPondArea,
    required this.speciesCount,
    required this.dateOfAddingSpecies,
    required this.batchId,
    required this.avgWeight,
    required this.remarks,
    required this.photo,
    this.farmerName = '',
    this.pondName = '',
    this.speciesName = '',
  });

  factory StockCreationResponse.fromJson(Map<String, dynamic> json) {
    return StockCreationResponse(
      id: json['id'] ?? 0,
      transactionDate: json['transaction_date'] ?? 0,
      speciesInfoId: json['species_info_id'] ?? 0,
      farmerId: json['farmer_id'] ?? 0,
      pondId: json['pond_id'] ?? 0,
      totalPondArea: json['total_pond_area'] ?? 0,
      speciesCount: json['species_count'] ?? 0,
      dateOfAddingSpecies: json['date_of_adding_species'] ?? 0,
      batchId: json['batch_id'] ?? '',
      avgWeight: json['avg_weight'] ?? 0,
      remarks: json['remarks'] ?? '',
      photo: json['photo'] ?? '',
      farmerName: json['farmer_name'] ?? '',
      pondName: json['pond_name'] ?? '',
      speciesName: json['species_name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transaction_date': transactionDate,
      'species_info_id': speciesInfoId,
      'avg_weight': avgWeight,
      'remarks': remarks,
      'photo': photo,
    };
  }

  factory StockCreationResponse.copy(StockCreationResponse source) {
    return StockCreationResponse(
      id: source.id,
      transactionDate: source.transactionDate,
      speciesInfoId: source.speciesInfoId,
      farmerId: source.farmerId,
      pondId: source.pondId,
      totalPondArea: source.totalPondArea,
      speciesCount: source.speciesCount,
      dateOfAddingSpecies: source.dateOfAddingSpecies,
      batchId: source.batchId,
      avgWeight: source.avgWeight,
      remarks: source.remarks,
      photo: source.photo,
      farmerName: source.farmerName,
      pondName: source.pondName,
      speciesName: source.speciesName,
    );
  }
}
