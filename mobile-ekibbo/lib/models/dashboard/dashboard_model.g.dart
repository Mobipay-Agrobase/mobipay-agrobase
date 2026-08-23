// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DashboardModel _$DashboardModelFromJson(Map<String, dynamic> json) =>
    DashboardModel()
      ..totalFarmer = json['total_farmmer'] as int?
      ..totalHectares = (json['total_hectares'] as num?)?.toDouble()
      ..totalPlot = (json['total_plot'] as num?)?.toDouble()
      ..farmerList = (json['farmer_list'] as List<dynamic>?)
          ?.map((e) => FarmerModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..totalExpectedYield = (json['totalExpectedYield'] as num?)?.toDouble();

Map<String, dynamic> _$DashboardModelToJson(DashboardModel instance) =>
    <String, dynamic>{
      'total_farmmer': instance.totalFarmer,
      'total_hectares': instance.totalHectares,
      'total_plot': instance.totalPlot,
      'farmer_list': instance.farmerList,
      'totalExpectedYield': instance.totalExpectedYield,
    };
