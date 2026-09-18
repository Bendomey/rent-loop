// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_request_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$maintenanceRequestHash() =>
    r'b394243b56cbac474fa8e2054801231ee131529a';

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

/// See also [maintenanceRequest].
@ProviderFor(maintenanceRequest)
const maintenanceRequestProvider = MaintenanceRequestFamily();

/// See also [maintenanceRequest].
class MaintenanceRequestFamily
    extends Family<AsyncValue<MaintenanceRequestModel>> {
  /// See also [maintenanceRequest].
  const MaintenanceRequestFamily();

  /// See also [maintenanceRequest].
  MaintenanceRequestProvider call(
    String leaseId,
    String id,
  ) {
    return MaintenanceRequestProvider(
      leaseId,
      id,
    );
  }

  @override
  MaintenanceRequestProvider getProviderOverride(
    covariant MaintenanceRequestProvider provider,
  ) {
    return call(
      provider.leaseId,
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
  String? get name => r'maintenanceRequestProvider';
}

/// See also [maintenanceRequest].
class MaintenanceRequestProvider
    extends AutoDisposeFutureProvider<MaintenanceRequestModel> {
  /// See also [maintenanceRequest].
  MaintenanceRequestProvider(
    String leaseId,
    String id,
  ) : this._internal(
          (ref) => maintenanceRequest(
            ref as MaintenanceRequestRef,
            leaseId,
            id,
          ),
          from: maintenanceRequestProvider,
          name: r'maintenanceRequestProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$maintenanceRequestHash,
          dependencies: MaintenanceRequestFamily._dependencies,
          allTransitiveDependencies:
              MaintenanceRequestFamily._allTransitiveDependencies,
          leaseId: leaseId,
          id: id,
        );

  MaintenanceRequestProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.leaseId,
    required this.id,
  }) : super.internal();

  final String leaseId;
  final String id;

  @override
  Override overrideWith(
    FutureOr<MaintenanceRequestModel> Function(MaintenanceRequestRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MaintenanceRequestProvider._internal(
        (ref) => create(ref as MaintenanceRequestRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        leaseId: leaseId,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<MaintenanceRequestModel> createElement() {
    return _MaintenanceRequestProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MaintenanceRequestProvider &&
        other.leaseId == leaseId &&
        other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, leaseId.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin MaintenanceRequestRef
    on AutoDisposeFutureProviderRef<MaintenanceRequestModel> {
  /// The parameter `leaseId` of this provider.
  String get leaseId;

  /// The parameter `id` of this provider.
  String get id;
}

class _MaintenanceRequestProviderElement
    extends AutoDisposeFutureProviderElement<MaintenanceRequestModel>
    with MaintenanceRequestRef {
  _MaintenanceRequestProviderElement(super.provider);

  @override
  String get leaseId => (origin as MaintenanceRequestProvider).leaseId;
  @override
  String get id => (origin as MaintenanceRequestProvider).id;
}

String _$maintenanceRequestFinancialsHash() =>
    r'21ff9cbccff8ef67229a93908be7e85dead7f585';

/// Charges raised against the tenant by one maintenance request.
///
/// Copied from [maintenanceRequestFinancials].
@ProviderFor(maintenanceRequestFinancials)
const maintenanceRequestFinancialsProvider =
    MaintenanceRequestFinancialsFamily();

/// Charges raised against the tenant by one maintenance request.
///
/// Copied from [maintenanceRequestFinancials].
class MaintenanceRequestFinancialsFamily
    extends Family<AsyncValue<List<MaintenanceRequestFinancialModel>>> {
  /// Charges raised against the tenant by one maintenance request.
  ///
  /// Copied from [maintenanceRequestFinancials].
  const MaintenanceRequestFinancialsFamily();

  /// Charges raised against the tenant by one maintenance request.
  ///
  /// Copied from [maintenanceRequestFinancials].
  MaintenanceRequestFinancialsProvider call(
    String leaseId,
    String requestId,
  ) {
    return MaintenanceRequestFinancialsProvider(
      leaseId,
      requestId,
    );
  }

  @override
  MaintenanceRequestFinancialsProvider getProviderOverride(
    covariant MaintenanceRequestFinancialsProvider provider,
  ) {
    return call(
      provider.leaseId,
      provider.requestId,
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
  String? get name => r'maintenanceRequestFinancialsProvider';
}

/// Charges raised against the tenant by one maintenance request.
///
/// Copied from [maintenanceRequestFinancials].
class MaintenanceRequestFinancialsProvider
    extends AutoDisposeFutureProvider<List<MaintenanceRequestFinancialModel>> {
  /// Charges raised against the tenant by one maintenance request.
  ///
  /// Copied from [maintenanceRequestFinancials].
  MaintenanceRequestFinancialsProvider(
    String leaseId,
    String requestId,
  ) : this._internal(
          (ref) => maintenanceRequestFinancials(
            ref as MaintenanceRequestFinancialsRef,
            leaseId,
            requestId,
          ),
          from: maintenanceRequestFinancialsProvider,
          name: r'maintenanceRequestFinancialsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$maintenanceRequestFinancialsHash,
          dependencies: MaintenanceRequestFinancialsFamily._dependencies,
          allTransitiveDependencies:
              MaintenanceRequestFinancialsFamily._allTransitiveDependencies,
          leaseId: leaseId,
          requestId: requestId,
        );

  MaintenanceRequestFinancialsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.leaseId,
    required this.requestId,
  }) : super.internal();

  final String leaseId;
  final String requestId;

  @override
  Override overrideWith(
    FutureOr<List<MaintenanceRequestFinancialModel>> Function(
            MaintenanceRequestFinancialsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MaintenanceRequestFinancialsProvider._internal(
        (ref) => create(ref as MaintenanceRequestFinancialsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        leaseId: leaseId,
        requestId: requestId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<MaintenanceRequestFinancialModel>>
      createElement() {
    return _MaintenanceRequestFinancialsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MaintenanceRequestFinancialsProvider &&
        other.leaseId == leaseId &&
        other.requestId == requestId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, leaseId.hashCode);
    hash = _SystemHash.combine(hash, requestId.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin MaintenanceRequestFinancialsRef
    on AutoDisposeFutureProviderRef<List<MaintenanceRequestFinancialModel>> {
  /// The parameter `leaseId` of this provider.
  String get leaseId;

  /// The parameter `requestId` of this provider.
  String get requestId;
}

class _MaintenanceRequestFinancialsProviderElement
    extends AutoDisposeFutureProviderElement<
        List<MaintenanceRequestFinancialModel>>
    with MaintenanceRequestFinancialsRef {
  _MaintenanceRequestFinancialsProviderElement(super.provider);

  @override
  String get leaseId =>
      (origin as MaintenanceRequestFinancialsProvider).leaseId;
  @override
  String get requestId =>
      (origin as MaintenanceRequestFinancialsProvider).requestId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
