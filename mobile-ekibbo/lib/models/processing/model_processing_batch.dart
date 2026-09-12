// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

part 'model_processing_batch.g.dart';

/// Second review (L — Processing): a post-harvest processing batch served
/// by GET /mobile/ekibbo-processing. Statuses follow the approval workflow:
/// PENDING → APPROVED / REJECTED → IN_PROGRESS → COMPLETED.
@JsonSerializable()
class MProcessingBatch {
  @JsonKey(defaultValue: 0)
  final int id;

  @JsonKey(name: 'batch_number', defaultValue: '')
  final String batchNumber;

  @JsonKey(name: 'input_commodity', defaultValue: '')
  final String inputCommodity;

  @JsonKey(name: 'process_type', defaultValue: '')
  final String processType;

  @JsonKey(name: 'output_product')
  final String? outputProduct;

  @JsonKey(name: 'input_quantity', defaultValue: 0)
  final double inputQuantity;

  @JsonKey(name: 'input_unit', defaultValue: 'kg')
  final String inputUnit;

  @JsonKey(name: 'output_quantity', defaultValue: 0)
  final double outputQuantity;

  @JsonKey(name: 'output_unit', defaultValue: 'kg')
  final String outputUnit;

  @JsonKey(name: 'quality_grade', defaultValue: '')
  final String qualityGrade;

  @JsonKey(name: 'quality_score', defaultValue: 0)
  final double qualityScore;

  @JsonKey(defaultValue: '')
  final String status;

  @JsonKey(defaultValue: '')
  final String facility;

  @JsonKey(name: 'start_date', defaultValue: '')
  final String startDate;

  @JsonKey(name: 'end_date')
  final String? endDate;

  @JsonKey(defaultValue: '')
  final String notes;

  MProcessingBatch({
    required this.id,
    required this.batchNumber,
    required this.inputCommodity,
    required this.processType,
    required this.outputProduct,
    required this.inputQuantity,
    required this.inputUnit,
    required this.outputQuantity,
    required this.outputUnit,
    required this.qualityGrade,
    required this.qualityScore,
    required this.status,
    required this.facility,
    required this.startDate,
    required this.endDate,
    required this.notes,
  });

  Map<String, dynamic> toMap() => _$MProcessingBatchToJson(this);

  factory MProcessingBatch.fromJson(Map<String, dynamic> map) =>
      _$MProcessingBatchFromJson(map);
}

/// Status counts for the Processing screen KPI row.
@JsonSerializable()
class MProcessingSummary {
  @JsonKey(defaultValue: 0)
  final int total;

  @JsonKey(defaultValue: 0)
  final int pending;

  @JsonKey(defaultValue: 0)
  final int approved;

  @JsonKey(name: 'in_progress', defaultValue: 0)
  final int inProgress;

  @JsonKey(defaultValue: 0)
  final int completed;

  MProcessingSummary({
    required this.total,
    required this.pending,
    required this.approved,
    required this.inProgress,
    required this.completed,
  });

  Map<String, dynamic> toMap() => _$MProcessingSummaryToJson(this);

  factory MProcessingSummary.fromJson(Map<String, dynamic> map) =>
      _$MProcessingSummaryFromJson(map);
}

/// The GET /mobile/ekibbo-processing payload: batch list + summary counts.
@JsonSerializable()
class MProcessingListPayload {
  @JsonKey(defaultValue: [])
  final List<MProcessingBatch> batches;

  @JsonKey(defaultValue: null)
  final MProcessingSummary? summary;

  MProcessingListPayload({
    required this.batches,
    required this.summary,
  });

  Map<String, dynamic> toMap() => _$MProcessingListPayloadToJson(this);

  factory MProcessingListPayload.fromJson(Map<String, dynamic> map) =>
      _$MProcessingListPayloadFromJson(map);
}
