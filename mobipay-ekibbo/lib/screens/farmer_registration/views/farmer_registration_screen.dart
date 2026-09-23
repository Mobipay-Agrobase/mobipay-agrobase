import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/components/app_dropdown_button.dart';
import 'package:mobipay_ekibbo/components/app_form_field.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/components/location_picker.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';

/// EKiBBO Farmer Registration — multi-section form per Sheet-3 spec:
///   1. Basic Info (enrollment, code, group name/code, field officer)
///   2. Farmer Info (name, phone, gender, DOB, ID, photo)
///   3. Contact Info (country=Uganda, district, village)
///   4. Family Info (next of kin alt phone, household size, children)
///   5. Certification Info (RA, Organic, Fairtrade, 4C — per Issac clarification)
///   6. Finance Info (loan taken + loan source = crop sold to EKiBBO)
///
/// All changes from the upstream skeleton:
///   - "Cooperative" → "Group Name/Code" (per Issac clarification Q1)
///   - "Spouse Name" → "Next of Kin — Alternative Phone" (per Q4)
///   - "No of Family Members" → "Household Size" (per Q3 response)
///   - Certification types: RA, Organic, Fairtrade, 4C (per Q3)
///   - Loan source = crop type sold to EKiBBO (Fresh/Kiboko/FAQ) (per Q5)
class FarmerRegistrationScreen extends StatefulWidget {
  const FarmerRegistrationScreen({super.key});

  @override
  State<FarmerRegistrationScreen> createState() =>
      _FarmerRegistrationScreenState();
}

class _FarmerRegistrationScreenState extends State<FarmerRegistrationScreen> {
  // Basic Info
  final _enrollmentDateCtrl = TextEditingController();
  final _farmerCodeCtrl = TextEditingController(text: 'Auto-generated on save');
  final _groupIdCtrl = TextEditingController();
  final _fieldOfficerCtrl = TextEditingController();

  // Farmer Info
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _idNoCtrl = TextEditingController();
  final _dobCtrl = TextEditingController();
  String? _gender;
  String? _idType;

  // Contact Info — 7-level dependent dropdown (LocationPicker)
  LocationSelection? _location;

  // Family Info
  final _nextOfKinAltPhoneCtrl = TextEditingController();
  final _householdSizeCtrl = TextEditingController();
  final _childrenUnder18Ctrl = TextEditingController();
  final _schoolGoingChildrenCtrl = TextEditingController();

  // Certification
  bool _isCertified = false;
  String? _certificationType;
  String? _icsYear;

  // Finance
  bool _loanTakenLastYear = false;
  String? _loanSource; // Fresh/Kiboko/FAQ per Issac clarification
  final _loanAmountCtrl = TextEditingController();

  bool _saving = false;

  // Static dropdown data
  static const _genders = ['Male', 'Female', 'Other'];
  static const _idTypes = ['National ID', 'Driving License', 'Passport'];
  static const _certTypes = ['RA', 'Organic', 'Fairtrade', '4C'];
  static const _loanSources = [
    'Fresh (cherry)',
    'Kiboko (unwashed)',
    'FAQ (washed)',
    'Other',
  ];
  static final _icsYears = List.generate(
    15,
    (i) => (DateTime.now().year - i).toString(),
  );

