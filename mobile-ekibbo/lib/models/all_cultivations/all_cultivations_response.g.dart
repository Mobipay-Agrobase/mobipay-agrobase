// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'all_cultivations_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AllCutivationResponse _$AllCutivationResponseFromJson(
        Map<String, dynamic> json) =>
    AllCutivationResponse()
      ..cultivation = (json['cultivation'] as List<dynamic>?)
          ?.map((e) => CultivationModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$AllCutivationResponseToJson(
        AllCutivationResponse instance) =>
    <String, dynamic>{
      'cultivation': instance.cultivation,
    };
