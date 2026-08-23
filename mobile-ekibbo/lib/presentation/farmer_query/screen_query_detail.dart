import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';

import 'widget/query_tab_comment.dart';

class ScreenQueryDetail extends StatelessWidget {
  ScreenQueryDetail({super.key});

  final List<String> tabs = ["Info", "Comments"];
  final List<Widget> tabViews = [_DetailQuery(), const QueryTabComment()];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: tabs.length,
      child: SafeArea(
        child: Scaffold(
          backgroundColor: Colors.white,
          appBar: CustomAppBar(
            title: "Query Detail",
            size: 100,
            actions: [
              InkWell(
                onTap: () {},
                child: const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Icon(
                      Icons.check_circle_outline_outlined,
                      color: ColorConstant.primary,
                    )),
              )
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(40),
              child: Align(
                child: Padding(
                  padding: const EdgeInsets.only(left: 10.0),
                  child: TabBar(
                    indicatorSize: TabBarIndicatorSize.tab,
                    indicatorColor: ColorConstant.primary,
                    isScrollable: false,
                    tabs: tabs
                        .map(
                          (e) => Tab(
                            child: Text(
                              e,
                              style: TextStyleConstant.robotoW400(
                                fontSize: 14,
                                color: ColorConstant.text79,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ),
            ),
          ),
          body: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 26.0, vertical: 10),
            child: TabBarView(children: tabViews.map((e) => e).toList()),
          ),
        ),
      ),
    );
  }
}

class _DetailQuery extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildItemInfo("Plot", "plot"),
            const SizedBox(height: 8),
            _buildItemInfo("Crop", "crop"),
            const SizedBox(height: 8),
            _buildItemInfo("Current stage", "Current stage"),
            const SizedBox(height: 8),
            _buildItemInfo("Query", "Query"),
            const SizedBox(height: 8),
            _buildItemInfo("Video & photo", "Video & photo"),
          ],
        ),
      ),
    );
  }

  _buildItemInfo(String key, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          key,
          style: TextStyleConstant.robotoW700(
            fontSize: 16,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyleConstant.robotoW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        )
      ],
    );
  }
}
