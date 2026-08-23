// ignore_for_file: public_member_api_docs, sort_constructors_first
// ignore_for_file: non_constant_identifier_names

import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';

part 'srp_schedule_response.g.dart';

@JsonSerializable()
class SRPActionModel {
  int? id;
  int? srp_id;
  String? name_action;
  DateTime? date_action;
  SrpScheduleModel? srp;
  int? is_finished;
  int? score;
  SRPActionModel();
  factory SRPActionModel.fromJson(Map<String, dynamic> json) =>
      _$SRPActionModelFromJson(json);

  String getNameAction() {
    String n = name_action ?? '';
    n = n.replaceAll('_', ' ').replaceAll('srp ', '');
    return n.replaceAll(RegExp(r"[0-9]+"), "").trim();
  }
}

@JsonSerializable()
class SrpScheduleModel {
  int? id;
  DateTime? date;
  int? status;
  int? farmer_id;
  int? cultivation_id;
  int? score;
  String? sowing_date;
  int? season_id;
  @JsonKey(name: 'farmer_name')
  MSrpFarmer? farmer;
  CultivationModel? cultivation;
  String? season;
  SrpScheduleModel();
  factory SrpScheduleModel.fromJson(Map<String, dynamic> json) =>
      _$SrpScheduleModelFromJson(json);
}

class MSrpFarmer {
  final String fullName;
  final String phoneNumber;
  final String farmerCode;
  final String image;
  MSrpFarmer({
    required this.fullName,
    required this.phoneNumber,
    required this.farmerCode,
    required this.image,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'full_name': fullName,
      'phone_number': phoneNumber,
      'farmer_code': farmerCode,
      'image': image,
    };
  }

  factory MSrpFarmer.fromJson(Map<String, dynamic> map) {
    return MSrpFarmer(
      fullName: map['full_name'] as String,
      phoneNumber: map['phone_number'] as String,
      farmerCode: map['farmer_code'] as String,
      image: map['image'] as String,
    );
  }
}
