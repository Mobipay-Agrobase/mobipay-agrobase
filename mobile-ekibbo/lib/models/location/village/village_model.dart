/// Village from the Agrobase Location Master (SubCounty > Parish > Village).
/// Shape matches GET /api/mobile/ekibbo-geo?type=village&parentId=<subcounty>
class VillageModel {
  int? id;
  String? villageName;

  VillageModel({this.id, this.villageName});

  factory VillageModel.fromJson(Map<String, dynamic> json) => VillageModel(
        id: json['id'],
        villageName: json['village_name'],
      );
}
