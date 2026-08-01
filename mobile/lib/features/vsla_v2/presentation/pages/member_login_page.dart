/**
 * VSLA V2 — Member Login (SMS OTP)
 * SRS 4: Members log in with SMS credentials (member ID + PIN → OTP)
 */
import 'package:flutter/material.dart';
import 'package:agrobase_mobile/features/vsla_v2/data/services/vsla_v2_api.dart';
import 'package:agrobase_mobile/core/security/secure_storage.dart';
import 'member_dashboard_page.dart';

class MemberLoginPage extends StatefulWidget {
  const MemberLoginPage({super.key});

  @override
  State<MemberLoginPage> createState() => _MemberLoginPageState();
}

class _MemberLoginPageState extends State<MemberLoginPage> {
  final _memberIdController = TextEditingController();
  final _pinController = TextEditingController();
  final _otpController = TextEditingController();
  bool _isLoading = false;
  bool _otpSent = false;
  String? _error;
  String? _phoneHint;

  Future<void> _sendOtp() async {
    if (_memberIdController.text.isEmpty || _pinController.text.length != 4) {
      setState(() => _error = 'Enter your member ID and 4-digit PIN');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await VslaV2Api.loginOtp(
        _memberIdController.text.trim(),
        _pinController.text,
      );
      setState(() {
        _otpSent = true;
        _phoneHint = result['phone'] ?? 'your phone';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.length != 6) {
      setState(() => _error = 'Enter the 6-digit code from SMS');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await VslaV2Api.verifyOtp(
        _memberIdController.text.trim(),
        _otpController.text,
      );

      // Save token to secure storage
      final storage = SecureStorage();
      await storage.saveAuthToken(result['token']);
      await storage.saveUserInfo(
        userId: result['member']['id'],
        tenantId: result['member']['groupId'],
        userRole: 'VSLA_MEMBER',
        userName: result['member']['fullName'],
      );

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const MemberDashboardPage()),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('VSLA Member Login'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.groups, size: 64, color: Color(0xFF059669)),
              const SizedBox(height: 16),
              const Text(
                'MobiPay VSLA',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const Text(
                'Member Login',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
              const SizedBox(height: 32),

              if (!_otpSent) ...[
                TextField(
                  controller: _memberIdController,
                  decoration: const InputDecoration(
                    labelText: 'Member ID',
                    hintText: 'VSLA-MBR-0001',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.badge),
                  ),
                  textCapitalization: TextCapitalization.characters,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pinController,
                  decoration: const InputDecoration(
                    labelText: 'PIN',
                    hintText: '4-digit PIN',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock),
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  obscureText: true,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                ],
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _isLoading ? null : _sendOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Send OTP'),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.message, color: Colors.green, size: 32),
                      const SizedBox(height: 8),
                      Text(
                        'OTP sent to phone ending $_phoneHint',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.green.shade800, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _otpController,
                  decoration: const InputDecoration(
                    labelText: 'Enter OTP Code',
                    hintText: '000000',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.password),
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, letterSpacing: 8),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                ],
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Verify & Login'),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => setState(() { _otpSent = false; _error = null; }),
                  child: const Text('Back to login'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
