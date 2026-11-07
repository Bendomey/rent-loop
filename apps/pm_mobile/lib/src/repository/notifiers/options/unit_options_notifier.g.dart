// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unit_options_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$unitOptionsNotifierHash() =>
    r'478657661ebc8fae6c98bab7c89261d42ea204bf';

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

abstract class _$UnitOptionsNotifier
    extends BuildlessAutoDisposeNotifier<OptionsState<UnitModel>> {
  late final UnitOptionsQuery query;

  OptionsState<UnitModel> build(UnitOptionsQuery query);
}

/// See also [UnitOptionsNotifier].
@ProviderFor(UnitOptionsNotifier)
const unitOptionsNotifierProvider = UnitOptionsNotifierFamily();

/// See also [UnitOptionsNotifier].
class UnitOptionsNotifierFamily extends Family<OptionsState<UnitModel>> {
  /// See also [UnitOptionsNotifier].
  const UnitOptionsNotifierFamily();

  /// See also [UnitOptionsNotifier].
  UnitOptionsNotifierProvider call(UnitOptionsQuery query) {
    return UnitOptionsNotifierProvider(query);
  }

  @override
  UnitOptionsNotifierProvider getProviderOverride(
    covariant UnitOptionsNotifierProvider provider,
  ) {
    return call(provider.query);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'unitOptionsNotifierProvider';
}

/// See also [UnitOptionsNotifier].
class UnitOptionsNotifierProvider
    extends
        AutoDisposeNotifierProviderImpl<
          UnitOptionsNotifier,
          OptionsState<UnitModel>
        > {
  /// See also [UnitOptionsNotifier].
  UnitOptionsNotifierProvider(UnitOptionsQuery query)
    : this._internal(
        () => UnitOptionsNotifier()..query = query,
        from: unitOptionsNotifierProvider,
        name: r'unitOptionsNotifierProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$unitOptionsNotifierHash,
        dependencies: UnitOptionsNotifierFamily._dependencies,
        allTransitiveDependencies:
            UnitOptionsNotifierFamily._allTransitiveDependencies,
        query: query,
      );

  UnitOptionsNotifierProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.query,
  }) : super.internal();

  final UnitOptionsQuery query;

  @override
  OptionsState<UnitModel> runNotifierBuild(
    covariant UnitOptionsNotifier notifier,
  ) {
    return notifier.build(query);
  }

  @override
  Override overrideWith(UnitOptionsNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: UnitOptionsNotifierProvider._internal(
        () => create()..query = query,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        query: query,
      ),
    );
  }

  @override
  AutoDisposeNotifierProviderElement<
    UnitOptionsNotifier,
    OptionsState<UnitModel>
  >
  createElement() {
    return _UnitOptionsNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is UnitOptionsNotifierProvider && other.query == query;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, query.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin UnitOptionsNotifierRef
    on AutoDisposeNotifierProviderRef<OptionsState<UnitModel>> {
  /// The parameter `query` of this provider.
  UnitOptionsQuery get query;
}

class _UnitOptionsNotifierProviderElement
    extends
        AutoDisposeNotifierProviderElement<
          UnitOptionsNotifier,
          OptionsState<UnitModel>
        >
    with UnitOptionsNotifierRef {
  _UnitOptionsNotifierProviderElement(super.provider);

  @override
  UnitOptionsQuery get query => (origin as UnitOptionsNotifierProvider).query;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
