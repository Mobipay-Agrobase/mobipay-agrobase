import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

Future showDialogLogs() {
  return showDialog(
    context: NavigatorManager.contextRoot,
    //barrierDismissible: false,
    builder: (BuildContext context) {
      return AlertDialog(
        content: contentLogs(),
      );
    },
  );
}

Widget contentLogs() {
  return SizedBox(
    height: 250,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Domain using",
          style: TextStyleConstant.robotoW600(fontSize: 16),
        ),
        const SizedBox(height: 20),
        Text("${ApiProvider.instance.showLogs()}")
      ],
    ),
  );
}
