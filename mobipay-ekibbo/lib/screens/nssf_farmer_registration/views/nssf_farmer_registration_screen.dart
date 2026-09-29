import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_form_field.dart';
import 'package:mobipay_ekibbo/components/location_picker.dart';
import 'package:mobipay_ekibbo/components/value_chain_multi_select.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/data/nssf_sync_engine.dart';

/// NSSF Extension Officer — Farmer Enroll / Edit screen.
///
/// Single form for both CREATE and EDIT modes. Captures exactly the 6 NSSF
/// data points (gender added per user feedback):
///   1. Full Name (firstName + lastName)
///   2. NIN (National Identification Number)
///   3. Phone (validated unique per tenant — server returns 409 if dup)
///   4. Gender (Male / Female / Other)
///   5. Value chain (multi-select from 12 official NSSF value chains)
///   6. Location hierarchy (7-level dependent dropdowns)
///
/// Offline-first: always saves to local SQLite first, then attempts sync.
/// After successful CREATE, the form is fully reset (including location) so
/// the officer can enroll the next farmer immediately.
class NssfFarmerRegistrationScreen extends StatefulWidget {
  /// If provided, the screen operates in EDIT mode — fetches the existing farmer
  /// and submits via PUT /api/farmers/[id]. If null, CREATE mode — submits via POST.
  final String? farmerId;

  const NssfFarmerRegistrationScreen({super.key, this.farmerId});

  @override
  State<NssfFarmerRegistrationScreen> createState() => _NssfFarmerRegistrationScreenState();
}

class _NssfFarmerRegistrationScreenState extends State<NssfFarmerRegistrationScreen> {
  // Form controllers
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _ninCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  // Selections
  String? _gender; // Male / Female / Other
  List<String> _valueChains = [];
  LocationSelection? _location;

  // State
  bool _saving = false;
  bool _loading = false;
  int _resetCounter = 0; // bumped to trigger LocationPicker reset
  LocationSelection? _initialLocation; // for edit mode

