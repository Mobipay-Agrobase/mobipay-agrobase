import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/sale_intention/sale_intention_response.dart';

part 'detail_sale_intention_response.g.dart';

@JsonSerializable()
class DetailSaleIntentionResponse {
  @JsonKey(name: 'data_sale_intention')
  SaleIntentionModel? dataSaleIntention;

  DetailSaleIntentionResponse();

  factory DetailSaleIntentionResponse.fromJson(Map<String, dynamic> json) =>
      _$DetailSaleIntentionResponseFromJson(json);
}
