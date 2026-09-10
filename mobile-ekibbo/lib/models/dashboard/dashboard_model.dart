import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
part 'dashboard_model.g.dart';

@JsonSerializable()
class DashboardModel {
  @JsonKey(name: 'total_farmmer')
  int? totalFarmer;

  /// Tenant-wide farmer count — always matches the "View All Farmers"
  /// list scope (which is tenant-scoped, not officer-scoped).
  @JsonKey(name: 'total_farmers_tenant')
  int? totalFarmersTenant;

  @JsonKey(name: 'total_hectares')
  double? totalHectares;
  @JsonKey(name: 'total_plot')
  double? totalPlot;
  // Second review (H): plants KPI + per-crop breakdown
  @JsonKey(name: 'total_plants')
  double? totalPlants;
  @JsonKey(name: 'plants_breakdown')
  List<PlantsBreakdown>? plantsBreakdown;
  @JsonKey(name: 'farmer_list')
  List<FarmerModel>? farmerList;
  double? totalExpectedYield;

  /// True when the backend scoped the dashboard to the officer's own
  /// assigned farmers (extensionOfficer linkage).
  @JsonKey(name: 'my_farmers')
  bool? myFarmers;
  DashboardModel();

  factory DashboardModel.fromJson(Map<String, dynamic> json) =>
      _$DashboardModelFromJson(json);
}


/// Second review (H): per-crop plant counts for the Total Plants KPI card.
@JsonSerializable()
class PlantsBreakdown {
  @JsonKey(name: 'crop')
  String? crop;
  @JsonKey(name: 'count')
  double? count;
  PlantsBreakdown({this.crop, this.count});
}
