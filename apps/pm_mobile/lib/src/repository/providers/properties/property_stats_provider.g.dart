// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_stats_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$propertyStatsHash() => r'4130c4c7eb0665d567b259879d109c75dc5118a4';

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

/// See also [propertyStats].
@ProviderFor(propertyStats)
const propertyStatsProvider = PropertyStatsFamily();

/// See also [propertyStats].
class PropertyStatsFamily extends Family<AsyncValue<PropertyStats>> {
  /// See also [propertyStats].
  const PropertyStatsFamily();

  /// See also [propertyStats].
  PropertyStatsProvider call(
    String propertyId,
  ) {
    return PropertyStatsProvider(
      propertyId,
    );
  }

  @override
  PropertyStatsProvider getProviderOverride(
    covariant PropertyStatsProvider provider,
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
  String? get name => r'propertyStatsProvider';
}

/// See also [propertyStats].
class PropertyStatsProvider extends AutoDisposeFutureProvider<PropertyStats> {
  /// See also [propertyStats].
  PropertyStatsProvider(
    String propertyId,
  ) : this._internal(
          (ref) => propertyStats(
            ref as PropertyStatsRef,
            propertyId,
          ),
          from: propertyStatsProvider,
          name: r'propertyStatsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$propertyStatsHash,
          dependencies: PropertyStatsFamily._dependencies,
          allTransitiveDependencies:
              PropertyStatsFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  PropertyStatsProvider._internal(
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
    FutureOr<PropertyStats> Function(PropertyStatsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PropertyStatsProvider._internal(
        (ref) => create(ref as PropertyStatsRef),
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
  AutoDisposeFutureProviderElement<PropertyStats> createElement() {
    return _PropertyStatsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PropertyStatsProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PropertyStatsRef on AutoDisposeFutureProviderRef<PropertyStats> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;
}

class _PropertyStatsProviderElement
    extends AutoDisposeFutureProviderElement<PropertyStats>
    with PropertyStatsRef {
  _PropertyStatsProviderElement(super.provider);

  @override
  String get propertyId => (origin as PropertyStatsProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
