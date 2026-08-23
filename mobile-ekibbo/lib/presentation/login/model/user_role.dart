import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

bool isShowFloatButton() {
  final userInfo = SharedPreferencesProvider.instance.userInfo;
  if (userInfo == null) return false;
  switch (userInfo.roleUser) {
    case EnumUserRole.super_admin:
    case EnumUserRole.staff:
    case EnumUserRole.farmer:
      return true;
    default:
      return false;
  }
}
