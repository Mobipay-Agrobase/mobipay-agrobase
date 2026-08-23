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

  Future<BaseResponse<List<T>>?> _fetchList<T>(
    String type,
    Object? parentId,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{'type': type};
    if (parentId != null) queryParameters['parentId'] = parentId;
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<List<T>>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/mobile/ekibbo-geo',
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
        : BaseResponse<List<T>>.fromJson(
            _result.data!,
            (json) => json is List<dynamic>
                ? json.map<T>((i) => fromJson(i as Map<String, dynamic>)).toList()
                : List.empty(),
          );
    return value;
  }

  @override
  Future<BaseResponse<List<CountryModel>>?> getCountries(String type) async {
    return _fetchList<CountryModel>(type, null, CountryModel.fromJson);
  }

  @override
  Future<BaseResponse<List<ProvinceModel>>?> getAllProvinces(String type) async {
    return _fetchList<ProvinceModel>(type, null, ProvinceModel.fromJson);
  }

  @override
  Future<BaseResponse<List<ProvinceModel>>?> getProvincesBy(
      String type, int countryId) async {
    return _fetchList<ProvinceModel>(type, countryId, ProvinceModel.fromJson);
  }

  @override
  Future<BaseResponse<List<DistrictModel>>?> getDistrictsBy(
      String type, int provinceId) async {
    return _fetchList<DistrictModel>(type, provinceId, DistrictModel.fromJson);
  }

  @override
  Future<BaseResponse<List<DistrictModel>>?> getAllDistricts(String type) async {
    return _fetchList<DistrictModel>(type, null, DistrictModel.fromJson);
  }

  @override
  Future<BaseResponse<List<CommuneModel>>?> getCommuneBy(
      String type, int districtId) async {
    return _fetchList<CommuneModel>(type, districtId, CommuneModel.fromJson);
  }

  @override
  Future<BaseResponse<List<CommuneModel>>?> getAllCommunes(String type) async {
    return _fetchList<CommuneModel>(type, null, CommuneModel.fromJson);
  }

  @override
  Future<BaseResponse<List<MCooperative>>?> getCooperatives(String type) async {
    return _fetchList<MCooperative>(type, null, MCooperative.fromJson);
  }
}
