# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.**

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Messaging
-keep class com.google.firebase.messaging.** { *; }

# Sentry
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# Flutter secure storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# image_picker
-keep class io.flutter.plugins.imagepicker.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-dontwarn kotlin.**

# Keep annotations
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions
