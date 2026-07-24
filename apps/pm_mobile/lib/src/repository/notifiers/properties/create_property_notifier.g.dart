// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_property_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$createPropertyNotifierHash() =>
    r'f0ef0f73c77762e00713237e4fd7528ae1fde877';

/// Orchestrates the same 3-step sequence as the web wizard's server action:
/// create the property, always create a default "Main" block, and — only
/// for `type == 'SINGLE'` — a default draft unit. If a later step fails,
/// the property (and block) already exist server-side; no rollback is
/// attempted, matching web's own behavior. The property is left in a
/// valid, if unit-less, state recoverable via the existing Add Unit screen.
///
/// Copied from [CreatePropertyNotifier].
@ProviderFor(CreatePropertyNotifier)
final createPropertyNotifierProvider = AutoDisposeNotifierProvider<
    CreatePropertyNotifier, CreatePropertyState>.internal(
  CreatePropertyNotifier.new,
  name: r'createPropertyNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$createPropertyNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$CreatePropertyNotifier = AutoDisposeNotifier<CreatePropertyState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
