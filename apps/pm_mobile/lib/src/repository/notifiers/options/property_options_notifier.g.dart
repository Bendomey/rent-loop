// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_options_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$propertyOptionsNotifierHash() =>
    r'6575988cc33dcbd869b0676beec3d177c519c87b';

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

abstract class _$PropertyOptionsNotifier
    extends BuildlessAutoDisposeNotifier<OptionsState<PropertyModel>> {
  late final bool managerOnly;

  OptionsState<PropertyModel> build({bool managerOnly = false});
}

/// See also [PropertyOptionsNotifier].
@ProviderFor(PropertyOptionsNotifier)
const propertyOptionsNotifierProvider = PropertyOptionsNotifierFamily();

/// See also [PropertyOptionsNotifier].
class PropertyOptionsNotifierFamily
    extends Family<OptionsState<PropertyModel>> {
  /// See also [PropertyOptionsNotifier].
  const PropertyOptionsNotifierFamily();

  /// See also [PropertyOptionsNotifier].
  PropertyOptionsNotifierProvider call({bool managerOnly = false}) {
    return PropertyOptionsNotifierProvider(managerOnly: managerOnly);
  }

  @override
  PropertyOptionsNotifierProvider getProviderOverride(
    covariant PropertyOptionsNotifierProvider provider,
  ) {
    return call(managerOnly: provider.managerOnly);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'propertyOptionsNotifierProvider';
}

/// See also [PropertyOptionsNotifier].
class PropertyOptionsNotifierProvider
    extends
        AutoDisposeNotifierProviderImpl<
          PropertyOptionsNotifier,
          OptionsState<PropertyModel>
        > {
  /// See also [PropertyOptionsNotifier].
  PropertyOptionsNotifierProvider({bool managerOnly = false})
    : this._internal(
        () => PropertyOptionsNotifier()..managerOnly = managerOnly,
        from: propertyOptionsNotifierProvider,
        name: r'propertyOptionsNotifierProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$propertyOptionsNotifierHash,
        dependencies: PropertyOptionsNotifierFamily._dependencies,
        allTransitiveDependencies:
            PropertyOptionsNotifierFamily._allTransitiveDependencies,
        managerOnly: managerOnly,
      );

  PropertyOptionsNotifierProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.managerOnly,
  }) : super.internal();

  final bool managerOnly;

  @override
  OptionsState<PropertyModel> runNotifierBuild(
    covariant PropertyOptionsNotifier notifier,
  ) {
    return notifier.build(managerOnly: managerOnly);
  }

  @override
  Override overrideWith(PropertyOptionsNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: PropertyOptionsNotifierProvider._internal(
        () => create()..managerOnly = managerOnly,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        managerOnly: managerOnly,
      ),
    );
  }

  @override
  AutoDisposeNotifierProviderElement<
    PropertyOptionsNotifier,
    OptionsState<PropertyModel>
  >
  createElement() {
    return _PropertyOptionsNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PropertyOptionsNotifierProvider &&
        other.managerOnly == managerOnly;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, managerOnly.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PropertyOptionsNotifierRef
    on AutoDisposeNotifierProviderRef<OptionsState<PropertyModel>> {
  /// The parameter `managerOnly` of this provider.
  bool get managerOnly;
}

class _PropertyOptionsNotifierProviderElement
    extends
        AutoDisposeNotifierProviderElement<
          PropertyOptionsNotifier,
          OptionsState<PropertyModel>
        >
    with PropertyOptionsNotifierRef {
  _PropertyOptionsNotifierProviderElement(super.provider);

  @override
  bool get managerOnly =>
      (origin as PropertyOptionsNotifierProvider).managerOnly;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
