import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:upstream/components/app_button.dart';
import 'package:upstream/components/app_dropdown_button.dart';
import 'package:upstream/components/app_form_field.dart';
import 'package:upstream/components/g_image.dart';
import 'package:upstream/components/my_app_bar.dart';
import 'package:upstream/constant/color_constant.dart';
import 'package:upstream/constant/text_style_constant.dart';
import 'package:upstream/l10n/app_lang.dart';

class FarmerRegistrationScreen extends StatelessWidget {
  const FarmerRegistrationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: MyAppBar(
        title: AppLang.local.farmer_registration,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            children: [
              _buildBasicInfoView(),
              _buildFarmerInfoView(),
              _buildContactInfoView(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFarmerInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                AppLang.local.farmer_information,
                style: TextStyleConstant.robotoW800(
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(
                width: 10,
              ),
              Expanded(
                child: Container(
                  height: 1,
                  color: ColorConstant.grayEB,
                ),
              )
            ],
          ),
          const SizedBox(
            height: 20,
          ),
          AppFormField(
            hint: AppLang.local.full_name,
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.phone_number,
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.identity_proof,
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.id_number,
          ),
          const SizedBox(
            height: 24,
          ),
          SizedBox(
            height: 120,
            width: 120,
            child: Stack(
              children: [
                GInternetImage(
                  url:
                      'https://static.vecteezy.com/system/resources/previews/004/985/994/original/cartoon-farmer-with-farmland-background-free-vector.jpg',
                  borderRadius: 60,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    height: 32,
                    width: 32,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white, width: 3),
                      shape: BoxShape.circle,
                      color: ColorConstant.primary,
                    ),
                    child: Center(
                      child: SvgPicture.asset(
                        'ic_camera'.iconSvg,
                      ),
                    ),
                  ),
                )
              ],
            ),
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.identity_proof,
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.id_number,
          ),
          const SizedBox(
            height: 24,
          ),
          Row(
            children: [
              _buildIdPhotoView(),
              const SizedBox(
                width: 15,
              ),
              _buildIdPhotoView()
            ],
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.date_of_birth,
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 16, right: 16),
              child: SvgPicture.asset('ic_calendar'.iconSvg),
            ),
          ),
        ],
      ),
    );
  }

  Expanded _buildIdPhotoView() {
    return Expanded(
      child: Container(
        height: 94,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: ColorConstant.grayF6F7F9,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              AppLang.local.id_back,
              style: TextStyleConstant.worksansW500(
                color: ColorConstant.gray6C757D,
              ),
            ),
            const SizedBox(
              height: 4,
            ),
            SvgPicture.asset('ic_bold_camera'.iconSvg),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                AppLang.local.basic_information,
                style: TextStyleConstant.robotoW800(
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(
                width: 10,
              ),
              Expanded(
                child: Container(
                  height: 1,
                  color: ColorConstant.grayEB,
                ),
              )
            ],
          ),
          const SizedBox(
            height: 20,
          ),
          AppFormField(
            hint: AppLang.local.enrollment_date,
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.enrollment_place,
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.farmer_code,
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.cooperative,
          )
        ],
      ),
    );
  }

  Widget _buildContactInfoView() {
    return Padding(
      padding: const EdgeInsets.only(top: 32, bottom: 32),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                AppLang.local.contact_information,
                style: TextStyleConstant.robotoW800(
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(
                width: 10,
              ),
              Expanded(
                child: Container(
                  height: 1,
                  color: ColorConstant.grayEB,
                ),
              )
            ],
          ),
          const SizedBox(
            height: 20,
          ),
          AppDropwdownButton(
            items: [],
            hintText: AppLang.local.country,
          ),
          const SizedBox(
            height: 24,
          ),
          AppDropwdownButton(
            items: [],
            hintText: AppLang.local.province,
          ),
          const SizedBox(
            height: 24,
          ),
          AppDropwdownButton(
            items: [],
            hintText: AppLang.local.commune,
          ),
          const SizedBox(
            height: 24,
          ),
          AppDropwdownButton(
            items: [],
            hintText: AppLang.local.village,
          ),
          const SizedBox(
            height: 24,
          ),
          AppFormField(
            hint: AppLang.local.street,
          ),
          const SizedBox(
            height: 24,
          ),
          AppButton(
            height: 45,
            title: AppLang.local.submit,
          ),
        ],
      ),
    );
  }
}
