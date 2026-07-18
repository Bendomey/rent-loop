// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sign_as_manager_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$signAsManagerNotifierHash() =>
    r'ed8811c69ea05eb5d3e309175121f7faa557889a';

/// Backs `SignatureCaptureScreen` — uploads the drawn signature PNG (via the
/// same R2 proxy `UImagePicker` uses) then submits it as the property
/// manager's own signature, in one call so the screen only has one loading
/// state to show.
///
/// Copied from [SignAsManagerNotifier].
@ProviderFor(SignAsManagerNotifier)
final signAsManagerNotifierProvider =
    AutoDisposeNotifierProvider<
      SignAsManagerNotifier,
      SignAsManagerState
    >.internal(
      SignAsManagerNotifier.new,
      name: r'signAsManagerNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$signAsManagerNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$SignAsManagerNotifier = AutoDisposeNotifier<SignAsManagerState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
