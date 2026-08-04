// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_assignees_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$maintenanceAssigneesNotifierHash() =>
    r'b0d447fe64e78ad9c714e1dc5512d7648f4c293a';

/// Backs both the Assigned Worker and Assigned Manager filter chips with
/// one shared, deduped list of people — built from whichever properties are
/// currently represented on the maintenance board, not a fixed org-wide
/// roster. Fetches per-property client-user-properties once each (cached
/// for the lifetime of this provider instance) as new properties appear
/// among loaded maintenance requests; never re-fetches an already-seen
/// property.
///
/// Copied from [MaintenanceAssigneesNotifier].
@ProviderFor(MaintenanceAssigneesNotifier)
final maintenanceAssigneesNotifierProvider = AutoDisposeNotifierProvider<
    MaintenanceAssigneesNotifier, List<MaintenanceAssigneeModel>>.internal(
  MaintenanceAssigneesNotifier.new,
  name: r'maintenanceAssigneesNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$maintenanceAssigneesNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$MaintenanceAssigneesNotifier
    = AutoDisposeNotifier<List<MaintenanceAssigneeModel>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
