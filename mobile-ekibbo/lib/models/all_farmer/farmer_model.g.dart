// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farmer_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FarmerModel _$FarmerModelFromJson(Map<String, dynamic> json) => FarmerModel()
  ..id = json['id'] as int?
  ..userId = json['userId'] as int?
  ..staffId = json['staffId'] as int?
  ..enrollmentDate = json['enrollment_date'] as String?
  ..enrollmentPlace = json['enrollment_place'] as String?
  ..fullName = json['full_name'] as String?
  ..phoneNumber = json['phone_number'] as String?
  ..identityProof = json['identity_proof'] as String?
  ..country = json['country'] as int?
  ..province = json['province'] as int?
  ..district = json['district'] as int?
  ..commune = json['commune'] as int?
  ..village = json['village'] as String?
  ..lng = json['lng'] as String?
  ..lat = json['lat'] as String?
  ..proofNo = json['proof_no'] as String?
  ..gender = json['gender'] as String?
  ..dob = json['dob'] as String?
  ..farmerCode = json['farmer_code'] as String?
  ..farmerPhoto = json['farmer_photo'] as String?
  ..idProofPhoto = (json['id_proof_photo_url'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList()
  ..createdAt = json['created_at'] as String?
  ..avatarUrl = json['avatar_url'] as String?
  ..farmLands = (json['farm_lands'] as List<dynamic>?)
          ?.map((e) => FarmLandModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      []
  ..totalArea = (json['total_area'] as num?)?.toDouble()
  ..countryRelation = json['country_relation'] == null
      ? null
      : CountryModel.fromJson(json['country_relation'] as Map<String, dynamic>)
  ..provinceRelation = json['province_relation'] == null
      ? null
      : ProvinceModel.fromJson(
          json['province_relation'] as Map<String, dynamic>)
  ..districtRelation = json['district_relation'] == null
      ? null
      : DistrictModel.fromJson(
          json['district_relation'] as Map<String, dynamic>)
  ..communeRelation = json['commune_relation'] == null
      ? null
      : CommuneModel.fromJson(json['commune_relation'] as Map<String, dynamic>)
  ..farmLandsCount = json['farm_lands_count'] as int?
  ..srpCertification = json['srp_certification'] as int?
  ..cooperativeId = json['cooperative_id'] as int?;

Map<String, dynamic> _$FarmerModelToJson(FarmerModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'staffId': instance.staffId,
      'enrollment_date': instance.enrollmentDate,
      'enrollment_place': instance.enrollmentPlace,
      'full_name': instance.fullName,
      'phone_number': instance.phoneNumber,
      'identity_proof': instance.identityProof,
      'country': instance.country,
      'province': instance.province,
      'district': instance.district,
      'commune': instance.commune,
      'village': instance.village,
      'lng': instance.lng,
      'lat': instance.lat,
      'proof_no': instance.proofNo,
      'gender': instance.gender,
      'dob': instance.dob,
      'farmer_code': instance.farmerCode,
      'farmer_photo': instance.farmerPhoto,
      'id_proof_photo_url': instance.idProofPhoto,
      'created_at': instance.createdAt,
      'avatar_url': instance.avatarUrl,
      'farm_lands': instance.farmLands,
      'total_area': instance.totalArea,
      'country_relation': instance.countryRelation,
      'province_relation': instance.provinceRelation,
      'district_relation': instance.districtRelation,
      'commune_relation': instance.communeRelation,
      'farm_lands_count': instance.farmLandsCount,
      'srp_certification': instance.srpCertification,
      'cooperative_id': instance.cooperativeId,
    };
