import 'dart:convert';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/models/location/commune/commune_model.dart';
import 'package:agrobase_ekibbo/models/location/country/country_model.dart';
import 'package:agrobase_ekibbo/models/location/district/district_model.dart';
import 'package:agrobase_ekibbo/models/location/province/province_model.dart';

class MFarmerLocal {
  int id;
  int staff_id;
  String enrollment_date;
  String enrollment_place;
  String full_name;
  String phone_number;
  String identity_proof;
  int country;
  int province;
  int district;
  int commune;
  String village;
  // Web-platform aligned location NAMES (sent to the API for storage +
  // MN0001L farmer-code generation). district = Agrobase District,
  // commune = Agrobase SubCounty, village = Agrobase Village name.
  String district_name;
  String commune_name;
  String lng;
  String lat;
  String proof_no;
  String gender;
  String dob;
  String farmer_code;
  String farmer_photo;
  String created_at;
  String avatar_url;
  String full_address;
  double total_area;
  int farm_lands_count;
  int srp_certification;
  String id_proof_photo_front;
  String id_proof_photo_back;
  int cooperative_id;

  List<String> id_proof_photo_url;
  List<FarmLandModel> farm_lands;

  CountryModel? country_relation;
  ProvinceModel? province_relation;
  DistrictModel? district_relation;
  CommuneModel? commune_relation;

  late bool isFromLocal;

  MFarmerLocal({
    required this.id,
    required this.staff_id,
    required this.enrollment_date,
    required this.enrollment_place,
    required this.full_name,
    required this.phone_number,
    required this.identity_proof,
    required this.country,
    required this.province,
    required this.district,
    required this.commune,
    required this.village,
    this.district_name = '',
    this.commune_name = '',
    required this.lng,
    required this.lat,
    required this.proof_no,
    required this.gender,
    required this.dob,
    required this.farmer_code,
    required this.farmer_photo,
    required this.created_at,
    required this.avatar_url,
    required this.full_address,
    required this.total_area,
    required this.farm_lands_count,
    required this.srp_certification,
    required this.id_proof_photo_front,
    required this.id_proof_photo_back,
    required this.cooperative_id,
    required this.id_proof_photo_url,
    required this.farm_lands,
    this.country_relation,
    this.province_relation,
    this.district_relation,
    this.commune_relation,
  }) {
    isFromLocal = farmer_code.isEmpty;
  }

  factory MFarmerLocal.fromMap(Map<String, dynamic> map) {
    return MFarmerLocal(
      id: map['id'] ?? DateHelper.convertDateToTimestamp(DateTime.now()),
      staff_id: map['staff_id'] ?? 0,
      enrollment_date: map['enrollment_date'] ??
          DateHelper.convertDateToStr(DateTime.now(), format: 'yyyy-MM-dd'),
      enrollment_place: map['enrollment_place'] ?? '',
      full_name: map['full_name'] ?? '',
      phone_number: map['phone_number'] ?? '',
      identity_proof: map['identity_proof'] ?? '',
      country: map['country'] ?? 0,
      province: map['province'] ?? 0,
      district: map['district'] ?? 0,
      commune: map['commune'] ?? 0,
      village: map['village'] ?? '',
      district_name: map['district_name'] ?? '',
      commune_name: map['commune_name'] ?? '',
      lng: map['lng'] ?? '0',
      lat: map['lat'] ?? '0',
      proof_no: map['proof_no'] ?? '',
      gender: map['gender'] ?? '',
      dob: map['dob'] ?? '',
      farmer_code: map['farmer_code'] ?? '',
      farmer_photo: map['farmer_photo'] ?? '',
      created_at: map['created_at'] ?? '',
      avatar_url: map['avatar_url'] ?? '',
      full_address: map['full_address'] ?? '',
      total_area: map['total_area'] ?? 0,
      farm_lands_count: map['farm_lands_count'] ?? 0,
      srp_certification: map['srp_certification'] ?? 0,
      id_proof_photo_front: map['id_proof_photo_front'] ?? '',
      id_proof_photo_back: map['id_proof_photo_back'] ?? '',
      cooperative_id: map['cooperative_id'] ?? 0,
      id_proof_photo_url: List<String>.from(map['id_proof_photo_url'] ?? []),
      farm_lands: ((map['farm_lands'] ?? []) as List<dynamic>)
          .map((e) => FarmLandModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      country_relation: map['country_relation'] != null
          ? CountryModel.fromJson(
              map['country_relation'] as Map<String, dynamic>)
          : null,
      province_relation: map['province_relation'] != null
          ? ProvinceModel.fromJson(
              map['province_relation'] as Map<String, dynamic>)
          : null,
      district_relation: map['district_relation'] != null
          ? DistrictModel.fromJson(
              map['district_relation'] as Map<String, dynamic>)
          : null,
      commune_relation: map['commune_relation'] != null
          ? CommuneModel.fromJson(
              map['commune_relation'] as Map<String, dynamic>)
          : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory MFarmerLocal.fromJson(String source) =>
      MFarmerLocal.fromMap(json.decode(source) as Map<String, dynamic>);

  MFarmerLocal copyWith(MFarmerLocal data) {
    return MFarmerLocal.fromMap(data.toMap());
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'farmer_id': id,
      'staff_id': staff_id,
      'enrollment_date': enrollment_date,
      'enrollment_place': enrollment_place,
      'full_name': full_name,
      'phone_number': phone_number,
      'identity_proof': identity_proof,
      'country': country,
      'province': province,
      'district': district,
      'commune': commune,
      'district_name': district_name,
      'commune_name': commune_name,
      'village': village,
      'lng': lng,
      'lat': lat,
      'proof_no': proof_no,
      'gender': gender,
      'dob': dob,
      'farmer_code': farmer_code,
      'farmer_photo': farmer_photo,
      'created_at': created_at,
      'avatar_url': avatar_url,
      'full_address': full_address,
      'total_area': total_area,
      'farm_lands_count': farm_lands_count,
      'srp_certification': srp_certification,
      'id_proof_photo_front': id_proof_photo_front,
      'id_proof_photo_back': id_proof_photo_back,
      'id_proof_photo_url': id_proof_photo_url,
      'cooperative_id': cooperative_id,
      'farm_lands': farm_lands.map((x) => x.toMap()).toList(),
      'country_relation': country_relation?.toMap(),
      'province_relation': province_relation?.toMap(),
      'district_relation': district_relation?.toMap(),
      'commune_relation': commune_relation?.toMap(),
    };
  }

  Map<String, dynamic> toUpdate() {
    return <String, dynamic>{
      'enrollment_date': enrollment_date,
      'enrollment_place': enrollment_place,
      'full_name': full_name,
      'phone_number': phone_number,
      'identity_proof': identity_proof,
      'country': country,
      'province': province,
      'district': district,
      'commune': commune,
      'district_name': district_name,
      'commune_name': commune_name,
      'village': village,
      'proof_no': proof_no,
      'gender': gender,
      'dob': dob,
      'isOnline': true,
      "staff_lat": 0,
      "staff_lng": 0,
      'lat': lat,
      'lng': lng,
      'srp_certification': srp_certification,
      'farmer_id': id,
      'cooperative_id': cooperative_id
    };
  }
}
