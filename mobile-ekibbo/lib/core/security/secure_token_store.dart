/**
 * Secure Token Store (mobile-ekibbo)
 * ───────────────────────────────────
 * Stores the auth tokens (accessToken / sellerToken) in the OS keychain
 * (iOS) / AndroidKeystore (Android) via flutter_secure_storage.
 *
 * SECURITY FIX (security review follow-up): previously both tokens lived in
 * SharedPreferences — a plaintext XML file readable by anyone with file
 * system access (rooted device, backup extraction, malware). This store
 * moves them into:
 *   - iOS: Keychain (encrypted, device-bound, no iCloud backup)
 *   - Android: AndroidKeystore (hardware-backed on TEE/StrongBox devices)
 *
 * The main `mobile/` agrobase app already used this exact pattern
 * (mobile/lib/core/security/secure_storage.dart); this brings the ekibbo
 * app to parity.
 *
 * One-time migration: `migrateFromSharedPreferences()` copies any legacy
 * plaintext tokens into secure storage and wipes the plaintext keys, so
 * field officers who update the app stay logged in.
 */
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SecureTokenStore {
  SecureTokenStore._privateConstructor();
  static final SecureTokenStore instance = SecureTokenStore._privateConstructor();

  static const String _accessTokenKey = 'auth_token';
  static const String _sellerTokenKey = 'seller_token';
  // Legacy plaintext keys (enum SharedKey names in shared_manager.dart).
  static const String _legacyAccessTokenKey = 'accessToken';
  static const String _legacySellerTokenKey = 'sellerToken';

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      // Re-create the keystore entry if it becomes unreadable
      // (e.g. after a backup restore to a different device) rather
      // than crashing — the user simply re-logs in.
      resetOnError: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
      // Device-only: never synced to iCloud.
      synchronizable: false,
    ),
  );

  /// Read the auth token from secure storage (null if absent).
  Future<String?> readAccessToken() async {
    try {
      return await _storage.read(key: _accessTokenKey);
    } catch (_) {
      return null; // fail closed — treated as logged out
    }
  }

  /// Read the seller token from secure storage (null if absent).
  Future<String?> readSellerToken() async {
    try {
      return await _storage.read(key: _sellerTokenKey);
    } catch (_) {
      return null;
    }
  }

  /// Persist the auth token ('' deletes it — never store an empty token).
  Future<void> writeAccessToken(String value) async {
    if (value.isEmpty) {
      await deleteAccessToken();
      return;
    }
    await _storage.write(key: _accessTokenKey, value: value);
  }

  /// Persist the seller token ('' deletes it).
  Future<void> writeSellerToken(String value) async {
    if (value.isEmpty) {
      await deleteSellerToken();
      return;
    }
    await _storage.write(key: _sellerTokenKey, value: value);
  }

  Future<void> deleteAccessToken() async {
    try {
      await _storage.delete(key: _accessTokenKey);
    } catch (_) {}
  }

  Future<void> deleteSellerToken() async {
    try {
      await _storage.delete(key: _sellerTokenKey);
    } catch (_) {}
  }

  Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
    } catch (_) {}
  }

  /// One-time migration: if secure storage is empty but the legacy
  /// plaintext SharedPreferences keys still hold tokens (pre-update
  /// install), copy them into secure storage and wipe the plaintext
  /// keys. Returns the migrated access token, if any.
  Future<String?> migrateFromSharedPreferences(SharedPreferences shared) {
    return _migrate(shared);
  }

  Future<String?> _migrate(SharedPreferences shared) async {
    try {
      final secureToken = await readAccessToken();
      if (secureToken != null && secureToken.isNotEmpty) {
        // Already migrated (or fresh login on the new path). Still wipe any
        // stale plaintext leftovers from before the migration.
        if (shared.containsKey(_legacyAccessTokenKey)) {
          shared.remove(_legacyAccessTokenKey);
        }
        if (shared.containsKey(_legacySellerTokenKey)) {
          shared.remove(_legacySellerTokenKey);
        }
        return null;
      }

      final legacyToken = shared.getString(_legacyAccessTokenKey);
      final legacySeller = shared.getString(_legacySellerTokenKey);

      if (legacyToken != null && legacyToken.isNotEmpty) {
        await _storage.write(key: _accessTokenKey, value: legacyToken);
        if (legacySeller != null && legacySeller.isNotEmpty) {
          await _storage.write(key: _sellerTokenKey, value: legacySeller);
        }
        // Wipe the plaintext copies — this is the whole point.
        await shared.remove(_legacyAccessTokenKey);
        await shared.remove(_legacySellerTokenKey);
        return legacyToken;
      }

      // Nothing to migrate.
      await shared.remove(_legacyAccessTokenKey);
      await shared.remove(_legacySellerTokenKey);
      return null;
    } catch (_) {
      // Migration is best-effort; on failure the user re-logs in.
      return null;
    }
  }
}
