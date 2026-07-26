// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_detail_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$maintenanceRequestPropertyIdHash() =>
    r'f3120091e12df23f4aeddf1fe754957d81dbfb2b';

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

/// Read providers behind the single maintenance request screen.
///
/// Every detail endpoint is property-scoped, but the route
/// (`/activity/maintenances/:id`) carries only the request id. The board
/// already holds the full record, so it passes `unit.property_id` through as
/// GoRouter `extra` and every provider here takes it as [propertyIdHint].
/// When the hint is absent — a deep link, or a cold start into the route —
/// [maintenanceRequestPropertyId] recovers it from the cross-property list.
///
/// The three tab providers are separate from [maintenanceRequestDetail] so a
/// tab only costs a request when the user actually opens it, and so one
/// failing tab surfaces its own error instead of blanking the screen.
/// The property id every other provider in this file needs.
///
/// Returns [propertyIdHint] untouched when the caller supplied one. Otherwise
/// it scans the cross-property list (no status filter, one bounded page) for
/// the request and reads the property id off its populated unit. There is no
/// by-id filter on that endpoint, so a request sitting beyond [_scanPageSize]
/// rows is not recoverable — that throws rather than silently rendering the
/// wrong request.
///
/// Copied from [maintenanceRequestPropertyId].
@ProviderFor(maintenanceRequestPropertyId)
const maintenanceRequestPropertyIdProvider =
    MaintenanceRequestPropertyIdFamily();

/// Read providers behind the single maintenance request screen.
///
/// Every detail endpoint is property-scoped, but the route
/// (`/activity/maintenances/:id`) carries only the request id. The board
/// already holds the full record, so it passes `unit.property_id` through as
/// GoRouter `extra` and every provider here takes it as [propertyIdHint].
/// When the hint is absent — a deep link, or a cold start into the route —
/// [maintenanceRequestPropertyId] recovers it from the cross-property list.
///
/// The three tab providers are separate from [maintenanceRequestDetail] so a
/// tab only costs a request when the user actually opens it, and so one
/// failing tab surfaces its own error instead of blanking the screen.
/// The property id every other provider in this file needs.
///
/// Returns [propertyIdHint] untouched when the caller supplied one. Otherwise
/// it scans the cross-property list (no status filter, one bounded page) for
/// the request and reads the property id off its populated unit. There is no
/// by-id filter on that endpoint, so a request sitting beyond [_scanPageSize]
/// rows is not recoverable — that throws rather than silently rendering the
/// wrong request.
///
/// Copied from [maintenanceRequestPropertyId].
class MaintenanceRequestPropertyIdFamily extends Family<AsyncValue<String>> {
  /// Read providers behind the single maintenance request screen.
  ///
  /// Every detail endpoint is property-scoped, but the route
  /// (`/activity/maintenances/:id`) carries only the request id. The board
  /// already holds the full record, so it passes `unit.property_id` through as
  /// GoRouter `extra` and every provider here takes it as [propertyIdHint].
  /// When the hint is absent — a deep link, or a cold start into the route —
  /// [maintenanceRequestPropertyId] recovers it from the cross-property list.
  ///
  /// The three tab providers are separate from [maintenanceRequestDetail] so a
  /// tab only costs a request when the user actually opens it, and so one
  /// failing tab surfaces its own error instead of blanking the screen.
  /// The property id every other provider in this file needs.
  ///
  /// Returns [propertyIdHint] untouched when the caller supplied one. Otherwise
  /// it scans the cross-property list (no status filter, one bounded page) for
  /// the request and reads the property id off its populated unit. There is no
  /// by-id filter on that endpoint, so a request sitting beyond [_scanPageSize]
  /// rows is not recoverable — that throws rather than silently rendering the
  /// wrong request.
  ///
  /// Copied from [maintenanceRequestPropertyId].
  const MaintenanceRequestPropertyIdFamily();

