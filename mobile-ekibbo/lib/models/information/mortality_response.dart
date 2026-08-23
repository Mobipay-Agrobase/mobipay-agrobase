class MortalitiesInfoResponse {
  final num id;
  int date;
  num farmerId;
  num pondId;
  num numberOfMortality;
  String comments;
  String photo;
  String farmerName;
  String pondName;

  MortalitiesInfoResponse({
    required this.id,
    required this.date,
    required this.farmerId,
    required this.pondId,
    required this.numberOfMortality,
    required this.comments,
    required this.photo,
    this.farmerName = '',
    this.pondName = '',
  });

  factory MortalitiesInfoResponse.fromJson(Map<String, dynamic> json) {
    return MortalitiesInfoResponse(
      id: json['id'] ?? 0,
      date: json['date'] ?? 0,
      farmerId: json['farmer_id'] ?? 0,
      pondId: json['pond_id'] ?? 0,
      numberOfMortality: json['number_of_mortality'] ?? 0,
      comments: json['comments'] ?? '',
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
      'number_of_mortality': numberOfMortality,
      'comments': comments,
      'photo': photo,
    };
  }

  factory MortalitiesInfoResponse.copy(MortalitiesInfoResponse source) {
    return MortalitiesInfoResponse(
      id: source.id,
      date: source.date,
      farmerId: source.farmerId,
      pondId: source.pondId,
      numberOfMortality: source.numberOfMortality,
      comments: source.comments,
      photo: source.photo,
      farmerName: source.farmerName,
      pondName: source.pondName,
    );
  }
}
