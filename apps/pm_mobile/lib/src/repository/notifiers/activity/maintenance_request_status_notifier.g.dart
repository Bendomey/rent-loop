// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_request_status_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$maintenanceRequestStatusNotifierHash() =>
    r'f0640bee9e593018a65cacbb0ac39010632bc9e8';

/// Fires the real status-update mutation for a drag-driven board move.
/// Returns `true`/`false` so the caller (the board, Task 8) knows whether
/// to keep or revert its move, and reloads the affected columns itself
/// with its own current filters — this notifier does not touch column
/// state directly.
///
/// Copied from [MaintenanceRequestStatusNotifier].
@ProviderFor(MaintenanceRequestStatusNotifier)
final maintenanceRequestStatusNotifierProvider = AutoDisposeNotifierProvider<
    MaintenanceRequestStatusNotifier, MaintenanceRequestStatusState>.internal(
  MaintenanceRequestStatusNotifier.new,
  name: r'maintenanceRequestStatusNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$maintenanceRequestStatusNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$MaintenanceRequestStatusNotifier
    = AutoDisposeNotifier<MaintenanceRequestStatusState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
