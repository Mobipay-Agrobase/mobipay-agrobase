import 'package:flutter/material.dart';
import '../core/config.dart';
import '../services/api_service.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController(text: 'eric@mobipay.agrobase');
  final _passwordCtrl = TextEditingController(text: 'mobipay2025');
  bool _busy = false;
  String? _error;

  Future<void> _login({String? email, String? password}) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ApiService().login(
        email ?? _emailCtrl.text.trim(),
        password ?? _passwordCtrl.text,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),
              Container(
                width: 64,
                height: 64,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF059669),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Text('M', style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                ),
              ),
              const Text('MobiPay Agrobase', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              const Text('V3 — VSLA Module', style: TextStyle(fontSize: 16, color: Colors.grey)),
              const SizedBox(height: 32),
              TextField(
                controller: _emailCtrl,
                decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passwordCtrl,
                decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
                obscureText: true,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    border: Border.all(color: Colors.red.shade200),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(_error!, style: TextStyle(color: Colors.red.shade800, fontSize: 13)),
                ),
              ],
              const SizedBox(height: 20),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _busy ? null : () => _login(),
                  child: _busy
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Sign in'),
                ),
              ),
              const SizedBox(height: 32),
              const Text('Quick login (one tap)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
              const SizedBox(height: 8),
              ...Config.demoCredentials.map((c) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${c.email}\n${c.description}', style: const TextStyle(fontSize: 12)),
                  isThreeLine: true,
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(c.role, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 4),
                      Text(c.password, style: const TextStyle(fontSize: 10, color: Colors.grey, fontFamily: 'monospace')),
                    ],
                  ),
                  onTap: _busy ? null : () => _login(email: c.email, password: c.password),
                ),
              )),
              const SizedBox(height: 24),
              const Text(
                'Demo only — no real authentication. Point baseUrl to your server in lib/core/config.dart.',
                style: TextStyle(fontSize: 11, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
