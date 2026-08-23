import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

import 'widgets/tab_view_notification.dart';

class ScreenNotification extends StatelessWidget {
  ScreenNotification({super.key});

  final List<String> tabs = ["Orders", "Sellers", "Payouts"];
  final List<Widget> tabViews = [
    const WTabViewNotification(type: 'order'),
    Center(
      child: ListView(
        children: const [
          NoDataView(),
        ],
      ),
    ),
    const Center(child: NoDataView())
  ];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: tabs.length,
      child: SafeArea(
        child: Scaffold(
          backgroundColor: Colors.white,
          appBar: CustomAppBar(
            title: "Notifications",
            size: 100,
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(40),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.only(left: 10.0),
                  child: TabBar(
                    indicatorSize: TabBarIndicatorSize.label,
                    indicatorColor: ColorConstant.primary,
                    isScrollable: true,
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
