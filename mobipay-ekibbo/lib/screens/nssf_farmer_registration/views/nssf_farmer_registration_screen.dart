import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/components/app_form_field.dart';
import 'package:mobipay_ekibbo/components/location_picker.dart';
import 'package:mobipay_ekibbo/components/value_chain_multi_select.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';

/// NSSF Extension Officer — Farmer Registration screen.
///
/// Lightweight form (only 5 data points) used by NSSF extension officers
/// to enroll farmers in the field. Tomorrow (Sept 26 2026) these officers
/// will go live and enroll farmers across Uganda.
///
/// Data points:
///   1. Full Name (firstName + lastName)
///   2. NIN (National Identification Number — stored as nssfNationalId)
///   3. Phone number (validated unique per tenant — server returns 409 if dup)
///   4. Value chain (multi-select from 12 official NSSF value chains)
///   5. Location hierarchy (7-level, same as Ekibbo)
///
/// The /api/farmers POST route auto-maps enrolledByOfficerId to the logged-in
/// extension officer, so the officer sees only their own enrolled farmers in
/// the mobile app (and the NSSF admin sees all farmers across all officers
/// in the web dashboard).
class NssfFarmerRegistrationScreen extends StatefulWidget {
  const NssfFarmerRegistrationScreen({super.key});

  @override
  State<NssfFarmerRegistrationScreen> createState() => _NssfFarmerRegistrationScreenState();
}

class _NssfFarmerRegistrationScreenState extends State<NssfFarmerRegistrationScreen> {
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _ninCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  List<String> _valueChains = [];
  LocationSelection? _location;
  bool _saving = false;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _ninCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    // Validate all 5 required data points
    if (_firstNameCtrl.text.trim().isEmpty || _lastNameCtrl.text.trim().isEmpty) {
      _showError('Please enter the farmer\'s full name');
      return;
    }
    if (_ninCtrl.text.trim().isEmpty) {
      _showError('NIN (National ID Number) is required');
      return;
    }
    if (_phoneCtrl.text.trim().isEmpty) {
      _showError('Phone number is required');
      return;
    }
    if (_valueChains.isEmpty) {
      _showError('Please select at least one value chain');
      return;
    }
    if (_location?.village == null) {
      _showError('Please select the full location hierarchy (down to village)');
      return;
    }

    setState(() => _saving = true);
    try {
      final payload = <String, dynamic>{
        'firstName': _firstNameCtrl.text.trim(),
        'lastName': _lastNameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        // NSSF-specific: NIN (National Identification Number)
        'nssfNationalId': _ninCtrl.text.trim(),
        'nationalIdType': 'National ID',
        'nationalIdNo': _ninCtrl.text.trim(),
        // NSSF multi-value-chain
        'nssfValueChains': _valueChains,
        'nssfValueChain': _valueChains.first,  // backward-compat single value chain
        'nssfActivationStatus': 'PENDING',
        'nssfEnrolledAt': DateTime.now().toIso8601String(),
        // Location (7-level hierarchy → flat FarmerProfile fields)
        ...?_location?.toFarmerPayload(),
        // Farmer status
        'status': 'ACTIVE',
        'memberType': 'General',
      };

      final res = await ApiClient().post('/api/farmers', body: payload);
      if (res.statusCode == 201 || res.statusCode == 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Farmer enrolled successfully'),
            backgroundColor: ColorConstant.success,
          ),
        );
        // Reset form for next enrollment
        _firstNameCtrl.clear();
        _lastNameCtrl.clear();
        _ninCtrl.clear();
        _phoneCtrl.clear();
        setState(() {
          _valueChains = [];
          _location = null;
        });
      } else if (res.statusCode == 409) {
        // Duplicate phone — server already has this farmer
        try {
          final d = jsonDecode(res.body);
          final existing = d['existingFarmer'] ?? {};
          _showError(
            'Phone ${_phoneCtrl.text.trim()} already enrolled as: '
            '${existing['name'] ?? 'another farmer'} '
            '— please verify the number.',
          );
        } catch (_) {
          _showError('This phone number is already enrolled');
        }
      } else {
        String err = 'Failed (HTTP ${res.statusCode})';
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? d['message'] ?? err;
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
      appBar: AppBar(
        title: const Text('Enroll Farmer (NSSF)'),
        backgroundColor: ColorConstant.primary,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Info banner
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFC7D2FE)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, size: 18, color: Color(0xFF4F46E5)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Capture all 5 data points. Phone numbers are checked against existing records.',
                        style: TextStyleConstant.robotoW400(fontSize: 12, color: const Color(0xFF4338CA)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // 1. Full Name (firstName + lastName on one row)
              Text('1. Full Name *', style: TextStyleConstant.quicksandW700(fontSize: 13)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: AppFormField(controller: _firstNameCtrl, hint: 'First Name')),
                  const SizedBox(width: 8),
                  Expanded(child: AppFormField(controller: _lastNameCtrl, hint: 'Last Name')),
                ],
              ),
              const SizedBox(height: 16),
              // 2. NIN
              Text('2. NIN (National ID Number) *', style: TextStyleConstant.quicksandW700(fontSize: 13)),
              const SizedBox(height: 8),
              AppFormField(
                controller: _ninCtrl,
                hint: 'e.g. CM94023102GHK5X',
                // NIN in Uganda is 14 alphanumeric chars
                inputType: TextInputType.visiblePassword,
              ),
              const SizedBox(height: 16),
              // 3. Phone
              Text('3. Phone Number *', style: TextStyleConstant.quicksandW700(fontSize: 13)),
              const SizedBox(height: 8),
              AppFormField(
                controller: _phoneCtrl,
                hint: '+2567XX XXX XXX',
                inputType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              // 4. Value Chain (multi-select)
              Text('4. Value Chain(s) *', style: TextStyleConstant.quicksandW700(fontSize: 13)),
              const SizedBox(height: 8),
              ValueChainMultiSelect(
                selected: _valueChains,
                onChanged: (v) => setState(() => _valueChains = v),
              ),
              const SizedBox(height: 16),
              // 5. Location hierarchy (7-level dependent dropdowns)
              Text('5. Location *', style: TextStyleConstant.quicksandW700(fontSize: 13)),
              const SizedBox(height: 8),
              LocationPicker(
                onChanged: (sel) => setState(() => _location = sel),
              ),
              const SizedBox(height: 32),
              // Submit button
              AppButton(
                buttonText: _saving ? 'Enrolling...' : 'Enroll Farmer',
                isLoading: _saving,
                onPressed: _saving ? null : _save,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
