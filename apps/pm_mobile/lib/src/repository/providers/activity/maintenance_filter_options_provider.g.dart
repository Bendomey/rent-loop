// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_filter_options_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$maintenanceFilterPropertiesHash() =>
    r'5ee13548403fd848179fc0055a6cf9a12eb3f4f8';

/// The maintenance board's Property filter option list — properties the
/// current client-user has access to (see ClientUserPropertyApi.getMyProperties
/// for the known OWNER-completeness caveat).
///
/// Copied from [maintenanceFilterProperties].
@ProviderFor(maintenanceFilterProperties)
final maintenanceFilterPropertiesProvider =
    AutoDisposeFutureProvider<List<PropertyModel>>.internal(
  maintenanceFilterProperties,
  name: r'maintenanceFilterPropertiesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$maintenanceFilterPropertiesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef MaintenanceFilterPropertiesRef
    = AutoDisposeFutureProviderRef<List<PropertyModel>>;
String _$maintenanceFilterUnitsHash() =>
    r'79b2ba67310e73f8311ce6f43c47875cf6aa05e8';

/// The maintenance board's Unit filter option list — units across every
/// property the current client-user has access to.
///
/// Copied from [maintenanceFilterUnits].
@ProviderFor(maintenanceFilterUnits)
final maintenanceFilterUnitsProvider =
    AutoDisposeFutureProvider<List<UnitModel>>.internal(
  maintenanceFilterUnits,
  name: r'maintenanceFilterUnitsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$maintenanceFilterUnitsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef MaintenanceFilterUnitsRef
    = AutoDisposeFutureProviderRef<List<UnitModel>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
