import 'package:intl/intl.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

bool isNumber(String text) {
  return RegExp('^[0-9]+\$').hasMatch(text);
}

String capitalize(String text) {
  return toBeginningOfSentenceCase(text) ?? text;
}

Map<String, String> get commonHeader => {
      "Accept": "*/*",
      "Content-Type": "application/json",
      "App-Language": SharedPreferencesProvider.instance.appLang,
    };

Map<String, String> get authHeader => SharedPreferencesProvider.instance.accessToken.isEmpty
    ? {}
    : {"Authorization": "Bearer ${SharedPreferencesProvider.instance.accessToken}"};
