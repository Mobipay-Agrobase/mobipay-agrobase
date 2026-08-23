class CheckFishingResponse {
  final num id;
  int date;
  num farmerId;
  num pondId;
  String typesOfCheckFishing;
  String simpleId;
  num weight;
  num number;
  String remark;
  String photo;
  String farmerName;
  String pondName;

  CheckFishingResponse({
    required this.id,
    required this.date,
    required this.farmerId,
    required this.pondId,
    required this.typesOfCheckFishing,
    required this.simpleId,
    required this.weight,
    required this.number,
    required this.remark,
    required this.photo,
    this.farmerName = '',
    this.pondName = '',
  });

  factory CheckFishingResponse.fromJson(Map<String, dynamic> json) {
    return CheckFishingResponse(
      id: json['id'] ?? 0,
      date: json['date'] ?? 0,
      farmerId: json['farmer_id'] ?? 0,
      pondId: json['pond_id'] ?? 0,
      typesOfCheckFishing: json['types_of_check_fishing'] ?? '',
      simpleId: json['simple_id'] ?? '',
      weight: json['weight'] ?? 0,
      number: json['number'] ?? 0,
      remark: json['remark'] ?? '',
      photo: json['photo'] ?? '',
      farmerName: json['farmer_name'] ?? '',
      pondName: json['pond_name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date,
      'farmer_id': farmerId,
      'pond_id': pondId,
      'types_of_check_fishing': typesOfCheckFishing,
      'simple_id': simpleId,
      'weight': weight,
      'number': number,
      'remark': remark,
      'photo': photo,
    };
  }

  factory CheckFishingResponse.copy(CheckFishingResponse source) {
    return CheckFishingResponse(
      id: source.id,
      date: source.date,
      farmerId: source.farmerId,
      pondId: source.pondId,
      typesOfCheckFishing: source.typesOfCheckFishing,
      simpleId: source.simpleId,
      weight: source.weight,
      number: source.number,
      remark: source.remark,
      photo: source.photo,
      farmerName: source.farmerName,
      pondName: source.pondName,
    );
  }
}
