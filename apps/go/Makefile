build_runner:
	dart run build_runner watch

build_bundle:
	flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info

build_apk:
	flutter build apk

install:
	flutter pub get

format:
	dart format .

release:
# by default builds release version and not debug.
	flutter build