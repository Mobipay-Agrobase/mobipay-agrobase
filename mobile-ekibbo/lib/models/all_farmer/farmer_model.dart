import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/models/location/commune/commune_model.dart';
import 'package:agrobase_ekibbo/models/location/country/country_model.dart';
import 'package:agrobase_ekibbo/models/location/district/district_model.dart';
import 'package:agrobase_ekibbo/models/location/province/province_model.dart';
part 'farmer_model.g.dart';

@JsonSerializable()
class FarmerModel {
  int? id;
  int? userId;
  int? staffId;
  @JsonKey(name: 'enrollment_date')
  String? enrollmentDate;
  @JsonKey(name: 'enrollment_place')
  String? enrollmentPlace;
  @JsonKey(name: 'full_name')
  String? fullName;
  @JsonKey(name: 'phone_number')
  String? phoneNumber;
  @JsonKey(name: 'identity_proof')
  String? identityProof;
  int? country;
  int? province;
  int? district;
  int? commune;
  String? village;
  String? lng;
  String? lat;
  @JsonKey(name: 'proof_no')
  String? proofNo;
  String? gender;
  String? dob;
  @JsonKey(name: 'farmer_code')
  String? farmerCode;
  @JsonKey(name: 'farmer_photo')
  String? farmerPhoto;
  @JsonKey(name: 'id_proof_photo_url')
  List<String>? idProofPhoto;
  @JsonKey(name: 'created_at')
  String? createdAt;
  @JsonKey(name: 'avatar_url')
  String? avatarUrl;
  @JsonKey(name: 'farm_lands', defaultValue: [])
  List<FarmLandModel>? farmLands;
  @JsonKey(name: 'total_area')
  double? totalArea;
  @JsonKey(name: 'country_relation')
  CountryModel? countryRelation;
  @JsonKey(name: 'province_relation')
  ProvinceModel? provinceRelation;
  @JsonKey(name: 'district_relation')
  DistrictModel? districtRelation;
  @JsonKey(name: 'commune_relation')
  CommuneModel? communeRelation;
  @JsonKey(name: 'farm_lands_count')
  int? farmLandsCount;
  @JsonKey(name: 'srp_certification')
  int? srpCertification;
  @JsonKey(name: 'cooperative_id')
  int? cooperativeId;

  FarmerModel();
  factory FarmerModel.fromJson(Map<String, dynamic> json) =>
      _$FarmerModelFromJson(json);

  Map<String, dynamic> toMap() => {
        'id': id,
        'userId': userId,
        'staffId': staffId,
        'enrollment_date': enrollmentDate,
        'enrollment_place': enrollmentPlace,
        'full_name': fullName,
        'phone_number': phoneNumber,
        'identity_proof': identityProof,
        'country': country,
        'province': province,
        'district': district,
        'commune': commune,
        'village': village,
        'lng': lng,
        'lat': lat,
        'proof_no': proofNo,
        'gender': gender,
        'dob': dob,
        'farmer_code': farmerCode,
        'farmer_photo': farmerPhoto,
        'id_proof_photo_url': idProofPhoto,
        'created_at': createdAt,
        'avatar_url': avatarUrl,
        'total_area': totalArea,
        'farm_lands_count': farmLandsCount,
        'srp_certification': srpCertification,
        'cooperative_id': cooperativeId,
      };

  Map<String, dynamic> toMapSearch() =>
      {"id": id, "full_name": showInputName, "cooperative_id": cooperativeId};

  String get showInputName => "$fullName ($farmerCode)";

  String location() {
    String location = '';
    if (countryRelation != null) {
      location += '${countryRelation!.countryName}, ';
    }
    if (provinceRelation != null) {
      location += '${provinceRelation!.provinceName}, ';
    }
    if (districtRelation != null) {
      location += '${districtRelation!.districtName}, ';
    }
    if (communeRelation != null) {
      location += '${communeRelation!.communeName}, ';
    }
    if (village != null && village != '') {
      location += village!;
    }
    return location != '' ? location : 'N/A';
  }
}
