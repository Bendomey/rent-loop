// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'archived_properties_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$archivedPropertiesNotifierHash() =>
    r'20d381b2eb6d73f021ffacb6895c72f9666cc215';

/// Mirrors PropertiesNotifier exactly, but always filters `archived: true`
/// — this is the "recycle bin" list reached from More → Organisation
/// settings → Archived properties.
///
/// Copied from [ArchivedPropertiesNotifier].
@ProviderFor(ArchivedPropertiesNotifier)
final archivedPropertiesNotifierProvider = AutoDisposeNotifierProvider<
    ArchivedPropertiesNotifier, ArchivedPropertiesState>.internal(
  ArchivedPropertiesNotifier.new,
  name: r'archivedPropertiesNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$archivedPropertiesNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ArchivedPropertiesNotifier
    = AutoDisposeNotifier<ArchivedPropertiesState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
