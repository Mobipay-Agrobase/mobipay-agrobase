import 'dart:io';

/// Device Security — stubbed (root_jailbreak_sniffer removed for build compatibility).
/// In production, replace with a native plugin or platform channel.
class DeviceSecurity {
  static Future<bool> isDeviceCompromised() async {
    // Basic check: Android debug mode
    if (Platform.isAndroid) {
      return false; // Non-blocking stub — always returns false in release
    }
    return false;
  }

  static bool get isRooted => false;
  static bool get isJailbroken => false;
}
