// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'application_detail_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$applicationDetailHash() => r'a3487e22b4cc4a570b7ecfb2b7cbdd60b45b1dba';

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

/// See also [applicationDetail].
@ProviderFor(applicationDetail)
const applicationDetailProvider = ApplicationDetailFamily();

/// See also [applicationDetail].
class ApplicationDetailFamily
    extends Family<AsyncValue<TenantApplicationModel>> {
  /// See also [applicationDetail].
  const ApplicationDetailFamily();

  /// See also [applicationDetail].
  ApplicationDetailProvider call(
    String propertyId,
    String id,
  ) {
    return ApplicationDetailProvider(
      propertyId,
      id,
    );
  }

  @override
  ApplicationDetailProvider getProviderOverride(
    covariant ApplicationDetailProvider provider,
  ) {
    return call(
      provider.propertyId,
      provider.id,
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
  String? get name => r'applicationDetailProvider';
}

/// See also [applicationDetail].
class ApplicationDetailProvider
    extends AutoDisposeFutureProvider<TenantApplicationModel> {
  /// See also [applicationDetail].
  ApplicationDetailProvider(
    String propertyId,
    String id,
  ) : this._internal(
          (ref) => applicationDetail(
            ref as ApplicationDetailRef,
            propertyId,
            id,
          ),
          from: applicationDetailProvider,
          name: r'applicationDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$applicationDetailHash,
          dependencies: ApplicationDetailFamily._dependencies,
          allTransitiveDependencies:
              ApplicationDetailFamily._allTransitiveDependencies,
          propertyId: propertyId,
          id: id,
        );

  ApplicationDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.id,
  }) : super.internal();

  final String propertyId;
  final String id;

  @override
  Override overrideWith(
    FutureOr<TenantApplicationModel> Function(ApplicationDetailRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ApplicationDetailProvider._internal(
        (ref) => create(ref as ApplicationDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<TenantApplicationModel> createElement() {
    return _ApplicationDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ApplicationDetailProvider &&
        other.propertyId == propertyId &&
        other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin ApplicationDetailRef
    on AutoDisposeFutureProviderRef<TenantApplicationModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `id` of this provider.
  String get id;
}

class _ApplicationDetailProviderElement
    extends AutoDisposeFutureProviderElement<TenantApplicationModel>
    with ApplicationDetailRef {
  _ApplicationDetailProviderElement(super.provider);

  @override
  String get propertyId => (origin as ApplicationDetailProvider).propertyId;
  @override
  String get id => (origin as ApplicationDetailProvider).id;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
