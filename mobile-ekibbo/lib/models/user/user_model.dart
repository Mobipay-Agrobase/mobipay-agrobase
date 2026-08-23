import 'package:agrobase_ekibbo/domain/roles/role_config.dart';

/// Agrobase Ekibbo user — returned by POST /api/auth/mobile-login
///
/// Multi-tenant: `tenantId` identifies the tenant this user belongs to.
/// All API data is scoped to this tenant SERVER-SIDE from the Bearer token
/// (the backend middleware injects x-tenant-id / x-tenant-scope headers), so
/// a user of one tenant can never see another tenant's data.
class UserModel {
  final String id;
  final String type; // role: EKB_EXTENSION | EKB_FARMER | ...
  final String name;
  final String email;
  final String phone;
  final String tenantId;
  final String tenantName;
  final int staffId;
  final int farmerId;

  UserModel({
    required this.id,
    required this.type,
    required this.name,
    required this.email,
    required this.phone,
    this.tenantId = '',
    this.tenantName = '',
    this.staffId = 0,
    this.farmerId = 0,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      type: json['type'] ?? json['role'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: (json['phone'] ?? '').toString(),
      tenantId: (json['tenantId'] ?? json['tenant_id'] ?? '').toString(),
      tenantName: (json['tenantName'] ?? json['tenant_name'] ?? '').toString(),
      staffId: json['staff_id'] ?? 0,
      farmerId: json['farmer_id'] ?? 0,
    );
  }

  EnumUserRole get roleUser => stringToRoleUser(type);

  get toJson => {
        'id': id,
        'staff_id': staffId,
        'farmer_id': farmerId,
        'type': type,
        'name': name,
        'email': email,
        'phone': phone,
        'tenantId': tenantId,
        'tenantName': tenantName,
      };
}
