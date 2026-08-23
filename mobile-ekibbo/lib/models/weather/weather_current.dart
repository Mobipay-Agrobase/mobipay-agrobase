class MWeather {
  final MLocation location;
  final MCurrent current;
  final MForecast forecast;

  MWeather({
    required this.location,
    required this.current,
    required this.forecast,
  });

  factory MWeather.fromJson(Map<String, dynamic> json) {
    return MWeather(
      location:
          MLocation?.fromJson((json['location'] ?? {}) as Map<String, dynamic>),
      current:
          MCurrent?.fromJson((json['current'] ?? {}) as Map<String, dynamic>),
      forecast:
          MForecast?.fromJson((json['forecast'] ?? {}) as Map<String, dynamic>),
    );
  }
}

class MLocation {
  final String name;
  final String region;
  final String country;
  final double lat;
  final double lon;
  final String tzId;
  final int localtimeEpoch;
  final String localtime;

  MLocation({
    required this.name,
    required this.region,
    required this.country,
    required this.lat,
    required this.lon,
    required this.tzId,
    required this.localtimeEpoch,
    required this.localtime,
  });

  factory MLocation.fromJson(Map<String, dynamic> json) {
    return MLocation(
      name: json['name'] ?? '',
      region: json['region'] ?? '',
      country: json['country'] ?? '',
      lat: ((json['lat'] ?? 0.0) as num).toDouble(),
      lon: ((json['lon'] ?? 0.0) as num).toDouble(),
      tzId: json['tz_id'] ?? '',
      localtimeEpoch: json['localtime_epoch'] ?? 0,
      localtime: json['localtime'] ?? '',
    );
  }
}

class MCurrent {
  final int lastUpdatedEpoch;
  final String lastUpdated;
  final double tempC;
  final double tempF;
  final int isDay;
  final MCondition condition;
  final double windMph;
  final double windKph;
  final double windDegree;
  final String windDir;
  final double pressureMb;
  final double pressureIn;
  final double precipMm;
  final double precipIn;
  final double humidity;
  final double cloud;
  final double feelslikeC;
  final double feelslikeF;
  final double visKm;
  final double visMiles;
  final double uv;
  final double gustMph;
  final double gustKph;

  MCurrent({
    required this.lastUpdatedEpoch,
    required this.lastUpdated,
    required this.tempC,
    required this.tempF,
    required this.isDay,
    required this.condition,
    required this.windMph,
    required this.windKph,
    required this.windDegree,
    required this.windDir,
    required this.pressureMb,
    required this.pressureIn,
    required this.precipMm,
    required this.precipIn,
    required this.humidity,
    required this.cloud,
    required this.feelslikeC,
    required this.feelslikeF,
    required this.visKm,
    required this.visMiles,
    required this.uv,
    required this.gustMph,
    required this.gustKph,
  });

  factory MCurrent.fromJson(Map<String, dynamic> json) {
    return MCurrent(
      lastUpdatedEpoch: json['last_updated_epoch'] ?? 0,
      lastUpdated: json['last_updated'] ?? '',
      tempC: ((json['temp_c'] ?? 0.0) as num).toDouble(),
      tempF: ((json['temp_f'] ?? 0.0) as num).toDouble(),
      isDay: json['is_day'] ?? 0,
      condition: MCondition?.fromJson(
          (json['condition'] ?? {}) as Map<String, dynamic>),
      windMph: ((json['wind_mph'] ?? 0.0) as num).toDouble(),
      windKph: ((json['wind_kph'] ?? 0.0) as num).toDouble(),
      windDegree: ((json['wind_degree'] ?? 0.0) as num).toDouble(),
      windDir: json['wind_dir'] ?? '',
      pressureMb: ((json['pressure_mb'] ?? 0.0) as num).toDouble(),
      pressureIn: ((json['pressure_in'] ?? 0.0) as num).toDouble(),
      precipMm: ((json['precip_mm'] ?? 0.0) as num).toDouble(),
      precipIn: ((json['precip_in'] ?? 0.0) as num).toDouble(),
      humidity: ((json['humidity'] ?? 0.0) as num).toDouble(),
      cloud: ((json['cloud'] ?? 0.0) as num).toDouble(),
      feelslikeC: ((json['feelslike_c'] ?? 0.0) as num).toDouble(),
      feelslikeF: ((json['feelslike_f'] ?? 0.0) as num).toDouble(),
      visKm: ((json['vis_km'] ?? 0.0) as num).toDouble(),
      visMiles: ((json['vis_miles'] ?? 0.0) as num).toDouble(),
      uv: ((json['uv'] ?? 0.0) as num).toDouble(),
      gustMph: ((json['gust_mph'] ?? 0.0) as num).toDouble(),
      gustKph: ((json['gust_kph'] ?? 0.0) as num).toDouble(),
    );
  }
}

