# R8 missing class rules — Play Core SplitCompat (not used, but referenced by Flutter engine)

# Play Core SplitInstall (deferred components downloads — not used in this app)
-dontwarn com.google.android.play.core.splitcompat.**
-dontwarn com.google.android.play.core.splitinstall.**
-dontwarn com.google.android.play.core.tasks.**

# Flutter deferred components (not used)
-dontwarn io.flutter.embedding.android.FlutterPlayStoreSplitApplication
-dontwarn io.flutter.embedding.engine.deferredcomponents.PlayStoreDeferredComponentManager
-dontwarn io.flutter.embedding.engine.deferredcomponents.PlayStoreDeferredComponentManager$*

# HTTP certificate pinning
-keep class com.certifi.c2mapi.** { *; }
-dontwarn com.certifi.c2mapi.**

# flutter_secure_storage
-keep class com.it_nomad.fluttersecurestorage.** { *; }
-dontwarn com.it_nomad.fluttersecurestorage.**

# share_plus
-keep class dev.fluttercommunity.plus_share.** { *; }
-dontwarn dev.fluttercommunity.plus_share.**
