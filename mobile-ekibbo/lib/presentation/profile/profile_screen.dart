import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/login/profile_response.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  ProfileModel? _profile;
  @override
  void initState() {
    _getProfile();
    super.initState();
  }

  _getProfile() async {
    final res = await ApiProvider.instance.apiAuth.getProfile();
    if (res?.data != null) {
      setState(() {
        _profile = res?.data?.staffData;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.profile,
        color: ColorConstant.primary,
        titleColor: Colors.white,
        backColor: Colors.white,
      ),
      body: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: WidgetCommon.buildBGDashboard(),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white,
                            width: 2,
                          ),
                        ),
                        clipBehavior: Clip.hardEdge,
                        child: const GInternetImage(
                          url: '',
                          fit: BoxFit.fill,
                        ),
                      ),
                      const SizedBox(
                        height: 16,
                      ),
                      Text(
                        _profile?.firstName ?? '',
                        style: TextStyleConstant.quicksandW600(
                          fontSize: 18,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    margin: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15),
                      color: ColorConstant.grayF7F8FA,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppLang.local.full_name,
                          style: TextStyleConstant.robotoW700(
                            color: ColorConstant.text79,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(
                          height: 8,
                        ),
                        Text(
                          '${_profile?.firstName ?? ''} ${_profile?.lastName ?? ''}',
                          style: TextStyleConstant.robotoW400(
                            color: ColorConstant.text79,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(
                          height: 16,
                        ),
                        Text(
                          'Email',
                          style: TextStyleConstant.robotoW700(
                            color: ColorConstant.text79,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(
                          height: 8,
                        ),
                        Text(
                          _profile?.email ?? '',
                          style: TextStyleConstant.robotoW400(
                            color: ColorConstant.text79,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(
                          height: 16,
                        ),
                        Text(
                          AppLang.local.gender,
                          style: TextStyleConstant.robotoW700(
                            color: ColorConstant.text79,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(
                          height: 8,
                        ),
                        Text(
                          _profile?.gender ?? '',
                          style: TextStyleConstant.robotoW400(
                            color: ColorConstant.text79,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(
                          height: 16,
                        ),
                        Text(
                          AppLang.local.phone_number,
                          style: TextStyleConstant.robotoW700(
                            color: ColorConstant.text79,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(
                          height: 8,
                        ),
                        Text(
                          _profile?.phoneNumber ?? '',
                          style: TextStyleConstant.robotoW400(
                            color: ColorConstant.text79,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
