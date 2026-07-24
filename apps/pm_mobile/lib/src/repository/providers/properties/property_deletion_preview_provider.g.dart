// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_deletion_preview_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$propertyDeletionPreviewHash() =>
    r'6634d7982bda49d4f62afc01ce8073223548318a';

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

/// See also [propertyDeletionPreview].
@ProviderFor(propertyDeletionPreview)
const propertyDeletionPreviewProvider = PropertyDeletionPreviewFamily();

/// See also [propertyDeletionPreview].
class PropertyDeletionPreviewFamily
    extends Family<AsyncValue<PropertyDeletionPreviewModel>> {
  /// See also [propertyDeletionPreview].
  const PropertyDeletionPreviewFamily();

  /// See also [propertyDeletionPreview].
  PropertyDeletionPreviewProvider call(
    String propertyId,
  ) {
    return PropertyDeletionPreviewProvider(
      propertyId,
    );
  }

  @override
  PropertyDeletionPreviewProvider getProviderOverride(
    covariant PropertyDeletionPreviewProvider provider,
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
  String? get name => r'propertyDeletionPreviewProvider';
}

/// See also [propertyDeletionPreview].
class PropertyDeletionPreviewProvider
    extends AutoDisposeFutureProvider<PropertyDeletionPreviewModel> {
  /// See also [propertyDeletionPreview].
  PropertyDeletionPreviewProvider(
    String propertyId,
  ) : this._internal(
          (ref) => propertyDeletionPreview(
            ref as PropertyDeletionPreviewRef,
            propertyId,
          ),
          from: propertyDeletionPreviewProvider,
          name: r'propertyDeletionPreviewProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$propertyDeletionPreviewHash,
          dependencies: PropertyDeletionPreviewFamily._dependencies,
          allTransitiveDependencies:
              PropertyDeletionPreviewFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  PropertyDeletionPreviewProvider._internal(
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
    FutureOr<PropertyDeletionPreviewModel> Function(
            PropertyDeletionPreviewRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PropertyDeletionPreviewProvider._internal(
        (ref) => create(ref as PropertyDeletionPreviewRef),
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
  AutoDisposeFutureProviderElement<PropertyDeletionPreviewModel>
      createElement() {
    return _PropertyDeletionPreviewProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PropertyDeletionPreviewProvider &&
        other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PropertyDeletionPreviewRef
    on AutoDisposeFutureProviderRef<PropertyDeletionPreviewModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;
}

class _PropertyDeletionPreviewProviderElement
    extends AutoDisposeFutureProviderElement<PropertyDeletionPreviewModel>
    with PropertyDeletionPreviewRef {
  _PropertyDeletionPreviewProviderElement(super.provider);

  @override
  String get propertyId =>
      (origin as PropertyDeletionPreviewProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
