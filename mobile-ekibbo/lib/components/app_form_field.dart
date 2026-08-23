import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/presentation/carbon/screens/note_dialog.dart';

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
    this.readOnly = false,
    this.autofocus = false,
    this.onChanged,
    this.description,
    this.isShowInfo = false,
    this.initialValue,
    this.onEditingComplete,
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
  final Function()? onEditingComplete;
  final bool readOnly;
  final bool autofocus;
  final bool isShowInfo;
  final String? description;
  final String? initialValue;
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextFormField(
            validator: validator,
            autofocus: autofocus,
            keyboardType: keyboardType,
            obscureText: obscureText,
            maxLines: maxLines,
            controller: controller,
            onChanged: onChanged,
            readOnly: readOnly,
            initialValue: initialValue,
            style: TextStyle(color: readOnly ? ColorConstant.gray6C757D : null),
            onEditingComplete: onEditingComplete,
            decoration: InputDecoration(
              hintText: hint,
              prefixIcon: prefixIcon,
              fillColor: fillColor ?? ColorConstant.grayF6F7F9,
              filled: true,
              labelText: labelText ?? hint,
              suffixIcon: suffixIcon,
              contentPadding: contentPadding ??
                  const EdgeInsets.only(top: 16, bottom: 16, left: 16),
              labelStyle: TextStyleConstant.worksansW500(
                  color: ColorConstant.gray6C757D),
              hintStyle: TextStyleConstant.worksansW500(
                  color: ColorConstant.gray6C757D),
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
          ),
        ),
        if (isShowInfo)
          InkWell(
            onTap: () => showDialog(
              context: context,
              builder: (_) => NoteDialog(
                title: labelText ?? '',
                description: description ?? '',
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.only(left: 16),
              child: SvgPicture.asset('ic_info'.iconSvg),
            ),
          )
      ],
    );
  }
}
