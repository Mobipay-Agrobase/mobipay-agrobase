import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_dashboard.dart';
import 'package:agrobase_ekibbo/models/weather/weather_current.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/weather_screen.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class WeatherInfo extends StatelessWidget {
  const WeatherInfo({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: ApiDashboard.getTodayWeather(), // async work
      builder: (BuildContext context, snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.waiting:
            return const Center(
              child: AppCircularIndicator(
                color: ColorConstant.primary,
              ),
            );
          default:
            if (snapshot.hasError) {
              return const NoDataView();
            } else {
              if (snapshot.data == null) return const NoDataView();
              final data = snapshot.data as MWeather;
              return buildWeather(data);
            }
        }
      },
    );
  }

  buildWeather(MWeather weather) {
    return Container(
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
              "${weather.location.name}, ${weather.location.country}",
              style: TextStyleConstant.robotoW500(
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              DateHelper.convertDateToStr(
                  DateTime.fromMillisecondsSinceEpoch(
                      weather.current.lastUpdatedEpoch * 1000),
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
                  url: weather.current.condition.icon
                      .replaceFirst("//", "https://"),
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                ),
                const SizedBox(width: 10),
                Text(
                  "${weather.current.tempC}°C",
                  style: TextStyleConstant.robotoW700(
                    fontSize: 24,
                    color: ColorConstant.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 5),
            Text(
              "Feels Like ${weather.current.tempC}°C. ${weather.current.condition.text}",
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
                  "${weather.current.windKph} m/s N",
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
                          text: '${weather.current.windKph} m/s N',
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
                          text: '${weather.current.humidity}%',
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
                          text: '${weather.current.uv}',
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
                          text: '${weather.current.visKm}km',
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
            Align(
              alignment: Alignment.bottomRight,
              child: TextButton(
                  onPressed: () {
                    Navigator.of(NavigatorManager.contextRoot).push(
                      MaterialPageRoute(
                        builder: (context) => const WeatherScreen(),
                      ),
                    );
                  },
                  child: Text(
                    "View Details",
                    style: TextStyleConstant.robotoW400(
                      fontSize: 14,
                      color: ColorConstant.primary,
                    ),
                  )),
            ),
          ],
        ),
      ),
    );
  }
}
