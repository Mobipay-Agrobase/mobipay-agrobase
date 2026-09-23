import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/components/app_dropdown_button.dart';
import 'package:mobipay_ekibbo/components/app_form_field.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:mobipay_ekibbo/screens/login/model/user_role.dart';

/// EKiBBO Login screen — role-based login (Admin / Field Officer / Farmer)
///
/// Authenticates against /api/auth/mobile-login (custom JWT endpoint that
/// bypasses NextAuth's cookie/CSRF flow which doesn't work with Flutter).
/// On success, stores the JWT in SharedPreferences and navigates to the
/// dashboard. On failure, shows the server's error message.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  UserRole? _selectedRole;
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    if (_selectedRole == null) {
      _showError('Please select a role');
      return;
    }
    if (_phoneCtrl.text.trim().isEmpty) {
      _showError(AppLang.local.please_fill_phone);
      return;
    }
    if (_passwordCtrl.text.isEmpty) {
      _showError(AppLang.local.please_fill_password);
      return;
    }

    setState(() => _loading = true);
    try {
      final res = await ApiClient().post('/api/auth/mobile-login', body: {
        'email': _phoneCtrl.text.trim(),
        'password': _passwordCtrl.text,
      });

      if (res.statusCode != 200) {
        String errorMsg = 'Invalid credentials';
        try {
          final d = jsonDecode(res.body);
          errorMsg = d['error'] ?? errorMsg;
        } catch (_) {}
        _showError(errorMsg);
        return;
      }

      final d = jsonDecode(res.body);
      final token = d['token'] as String?;
      final user = d['user'] as Map<String, dynamic>?;
      if (token == null || user == null) {
        _showError('Login succeeded but no token returned');
        return;
      }

      // Persist session
      final tenantId = (user['tenantId'] ?? '') as String;
      await ApiClient().saveSession(token, tenantId);
      ApiClient().setAuth(token, tenantId);

      if (!mounted) return;
      // Navigate to dashboard, replace login route
      navigatorKey.currentState?.pushReplacementNamed(RouterName.dashboard);
    } catch (e) {
      _showError('Network error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: ColorConstant.danger),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: ColorConstant.background,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 60),
                        // Logo: coffee cup icon in a circular brand badge
                        Center(
                          child: Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: ColorConstant.primary,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: ColorConstant.primary.withOpacity(0.3),
                                  blurRadius: 16,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.coffee,
                              size: 56,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'EKiBBO Agrobase',
                          textAlign: TextAlign.center,
                          style: TextStyleConstant.quicksandW700(fontSize: 24),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppLang.local.welcome_back,
                          textAlign: TextAlign.center,
                          style: TextStyleConstant.robotoW400(
                            fontSize: 13,
                            color: ColorConstant.text79,
                          ),
                        ),
                        const SizedBox(height: 40),
                        // Role selector
                        Text(
                          AppLang.local.select_role,
                          style: TextStyleConstant.robotoW600(
                            fontSize: 13,
                            color: ColorConstant.text79,
                          ),
                        ),
                        const SizedBox(height: 8),
                        AppDropwdownButton(
                          items: UserRole.values.map((e) => e.getTitle()).toList(),
                          itemSelected: _selectedRole?.getTitle(),
                          onChanged: (v) {
                            setState(() {
                              _selectedRole = UserRole.values[v];
                            });
                          },
                          hintText: AppLang.local.select_role,
                        ),
                        const SizedBox(height: 20),
                        // Phone number / email
                        AppFormField(
                          controller: _phoneCtrl,
                          hint: AppLang.local.email_or_phone,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 16),
                        // Password with show/hide toggle
                        AppFormField(
                          controller: _passwordCtrl,
                          hint: AppLang.local.password,
                          obscureText: _obscurePassword,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              color: ColorConstant.text79,
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Forgot password
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {
                              // TODO: implement forgot password flow
                              _showError('Forgot password flow not yet implemented');
                            },
                            child: Text(
                              AppLang.local.forgot_password,
                              style: TextStyleConstant.robotoW400(
                                fontSize: 13,
                                color: ColorConstant.primary,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Sign In button
                        AppButton(
                          title: _loading ? 'Signing in...' : AppLang.local.sign_in,
                          height: 50,
                          isLoading: _loading,
                          onTap: _loading ? null : _signIn,
                        ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Text(
                    'Powered by MobiPay AgroSys',
                    style: TextStyleConstant.robotoW400(
                      fontSize: 11,
                      color: ColorConstant.text79,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
