import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class ExpansionView extends StatefulWidget {
  const ExpansionView({
    super.key,
    this.children = const [],
    required this.title,
    this.initiallyExpanded = false,
  });
  final List<Widget> children;
  final String title;
  final bool initiallyExpanded;
  @override
  State<ExpansionView> createState() => _ExpansionViewState();
}

class _ExpansionViewState extends State<ExpansionView> {
  bool _customTileExpanded = false;
  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData().copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        initiallyExpanded: widget.initiallyExpanded,
        title: Text(
          widget.title,
          style: TextStyleConstant.robotoW800(
            color: ColorConstant.text79,
          ),
        ),
        collapsedIconColor: ColorConstant.text79,
        trailing: SvgPicture.asset(
            (_customTileExpanded ? 'ic_arrow_up' : 'ic_arrow_down').iconSvg),
        onExpansionChanged: (bool expanded) {
          setState(() {
            _customTileExpanded = expanded;
          });
        },
        children: widget.children,
      ),
    );
  }
}
