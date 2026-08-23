import 'package:flutter/material.dart';

class TextStyleConstant {
  static const workSans = 'WorkSans';
  static const roboto = 'Roboto';
  static const quicksand = 'Quicksand';

  static TextStyle robotoW800({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
        fontFamily: roboto,
        fontSize: fontSize,
        color: color,
        fontWeight: FontWeight.w800);
  }

  static TextStyle robotoW400({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: roboto,
      fontSize: fontSize,
      color: color,
    );
  }

  static TextStyle robotoW500({
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

  static TextStyle robotoW600({
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

  static TextStyle robotoW700({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: roboto,
      fontSize: fontSize,
      color: color,
      fontWeight: FontWeight.w700,
    );
  }

  static TextStyle worksansW500({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
        fontFamily: workSans,
        fontSize: fontSize,
        color: color,
        fontWeight: FontWeight.w500);
  }

  static TextStyle worksansW600({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
        fontFamily: workSans,
        fontSize: fontSize,
        color: color,
        fontWeight: FontWeight.w600);
  }

  static TextStyle quicksandW400({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: quicksand,
      fontSize: fontSize,
      color: color,
    );
  }

  static TextStyle quicksandW700({
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

  static TextStyle quicksandW600({
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

  static TextStyle quicksandW500({
    double fontSize = 14,
    Color color = Colors.black,
  }) {
    return TextStyle(
      fontFamily: quicksand,
      fontSize: fontSize,
      color: color,
      fontWeight: FontWeight.w500,
    );
  }
}
