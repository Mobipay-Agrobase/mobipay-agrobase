// Core constants and configuration

/// The base URL of the MobiPay Agrobase API.
/// On a physical device, replace with your server's LAN/public IP or domain.
/// For Android emulator: use 10.0.2.2 (maps to host's localhost).
/// For iOS simulator: use localhost.
class Config {
  // For development — point this at your Next.js backend.
  // When deploying, set this to your production URL (e.g. https://agrobase.mobipay.io).
  static const String baseUrl = 'http://10.0.2.2:3000';

  // Demo credentials (mirror of /api/auth/login)
  static const List<DemoCredential> demoCredentials = [
    DemoCredential(
      email: 'eric@mobipay.agrobase',
      password: 'mobipay2025',
      role: 'SUPER_ADMIN',
      name: 'Eric Mwangi',
      description: 'Full platform access',
    ),
    DemoCredential(
      email: 'admin@kilimo.org',
      password: 'kilimo2025',
      role: 'TENANT_ADMIN',
      name: 'Beatrice Auma',
      description: 'Tenant admin',
    ),
    DemoCredential(
      email: 'officer@kilimo.org',
      password: 'officer2025',
      role: 'VSLA_OFFICER',
      name: 'Joel Okello',
      description: 'VSLA field officer',
    ),
    DemoCredential(
      email: 'partner@kilimotrust.org',
      password: 'partner2025',
      role: 'PARTNER_ADMIN',
      name: 'Kilimo Trust Liaison',
      description: 'Partner admin',
    ),
  ];

  static const String currency = 'UGX';
  static const String smsSender = 'KILIMO';
  static const String ussdCode = '*284*97#';
}

class DemoCredential {
  final String email;
  final String password;
  final String role;
  final String name;
  final String description;
  const DemoCredential({
    required this.email,
    required this.password,
    required this.role,
    required this.name,
    required this.description,
  });
}

// Currency formatting
String formatUGX(double? amount) {
  if (amount == null) return 'UGX 0';
  return 'UGX ${amount.toInt().toString().replaceAll(RegExp(r'\B(?=(\d{3})+(?!\d))'), ',')}';
}

String formatNumber(int? n) {
  if (n == null) return '0';
  return n.toString().replaceAll(RegExp(r'\B(?=(\d{3})+(?!\d))'), ',');
}

String formatDate(DateTime? date) {
  if (date == null) return '—';
  return '${date.day.toString().padLeft(2, '0')} ${_monthAbbr(date.month)} ${date.year}';
}

String formatDateTime(DateTime? date) {
  if (date == null) return '—';
  final h = date.hour.toString().padLeft(2, '0');
  final m = date.minute.toString().padLeft(2, '0');
  return '${formatDate(date)} · $h:$m';
}

String _monthAbbr(int m) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[m - 1];
}
