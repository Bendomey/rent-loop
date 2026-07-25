// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_requests_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$maintenanceRequestsNotifierHash() =>
    r'9d93350a0b560da5ea5471901f2b8a8c53da3a07';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

abstract class _$MaintenanceRequestsNotifier
    extends BuildlessAutoDisposeNotifier<MaintenanceRequestsState> {
  late final String statusLabel;

  MaintenanceRequestsState build(
    String statusLabel,
  );
}

/// One instance per status label (family, e.g.
/// `ref.watch(maintenanceRequestsNotifierProvider('New'))`) — the board
/// holds 5 simultaneous instances, one per column, each independently
/// paginated. This mirrors web's 5 separate per-status infinite queries.
///
/// Copied from [MaintenanceRequestsNotifier].
@ProviderFor(MaintenanceRequestsNotifier)
const maintenanceRequestsNotifierProvider = MaintenanceRequestsNotifierFamily();

/// One instance per status label (family, e.g.
/// `ref.watch(maintenanceRequestsNotifierProvider('New'))`) — the board
/// holds 5 simultaneous instances, one per column, each independently
/// paginated. This mirrors web's 5 separate per-status infinite queries.
///
/// Copied from [MaintenanceRequestsNotifier].
class MaintenanceRequestsNotifierFamily
    extends Family<MaintenanceRequestsState> {
  /// One instance per status label (family, e.g.
  /// `ref.watch(maintenanceRequestsNotifierProvider('New'))`) — the board
  /// holds 5 simultaneous instances, one per column, each independently
  /// paginated. This mirrors web's 5 separate per-status infinite queries.
  ///
  /// Copied from [MaintenanceRequestsNotifier].
  const MaintenanceRequestsNotifierFamily();

  /// One instance per status label (family, e.g.
  /// `ref.watch(maintenanceRequestsNotifierProvider('New'))`) — the board
  /// holds 5 simultaneous instances, one per column, each independently
  /// paginated. This mirrors web's 5 separate per-status infinite queries.
  ///
  /// Copied from [MaintenanceRequestsNotifier].
  MaintenanceRequestsNotifierProvider call(
    String statusLabel,
  ) {
    return MaintenanceRequestsNotifierProvider(
      statusLabel,
    );
  }

  @override
  MaintenanceRequestsNotifierProvider getProviderOverride(
    covariant MaintenanceRequestsNotifierProvider provider,
  ) {
    return call(
      provider.statusLabel,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'maintenanceRequestsNotifierProvider';
}

/// One instance per status label (family, e.g.
/// `ref.watch(maintenanceRequestsNotifierProvider('New'))`) — the board
/// holds 5 simultaneous instances, one per column, each independently
/// paginated. This mirrors web's 5 separate per-status infinite queries.
///
/// Copied from [MaintenanceRequestsNotifier].
class MaintenanceRequestsNotifierProvider
    extends AutoDisposeNotifierProviderImpl<MaintenanceRequestsNotifier,
        MaintenanceRequestsState> {
  /// One instance per status label (family, e.g.
  /// `ref.watch(maintenanceRequestsNotifierProvider('New'))`) — the board
  /// holds 5 simultaneous instances, one per column, each independently
  /// paginated. This mirrors web's 5 separate per-status infinite queries.
  ///
  /// Copied from [MaintenanceRequestsNotifier].
  MaintenanceRequestsNotifierProvider(
    String statusLabel,
  ) : this._internal(
          () => MaintenanceRequestsNotifier()..statusLabel = statusLabel,
          from: maintenanceRequestsNotifierProvider,
          name: r'maintenanceRequestsNotifierProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$maintenanceRequestsNotifierHash,
          dependencies: MaintenanceRequestsNotifierFamily._dependencies,
          allTransitiveDependencies:
              MaintenanceRequestsNotifierFamily._allTransitiveDependencies,
          statusLabel: statusLabel,
        );

  MaintenanceRequestsNotifierProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.statusLabel,
  }) : super.internal();

  final String statusLabel;

  @override
  MaintenanceRequestsState runNotifierBuild(
    covariant MaintenanceRequestsNotifier notifier,
  ) {
    return notifier.build(
      statusLabel,
    );
  }

  @override
  Override overrideWith(MaintenanceRequestsNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: MaintenanceRequestsNotifierProvider._internal(
        () => create()..statusLabel = statusLabel,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        statusLabel: statusLabel,
      ),
    );
  }

  @override
  AutoDisposeNotifierProviderElement<MaintenanceRequestsNotifier,
      MaintenanceRequestsState> createElement() {
    return _MaintenanceRequestsNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MaintenanceRequestsNotifierProvider &&
        other.statusLabel == statusLabel;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, statusLabel.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MaintenanceRequestsNotifierRef
    on AutoDisposeNotifierProviderRef<MaintenanceRequestsState> {
  /// The parameter `statusLabel` of this provider.
  String get statusLabel;
}

class _MaintenanceRequestsNotifierProviderElement
    extends AutoDisposeNotifierProviderElement<MaintenanceRequestsNotifier,
        MaintenanceRequestsState> with MaintenanceRequestsNotifierRef {
  _MaintenanceRequestsNotifierProviderElement(super.provider);

  @override
  String get statusLabel =>
      (origin as MaintenanceRequestsNotifierProvider).statusLabel;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
