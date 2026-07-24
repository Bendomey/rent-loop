// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'leases_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$leasesNotifierHash() => r'cb795d11d29b87e270e0e2e82fb66e949c10cc9e';

/// Global leases list — not property-scoped in construction (unlike
/// UnitsNotifier/BlocksNotifier); property is just one optional filter here,
/// since GET .../leases spans every property the caller can access. Mirrors
/// TenantsNotifier exactly.
///
/// Copied from [LeasesNotifier].
@ProviderFor(LeasesNotifier)
final leasesNotifierProvider =
    AutoDisposeNotifierProvider<LeasesNotifier, LeasesState>.internal(
      LeasesNotifier.new,
      name: r'leasesNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$leasesNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$LeasesNotifier = AutoDisposeNotifier<LeasesState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
