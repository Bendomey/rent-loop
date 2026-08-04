# ── Flutter engine ──────────────────────────────────────────────────────────
-keep class io.flutter.** { *; }
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.embedding.**
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.app.** { *; }

# ── App entry point ──────────────────────────────────────────────────────────
-keep class com.rentloop.pm.** { *; }

# ── Kotlin ───────────────────────────────────────────────────────────────────
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings { <fields>; }
-keepclassmembers class kotlin.Lazy { *; }

# ── flutter_secure_storage ───────────────────────────────────────────────────
# Uses EncryptedSharedPreferences (Jetpack Security) via reflection.
-keep class androidx.security.crypto.** { *; }
-keep class com.it_nomads.fluttersecurestorage.** { *; }
-dontwarn com.it_nomads.fluttersecurestorage.**

# ── connectivity_plus ────────────────────────────────────────────────────────
-keep class dev.fluttercommunity.plus.connectivity.** { *; }
-dontwarn dev.fluttercommunity.plus.connectivity.**

# ── url_launcher ─────────────────────────────────────────────────────────────
-keep class io.flutter.plugins.urllauncher.** { *; }
-dontwarn io.flutter.plugins.urllauncher.**

# ── share_plus ───────────────────────────────────────────────────────────────
-keep class dev.fluttercommunity.plus.share.** { *; }
-dontwarn dev.fluttercommunity.plus.share.**

# ── haptic_feedback ──────────────────────────────────────────────────────────
-keep class com.example.haptic_feedback.** { *; }
-dontwarn com.example.haptic_feedback.**

# ── modal_bottom_sheet ───────────────────────────────────────────────────────
-keep class com.jamesblasco.modal_bottom_sheet.** { *; }
-dontwarn com.jamesblasco.modal_bottom_sheet.**

# ── AndroidX + Jetpack ───────────────────────────────────────────────────────
-keep class androidx.lifecycle.** { *; }
-dontwarn androidx.lifecycle.**
-keep class androidx.core.** { *; }
-dontwarn androidx.core.**

# ── Prevent stripping serializable model classes ─────────────────────────────
# json_serializable generates fromJson/toJson via code-gen (no reflection),
# but keep the Serializable marker just in case R8 inlines aggressively.
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ── General safety ───────────────────────────────────────────────────────────
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes EnclosingMethod
-keepattributes InnerClasses
