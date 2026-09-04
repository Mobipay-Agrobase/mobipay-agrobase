// Mobile farmer edit page — opens when a user taps "Edit" on the farmer detail
// page. Fetches the farmer by ID, populates a form, PUTs to /api/farmers/:id.
//
// Mirrors the web EditFarmerDialog but as a full-screen Flutter page with
// the most commonly-edited fields (demographics + location + farm + finance).
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/theme/app_theme.dart';

class FarmerEditPage extends StatefulWidget {
  final String farmerId;
  const FarmerEditPage({super.key, required this.farmerId});

  @override
  State<FarmerEditPage> createState() => _FarmerEditPageState();
}

class _FarmerEditPageState extends State<FarmerEditPage> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = true;
  bool _saving = false;
  Map<String, dynamic> _form = {};

  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _district = TextEditingController();
  final _village = TextEditingController();
  final _farmSize = TextEditingController();
  final _mainCrops = TextEditingController();
  final _familyMembers = TextEditingController();
  final _monthlyIncome = TextEditingController();
  String? _gender;
  String? _education;
  String? _maritalStatus;

  @override
  void initState() {
    super.initState();
    _loadFarmer();
  }

  Future<void> _loadFarmer() async {
    try {
      final res = await ApiClient().get('/api/farmers/${widget.farmerId}');
      if (res.statusCode == 200) {
        final body = res.body;
        final data = jsonDecode(body) as Map<String, dynamic>;
        final farmer = (data['data'] ?? data) as Map<String, dynamic>;
        setState(() {
          _firstName.text = farmer['firstName']?.toString() ?? '';
          _lastName.text = farmer['lastName']?.toString() ?? '';
          _phone.text = farmer['phone']?.toString() ?? '';
          _email.text = farmer['email']?.toString() ?? '';
          _district.text = farmer['district']?.toString() ?? '';
          _village.text = farmer['villageName']?.toString() ?? '';
          _farmSize.text = farmer['farmSize']?.toString() ?? '';
          _mainCrops.text = farmer['mainCrops'] is String
              ? farmer['mainCrops'] as String
              : (farmer['mainCrops'] is List ? (farmer['mainCrops'] as List).join(', ') : '');
          _familyMembers.text = farmer['familyMembers']?.toString() ?? '';
          _monthlyIncome.text = farmer['monthlyHouseholdIncome']?.toString() ?? '';
          _gender = farmer['gender'] as String?;
          _education = farmer['education'] as String?;
          _maritalStatus = farmer['maritalStatus'] as String?;
          _form = farmer;
          _loading = false;
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to load farmer'), backgroundColor: AppTheme.errorRed),
          );
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.errorRed),
        );
        Navigator.pop(context);
      }
    }
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
        'phone': _phone.text.trim(),
        'memberType': _form['memberType'] ?? 'General',
      };
      if (_email.text.trim().isNotEmpty) body['email'] = _email.text.trim();
      if (_gender != null) body['gender'] = _gender;
      if (_education != null) body['education'] = _education;
      if (_maritalStatus != null) body['maritalStatus'] = _maritalStatus;
      if (_district.text.trim().isNotEmpty) body['district'] = _district.text.trim();
      if (_village.text.trim().isNotEmpty) body['villageName'] = _village.text.trim();
      if (_farmSize.text.trim().isNotEmpty) {
        body['farmSize'] = double.tryParse(_farmSize.text.trim());
      }
      if (_mainCrops.text.trim().isNotEmpty) {
        body['mainCrops'] = _mainCrops.text
            .split(',')
            .map((c) => c.trim())
            .where((c) => c.isNotEmpty)
            .toList();
      }
      if (_familyMembers.text.trim().isNotEmpty) {
        body['familyMembers'] = int.tryParse(_familyMembers.text.trim());
      }
      if (_monthlyIncome.text.trim().isNotEmpty) {
        body['monthlyHouseholdIncome'] = double.tryParse(_monthlyIncome.text.trim());
      }

      final res = await ApiClient().put('/api/farmers/${widget.farmerId}', body: body);
      if (res.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Farmer updated successfully'), backgroundColor: AppTheme.successGreen),
          );
          Navigator.pop(context, true);
        }
      } else {
        final body = res.body;
        final data = body.isNotEmpty ? jsonDecode(body) as Map<String, dynamic> : <String, dynamic>{};
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['error'] ?? 'Update failed'), backgroundColor: AppTheme.errorRed),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.errorRed),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  InputDecoration _dec(String label) => InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      );

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    _email.dispose();
    _district.dispose();
    _village.dispose();
    _farmSize.dispose();
    _mainCrops.dispose();
    _familyMembers.dispose();
    _monthlyIncome.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit Farmer'), backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Farmer'),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(child: TextFormField(controller: _firstName, decoration: _dec('First Name *'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null)),
                    const SizedBox(width: 8),
                    Expanded(child: TextFormField(controller: _lastName, decoration: _dec('Last Name *'), validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null)),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(controller: _phone, decoration: _dec('Phone *'), keyboardType: TextInputType.phone, validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null),
                const SizedBox(height: 12),
                TextFormField(controller: _email, decoration: _dec('Email'), keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: const ['Male', 'Female'].contains(_gender) ? _gender : null,
                  decoration: _dec('Gender'),
                  items: const [
                    DropdownMenuItem(value: 'Male', child: Text('Male')),
                    DropdownMenuItem(value: 'Female', child: Text('Female')),
                  ],
                  onChanged: (v) => setState(() => _gender = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: const ['None', 'Primary', 'O-Level', 'A-Level', 'Diploma', 'Degree'].contains(_education) ? _education : null,
                  decoration: _dec('Education'),
                  items: const [
                    DropdownMenuItem(value: 'None', child: Text('None')),
                    DropdownMenuItem(value: 'Primary', child: Text('Primary')),
                    DropdownMenuItem(value: 'O-Level', child: Text('O-Level')),
                    DropdownMenuItem(value: 'A-Level', child: Text('A-Level')),
                    DropdownMenuItem(value: 'Diploma', child: Text('Diploma')),
                    DropdownMenuItem(value: 'Degree', child: Text('Degree')),
                  ],
                  onChanged: (v) => setState(() => _education = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: const ['Single', 'Married', 'Divorced', 'Widowed'].contains(_maritalStatus) ? _maritalStatus : null,
                  decoration: _dec('Marital Status'),
                  items: const [
                    DropdownMenuItem(value: 'Single', child: Text('Single')),
                    DropdownMenuItem(value: 'Married', child: Text('Married')),
                    DropdownMenuItem(value: 'Divorced', child: Text('Divorced')),
                    DropdownMenuItem(value: 'Widowed', child: Text('Widowed')),
                  ],
                  onChanged: (v) => setState(() => _maritalStatus = v),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: TextFormField(controller: _district, decoration: _dec('District'))),
                    const SizedBox(width: 8),
                    Expanded(child: TextFormField(controller: _village, decoration: _dec('Village'))),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: TextFormField(controller: _farmSize, decoration: _dec('Farm Size (ha)'), keyboardType: TextInputType.number)),
                    const SizedBox(width: 8),
                    Expanded(child: TextFormField(controller: _familyMembers, decoration: _dec('Family'), keyboardType: TextInputType.number)),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(controller: _mainCrops, decoration: _dec('Main Crops')),
                const SizedBox(height: 12),
                TextFormField(controller: _monthlyIncome, decoration: _dec('Monthly Income (UGX)'), keyboardType: TextInputType.number),
                const SizedBox(height: 24),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _saving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Save Changes'),
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
