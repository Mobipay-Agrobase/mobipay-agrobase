import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class AppLang {
  static AppLocalizations get local =>
      AppLocalizations.of(NavigatorManager.navigatorKey.currentContext!)!;
}
