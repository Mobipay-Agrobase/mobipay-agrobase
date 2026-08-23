import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class InputNextData extends StatefulWidget {
  const InputNextData({
    super.key,
    required this.hintText,
    required this.errorText,
    required this.initValue,
    required this.onChange,
    this.readOnly = false,
  });

  final String hintText;
  final String errorText;
  final String initValue;
  final Function onChange;
  final bool readOnly;

  @override
  State<InputNextData> createState() => _InputNextDataState();
}

class _InputNextDataState extends State<InputNextData> {
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        if(widget.readOnly) return;
        widget.onChange();
      },
      child: Container(
        height: 45,
        decoration: BoxDecoration(
          color: ColorConstant.grayF7F8FA,
          borderRadius: BorderRadius.circular(8),
          border: widget.errorText.isNotEmpty
              ? Border.all(color: Colors.red)
              : null,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: widget.initValue.isEmpty
                    ? _buildHintText()
                    : _buildMainText(),
              ),
              _buildIconSuffix(),
            ],
          ),
        ),
      ),
    );
  }

  _buildMainText() {
    return Text(
      widget.initValue,
      style: TextStyleConstant.worksansW500()
          .copyWith(color: widget.readOnly ? ColorConstant.gray6C757D : null),
    );
  }

  _buildHintText() {
    return Text(
      widget.hintText,
      style: TextStyleConstant.worksansW500(color: ColorConstant.gray6C757D),
    );
  }

  _buildIconSuffix() {
    return SvgPicture.asset(
      'assets/icons/ic_caret_up.svg',
      color: ColorConstant.gray6C757D,
    );
  }
}
