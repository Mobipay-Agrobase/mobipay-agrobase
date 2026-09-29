# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# ─── Play Core (referenced by Flutter's PlayStoreDeferredComponentManager) ───
# Flutter's deferred-components system references these classes even when the
# app doesn't use Play Store feature splits. R8 strips them, causing:
#   "Missing class com.google.android.play.core.splitcompat.SplitCompatApplication"
#   "Missing class com.google.android.play.core.splitinstall.*"
# These rules tell R8 to silently ignore them (don't strip, don't warn).
# Without these rules, `flutter build apk --release` fails with:
#   "Execution failed for task ':app:minifyReleaseWithR8'"
-dontwarn com.google.android.play.core.**
-keep class com.google.android.play.core.** { *; }
-keep class com.google.android.play.core.splitcompat.** { *; }
-keep class com.google.android.play.core.splitinstall.** { *; }
-keep class com.google.android.play.core.tasks.** { *; }

# sqflite (offline DB)
-keep class com.tekartik.sqflite.** { *; }

# connectivity_plus
-keep class dev.fluttercommunity.plus.connectivity.** { *; }

# path_provider
-keep class io.flutter.plugins.pathprovider.** { *; }

# http
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# Keep all native methods (Flutter uses JNI for platform channels)
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep model classes used in JSON serialization (GSON/Moshi)
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
