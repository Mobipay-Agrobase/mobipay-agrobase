import 'package:flutter/material.dart';
import 'package:toast/toast.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class AppToast {
  static showDialog(String msg, {duration = 3, gravity = 0}) {
    ToastContext().init(NavigatorManager.contextRoot);
    Toast.show(msg,
        duration: duration != 0 ? duration : Toast.lengthShort,
        gravity: gravity != 0 ? gravity : Toast.bottom,
        backgroundColor: ColorConstant.grayF6F7F9,
        textStyle: const TextStyle(color: ColorConstant.fontGrey),
        border: const Border(
            top: BorderSide(
              color: Color.fromRGBO(203, 209, 209, 1),
            ),
            bottom: BorderSide(
              color: Color.fromRGBO(203, 209, 209, 1),
            ),
            right: BorderSide(
              color: Color.fromRGBO(203, 209, 209, 1),
            ),
            left: BorderSide(
              color: Color.fromRGBO(203, 209, 209, 1),
            )),
        backgroundRadius: 6);
  }
}
