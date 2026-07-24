// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_restore_preview_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$propertyRestorePreviewHash() =>
    r'9348b04f2ac3cce605b4982ec2bb3c8fe8319db9';

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

/// See also [propertyRestorePreview].
@ProviderFor(propertyRestorePreview)
const propertyRestorePreviewProvider = PropertyRestorePreviewFamily();

/// See also [propertyRestorePreview].
class PropertyRestorePreviewFamily
    extends Family<AsyncValue<PropertyRestorePreviewModel>> {
  /// See also [propertyRestorePreview].
  const PropertyRestorePreviewFamily();

  /// See also [propertyRestorePreview].
  PropertyRestorePreviewProvider call(
    String propertyId,
  ) {
    return PropertyRestorePreviewProvider(
      propertyId,
    );
  }

  @override
  PropertyRestorePreviewProvider getProviderOverride(
    covariant PropertyRestorePreviewProvider provider,
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
  String? get name => r'propertyRestorePreviewProvider';
}

/// See also [propertyRestorePreview].
class PropertyRestorePreviewProvider
    extends AutoDisposeFutureProvider<PropertyRestorePreviewModel> {
  /// See also [propertyRestorePreview].
  PropertyRestorePreviewProvider(
    String propertyId,
  ) : this._internal(
          (ref) => propertyRestorePreview(
            ref as PropertyRestorePreviewRef,
            propertyId,
          ),
          from: propertyRestorePreviewProvider,
          name: r'propertyRestorePreviewProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$propertyRestorePreviewHash,
          dependencies: PropertyRestorePreviewFamily._dependencies,
          allTransitiveDependencies:
              PropertyRestorePreviewFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  PropertyRestorePreviewProvider._internal(
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
    FutureOr<PropertyRestorePreviewModel> Function(
            PropertyRestorePreviewRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PropertyRestorePreviewProvider._internal(
        (ref) => create(ref as PropertyRestorePreviewRef),
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
  AutoDisposeFutureProviderElement<PropertyRestorePreviewModel>
      createElement() {
    return _PropertyRestorePreviewProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PropertyRestorePreviewProvider &&
        other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PropertyRestorePreviewRef
    on AutoDisposeFutureProviderRef<PropertyRestorePreviewModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;
}

class _PropertyRestorePreviewProviderElement
    extends AutoDisposeFutureProviderElement<PropertyRestorePreviewModel>
    with PropertyRestorePreviewRef {
  _PropertyRestorePreviewProviderElement(super.provider);

  @override
  String get propertyId =>
      (origin as PropertyRestorePreviewProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
