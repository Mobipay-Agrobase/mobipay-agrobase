import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
part 'farm_equipment_response.g.dart';

@JsonSerializable()
class FarmEquipmentResponse {
  @JsonKey(name: 'data_farm_equipment')
  List<DropdownDataModel>? dataFarmEquipment;
  @JsonKey(name: 'farm_equipment')
  List<FarmEquipmentModel>? farmEquipment;
  FarmEquipmentResponse();

  factory FarmEquipmentResponse.fromJson(Map<String, dynamic> json) =>
      _$FarmEquipmentResponseFromJson(json);
}

@JsonSerializable()
class FarmEquipmentModel {
  int? id;
  @JsonKey(name: 'farm_equipment_items')
  String? farmEquipmentItems;
  @JsonKey(name: 'farm_equipment_items_count')
  int? farmEquipmentItemsCount;
  @JsonKey(name: 'year_of_manufacture')
  int? yearOfManufacture;
  @JsonKey(name: 'year_of_purchase')
  int? yearOfPurchase;
  FarmEquipmentModel();
  factory FarmEquipmentModel.fromJson(Map<String, dynamic> json) =>
      _$FarmEquipmentModelFromJson(json);
  Map<String, dynamic> toJson() => _$FarmEquipmentModelToJson(this);
}
