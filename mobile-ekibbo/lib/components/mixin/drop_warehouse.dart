import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_procurement.dart';
import 'package:agrobase_ekibbo/models/warehouse/warehouse_model.dart';

mixin DropWarehouseMixin {
  final List<MWareHouse> warehouses = [];
  int warehouseId = 0;

  Future fetchWareHouse() async {
    warehouses.clear();
    final res = await ApiProcurement.fetchWareHouse();
    warehouses.addAll(res);
  }

  indexWareHouse() {
    if (warehouses.isEmpty || warehouseId == 0) return null;
    final index = warehouses.indexWhere((element) => element.id == warehouseId);
    if (index == -1) return null;
    return index;
  }
}
