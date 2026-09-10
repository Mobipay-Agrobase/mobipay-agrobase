// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DashboardModel _$DashboardModelFromJson(Map<String, dynamic> json) =>
    DashboardModel()
      ..totalFarmer = json['total_farmmer'] as int?
      ..totalFarmersTenant = json['total_farmers_tenant'] as int?
      ..totalHectares = (json['total_hectares'] as num?)?.toDouble()
      ..totalPlot = (json['total_plot'] as num?)?.toDouble()
      ..totalPlants = (json['total_plants'] as num?)?.toDouble()
      ..plantsBreakdown = (json['plants_breakdown'] as List<dynamic>?)
          ?.map((e) => PlantsBreakdown()
            ..crop = (e as Map<String, dynamic>)['crop'] as String?
            ..count = ((e as Map<String, dynamic>)['count'] as num?)?.toDouble())
          .toList()
      ..farmerList = (json['farmer_list'] as List<dynamic>?)
          ?.map((e) => FarmerModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..totalExpectedYield = (json['totalExpectedYield'] as num?)?.toDouble()
      ..myFarmers = json['my_farmers'] as bool?;

Map<String, dynamic> _$DashboardModelToJson(DashboardModel instance) =>
    <String, dynamic>{
      'total_farmmer': instance.totalFarmer,
      'total_farmers_tenant': instance.totalFarmersTenant,
      'total_hectares': instance.totalHectares,
      'total_plot': instance.totalPlot,
      'total_plants': instance.totalPlants,
      'plants_breakdown': instance.plantsBreakdown,
      'my_farmers': instance.myFarmers,
      'farmer_list': instance.farmerList,
      'totalExpectedYield': instance.totalExpectedYield,
      'my_farmers': instance.myFarmers,
    };
