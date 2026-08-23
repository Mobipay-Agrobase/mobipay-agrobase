import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:agrobase_ekibbo/components/option_bottom_dialog.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:url_launcher/url_launcher.dart';

class CommonHelper {
  static Future<XFile?> chooseImg({
    ImageSource imgSource = ImageSource.gallery,
    int? imageQuality,
  }) async {
    final ImagePicker picker = ImagePicker();
    final file = await picker.pickImage(
      source: imgSource,
      imageQuality: imageQuality,
    );
    return file;
  }

  static double convertSquaresMetToHec(double value) {
    return value / 10000;
  }

  static Future<XFile?> chooseImgOptions(
    BuildContext context, {
    int? imageQuality,
  }) async {
    final r = await showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      builder: (_) => OptionBottomDialog(
        title: AppLang.local.options,
        datas: [
          AppLang.local.camera,
          AppLang.local.gallery,
        ],
        itemSelected: '',
      ),
    );
    if (r != null) {
      if (r == 0) {
        return chooseImg(
          imgSource: ImageSource.camera,
          imageQuality: imageQuality,
        );
      } else {
        return chooseImg(
          imgSource: ImageSource.gallery,
          imageQuality: imageQuality,
        );
      }
    }
    return null;
  }

  static makePhoneCall(String phoneNumber) async {
    final uri = Uri(scheme: "tel", path: phoneNumber);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      throw 'Could not launch $uri';
    }
  }

  static Future<bool> isInternetAvailable() async {
    try {
      final foo = await InternetAddress.lookup('google.com');
      return foo.isNotEmpty && foo[0].rawAddress.isNotEmpty ? true : false;
    } catch (e) {
      return false;
    }
  }
}

extension ExtList on List {
  int? getIndex(bool Function(dynamic) test) {
    final index = indexWhere(test);
    if (index == -1) {
      return null;
    }
    return index;
  }
}

extension StringExtension on String {
  String toCapitalized() =>
      length > 0 ? '${this[0].toUpperCase()}${substring(1).toLowerCase()}' : '';
  String toTitleCase() => replaceAll(RegExp(' +'), ' ')
      .split(' ')
      .map((str) => str.toCapitalized())
      .join(' ');
}
