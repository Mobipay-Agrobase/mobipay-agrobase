import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/weather/weather_current.dart';
part 'weather_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class WeatherApiClient {
  factory WeatherApiClient(Dio dio, {String baseUrl}) = _WeatherApiClient;
  @GET(
      '/forecast.json?key=73fe9228c57347c78da84136232811&q=ho-chi-minh-city-vietnam&lang=vi&days=3')
  Future<MWeather> getTodayWeather();
}
