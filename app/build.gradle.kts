import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
}

// 릴리스 서명 정보는 깃에 올리지 않는 keystore.properties 에서 읽는다.
val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) keystorePropsFile.inputStream().use { load(it) }
}
val hasReleaseKeystore = keystoreProps.getProperty("storeFile")?.let {
    rootProject.file(it).exists()
} == true

android {
    namespace = "com.ymgames.partygame"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.ymgames.partygame"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            // 앱 본체가 assets 웹 번들이라 코드 축소 이득이 거의 없다
            isMinifyEnabled = false
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                null
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

// web/ 폴더 전체를 assets 로 복사해서 오프라인 동작하게 한다 (assets 는 .gitignore)
val copyWebAssets by tasks.registering(Copy::class) {
    from(rootProject.file("web"))
    into(layout.projectDirectory.dir("src/main/assets/web"))
}
tasks.named("preBuild") { dependsOn(copyWebAssets) }

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.webkit)
}
