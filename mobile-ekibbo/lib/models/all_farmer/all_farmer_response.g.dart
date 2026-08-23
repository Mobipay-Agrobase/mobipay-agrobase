// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'all_farmer_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AllFarmerResponse _$AllFarmerResponseFromJson(Map<String, dynamic> json) =>
    AllFarmerResponse()
      ..farmerData = json['farmer_data'] == null
          ? null
          : AllFarmerDataModel.fromJson(
              json['farmer_data'] as Map<String, dynamic>);

Map<String, dynamic> _$AllFarmerResponseToJson(AllFarmerResponse instance) =>
    <String, dynamic>{
      'farmer_data': instance.farmerData,
    };

AllFarmerDataModel _$AllFarmerDataModelFromJson(Map<String, dynamic> json) =>
    AllFarmerDataModel()
      ..data = (json['data'] as List<dynamic>?)
          ?.map((e) => FarmerModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..currentPage = json['current_page'] as int?
      ..lastPage = json['last_page'] as int?;

Map<String, dynamic> _$AllFarmerDataModelToJson(AllFarmerDataModel instance) =>
    <String, dynamic>{
      'data': instance.data,
      'current_page': instance.currentPage,
      'last_page': instance.lastPage,
    };
