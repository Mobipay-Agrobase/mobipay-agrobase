// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'srp_schedule_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SRPActionModel _$SRPActionModelFromJson(Map<String, dynamic> json) =>
    SRPActionModel()
      ..id = json['id'] as int?
      ..srp_id = json['srp_id'] as int?
      ..name_action = json['name_action'] as String?
      ..date_action = json['date_action'] == null
          ? null
          : DateTime.parse(json['date_action'] as String)
      ..srp = json['srp'] == null
          ? null
          : SrpScheduleModel.fromJson(json['srp'] as Map<String, dynamic>)
      ..is_finished = json['is_finished'] as int?
      ..score = json['score'] as int?;

Map<String, dynamic> _$SRPActionModelToJson(SRPActionModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'srp_id': instance.srp_id,
      'name_action': instance.name_action,
      'date_action': instance.date_action?.toIso8601String(),
      'srp': instance.srp,
      'is_finished': instance.is_finished,
      'score': instance.score,
    };

SrpScheduleModel _$SrpScheduleModelFromJson(Map<String, dynamic> json) =>
    SrpScheduleModel()
      ..id = json['id'] as int?
      ..date =
          json['date'] == null ? null : DateTime.parse(json['date'] as String)
      ..status = json['status'] as int?
      ..farmer_id = json['farmer_id'] as int?
      ..cultivation_id = json['cultivation_id'] as int?
      ..score = json['score'] as int?
      ..sowing_date = json['sowing_date'] as String?
      ..season_id = json['season_id'] as int?
      ..farmer = json['farmer_name'] == null
          ? null
          : MSrpFarmer.fromJson(json['farmer_name'] as Map<String, dynamic>)
      ..cultivation = json['cultivation'] == null
          ? null
          : CultivationModel.fromJson(
              json['cultivation'] as Map<String, dynamic>)
      ..season = json['season'] as String?;

Map<String, dynamic> _$SrpScheduleModelToJson(SrpScheduleModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'date': instance.date?.toIso8601String(),
      'status': instance.status,
      'farmer_id': instance.farmer_id,
      'cultivation_id': instance.cultivation_id,
      'score': instance.score,
      'sowing_date': instance.sowing_date,
      'season_id': instance.season_id,
      'farmer_name': instance.farmer,
      'cultivation': instance.cultivation,
      'season': instance.season,
    };
