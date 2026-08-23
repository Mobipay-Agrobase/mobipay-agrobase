// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class MSaleIntentionRequest {
  String varietyName;
  double startingBid;
  String dateForHarvest;
  String aviableDate;
  int farmerId;
  int farmLandId;
  int cultivationId;
  int seasonId;
  String sowingDate;
  double quantity;
  double maxPrice;
  String grade;
  String ageOfCrop;
  String phone;
  double lat;
  double lng;
  List<MPreHarvestQC> preHarvestQC;

  MSaleIntentionRequest({
    required this.varietyName,
    required this.startingBid,
    required this.dateForHarvest,
    required this.aviableDate,
    required this.farmerId,
    required this.farmLandId,
    required this.cultivationId,
    required this.seasonId,
    required this.sowingDate,
    required this.quantity,
    required this.maxPrice,
    required this.grade,
    required this.ageOfCrop,
    required this.phone,
    required this.lat,
    required this.lng,
    required this.preHarvestQC,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'name': varietyName,
      'added_by': 'farmer',
      'category_id': '1',
      'brand_id': '',
      'barcode': '',
      'starting_bid': startingBid,
      'video_provider': '',
      'video_link': '',
      'shipping_type': '',
      'meta_title': '',
      'meta_description': '',
      'sku': '',
      'est_shipping_days': '',
      'unit': 'KG',
      'auction_date_range': 'upstream',
      'date_for_harvest': dateForHarvest,
      'aviable_date': aviableDate,
      'farmer_id': farmerId,
      'farm_land_id': farmLandId,
      'cultivation_id': cultivationId,
      'season_id': seasonId,
      'sowing_date': sowingDate,
      'quantity': quantity,
      'max_price': maxPrice,
      'grade': grade,
      'age_of_crop': ageOfCrop,
      'staff_token': SharedPreferencesProvider.instance.accessToken,
      'lat': lat,
      'lng': lng,
      'description': preHarvestQC.map((e) => e.toMap()).toList(),
      "quality_check": "Verified",
    };
  }

  String toJson() => json.encode(toMap());

  sellerLogin() => {
        'email': phone[0] == '0' ? phone.replaceFirst("0", "+84") : "+84$phone",
        'password': '12345678',
        'user_type': 'farmer'
      };
}
