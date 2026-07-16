// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_units_preview_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$propertyUnitsPreviewHash() =>
    r'ce5b59a12eb10ec9005f9e310e59dd9fde9c9dcd';

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

/// See also [propertyUnitsPreview].
@ProviderFor(propertyUnitsPreview)
const propertyUnitsPreviewProvider = PropertyUnitsPreviewFamily();

/// See also [propertyUnitsPreview].
class PropertyUnitsPreviewFamily extends Family<AsyncValue<UnitsPage>> {
  /// See also [propertyUnitsPreview].
  const PropertyUnitsPreviewFamily();

  /// See also [propertyUnitsPreview].
  PropertyUnitsPreviewProvider call(
    String propertyId,
  ) {
    return PropertyUnitsPreviewProvider(
      propertyId,
    );
  }

  @override
  PropertyUnitsPreviewProvider getProviderOverride(
    covariant PropertyUnitsPreviewProvider provider,
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
  String? get name => r'propertyUnitsPreviewProvider';
}

/// See also [propertyUnitsPreview].
class PropertyUnitsPreviewProvider
    extends AutoDisposeFutureProvider<UnitsPage> {
  /// See also [propertyUnitsPreview].
  PropertyUnitsPreviewProvider(
    String propertyId,
  ) : this._internal(
          (ref) => propertyUnitsPreview(
            ref as PropertyUnitsPreviewRef,
            propertyId,
          ),
          from: propertyUnitsPreviewProvider,
          name: r'propertyUnitsPreviewProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$propertyUnitsPreviewHash,
          dependencies: PropertyUnitsPreviewFamily._dependencies,
          allTransitiveDependencies:
              PropertyUnitsPreviewFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  PropertyUnitsPreviewProvider._internal(
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
    FutureOr<UnitsPage> Function(PropertyUnitsPreviewRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PropertyUnitsPreviewProvider._internal(
        (ref) => create(ref as PropertyUnitsPreviewRef),
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
  AutoDisposeFutureProviderElement<UnitsPage> createElement() {
    return _PropertyUnitsPreviewProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PropertyUnitsPreviewProvider &&
        other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PropertyUnitsPreviewRef on AutoDisposeFutureProviderRef<UnitsPage> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;
}

class _PropertyUnitsPreviewProviderElement
    extends AutoDisposeFutureProviderElement<UnitsPage>
    with PropertyUnitsPreviewRef {
  _PropertyUnitsPreviewProviderElement(super.provider);

  @override
  String get propertyId => (origin as PropertyUnitsPreviewProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
