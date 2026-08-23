import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class MenuTabView extends StatefulWidget {
  const MenuTabView({
    super.key,
    required this.datas,
    this.onChanged,
    this.isEqual = false,
  });
  final List<String> datas;
  final Function(int)? onChanged;
  final bool isEqual;
  @override
  State<MenuTabView> createState() => _MenuTabViewState();
}

class _MenuTabViewState extends State<MenuTabView> {
  int _selectedIndex = 0;
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      // margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: ColorConstant.grayEDEFF4.withOpacity(0.6),
          ),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _buildListItems(),
        ),
      ),
    );
  }

  List<Widget> _buildListItems() {
    List<Widget> children = [];
    for (var i = 0; i < widget.datas.length; i++) {
      children.add(
        InkWell(
          onTap: () {
            setState(() {
              _selectedIndex = i;
            });
            widget.onChanged?.call(i);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            width: widget.isEqual
                ? (MediaQuery.of(context).size.width - 32) / 2
                : null,
            decoration: BoxDecoration(
              border: _selectedIndex == i
                  ? const Border(
                      bottom: BorderSide(
                        color: ColorConstant.primary,
                      ),
                    )
                  : null,
            ),
            child: Center(
              child: Text(
                widget.datas[i],
                style: _selectedIndex == i
                    ? TextStyleConstant.robotoW700(
                        color: ColorConstant.primary,
                      )
                    : TextStyleConstant.robotoW700(
                        color: ColorConstant.text79,
                      ),
              ),
            ),
          ),
        ),
      );
    }
    return children;
  }
}
