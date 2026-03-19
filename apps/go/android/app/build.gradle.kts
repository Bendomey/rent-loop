plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

dependencies {
    // Import the Firebase BoM
    implementation(platform("com.google.firebase:firebase-bom:34.10.0"))

    // When using the BoM, don't specify versions in Firebase dependencies
    implementation("com.google.firebase:firebase-messaging")
}

android {
    namespace = "com.rentloop.go"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "com.rentloop.go"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 23
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {                                                                                                                                           
        create("release") {                                                                                                                                    
          keyAlias = System.getenv("KEY_ALIAS")                                                                                                              
          keyPassword = System.getenv("KEY_PASSWORD")                                                                                                        
          storeFile = file(System.getenv("STORE_FILE"))                                                                                                      
          storePassword = System.getenv("STORE_PASSWORD")                                                                                                    
        }                                                                                                                                                      
    } 

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(                                                                                                                                     
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"                                                                                                                           
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

flutter {
    source = "../.."
}
