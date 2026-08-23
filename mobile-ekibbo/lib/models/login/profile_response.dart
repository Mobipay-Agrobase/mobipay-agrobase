import 'package:json_annotation/json_annotation.dart';
part 'profile_response.g.dart';

@JsonSerializable()
class ProfileResponse {
  @JsonKey(name: 'staff_data')
  ProfileModel? staffData;
  ProfileResponse();
  factory ProfileResponse.fromJson(Map<String, dynamic> json) =>
      _$ProfileResponseFromJson(json);
}

class ProfileModel {
  final int id;
  final int userId;
  final String userType;
  final String firstName;
  final String lastName;
  final String gender;
  final String email;
  final String phoneNumber;
  final double lat;
  final double lng;
  final String status;
  final String createdAt;
  final String updatedAt;
  final String name;

  ProfileModel({
    required this.id,
    required this.userId,
    required this.userType,
    required this.firstName,
    required this.lastName,
    required this.gender,
    required this.email,
    required this.phoneNumber,
    required this.lat,
    required this.lng,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.name,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      id: json['id'] ?? 0,
      userId: json['user_id'] ?? 0,
      userType: json['user_type'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      gender: json['gender'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phone_number'] ?? '',
      lat: ((json['lat'] ?? 0.0) as num).toDouble(),
      lng: ((json['lng'] ?? 0.0) as num).toDouble(),
      status: json['status'] ?? '',
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
      name: json['name'] ?? '',
    );
  }
}
