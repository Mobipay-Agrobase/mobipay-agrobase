/**
 * VSLA V2 — Group Settings Page (Mobile)
 * Each group has its own dynamic configuration that admins can change.
 */
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:agrobase_mobile/features/vsla_v2/data/services/vsla_v2_api.dart';

class GroupSettingsPage extends StatefulWidget {
  final String groupId;
  final String groupName;

  const GroupSettingsPage({super.key, required this.groupId, required this.groupName});

  @override
  State<GroupSettingsPage> createState() => _GroupSettingsPageState();
}

class _GroupSettingsPageState extends State<GroupSettingsPage> {
  final _formKey = GlobalKey<FormState>();
  Map<String, dynamic> _form = {};
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadGroup();
  }

  Future<void> _loadGroup() async {
    try {
      final res = await http.get(
        Uri.parse('${VslaV2Api.baseUrl}/api/vsla-v2/groups/${widget.groupId}'),
        headers: VslaV2Api._headers,
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['group'];
        setState(() {
          _form = {
            'name': data['name'] ?? '',
            'region': data['region'] ?? '',
            'district': data['district'] ?? '',
            'sharePrice': data['sharePrice']?.toString() ?? '5000',
            'loanMultiplier': data['loanMultiplier']?.toString() ?? '3',
            'welfareContribution': data['welfareContribution']?.toString() ?? '0',
            'lateAttendanceFine': data['lateAttendanceFine']?.toString() ?? '0',
            'absenceFine': data['absenceFine']?.toString() ?? '0',
            'cycleLengthDays': data['cycleLengthDays']?.toString() ?? '365',
            'minKeyHolders': data['minKeyHolders']?.toString() ?? '3',
            'maxKeyHolders': data['maxKeyHolders']?.toString() ?? '6',
          };
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    try {
      // Convert string values to numbers
      final body = Map<String, dynamic>.from(_form);
      for (final key in ['sharePrice', 'loanMultiplier', 'welfareContribution', 'lateAttendanceFine', 'absenceFine', 'cycleLengthDays', 'minKeyHolders', 'maxKeyHolders']) {
        body[key] = double.tryParse(body[key]?.toString() ?? '0') ?? 0;
        if (key == 'cycleLengthDays' || key == 'minKeyHolders' || key == 'maxKeyHolders') {
          body[key] = body[key].toInt();
        }
      }

      final res = await http.put(
        Uri.parse('${VslaV2Api.baseUrl}/api/vsla-v2/groups/${widget.groupId}'),
        headers: VslaV2Api._headers,
        body: jsonEncode(body),
      );

      if (res.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Settings updated successfully'), backgroundColor: Colors.green),
          );
          Navigator.pop(context, true);
        }
      } else {
        final err = jsonDecode(res.body);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(err['error'] ?? 'Failed to save'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Group Settings'), backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.groupName),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _saving ? null : _save,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Basic Info
            _sectionTitle('Basic Information'),
            _textField('Group Name', 'name'),
            _row([
              _textField('District', 'district'),
              _textField('Region', 'region'),
            ]),

            // Savings
            _sectionTitle('Savings Configuration'),
            _numberField('Share Price (UGX)', 'sharePrice'),
            _helperText('Price per share — drives sharesBought calculation'),

            // Loans
            _sectionTitle('Loan Configuration'),
            _row([
              _numberField('Loan Multiplier', 'loanMultiplier'),
              _numberField('Cycle Length (days)', 'cycleLengthDays'),
            ]),
            _helperText('Max loan = member savings × multiplier'),

            // Welfare & Fines
            _sectionTitle('Welfare & Fines'),
            _row([
              _numberField('Welfare (UGX)', 'welfareContribution'),
              _numberField('Late Fine (UGX)', 'lateAttendanceFine'),
              _numberField('Absence Fine (UGX)', 'absenceFine'),
            ]),

            // Key Holders
            _sectionTitle('Key Holder Configuration'),
            _row([
              _numberField('Min Key Holders', 'minKeyHolders'),
              _numberField('Max Key Holders', 'maxKeyHolders'),
            ]),

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _saving
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save Settings'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
    );
  }

  Widget _textField(String label, String key) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextFormField(
        initialValue: _form[key]?.toString() ?? '',
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
        onChanged: (v) => _form[key] = v,
      ),
    );
  }

  Widget _numberField(String label, String key) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(right: 8, bottom: 8),
        child: TextFormField(
          initialValue: _form[key]?.toString() ?? '',
          decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
          keyboardType: TextInputType.number,
          onChanged: (v) => _form[key] = v,
        ),
      ),
    );
  }

  Widget _row(List<Widget> children) => Row(children: children);

  Widget _helperText(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 8, left: 4),
    child: Text(text, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
  );
}
