// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'application_unit_options_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$applicationUnitOptionsHash() =>
    r'58474f2138942783fb5c8af7dd9ed8fa3d00aee6';

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

/// Units a tenant can be added to. The backend gates creation on the caller's
/// MANAGER role in the unit's property, so other properties are never asked for.
///
/// Copied from [applicationUnitOptions].
@ProviderFor(applicationUnitOptions)
const applicationUnitOptionsProvider = ApplicationUnitOptionsFamily();

/// Units a tenant can be added to. The backend gates creation on the caller's
/// MANAGER role in the unit's property, so other properties are never asked for.
///
/// Copied from [applicationUnitOptions].
class ApplicationUnitOptionsFamily extends Family<AsyncValue<List<UnitModel>>> {
  /// Units a tenant can be added to. The backend gates creation on the caller's
  /// MANAGER role in the unit's property, so other properties are never asked for.
  ///
  /// Copied from [applicationUnitOptions].
  const ApplicationUnitOptionsFamily();

  /// Units a tenant can be added to. The backend gates creation on the caller's
  /// MANAGER role in the unit's property, so other properties are never asked for.
  ///
  /// Copied from [applicationUnitOptions].
  ApplicationUnitOptionsProvider call(
    String? propertyId,
  ) {
    return ApplicationUnitOptionsProvider(
      propertyId,
    );
  }

  @override
  ApplicationUnitOptionsProvider getProviderOverride(
    covariant ApplicationUnitOptionsProvider provider,
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
  String? get name => r'applicationUnitOptionsProvider';
}

/// Units a tenant can be added to. The backend gates creation on the caller's
/// MANAGER role in the unit's property, so other properties are never asked for.
///
/// Copied from [applicationUnitOptions].
class ApplicationUnitOptionsProvider
    extends AutoDisposeFutureProvider<List<UnitModel>> {
  /// Units a tenant can be added to. The backend gates creation on the caller's
  /// MANAGER role in the unit's property, so other properties are never asked for.
  ///
  /// Copied from [applicationUnitOptions].
  ApplicationUnitOptionsProvider(
    String? propertyId,
  ) : this._internal(
          (ref) => applicationUnitOptions(
            ref as ApplicationUnitOptionsRef,
            propertyId,
          ),
          from: applicationUnitOptionsProvider,
          name: r'applicationUnitOptionsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$applicationUnitOptionsHash,
          dependencies: ApplicationUnitOptionsFamily._dependencies,
          allTransitiveDependencies:
              ApplicationUnitOptionsFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  ApplicationUnitOptionsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
  }) : super.internal();

  final String? propertyId;

  @override
  Override overrideWith(
    FutureOr<List<UnitModel>> Function(ApplicationUnitOptionsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ApplicationUnitOptionsProvider._internal(
        (ref) => create(ref as ApplicationUnitOptionsRef),
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
  AutoDisposeFutureProviderElement<List<UnitModel>> createElement() {
    return _ApplicationUnitOptionsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ApplicationUnitOptionsProvider &&
        other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin ApplicationUnitOptionsRef
    on AutoDisposeFutureProviderRef<List<UnitModel>> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _ApplicationUnitOptionsProviderElement
    extends AutoDisposeFutureProviderElement<List<UnitModel>>
    with ApplicationUnitOptionsRef {
  _ApplicationUnitOptionsProviderElement(super.provider);

  @override
  String? get propertyId =>
      (origin as ApplicationUnitOptionsProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