  /// Read providers behind the single maintenance request screen.
  ///
  /// Every detail endpoint is property-scoped, but the route
  /// (`/activity/maintenances/:id`) carries only the request id. The board
  /// already holds the full record, so it passes `unit.property_id` through as
  /// GoRouter `extra` and every provider here takes it as [propertyIdHint].
  /// When the hint is absent — a deep link, or a cold start into the route —
  /// [maintenanceRequestPropertyId] recovers it from the cross-property list.
  ///
  /// The three tab providers are separate from [maintenanceRequestDetail] so a
  /// tab only costs a request when the user actually opens it, and so one
  /// failing tab surfaces its own error instead of blanking the screen.
  /// The property id every other provider in this file needs.
  ///
  /// Returns [propertyIdHint] untouched when the caller supplied one. Otherwise
  /// it scans the cross-property list (no status filter, one bounded page) for
  /// the request and reads the property id off its populated unit. There is no
  /// by-id filter on that endpoint, so a request sitting beyond [_scanPageSize]
  /// rows is not recoverable — that throws rather than silently rendering the
  /// wrong request.
  ///
  /// Copied from [maintenanceRequestPropertyId].
  MaintenanceRequestPropertyIdProvider call(
    String requestId,
    String? propertyIdHint,
  ) {
    return MaintenanceRequestPropertyIdProvider(requestId, propertyIdHint);
  }

