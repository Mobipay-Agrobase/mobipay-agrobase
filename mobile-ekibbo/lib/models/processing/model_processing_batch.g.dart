// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model_processing_batch.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MProcessingBatch _$MProcessingBatchFromJson(Map<String, dynamic> json) =>
    MProcessingBatch(
      id: json['id'] as int? ?? 0,
      batchNumber: json['batch_number'] as String? ?? '',
      inputCommodity: json['input_commodity'] as String? ?? '',
      processType: json['process_type'] as String? ?? '',
      outputProduct: json['output_product'] as String?,
      inputQuantity: (json['input_quantity'] as num?)?.toDouble() ?? 0,
      inputUnit: json['input_unit'] as String? ?? 'kg',
      outputQuantity: (json['output_quantity'] as num?)?.toDouble() ?? 0,
      outputUnit: json['output_unit'] as String? ?? 'kg',
      qualityGrade: json['quality_grade'] as String? ?? '',
      qualityScore: (json['quality_score'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String? ?? '',
      facility: json['facility'] as String? ?? '',
      startDate: json['start_date'] as String? ?? '',
      endDate: json['end_date'] as String?,
      notes: json['notes'] as String? ?? '',
    );

Map<String, dynamic> _$MProcessingBatchToJson(MProcessingBatch instance) =>
    <String, dynamic>{
      'id': instance.id,
      'batch_number': instance.batchNumber,
      'input_commodity': instance.inputCommodity,
      'process_type': instance.processType,
      'output_product': instance.outputProduct,
      'input_quantity': instance.inputQuantity,
      'input_unit': instance.inputUnit,
      'output_quantity': instance.outputQuantity,
      'output_unit': instance.outputUnit,
      'quality_grade': instance.qualityGrade,
      'quality_score': instance.qualityScore,
      'status': instance.status,
      'facility': instance.facility,
      'start_date': instance.startDate,
      'end_date': instance.endDate,
      'notes': instance.notes,
    };

MProcessingSummary _$MProcessingSummaryFromJson(Map<String, dynamic> json) =>
    MProcessingSummary(
      total: json['total'] as int? ?? 0,
      pending: json['pending'] as int? ?? 0,
      approved: json['approved'] as int? ?? 0,
      inProgress: json['in_progress'] as int? ?? 0,
      completed: json['completed'] as int? ?? 0,
    );

Map<String, dynamic> _$MProcessingSummaryToJson(MProcessingSummary instance) =>
    <String, dynamic>{
      'total': instance.total,
      'pending': instance.pending,
      'approved': instance.approved,
      'in_progress': instance.inProgress,
      'completed': instance.completed,
    };

MProcessingListPayload _$MProcessingListPayloadFromJson(
        Map<String, dynamic> json) =>
    MProcessingListPayload(
      batches: (json['batches'] as List<dynamic>? ?? [])
          .map((e) => MProcessingBatch.fromJson(e as Map<String, dynamic>))
          .toList(),
      summary: json['summary'] == null
          ? null
          : MProcessingSummary.fromJson(json['summary'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MProcessingListPayloadToJson(
        MProcessingListPayload instance) =>
    <String, dynamic>{
      'batches': instance.batches.map((e) => e.toMap()).toList(),
      'summary': instance.summary?.toMap(),
    };
