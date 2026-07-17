// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'start_lease_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$startLeaseNotifierHash() =>
    r'23735a3ab092c561b2536e0e4c015b66684841a4';

/// Backs the Start Lease bottom sheet — mirrors the web `StartLeaseDialog`'s
/// two actions as two methods on the same notifier (both go through the
/// same `PATCH .../leases/{id}` call first, since the backend always wants
/// `utility_transfers_date` recorded regardless of whether the lease is
/// activated in the same step).
///
/// Copied from [StartLeaseNotifier].
@ProviderFor(StartLeaseNotifier)
final startLeaseNotifierProvider =
    AutoDisposeNotifierProvider<StartLeaseNotifier, StartLeaseState>.internal(
      StartLeaseNotifier.new,
      name: r'startLeaseNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$startLeaseNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$StartLeaseNotifier = AutoDisposeNotifier<StartLeaseState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
