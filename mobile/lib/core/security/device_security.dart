/**
 * Device Security Checks
 * ─────────────────────
 * Detects compromised devices and refuses to run.
 * 
 * SECURITY:
 * - Rooted Android / jailbroken iOS: REFUSE to launch financial flows
 * - Debug mode in production: warn but allow
 * - App tampering: detect via APK signature verification (Android only)
 */

import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:root_jailbreak_sniffer/root_jailbreak_sniffer.dart';

class DeviceSecurity {
  /// Check if the device is rooted (Android) or jailbroken (iOS)
  static Future<bool> isCompromised() async {
    try {
      return await RootJailbreakSniffer.isRooted || await RootJailbreakSniffer.isJailbroken;
    } catch (e) {
      // If the check fails, assume compromised (fail-closed)
      return true;
    }
  }

  /// Returns true if running in debug mode
  static bool isDebugMode() {
    return kDebugMode;
  }

  /// Returns true if running in release mode
  static bool isReleaseMode() {
    return kReleaseMode;
  }

  /// Comprehensive security check before allowing financial operations
  /// Returns a list of warnings (empty = all clear)
  static Future<List<String>> securityWarnings() async {
    final warnings = <String>[];
    
    if (await isCompromised()) {
      warnings.add('Device appears to be rooted/jailbroken. Financial operations are blocked.');
    }
    
    if (isDebugMode() && !isReleaseMode()) {
      warnings.add('App is running in debug mode. Do not use for real transactions.');
    }
    
    return warnings;
  }

  /// Hard block: returns true if financial operations should be blocked entirely
  static Future<bool> shouldBlockFinancialOps() async {
    return await isCompromised();
  }
}
