import 'package:flutter/material.dart';
import 'package:upstream/components/app_button.dart';
import 'package:upstream/components/app_dropdown_button.dart';
import 'package:upstream/components/app_form_field.dart';
import 'package:upstream/components/g_image.dart';
import 'package:upstream/constant/color_constant.dart';
import 'package:upstream/constant/text_style_constant.dart';
import 'package:upstream/screens/login/model/user_role.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        const SizedBox(
                          height: 50,
                        ),
                        GImage.asset(
                          name: 'logo_fa'.imgPNG,
                          width: 113,
                          height: 113,
                        ),
                        const SizedBox(
                          height: 48,
                        ),
                        Text(
                          'Sign In',
                          style: TextStyleConstant.quicksandW700(fontSize: 22),
                        ),
                        const SizedBox(
                          height: 32,
                        ),
                        AppDropwdownButton(
                          items:
                              UserRole.values.map((e) => e.getTitle()).toList(),
                          onChanged: (v) {},
                          hintText: 'Select Role',
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppFormField(
                          hint: 'Phone Number',
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppFormField(
                          hint: 'Password',
                          obscureText: true,
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppButton(
                          title: 'Sign In',
                          height: 46,
                        ),
                        const SizedBox(
                          height: 16,
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              'Forgot Password ?',
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
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Text(
                    'Powered By Farm Angel',
                    style: TextStyleConstant.robotoW400(
                      color: ColorConstant.text79,
                    ),
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
