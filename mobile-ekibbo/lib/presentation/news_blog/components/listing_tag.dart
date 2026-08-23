import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/models/blog_news/tab_tag_model.dart';

// ignore: must_be_immutable
class TabView extends StatefulWidget {
  TabView({
    super.key,
    this.onChanged,
    required this.tagSelected,
    required this.listTag,
  });
  final List<MTabTag> listTag;
  final Function(MTabTag?)? onChanged;
  MTabTag tagSelected;
  @override
  State<TabView> createState() => _ListTagsViewState();
}

class _ListTagsViewState extends State<TabView> {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 32,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            ...widget.listTag
                .map((item) => InkWell(
                      onTap: () {
                        if (widget.tagSelected.key == item.key) {
                          return;
                        }
                        setState(() {
                          widget.tagSelected = item;
                        });
                        if (widget.onChanged == null) return;
                        widget.onChanged!(widget.tagSelected);
                      },
                      child: Container(
                        height: 32,
                        padding: const EdgeInsets.symmetric(horizontal: 11),
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(3),
                          color: widget.tagSelected.key == item.key
                              ? ColorConstant.primary
                              : ColorConstant.grayF6F7F9,
                        ),
                        child: Center(
                          child: Text(
                            item.value,
                            style: TextStyle(
                              fontSize: 14,
                              fontFamily: 'Roboto',
                              color: widget.tagSelected.key == item.key
                                  ? Colors.white
                                  : ColorConstant.text79,
                            ),
                          ),
                        ),
                      ),
                    ))
                .toList()
          ],
        ),
      ),
    );
  }
}
