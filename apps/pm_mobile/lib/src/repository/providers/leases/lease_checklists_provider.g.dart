// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lease_checklists_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$leaseChecklistsHash() => r'516d71c03baf5cca94659be232b55769ce1b4ce8';

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

/// See also [leaseChecklists].
@ProviderFor(leaseChecklists)
const leaseChecklistsProvider = LeaseChecklistsFamily();

/// See also [leaseChecklists].
class LeaseChecklistsFamily
    extends Family<AsyncValue<List<LeaseChecklistModel>>> {
  /// See also [leaseChecklists].
  const LeaseChecklistsFamily();

  /// See also [leaseChecklists].
  LeaseChecklistsProvider call(String propertyId, String leaseId) {
    return LeaseChecklistsProvider(propertyId, leaseId);
  }

  @override
  LeaseChecklistsProvider getProviderOverride(
    covariant LeaseChecklistsProvider provider,
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
  String? get name => r'leaseChecklistsProvider';
}

/// See also [leaseChecklists].
class LeaseChecklistsProvider
    extends AutoDisposeFutureProvider<List<LeaseChecklistModel>> {
  /// See also [leaseChecklists].
  LeaseChecklistsProvider(String propertyId, String leaseId)
    : this._internal(
        (ref) =>
            leaseChecklists(ref as LeaseChecklistsRef, propertyId, leaseId),
        from: leaseChecklistsProvider,
        name: r'leaseChecklistsProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$leaseChecklistsHash,
        dependencies: LeaseChecklistsFamily._dependencies,
        allTransitiveDependencies:
            LeaseChecklistsFamily._allTransitiveDependencies,
        propertyId: propertyId,
        leaseId: leaseId,
      );

  LeaseChecklistsProvider._internal(
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
    FutureOr<List<LeaseChecklistModel>> Function(LeaseChecklistsRef provider)
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: LeaseChecklistsProvider._internal(
        (ref) => create(ref as LeaseChecklistsRef),
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
  AutoDisposeFutureProviderElement<List<LeaseChecklistModel>> createElement() {
    return _LeaseChecklistsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is LeaseChecklistsProvider &&
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

mixin LeaseChecklistsRef
    on AutoDisposeFutureProviderRef<List<LeaseChecklistModel>> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `leaseId` of this provider.
  String get leaseId;
}

class _LeaseChecklistsProviderElement
    extends AutoDisposeFutureProviderElement<List<LeaseChecklistModel>>
    with LeaseChecklistsRef {
  _LeaseChecklistsProviderElement(super.provider);

  @override
  String get propertyId => (origin as LeaseChecklistsProvider).propertyId;
  @override
  String get leaseId => (origin as LeaseChecklistsProvider).leaseId;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
