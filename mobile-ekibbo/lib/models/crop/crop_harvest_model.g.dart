// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'crop_harvest_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MCropHarvest _$MCropHarvestFromJson(Map<String, dynamic> json) => MCropHarvest(
      id: json['id'] as int? ?? 0,
      cropHarvestCode: json['crop_harvest_code'] as String? ?? '',
      variety: json['variety'] as String? ?? '',
      crop: json['crop'] as String? ?? '',
      subTotal: (json['sub_total'] as num?)?.toDouble() ?? 0,
      pricePerUnit: (json['price_per_unit'] as num?)?.toDouble() ?? 0,
      loanAmount: (json['loan_amount'] as num?)?.toDouble() ?? 0,
      approxHarvestQty: (json['approx_harvest_qty'] as num?)?.toDouble() ?? 0,
      farmerName: json['farmer_name'] as String? ?? '',
      harvestDate: json['harvest_date'] as String? ?? '',
    )
      ..actualQty = (json['actualQty'] as num).toDouble()
      ..farmerPayment = (json['farmerPayment'] as num).toDouble();

Map<String, dynamic> _$MCropHarvestToJson(MCropHarvest instance) =>
    <String, dynamic>{
      'id': instance.id,
      'crop_harvest_code': instance.cropHarvestCode,
      'variety': instance.variety,
      'crop': instance.crop,
      'sub_total': instance.subTotal,
      'price_per_unit': instance.pricePerUnit,
      'loan_amount': instance.loanAmount,
      'approx_harvest_qty': instance.approxHarvestQty,
      'farmer_name': instance.farmerName,
      'harvest_date': instance.harvestDate,
      'actualQty': instance.actualQty,
      'farmerPayment': instance.farmerPayment,
    };
