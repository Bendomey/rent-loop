// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'activity_filter_options_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$activityFilterPropertiesHash() =>
    r'199ca9cd9a8fe3f91c6650311f6428082a4ff4e5';

/// The activity screens' Property filter option list (maintenance board and
/// applications list) — properties the
/// current client-user is explicitly linked to (see
/// `ClientUserPropertyApi.getMyProperties`), same source the Properties tab
/// uses — access is always explicit, never inferred from role.
///
/// Copied from [activityFilterProperties].
@ProviderFor(activityFilterProperties)
final activityFilterPropertiesProvider =
    AutoDisposeFutureProvider<List<PropertyModel>>.internal(
      activityFilterProperties,
      name: r'activityFilterPropertiesProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$activityFilterPropertiesHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef ActivityFilterPropertiesRef =
    AutoDisposeFutureProviderRef<List<PropertyModel>>;
String _$activityFilterUnitsHash() =>
    r'43cfa75f6ea3df20b6143e4656ccd23714672608';

/// The activity screens' Unit filter option list — units across every
/// property the current client-user has access to.
///
/// Copied from [activityFilterUnits].
@ProviderFor(activityFilterUnits)
final activityFilterUnitsProvider =
    AutoDisposeFutureProvider<List<UnitModel>>.internal(
      activityFilterUnits,
      name: r'activityFilterUnitsProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$activityFilterUnitsHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef ActivityFilterUnitsRef = AutoDisposeFutureProviderRef<List<UnitModel>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
