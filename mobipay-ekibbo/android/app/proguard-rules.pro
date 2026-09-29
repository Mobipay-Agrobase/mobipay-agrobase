# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

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
