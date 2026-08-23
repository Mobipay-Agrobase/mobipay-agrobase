import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/drawer_config.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/presentation/farmer_query/screen_query_listing.dart';
import 'package:agrobase_ekibbo/presentation/information/check_fishing/listing.dart';
import 'package:agrobase_ekibbo/presentation/information/feeding/listing.dart';
import 'package:agrobase_ekibbo/presentation/information/mortality/listing.dart';
import 'package:agrobase_ekibbo/presentation/information/water_quality/listing.dart';
import 'package:agrobase_ekibbo/presentation/news_blog/services/post_store.dart';
import 'package:agrobase_ekibbo/presentation/news_blog/widgets/post_listing.dart';
import 'package:agrobase_ekibbo/presentation/procurement/screen_procurement_list.dart';
import 'package:agrobase_ekibbo/presentation/profile/setting_screen.dart';
import 'package:agrobase_ekibbo/presentation/stock/creation/listing.dart';
import 'package:agrobase_ekibbo/presentation/stock/transfer/listing.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/distribution/screen_distribution.dart';
import 'package:agrobase_ekibbo/presentation/procurement/screen_cropharvest_list.dart';
import 'package:agrobase_ekibbo/presentation/procurement/screen_vendor_procurement_list.dart';
import 'package:agrobase_ekibbo/presentation/profile/languge_screen.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class DrawerView extends StatefulWidget {
  const DrawerView({super.key});

  @override
  State<DrawerView> createState() => _DrawerViewState();
}

class _DrawerViewState extends State<DrawerView> {
  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: ColorConstant.primary,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Container(
              height: 160,
              padding: const EdgeInsets.only(
                left: 32,
                top: 22,
                right: 20,
              ),
              color: ColorConstant.primary,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GImage.asset(
                        name: 'logo'.imgPNG,
                        height: 30,
                        color: Colors.white,
                      ),
                      InkWell(
                        onTap: () => Navigator.of(context).pop(),
                        child: SizedBox(
                          height: 30,
                          width: 30,
                          child: SvgPicture.asset(
                            'ic_close'.iconSvg,
                            width: 24,
                            height: 24,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: '${AppLang.local.welcome_back},\n',
                          style: TextStyleConstant.quicksandW600(
                              fontSize: 16, color: Colors.white),
                        ),
                        TextSpan(
                          text:
                              SharedPreferencesProvider.instance.userInfo!.name,
                          style: TextStyleConstant.quicksandW700(
                              fontSize: 24, color: Colors.white),
                        )
                      ],
                    ),
                  )
                ],
              ),
            ),
            Expanded(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    ...drawerConfigs
                        .where((element) => element.roleAccessed
                            .contains(DUserInfo.instance.user!.roleUser))
                        .toList()
                        .map(
                          (item) => InkWell(
                            onTap: () => _onPressed(context, item.type),
                            child: Container(
                              height: 48,
                              decoration: BoxDecoration(
                                border: Border(
                                  bottom: BorderSide(
                                    color: ColorConstant.grayEDEFF4
                                        .withOpacity(0.6),
                                  ),
                                ),
                              ),
                              child: Row(
                                children: [
                                  SvgPicture.asset(
                                    item.icon.iconSvg,
                                    color: Colors.black,
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    item.title,
                                    style: TextStyleConstant.robotoW500(),
                                  )
                                ],
                              ),
                            ),
                          ),
                        )
                        .toList(),
                    Container(
                      height: 48,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: ColorConstant.grayEDEFF4.withOpacity(0.6),
                          ),
                        ),
                      ),
                      child: Row(
                        children: [
                          SvgPicture.asset(
                            'ic_sync'.iconSvg,
                            color: Colors.black,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            "${AppLang.local.version} ${context.watch<AppProvider>().appSettings.version}",
                            style: TextStyleConstant.robotoW500(),
                          )
                        ],
                      ),
                    ),
                    AppButton(
                      height: 38,
                      onTap: () {
                        SharedPreferencesProvider.instance.clear();
                        Navigator.of(context).pushNamedAndRemoveUntil(
                            RouterName.login, (route) => false);
                      },
                      width: double.infinity,
                      borderColor: ColorConstant.primary,
                      color: Colors.white,
                      radius: 5,
                      title: AppLang.local.sign_out,
                      titleStyle: TextStyleConstant.quicksandW500(
                        color: ColorConstant.primary,
                      ),
                    )
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  _onPressed(BuildContext context, DrawerMenuType menuType) async {
    switch (menuType) {
      case DrawerMenuType.profile:
        if (DUserInfo.instance.user!.roleUser == EnumUserRole.farmer) {
          Navigator.of(context).pushNamed(RouterName.farmer_detail,
              arguments: DUserInfo.instance.user!.farmerId);
        } else {
          Navigator.of(context).pushNamed(RouterName.profile);
        }
        break;
      case DrawerMenuType.saleIntention:
        Navigator.of(context).pushNamed(RouterName.list_sale_intention);
        break;
      case DrawerMenuType.distribution:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenDistribution(),
          ),
        );
        break;
      case DrawerMenuType.appLang:
        await Navigator.of(context).push(
          MaterialPageRoute(builder: (context) => const LanguageScreen()),
        );
        setState(() {});
        break;
      case DrawerMenuType.settings:
        await Navigator.of(context).push(
          MaterialPageRoute(builder: (context) => const ScreenSettings()),
        );
        setState(() {});
        break;
      case DrawerMenuType.cropHarvest:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenCropHarvestList(),
          ),
        );
        break;
      case DrawerMenuType.vendorProcurement:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenVendorProcurementList(),
          ),
        );
        break;
      case DrawerMenuType.procurement:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenProcurementList(),
          ),
        );
        break;
      case DrawerMenuType.farmerQueries:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ScreenQueriesListing(),
          ),
        );
        break;
      case DrawerMenuType.newsAdvisory:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const PostListing(
              title: 'News',
              typePost: TypePost.news,
            ),
          ),
        );
        break;
      case DrawerMenuType.blog:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const PostListing(
              title: 'Blogs',
              typePost: TypePost.blog,
            ),
          ),
        );
        break;
      case DrawerMenuType.stockCreation:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenStockCreationListing(),
          ),
        );
        break;
      case DrawerMenuType.stockTransfer:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenStockTransferListing(),
          ),
        );
        break;
      case DrawerMenuType.feeding:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenFeedingListing(),
          ),
        );
        break;
      case DrawerMenuType.mortalities:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenMortalityListing(),
          ),
        );
        break;
      case DrawerMenuType.checkFishing:
        Navigator.of(context).push(
          MaterialPageRoute(
              builder: (context) => const ScreenCheckFishingListing()),
        );
        break;
      case DrawerMenuType.waterQuality:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenWaterQualityListing(),
          ),
        );
        break;
      default:
    }
  }
}
