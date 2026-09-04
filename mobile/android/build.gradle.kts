allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Force every Android module (app + pub.dev plugins) onto ONE stable NDK.
// root_jailbreak_sniffer pins NDK 29.0.14033849 in its own build.gradle;
// that NDK ships under the PREVIEW SDK license, which CI runners (and many
// fresh local setups) cannot accept, breaking the release build during
// Gradle configuration. All native code in this app (sqlite3, the sniffer's
// C files) compiles fine with stable NDK 28.1 — the version the :app module
// pins and mobile-ekibbo successfully builds with.
//
// gradle.afterProject runs right after each project's evaluation — before
// AGP resolves module NDK versions — and, unlike
// subprojects { afterEvaluate { ... } }, never fails with "project is
// already evaluated" for projects pulled forward by
// evaluationDependsOn(":app") during root configuration.
gradle.afterProject {
    val androidExt = extensions.findByName("android") ?: return@afterProject
    try {
        androidExt.withGroovyBuilder { setProperty("ndkVersion", "28.1.13356709") }
    } catch (e: Exception) {
        logger.warn("Could not override ndkVersion for $name: ${e.message}")
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
