// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'home_stats_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$homePaymentsHash() => r'98b972eefc36bdcddacc4600c5997e468664b55d';

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

/// One query feeds the money card, the chart and the property list: monthly
/// successful payments per property over the chart window.
///
/// Copied from [homePayments].
@ProviderFor(homePayments)
const homePaymentsProvider = HomePaymentsFamily();

/// One query feeds the money card, the chart and the property list: monthly
/// successful payments per property over the chart window.
///
/// Copied from [homePayments].
class HomePaymentsFamily extends Family<AsyncValue<HomePayments>> {
  /// One query feeds the money card, the chart and the property list: monthly
  /// successful payments per property over the chart window.
  ///
  /// Copied from [homePayments].
  const HomePaymentsFamily();

  /// One query feeds the money card, the chart and the property list: monthly
  /// successful payments per property over the chart window.
  ///
  /// Copied from [homePayments].
  HomePaymentsProvider call(
    String? propertyId,
  ) {
    return HomePaymentsProvider(
      propertyId,
    );
  }

  @override
  HomePaymentsProvider getProviderOverride(
    covariant HomePaymentsProvider provider,
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
  String? get name => r'homePaymentsProvider';
}

/// One query feeds the money card, the chart and the property list: monthly
/// successful payments per property over the chart window.
///
/// Copied from [homePayments].
class HomePaymentsProvider extends FutureProvider<HomePayments> {
  /// One query feeds the money card, the chart and the property list: monthly
  /// successful payments per property over the chart window.
  ///
  /// Copied from [homePayments].
  HomePaymentsProvider(
    String? propertyId,
  ) : this._internal(
          (ref) => homePayments(
            ref as HomePaymentsRef,
            propertyId,
          ),
          from: homePaymentsProvider,
          name: r'homePaymentsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$homePaymentsHash,
          dependencies: HomePaymentsFamily._dependencies,
          allTransitiveDependencies:
              HomePaymentsFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  HomePaymentsProvider._internal(
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
    FutureOr<HomePayments> Function(HomePaymentsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: HomePaymentsProvider._internal(
        (ref) => create(ref as HomePaymentsRef),
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
  FutureProviderElement<HomePayments> createElement() {
    return _HomePaymentsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is HomePaymentsProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin HomePaymentsRef on FutureProviderRef<HomePayments> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _HomePaymentsProviderElement extends FutureProviderElement<HomePayments>
    with HomePaymentsRef {
  _HomePaymentsProviderElement(super.provider);

  @override
  String? get propertyId => (origin as HomePaymentsProvider).propertyId;
}

String _$homeChargesHash() => r'5c067d1a0f762fd08001c99d7bbec4ac117b56d2';

/// Per account (and so per property) rows, so credits never offset debts and
/// late properties can be counted.
///
/// Copied from [homeCharges].
@ProviderFor(homeCharges)
const homeChargesProvider = HomeChargesFamily();

/// Per account (and so per property) rows, so credits never offset debts and
/// late properties can be counted.
///
/// Copied from [homeCharges].
class HomeChargesFamily extends Family<AsyncValue<HomeCharges>> {
  /// Per account (and so per property) rows, so credits never offset debts and
  /// late properties can be counted.
  ///
  /// Copied from [homeCharges].
  const HomeChargesFamily();

  /// Per account (and so per property) rows, so credits never offset debts and
  /// late properties can be counted.
  ///
  /// Copied from [homeCharges].
  HomeChargesProvider call(
    String? propertyId,
  ) {
    return HomeChargesProvider(
      propertyId,
    );
  }

  @override
  HomeChargesProvider getProviderOverride(
    covariant HomeChargesProvider provider,
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
  String? get name => r'homeChargesProvider';
}

/// Per account (and so per property) rows, so credits never offset debts and
/// late properties can be counted.
///
/// Copied from [homeCharges].
class HomeChargesProvider extends FutureProvider<HomeCharges> {
  /// Per account (and so per property) rows, so credits never offset debts and
  /// late properties can be counted.
  ///
  /// Copied from [homeCharges].
  HomeChargesProvider(
    String? propertyId,
  ) : this._internal(
          (ref) => homeCharges(
            ref as HomeChargesRef,
            propertyId,
          ),
          from: homeChargesProvider,
          name: r'homeChargesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$homeChargesHash,
          dependencies: HomeChargesFamily._dependencies,
          allTransitiveDependencies:
              HomeChargesFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  HomeChargesProvider._internal(
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
    FutureOr<HomeCharges> Function(HomeChargesRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: HomeChargesProvider._internal(
        (ref) => create(ref as HomeChargesRef),
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
  FutureProviderElement<HomeCharges> createElement() {
    return _HomeChargesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is HomeChargesProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin HomeChargesRef on FutureProviderRef<HomeCharges> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _HomeChargesProviderElement extends FutureProviderElement<HomeCharges>
    with HomeChargesRef {
  _HomeChargesProviderElement(super.provider);

  @override
  String? get propertyId => (origin as HomeChargesProvider).propertyId;
}

String _$homeLeasesHash() => r'e53a94bd349ba22e2f8e7a43ea97d52549745276';

/// See also [homeLeases].
@ProviderFor(homeLeases)
const homeLeasesProvider = HomeLeasesFamily();

/// See also [homeLeases].
class HomeLeasesFamily extends Family<AsyncValue<HomeLeases>> {
  /// See also [homeLeases].
  const HomeLeasesFamily();

  /// See also [homeLeases].
  HomeLeasesProvider call(
    String? propertyId,
  ) {
    return HomeLeasesProvider(
      propertyId,
    );
  }

  @override
  HomeLeasesProvider getProviderOverride(
    covariant HomeLeasesProvider provider,
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
  String? get name => r'homeLeasesProvider';
}

/// See also [homeLeases].
class HomeLeasesProvider extends FutureProvider<HomeLeases> {
  /// See also [homeLeases].
  HomeLeasesProvider(
    String? propertyId,
  ) : this._internal(
          (ref) => homeLeases(
            ref as HomeLeasesRef,
            propertyId,
          ),
          from: homeLeasesProvider,
          name: r'homeLeasesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$homeLeasesHash,
          dependencies: HomeLeasesFamily._dependencies,
          allTransitiveDependencies:
              HomeLeasesFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  HomeLeasesProvider._internal(
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
    FutureOr<HomeLeases> Function(HomeLeasesRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: HomeLeasesProvider._internal(
        (ref) => create(ref as HomeLeasesRef),
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
  FutureProviderElement<HomeLeases> createElement() {
    return _HomeLeasesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is HomeLeasesProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin HomeLeasesRef on FutureProviderRef<HomeLeases> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _HomeLeasesProviderElement extends FutureProviderElement<HomeLeases>
    with HomeLeasesRef {
  _HomeLeasesProviderElement(super.provider);

  @override
  String? get propertyId => (origin as HomeLeasesProvider).propertyId;
}

String _$homeRepairsHash() => r'f57d83e566c9a76ccc0913380c587c6644d019c7';

/// See also [homeRepairs].
@ProviderFor(homeRepairs)
const homeRepairsProvider = HomeRepairsFamily();

/// See also [homeRepairs].
class HomeRepairsFamily extends Family<AsyncValue<HomeRepairs>> {
  /// See also [homeRepairs].
  const HomeRepairsFamily();

  /// See also [homeRepairs].
  HomeRepairsProvider call(
    String? propertyId,
  ) {
    return HomeRepairsProvider(
      propertyId,
    );
  }

  @override
  HomeRepairsProvider getProviderOverride(
    covariant HomeRepairsProvider provider,
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
  String? get name => r'homeRepairsProvider';
}

/// See also [homeRepairs].
class HomeRepairsProvider extends FutureProvider<HomeRepairs> {
  /// See also [homeRepairs].
  HomeRepairsProvider(
    String? propertyId,
  ) : this._internal(
          (ref) => homeRepairs(
            ref as HomeRepairsRef,
            propertyId,
          ),
          from: homeRepairsProvider,
          name: r'homeRepairsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$homeRepairsHash,
          dependencies: HomeRepairsFamily._dependencies,
          allTransitiveDependencies:
              HomeRepairsFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  HomeRepairsProvider._internal(
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
    FutureOr<HomeRepairs> Function(HomeRepairsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: HomeRepairsProvider._internal(
        (ref) => create(ref as HomeRepairsRef),
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
  FutureProviderElement<HomeRepairs> createElement() {
    return _HomeRepairsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is HomeRepairsProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin HomeRepairsRef on FutureProviderRef<HomeRepairs> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _HomeRepairsProviderElement extends FutureProviderElement<HomeRepairs>
    with HomeRepairsRef {
  _HomeRepairsProviderElement(super.provider);

  @override
  String? get propertyId => (origin as HomeRepairsProvider).propertyId;
}

String _$homeUnitsHash() => r'69fe35b163688fae47ccb6cea18df44a627b1ab9';

/// See also [homeUnits].
@ProviderFor(homeUnits)
const homeUnitsProvider = HomeUnitsFamily();

/// See also [homeUnits].
class HomeUnitsFamily extends Family<AsyncValue<HomeUnits>> {
  /// See also [homeUnits].
  const HomeUnitsFamily();

  /// See also [homeUnits].
  HomeUnitsProvider call(
    String? propertyId,
  ) {
    return HomeUnitsProvider(
      propertyId,
    );
  }

  @override
  HomeUnitsProvider getProviderOverride(
    covariant HomeUnitsProvider provider,
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
  String? get name => r'homeUnitsProvider';
}

/// See also [homeUnits].
class HomeUnitsProvider extends FutureProvider<HomeUnits> {
  /// See also [homeUnits].
  HomeUnitsProvider(
    String? propertyId,
  ) : this._internal(
          (ref) => homeUnits(
            ref as HomeUnitsRef,
            propertyId,
          ),
          from: homeUnitsProvider,
          name: r'homeUnitsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$homeUnitsHash,
          dependencies: HomeUnitsFamily._dependencies,
          allTransitiveDependencies: HomeUnitsFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  HomeUnitsProvider._internal(
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
    FutureOr<HomeUnits> Function(HomeUnitsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: HomeUnitsProvider._internal(
        (ref) => create(ref as HomeUnitsRef),
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
  FutureProviderElement<HomeUnits> createElement() {
    return _HomeUnitsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is HomeUnitsProvider && other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin HomeUnitsRef on FutureProviderRef<HomeUnits> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _HomeUnitsProviderElement extends FutureProviderElement<HomeUnits>
    with HomeUnitsRef {
  _HomeUnitsProviderElement(super.provider);

  @override
  String? get propertyId => (origin as HomeUnitsProvider).propertyId;
}

String _$homePendingTenantsHash() =>
    r'88bb97e5815ba17766d7b4cf1be16e7e7beb5e78';

/// See also [homePendingTenants].
@ProviderFor(homePendingTenants)
const homePendingTenantsProvider = HomePendingTenantsFamily();

/// See also [homePendingTenants].
class HomePendingTenantsFamily extends Family<AsyncValue<HomePendingTenants>> {
  /// See also [homePendingTenants].
  const HomePendingTenantsFamily();

  /// See also [homePendingTenants].
  HomePendingTenantsProvider call(
    String? propertyId,
  ) {
    return HomePendingTenantsProvider(
      propertyId,
    );
  }

  @override
  HomePendingTenantsProvider getProviderOverride(
    covariant HomePendingTenantsProvider provider,
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
  String? get name => r'homePendingTenantsProvider';
}

/// See also [homePendingTenants].
class HomePendingTenantsProvider extends FutureProvider<HomePendingTenants> {
  /// See also [homePendingTenants].
  HomePendingTenantsProvider(
    String? propertyId,
  ) : this._internal(
          (ref) => homePendingTenants(
            ref as HomePendingTenantsRef,
            propertyId,
          ),
          from: homePendingTenantsProvider,
          name: r'homePendingTenantsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$homePendingTenantsHash,
          dependencies: HomePendingTenantsFamily._dependencies,
          allTransitiveDependencies:
              HomePendingTenantsFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  HomePendingTenantsProvider._internal(
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
    FutureOr<HomePendingTenants> Function(HomePendingTenantsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: HomePendingTenantsProvider._internal(
        (ref) => create(ref as HomePendingTenantsRef),
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
  FutureProviderElement<HomePendingTenants> createElement() {
    return _HomePendingTenantsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is HomePendingTenantsProvider &&
        other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin HomePendingTenantsRef on FutureProviderRef<HomePendingTenants> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _HomePendingTenantsProviderElement
    extends FutureProviderElement<HomePendingTenants>
    with HomePendingTenantsRef {
  _HomePendingTenantsProviderElement(super.provider);

  @override
  String? get propertyId => (origin as HomePendingTenantsProvider).propertyId;
}

String _$homePropertyNamesHash() => r'32f7e7606844ee33d4b3b0654807ef3707778eca';

/// Names for the property list; Cube only knows property ids.
///
/// Copied from [homePropertyNames].
@ProviderFor(homePropertyNames)
final homePropertyNamesProvider = FutureProvider<HomePropertyNames>.internal(
  homePropertyNames,
  name: r'homePropertyNamesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$homePropertyNamesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef HomePropertyNamesRef = FutureProviderRef<HomePropertyNames>;
String _$homePropertyHash() => r'e7f42b74d783e9bbb36eedb0450d62c96aab39fc';

/// See also [HomeProperty].
@ProviderFor(HomeProperty)
final homePropertyProvider =
    NotifierProvider<HomeProperty, ({String id, String name})?>.internal(
  HomeProperty.new,
  name: r'homePropertyProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$homePropertyHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$HomeProperty = Notifier<({String id, String name})?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
