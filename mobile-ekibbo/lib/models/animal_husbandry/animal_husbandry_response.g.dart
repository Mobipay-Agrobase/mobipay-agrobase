// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'animal_husbandry_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AnimalHusbandryResponse _$AnimalHusbandryResponseFromJson(
        Map<String, dynamic> json) =>
    AnimalHusbandryResponse()
      ..dataFarmAnimal = (json['data_farm_animal'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataFodder = (json['data_fodder'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataAnimalHousing = (json['data_animal_housing'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataAnimalForGrowth = (json['data_animal_for_growth'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..animalHusbandry = (json['animal_husbandry'] as List<dynamic>?)
          ?.map((e) => AnimalHusbandryModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$AnimalHusbandryResponseToJson(
        AnimalHusbandryResponse instance) =>
    <String, dynamic>{
      'data_farm_animal': instance.dataFarmAnimal,
      'data_fodder': instance.dataFodder,
      'data_animal_housing': instance.dataAnimalHousing,
      'data_animal_for_growth': instance.dataAnimalForGrowth,
      'animal_husbandry': instance.animalHusbandry,
    };

AnimalHusbandryModel _$AnimalHusbandryModelFromJson(
        Map<String, dynamic> json) =>
    AnimalHusbandryModel()
      ..id = json['id'] as int?
      ..farmAnimal = json['farm_animal'] as String?
      ..animalCount = json['animal_count'] as int?
      ..fodder = json['fodder'] as String?
      ..animalHousing = json['animal_housing'] as String?
      ..revenue = (json['revenue'] as num?)?.toDouble()
      ..breedName = json['breed_name'] as String?
      ..animalForGrowth = json['animal_for_growth'] as String?;

Map<String, dynamic> _$AnimalHusbandryModelToJson(
        AnimalHusbandryModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'farm_animal': instance.farmAnimal,
      'animal_count': instance.animalCount,
      'fodder': instance.fodder,
      'animal_housing': instance.animalHousing,
      'revenue': instance.revenue,
      'breed_name': instance.breedName,
      'animal_for_growth': instance.animalForGrowth,
    };
