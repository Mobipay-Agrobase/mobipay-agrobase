import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/presentation/farmer_query/screen_query_create.dart';

import 'widget/query_tab_listing.dart';

class ScreenQueriesListing extends StatelessWidget {
  final List<String> tabs = ["Open", "Resolved"];
  final List<Widget> tabViews = [QueryTabListing(), QueryTabListing()];

  ScreenQueriesListing({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: tabs.length,
      child: SafeArea(
        child: Scaffold(
          backgroundColor: Colors.white,
          appBar: CustomAppBar(
            title: "Farmer Queries",
            size: 100,
            actions: [
              InkWell(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => ScreenQueryCreate(),
                    ),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: SvgPicture.asset(
                    'ic_add_fill'.iconSvg,
                  ),
                ),
              )
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(40),
              child: Align(
                //alignment: Alignment.centerLeft,
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
