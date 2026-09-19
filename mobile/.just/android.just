# android.just — Android app recipes: emulator, install, logcat. Synced from
# github.com/p-arndt/just-common.
#
# The importing justfile sets:
#   APP_ID := "de.parndt.braindump"            (required) applicationId
# and may override (needs `set allow-duplicate-variables`):
#   GRADLE_MODULE := ":androidApp"             default ":app"
#   ACTIVITY      := APP_ID + "/.MainActivity" component `just android` launches
#   AVD           := "Pixel_9"                 emulator `just emulator` boots, default "default"
#   APK_DIR       := "androidApp/build/outputs/apk"
#
# emulator, android, logcat and doctor are bash scripts and unix-only; build,
# test and clean go through gradlew and run on Windows too.

GRADLE_MODULE := ":app"
ACTIVITY := APP_ID + "/.MainActivity"
AVD := "default"
APK_DIR := "app/build/outputs/apk"
GRADLEW := "./gradlew"

# local.properties is gitignored and may be missing, so the SDK comes from
# ANDROID_HOME, falling back to Android Studio's default location.
ANDROID_SDK := env("ANDROID_HOME", if os() == "macos" {
    home_directory() / "Library/Android/sdk"
} else if os() == "windows" {
    env("LOCALAPPDATA", "") / "Android/Sdk"
} else {
    home_directory() / "Android/Sdk"
})
export ANDROID_HOME := ANDROID_SDK
_ADB := ANDROID_SDK / "platform-tools/adb"
_EMULATOR := ANDROID_SDK / "emulator/emulator"

# Gradle needs a JDK. macOS ships a /usr/bin/java stub and JAVA_HOME is often
# unset, so look for a javac: Android Studio's bundled JBR first, then JAVA_HOME.
_STUDIO_JBR := if os() == "macos" {
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
} else if os() == "windows" {
    "C:/Program Files/Android/Android Studio/jbr"
} else {
    "/opt/android-studio/jbr"
}
_ENV_JAVA := env("JAVA_HOME", "")
export JAVA_HOME := if path_exists(_STUDIO_JBR / "bin/javac") == "true" { _STUDIO_JBR } else if path_exists(_ENV_JAVA / "bin/javac") == "true" { _ENV_JAVA } else { "" }

# Start the emulator and wait until it has booted (skipped if a device is attached).
[unix]
emulator name=AVD:
    #!/usr/bin/env bash
    set -euo pipefail
    # A second device only gets in the way: adb and installDebug would have to pick one.
    if [ -n "$("{{_ADB}}" devices | awk 'NR>1 && $2 == "device"')" ]; then
      echo "A device is already running."
      exit 0
    fi
    if ! "{{_EMULATOR}}" -list-avds | grep -qx "{{name}}"; then
      echo "AVD '{{name}}' not found. Available:" >&2
      "{{_EMULATOR}}" -list-avds >&2
      exit 1
    fi
    echo "Starting {{name}} …"
    # Detached, otherwise the recipe hangs on the running emulator.
    nohup "{{_EMULATOR}}" -avd "{{name}}" >/dev/null 2>&1 &
    "{{_ADB}}" wait-for-device
    # wait-for-device only reports the connection; installs work once the boot
    # has finished.
    until [ "$("{{_ADB}}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
      sleep 2
    done
    echo "{{name}} is ready."

# Install the debug build on the emulator (starting it if needed) and relaunch the app.
[unix]
android: emulator
    {{GRADLEW}} {{GRADLE_MODULE}}:installDebug -q
    "{{_ADB}}" shell am force-stop {{APP_ID}}
    "{{_ADB}}" shell am start -n {{ACTIVITY}} >/dev/null
    @echo "Running on the emulator."

# Build the debug APK without installing it.
apk:
    {{GRADLEW}} {{GRADLE_MODULE}}:assembleDebug -q
    @echo "APK: {{APK_DIR}}/debug/"

# Build the release APK (signed only if the project configures signing).
apk-release:
    {{GRADLEW}} {{GRADLE_MODULE}}:assembleRelease -q
    @echo "APK: {{APK_DIR}}/release/"

# Run the unit tests on the host JVM (no emulator needed).
test:
    {{GRADLEW}} {{GRADLE_MODULE}}:testDebugUnitTest -q

# Follow the app's log output (the app must be running).
[unix]
logcat:
    #!/usr/bin/env bash
    set -euo pipefail
    pid=$("{{_ADB}}" shell pidof -s {{APP_ID}} | tr -d '\r' || true)
    if [ -z "${pid}" ]; then
      echo "{{APP_ID}} is not running. Start it with \`just android\`." >&2
      exit 1
    fi
    "{{_ADB}}" logcat --pid="${pid}"

# Remove build outputs.
clean:
    {{GRADLEW}} clean -q

# Show what just resolves on this machine: SDK, JDK, AVDs, devices.
[unix]
doctor:
    #!/usr/bin/env bash
    set -uo pipefail
    echo "ANDROID_HOME : [{{ANDROID_SDK}}]"
    echo "  adb        : $(test -x "{{_ADB}}" && echo yes || echo NO)"
    echo "  emulator   : $(test -x "{{_EMULATOR}}" && echo yes || echo NO)"
    echo "JAVA_HOME    : [{{JAVA_HOME}}]"
    echo "  javac      : $(test -x "{{JAVA_HOME}}/bin/javac" && echo yes || echo NO)"
    echo "avd          : {{AVD}}"
    echo "--- AVDs ---"
    "{{_EMULATOR}}" -list-avds
    echo "--- devices ---"
    "{{_ADB}}" devices
