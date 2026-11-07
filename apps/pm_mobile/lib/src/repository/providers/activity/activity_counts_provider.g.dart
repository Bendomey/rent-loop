// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'activity_counts_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$activityCountsHash() => r'4420ca128ab2b71ae44d024fcc205b19c9afa792';

/// The Maintenance / Applications / Bookings badge numbers on the Activity
/// screen, read from Cube in one round of parallel queries.
///
/// Cube rather than the REST list endpoints because only maintenance has a
/// cross-property route (`/clients/{id}/maintenance-requests`) — applications
/// and bookings are property-scoped, so a REST total would mean one request
/// per property.
///
/// The queries carry no filters. Each cube resolves the caller's property
/// access itself from the ids in the analytics JWT, mirroring what the REST
/// middleware enforces: an OWNER reaches their whole client, everyone else
/// reaches their explicit `client_user_properties` grants. So these totals are
/// already scoped — a manager sees their own portfolio, not the client's.
///
/// Three calls rather than one: Cube only merges measures from different cubes
/// when they are joined, and these three have no join path.
///
/// Copied from [activityCounts].
@ProviderFor(activityCounts)
final activityCountsProvider = FutureProvider<ActivityCounts>.internal(
  activityCounts,
  name: r'activityCountsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$activityCountsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef ActivityCountsRef = FutureProviderRef<ActivityCounts>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