class MForecast {
  final List<MForecastday> forecastday;

  MForecast({
    required this.forecastday,
  });

  factory MForecast.fromJson(Map<String, dynamic> json) {
    return MForecast(
      forecastday: List<MForecastday>.from(
        ((json['forecastday'] ?? []) as List<dynamic>).map<MForecastday>(
          (x) => MForecastday.fromJson(x as Map<String, dynamic>),
        ),
      ),
    );
  }
}

class MCondition {
  final String text;
  final String icon;
  final int code;

  MCondition({
    required this.text,
    required this.icon,
    required this.code,
  });

  factory MCondition.fromJson(Map<String, dynamic> json) {
    return MCondition(
      text: json['text'] ?? '',
      icon: json['icon'] ?? '',
      code: json['code'] ?? 0,
    );
  }
}

class MForecastday {
  final String date;
  final int dateEpoch;
  final MDay day;

  MForecastday({
    required this.date,
    required this.dateEpoch,
    required this.day,
  });

  factory MForecastday.fromJson(Map<String, dynamic> json) {
    return MForecastday(
      date: json['date'] ?? '',
      dateEpoch: json['date_epoch'] ?? 0,
      day: MDay?.fromJson((json['day'] ?? {}) as Map<String, dynamic>),
    );
  }
}

class MDay {
  final double maxtempC;
  final double maxtempF;
  final double mintempC;
  final double mintempF;
  final double avgtempC;
  final double avgtempF;
  final double maxwindMph;
  final double maxwindKph;
  final double totalprecipMm;
  final double totalprecipIn;
  final double totalsnowCm;
  final double avgvisKm;
  final double avgvisMiles;
  final double avghumidity;
  final double dailyWillItRain;
  final double dailyChanceOfRain;
  final double dailyWillItSnow;
  final double dailyChanceOfSnow;
  final MCondition condition;
  final double uv;

  MDay({
    required this.maxtempC,
    required this.maxtempF,
    required this.mintempC,
    required this.mintempF,
    required this.avgtempC,
    required this.avgtempF,
    required this.maxwindMph,
    required this.maxwindKph,
    required this.totalprecipMm,
    required this.totalprecipIn,
    required this.totalsnowCm,
    required this.avgvisKm,
    required this.avgvisMiles,
    required this.avghumidity,
    required this.dailyWillItRain,
    required this.dailyChanceOfRain,
    required this.dailyWillItSnow,
    required this.dailyChanceOfSnow,
    required this.condition,
    required this.uv,
  });

  factory MDay.fromJson(Map<String, dynamic> json) {
    return MDay(
      maxtempC: ((json['maxtemp_c'] ?? 0.0) as num).toDouble(),
      maxtempF: ((json['maxtemp_f'] ?? 0.0) as num).toDouble(),
      mintempC: ((json['mintemp_c'] ?? 0.0) as num).toDouble(),
      mintempF: ((json['mintemp_f'] ?? 0.0) as num).toDouble(),
      avgtempC: ((json['avgtemp_c'] ?? 0.0) as num).toDouble(),
      avgtempF: ((json['avgtemp_f'] ?? 0.0) as num).toDouble(),
      maxwindMph: ((json['maxwind_mph'] ?? 0.0) as num).toDouble(),
      maxwindKph: ((json['maxwind_kph'] ?? 0.0) as num).toDouble(),
      totalprecipMm: ((json['totalprecip_mm'] ?? 0.0) as num).toDouble(),
      totalprecipIn: ((json['totalprecip_in'] ?? 0.0) as num).toDouble(),
      totalsnowCm: ((json['totalsnow_cm'] ?? 0.0) as num).toDouble(),
      avgvisKm: ((json['avgvis_km'] ?? 0.0) as num).toDouble(),
      avgvisMiles: ((json['avgvis_miles'] ?? 0.0) as num).toDouble(),
      avghumidity: ((json['avghumidity'] ?? 0.0) as num).toDouble(),
      dailyWillItRain: ((json['daily_will_it_rain'] ?? 0.0) as num).toDouble(),
      dailyChanceOfRain:
          ((json['daily_chance_of_rain'] ?? 0.0) as num).toDouble(),
      dailyWillItSnow: ((json['daily_will_it_snow'] ?? 0.0) as num).toDouble(),
      dailyChanceOfSnow:
          ((json['daily_chance_of_snow'] ?? 0.0) as num).toDouble(),
      condition: MCondition?.fromJson(
          (json['condition'] ?? {}) as Map<String, dynamic>),
      uv: ((json['uv'] ?? 0.0) as num).toDouble(),
    );
  }
}
