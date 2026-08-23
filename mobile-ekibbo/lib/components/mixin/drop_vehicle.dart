import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_procurement.dart';
import 'package:agrobase_ekibbo/models/vehicle/vehicle_number_model.dart';
import 'package:agrobase_ekibbo/models/vehicle/vehicle_type_model.dart';

mixin DropVehicleMixin {
  final List<MVehicleType> vehicleTypes = [];
  int vehicleTypeId = 0;

  final List<MVehicleNumber> vehicleNumbers = [];
  int vehicleNumberId = 0;

  Future fetchVehicleType() async {
    vehicleTypes.clear();
    final res = await ApiProcurement.fetchVehicleType();
    vehicleTypes.addAll(res);
  }

  indexVehicleType() {
    if (vehicleTypes.isEmpty || vehicleTypeId == 0) return null;
    final index =
        vehicleTypes.indexWhere((element) => element.id == vehicleTypeId);
    if (index == -1) return null;
    return index;
  }

  fetchVehicleNumber() async {
    vehicleNumbers.clear();
    final res = await ApiProcurement.fetchVehicleNumber(vehicleTypeId);
    vehicleNumbers.addAll(res);
  }

  indexVehicleNumber() {
    if (vehicleNumbers.isEmpty || vehicleNumberId == 0) return null;
    final index =
        vehicleNumbers.indexWhere((element) => element.id == vehicleNumberId);
    if (index == -1) return null;
    return index;
  }
}
