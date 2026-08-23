import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
part 'animal_husbandry_response.g.dart';

@JsonSerializable()
class AnimalHusbandryResponse {
  @JsonKey(name: 'data_farm_animal')
  List<DropdownDataModel>? dataFarmAnimal;
  @JsonKey(name: 'data_fodder')
  List<DropdownDataModel>? dataFodder;
  @JsonKey(name: 'data_animal_housing')
  List<DropdownDataModel>? dataAnimalHousing;
  @JsonKey(name: 'data_animal_for_growth')
  List<DropdownDataModel>? dataAnimalForGrowth;
  @JsonKey(name: 'animal_husbandry')
  List<AnimalHusbandryModel>? animalHusbandry;
  AnimalHusbandryResponse();
  factory AnimalHusbandryResponse.fromJson(Map<String, dynamic> json) =>
      _$AnimalHusbandryResponseFromJson(json);
}

@JsonSerializable()
class AnimalHusbandryModel {
  int? id;
  @JsonKey(name: 'farm_animal')
  String? farmAnimal;
  @JsonKey(name: 'animal_count')
  int? animalCount;
  String? fodder;
  @JsonKey(name: 'animal_housing')
  String? animalHousing;
  double? revenue;
  @JsonKey(name: 'breed_name')
  String? breedName;
  @JsonKey(name: 'animal_for_growth')
  String? animalForGrowth;

  AnimalHusbandryModel();
  factory AnimalHusbandryModel.fromJson(Map<String, dynamic> json) =>
      _$AnimalHusbandryModelFromJson(json);
  Map<String, dynamic> toJson() => _$AnimalHusbandryModelToJson(this);
}
