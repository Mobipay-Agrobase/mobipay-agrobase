class TimezoneLocal {
  static bool get isOffsetPlus {
    DateTime dateTime = DateTime.now();
    return dateTime.timeZoneName[0] == "+";
  }

  static int get getOffsetHour {
    DateTime dateTime = DateTime.now();
    return dateTime.timeZoneOffset.inHours;
  }

  static int get getOffsetMinutes {
    DateTime dateTime = DateTime.now();
    return dateTime.timeZoneOffset.inMinutes;
  }

  static int get getOffsetSeconds {
    DateTime dateTime = DateTime.now();
    return dateTime.timeZoneOffset.inSeconds;
  }

  static int get getOffsetMilliseconds {
    DateTime dateTime = DateTime.now();
    return dateTime.timeZoneOffset.inMilliseconds;
  }
}