  @override
  void dispose() {
    _enrollmentDateCtrl.dispose();
    _farmerCodeCtrl.dispose();
    _groupIdCtrl.dispose();
    _fieldOfficerCtrl.dispose();
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _phoneCtrl.dispose();
    _idNoCtrl.dispose();
    _dobCtrl.dispose();

    _nextOfKinAltPhoneCtrl.dispose();
    _householdSizeCtrl.dispose();
    _childrenUnder18Ctrl.dispose();
    _schoolGoingChildrenCtrl.dispose();
    _loanAmountCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );
    if (d != null) {
      ctrl.text = d.toIso8601String().split('T')[0];
    }
  }

  Future<void> _save() async {
    if (_firstNameCtrl.text.trim().isEmpty || _lastNameCtrl.text.trim().isEmpty) {
      _showError('First name and last name are required');
      return;
    }
    if (_phoneCtrl.text.trim().isEmpty) {
      _showError(AppLang.local.please_fill_phone);
      return;
    }

    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        // Basic info
        'enrollmentDate': _enrollmentDateCtrl.text.isNotEmpty
            ? _enrollmentDateCtrl.text
            : DateTime.now().toIso8601String().split('T')[0],
        'groupId': _groupIdCtrl.text.isNotEmpty ? _groupIdCtrl.text : null,
        'extensionOfficer': _fieldOfficerCtrl.text.isNotEmpty ? _fieldOfficerCtrl.text : null,
        // Farmer info
        'firstName': _firstNameCtrl.text.trim(),
        'lastName': _lastNameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'gender': _gender,
        'dateOfBirth': _dobCtrl.text.isNotEmpty ? _dobCtrl.text : null,
        'nationalIdType': _idType,
        'nationalIdNo': _idNoCtrl.text.isNotEmpty ? _idNoCtrl.text : null,
        // Contact
        'country': _location?.country ?? 'Uganda',
        'province': _location?.regionName,
        'district': _location?.districtName,
        'commune': _location?.subCountyName,
        'villageName': _location?.villageName,
        'villageId': _location?.villageId,
        // Family — EKiBBO Sheet-3 fields
        'spouseName': _nextOfKinAltPhoneCtrl.text.isNotEmpty
            ? _nextOfKinAltPhoneCtrl.text
            : null, // DB column is spouseName but UI shows "Next of Kin alt phone"
        'familyMembers': int.tryParse(_householdSizeCtrl.text),
        'childrenUnder18': int.tryParse(_childrenUnder18Ctrl.text),
        'schoolGoingChildren': int.tryParse(_schoolGoingChildrenCtrl.text),
        // Certification — EKiBBO Sheet-3 (RA, Organic, Fairtrade, 4C)
        'isCertified': _isCertified,
        'certificationType': _certificationType,
        'icsYear': _icsYear,
        // Finance — EKiBBO Sheet-3 (loan source = crop sold to EKiBBO)
        'loanTakenLastYear': _loanTakenLastYear,
        'loanTakenFrom': _loanSource,
        'loanAmount': double.tryParse(_loanAmountCtrl.text),
      };

      final res = await ApiClient().post('/api/farmers', body: payload);
      if (res.statusCode == 201 || res.statusCode == 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.create_farmer_successfully),
            backgroundColor: ColorConstant.success,
          ),
        );
        Navigator.of(context).pop();
      } else {
        String err = 'Failed (HTTP ${res.statusCode})';
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        _showError(err);
      }
    } catch (e) {
      _showError('Network error: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
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
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(title: AppLang.local.farmer_registration),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildBasicInfo(),
            const SizedBox(height: 24),
            _buildFarmerInfo(),
            const SizedBox(height: 24),
            _buildContactInfo(),
            const SizedBox(height: 24),
            _buildFamilyInfo(),
            const SizedBox(height: 24),
            _buildCertificationInfo(),
            const SizedBox(height: 24),
            _buildFinanceInfo(),
            const SizedBox(height: 32),
            AppButton(
              title: _saving ? 'Saving...' : AppLang.local.submit,
              height: 50,
              isLoading: _saving,
              onTap: _saving ? null : _save,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Row(
      children: [
        Text(
          title,
          style: TextStyleConstant.robotoW800(
            fontSize: 13,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: Container(height: 1, color: ColorConstant.grayEB)),
      ],
    );
  }

  Widget _buildBasicInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeader(AppLang.local.basic_information),
        const SizedBox(height: 16),
        AppFormField(
          controller: _enrollmentDateCtrl,
          hint: AppLang.local.enrollment_date,
          readOnly: true,
          suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18),
          onTap: () => _pickDate(_enrollmentDateCtrl),
        ),
        const SizedBox(height: 12),
        AppFormField(
          controller: _farmerCodeCtrl,
          hint: AppLang.local.farmer_code,
          readOnly: true,
        ),
        const SizedBox(height: 12),
        // EKiBBO Sheet-3: renamed "Cooperative" → "Group Name/Code"
        AppFormField(
          controller: _groupIdCtrl,
          hint: AppLang.local.group_name_code,
        ),
        const SizedBox(height: 12),
        AppFormField(
          controller: _fieldOfficerCtrl,
          hint: 'Field Officer',
        ),
      ],
    );
  }

  Widget _buildFarmerInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeader(AppLang.local.farmer_information),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: AppFormField(controller: _firstNameCtrl, hint: 'First Name')),
            const SizedBox(width: 8),
            Expanded(child: AppFormField(controller: _lastNameCtrl, hint: 'Last Name')),
          ],
        ),
        const SizedBox(height: 12),
        AppFormField(
          controller: _phoneCtrl,
          hint: AppLang.local.phone_number,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: AppDropwdownButton(
                items: _genders,
                itemSelected: _gender,
                hintText: AppLang.local.gender,
                onChanged: (v) => setState(() => _gender = _genders[v]),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AppFormField(
                controller: _dobCtrl,
                hint: AppLang.local.date_of_birth,
                readOnly: true,
                suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18),
                onTap: () => _pickDate(_dobCtrl),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: AppDropwdownButton(
                items: _idTypes,
                itemSelected: _idType,
                hintText: AppLang.local.identity_proof,
                onChanged: (v) => setState(() => _idType = _idTypes[v]),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(child: AppFormField(controller: _idNoCtrl, hint: AppLang.local.id_number)),
          ],
        ),
      ],
    );
  }

  Widget _buildContactInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeader(AppLang.local.contact_information),
        const SizedBox(height: 16),
        // 7-level dependent dropdown — same as web app's LocationPicker.
        // Region → Sub Region → District → County → Sub County → Parish → Village
        LocationPicker(
          onChange: (sel) {
            _location = sel;
          },
        ),
      ],
    );
  }

  Widget _buildFamilyInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeader(AppLang.local.family_information),
        const SizedBox(height: 16),
        // EKiBBO Sheet-3: Next of Kin = alternative phone (per Issac Q4)
        AppFormField(
          controller: _nextOfKinAltPhoneCtrl,
          hint: AppLang.local.next_of_kin_alt_phone,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            // EKiBBO Sheet-3: renamed "No of Family Members" → "Household Size"
            Expanded(
              child: AppFormField(
                controller: _householdSizeCtrl,
                hint: AppLang.local.household_size,
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AppFormField(
                controller: _childrenUnder18Ctrl,
                hint: AppLang.local.total_children_below_18,
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        AppFormField(
          controller: _schoolGoingChildrenCtrl,
          hint: AppLang.local.total_school_going_children,
          keyboardType: TextInputType.number,
        ),
      ],
    );
  }

  Widget _buildCertificationInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeader(AppLang.local.certificate_information),
        const SizedBox(height: 16),
        SwitchListTile(
          title: Text(AppLang.local.is_certified, style: TextStyleConstant.robotoW500(fontSize: 14)),
          value: _isCertified,
          activeColor: ColorConstant.primary,
          contentPadding: EdgeInsets.zero,
          onChanged: (v) => setState(() => _isCertified = v),
        ),
        if (_isCertified) ...[
          Row(
            children: [
              // EKiBBO Sheet-3: RA, Organic, Fairtrade, 4C (per Issac clarification)
              Expanded(
                child: AppDropwdownButton(
                  items: _certTypes,
                  itemSelected: _certificationType,
                  hintText: AppLang.local.certification_type,
                  onChanged: (v) => setState(() => _certificationType = _certTypes[v]),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppDropwdownButton(
                  items: _icsYears,
                  itemSelected: _icsYear,
                  hintText: AppLang.local.year_of_ics,
                  onChanged: (v) => setState(() => _icsYear = _icsYears[v]),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildFinanceInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeader(AppLang.local.finance_information),
        const SizedBox(height: 16),
        SwitchListTile(
          title: Text(AppLang.local.loan_taken_last_year, style: TextStyleConstant.robotoW500(fontSize: 14)),
          value: _loanTakenLastYear,
          activeColor: ColorConstant.primary,
          contentPadding: EdgeInsets.zero,
          onChanged: (v) => setState(() => _loanTakenLastYear = v),
        ),
        if (_loanTakenLastYear) ...[
          // EKiBBO Sheet-3: Loan source = crop type sold to EKiBBO (per Issac clarification)
          AppDropwdownButton(
            items: _loanSources,
            itemSelected: _loanSource,
            hintText: AppLang.local.loan_source_crop_sold_ekibbo,
            onChanged: (v) => setState(() => _loanSource = _loanSources[v]),
          ),
          const SizedBox(height: 12),
          AppFormField(
            controller: _loanAmountCtrl,
            hint: AppLang.local.loan_amount,
            keyboardType: TextInputType.number,
          ),
        ],
      ],
    );
  }
}
