// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_badge_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$mrStatsHash() => r'257348db4462e34b7be2ee604b5135ce533a6479';

/// Fetches MR counts grouped by status via the dedicated stats endpoint.
/// keepAlive so the badge count persists across tabs.
///
/// Copied from [mrStats].
@ProviderFor(mrStats)
final mrStatsProvider = FutureProvider<Map<String, int>>.internal(
  mrStats,
  name: r'mrStatsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$mrStatsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef MrStatsRef = FutureProviderRef<Map<String, int>>;
String _$maintenanceRequestTotalNotifierHash() =>
    r'b11fcf08620e307c90c2d74042325fef9ece11fd';

/// Holds the active maintenance-request count for the bottom-nav badge.
///
/// Copied from [MaintenanceRequestTotalNotifier].
@ProviderFor(MaintenanceRequestTotalNotifier)
final maintenanceRequestTotalNotifierProvider =
    NotifierProvider<MaintenanceRequestTotalNotifier, int>.internal(
  MaintenanceRequestTotalNotifier.new,
  name: r'maintenanceRequestTotalNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$maintenanceRequestTotalNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$MaintenanceRequestTotalNotifier = Notifier<int>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
