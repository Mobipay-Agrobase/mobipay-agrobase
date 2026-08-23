import 'package:json_annotation/json_annotation.dart';
part 'asset_info_model.g.dart';

@JsonSerializable()
class AssetInfoModel {
  int? id;
  @JsonKey(name: 'farmer_id')
  int? farmerId;
  @JsonKey(name: 'housing_ownership')
  String? housingOwnership;
  @JsonKey(name: 'house_type')
  String? houseType;
  @JsonKey(name: 'consumer_electronic')
  String? consumerElectronic;
  @JsonKey(name: 'vehicle')
  String? vehicle;
  AssetInfoModel();

  factory AssetInfoModel.fromJson(Map<String, dynamic> json) =>
      _$AssetInfoModelFromJson(json);
}
