/**
 * Biometric Authentication Service
 * ──────────────────────────────
 * Uses fingerprint / Face ID for app unlock + sensitive operations.
 * 
 * SECURITY:
 * - App unlock: optional (user can enable in settings)
 * - Financial operations (disburse, approve loan, transfer): MANDATORY biometric
 *   prompt — even if biometric unlock is disabled, financial ops require it.
 * - Falls back to device PIN if biometrics unavailable.
 */

import 'package:local_auth/local_auth.dart';

class BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();

  /// Check if device supports biometric authentication
  Future<bool> isBiometricAvailable() async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isDeviceSupported = await _auth.isDeviceSupported();
      return canCheck && isDeviceSupported;
    } catch (e) {
      return false;
    }
  }

  /// Get list of enrolled biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      return [];
    }
  }

  /// Authenticate with biometric or device PIN
  /// Returns true on success, false on failure/cancel
  Future<bool> authenticate({
    String reason = 'Please authenticate to continue',
    bool biometricOnly = false,
  }) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: AuthenticationOptions(
          biometricOnly: biometricOnly,
          stickyAuth: true,
          useErrorDialogs: true,
        ),
      );
    } catch (e) {
      return false;
    }
  }

  /// Mandatory biometric check for financial operations.
  /// Always prompts — user cannot skip.
  Future<bool> authenticateForFinancialOp({String op = 'this operation'}) async {
    final available = await isBiometricAvailable();
    if (!available) {
      // If biometrics aren't available, fall back to device PIN
      return await _auth.authenticate(
        localizedReason: 'Authenticate to authorize $op',
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
          useErrorDialogs: true,
        ),
      );
    }
    return await _auth.authenticate(
      localizedReason: 'Authenticate to authorize $op',
      options: const AuthenticationOptions(
        biometricOnly: true,  // Force biometric for financial ops
        stickyAuth: true,
        useErrorDialogs: true,
      ),
    );
  }
}
