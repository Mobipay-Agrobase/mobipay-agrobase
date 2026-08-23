import 'dart:io';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
//import 'package:flutter_easyloading/flutter_easyloading.dart';

class DialogHelper {
  static Future<void> showOkDialog(
    BuildContext context,
    String msg, {
    bool isCancel = false,
    String? titleCancel,
    String? titleOK,
    Function()? okAction,
  }) {
    if (Platform.isAndroid) {
      return _showAndroidOkDialog(
        context,
        msg,
        okAction: okAction,
        titleOK: titleOK,
        isCancel: isCancel,
        titleCancel: titleCancel,
      );
    }
    return _showIosOKDialog(
      context,
      msg,
      okAction: okAction,
      isCancel: isCancel,
      titleCancel: titleCancel,
    );
  }

  static Future<void> _showIosOKDialog(
    BuildContext context,
    String msg, {
    String? titleCancel,
    bool isCancel = false,
    String? titleOK,
    Function()? okAction,
  }) {
    var actions = [
      CupertinoDialogAction(
        child: Text(
          titleOK ?? 'Ok',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        onPressed: () {
          Navigator.of(context).pop();
          if (okAction != null) {
            okAction();
          }
        },
      )
    ];
    if (isCancel) {
      actions.add(
        CupertinoDialogAction(
          isDestructiveAction: true,
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: Text(
            titleCancel ?? 'Cancel',
            style: const TextStyle(fontWeight: FontWeight.w400),
          ),
        ),
      );
    }
    return showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('Notice'),
        content: Text(msg),
        actions: actions,
      ),
    );
  }

  static Future<void> _showAndroidOkDialog(
    BuildContext context,
    String msg, {
    bool isCancel = false,
    String? titleCancel,
    String? titleOK,
    Function()? okAction,
  }) {
    var actions = [
      TextButton(
        child: Text(
          titleOK ?? "OK",
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        onPressed: () {
          Navigator.of(context).pop();
          if (okAction != null) {
            okAction();
          }
        },
      )
    ];
    if (isCancel) {
      actions.add(
        TextButton(
          child: Text(
            titleCancel ?? 'Cancel',
            style: const TextStyle(fontWeight: FontWeight.w400),
          ),
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
      );
    }

    // set up the AlertDialog
    AlertDialog alert = AlertDialog(
      title: const Text('Thông báo'),
      content: Text(msg),
      actions: actions,
    );

    // show the dialog
    return showDialog(
      context: context,
      builder: (BuildContext context) {
        return alert;
      },
    );
  }

  static showToast(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.grey,
      ),
    );
  }

  static showToastSuccess(BuildContext context, {String? message}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message ?? 'Action Successful',
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.green,
      ),
    );
  }

  static showToastError(BuildContext context, {String? message}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message ?? 'Action Unsuccessful',
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.orange,
      ),
    );
  }

  static void showLoading() {
    // EasyLoading.show(
    //   maskType: EasyLoadingMaskType.black,
    // );
  }

  static void hideLoading() {
    //EasyLoading.dismiss();
  }
}
