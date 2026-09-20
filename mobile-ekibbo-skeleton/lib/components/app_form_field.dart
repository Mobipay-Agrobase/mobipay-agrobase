import 'package:flutter/material.dart';
import 'package:upstream/constant/color_constant.dart';
import 'package:upstream/constant/text_style_constant.dart';

class AppFormField extends StatelessWidget {
  const AppFormField({
    super.key,
    this.hint,
    this.suffixIcon,
    this.labelText,
    this.border,
    this.validator,
    this.fillColor,
    this.keyboardType,
    this.obscureText = false,
    this.controller,
    this.prefixIcon,
    this.maxLines = 1,
    this.contentPadding,
    this.onChanged,
  });
  final int? maxLines;
  final String? hint;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final String? labelText;
  final InputBorder? border;
  final String? Function(String?)? validator;
  final Color? fillColor;
  final TextInputType? keyboardType;
  final bool obscureText;
  final TextEditingController? controller;
  final EdgeInsetsGeometry? contentPadding;
  final Function(String)? onChanged;
  @override
  Widget build(BuildContext context) {
    return TextFormField(
      validator: validator,
      keyboardType: keyboardType,
      obscureText: obscureText,
      maxLines: maxLines,
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: prefixIcon,
        fillColor: fillColor ?? ColorConstant.grayF6F7F9,
        filled: true,
        labelText: labelText,
        suffixIcon: suffixIcon,
        contentPadding: contentPadding ??
            const EdgeInsets.only(top: 16, bottom: 16, left: 16),
        hintStyle:
            TextStyleConstant.worksansW500(color: ColorConstant.gray6C757D),
        border: border ??
            OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                style: BorderStyle.none,
              ),
            ),
        focusedBorder: border ??
            OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                style: BorderStyle.none,
              ),
            ),
        enabledBorder: border ??
            border ??
            OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                style: BorderStyle.none,
              ),
            ),
      ),
    );
  }
}
