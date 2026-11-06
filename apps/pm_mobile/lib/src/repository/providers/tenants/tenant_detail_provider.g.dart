// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant_detail_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$tenantDetailHash() => r'9db5f216682151a36df0014deced18a4a18175c8';

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

/// See also [tenantDetail].
@ProviderFor(tenantDetail)
const tenantDetailProvider = TenantDetailFamily();

/// See also [tenantDetail].
class TenantDetailFamily extends Family<AsyncValue<TenantModel>> {
  /// See also [tenantDetail].
  const TenantDetailFamily();

  /// See also [tenantDetail].
  TenantDetailProvider call(
    String propertyId,
    String tenantId,
  ) {
    return TenantDetailProvider(
      propertyId,
      tenantId,
    );
  }

  @override
  TenantDetailProvider getProviderOverride(
    covariant TenantDetailProvider provider,
  ) {
    return call(
      provider.propertyId,
      provider.tenantId,
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
  String? get name => r'tenantDetailProvider';
}

/// See also [tenantDetail].
class TenantDetailProvider extends AutoDisposeFutureProvider<TenantModel> {
  /// See also [tenantDetail].
  TenantDetailProvider(
    String propertyId,
    String tenantId,
  ) : this._internal(
          (ref) => tenantDetail(
            ref as TenantDetailRef,
            propertyId,
            tenantId,
          ),
          from: tenantDetailProvider,
          name: r'tenantDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$tenantDetailHash,
          dependencies: TenantDetailFamily._dependencies,
          allTransitiveDependencies:
              TenantDetailFamily._allTransitiveDependencies,
          propertyId: propertyId,
          tenantId: tenantId,
        );

  TenantDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.tenantId,
  }) : super.internal();

  final String propertyId;
  final String tenantId;

  @override
  Override overrideWith(
    FutureOr<TenantModel> Function(TenantDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: TenantDetailProvider._internal(
        (ref) => create(ref as TenantDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        tenantId: tenantId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<TenantModel> createElement() {
    return _TenantDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TenantDetailProvider &&
        other.propertyId == propertyId &&
        other.tenantId == tenantId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, tenantId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin TenantDetailRef on AutoDisposeFutureProviderRef<TenantModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `tenantId` of this provider.
  String get tenantId;
}

class _TenantDetailProviderElement
    extends AutoDisposeFutureProviderElement<TenantModel> with TenantDetailRef {
  _TenantDetailProviderElement(super.provider);

  @override
  String get propertyId => (origin as TenantDetailProvider).propertyId;
  @override
  String get tenantId => (origin as TenantDetailProvider).tenantId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