  @override
  MaintenanceRequestPropertyIdProvider getProviderOverride(
    covariant MaintenanceRequestPropertyIdProvider provider,
  ) {
    return call(provider.requestId, provider.propertyIdHint);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'maintenanceRequestPropertyIdProvider';
}

/// Read providers behind the single maintenance request screen.
///
/// Every detail endpoint is property-scoped, but the route
/// (`/activity/maintenances/:id`) carries only the request id. The board
/// already holds the full record, so it passes `unit.property_id` through as
/// GoRouter `extra` and every provider here takes it as [propertyIdHint].
/// When the hint is absent — a deep link, or a cold start into the route —
/// [maintenanceRequestPropertyId] recovers it from the cross-property list.
///
/// The three tab providers are separate from [maintenanceRequestDetail] so a
/// tab only costs a request when the user actually opens it, and so one
/// failing tab surfaces its own error instead of blanking the screen.
/// The property id every other provider in this file needs.
///
/// Returns [propertyIdHint] untouched when the caller supplied one. Otherwise
/// it scans the cross-property list (no status filter, one bounded page) for
/// the request and reads the property id off its populated unit. There is no
/// by-id filter on that endpoint, so a request sitting beyond [_scanPageSize]
/// rows is not recoverable — that throws rather than silently rendering the
/// wrong request.
///
/// Copied from [maintenanceRequestPropertyId].
class MaintenanceRequestPropertyIdProvider
    extends AutoDisposeFutureProvider<String> {
  /// Read providers behind the single maintenance request screen.
  ///
  /// Every detail endpoint is property-scoped, but the route
  /// (`/activity/maintenances/:id`) carries only the request id. The board
  /// already holds the full record, so it passes `unit.property_id` through as
  /// GoRouter `extra` and every provider here takes it as [propertyIdHint].
  /// When the hint is absent — a deep link, or a cold start into the route —
  /// [maintenanceRequestPropertyId] recovers it from the cross-property list.
  ///
  /// The three tab providers are separate from [maintenanceRequestDetail] so a
  /// tab only costs a request when the user actually opens it, and so one
  /// failing tab surfaces its own error instead of blanking the screen.
  /// The property id every other provider in this file needs.
  ///
  /// Returns [propertyIdHint] untouched when the caller supplied one. Otherwise
  /// it scans the cross-property list (no status filter, one bounded page) for
  /// the request and reads the property id off its populated unit. There is no
  /// by-id filter on that endpoint, so a request sitting beyond [_scanPageSize]
  /// rows is not recoverable — that throws rather than silently rendering the
  /// wrong request.
  ///
  /// Copied from [maintenanceRequestPropertyId].
  MaintenanceRequestPropertyIdProvider(String requestId, String? propertyIdHint)
    : this._internal(
        (ref) => maintenanceRequestPropertyId(
          ref as MaintenanceRequestPropertyIdRef,
          requestId,
          propertyIdHint,
        ),
        from: maintenanceRequestPropertyIdProvider,
        name: r'maintenanceRequestPropertyIdProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$maintenanceRequestPropertyIdHash,
        dependencies: MaintenanceRequestPropertyIdFamily._dependencies,
        allTransitiveDependencies:
            MaintenanceRequestPropertyIdFamily._allTransitiveDependencies,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      );

  MaintenanceRequestPropertyIdProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.requestId,
    required this.propertyIdHint,
  }) : super.internal();

  final String requestId;
  final String? propertyIdHint;

  @override
  Override overrideWith(
    FutureOr<String> Function(MaintenanceRequestPropertyIdRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MaintenanceRequestPropertyIdProvider._internal(
        (ref) => create(ref as MaintenanceRequestPropertyIdRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<String> createElement() {
    return _MaintenanceRequestPropertyIdProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MaintenanceRequestPropertyIdProvider &&
        other.requestId == requestId &&
        other.propertyIdHint == propertyIdHint;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, requestId.hashCode);
    hash = _SystemHash.combine(hash, propertyIdHint.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MaintenanceRequestPropertyIdRef on AutoDisposeFutureProviderRef<String> {
  /// The parameter `requestId` of this provider.
  String get requestId;

  /// The parameter `propertyIdHint` of this provider.
  String? get propertyIdHint;
}

class _MaintenanceRequestPropertyIdProviderElement
    extends AutoDisposeFutureProviderElement<String>
    with MaintenanceRequestPropertyIdRef {
  _MaintenanceRequestPropertyIdProviderElement(super.provider);

  @override
  String get requestId =>
      (origin as MaintenanceRequestPropertyIdProvider).requestId;
  @override
  String? get propertyIdHint =>
      (origin as MaintenanceRequestPropertyIdProvider).propertyIdHint;
}

String _$maintenanceRequestDetailHash() =>
    r'ea891180cc01ecb742b7a797af090331726d0915';

/// The request itself — hero, attachments, assignments, properties, footer.
///
/// Copied from [maintenanceRequestDetail].
@ProviderFor(maintenanceRequestDetail)
const maintenanceRequestDetailProvider = MaintenanceRequestDetailFamily();

/// The request itself — hero, attachments, assignments, properties, footer.
///
/// Copied from [maintenanceRequestDetail].
class MaintenanceRequestDetailFamily
    extends Family<AsyncValue<MaintenanceRequestModel>> {
  /// The request itself — hero, attachments, assignments, properties, footer.
  ///
  /// Copied from [maintenanceRequestDetail].
  const MaintenanceRequestDetailFamily();

  /// The request itself — hero, attachments, assignments, properties, footer.
  ///
  /// Copied from [maintenanceRequestDetail].
  MaintenanceRequestDetailProvider call(
    String requestId,
    String? propertyIdHint,
  ) {
    return MaintenanceRequestDetailProvider(requestId, propertyIdHint);
  }

  @override
  MaintenanceRequestDetailProvider getProviderOverride(
    covariant MaintenanceRequestDetailProvider provider,
  ) {
    return call(provider.requestId, provider.propertyIdHint);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'maintenanceRequestDetailProvider';
}

/// The request itself — hero, attachments, assignments, properties, footer.
///
/// Copied from [maintenanceRequestDetail].
class MaintenanceRequestDetailProvider
    extends AutoDisposeFutureProvider<MaintenanceRequestModel> {
  /// The request itself — hero, attachments, assignments, properties, footer.
  ///
  /// Copied from [maintenanceRequestDetail].
  MaintenanceRequestDetailProvider(String requestId, String? propertyIdHint)
    : this._internal(
        (ref) => maintenanceRequestDetail(
          ref as MaintenanceRequestDetailRef,
          requestId,
          propertyIdHint,
        ),
        from: maintenanceRequestDetailProvider,
        name: r'maintenanceRequestDetailProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$maintenanceRequestDetailHash,
        dependencies: MaintenanceRequestDetailFamily._dependencies,
        allTransitiveDependencies:
            MaintenanceRequestDetailFamily._allTransitiveDependencies,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      );

  MaintenanceRequestDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.requestId,
    required this.propertyIdHint,
  }) : super.internal();

  final String requestId;
  final String? propertyIdHint;

  @override
  Override overrideWith(
    FutureOr<MaintenanceRequestModel> Function(
      MaintenanceRequestDetailRef provider,
    )
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MaintenanceRequestDetailProvider._internal(
        (ref) => create(ref as MaintenanceRequestDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<MaintenanceRequestModel> createElement() {
    return _MaintenanceRequestDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MaintenanceRequestDetailProvider &&
        other.requestId == requestId &&
        other.propertyIdHint == propertyIdHint;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, requestId.hashCode);
    hash = _SystemHash.combine(hash, propertyIdHint.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MaintenanceRequestDetailRef
    on AutoDisposeFutureProviderRef<MaintenanceRequestModel> {
  /// The parameter `requestId` of this provider.
  String get requestId;

  /// The parameter `propertyIdHint` of this provider.
  String? get propertyIdHint;
}

class _MaintenanceRequestDetailProviderElement
    extends AutoDisposeFutureProviderElement<MaintenanceRequestModel>
    with MaintenanceRequestDetailRef {
  _MaintenanceRequestDetailProviderElement(super.provider);

  @override
  String get requestId =>
      (origin as MaintenanceRequestDetailProvider).requestId;
  @override
  String? get propertyIdHint =>
      (origin as MaintenanceRequestDetailProvider).propertyIdHint;
}

String _$maintenanceRequestActivityLogsHash() =>
    r'b8ac82ef01bafcd898963a117b71f305795df07e';

/// History tab — the request's activity log, newest first.
///
/// Copied from [maintenanceRequestActivityLogs].
@ProviderFor(maintenanceRequestActivityLogs)
const maintenanceRequestActivityLogsProvider =
    MaintenanceRequestActivityLogsFamily();

/// History tab — the request's activity log, newest first.
///
/// Copied from [maintenanceRequestActivityLogs].
class MaintenanceRequestActivityLogsFamily
    extends Family<AsyncValue<List<MaintenanceActivityLogModel>>> {
  /// History tab — the request's activity log, newest first.
  ///
  /// Copied from [maintenanceRequestActivityLogs].
  const MaintenanceRequestActivityLogsFamily();

  /// History tab — the request's activity log, newest first.
  ///
  /// Copied from [maintenanceRequestActivityLogs].
  MaintenanceRequestActivityLogsProvider call(
    String requestId,
    String? propertyIdHint,
  ) {
    return MaintenanceRequestActivityLogsProvider(requestId, propertyIdHint);
  }

  @override
  MaintenanceRequestActivityLogsProvider getProviderOverride(
    covariant MaintenanceRequestActivityLogsProvider provider,
  ) {
    return call(provider.requestId, provider.propertyIdHint);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'maintenanceRequestActivityLogsProvider';
}

/// History tab — the request's activity log, newest first.
///
/// Copied from [maintenanceRequestActivityLogs].
class MaintenanceRequestActivityLogsProvider
    extends AutoDisposeFutureProvider<List<MaintenanceActivityLogModel>> {
  /// History tab — the request's activity log, newest first.
  ///
  /// Copied from [maintenanceRequestActivityLogs].
  MaintenanceRequestActivityLogsProvider(
    String requestId,
    String? propertyIdHint,
  ) : this._internal(
        (ref) => maintenanceRequestActivityLogs(
          ref as MaintenanceRequestActivityLogsRef,
          requestId,
          propertyIdHint,
        ),
        from: maintenanceRequestActivityLogsProvider,
        name: r'maintenanceRequestActivityLogsProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$maintenanceRequestActivityLogsHash,
        dependencies: MaintenanceRequestActivityLogsFamily._dependencies,
        allTransitiveDependencies:
            MaintenanceRequestActivityLogsFamily._allTransitiveDependencies,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      );

  MaintenanceRequestActivityLogsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.requestId,
    required this.propertyIdHint,
  }) : super.internal();

  final String requestId;
  final String? propertyIdHint;

  @override
  Override overrideWith(
    FutureOr<List<MaintenanceActivityLogModel>> Function(
      MaintenanceRequestActivityLogsRef provider,
    )
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MaintenanceRequestActivityLogsProvider._internal(
        (ref) => create(ref as MaintenanceRequestActivityLogsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<MaintenanceActivityLogModel>>
  createElement() {
    return _MaintenanceRequestActivityLogsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MaintenanceRequestActivityLogsProvider &&
        other.requestId == requestId &&
        other.propertyIdHint == propertyIdHint;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, requestId.hashCode);
    hash = _SystemHash.combine(hash, propertyIdHint.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MaintenanceRequestActivityLogsRef
    on AutoDisposeFutureProviderRef<List<MaintenanceActivityLogModel>> {
  /// The parameter `requestId` of this provider.
  String get requestId;

  /// The parameter `propertyIdHint` of this provider.
  String? get propertyIdHint;
}

class _MaintenanceRequestActivityLogsProviderElement
    extends AutoDisposeFutureProviderElement<List<MaintenanceActivityLogModel>>
    with MaintenanceRequestActivityLogsRef {
  _MaintenanceRequestActivityLogsProviderElement(super.provider);

  @override
  String get requestId =>
      (origin as MaintenanceRequestActivityLogsProvider).requestId;
  @override
  String? get propertyIdHint =>
      (origin as MaintenanceRequestActivityLogsProvider).propertyIdHint;
}

String _$maintenanceRequestCommentsHash() =>
    r'75aee6b19670063e9832ac48dce266dd91f0d59c';

/// Comments tab.
///
/// Copied from [maintenanceRequestComments].
@ProviderFor(maintenanceRequestComments)
const maintenanceRequestCommentsProvider = MaintenanceRequestCommentsFamily();

/// Comments tab.
///
/// Copied from [maintenanceRequestComments].
class MaintenanceRequestCommentsFamily
    extends Family<AsyncValue<List<MaintenanceCommentModel>>> {
  /// Comments tab.
  ///
  /// Copied from [maintenanceRequestComments].
  const MaintenanceRequestCommentsFamily();

  /// Comments tab.
  ///
  /// Copied from [maintenanceRequestComments].
  MaintenanceRequestCommentsProvider call(
    String requestId,
    String? propertyIdHint,
  ) {
    return MaintenanceRequestCommentsProvider(requestId, propertyIdHint);
  }

  @override
  MaintenanceRequestCommentsProvider getProviderOverride(
    covariant MaintenanceRequestCommentsProvider provider,
  ) {
    return call(provider.requestId, provider.propertyIdHint);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'maintenanceRequestCommentsProvider';
}

/// Comments tab.
///
/// Copied from [maintenanceRequestComments].
class MaintenanceRequestCommentsProvider
    extends AutoDisposeFutureProvider<List<MaintenanceCommentModel>> {
  /// Comments tab.
  ///
  /// Copied from [maintenanceRequestComments].
  MaintenanceRequestCommentsProvider(String requestId, String? propertyIdHint)
    : this._internal(
        (ref) => maintenanceRequestComments(
          ref as MaintenanceRequestCommentsRef,
          requestId,
          propertyIdHint,
        ),
        from: maintenanceRequestCommentsProvider,
        name: r'maintenanceRequestCommentsProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$maintenanceRequestCommentsHash,
        dependencies: MaintenanceRequestCommentsFamily._dependencies,
        allTransitiveDependencies:
            MaintenanceRequestCommentsFamily._allTransitiveDependencies,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      );

  MaintenanceRequestCommentsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.requestId,
    required this.propertyIdHint,
  }) : super.internal();

  final String requestId;
  final String? propertyIdHint;

  @override
  Override overrideWith(
    FutureOr<List<MaintenanceCommentModel>> Function(
      MaintenanceRequestCommentsRef provider,
    )
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MaintenanceRequestCommentsProvider._internal(
        (ref) => create(ref as MaintenanceRequestCommentsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<MaintenanceCommentModel>>
  createElement() {
    return _MaintenanceRequestCommentsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MaintenanceRequestCommentsProvider &&
        other.requestId == requestId &&
        other.propertyIdHint == propertyIdHint;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, requestId.hashCode);
    hash = _SystemHash.combine(hash, propertyIdHint.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MaintenanceRequestCommentsRef
    on AutoDisposeFutureProviderRef<List<MaintenanceCommentModel>> {
  /// The parameter `requestId` of this provider.
  String get requestId;

  /// The parameter `propertyIdHint` of this provider.
  String? get propertyIdHint;
}

class _MaintenanceRequestCommentsProviderElement
    extends AutoDisposeFutureProviderElement<List<MaintenanceCommentModel>>
    with MaintenanceRequestCommentsRef {
  _MaintenanceRequestCommentsProviderElement(super.provider);

  @override
  String get requestId =>
      (origin as MaintenanceRequestCommentsProvider).requestId;
  @override
  String? get propertyIdHint =>
      (origin as MaintenanceRequestCommentsProvider).propertyIdHint;
}

String _$maintenanceRequestExpensesHash() =>
    r'fa5f971d37c38189e42b6993828137e82f8de30d';

/// Expenses tab.
///
/// Copied from [maintenanceRequestExpenses].
@ProviderFor(maintenanceRequestExpenses)
const maintenanceRequestExpensesProvider = MaintenanceRequestExpensesFamily();

/// Expenses tab.
///
/// Copied from [maintenanceRequestExpenses].
class MaintenanceRequestExpensesFamily
    extends Family<AsyncValue<List<MaintenanceExpenseModel>>> {
  /// Expenses tab.
  ///
  /// Copied from [maintenanceRequestExpenses].
  const MaintenanceRequestExpensesFamily();

  /// Expenses tab.
  ///
  /// Copied from [maintenanceRequestExpenses].
  MaintenanceRequestExpensesProvider call(
    String requestId,
    String? propertyIdHint,
  ) {
    return MaintenanceRequestExpensesProvider(requestId, propertyIdHint);
  }

  @override
  MaintenanceRequestExpensesProvider getProviderOverride(
    covariant MaintenanceRequestExpensesProvider provider,
  ) {
    return call(provider.requestId, provider.propertyIdHint);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'maintenanceRequestExpensesProvider';
}

/// Expenses tab.
///
/// Copied from [maintenanceRequestExpenses].
class MaintenanceRequestExpensesProvider
    extends AutoDisposeFutureProvider<List<MaintenanceExpenseModel>> {
  /// Expenses tab.
  ///
  /// Copied from [maintenanceRequestExpenses].
  MaintenanceRequestExpensesProvider(String requestId, String? propertyIdHint)
    : this._internal(
        (ref) => maintenanceRequestExpenses(
          ref as MaintenanceRequestExpensesRef,
          requestId,
          propertyIdHint,
        ),
        from: maintenanceRequestExpensesProvider,
        name: r'maintenanceRequestExpensesProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$maintenanceRequestExpensesHash,
        dependencies: MaintenanceRequestExpensesFamily._dependencies,
        allTransitiveDependencies:
            MaintenanceRequestExpensesFamily._allTransitiveDependencies,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      );

  MaintenanceRequestExpensesProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.requestId,
    required this.propertyIdHint,
  }) : super.internal();

  final String requestId;
  final String? propertyIdHint;

  @override
  Override overrideWith(
    FutureOr<List<MaintenanceExpenseModel>> Function(
      MaintenanceRequestExpensesRef provider,
    )
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MaintenanceRequestExpensesProvider._internal(
        (ref) => create(ref as MaintenanceRequestExpensesRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        requestId: requestId,
        propertyIdHint: propertyIdHint,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<MaintenanceExpenseModel>>
  createElement() {
    return _MaintenanceRequestExpensesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MaintenanceRequestExpensesProvider &&
        other.requestId == requestId &&
        other.propertyIdHint == propertyIdHint;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, requestId.hashCode);
    hash = _SystemHash.combine(hash, propertyIdHint.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MaintenanceRequestExpensesRef
    on AutoDisposeFutureProviderRef<List<MaintenanceExpenseModel>> {
  /// The parameter `requestId` of this provider.
  String get requestId;

  /// The parameter `propertyIdHint` of this provider.
  String? get propertyIdHint;
}

class _MaintenanceRequestExpensesProviderElement
    extends AutoDisposeFutureProviderElement<List<MaintenanceExpenseModel>>
    with MaintenanceRequestExpensesRef {
  _MaintenanceRequestExpensesProviderElement(super.provider);

  @override
  String get requestId =>
      (origin as MaintenanceRequestExpensesProvider).requestId;
  @override
  String? get propertyIdHint =>
      (origin as MaintenanceRequestExpensesProvider).propertyIdHint;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