  bool get _isEdit => widget.farmerId != null && widget.farmerId!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      _loadExistingFarmer(widget.farmerId!);
    }
  }

  Future<void> _loadExistingFarmer(String farmerId) async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get('/api/farmers/$farmerId');
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        final f = (d['data'] ?? d['farmer'] ?? d) as Map<String, dynamic>;
        setState(() {
          _firstNameCtrl.text = (f['firstName'] ?? '') as String;
          _lastNameCtrl.text = (f['lastName'] ?? '') as String;
          _ninCtrl.text = (f['nssfNationalId'] ?? f['nationalIdNo'] ?? '') as String;
          _phoneCtrl.text = (f['phone'] ?? '') as String;
          _gender = (f['gender'] ?? '') as String;
          if (_gender!.isEmpty) _gender = null;
          _valueChains = (f['nssfValueChains'] is List)
              ? List<String>.from((f['nssfValueChains'] as List).where((e) => e != null).map((e) => e.toString()))
              : (f['nssfValueChain'] != null && (f['nssfValueChain'] as String).isNotEmpty
                  ? [f['nssfValueChain'] as String]
                  : <String>[]);
          // Load full location chain via villageId → ancestors API
          final villageId = (f['villageId'] ?? '') as String;
          if (villageId.isNotEmpty) {
            _initialLocation = LocationSelection(villageId: villageId);
          }
        });
      } else {
        _showError('Failed to load farmer (HTTP ${res.statusCode})');
      }
    } catch (e) {
      _showError('Network error loading farmer: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _ninCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    // Validate all required fields
    if (_firstNameCtrl.text.trim().isEmpty) {
      _showError('Please enter the farmer\'s first name');
      return;
    }
    if (_lastNameCtrl.text.trim().isEmpty) {
      _showError('Please enter the farmer\'s last name');
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
    if (_gender == null || _gender!.isEmpty) {
      _showError('Please select the farmer\'s gender');
      return;
    }
    if (_valueChains.isEmpty) {
      _showError('Please select at least one value chain');
      return;
    }
    if (!_isEdit && _location?.villageId == null) {
      _showError('Please select the full location hierarchy (down to village)');
      return;
    }

    setState(() => _saving = true);
    try {
      final firstName = _firstNameCtrl.text.trim();
      final lastName = _lastNameCtrl.text.trim();
      final phone = _phoneCtrl.text.trim();
      final nin = _ninCtrl.text.trim();
      final gender = _gender!;
      final valueChains = _valueChains;
      final country = _location?.country;
      final province = _location?.regionName;
      final district = _location?.districtName;
      final commune = _location?.countyName;
      final villageId = _location?.villageId;
      final villageName = _location?.villageName ?? _location?.parishName;

      if (_isEdit && widget.farmerId != null) {
        // EDIT mode — try PUT first; if offline, update local row instead
        try {
          final payload = <String, dynamic>{
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
            'gender': gender,
            'nssfNationalId': nin,
            'nationalIdType': 'National ID',
            'nationalIdNo': nin,
            'nssfValueChains': valueChains,
            'nssfValueChain': valueChains.first,
            'status': 'ACTIVE',
            'memberType': 'General',
          };
          if (_location?.villageId != null) {
            payload['country'] = country;
            payload['province'] = province;
            payload['district'] = district;
            payload['commune'] = commune;
            payload['villageId'] = villageId;
            payload['villageName'] = villageName;
          }
          final res = await ApiClient().put('/api/farmers/${widget.farmerId}', body: payload);
          if (res.statusCode == 200 || res.statusCode == 204) {
            if (!mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Farmer updated successfully'),
                backgroundColor: ColorConstant.success,
              ),
            );
            Navigator.of(context).pop(true); // pop with result=true (refresh parent)
            return;
          }
        } catch (_) {
          // Network error — fall through to local save
        }
        // Offline — update local row + mark for sync
        await NssfSyncEngine().updateFarmerLocally(
          localId: widget.farmerId!,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          nin: nin,
          valueChains: valueChains,
          country: country,
          province: province,
          district: district,
          commune: commune,
          villageId: villageId,
          villageName: villageName,
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Farmer updated locally — will sync when internet is available'),
            backgroundColor: ColorConstant.warning,
          ),
        );
        Navigator.of(context).pop(true);
      } else {
        // CREATE mode — save locally first, sync engine attempts POST immediately
        await NssfSyncEngine().saveFarmerLocally(
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          nin: nin,
          valueChains: valueChains,
          country: country,
          province: province,
          district: district,
          commune: commune,
          villageId: villageId,
          villageName: villageName,
          trySync: true,
        );
        final pending = await NssfSyncEngine().countPending();
        if (!mounted) return;
        // Show success message + reset form for next enrollment
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(pending > 0
                ? 'Farmer saved offline — will sync when internet is available'
                : 'Farmer enrolled and synced successfully'),
            backgroundColor: pending > 0 ? ColorConstant.warning : ColorConstant.success,
            duration: const Duration(seconds: 3),
          ),
        );
        // Reset ALL form fields including location
        _firstNameCtrl.clear();
        _lastNameCtrl.clear();
        _ninCtrl.clear();
        _phoneCtrl.clear();
        setState(() {
          _gender = null;
          _valueChains = [];
          _location = null;
          _resetCounter++; // triggers LocationPicker reset via didUpdateWidget
        });
        // Notify parent to refresh (so dashboard count updates immediately)
        // We don't pop — the officer stays on this screen to enroll the next farmer.
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: ColorConstant.danger,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Farmer' : 'Enroll Farmer'),
        backgroundColor: ColorConstant.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Full Name
                      _sectionLabel('1. Full Name *'),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: AppFormField(
                              controller: _firstNameCtrl,
                              hint: 'First Name',
                              keyboardType: TextInputType.name,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: AppFormField(
                              controller: _lastNameCtrl,
                              hint: 'Last Name',
                              keyboardType: TextInputType.name,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // 2. NIN
                      _sectionLabel('2. NIN (National ID Number) *'),
                      const SizedBox(height: 8),
                      AppFormField(
                        controller: _ninCtrl,
                        hint: 'e.g. CM94023102GHK5X',
                        keyboardType: TextInputType.visiblePassword,
                      ),
                      const SizedBox(height: 16),

                      // 3. Phone
                      _sectionLabel('3. Phone Number *'),
                      const SizedBox(height: 8),
                      AppFormField(
                        controller: _phoneCtrl,
                        hint: '+2567XX XXX XXX',
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 16),

                      // 4. Gender (NEW)
                      _sectionLabel('4. Gender *'),
                      const SizedBox(height: 8),
                      _buildGenderSelector(),
                      const SizedBox(height: 16),

                      // 5. Value Chain(s) (multi-select)
                      _sectionLabel('5. Value Chain(s) *'),
                      const SizedBox(height: 8),
                      ValueChainMultiSelect(
                        selected: _valueChains,
                        onChanged: (v) => setState(() => _valueChains = v),
                      ),
                      const SizedBox(height: 16),

                      // 6. Location hierarchy
                      _sectionLabel(_isEdit
                          ? '6. Location (re-select only if changing)'
                          : '6. Location *'),
                      const SizedBox(height: 8),
                      LocationPicker(
                        key: const ValueKey('nssf-location-picker'),
                        onChange: (sel) => setState(() => _location = sel),
                        initial: _initialLocation,
                        resetTrigger: _resetCounter,
                      ),
                      const SizedBox(height: 32),

                      // Submit button — big, bold, easy to tap
                      _buildSubmitButton(),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: TextStyleConstant.quicksandW700(fontSize: 13, color: ColorConstant.heading),
    );
  }

  Widget _buildGenderSelector() {
    return Row(
      children: ['Male', 'Female', 'Other'].map((g) {
        final selected = _gender == g;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _gender = g),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: selected ? ColorConstant.primary : ColorConstant.grayF6F7F9,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: selected ? ColorConstant.primary : ColorConstant.grayEB,
                    width: 1.5,
                  ),
                ),
                child: Text(
                  g,
                  textAlign: TextAlign.center,
                  style: TextStyleConstant.robotoW400(
                    fontSize: 13,
                    color: selected ? Colors.white : ColorConstant.text79,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 54, // big, easy-to-tap target (Material min is 48)
      child: ElevatedButton(
        onPressed: _saving ? null : _save,
        style: ElevatedButton.styleFrom(
          backgroundColor: ColorConstant.primary,
          foregroundColor: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _saving
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  ),
                  SizedBox(width: 12),
                  Text('Saving...'),
                ],
              )
            : Text(
                _isEdit ? 'Update Farmer' : 'Enroll Farmer',
                style: TextStyleConstant.quicksandW700(fontSize: 16, color: Colors.white),
              ),
      ),
    );
  }
}
