import 'package:flutter/material.dart';

class TextStyleConstant {
  static const workSans = 'WorkSans';
  static const roboto = 'Roboto';
  static const quicksand = 'Quicksand';

  static robotoW800({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
        fontFamily: roboto,
        fontSize: fontSize,
        color: color,
        fontWeight: FontWeight.w800);
  }

  static robotoW400({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: roboto,
      fontSize: fontSize,
      color: color,
    );
  }

  static robotoW500({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: roboto,
      fontWeight: FontWeight.w500,
      fontSize: fontSize,
      color: color,
    );
  }

  static robotoW600({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: roboto,
      fontSize: fontSize,
      color: color,
      fontWeight: FontWeight.w600,
    );
  }

  static worksansW500({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
        fontFamily: workSans,
        fontSize: fontSize,
        color: color,
        fontWeight: FontWeight.w500);
  }

  static quicksandW700({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: quicksand,
      fontSize: fontSize,
      color: color,
      fontWeight: FontWeight.w700,
    );
  }

  static quicksandW600({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: quicksand,
      fontSize: fontSize,
      color: color,
      fontWeight: FontWeight.w600,
    );
  }
}
