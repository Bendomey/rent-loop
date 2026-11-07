// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'home_stats_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$homeStatsHash() => r'81249bf38c287bdc9a615171e0a40b2f53f87b52';

/// The Home screen's money and unit numbers, read from Cube.
///
/// No filters: each cube scopes itself to the caller's property access from
/// the analytics JWT. Three calls because these cubes have no join path.
///
/// Copied from [homeStats].
@ProviderFor(homeStats)
final homeStatsProvider = FutureProvider<HomeStats>.internal(
  homeStats,
  name: r'homeStatsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$homeStatsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef HomeStatsRef = FutureProviderRef<HomeStats>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
