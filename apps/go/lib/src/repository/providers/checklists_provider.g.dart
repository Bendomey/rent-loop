// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'checklists_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$checklistsHash() => r'bbddee8c04bce8b53fda341f16a4bf06c8f80ec8';

/// Fetches all checklists (SUBMITTED/ACKNOWLEDGED/DISPUTED) for the active lease.
///
/// Copied from [checklists].
@ProviderFor(checklists)
final checklistsProvider = FutureProvider<List<LeaseChecklistModel>>.internal(
  checklists,
  name: r'checklistsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$checklistsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ChecklistsRef = FutureProviderRef<List<LeaseChecklistModel>>;
String _$latestSubmittedChecklistHash() =>
    r'1e71034d13cbfe4373d1e076f73160170b2c8925';

/// Fetches only SUBMITTED checklists for the home banner and badge count.
///
/// Copied from [latestSubmittedChecklist].
@ProviderFor(latestSubmittedChecklist)
final latestSubmittedChecklistProvider =
    FutureProvider<LeaseChecklistModel?>.internal(
  latestSubmittedChecklist,
  name: r'latestSubmittedChecklistProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$latestSubmittedChecklistHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef LatestSubmittedChecklistRef = FutureProviderRef<LeaseChecklistModel?>;
String _$singleChecklistHash() => r'25ddb14b285d3e3788cf3763cf10f6e38444f8a9';

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

/// Fetches a single checklist with items and acknowledgments populated.
///
/// Copied from [singleChecklist].
@ProviderFor(singleChecklist)
const singleChecklistProvider = SingleChecklistFamily();

/// Fetches a single checklist with items and acknowledgments populated.
///
/// Copied from [singleChecklist].
class SingleChecklistFamily extends Family<AsyncValue<LeaseChecklistModel>> {
  /// Fetches a single checklist with items and acknowledgments populated.
  ///
  /// Copied from [singleChecklist].
  const SingleChecklistFamily();

  /// Fetches a single checklist with items and acknowledgments populated.
  ///
  /// Copied from [singleChecklist].
  SingleChecklistProvider call(
    String checklistId,
  ) {
    return SingleChecklistProvider(
      checklistId,
    );
  }

  @override
  SingleChecklistProvider getProviderOverride(
    covariant SingleChecklistProvider provider,
  ) {
    return call(
      provider.checklistId,
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
  String? get name => r'singleChecklistProvider';
}

/// Fetches a single checklist with items and acknowledgments populated.
///
/// Copied from [singleChecklist].
class SingleChecklistProvider
    extends AutoDisposeFutureProvider<LeaseChecklistModel> {
  /// Fetches a single checklist with items and acknowledgments populated.
  ///
  /// Copied from [singleChecklist].
  SingleChecklistProvider(
    String checklistId,
  ) : this._internal(
          (ref) => singleChecklist(
            ref as SingleChecklistRef,
            checklistId,
          ),
          from: singleChecklistProvider,
          name: r'singleChecklistProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$singleChecklistHash,
          dependencies: SingleChecklistFamily._dependencies,
          allTransitiveDependencies:
              SingleChecklistFamily._allTransitiveDependencies,
          checklistId: checklistId,
        );

  SingleChecklistProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.checklistId,
  }) : super.internal();

  final String checklistId;

  @override
  Override overrideWith(
    FutureOr<LeaseChecklistModel> Function(SingleChecklistRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: SingleChecklistProvider._internal(
        (ref) => create(ref as SingleChecklistRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        checklistId: checklistId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<LeaseChecklistModel> createElement() {
    return _SingleChecklistProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is SingleChecklistProvider && other.checklistId == checklistId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, checklistId.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin SingleChecklistRef on AutoDisposeFutureProviderRef<LeaseChecklistModel> {
  /// The parameter `checklistId` of this provider.
  String get checklistId;
}

class _SingleChecklistProviderElement
    extends AutoDisposeFutureProviderElement<LeaseChecklistModel>
    with SingleChecklistRef {
  _SingleChecklistProviderElement(super.provider);

  @override
  String get checklistId => (origin as SingleChecklistProvider).checklistId;
}

String _$checklistTotalNotifierHash() =>
    r'c3d317f0dc21a2e7a3c3a28cfc291587c0690305';

/// Holds the count of SUBMITTED checklists needing tenant review.
///
/// Copied from [ChecklistTotalNotifier].
@ProviderFor(ChecklistTotalNotifier)
final checklistTotalNotifierProvider =
    NotifierProvider<ChecklistTotalNotifier, int>.internal(
  ChecklistTotalNotifier.new,
  name: r'checklistTotalNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$checklistTotalNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ChecklistTotalNotifier = Notifier<int>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
