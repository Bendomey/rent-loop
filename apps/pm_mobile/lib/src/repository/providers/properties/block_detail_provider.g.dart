// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'block_detail_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$blockDetailHash() => r'd43023bcf431342594d5fc27d9b0625caa6ce484';

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

/// See also [blockDetail].
@ProviderFor(blockDetail)
const blockDetailProvider = BlockDetailFamily();

/// See also [blockDetail].
class BlockDetailFamily extends Family<AsyncValue<PropertyBlockModel>> {
  /// See also [blockDetail].
  const BlockDetailFamily();

  /// See also [blockDetail].
  BlockDetailProvider call(String propertyId, String blockId) {
    return BlockDetailProvider(propertyId, blockId);
  }

  @override
  BlockDetailProvider getProviderOverride(
    covariant BlockDetailProvider provider,
  ) {
    return call(provider.propertyId, provider.blockId);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'blockDetailProvider';
}

/// See also [blockDetail].
class BlockDetailProvider
    extends AutoDisposeFutureProvider<PropertyBlockModel> {
  /// See also [blockDetail].
  BlockDetailProvider(String propertyId, String blockId)
    : this._internal(
        (ref) => blockDetail(ref as BlockDetailRef, propertyId, blockId),
        from: blockDetailProvider,
        name: r'blockDetailProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$blockDetailHash,
        dependencies: BlockDetailFamily._dependencies,
        allTransitiveDependencies: BlockDetailFamily._allTransitiveDependencies,
        propertyId: propertyId,
        blockId: blockId,
      );

  BlockDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.blockId,
  }) : super.internal();

  final String propertyId;
  final String blockId;

  @override
  Override overrideWith(
    FutureOr<PropertyBlockModel> Function(BlockDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: BlockDetailProvider._internal(
        (ref) => create(ref as BlockDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        blockId: blockId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<PropertyBlockModel> createElement() {
    return _BlockDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is BlockDetailProvider &&
        other.propertyId == propertyId &&
        other.blockId == blockId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, blockId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin BlockDetailRef on AutoDisposeFutureProviderRef<PropertyBlockModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `blockId` of this provider.
  String get blockId;
}

class _BlockDetailProviderElement
    extends AutoDisposeFutureProviderElement<PropertyBlockModel>
    with BlockDetailRef {
  _BlockDetailProviderElement(super.provider);

  @override
  String get propertyId => (origin as BlockDetailProvider).propertyId;
  @override
  String get blockId => (origin as BlockDetailProvider).blockId;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
