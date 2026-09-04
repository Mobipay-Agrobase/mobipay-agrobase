// Mobile password reset flow — 2 steps:
//   1. User enters phone → POST /api/auth/reset-password/request (sends OTP via SMS)
//   2. User enters OTP + new password → POST /api/auth/reset-password/confirm
//
// Mirrors the VSLA OTP login flow but for password reset.
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/theme/app_theme.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _newPasswordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _submitting = false;
  bool _otpSent = false;
  String? _maskedPhone;

  Future<void> _sendOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Phone number is required'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final res = await ApiClient().post('/api/auth/reset-password/request', body: {'phone': phone});
      if (res.statusCode == 200) {
        final body = res.body;
        final data = body.isNotEmpty ? jsonDecode(body) as Map<String, dynamic> : <String, dynamic>{};
        setState(() {
          _otpSent = true;
          _maskedPhone = data['phone'] as String?;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('OTP sent to ${_maskedPhone ?? phone}'),
              backgroundColor: AppTheme.successGreen,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to send OTP'), backgroundColor: AppTheme.errorRed),
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
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _confirmReset() async {
    final phone = _phoneCtrl.text.trim();
    final otp = _otpCtrl.text.trim();
    final newPwd = _newPasswordCtrl.text;
    final confirmPwd = _confirmPasswordCtrl.text;
    if (otp.isEmpty || newPwd.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP and new password are required'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }
    if (newPwd.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }
    if (newPwd != confirmPwd) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final res = await ApiClient().post('/api/auth/reset-password/confirm', body: {
        'phone': phone,
        'otp': otp,
        'newPassword': newPwd,
      });
      if (res.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Password reset successfully. Please log in.'),
              backgroundColor: AppTheme.successGreen,
            ),
          );
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      } else {
        final body = res.body;
        final data = body.isNotEmpty ? jsonDecode(body) as Map<String, dynamic> : <String, dynamic>{};
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['error'] ?? 'Reset failed'),
              backgroundColor: AppTheme.errorRed,
            ),
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
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    _newPasswordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Forgot Password'),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.lock_reset, size: 64, color: AppTheme.primaryGreen),
              const SizedBox(height: 12),
              Text(
                _otpSent ? 'Enter the code we sent you' : 'Reset your password',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                _otpSent
                    ? 'We sent a 6-digit code to ${_maskedPhone ?? 'your phone'}. Enter it below along with your new password.'
                    : 'Enter your registered phone number and we will send you a one-time code (OTP) via SMS.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _phoneCtrl,
                enabled: !_otpSent,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '+256...',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.phone),
                ),
              ),
              if (_otpSent) ...[
                const SizedBox(height: 14),
                TextField(
                  controller: _otpCtrl,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                  decoration: const InputDecoration(
                    labelText: 'OTP (6 digits)',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.password),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _newPasswordCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'New Password',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _confirmPasswordCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Confirm New Password',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _submitting
                      ? null
                      : () => _otpSent ? _confirmReset() : _sendOtp(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: _submitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_otpSent ? 'Reset Password' : 'Send OTP'),
                ),
              ),
              if (_otpSent) ...[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _submitting ? null : _sendOtp,
                  child: const Text('Resend code'),
                ),
                TextButton(
                  onPressed: () => setState(() {
                    _otpSent = false;
                    _otpCtrl.clear();
                    _newPasswordCtrl.clear();
                    _confirmPasswordCtrl.clear();
                  }),
                  child: const Text('Use a different phone number'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
