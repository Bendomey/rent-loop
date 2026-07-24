// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_blocks_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$propertyBlocksHash() => r'747984a13a348321ef7f051be76ce7b6bafd1097';

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

/// See also [propertyBlocks].
@ProviderFor(propertyBlocks)
const propertyBlocksProvider = PropertyBlocksFamily();

/// See also [propertyBlocks].
class PropertyBlocksFamily extends Family<AsyncValue<PropertyBlocksPage>> {
  /// See also [propertyBlocks].
  const PropertyBlocksFamily();

  /// See also [propertyBlocks].
  PropertyBlocksProvider call(String propertyId) {
    return PropertyBlocksProvider(propertyId);
  }

  @override
  PropertyBlocksProvider getProviderOverride(
    covariant PropertyBlocksProvider provider,
  ) {
    return call(provider.propertyId);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'propertyBlocksProvider';
}

/// See also [propertyBlocks].
class PropertyBlocksProvider
    extends AutoDisposeFutureProvider<PropertyBlocksPage> {
  /// See also [propertyBlocks].
  PropertyBlocksProvider(String propertyId)
    : this._internal(
        (ref) => propertyBlocks(ref as PropertyBlocksRef, propertyId),
        from: propertyBlocksProvider,
        name: r'propertyBlocksProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$propertyBlocksHash,
        dependencies: PropertyBlocksFamily._dependencies,
        allTransitiveDependencies:
            PropertyBlocksFamily._allTransitiveDependencies,
        propertyId: propertyId,
      );

  PropertyBlocksProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
  }) : super.internal();

  final String propertyId;

  @override
  Override overrideWith(
    FutureOr<PropertyBlocksPage> Function(PropertyBlocksRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PropertyBlocksProvider._internal(
        (ref) => create(ref as PropertyBlocksRef),
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
  AutoDisposeFutureProviderElement<PropertyBlocksPage> createElement() {
    return _PropertyBlocksProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PropertyBlocksProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PropertyBlocksRef on AutoDisposeFutureProviderRef<PropertyBlocksPage> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;
}

class _PropertyBlocksProviderElement
    extends AutoDisposeFutureProviderElement<PropertyBlocksPage>
    with PropertyBlocksRef {
  _PropertyBlocksProviderElement(super.provider);

  @override
  String get propertyId => (origin as PropertyBlocksProvider).propertyId;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
