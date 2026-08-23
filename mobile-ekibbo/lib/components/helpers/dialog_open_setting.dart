import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

Future showDialogSetting(Function onPressed) {
  return showDialog(
    context: NavigatorManager.contextRoot,
    barrierDismissible: false,
    builder: (BuildContext context) {
      return AlertDialog(
        content: contentDialogSetting(onPressed),
      );
    },
  );
}

Widget contentDialogSetting(Function onPressed) {
  return SizedBox(
    height: 250,
    child: Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                AppLang.local.permission_required,
                style: TextStyleConstant.robotoW600(fontSize: 16),
              ),
            ),
            InkWell(
              onTap: () => NavigatorManager.pop(),
              child: const SizedBox(
                height: 50,
                width: 50,
                child: Icon(Icons.close),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Expanded(
          child: Text(AppLang.local.permission_content),
        ),
        AppButton(
          onTap: () {
            onPressed();
            NavigatorManager.pop();
          },
          title: AppLang.local.go_to_settings,
          height: 46,
        ),
      ],
    ),
  );
}
