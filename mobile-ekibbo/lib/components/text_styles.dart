import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';

class TextStyles {
  static TextStyle buildAppBarTexStyle() {
    return const TextStyle(
      fontSize: 16,
      color: Colors.black,
      fontWeight: FontWeight.w600,
    );
  }

  static TextStyle largeTitleTexStyle({Color? color}) {
    return TextStyle(
        fontSize: 16,
        color: color ?? ColorConstant.darkFontGrey,
        fontWeight: FontWeight.w700);
  }

  static TextStyle get smallTitleTexStyle {
    return const TextStyle(
        fontSize: 14,
        color: ColorConstant.darkFontGrey,
        fontWeight: FontWeight.w700);
  }

  static TextStyle get verySmallTitleTexStyle => const TextStyle(
      fontSize: 10,
      color: ColorConstant.darkFontGrey,
      fontWeight: FontWeight.normal);

  static TextStyle largeBoldAccentTexStyle() {
    return const TextStyle(
        fontSize: 16,
        color: ColorConstant.primary,
        fontWeight: FontWeight.w700);
  }

  static TextStyle smallBoldAccentTexStyle() {
    return const TextStyle(
        fontSize: 13,
        color: ColorConstant.primary,
        fontWeight: FontWeight.w700);
  }

  static TextStyle robotoW600({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: FontConstant.roboto,
      fontWeight: FontWeight.w600,
      color: color,
      fontSize: fontSize,
    );
  }

  static TextStyle robotoW700({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: FontConstant.roboto,
      fontWeight: FontWeight.w700,
      color: color,
      fontSize: fontSize,
    );
  }

  static TextStyle robotoW500({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: FontConstant.roboto,
      fontWeight: FontWeight.w500,
      color: color,
      fontSize: fontSize,
    );
  }

  static TextStyle robotoW400({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: FontConstant.roboto,
      color: color,
      fontSize: fontSize,
    );
  }

  static TextStyle quicksandW600({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontWeight: FontWeight.w600,
      color: color,
      fontSize: fontSize,
    );
  }

  static TextStyle quicksandW700({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontWeight: FontWeight.w600,
      color: color,
      fontSize: fontSize,
    );
  }

  static TextStyle quicksandW500({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontWeight: FontWeight.w600,
      color: color,
      fontSize: fontSize,
    );
  }

  static TextStyle appbarText() {
    return TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.bold,
        color: ColorConstant.fontGrey);
  }

  static TextStyle smallFontSize() {
    return const TextStyle(
        fontSize: 12, color: Colors.grey, fontWeight: FontWeight.normal);
  }
}

class FontConstant {
  static const roboto = 'Roboto';
}
