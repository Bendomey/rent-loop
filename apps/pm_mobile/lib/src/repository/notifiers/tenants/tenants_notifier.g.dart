// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenants_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$tenantsNotifierHash() => r'ddb9e8259668c7df7275fc7ab970f6466e7933df';

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

abstract class _$TenantsNotifier
    extends BuildlessAutoDisposeNotifier<TenantsState> {
  late final String? propertyId;

  TenantsState build(
    String? propertyId,
  );
}

/// Keyed by the screen's entry property so the Tenants tab (null) and a
/// property's pushed tenants screen never overwrite each other's list.
///
/// Copied from [TenantsNotifier].
@ProviderFor(TenantsNotifier)
const tenantsNotifierProvider = TenantsNotifierFamily();

/// Keyed by the screen's entry property so the Tenants tab (null) and a
/// property's pushed tenants screen never overwrite each other's list.
///
/// Copied from [TenantsNotifier].
class TenantsNotifierFamily extends Family<TenantsState> {
  /// Keyed by the screen's entry property so the Tenants tab (null) and a
  /// property's pushed tenants screen never overwrite each other's list.
  ///
  /// Copied from [TenantsNotifier].
  const TenantsNotifierFamily();

  /// Keyed by the screen's entry property so the Tenants tab (null) and a
  /// property's pushed tenants screen never overwrite each other's list.
  ///
  /// Copied from [TenantsNotifier].
  TenantsNotifierProvider call(
    String? propertyId,
  ) {
    return TenantsNotifierProvider(
      propertyId,
    );
  }

  @override
  TenantsNotifierProvider getProviderOverride(
    covariant TenantsNotifierProvider provider,
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
  String? get name => r'tenantsNotifierProvider';
}

/// Keyed by the screen's entry property so the Tenants tab (null) and a
/// property's pushed tenants screen never overwrite each other's list.
///
/// Copied from [TenantsNotifier].
class TenantsNotifierProvider
    extends AutoDisposeNotifierProviderImpl<TenantsNotifier, TenantsState> {
  /// Keyed by the screen's entry property so the Tenants tab (null) and a
  /// property's pushed tenants screen never overwrite each other's list.
  ///
  /// Copied from [TenantsNotifier].
  TenantsNotifierProvider(
    String? propertyId,
  ) : this._internal(
          () => TenantsNotifier()..propertyId = propertyId,
          from: tenantsNotifierProvider,
          name: r'tenantsNotifierProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$tenantsNotifierHash,
          dependencies: TenantsNotifierFamily._dependencies,
          allTransitiveDependencies:
              TenantsNotifierFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  TenantsNotifierProvider._internal(
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
  TenantsState runNotifierBuild(
    covariant TenantsNotifier notifier,
  ) {
    return notifier.build(
      propertyId,
    );
  }

  @override
  Override overrideWith(TenantsNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: TenantsNotifierProvider._internal(
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
  AutoDisposeNotifierProviderElement<TenantsNotifier, TenantsState>
      createElement() {
    return _TenantsNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TenantsNotifierProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin TenantsNotifierRef on AutoDisposeNotifierProviderRef<TenantsState> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _TenantsNotifierProviderElement
    extends AutoDisposeNotifierProviderElement<TenantsNotifier, TenantsState>
    with TenantsNotifierRef {
  _TenantsNotifierProviderElement(super.provider);

  @override
  String? get propertyId => (origin as TenantsNotifierProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
