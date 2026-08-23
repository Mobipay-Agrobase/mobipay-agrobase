import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/asset_info/asset_info_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';

part 'asset_info_response.g.dart';

@JsonSerializable()
class AssetInfoResponse {
  @JsonKey(name: 'data_housing_owner')
  List<DropdownDataModel>? dataHousingOwner;
  @JsonKey(name: 'data_house_type')
  List<DropdownDataModel>? dataHouseType;
  @JsonKey(name: 'data_consumer_electronic')
  List<DropdownDataModel>? dataConsumerElectronic;
  @JsonKey(name: 'data_vehicle')
  List<DropdownDataModel>? dataVehicle;
  @JsonKey(name: 'asset_info')
  AssetInfoModel? assetInfo;

  AssetInfoResponse();
  factory AssetInfoResponse.fromJson(Map<String, dynamic> json) =>
      _$AssetInfoResponseFromJson(json);
}
