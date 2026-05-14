DART_DEFINES = --dart-define-from-file=.env.json

build_runner:
	dart run build_runner watch

build_bundle:
	flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info $(DART_DEFINES)

build_apk:
	flutter build apk --release --obfuscate --split-debug-info=build/debug-info $(DART_DEFINES)

run:
	flutter run $(DART_DEFINES)

install:
	flutter pub get

format:
	find lib -name "*.dart" ! -name "*.g.dart" | xargs dart format

release:
# by default builds release version and not debug.
	flutter build $(DART_DEFINES)