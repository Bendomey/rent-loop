install:
	flutter pub get

format:
	dart format .

build_runner:
	dart run build_runner watch --delete-conflicting-outputs

build_runner_once:
	dart run build_runner build --delete-conflicting-outputs

build_apk:
	flutter build apk

build_bundle:
	flutter build appbundle --obfuscate --split-debug-info=build/debug-info

lint:
	flutter analyze

run:
	flutter run
