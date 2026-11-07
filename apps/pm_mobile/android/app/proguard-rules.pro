# Flutter's Gradle plugin already adds its own engine rules, and most plugins
# ship consumer rules. These are only the extras R8 cannot work out itself:
# classes reached through reflection, JNI or the platform's print framework.

# ── Flutter engine ──────────────────────────────────────────────────────────
-keep class io.flutter.** { *; }
-dontwarn io.flutter.embedding.**

# ── flutter_secure_storage ───────────────────────────────────────────────────
# Ciphers are chosen by name at runtime.
-keep class com.it_nomads.fluttersecurestorage.** { *; }
-dontwarn com.it_nomads.fluttersecurestorage.**
-keep class androidx.security.crypto.** { *; }
-dontwarn com.google.errorprone.annotations.**

# ── printing ─────────────────────────────────────────────────────────────────
# The plugin puts a helper in the android.print package to reach the
# framework's package-private PrintDocumentAdapter callbacks.
-keep class net.nfet.flutter.printing.** { *; }
-keep class android.print.** { *; }
-dontwarn android.print.**

# ── haptic_feedback ──────────────────────────────────────────────────────────
-keep class io.achim.haptic_feedback.** { *; }

# ── Kotlin ───────────────────────────────────────────────────────────────────
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**

# ── General ──────────────────────────────────────────────────────────────────
-keepattributes *Annotation*,Signature,Exceptions,InnerClasses,EnclosingMethod
