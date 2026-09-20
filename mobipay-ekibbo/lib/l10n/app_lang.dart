import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

class AppLang {
  static AppLocalizations get local =>
      AppLocalizations.of(navigatorKey.currentContext!)!;
}
