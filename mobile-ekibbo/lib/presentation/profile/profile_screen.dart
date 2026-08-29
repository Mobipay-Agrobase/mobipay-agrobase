import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/login/profile_response.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_ekibbo_profile.dart';
import 'package:agrobase_ekibbo/models/user/user_model.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  ProfileModel? _profile;
  bool _loading = true;

  @override
  void initState() {
    _getProfile();
    super.initState();
  }

  _getProfile() async {
    final res = await ApiProvider.instance.apiAuth.getProfile();
    if (!mounted) return;
    setState(() {
      _profile = res?.data?.staffData;
      _loading = false;
    });
  }

  Future<void> _openEditSheet() async {
    if (_profile == null) return;
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _EditProfileSheet(profile: _profile!),
    );
    if (saved == true) {
      // Refresh with the server state after a successful save.
      setState(() => _loading = true);
      await _getProfile();
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
        actions: [
          IconButton(
            tooltip: 'Edit profile',
            icon: const Icon(Icons.edit, color: Colors.white, size: 20),
            onPressed: _loading ? null : _openEditSheet,
          ),
        ],
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
                    child: _loading
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(24),
                              child: CircularProgressIndicator(
                                color: ColorConstant.primary,
                              ),
                            ),
                          )
                        : Column(
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
                              const SizedBox(
                                height: 16,
                              ),
                              Text(
                                'Role',
                                style: TextStyleConstant.robotoW700(
                                  color: ColorConstant.text79,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(
                                height: 8,
                              ),
                              Text(
                                _profile?.userType ?? '',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity,
                                child: AppButton(
                                  title: 'Edit Profile',
                                  height: 44,
                                  onTap: _openEditSheet,
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

/// ─────────────────────────────────────────────────────────────────────────
/// Bottom-sheet form: edit first name, last name, phone, email.
/// Saves via PUT /mobile/ekibbo-profile and pops with true on success.
/// ─────────────────────────────────────────────────────────────────────────
class _EditProfileSheet extends StatefulWidget {
  const _EditProfileSheet({required this.profile});

  final ProfileModel profile;

  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    // Prefill from the currently loaded profile.
    _firstCtrl.text = widget.profile.firstName;
    _lastCtrl.text = widget.profile.lastName;
    _phoneCtrl.text = widget.profile.phoneNumber;
    _emailCtrl.text = widget.profile.email;
  }

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final first = _firstCtrl.text.trim();
    final last = _lastCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    if (first.isEmpty || last.isEmpty) {
      DialogHelper.showToast(context, 'Please enter your first and last name');
      return;
    }
    if (phone.isEmpty) {
      DialogHelper.showToast(context, 'Please enter your phone number');
      return;
    }
    setState(() => _saving = true);
    try {
      DialogHelper.showLoading();
      await ApiEkibboProfile.update({
        'first_name': first,
        'last_name': last,
        'phone_number': phone,
        'email': email,
      });
      // Keep the cached login user (drawer name/phone) in sync.
      final cached = SharedPreferencesProvider.instance.userInfo;
      if (cached != null) {
        SharedPreferencesProvider.instance.setUserInfo(UserModel.fromJson({
          ...cached.toJson,
          'name': '$first $last'.trim(),
          'email': email,
          'phone': phone,
        }));
      }
      DialogHelper.hideLoading();
      if (!mounted) return;
      DialogHelper.showToastSuccess(context, message: 'Profile updated');
      Navigator.of(context).pop(true);
    } catch (e) {
      DialogHelper.hideLoading();
      if (mounted) {
        DialogHelper.showToast(context, e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Edit Profile',
                  style: TextStyleConstant.quicksandW600(
                    fontSize: 16,
                    color: Colors.black,
                  ),
                ),
              ),
              InkWell(
                onTap: () => Navigator.of(context).pop(false),
                child: const Icon(Icons.close, size: 22),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _FieldLabel('First name *'),
          AppFormField(hint: 'e.g. Mukoova', controller: _firstCtrl),
          const SizedBox(height: 12),
          const _FieldLabel('Last name *'),
          AppFormField(hint: 'e.g. Juma', controller: _lastCtrl),
          const SizedBox(height: 12),
          const _FieldLabel('Phone number *'),
          AppFormField(
            hint: 'e.g. +256700111222',
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          const _FieldLabel('Email'),
          AppFormField(
            hint: 'name@example.com',
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              title: 'Save Changes',
              height: 46,
              onTap: _saving ? null : _save,
            ),
          ),
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: TextStyleConstant.robotoW700(
          fontSize: 13,
          color: ColorConstant.text79,
        ),
      ),
    );
  }
}
