// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sale_intention_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SaleIntentionResponse _$SaleIntentionResponseFromJson(
        Map<String, dynamic> json) =>
    SaleIntentionResponse()
      ..dataSaleIntention = (json['data_sale_intention'] as List<dynamic>?)
          ?.map((e) => SaleIntentionModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$SaleIntentionResponseToJson(
        SaleIntentionResponse instance) =>
    <String, dynamic>{
      'data_sale_intention': instance.dataSaleIntention,
    };

SaleIntentionModel _$SaleIntentionModelFromJson(Map<String, dynamic> json) =>
    SaleIntentionModel()
      ..id = json['id'] as int?
      ..createdAt = json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String)
      ..farmer = json['farmer'] == null
          ? null
          : FarmerModel.fromJson(json['farmer'] as Map<String, dynamic>)
      ..variety = json['variety'] as String?
      ..farmLand = json['farm_land'] == null
          ? null
          : FarmLandModel.fromJson(json['farm_land'] as Map<String, dynamic>)
      ..cultivation = json['cultivation'] == null
          ? null
          : CultivationModel.fromJson(
              json['cultivation'] as Map<String, dynamic>)
      ..season = json['season'] == null
          ? null
          : SeasonModel.fromJson(json['season'] as Map<String, dynamic>)
      ..productId = json['product_id'] as String?
      ..dateForHarvest = json['date_for_harvest'] as String?
      ..aviableDate = json['aviable_date'] as String?
      ..minPrice = (json['min_price'] as num?)?.toDouble()
      ..maxPrice = (json['max_price'] as num?)?.toDouble()
      ..grade = json['grade'] as String?
      ..ageOfCrop = json['age_of_crop'] as String?
      ..qualityCheck = json['quality_check'] as String?
      ..quantity = (json['quantity'] as num?)?.toDouble()
      ..photo = json['photo'] as String?
      ..preHarvestQC = (json['pre_harvest_qc'] as List<dynamic>?)
              ?.map((e) => MPreHarvestQC.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];

Map<String, dynamic> _$SaleIntentionModelToJson(SaleIntentionModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'created_at': instance.createdAt?.toIso8601String(),
      'farmer': instance.farmer,
      'variety': instance.variety,
      'farm_land': instance.farmLand,
      'cultivation': instance.cultivation,
      'season': instance.season,
      'product_id': instance.productId,
      'date_for_harvest': instance.dateForHarvest,
      'aviable_date': instance.aviableDate,
      'min_price': instance.minPrice,
      'max_price': instance.maxPrice,
      'grade': instance.grade,
      'age_of_crop': instance.ageOfCrop,
      'quality_check': instance.qualityCheck,
      'quantity': instance.quantity,
      'photo': instance.photo,
      'pre_harvest_qc': instance.preHarvestQC,
    };
