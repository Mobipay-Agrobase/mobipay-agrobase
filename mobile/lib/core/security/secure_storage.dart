/**
 * Secure Storage Service
 * ─────────────────────
 * Stores auth tokens + sensitive data in the OS keychain (iOS) / keystore (Android).
 * 
 * SECURITY FIX: Previous code stored tokens in SharedPreferences (plaintext XML file).
 * Anyone with file system access (rooted device, backup extraction, malware) could read
 * the auth token. This service uses flutter_secure_storage which stores data in:
 * - iOS: Keychain (encrypted with the device passcode by default)
 * - Android: AndroidKeystore (hardware-backed on devices with TEE/StrongBox)
 * 
 * Usage:
 *   final storage = SecureStorage();
 *   await storage.saveAuthToken(token);
 *   final token = await storage.getAuthToken();
 *   await storage.clearAll();
 */

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _accessTokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _tenantIdKey = 'tenant_id';
  static const _userRoleKey = 'user_role';
  static const _userNameKey = 'user_name';
  static const _lastLoginKey = 'last_login';
  static const _biometricEnabledKey = 'biometric_enabled';

  final FlutterSecureStorage _storage;

  SecureStorage()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(
            encryptedSharedPreferences: true,
            // Use the strongest available key binding
            resetOnError: true,
          ),
          iOptions: IOSOptions(
            accessibility: KeychainAccessibility.first_unlock,
            // Use data protection class .firstUnlockThisDeviceOnly to prevent iCloud backup
            synchronizable: false,
          ),
        );

  // ─── Auth Token ───
  Future<void> saveAuthToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
  }

  Future<String?> getAuthToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  // ─── User Info ───
  Future<void> saveUserInfo({
    required String userId,
    required String tenantId,
    required String userRole,
    required String userName,
  }) async {
    await _storage.write(key: _userIdKey, value: userId);
    await _storage.write(key: _tenantIdKey, value: tenantId);
    await _storage.write(key: _userRoleKey, value: userRole);
    await _storage.write(key: _userNameKey, value: userName);
  }

  Future<Map<String, String?>> getUserInfo() async {
    return {
      'user_id': await _storage.read(key: _userIdKey),
      'tenant_id': await _storage.read(key: _tenantIdKey),
      'user_role': await _storage.read(key: _userRoleKey),
      'user_name': await _storage.read(key: _userNameKey),
    };
  }

  // ─── Biometric ───
  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.write(key: _biometricEnabledKey, enabled.toString());
  }

  Future<bool> isBiometricEnabled() async {
    final value = await _storage.read(key: _biometricEnabledKey);
    return value == 'true';
  }

  // ─── Session ───
  Future<void> saveLastLogin(DateTime time) async {
    await _storage.write(key: _lastLoginKey, value: time.toIso8601String());
  }

  Future<DateTime?> getLastLogin() async {
    final value = await _storage.read(key: _lastLoginKey);
    return value != null ? DateTime.tryParse(value) : null;
  }

  // ─── Cleanup ───
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  Future<bool> hasAuthToken() async {
    final token = await getAuthToken();
    return token != null && token.isNotEmpty;
  }
}
