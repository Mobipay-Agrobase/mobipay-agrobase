import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_orther_info.dart';
import 'package:agrobase_ekibbo/models/weather/weather_current.dart';

class WeatherScreen extends StatelessWidget {
  const WeatherScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: const CustomAppBar(
          title: "Weather Forecast",
        ),
        body: ListView(
          children: DOrtherInfo.instance.weather!.forecast.forecastday
              .map((e) => buildWeather(e))
              .toList(),
        ),
      ),
    );
  }

  Widget buildWeather(MForecastday weather) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              offset: const Offset(4, 4),
              blurRadius: 15,
              color: Colors.black.withOpacity(0.15),
            )
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                DateHelper.convertDateToStr(
                    DateTime.fromMillisecondsSinceEpoch(
                        weather.dateEpoch * 1000),
                    format: "yMMMMd"),
                style: TextStyleConstant.robotoW400(
                  fontSize: 14,
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  GInternetImage(
                    url: weather.day.condition.icon
                        .replaceFirst("//", "https://"),
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    "${weather.day.avgtempC}°C",
                    style: TextStyleConstant.robotoW700(
                      fontSize: 24,
                      color: ColorConstant.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                "Feels Like ${weather.day.avgtempC}°C. ${weather.day.condition.text}",
                style: TextStyleConstant.robotoW500(
                  fontSize: 14,
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  SvgPicture.asset(
                    'ic_wind_direction'.iconSvg,
                    height: 20,
                    color: ColorConstant.gray6C757D,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    "${weather.day.maxwindMph} m/s N",
                    style: TextStyleConstant.robotoW400(
                      fontSize: 14,
                      color: ColorConstant.text79,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SvgPicture.asset(
                    'ic_pressure'.iconSvg,
                    height: 20,
                    color: ColorConstant.gray6C757D,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: '${weather.day.maxwindMph} m/s N',
                            style: TextStyleConstant.robotoW400(
                              fontSize: 14,
                              color: ColorConstant.text79,
                            ),
                          ),
                          TextSpan(
                            text: " | Humidity: ",
                            style: TextStyleConstant.robotoW600(
                              fontSize: 12,
                              color: ColorConstant.text79,
                            ),
                          ),
                          TextSpan(
                            text: '${weather.day.avghumidity}%',
                            style: TextStyleConstant.robotoW400(
                              fontSize: 14,
                              color: ColorConstant.text79,
                            ),
                          ),
                          TextSpan(
                            text: " | UV: ",
                            style: TextStyleConstant.robotoW600(
                              fontSize: 12,
                              color: ColorConstant.text79,
                            ),
                          ),
                          TextSpan(
                            text: '${weather.day.uv}',
                            style: TextStyleConstant.robotoW400(
                              fontSize: 14,
                              color: ColorConstant.text79,
                            ),
                          ),
                          TextSpan(
                            text: " | Visibility: ",
                            style: TextStyleConstant.robotoW600(
                              fontSize: 12,
                              color: ColorConstant.text79,
                            ),
                          ),
                          TextSpan(
                            text: '${weather.day.avgvisKm}km',
                            style: TextStyleConstant.robotoW400(
                              fontSize: 14,
                              color: ColorConstant.text79,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              const Divider(),
              const SizedBox(height: 5),
              Row(
                children: [
                  Expanded(
                      child: buildInfoTermC("Morning", weather.day.mintempC)),
                  Expanded(
                      child: buildInfoTermC("Afternoon", weather.day.maxtempC)),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                      child: buildInfoTermC("Evening", weather.day.maxtempC)),
                  Expanded(
                      child: buildInfoTermC("Night", weather.day.mintempC)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildInfoTermC(String title, double tempC) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyleConstant.robotoW600(
            fontSize: 16,
            color: ColorConstant.gray6C757D,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          "$tempC°C",
          style: TextStyleConstant.robotoW400(
            fontSize: 14,
            color: ColorConstant.text79,
          ),
        ),
      ],
    );
  }
}
