// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farmer_api_client.dart';

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers

class _FarmerApiClient implements FarmerApiClient {
  _FarmerApiClient(
    this._dio, {
    this.baseUrl,
  });

  final Dio _dio;

  String? baseUrl;

  @override
  Future<BaseResponse<DropdownRegisterModel>?> getDropDownForRegister() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<DropdownRegisterModel>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/drop_down_for_register',
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
        : BaseResponse<DropdownRegisterModel>.fromJson(
            _result.data!,
            (json) =>
                DropdownRegisterModel.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> registerFarmer(FormData data) async {
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
              '/farmer/registration',
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
  Future<BaseResponse<AllFarmerResponse>?> getAllFarmers(
    int? page,
    String search,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'page': page,
      r'search': search,
    };
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<AllFarmerResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer',
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
        : BaseResponse<AllFarmerResponse>.fromJson(
            _result.data!,
            (json) => AllFarmerResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<FarmerDetailResponse>?> getFarmer(
    int id,
    int has,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{r'whereHasCultivation': has};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<FarmerDetailResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/${id}',
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
        : BaseResponse<FarmerDetailResponse>.fromJson(
            _result.data!,
            (json) =>
                FarmerDetailResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<FarmerDetailResponse>?> getFarmerByRoleFarmer() async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<FarmerDetailResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer-detail',
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
        : BaseResponse<FarmerDetailResponse>.fromJson(
            _result.data!,
            (json) =>
                FarmerDetailResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<FarmerSearchResponse>?> searchFarmer(String name) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<FarmerSearchResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer-search/${name}',
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
        : BaseResponse<FarmerSearchResponse>.fromJson(
            _result.data!,
            (json) =>
                FarmerSearchResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<AllFarmerResponse>?> searchFarmerDistribution(
    int cooperativeId,
    String provinceId,
    String communeId,
    String search,
    int perPage,
    int has,
    int page,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'cooperative_id': cooperativeId,
      r'province': provinceId,
      r'commune': communeId,
      r'search': search,
      r'per_page': perPage,
      r'whereHasCultivation': has,
      r'page': page,
    };
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<AllFarmerResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer',
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
        : BaseResponse<AllFarmerResponse>.fromJson(
            _result.data!,
            (json) => AllFarmerResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<FarmerModel>?> updateFarmer(FormData data) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<FarmerModel>>(Options(
      method: 'POST',
      headers: _headers,
      extra: _extra,
      contentType: 'multipart/form-data',
    )
            .compose(
              _dio.options,
              '/farmer/update_personal_info',
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
        : BaseResponse<FarmerModel>.fromJson(
            _result.data!,
            (json) => FarmerModel.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<FamilyInfoResponse>?> getFamilyInfo(int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<FamilyInfoResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/get_data_for_family_info/${farmerId}',
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
        : BaseResponse<FamilyInfoResponse>.fromJson(
            _result.data!,
            (json) => FamilyInfoResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateFamilyInfo(
    int farmerId,
    dynamic data,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'PUT',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/update_family_info/${farmerId}',
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
  Future<BaseResponse<AssetInfoResponse>?> getAssetInfo(int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<AssetInfoResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/get_data_for_asset_info/${farmerId}',
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
        : BaseResponse<AssetInfoResponse>.fromJson(
            _result.data!,
            (json) => AssetInfoResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateAssetInfo(
    int farmerId,
    dynamic data,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'PUT',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/update_asset_info/${farmerId}',
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
  Future<BaseResponse<BankInfoResponse>?> getBankInfo(int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<BankInfoResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/get_data_for_bank_info/${farmerId}',
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
        : BaseResponse<BankInfoResponse>.fromJson(
            _result.data!,
            (json) => BankInfoResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateBankInfo(
    int farmerId,
    dynamic data,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'PUT',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/update_bank_info/${farmerId}',
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
  Future<BaseResponse<FinanceInfoResponse>?> getFinanceInfo(
      int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<FinanceInfoResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/get_data_for_finance_info/${farmerId}',
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
        : BaseResponse<FinanceInfoResponse>.fromJson(
            _result.data!,
            (json) =>
                FinanceInfoResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateFinanceInfo(
    int farmerId,
    dynamic data,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'PUT',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/update_finance_info/${farmerId}',
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
  Future<BaseResponse<FarmEquipmentResponse>?> getFarmEquipment(
      int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<FarmEquipmentResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/get_data_for_farm_equipment/${farmerId}',
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
        : BaseResponse<FarmEquipmentResponse>.fromJson(
            _result.data!,
            (json) =>
                FarmEquipmentResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateFarmEquipment(
    int farmerId,
    dynamic data,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'PUT',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/update_farm_equipment/${farmerId}',
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
  Future<BaseResponse<AnimalHusbandryResponse>?> getAnimalHusbandry(
      int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<AnimalHusbandryResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/get_data_for_animal_husbandry/${farmerId}',
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
        : BaseResponse<AnimalHusbandryResponse>.fromJson(
            _result.data!,
            (json) =>
                AnimalHusbandryResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateAnimalHusbandry(
    int farmerId,
    dynamic data,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'PUT',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/update_animal_husbandry/${farmerId}',
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
  Future<BaseResponse<InsuranceInfoResponse>?> getInsuranceData(
      int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<InsuranceInfoResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/get_data_for_insurance_info/${farmerId}',
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
        : BaseResponse<InsuranceInfoResponse>.fromJson(
            _result.data!,
            (json) =>
                InsuranceInfoResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateInsuranceData(
    int farmerId,
    dynamic data,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'PUT',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/update_insurance_info/${farmerId}',
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
  Future<BaseResponse<CertificateResponse>?> getCertificateInfo(
      int farmerId) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final Map<String, dynamic>? _data = null;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<CertificateResponse>>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/get_data_for_certificate_info/${farmerId}',
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
        : BaseResponse<CertificateResponse>.fromJson(
            _result.data!,
            (json) =>
                CertificateResponse.fromJson(json as Map<String, dynamic>),
          );
    return value;
  }

  @override
  Future<BaseResponse<dynamic>?> updateCertificateInfo(
    int farmerId,
    dynamic data,
  ) async {
    const _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = data;
    final _result = await _dio.fetch<Map<String, dynamic>?>(
        _setStreamType<BaseResponse<dynamic>>(Options(
      method: 'PUT',
      headers: _headers,
      extra: _extra,
    )
            .compose(
              _dio.options,
              '/farmer/update_certificate/${farmerId}',
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
