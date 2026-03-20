// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unit_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$unitHash() => r'17bf416b9f8b2e38050b2306fc5ae55b0cdb63e4';

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

/// See also [unit].
@ProviderFor(unit)
const unitProvider = UnitFamily();

/// See also [unit].
class UnitFamily extends Family<AsyncValue<UnitModel>> {
  /// See also [unit].
  const UnitFamily();

  /// See also [unit].
  UnitProvider call(
    String unitId,
  ) {
    return UnitProvider(
      unitId,
    );
  }

  @override
  UnitProvider getProviderOverride(
    covariant UnitProvider provider,
  ) {
    return call(
      provider.unitId,
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
  String? get name => r'unitProvider';
}

/// See also [unit].
class UnitProvider extends AutoDisposeFutureProvider<UnitModel> {
  /// See also [unit].
  UnitProvider(
    String unitId,
  ) : this._internal(
          (ref) => unit(
            ref as UnitRef,
            unitId,
          ),
          from: unitProvider,
          name: r'unitProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product') ? null : _$unitHash,
          dependencies: UnitFamily._dependencies,
          allTransitiveDependencies: UnitFamily._allTransitiveDependencies,
          unitId: unitId,
        );

  UnitProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.unitId,
  }) : super.internal();

  final String unitId;

  @override
  Override overrideWith(
    FutureOr<UnitModel> Function(UnitRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: UnitProvider._internal(
        (ref) => create(ref as UnitRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        unitId: unitId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<UnitModel> createElement() {
    return _UnitProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is UnitProvider && other.unitId == unitId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, unitId.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin UnitRef on AutoDisposeFutureProviderRef<UnitModel> {
  /// The parameter `unitId` of this provider.
  String get unitId;
}

class _UnitProviderElement extends AutoDisposeFutureProviderElement<UnitModel>
    with UnitRef {
  _UnitProviderElement(super.provider);

  @override
  String get unitId => (origin as UnitProvider).unitId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
