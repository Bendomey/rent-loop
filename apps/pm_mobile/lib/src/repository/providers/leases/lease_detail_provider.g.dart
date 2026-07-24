// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lease_detail_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$leaseDetailHash() => r'fd4d765b9f42de5928d783c560f0fc61ff42cc39';

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

/// See also [leaseDetail].
@ProviderFor(leaseDetail)
const leaseDetailProvider = LeaseDetailFamily();

/// See also [leaseDetail].
class LeaseDetailFamily extends Family<AsyncValue<LeaseModel>> {
  /// See also [leaseDetail].
  const LeaseDetailFamily();

  /// See also [leaseDetail].
  LeaseDetailProvider call(String propertyId, String leaseId) {
    return LeaseDetailProvider(propertyId, leaseId);
  }

  @override
  LeaseDetailProvider getProviderOverride(
    covariant LeaseDetailProvider provider,
  ) {
    return call(provider.propertyId, provider.leaseId);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'leaseDetailProvider';
}

/// See also [leaseDetail].
class LeaseDetailProvider extends AutoDisposeFutureProvider<LeaseModel> {
  /// See also [leaseDetail].
  LeaseDetailProvider(String propertyId, String leaseId)
    : this._internal(
        (ref) => leaseDetail(ref as LeaseDetailRef, propertyId, leaseId),
        from: leaseDetailProvider,
        name: r'leaseDetailProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$leaseDetailHash,
        dependencies: LeaseDetailFamily._dependencies,
        allTransitiveDependencies: LeaseDetailFamily._allTransitiveDependencies,
        propertyId: propertyId,
        leaseId: leaseId,
      );

  LeaseDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.leaseId,
  }) : super.internal();

  final String propertyId;
  final String leaseId;

  @override
  Override overrideWith(
    FutureOr<LeaseModel> Function(LeaseDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: LeaseDetailProvider._internal(
        (ref) => create(ref as LeaseDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        leaseId: leaseId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<LeaseModel> createElement() {
    return _LeaseDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is LeaseDetailProvider &&
        other.propertyId == propertyId &&
        other.leaseId == leaseId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, leaseId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin LeaseDetailRef on AutoDisposeFutureProviderRef<LeaseModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `leaseId` of this provider.
  String get leaseId;
}

class _LeaseDetailProviderElement
    extends AutoDisposeFutureProviderElement<LeaseModel>
    with LeaseDetailRef {
  _LeaseDetailProviderElement(super.provider);

  @override
  String get propertyId => (origin as LeaseDetailProvider).propertyId;
  @override
  String get leaseId => (origin as LeaseDetailProvider).leaseId;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
