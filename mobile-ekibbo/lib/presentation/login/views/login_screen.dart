// ignore_for_file: use_build_context_synchronously

import 'package:flutter/foundation.dart';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/auth/agrobase_auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _obsecure = true;
  final _formKey = GlobalKey<FormState>();
  final _phoneTxtController = TextEditingController();
  final _passTxtController = TextEditingController();
  String role = kRoleExtensionOfficer;
  @override
  void initState() {
    super.initState();
    // No pre-filled credentials in the Ekibbo build.
  }

  _onLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      DialogHelper.showLoading();
      // Agrobase multi-tenant login: the backend resolves the user's tenant
      // from the credentials and returns a token carrying
      // (userId:role:tenantId). Every later API call is tenant-scoped
      // server-side — one tenant can never see another tenant's data.
      final result = await AgrobaseAuthService.instance.login(
        phoneOrEmail: _phoneTxtController.text.trim(),
        password: _passTxtController.text,
      );
      DialogHelper.hideLoading();

      SharedPreferencesProvider.instance.setAccessToken(result.token);
      SharedPreferencesProvider.instance.setUserInfo(result.user);
      ApiProvider.instance.login();

      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil(
        RouterName.dashboard,
        (route) => false,
      );
    } on AgrobaseAuthException catch (e) {
      DialogHelper.hideLoading();
      DialogHelper.showOkDialog(context, e.message);
    } catch (_) {
      debugPrint("Error login: $_");
      DialogHelper.hideLoading();
      DialogHelper.showOkDialog(
        context,
        AppLang.local.user_or_pass_wrong,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          const SizedBox(height: 30),
                          GImage.asset(
                            name: 'icon'.imgPNG,
                            width: 100,
                            height: 100,
                          ),
                          const SizedBox(
                            height: 32,
                          ),
                          Text(
                            AppLang.local.sign_in,
                            style:
                                TextStyleConstant.quicksandW700(fontSize: 22),
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          // Ekibbo roles — the server confirms the actual
                          // role from the account at login.
                          InputDropDownData(
                            items: const ['Field Officer', 'Farmer'],
                            onChanged: (index) {
                              role = index == 0
                                  ? kRoleExtensionOfficer
                                  : kRoleFarmer;
                            },
                            hintText: AppLang.local.select_role,
                            itemIndex: 1,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppFormField(
                            hint: AppLang.local.phone_number,
                            keyboardType: TextInputType.number,
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return AppLang.local.please_fill_phone;
                              }
                              return null;
                            },
                            controller: _phoneTxtController,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppFormField(
                            hint: AppLang.local.password,
                            obscureText: _obsecure,
                            suffixIcon: InkWell(
                              onTap: () {
                                setState(() {
                                  _obsecure = !_obsecure;
                                });
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(15.0),
                                child: _obsecure
                                    ? SvgPicture.asset('ic_eye'.iconSvg)
                                    : SvgPicture.asset('ic_eye_off'.iconSvg),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return AppLang.local.please_fill_password;
                              }
                              return null;
                            },
                            controller: _passTxtController,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppButton(
                            title: AppLang.local.sign_in,
                            height: 46,
                            onTap: _onLogin,
                          ),
                          const SizedBox(
                            height: 16,
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(
                                AppLang.local.forgot_password,
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.primary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16, top: 10),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Mobipay-Agrobase',
                        style: TextStyleConstant.quicksandW700(
                          fontSize: 18,
                          color: ColorConstant.primary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Ekibbo Field Operations',
                        style: TextStyleConstant.robotoW400(
                          fontSize: 11,
                          color: ColorConstant.text79,
                        ),
                      ),
                    ],
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
