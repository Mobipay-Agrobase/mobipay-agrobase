import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/processing/model_processing_batch.dart';

part 'processing_api_client.g.dart';

/// Second review (L — Processing): the mobile Processing module, backed by
/// the WEB PLATFORM's ProcessingBatch table via the mobile-ekibbo route:
///   GET  /mobile/ekibbo-processing            → batches + status summary
///   POST /mobile/ekibbo-processing            → workflow action or create
///
/// Workflow (permission-gated server-side, mirrors the web state machine):
///   PENDING ─approve/reject→ APPROVED/REJECTED, APPROVED ─start→
///   IN_PROGRESS ─complete→ COMPLETED.
@RestApi(baseUrl: '')
abstract class ProcessingApiClient {
  factory ProcessingApiClient(Dio dio, {String baseUrl}) =
      _ProcessingApiClient;

  @GET('/mobile/ekibbo-processing')
  Future<BaseResponse<MProcessingListPayload>?> getBatches();

  /// [body] carries either a workflow action:
  ///   { batch_id, action: approve|reject|start|complete, reason?,
  ///     output_quantity?, output_unit?, quality_grade?, quality_score? }
  /// or a new batch:
  ///   { input_commodity, process_type, output_product, input_quantity,
  ///     facility, notes? }
  @POST('/mobile/ekibbo-processing')
  Future<BaseResponse?> submit(@Body() Map<String, dynamic> body);
}
