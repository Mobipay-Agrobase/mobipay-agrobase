// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'insurance_info_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InsuranceInfoResponse _$InsuranceInfoResponseFromJson(
        Map<String, dynamic> json) =>
    InsuranceInfoResponse()
      ..insuranceInfo = (json['insurance_info'] as List<dynamic>?)
          ?.map((e) => InsuranceInfoModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataCrop = (json['data_crop'] as List<dynamic>?)
          ?.map((e) => DropdownMasterModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$InsuranceInfoResponseToJson(
        InsuranceInfoResponse instance) =>
    <String, dynamic>{
      'insurance_info': instance.insuranceInfo,
      'data_crop': instance.dataCrop,
    };

InsuranceInfoModel _$InsuranceInfoModelFromJson(Map<String, dynamic> json) =>
    InsuranceInfoModel()
      ..id = json['id'] as int?
      ..lifeInsurance = json['life_insurance'] as String?
      ..providerLifeInsurance = json['provider_life_insurance'] as String?
      ..lifeInsuranceAmount =
          (json['life_insurance_amount'] as num?)?.toDouble()
      ..lifeInsuranceEnrolledDate =
          json['life_insurance_enrolled_date'] as String?
      ..lifeInsuranceEndDate = json['life_insurance_end_date'] as String?
      ..healthInsurance = json['health_insurance'] as String?
      ..providerHealthInsurance = json['provider_health_insurance'] as String?
      ..healthInsuranceAmount =
          (json['health_insurance_amount'] as num?)?.toDouble()
      ..healthInsuranceEnrolledDate =
          json['health_insurance_enrolled_date'] as String?
      ..healthInsuranceEndDate = json['health_insurance_end_date'] as String?
      ..cropInsurance = json['crop_insurance'] as String?
      ..providerCropInsurance = json['provider_crop_insurance'] as String?
      ..cropInsured = json['crop_insured'] as String?
      ..noOfAreaInsured = (json['no_of_area_insured'] as num?)?.toDouble()
      ..cropInsuranceEnrolledDate =
          json['crop_insurance_enrolled_date'] as String?
      ..cropInsuranceEndDate = json['crop_insurance_end_date'] as String?
      ..socialInsurance = json['social_insurance'] as String?
      ..providerSocialInsurance = json['provider_social_insurance'] as String?
      ..socialInsuranceEnrolledDate =
          json['social_insurance_enrolled_date'] as String?
      ..socialInsuranceEndDate = json['social_insurance_end_date'] as String?
      ..otherInsurance = json['other_insurance'] as String?;

Map<String, dynamic> _$InsuranceInfoModelToJson(InsuranceInfoModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'life_insurance': instance.lifeInsurance,
      'provider_life_insurance': instance.providerLifeInsurance,
      'life_insurance_amount': instance.lifeInsuranceAmount,
      'life_insurance_enrolled_date': instance.lifeInsuranceEnrolledDate,
      'life_insurance_end_date': instance.lifeInsuranceEndDate,
      'health_insurance': instance.healthInsurance,
      'provider_health_insurance': instance.providerHealthInsurance,
      'health_insurance_amount': instance.healthInsuranceAmount,
      'health_insurance_enrolled_date': instance.healthInsuranceEnrolledDate,
      'health_insurance_end_date': instance.healthInsuranceEndDate,
      'crop_insurance': instance.cropInsurance,
      'provider_crop_insurance': instance.providerCropInsurance,
      'crop_insured': instance.cropInsured,
      'no_of_area_insured': instance.noOfAreaInsured,
      'crop_insurance_enrolled_date': instance.cropInsuranceEnrolledDate,
      'crop_insurance_end_date': instance.cropInsuranceEndDate,
      'social_insurance': instance.socialInsurance,
      'provider_social_insurance': instance.providerSocialInsurance,
      'social_insurance_enrolled_date': instance.socialInsuranceEnrolledDate,
      'social_insurance_end_date': instance.socialInsuranceEndDate,
      'other_insurance': instance.otherInsurance,
    };
