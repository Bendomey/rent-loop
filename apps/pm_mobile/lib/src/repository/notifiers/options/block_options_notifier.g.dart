// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'block_options_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$blockOptionsNotifierHash() =>
    r'aa22144d5299c759985adc0a8c6f1cc17a2b06ae';

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

abstract class _$BlockOptionsNotifier
    extends BuildlessAutoDisposeNotifier<OptionsState<PropertyBlockModel>> {
  late final String propertyId;

  OptionsState<PropertyBlockModel> build(String propertyId);
}

/// See also [BlockOptionsNotifier].
@ProviderFor(BlockOptionsNotifier)
const blockOptionsNotifierProvider = BlockOptionsNotifierFamily();

/// See also [BlockOptionsNotifier].
class BlockOptionsNotifierFamily
    extends Family<OptionsState<PropertyBlockModel>> {
  /// See also [BlockOptionsNotifier].
  const BlockOptionsNotifierFamily();

  /// See also [BlockOptionsNotifier].
  BlockOptionsNotifierProvider call(String propertyId) {
    return BlockOptionsNotifierProvider(propertyId);
  }

  @override
  BlockOptionsNotifierProvider getProviderOverride(
    covariant BlockOptionsNotifierProvider provider,
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
  String? get name => r'blockOptionsNotifierProvider';
}

/// See also [BlockOptionsNotifier].
class BlockOptionsNotifierProvider
    extends
        AutoDisposeNotifierProviderImpl<
          BlockOptionsNotifier,
          OptionsState<PropertyBlockModel>
        > {
  /// See also [BlockOptionsNotifier].
  BlockOptionsNotifierProvider(String propertyId)
    : this._internal(
        () => BlockOptionsNotifier()..propertyId = propertyId,
        from: blockOptionsNotifierProvider,
        name: r'blockOptionsNotifierProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$blockOptionsNotifierHash,
        dependencies: BlockOptionsNotifierFamily._dependencies,
        allTransitiveDependencies:
            BlockOptionsNotifierFamily._allTransitiveDependencies,
        propertyId: propertyId,
      );

  BlockOptionsNotifierProvider._internal(
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
  OptionsState<PropertyBlockModel> runNotifierBuild(
    covariant BlockOptionsNotifier notifier,
  ) {
    return notifier.build(propertyId);
  }

  @override
  Override overrideWith(BlockOptionsNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: BlockOptionsNotifierProvider._internal(
        () => create()..propertyId = propertyId,
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
  AutoDisposeNotifierProviderElement<
    BlockOptionsNotifier,
    OptionsState<PropertyBlockModel>
  >
  createElement() {
    return _BlockOptionsNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is BlockOptionsNotifierProvider &&
        other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin BlockOptionsNotifierRef
    on AutoDisposeNotifierProviderRef<OptionsState<PropertyBlockModel>> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;
}

class _BlockOptionsNotifierProviderElement
    extends
        AutoDisposeNotifierProviderElement<
          BlockOptionsNotifier,
          OptionsState<PropertyBlockModel>
        >
    with BlockOptionsNotifierRef {
  _BlockOptionsNotifierProviderElement(super.provider);

  @override
  String get propertyId => (origin as BlockOptionsNotifierProvider).propertyId;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
