import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
part 'dashboard_model.g.dart';

@JsonSerializable()
class DashboardModel {
  @JsonKey(name: 'total_farmmer')
  int? totalFarmer;
  @JsonKey(name: 'total_hectares')
  double? totalHectares;
  @JsonKey(name: 'total_plot')
  double? totalPlot;
  @JsonKey(name: 'farmer_list')
  List<FarmerModel>? farmerList;
  double? totalExpectedYield;
  DashboardModel();

  factory DashboardModel.fromJson(Map<String, dynamic> json) =>
      _$DashboardModelFromJson(json);
}
