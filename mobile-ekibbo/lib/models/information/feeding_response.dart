class FeedingInfoResponse {
  final num id;
  int feedingDate;
  num farmerId;
  num pondId;
  String typeOfFeed;
  String feederName;
  num approvedFeedMin;
  num approvedFeedMax;
  num feedGiven;
  String remark;
  String photo;
  String farmerName;
  String pondName;

  FeedingInfoResponse({
    required this.id,
    required this.feedingDate,
    required this.farmerId,
    required this.pondId,
    required this.typeOfFeed,
    required this.feederName,
    required this.approvedFeedMin,
    required this.approvedFeedMax,
    required this.feedGiven,
    required this.remark,
    required this.photo,
    this.farmerName = '',
    this.pondName = '',
  });

  factory FeedingInfoResponse.fromJson(Map<String, dynamic> json) {
    return FeedingInfoResponse(
      id: json['id'] ?? 0,
      feedingDate: json['feeding_date'] ?? 0,
      farmerId: json['farmer_id'] ?? 0,
      pondId: json['pond_id'] ?? 0,
      typeOfFeed: json['type_of_feed'] ?? '',
      feederName: json['feeder_name'] ?? '',
      approvedFeedMin: json['approved_feed_min'] ?? 0,
      approvedFeedMax: json['approved_feed_max'] ?? 0,
      feedGiven: json['feed_given'] ?? 0,
      remark: json['remark'] ?? '',
      photo: json['photo'] ?? '',
      farmerName: json['farmer_name'] ?? '',
      pondName: json['pond_name'] ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'feeding_date': feedingDate,
      'farmer_id': farmerId,
      'pond_id': pondId,
      'type_of_feed': typeOfFeed,
      'feeder_name': feederName,
      'approved_feed_min': approvedFeedMin,
      'approved_feed_max': approvedFeedMax,
      'feed_given': feedGiven,
      'remark': remark,
      'photo': photo,
    };
  }

  factory FeedingInfoResponse.copy(FeedingInfoResponse source) {
    return FeedingInfoResponse(
      id: source.id,
      feedingDate: source.feedingDate,
      farmerId: source.farmerId,
      pondId: source.pondId,
      typeOfFeed: source.typeOfFeed,
      feederName: source.feederName,
      approvedFeedMin: source.approvedFeedMin,
      approvedFeedMax: source.approvedFeedMax,
      feedGiven: source.feedGiven,
      remark: source.remark,
      photo: source.photo,
      farmerName: source.farmerName,
      pondName: source.pondName,
    );
  }
}
