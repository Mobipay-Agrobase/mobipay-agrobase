import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/components/app_form_field.dart';
import 'package:mobipay_ekibbo/components/location_picker.dart';
import 'package:mobipay_ekibbo/components/value_chain_multi_select.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/data/nssf_sync_engine.dart';

/// NSSF Extension Officer — Farmer Enroll / Edit screen.
///
/// Used for both CREATE (no farmerId) and UPDATE (with farmerId) modes.
///
/// Captures exactly the 5 NSSF-required data points:
///   1. Full Name (firstName + lastName)
///   2. NIN (National Identification Number → nssfNationalId)
///   3. Phone (validated unique per tenant — server returns 409 if dup)
///   4. Value chain (multi-select from 12 official NSSF value chains)
///   5. Location hierarchy (7-level dependent dropdowns — same as Ekibbo)
///
/// The /api/farmers POST route auto-maps enrolledByOfficerId to the logged-in
/// extension officer, so the officer sees only their own enrolled farmers in
/// the mobile app. The PUT route preserves enrolledByOfficerId.
class NssfFarmerRegistrationScreen extends StatefulWidget {
  /// If provided, the screen operates in EDIT mode — fetches the existing farmer
  /// and submits via PUT /api/farmers/[id]. If null, CREATE mode — submits via POST.
  final String? farmerId;

  const NssfFarmerRegistrationScreen({super.key, this.farmerId});

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
  bool _loading = false;

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
        final f = d['data'] ?? d['farmer'] ?? d;
        setState(() {
          _firstNameCtrl.text = (f['firstName'] ?? '') as String;
          _lastNameCtrl.text = (f['lastName'] ?? '') as String;
          _ninCtrl.text = (f['nssfNationalId'] ?? f['nationalIdNo'] ?? '') as String;
          _phoneCtrl.text = (f['phone'] ?? '') as String;
          _valueChains = (f['nssfValueChains'] is List)
              ? List<String>.from(f['nssfValueChains'] as List)
              : (f['nssfValueChain'] != null ? [f['nssfValueChain'] as String] : []);
          // Location — we don't fully reselect the village chain in edit mode
          // (would require an ancestor-lookup API). Instead, we show a hint
          // prompting the officer to re-select location only if they want to change it.
          _location = null;
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
    if (!_isEdit && _location?.villageId == null) {
      _showError('Please select the full location hierarchy (down to village)');
      return;
    }

    setState(() => _saving = true);
    try {
      // ─── Offline-first: always save to local SQLite first ───
      // The sync engine will then attempt to push to /api/farmers immediately
      // (if online) OR mark as PENDING for later auto-sync.
      final firstName = _firstNameCtrl.text.trim();
      final lastName = _lastNameCtrl.text.trim();
      final phone = _phoneCtrl.text.trim();
      final nin = _ninCtrl.text.trim();
      final valueChains = _valueChains;
      final country = _location?.country;
      final province = _location?.regionName;
      final district = _location?.districtName;
      final commune = _location?.countyName;
      final villageId = _location?.villageId;
      final villageName = _location?.villageName ?? _location?.parishName;

      if (_isEdit && widget.farmerId != null) {
        // EDIT mode — the farmerId could be either a local_id (offline) or a
        // server_id (already synced). We attempt a PUT first; if that fails
        // (offline), we update the local row instead.
        try {
          final payload = <String, dynamic>{
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
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
            Navigator.of(context).pop();
            return;
          }
          // Server error — fall through to local save with error message
        } catch (_) {
          // Network error — fall through to local save (offline update)
        }
        // Offline / failed — update local row + mark for sync
        await NssfSyncEngine().updateFarmerLocally(
          localId: widget.farmerId!,
          firstName: firstName, lastName: lastName, phone: phone, nin: nin,
          valueChains: valueChains,
          country: country, province: province, district: district,
          commune: commune, villageId: villageId, villageName: villageName,
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Farmer updated locally — will sync when online'),
            backgroundColor: ColorConstant.warning,
          ),
        );
        Navigator.of(context).pop();
      } else {
        // CREATE mode — always save locally first, then sync engine attempts POST
        await NssfSyncEngine().saveFarmerLocally(
          firstName: firstName, lastName: lastName, phone: phone, nin: nin,
          valueChains: valueChains,
          country: country, province: province, district: district,
          commune: commune, villageId: villageId, villageName: villageName,
          trySync: true,
        );
        // Check if it synced successfully
        final pending = await NssfSyncEngine().countPending();
        if (!mounted) return;
        if (pending > 0) {
          // Either offline OR duplicate phone OR server error
          // Show a friendly "saved offline" message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(pending == 1
                  ? 'Farmer saved offline — will sync when internet is available'
                  : 'Farmer saved offline'),
              backgroundColor: ColorConstant.warning,
              duration: const Duration(seconds: 4),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Farmer enrolled + synced successfully'),
              backgroundColor: ColorConstant.success,
            ),
          );
        }
        // Reset form for next enrollment
        _firstNameCtrl.clear();
        _lastNameCtrl.clear();
        _ninCtrl.clear();
        _phoneCtrl.clear();
        setState(() {
          _valueChains = [];
          _location = null;
        });
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
      SnackBar(content: Text(msg), backgroundColor: ColorConstant.danger),
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
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
                      keyboardType: TextInputType.visiblePassword,
                    ),
                    const SizedBox(height: 16),
                    // 3. Phone
                    Text('3. Phone Number *', style: TextStyleConstant.quicksandW700(fontSize: 13)),
                    const SizedBox(height: 8),
                    AppFormField(
                      controller: _phoneCtrl,
                      hint: '+2567XX XXX XXX',
                      keyboardType: TextInputType.phone,
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
                    Text(
                      _isEdit ? '5. Location (re-select only if changing)' : '5. Location *',
                      style: TextStyleConstant.quicksandW700(fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    LocationPicker(
                      onChange: (sel) => setState(() => _location = sel),
                    ),
                    const SizedBox(height: 32),
                    // Submit button
                    AppButton(
                      title: _saving
                          ? (_isEdit ? 'Updating...' : 'Enrolling...')
                          : (_isEdit ? 'Update Farmer' : 'Enroll Farmer'),
                      isLoading: _saving,
                      onTap: _saving ? null : _save,
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }
}
