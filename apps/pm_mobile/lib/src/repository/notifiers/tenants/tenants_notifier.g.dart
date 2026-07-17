// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenants_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$tenantsNotifierHash() => r'39bdb50976820681678251754ac039a16eec7387';

/// Global tenants list — not property-scoped in construction (unlike
/// UnitsNotifier/BlocksNotifier, which take a propertyId per load call);
/// property is just one optional filter here, since GET .../tenants spans
/// every property the caller can access.
///
/// Copied from [TenantsNotifier].
@ProviderFor(TenantsNotifier)
final tenantsNotifierProvider =
    AutoDisposeNotifierProvider<TenantsNotifier, TenantsState>.internal(
      TenantsNotifier.new,
      name: r'tenantsNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$tenantsNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$TenantsNotifier = AutoDisposeNotifier<TenantsState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
