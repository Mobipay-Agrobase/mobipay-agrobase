import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:upstream/components/g_image.dart';
import 'package:upstream/constant/color_constant.dart';
import 'package:upstream/constant/text_style_constant.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: GImage.asset(
              name: 'dashboard_bg'.imgPNG,
              height: 225,
              boxFit: BoxFit.fill,
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              child: CustomScrollView(
                slivers: [
                  _buildAppBar(),
                  SliverToBoxAdapter(
                    child: _buildSummaryView(),
                  )
                  // const SizedBox(
                  //   height: 20,
                  // ),
                  // _buildSummaryView(),
                  // const SizedBox(
                  //   height: 16,
                  // ),
                  // _buildMenuView(),
                  // const SizedBox(
                  //   height: 48,
                  // ),
                  // _buildTasksView()
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  SliverAppBar _buildAppBar() {
    return SliverAppBar(
      backgroundColor: ColorConstant.primary,
      title: Text(
        'Dashboard',
        style: TextStyleConstant.quicksandW600(
          fontSize: 16,
          color: Colors.white,
        ),
      ),
      centerTitle: false,
      floating: true,
      titleSpacing: 0,
      // leadingWidth: 56,
      leading: Container(
        padding: const EdgeInsets.all(16),
        // color: Colors.red,
        child: SvgPicture.asset(
          'ic_drawer'.iconSvg,
        ),
      ),
      actions: [
        SvgPicture.asset(
          'ic_sync'.iconSvg,
        ),
        const SizedBox(
          width: 16,
        ),
        SvgPicture.asset(
          'ic_bell'.iconSvg,
        ),
        const SizedBox(
          width: 16,
        ),
        Container(
          height: 24,
          width: 24,
          margin: const EdgeInsets.only(right: 16),
          clipBehavior: Clip.hardEdge,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.white),
            shape: BoxShape.circle,
          ),
          child: GInternetImage(
            url:
                'https://otbsalessolutions.com/wp-content/uploads/2021/08/Farmer-standing-in-field.jpg',
            fit: BoxFit.fill,
          ),
        ),
      ],
    );
  }

  Column _buildTasksView() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Today Tasks',
                style: TextStyleConstant.robotoW600(fontSize: 16),
              ),
              Text(
                'View All Tasks',
                style: TextStyleConstant.robotoW400(
                  fontSize: 12,
                  color: ColorConstant.primary,
                ),
              )
            ],
          ),
        ),
        Container(
          margin: const EdgeInsets.only(
            top: 16,
          ),
          height: 182,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 10,
            padding: const EdgeInsets.only(left: 16),
            itemBuilder: (_, index) {
              return Container(
                height: 182,
                width: 320,
                margin: const EdgeInsets.only(right: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  color: ColorConstant.grayEDEFF4,
                ),
              );
            },
          ),
        )
      ],
    );
  }

  Container _buildMenuView() {
    return Container(
      height: 80,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            offset: const Offset(4, 4),
            blurRadius: 15,
            color: Colors.black.withOpacity(0.15),
          )
        ],
      ),
    );
  }

  Container _buildSummaryView() {
    return Container(
      height: 175,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      margin: const EdgeInsets.only(top: 16),
      child: Row(
        children: [
          Container(
            width: 104,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  offset: const Offset(4, 4),
                  blurRadius: 15,
                  color: Colors.black.withOpacity(0.15),
                )
              ],
            ),
            child: Column(
              children: [
                Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: ColorConstant.primary.withOpacity(0.1),
                  ),
                  child: Center(
                    child: SvgPicture.asset('ic_farmer'.iconSvg),
                  ),
                ),
                Text(
                  'Total Farmers',
                  style: TextStyleConstant.robotoW500(
                    fontSize: 12,
                    color: ColorConstant.text79,
                  ),
                )
              ],
            ),
          ),
          const SizedBox(
            width: 16,
          ),
          Expanded(
            child: Column(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15),
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          offset: const Offset(4, 4),
                          blurRadius: 15,
                          color: Colors.black.withOpacity(0.15),
                        )
                      ],
                    ),
                  ),
                ),
                const SizedBox(
                  height: 16,
                ),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15),
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          offset: const Offset(4, 4),
                          blurRadius: 15,
                          color: Colors.black.withOpacity(0.15),
                        )
                      ],
                    ),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Container _buildHeader() {
    return Container(
      height: 50,
      color: Colors.red,
    );
  }
}
