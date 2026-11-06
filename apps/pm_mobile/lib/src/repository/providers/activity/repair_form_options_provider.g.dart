// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'repair_form_options_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$repairPropertyOptionsHash() =>
    r'3618a9aa5da96f0c9e2386c7ca53073aaa1f51cd';

/// The backend only lets a property's MANAGER open a repair on it.
///
/// Copied from [repairPropertyOptions].
@ProviderFor(repairPropertyOptions)
final repairPropertyOptionsProvider =
    AutoDisposeFutureProvider<List<PropertyModel>>.internal(
  repairPropertyOptions,
  name: r'repairPropertyOptionsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$repairPropertyOptionsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef RepairPropertyOptionsRef
    = AutoDisposeFutureProviderRef<List<PropertyModel>>;
String _$repairAssetOptionsHash() =>
    r'049148271f6ff8fd0c6a9b0d9e2d0bb9d499ece4';

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

/// Every unit regardless of status: a repair can be on an occupied one.
///
/// Copied from [repairAssetOptions].
@ProviderFor(repairAssetOptions)
const repairAssetOptionsProvider = RepairAssetOptionsFamily();

/// Every unit regardless of status: a repair can be on an occupied one.
///
/// Copied from [repairAssetOptions].
class RepairAssetOptionsFamily extends Family<
    AsyncValue<({List<PropertyBlockModel> blocks, List<UnitModel> units})>> {
  /// Every unit regardless of status: a repair can be on an occupied one.
  ///
  /// Copied from [repairAssetOptions].
  const RepairAssetOptionsFamily();

  /// Every unit regardless of status: a repair can be on an occupied one.
  ///
  /// Copied from [repairAssetOptions].
  RepairAssetOptionsProvider call(
    String propertyId,
  ) {
    return RepairAssetOptionsProvider(
      propertyId,
    );
  }

  @override
  RepairAssetOptionsProvider getProviderOverride(
    covariant RepairAssetOptionsProvider provider,
  ) {
    return call(
      provider.propertyId,
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
  String? get name => r'repairAssetOptionsProvider';
}

/// Every unit regardless of status: a repair can be on an occupied one.
///
/// Copied from [repairAssetOptions].
class RepairAssetOptionsProvider extends AutoDisposeFutureProvider<
    ({List<PropertyBlockModel> blocks, List<UnitModel> units})> {
  /// Every unit regardless of status: a repair can be on an occupied one.
  ///
  /// Copied from [repairAssetOptions].
  RepairAssetOptionsProvider(
    String propertyId,
  ) : this._internal(
          (ref) => repairAssetOptions(
            ref as RepairAssetOptionsRef,
            propertyId,
          ),
          from: repairAssetOptionsProvider,
          name: r'repairAssetOptionsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$repairAssetOptionsHash,
          dependencies: RepairAssetOptionsFamily._dependencies,
          allTransitiveDependencies:
              RepairAssetOptionsFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  RepairAssetOptionsProvider._internal(
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
    FutureOr<({List<PropertyBlockModel> blocks, List<UnitModel> units})>
            Function(RepairAssetOptionsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: RepairAssetOptionsProvider._internal(
        (ref) => create(ref as RepairAssetOptionsRef),
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
  AutoDisposeFutureProviderElement<
          ({List<PropertyBlockModel> blocks, List<UnitModel> units})>
      createElement() {
    return _RepairAssetOptionsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is RepairAssetOptionsProvider &&
        other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin RepairAssetOptionsRef on AutoDisposeFutureProviderRef<
    ({List<PropertyBlockModel> blocks, List<UnitModel> units})> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;
}

class _RepairAssetOptionsProviderElement
    extends AutoDisposeFutureProviderElement<
        ({List<PropertyBlockModel> blocks, List<UnitModel> units})>
    with RepairAssetOptionsRef {
  _RepairAssetOptionsProviderElement(super.provider);

  @override
  String get propertyId => (origin as RepairAssetOptionsProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
