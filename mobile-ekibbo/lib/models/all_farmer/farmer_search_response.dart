// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';

class FarmerSearchResponse {
  final List<FarmerModel> farmerData;
  FarmerSearchResponse({
    required this.farmerData,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'farmer_data': farmerData.map((x) => x.toMap()).toList(),
    };
  }

  factory FarmerSearchResponse.fromJson(Map<String, dynamic> map) {
    return FarmerSearchResponse(
      farmerData: List<FarmerModel>.from(
        ((map['farmer_data'] ?? []) as List<dynamic>).map<FarmerModel>(
          (x) => FarmerModel.fromJson(x as Map<String, dynamic>),
        ),
      ),
    );
  }

  String toJson() => json.encode(toMap());
}
