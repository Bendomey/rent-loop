// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unit_detail_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$unitDetailHash() => r'abee607ff381f29cbbd01e931e859c0814fc25fd';

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

/// See also [unitDetail].
@ProviderFor(unitDetail)
const unitDetailProvider = UnitDetailFamily();

/// See also [unitDetail].
class UnitDetailFamily extends Family<AsyncValue<UnitModel>> {
  /// See also [unitDetail].
  const UnitDetailFamily();

  /// See also [unitDetail].
  UnitDetailProvider call(String propertyId, String unitId) {
    return UnitDetailProvider(propertyId, unitId);
  }

  @override
  UnitDetailProvider getProviderOverride(
    covariant UnitDetailProvider provider,
  ) {
    return call(provider.propertyId, provider.unitId);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'unitDetailProvider';
}

/// See also [unitDetail].
class UnitDetailProvider extends AutoDisposeFutureProvider<UnitModel> {
  /// See also [unitDetail].
  UnitDetailProvider(String propertyId, String unitId)
    : this._internal(
        (ref) => unitDetail(ref as UnitDetailRef, propertyId, unitId),
        from: unitDetailProvider,
        name: r'unitDetailProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$unitDetailHash,
        dependencies: UnitDetailFamily._dependencies,
        allTransitiveDependencies: UnitDetailFamily._allTransitiveDependencies,
        propertyId: propertyId,
        unitId: unitId,
      );

  UnitDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.unitId,
  }) : super.internal();

  final String propertyId;
  final String unitId;

  @override
  Override overrideWith(
    FutureOr<UnitModel> Function(UnitDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: UnitDetailProvider._internal(
        (ref) => create(ref as UnitDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        unitId: unitId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<UnitModel> createElement() {
    return _UnitDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is UnitDetailProvider &&
        other.propertyId == propertyId &&
        other.unitId == unitId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, unitId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin UnitDetailRef on AutoDisposeFutureProviderRef<UnitModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `unitId` of this provider.
  String get unitId;
}

class _UnitDetailProviderElement
    extends AutoDisposeFutureProviderElement<UnitModel>
    with UnitDetailRef {
  _UnitDetailProviderElement(super.provider);

  @override
  String get propertyId => (origin as UnitDetailProvider).propertyId;
  @override
  String get unitId => (origin as UnitDetailProvider).unitId;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
