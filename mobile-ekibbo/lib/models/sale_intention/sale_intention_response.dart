import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
part 'sale_intention_response.g.dart';

@JsonSerializable()
class SaleIntentionResponse {
  @JsonKey(name: 'data_sale_intention')
  List<SaleIntentionModel>? dataSaleIntention;

  SaleIntentionResponse();

  factory SaleIntentionResponse.fromJson(Map<String, dynamic> json) =>
      _$SaleIntentionResponseFromJson(json);
}

@JsonSerializable()
class SaleIntentionModel {
  int? id;
  @JsonKey(name: 'created_at')
  DateTime? createdAt;
  FarmerModel? farmer;
  String? variety;
  @JsonKey(name: 'farm_land')
  FarmLandModel? farmLand;
  CultivationModel? cultivation;
  SeasonModel? season;
  @JsonKey(name: 'product_id')
  String? productId;
  @JsonKey(name: 'date_for_harvest')
  String? dateForHarvest;
  @JsonKey(name: 'aviable_date')
  String? aviableDate;
  @JsonKey(name: 'min_price')
  double? minPrice;
  @JsonKey(name: 'max_price')
  double? maxPrice;
  String? grade;
  @JsonKey(name: 'age_of_crop')
  String? ageOfCrop;
  @JsonKey(name: 'quality_check')
  String? qualityCheck;
  double? quantity;
  String? photo;
  @JsonKey(name: 'pre_harvest_qc', defaultValue: [])
  List<MPreHarvestQC>? preHarvestQC;
  SaleIntentionModel();
  factory SaleIntentionModel.fromJson(Map<String, dynamic> json) =>
      _$SaleIntentionModelFromJson(json);
}
