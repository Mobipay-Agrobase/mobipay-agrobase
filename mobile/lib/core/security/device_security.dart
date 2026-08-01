import 'dart:io';

/// Device Security — stubbed (root_jailbreak_sniffer removed for build compatibility).
/// In production, replace with a native plugin or platform channel.
class DeviceSecurity {
  static Future<bool> isDeviceCompromised() async {
    return false;
  }

  static Future<bool> shouldBlockFinancialOps() async {
    return false;
  }

  static bool get isRooted => false;
  static bool get isJailbroken => false;
}
