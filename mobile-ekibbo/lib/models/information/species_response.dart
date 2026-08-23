class SpeciesInfoResponse {
  num id;
  num farmerId;
  num pondId;
  num speciesId;
  num varietyId;
  int dateOfAdding;
  num speciesCount;
  num expectedHarvestQty;
  String photo;
  String farmerName;
  String pondName;
  String speciesName;
  String speciesVarietyName;

  String tag = '';

  SpeciesInfoResponse({
    required this.id,
    required this.farmerId,
    required this.pondId,
    required this.speciesId,
    required this.varietyId,
    required this.dateOfAdding,
    required this.speciesCount,
    required this.expectedHarvestQty,
    required this.photo,
    this.farmerName = '',
    this.pondName = '',
    this.speciesName = '',
    this.speciesVarietyName = '',
  });

  factory SpeciesInfoResponse.fromJson(Map<String, dynamic> json) {
    return SpeciesInfoResponse(
      id: json['id'] ?? 0,
      farmerId: json['farmer_id'] ?? 0,
      pondId: json['pond_id'] ?? 0,
      speciesId: json['species_id'] ?? 0,
      varietyId: json['species_variety_id'] ?? 0,
      dateOfAdding:
          json['date_of_adding'] ?? DateTime.now().millisecondsSinceEpoch,
      speciesCount: json['species_count'] ?? 0,
      expectedHarvestQty: json['expected_harvest_qty'] ?? 0,
      photo: json['photo'] ?? '',
      farmerName: json['farmer_name'] ?? '',
      pondName: json['pond_name'] ?? '',
      speciesName: json['species_name'] ?? '',
      speciesVarietyName: json['species_variety_name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'farmer_id': farmerId,
      'pond_id': pondId,
      'species_id': speciesId,
      'species_variety_id': varietyId,
      'date_of_adding': dateOfAdding,
      'species_count': speciesCount,
      'expected_harvest_qty': expectedHarvestQty,
      'photo': photo,
      'tag': tag,
      'farmer_name': farmerName,
      'pond_name': pondName,
      'species_name': speciesName,
      'species_variety_name': speciesVarietyName,
    };
  }

  factory SpeciesInfoResponse.copy(SpeciesInfoResponse source) {
    return SpeciesInfoResponse(
      id: source.id,
      farmerId: source.farmerId,
      pondId: source.pondId,
      speciesId: source.speciesId,
      varietyId: source.varietyId,
      dateOfAdding: source.dateOfAdding,
      speciesCount: source.speciesCount,
      expectedHarvestQty: source.expectedHarvestQty,
      photo: source.photo,
      farmerName: source.farmerName,
      pondName: source.pondName,
      speciesName: source.speciesName,
      speciesVarietyName: source.speciesVarietyName,
    );
  }
}
