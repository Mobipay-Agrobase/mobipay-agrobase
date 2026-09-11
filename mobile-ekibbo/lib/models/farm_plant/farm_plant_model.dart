import 'package:json_annotation/json_annotation.dart';

part 'farm_plant_model.g.dart';

/// Second review (H): per-farm plant inventory row.
/// Crop categories + varieties come from the review catalog
/// (Coffee–Robusta, Cocoa–Trinitario/Forastero/Criollo, Vanilla,
/// Shade Trees, Bananas, Jackfruit, Avocado, Cassava).
/// [cropMasterName] is the optional link to the Crop Master registry —
/// the server resolves it by name match; null for review-only
/// categories (Shade Trees, Bamboo seedlings, …).
@JsonSerializable()
class FarmPlantModel {
  int? id;
  @JsonKey(name: 'farm_land_id')
  int? farmLandId;
  @JsonKey(name: 'crop_category')
  String? cropCategory;
  @JsonKey(name: 'crop_master_name')
  String? cropMasterName;
  String? variety;
  @JsonKey(name: 'plant_count')
  int? plantCount;
  String? notes;

  FarmPlantModel({
    this.id,
    this.farmLandId,
    this.cropCategory,
    this.cropMasterName,
    this.variety,
    this.plantCount,
    this.notes,
  });

  factory FarmPlantModel.fromJson(Map<String, dynamic> json) =>
      _$FarmPlantModelFromJson(json);

  Map<String, dynamic> toJson() => _$FarmPlantModelToJson(this);
}
