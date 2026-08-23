// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'location_api_client.dart';

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers

class _LocationApiClient implements LocationApiClient {
  _LocationApiClient(
    this._dio, {
    this.baseUrl,
  });

  final Dio _dio;

  String? baseUrl;

  @override
  Future<BaseResponse<List<CountryModel>>?> getCountries() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<CountryModel>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/country',
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
        : BaseResponse<List<CountryModel>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<CountryModel>(
                        (i) => CountryModel.fromJson(i as Map<String, dynamic>))
                    .toList()
                : List.empty(),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<ProvinceModel>>?> getAllProvinces() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<ProvinceModel>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/province',
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
        : BaseResponse<List<ProvinceModel>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<ProvinceModel>((i) =>
                        ProvinceModel.fromJson(i as Map<String, dynamic>))
                    .toList()
                : List.empty(),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<ProvinceModel>>?> getProvincesBy(
      int countryId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<ProvinceModel>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/province_filter_by_country/${countryId}',
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
        : BaseResponse<List<ProvinceModel>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<ProvinceModel>((i) =>
                        ProvinceModel.fromJson(i as Map<String, dynamic>))
                    .toList()
                : List.empty(),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<DistrictModel>>?> getDistrictsBy(
      int provinceId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<DistrictModel>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/district_filter_by_province/${provinceId}',
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
        : BaseResponse<List<DistrictModel>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<DistrictModel>((i) =>
                        DistrictModel.fromJson(i as Map<String, dynamic>))
                    .toList()
                : List.empty(),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<DistrictModel>>?> getAllDistricts() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<DistrictModel>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/district',
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
        : BaseResponse<List<DistrictModel>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<DistrictModel>((i) =>
                        DistrictModel.fromJson(i as Map<String, dynamic>))
                    .toList()
                : List.empty(),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<CommuneModel>>?> getCommuneBy(int districtId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<CommuneModel>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/commune_filter_by_district/${districtId}',
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
        : BaseResponse<List<CommuneModel>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<CommuneModel>(
                        (i) => CommuneModel.fromJson(i as Map<String, dynamic>))
                    .toList()
                : List.empty(),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<CommuneModel>>?> getAllCommunes() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<CommuneModel>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/commune',
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
        : BaseResponse<List<CommuneModel>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<CommuneModel>(
                        (i) => CommuneModel.fromJson(i as Map<String, dynamic>))
                    .toList()
                : List.empty(),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<MCooperative>>?> getCooperatives() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<MCooperative>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/cooperatives',
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
        : BaseResponse<List<MCooperative>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json
                    .map<MCooperative>(
                        (i) => MCooperative.fromJson(i as Map<String, dynamic>))
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
