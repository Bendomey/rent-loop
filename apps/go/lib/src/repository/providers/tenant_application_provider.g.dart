// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant_application_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$tenantApplicationHash() => r'52b0897f6a67cd252456e73f8ba102cab5d41089';

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

/// See also [tenantApplication].
@ProviderFor(tenantApplication)
const tenantApplicationProvider = TenantApplicationFamily();

/// See also [tenantApplication].
class TenantApplicationFamily
    extends Family<AsyncValue<TenantApplicationModel>> {
  /// See also [tenantApplication].
  const TenantApplicationFamily();

  /// See also [tenantApplication].
  TenantApplicationProvider call(
    String applicationId,
  ) {
    return TenantApplicationProvider(
      applicationId,
    );
  }

  @override
  TenantApplicationProvider getProviderOverride(
    covariant TenantApplicationProvider provider,
  ) {
    return call(
      provider.applicationId,
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
  String? get name => r'tenantApplicationProvider';
}

/// See also [tenantApplication].
class TenantApplicationProvider
    extends AutoDisposeFutureProvider<TenantApplicationModel> {
  /// See also [tenantApplication].
  TenantApplicationProvider(
    String applicationId,
  ) : this._internal(
          (ref) => tenantApplication(
            ref as TenantApplicationRef,
            applicationId,
          ),
          from: tenantApplicationProvider,
          name: r'tenantApplicationProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$tenantApplicationHash,
          dependencies: TenantApplicationFamily._dependencies,
          allTransitiveDependencies:
              TenantApplicationFamily._allTransitiveDependencies,
          applicationId: applicationId,
        );

  TenantApplicationProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.applicationId,
  }) : super.internal();

  final String applicationId;

  @override
  Override overrideWith(
    FutureOr<TenantApplicationModel> Function(TenantApplicationRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: TenantApplicationProvider._internal(
        (ref) => create(ref as TenantApplicationRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        applicationId: applicationId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<TenantApplicationModel> createElement() {
    return _TenantApplicationProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TenantApplicationProvider &&
        other.applicationId == applicationId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, applicationId.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin TenantApplicationRef
    on AutoDisposeFutureProviderRef<TenantApplicationModel> {
  /// The parameter `applicationId` of this provider.
  String get applicationId;
}

class _TenantApplicationProviderElement
    extends AutoDisposeFutureProviderElement<TenantApplicationModel>
    with TenantApplicationRef {
  _TenantApplicationProviderElement(super.provider);

  @override
  String get applicationId =>
      (origin as TenantApplicationProvider).applicationId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
