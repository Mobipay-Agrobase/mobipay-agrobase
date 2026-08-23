import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
part 'insurance_info_response.g.dart';

@JsonSerializable()
class InsuranceInfoResponse {
  @JsonKey(name: 'insurance_info')
  List<InsuranceInfoModel>? insuranceInfo;
  @JsonKey(name: 'data_crop')
  List<DropdownMasterModel>? dataCrop;
  InsuranceInfoResponse();
  factory InsuranceInfoResponse.fromJson(Map<String, dynamic> json) =>
      _$InsuranceInfoResponseFromJson(json);
}

@JsonSerializable()
class InsuranceInfoModel {
  int? id;
  @JsonKey(name: 'life_insurance')
  String? lifeInsurance;
  @JsonKey(name: 'provider_life_insurance')
  String? providerLifeInsurance;
  @JsonKey(name: 'life_insurance_amount')
  double? lifeInsuranceAmount;
  @JsonKey(name: 'life_insurance_enrolled_date')
  String? lifeInsuranceEnrolledDate;
  @JsonKey(name: 'life_insurance_end_date')
  String? lifeInsuranceEndDate;
  @JsonKey(name: 'health_insurance')
  String? healthInsurance;
  @JsonKey(name: 'provider_health_insurance')
  String? providerHealthInsurance;
  @JsonKey(name: 'health_insurance_amount')
  double? healthInsuranceAmount;
  @JsonKey(name: 'health_insurance_enrolled_date')
  String? healthInsuranceEnrolledDate;
  @JsonKey(name: 'health_insurance_end_date')
  String? healthInsuranceEndDate;
  @JsonKey(name: 'crop_insurance')
  String? cropInsurance;
  @JsonKey(name: 'provider_crop_insurance')
  String? providerCropInsurance;
  @JsonKey(name: 'crop_insured')
  String? cropInsured;
  @JsonKey(name: 'no_of_area_insured')
  double? noOfAreaInsured;
  @JsonKey(name: 'crop_insurance_enrolled_date')
  String? cropInsuranceEnrolledDate;
  @JsonKey(name: 'crop_insurance_end_date')
  String? cropInsuranceEndDate;
  @JsonKey(name: 'social_insurance')
  String? socialInsurance;
  @JsonKey(name: 'provider_social_insurance')
  String? providerSocialInsurance;
  @JsonKey(name: 'social_insurance_enrolled_date')
  String? socialInsuranceEnrolledDate;
  @JsonKey(name: 'social_insurance_end_date')
  String? socialInsuranceEndDate;
  @JsonKey(name: 'other_insurance')
  String? otherInsurance;
  InsuranceInfoModel();
  factory InsuranceInfoModel.fromJson(Map<String, dynamic> json) =>
      _$InsuranceInfoModelFromJson(json);
  Map<String, dynamic> toJson() => _$InsuranceInfoModelToJson(this);
}
