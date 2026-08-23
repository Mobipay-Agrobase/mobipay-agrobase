// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farm_land_api_client.dart';

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers

class _FarmLandApiClient implements FarmLandApiClient {
  _FarmLandApiClient(
    this._dio, {
    this.baseUrl,
  });

  final Dio _dio;

  String? baseUrl;

  @override
  Future<BaseResponse<dynamic>?> addFarmLand(FormData data) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'POST',
      headers: _headers,
      extra: _extra,
      contentType: 'multipart/form-data',
    )
            .compose(
              _dio.options,
              '/mobile/ekibbo-farmland',
              queryParameters: queryParameters,
              data: _data,
            )
            .copyWith(
                baseUrl: _combineBaseUrls(
              _dio.options.baseUrl,
              baseUrl,
            ))));
    final value = _result.data == null
        ? null
        : BaseResponse<dynamic>.fromJson(
            _result.data!,
            (json) => json as dynamic,
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateFarmland(
    FormData data,
    int farmId,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'POST',
      headers: _headers,
      extra: _extra,
      contentType: 'multipart/form-data',
    )
            .compose(
              _dio.options,
              '/farmland/update_farmland/${farmId}',
              queryParameters: queryParameters,
              data: _data,
            )
            .copyWith(
                baseUrl: _combineBaseUrls(
              _dio.options.baseUrl,
              baseUrl,
            ))));
    final value = _result.data == null
        ? null
        : BaseResponse<dynamic>.fromJson(
            _result.data!,
            (json) => json as dynamic,
          );
    return value;
  }

  @override
  Future<BaseResponse<DropdownFarmLandModel>?> getFarmLandDropdownData() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<DropdownFarmLandModel>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/mobile/ekibbo-farmland',
              queryParameters: queryParameters,
              data: _data,
            )
            .copyWith(
                baseUrl: _combineBaseUrls(
              _dio.options.baseUrl,
              baseUrl,
            ))));
    final value = _result.data == null
        ? null
        : BaseResponse<DropdownFarmLandModel>.fromJson(
            _result.data!,
            (json) =>
                DropdownFarmLandModel.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<AllFarmLandResponse>?> getAllFarmLands(
      int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<AllFarmLandResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/get_all_farm_land/${farmerId}',
              queryParameters: queryParameters,
              data: _data,
            )
            .copyWith(
                baseUrl: _combineBaseUrls(
              _dio.options.baseUrl,
              baseUrl,
            ))));
    final value = _result.data == null
        ? null
        : BaseResponse<AllFarmLandResponse>.fromJson(
            _result.data!,
            (json) =>
                AllFarmLandResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<AllFarmLandResponse>?> getNearByPlot() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<AllFarmLandResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/get_all_farm_land_by_staff',
              queryParameters: queryParameters,
              data: _data,
            )
            .copyWith(
                baseUrl: _combineBaseUrls(
              _dio.options.baseUrl,
              baseUrl,
            ))));
    final value = _result.data == null
        ? null
        : BaseResponse<AllFarmLandResponse>.fromJson(
            _result.data!,
            (json) =>
                AllFarmLandResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<FarmlandDetailResponse>?> getDetailFarmland(
      int farmId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<FarmlandDetailResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmland/get_details/${farmId}',
              queryParameters: queryParameters,
              data: _data,
            )
            .copyWith(
                baseUrl: _combineBaseUrls(
              _dio.options.baseUrl,
              baseUrl,
            ))));
    final value = _result.data == null
        ? null
        : BaseResponse<FarmlandDetailResponse>.fromJson(
            _result.data!,
            (json) =>
                FarmlandDetailResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<AllCutivationResponse>?> getCultivations(
      int farmId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<AllCutivationResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmland/get_cultivation/${farmId}',
              queryParameters: queryParameters,
              data: _data,
            )
            .copyWith(
                baseUrl: _combineBaseUrls(
              _dio.options.baseUrl,
              baseUrl,
            ))));
    final value = _result.data == null
        ? null
        : BaseResponse<AllCutivationResponse>.fromJson(
            _result.data!,
            (json) =>
                AllCutivationResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<CultivationModel>>?> findCultivations(
    int farmlandId,
    int seasonId,
    int cropId,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<CultivationModel>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/cultivations?farm_land_id=${farmlandId}&season_id=${seasonId}&crop_id=${cropId}&whereDoesntHave=cropHarvestDetail',
              queryParameters: queryParameters,
              data: _data,
            )
            .copyWith(
                baseUrl: _combineBaseUrls(
              _dio.options.baseUrl,
              baseUrl,
            ))));
    final value = _result.data == null
        ? null
        : BaseResponse<List<CultivationModel>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<CultivationModel>((i) =>
                        CultivationModel.fromJson(i as Map<String, dynamic>))
                    .toList()
                : List.empty(),
          );
    return value;
  }

  RequestOptions _setStreamType<T>(RequestOptions requestOptions) {
    if (T != dynamic &&
        !(requestOptions.responseType == ResponseType.bytes ||
            requestOptions.responseType == ResponseType.stream)) {
      if (T == String) {
        requestOptions.responseType = ResponseType.plain;
      } else {
        requestOptions.responseType = ResponseType.json;
      }
    }
    return requestOptions;
  }

  String _combineBaseUrls(
    String dioBaseUrl,
    String? baseUrl,
  ) {
    if (baseUrl == null || baseUrl.trim().isEmpty) {
      return dioBaseUrl;
    }

    final url = Uri.parse(baseUrl);

    if (url.isAbsolute) {
      return url.toString();
    }

    return Uri.parse(dioBaseUrl).resolveUri(url).toString();
  }
}
