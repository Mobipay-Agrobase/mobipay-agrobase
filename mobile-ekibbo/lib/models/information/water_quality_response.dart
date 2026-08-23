class WaterQualityInfoResponse {
  final num id;
  int date;
  num farmerId;
  num pondId;
  num temperature;
  num o2Surface;
  num o2Depth;
  num salinity;
  num ph;
  num ammonia;
  num nitrites;
  num nitrates;
  String remark;
  String photo;
  String farmerName;
  String pondName;

  WaterQualityInfoResponse({
    required this.id,
    required this.date,
    required this.farmerId,
    required this.pondId,
    required this.temperature,
    required this.o2Surface,
    required this.o2Depth,
    required this.salinity,
    required this.ph,
    required this.ammonia,
    required this.nitrites,
    required this.nitrates,
    required this.remark,
    required this.photo,
    this.farmerName = '',
    this.pondName = '',
  });

  factory WaterQualityInfoResponse.fromJson(Map<String, dynamic> json) {
    return WaterQualityInfoResponse(
      id: json['id'] ?? 0,
      date: json['date'] ?? 0,
      farmerId: json['farmer_id'] ?? 0,
      pondId: json['pond_id'] ?? 0,
      temperature: json['temperature'] ?? 0,
      o2Surface: json['o2_surface'] ?? 0,
      o2Depth: json['o2_depth'] ?? 0,
      salinity: json['salinity'] ?? 0,
      ph: json['ph'] ?? 0,
      ammonia: json['ammonia'] ?? 0,
      nitrites: json['nitrites'] ?? 0,
      nitrates: json['nitrates'] ?? 0,
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
      'temperature': temperature,
      'o2_surface': o2Surface,
      'o2_depth': o2Depth,
      'salinity': salinity,
      'ph': ph,
      'ammonia': ammonia,
      'nitrites': nitrites,
      'nitrates': nitrates,
      'remark': remark,
      'photo': photo,
    };
  }

  factory WaterQualityInfoResponse.copy(WaterQualityInfoResponse source) {
    return WaterQualityInfoResponse(
      id: source.id,
      date: source.date,
      farmerId: source.farmerId,
      pondId: source.pondId,
      temperature: source.temperature,
      o2Surface: source.o2Surface,
      o2Depth: source.o2Depth,
      salinity: source.salinity,
      ph: source.ph,
      ammonia: source.ammonia,
      nitrites: source.nitrites,
      nitrates: source.nitrates,
      remark: source.remark,
      photo: source.photo,
      farmerName: source.farmerName,
      pondName: source.pondName,
    );
  }
}
