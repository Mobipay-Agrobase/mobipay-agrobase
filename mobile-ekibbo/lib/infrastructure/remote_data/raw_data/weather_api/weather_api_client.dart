import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/weather/weather_current.dart';
part 'weather_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class WeatherApiClient {
  factory WeatherApiClient(Dio dio, {String baseUrl}) = _WeatherApiClient;

  /// Ekibbo operates in Uganda — default forecast location Kampala.
  /// Override at build time:
  ///   --dart-define=AGROBASE_WEATHER_KEY=... --dart-define=AGROBASE_WEATHER_Q=mukono-uganda
  @GET(
      '/forecast.json?key=${String.fromEnvironment('AGROBASE_WEATHER_KEY', defaultValue: '73fe9228c57347c78da84136232811')}&q=${String.fromEnvironment('AGROBASE_WEATHER_Q', defaultValue: 'kampala-uganda')}&lang=en&days=3')
  Future<MWeather> getTodayWeather();
}
