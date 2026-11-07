// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'pending_tenants_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$pendingTenantsHash() => r'5d895db5f5ae7e0ed32270fcde2c5ce39089e612';

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

/// See also [pendingTenants].
@ProviderFor(pendingTenants)
const pendingTenantsProvider = PendingTenantsFamily();

/// See also [pendingTenants].
class PendingTenantsFamily extends Family<AsyncValue<TenantApplicationsPage>> {
  /// See also [pendingTenants].
  const PendingTenantsFamily();

  /// See also [pendingTenants].
  PendingTenantsProvider call(
    String? propertyId,
  ) {
    return PendingTenantsProvider(
      propertyId,
    );
  }

  @override
  PendingTenantsProvider getProviderOverride(
    covariant PendingTenantsProvider provider,
  ) {
    return call(
      provider.propertyId,
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
  String? get name => r'pendingTenantsProvider';
}

/// See also [pendingTenants].
class PendingTenantsProvider
    extends AutoDisposeFutureProvider<TenantApplicationsPage> {
  /// See also [pendingTenants].
  PendingTenantsProvider(
    String? propertyId,
  ) : this._internal(
          (ref) => pendingTenants(
            ref as PendingTenantsRef,
            propertyId,
          ),
          from: pendingTenantsProvider,
          name: r'pendingTenantsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$pendingTenantsHash,
          dependencies: PendingTenantsFamily._dependencies,
          allTransitiveDependencies:
              PendingTenantsFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  PendingTenantsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
  }) : super.internal();

  final String? propertyId;

  @override
  Override overrideWith(
    FutureOr<TenantApplicationsPage> Function(PendingTenantsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PendingTenantsProvider._internal(
        (ref) => create(ref as PendingTenantsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<TenantApplicationsPage> createElement() {
    return _PendingTenantsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PendingTenantsProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PendingTenantsRef
    on AutoDisposeFutureProviderRef<TenantApplicationsPage> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _PendingTenantsProviderElement
    extends AutoDisposeFutureProviderElement<TenantApplicationsPage>
    with PendingTenantsRef {
  _PendingTenantsProviderElement(super.provider);

  @override
  String? get propertyId => (origin as PendingTenantsProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
